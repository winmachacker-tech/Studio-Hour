/**
 * Edge Function: studio-hour-guide
 *
 * Danielle's private planning and coaching companion.
 * Verifies caller JWT, enforces daily usage limits, calls Claude,
 * persists conversation history, and returns a guide response.
 *
 * Trust boundary:
 *   - ANTHROPIC_API_KEY lives only in this function's secrets.
 *   - Callers must present a valid Supabase auth bearer token.
 *   - Message content is never logged.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ── Configuration ─────────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_MAX_TOKENS = 600;
const DAILY_LIMIT = 30;

// ── System prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Studio Hour Guide — Danielle's private planning and coaching companion inside her creative studio app.

Personality:
- Warm, perceptive, and studio-aware. You know her world: murals, commissions, content creation, kids' schedule, leads, and the rhythms of an independent artist's week.
- Never sound like a generic AI chatbot. Speak like a trusted creative friend who has been in the room all week.
- Keep responses concise (2-4 sentences for quick replies, up to a short paragraph for planning).
- Use her project names, lead names, and real context when available.
- Emotionally intelligent: if energy is low, don't push. If she's overwhelmed, simplify. If she's energized, match her momentum.
- Use "you" not "Danielle" in most replies.
- No bullet-point walls. Prefer flowing sentences with natural rhythm.
- Maximum 3-4 action items when planning. Never overwhelm.

Tone palette:
- Planning/protected time → grounded, clear, confident
- Low energy → gentle, permissive, warm
- Follow-up/leads → encouraging but not pushy
- Content/ideas → playful, specific, creative
- Emotional support → quiet, present, no advice unless asked

Source awareness:
- When the schedule comes from Google Calendar (scheduleSource "google"), those are real, fixed commitments. Plan around them, not through them.
- Projects, ideas, and rituals in the context may include starter examples that ship with the app. Reference them gently — "it looks like you have…" or "if that's still on your list…" — not "your cobalt mural is ready to go." Only speak with certainty about things the user confirms or clearly created.
- Never invent deadlines, urgency, or readiness that the context doesn't state.
- When planning a day, anchor on fixed calendar blocks first, then suggest one or two realistic moves for the open time. Don't fill every gap.`;

// ── Context builder ───────────────────────────────────────────────────

interface GuideContext {
  checkIn?: {
    mood: number;
    energy: number;
    focus: number;
    overwhelm: number;
    completed: boolean;
  };
  scheduleBlocks?: { time: string; title: string; type: string }[];
  scheduleSource?: string;
  rituals?: { text: string; done: boolean }[];
  openWorkItems?: {
    title: string;
    status: string;
    energy: string;
    group: string;
  }[];
  ideas?: { title: string; status: string; platform: string }[];
}

function buildSystemPrompt(context: GuideContext): string {
  const parts: string[] = [];

  if (context.checkIn?.completed) {
    const c = context.checkIn;
    parts.push(
      `Today's check-in: mood ${c.mood}/5, energy ${c.energy}/5, focus ${c.focus}/5, overwhelm ${c.overwhelm}/5.`
    );
  }

  if (context.scheduleBlocks?.length) {
    const schedule = context.scheduleBlocks
      .map((b) => `${b.time} — ${b.title} (${b.type})`)
      .join("; ");
    parts.push(`Today's schedule: ${schedule}`);
    if (context.scheduleSource === "google") {
      parts.push(
        "This schedule is from the user's real Google Calendar. Treat these as fixed commitments and help plan around them."
      );
    }
  }

  if (context.rituals?.length) {
    const done = context.rituals.filter((r) => r.done).length;
    parts.push(`Rituals: ${done}/${context.rituals.length} complete`);
  }

  if (context.openWorkItems?.length) {
    const items = context.openWorkItems
      .slice(0, 6)
      .map((w) => `"${w.title}" (${w.status}, ${w.energy})`)
      .join("; ");
    parts.push(`Open projects: ${items}`);
  }

  if (context.ideas?.length) {
    const recent = context.ideas
      .slice(0, 4)
      .map((i) => `"${i.title}" (${i.status}, ${i.platform})`)
      .join("; ");
    parts.push(`Recent ideas: ${recent}`);
  }

  const contextBlock =
    parts.length > 0
      ? `\n\nCurrent studio context:\n${parts.join("\n")}`
      : "";

  return SYSTEM_PROMPT + contextBlock;
}

// ── Suggestions ───────────────────────────────────────────────────────

function generateSuggestions(message: string): string[] | undefined {
  const lower = message.toLowerCase();
  if (lower.includes("plan")) {
    return ["What needs follow-up?", "Adjust for low energy", "Add content time"];
  }
  if (lower.includes("low-energy") || lower.includes("tired") || lower.includes("gentle")) {
    return ["What's the easiest thing to finish?", "Help me write a follow-up message", "Just talk to me"];
  }
  if (lower.includes("content") || lower.includes("post") || lower.includes("idea")) {
    return ["Write a caption draft", "What should I post this week?", "Turn another idea into a post"];
  }
  return undefined;
}

// ── HTTP helpers ──────────────────────────────────────────────────────

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

// ── Caller auth (same pattern as Bound) ──────────────────────────────

async function verifyCaller(
  authHeader: string
): Promise<{ userId: string } | null> {
  if (!authHeader.startsWith("Bearer ")) return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return null;

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: anonKey,
    },
  });
  if (!res.ok) return null;
  const caller = (await res.json().catch(() => null)) as {
    id?: string;
  } | null;
  if (!caller || typeof caller.id !== "string") return null;
  return { userId: caller.id };
}

// ── Rate limiting via RPC ────────────────────────────────────────────

async function checkUsage(
  userId: string,
  dbg?: DebugInfo
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data, error } = await admin.rpc("use_guide_message", {
    p_user_id: userId,
    p_limit: DAILY_LIMIT,
  });

  if (error || !data) {
    const msg = error?.message ?? "no data returned";
    if (dbg) dbg.rpcError = msg;
    console.error(`[studio-hour-guide] rpc_error use_guide_message: ${msg}`);
    return { allowed: true, used: 0, limit: DAILY_LIMIT };
  }

  return {
    allowed: data.allowed,
    used: data.messages_used,
    limit: data.daily_limit,
  };
}

// ── Conversation persistence ─────────────────────────────────────────

async function getOrCreateConversation(
  userId: string,
  conversationId?: string,
  dbg?: DebugInfo
): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  if (conversationId) {
    const { data } = await admin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return data.id;
  }

  const { data, error } = await admin
    .from("conversations")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !data) {
    const msg = error?.message ?? "no data";
    if (dbg) dbg.conversationError = msg;
    console.error(`[studio-hour-guide] conversation_insert_failed: ${msg}`);
    return null;
  }
  return data.id;
}

async function getRecentMessages(
  conversationId: string,
  limit = 10
): Promise<{ role: string; content: string }[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data } = await admin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return (data ?? []) as { role: string; content: string }[];
}

// ── Anthropic call ───────────────────────────────────────────────────

interface AnthropicMessage {
  role: string;
  content: string;
}

interface DebugInfo {
  stage: string;
  model?: string;
  hasAnthropicKey?: boolean;
  anthropicStatus?: number;
  anthropicErrorText?: string;
  rpcError?: string;
  conversationError?: string;
  messageInsertError?: string;
}

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: AnthropicMessage[],
  dbg: DebugInfo
): Promise<string | null> {
  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514";
  dbg.model = model;
  dbg.stage = "anthropic_call";
  console.log(`[studio-hour-guide] calling anthropic model=${model} messages=${messages.length}`);

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: systemPrompt,
      messages,
    }),
  });

  dbg.anthropicStatus = res.status;

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "(unreadable)");
    dbg.anthropicErrorText = errorBody.slice(0, 500);
    dbg.stage = "anthropic_http_error";
    console.error(`[studio-hour-guide] anthropic_http_error status=${res.status} body=${errorBody}`);
    return null;
  }

  const payload = (await res.json().catch(() => null)) as {
    content?: Array<{ type: string; text?: string }>;
  } | null;

  if (!payload || !Array.isArray(payload.content)) {
    dbg.stage = "anthropic_response_malformed";
    console.error(`[studio-hour-guide] anthropic_response_malformed payload_keys=${payload ? Object.keys(payload).join(",") : "null"}`);
    return null;
  }

  const text = payload.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("")
    .trim();

  if (!text) {
    dbg.stage = "anthropic_response_empty";
    console.error("[studio-hour-guide] anthropic_response_empty");
    return null;
  }

  dbg.stage = "success";
  return text;
}

// ── Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const dbg: DebugInfo = { stage: "init" };

  // Auth
  const authHeader =
    req.headers.get("authorization") ??
    req.headers.get("Authorization") ??
    "";
  const caller = await verifyCaller(authHeader);
  if (!caller) {
    return json({ error: "Sign in to use the Guide." }, 401);
  }

  // API key
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  dbg.hasAnthropicKey = !!apiKey;
  if (!apiKey) {
    dbg.stage = "missing_api_key";
    console.error("[studio-hour-guide] ANTHROPIC_API_KEY not configured");
    return json({ error: "Guide is not configured yet." }, 500);
  }

  // Parse body
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return json({ error: "Message is required." }, 400);
  }

  const wantDebug = body.debug === true;
  const context = (body.context ?? {}) as GuideContext;
  const requestConversationId =
    typeof body.conversationId === "string" ? body.conversationId : undefined;

  // Rate limit
  dbg.stage = "rate_limit";
  const usage = await checkUsage(caller.userId, dbg);
  if (!usage.allowed) {
    return json(
      {
        error:
          "You've reached today's limit. The Guide will be ready again tomorrow morning.",
        daily_limit: usage.limit,
        messages_used: usage.used,
      },
      429
    );
  }

  // Conversation
  dbg.stage = "conversation";
  const conversationId = await getOrCreateConversation(
    caller.userId,
    requestConversationId,
    dbg
  );
  if (!conversationId) {
    dbg.stage = "conversation_failed";
    dbg.conversationError = "insert returned null";
    const result: Record<string, unknown> = { error: "Could not create conversation." };
    if (wantDebug) result.debug = dbg;
    return json(result, 500);
  }

  // Save user message
  dbg.stage = "save_user_message";
  {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { error: msgErr } = await admin
      .from("messages")
      .insert({ conversation_id: conversationId, role: "user", content: message });
    if (msgErr) {
      dbg.messageInsertError = msgErr.message;
      console.error(`[studio-hour-guide] message_insert_failed role=user: ${msgErr.message}`);
    }
  }

  // Build messages array: prior history + current user message last
  dbg.stage = "fetch_history";
  const recentMessages = await getRecentMessages(conversationId);

  // Drop the just-saved user message from the tail so we can re-append it
  // as the guaranteed final entry. This prevents assistant-last ordering.
  let history = recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  if (
    history.length > 0 &&
    history[history.length - 1].role === "user" &&
    history[history.length - 1].content === message
  ) {
    history = history.slice(0, -1);
  }

  // Trim any trailing assistant messages from history
  while (
    history.length > 0 &&
    history[history.length - 1].role === "assistant"
  ) {
    history.pop();
  }

  // Re-append current user message as the final message
  const claudeMessages: AnthropicMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

  // Build system prompt with studio context
  const systemPrompt = buildSystemPrompt(context);

  // Call Claude
  let content: string | null = null;
  try {
    content = await callClaude(apiKey, systemPrompt, claudeMessages, dbg);
  } catch (e) {
    dbg.stage = "claude_exception";
    dbg.anthropicErrorText = e instanceof Error ? e.message : String(e);
    console.error(
      `[studio-hour-guide] claude_exception kind=${e instanceof Error ? e.name : "unknown"} message=${e instanceof Error ? e.message : String(e)}`
    );
  }

  if (!content) {
    console.error("[studio-hour-guide] falling_back_to_default content=null");
    content =
      "I couldn't connect just now. Try again in a moment — I'm not going anywhere.";
  }

  // Save assistant response
  {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { error: saveErr } = await admin
      .from("messages")
      .insert({ conversation_id: conversationId, role: "assistant", content });
    if (saveErr) {
      console.error(`[studio-hour-guide] message_insert_failed role=assistant: ${saveErr.message}`);
    }
  }

  const result: Record<string, unknown> = {
    content,
    conversationId,
    suggestions: generateSuggestions(message),
    createdAt: new Date().toISOString(),
  };
  if (wantDebug) result.debug = dbg;

  return json(result);
});
