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
const ANTHROPIC_MODEL = "claude-sonnet-4-6";
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
- Emotional support → quiet, present, no advice unless asked`;

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
    parts.push(`Open work: ${items}`);
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
    return ["What about the mural leads?", "Adjust for low energy", "Add content time"];
  }
  if (lower.includes("low-energy") || lower.includes("tired") || lower.includes("gentle")) {
    return ["What's the easiest thing to finish?", "Help me reply to Maya", "Just talk to me"];
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
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data, error } = await admin.rpc("use_guide_message", {
    p_user_id: userId,
    p_limit: DAILY_LIMIT,
  });

  if (error || !data) {
    // RPC failed — allow but don't track (fail open for usability)
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
  conversationId?: string
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

  if (error || !data) return null;
  return data.id;
}

async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  await admin
    .from("messages")
    .insert({ conversation_id: conversationId, role, content });
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

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: AnthropicMessage[]
): Promise<string | null> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) return null;

  const payload = (await res.json().catch(() => null)) as {
    content?: Array<{ type: string; text?: string }>;
  } | null;

  if (!payload || !Array.isArray(payload.content)) return null;

  return (
    payload.content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("")
      .trim() || null
  );
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
  if (!apiKey) {
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

  const context = (body.context ?? {}) as GuideContext;
  const requestConversationId =
    typeof body.conversationId === "string" ? body.conversationId : undefined;

  // Rate limit
  const usage = await checkUsage(caller.userId);
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
  const conversationId = await getOrCreateConversation(
    caller.userId,
    requestConversationId
  );
  if (!conversationId) {
    return json({ error: "Could not create conversation." }, 500);
  }

  // Save user message
  await saveMessage(conversationId, "user", message);

  // Build messages array with recent history
  const recentMessages = await getRecentMessages(conversationId);
  const claudeMessages: AnthropicMessage[] = recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Build system prompt with studio context
  const systemPrompt = buildSystemPrompt(context);

  // Call Claude
  let content: string | null = null;
  try {
    content = await callClaude(apiKey, systemPrompt, claudeMessages);
  } catch (e) {
    console.error(
      `[studio-hour-guide] claude_error kind=${e instanceof Error ? e.name : "unknown"}`
    );
  }

  if (!content) {
    content =
      "I couldn't connect just now. Try again in a moment — I'm not going anywhere.";
  }

  // Save assistant response
  await saveMessage(conversationId, "assistant", content);

  return json({
    content,
    conversationId,
    suggestions: generateSuggestions(message),
    createdAt: new Date().toISOString(),
  });
});
