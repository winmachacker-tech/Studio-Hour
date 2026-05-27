import { buildGuidePrompt, type GuideContext } from "@/lib/guide-prompt";

export async function POST(request: Request) {
  const body = await request.json();
  const { message, context } = body as {
    message: string;
    context?: GuideContext;
  };

  if (!message || typeof message !== "string") {
    return Response.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  // Build the prompt that would go to Claude
  const prompt = buildGuidePrompt(message, context ?? {});

  // TODO: Replace mock with real Claude API call
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const response = await anthropic.messages.create({
  //   model: "claude-sonnet-4-6",
  //   max_tokens: 600,
  //   system: prompt.system,
  //   messages: [{ role: "user", content: prompt.userMessage }],
  // });

  const content = generateMockResponse(message, context);

  return Response.json({
    content,
    suggestions: generateSuggestions(message),
    createdAt: new Date().toISOString(),
  });
}

function generateMockResponse(
  message: string,
  context?: GuideContext
): string {
  const lower = message.toLowerCase();
  const energy = context?.checkIn?.energy ?? 3;
  const hasSchedule = (context?.scheduleBlocks?.length ?? 0) > 0;

  if (lower.includes("plan my day") || lower.includes("plan the day")) {
    if (energy <= 2) {
      return "It's a gentle day — and that's fine. Start with the workshop deck since you're already halfway through it. If you have a window after lunch, the Maya reply is short and warm — just a few sentences. Everything else can wait until tomorrow.";
    }
    if (hasSchedule) {
      const protectedBlock = context?.scheduleBlocks?.find(
        (b) => b.type === "protected"
      );
      if (protectedBlock) {
        return `Your protected time is ${protectedBlock.time} — that's your cobalt mural window. Before that, knock out the tote art file for the printer. After protected hours, the workshop deck only needs four more slides. A focused day with real progress built in.`;
      }
    }
    return "Three things feel right today: finish the tote art file for the printer, spend your protected hours on the cobalt mural sketch, and draft a short reply to Maya. That's a full day. Anything else is extra.";
  }

  if (lower.includes("choose") || lower.includes("what to work on") || lower.includes("what should i")) {
    if (energy >= 4) {
      return "Your energy is up — use it. The cobalt mural sketch needs high focus and you're 40% through. That's the thing that moves the most if you show up fully. The tote file is also ready to finish if you want a quick win first.";
    }
    return "The workshop deck is the gentlest forward motion right now — eight of twelve slides are drafted, and the rest are light. If that feels like too much, the Maya reply is five minutes and clears mental space.";
  }

  if (lower.includes("low-energy") || lower.includes("low energy") || lower.includes("tired") || lower.includes("gentle")) {
    return "Low-energy days still count. Here's what fits: reply to Maya — it's three sentences and she'll appreciate the warmth. If you want to touch the studio, pull up the workshop deck and do one slide. That's enough. The big things will be there tomorrow.";
  }

  if (lower.includes("post") || lower.includes("content") || lower.includes("idea into")) {
    const draftIdeas = context?.ideas?.filter((i) => i.status === "draft");
    if (draftIdeas?.length) {
      const idea = draftIdeas[0];
      return `"${idea.title}" — that one's ready to shape. For a TikTok, keep the voiceover slow and personal. Open with the pour, let the sound carry, and close with one honest line about why this color matters to you. Sixty seconds, no transitions needed.`;
    }
    return "Pick the idea that made you feel something when you wrote it down. That's the one your audience will feel too. Start with a rough voiceover — just talk through it once on your phone. Don't edit yet, just capture.";
  }

  if (lower.includes("mural") || lower.includes("lead") || lower.includes("follow up") || lower.includes("maya") || lower.includes("bryant")) {
    return "Maya wrote six days ago — a warm, short reply today is perfect. Something like: \"Hi Maya — still thinking about your space. I'd love to come see the wall this week if you're open to it.\" That's all it takes. Keep it human.";
  }

  if (lower.includes("overwhelm") || lower.includes("too much") || lower.includes("stressed") || lower.includes("anxious")) {
    return "Take a breath. You don't have to hold all of it right now. Pick the one thing that would give you the most relief to have done — just that one thing. The rest of the list will still be here, and it's not going anywhere bad. You're further along than it feels.";
  }

  return "I'm here. Tell me what's weighing on you, or what you'd like to move forward — and I'll help you shape it into something manageable.";
}

function generateSuggestions(message: string): string[] | undefined {
  const lower = message.toLowerCase();

  if (lower.includes("plan")) {
    return [
      "What about the mural leads?",
      "Adjust for low energy",
      "Add content time",
    ];
  }

  if (lower.includes("low-energy") || lower.includes("tired") || lower.includes("gentle")) {
    return [
      "What's the easiest thing to finish?",
      "Help me reply to Maya",
      "Just talk to me",
    ];
  }

  if (lower.includes("content") || lower.includes("post") || lower.includes("idea")) {
    return [
      "Write a caption draft",
      "What should I post this week?",
      "Turn another idea into a post",
    ];
  }

  return undefined;
}
