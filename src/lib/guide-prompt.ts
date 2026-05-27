/**
 * Server-only prompt builder for the Studio Hour Guide.
 * This file must never be imported from client components.
 *
 * When the real Anthropic integration is wired in,
 * buildGuidePrompt() returns the system + user messages
 * for the Claude API call.
 */

export interface GuideContext {
  checkIn?: {
    mood: number;
    energy: number;
    focus: number;
    overwhelm: number;
    headline: string;
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
  recentGuideHistory?: { role: string; content: string }[];
}

const SYSTEM_PROMPT = `You are the Studio Hour Guide — Danielle's private planning and coaching companion inside her creative studio app.

Personality:
- Warm, perceptive, and studio-aware. You know her world: murals, commissions, content creation, kids' schedule, leads, and the rhythms of an independent artist's week.
- Never sound like a generic AI chatbot. Speak like a trusted creative friend who has been in the room all week.
- Keep responses concise (2-4 sentences for quick replies, up to a short paragraph for planning).
- Use her project names, lead names, and real context when available.
- Emotionally intelligent: if energy is low, don't push. If she's overwhelmed, simplify. If she's energized, match her momentum.
- Use "you" not "Danielle" in most replies.
- No bullet-point walls. Prefer flowing sentences with natural rhythm.

Tone palette:
- Planning/protected time → grounded, clear, confident
- Low energy → gentle, permissive, warm
- Follow-up/leads → encouraging but not pushy
- Content/ideas → playful, specific, creative
- Emotional support → quiet, present, no advice unless asked`;

export function buildGuidePrompt(
  userMessage: string,
  context: GuideContext
): { system: string; userMessage: string } {
  const contextParts: string[] = [];

  if (context.checkIn?.completed) {
    const c = context.checkIn;
    contextParts.push(
      `Today's check-in: mood ${c.mood}/5, energy ${c.energy}/5, focus ${c.focus}/5, overwhelm ${c.overwhelm}/5. Headline: "${c.headline}"`
    );
  }

  if (context.scheduleBlocks?.length) {
    const schedule = context.scheduleBlocks
      .map((b) => `${b.time} — ${b.title} (${b.type})`)
      .join("; ");
    contextParts.push(`Today's schedule: ${schedule}`);
  }

  if (context.rituals?.length) {
    const done = context.rituals.filter((r) => r.done).length;
    contextParts.push(
      `Rituals: ${done}/${context.rituals.length} complete`
    );
  }

  if (context.openWorkItems?.length) {
    const items = context.openWorkItems
      .slice(0, 6)
      .map((w) => `"${w.title}" (${w.status}, ${w.energy})`)
      .join("; ");
    contextParts.push(`Open work: ${items}`);
  }

  if (context.ideas?.length) {
    const recent = context.ideas
      .slice(0, 4)
      .map((i) => `"${i.title}" (${i.status}, ${i.platform})`)
      .join("; ");
    contextParts.push(`Recent ideas: ${recent}`);
  }

  const contextBlock =
    contextParts.length > 0
      ? `\n\nCurrent studio context:\n${contextParts.join("\n")}`
      : "";

  return {
    system: SYSTEM_PROMPT + contextBlock,
    userMessage,
  };
}
