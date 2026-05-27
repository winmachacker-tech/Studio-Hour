"use client";

import SnapCard from "./SnapCard";
import type { WorkItem, CheckIn, ScheduleBlock, Idea, GuideMessage } from "@/lib/types";

function todaySnap(
  checkIn: CheckIn,
  blocks: ScheduleBlock[]
): { headline: string; meta: string } {
  const protectedBlock = blocks.find((b) => b.type === "protected");
  if (protectedBlock) {
    return {
      headline: `${protectedBlock.title} — ${protectedBlock.meta.split(" · ")[0]}.`,
      meta: `${protectedBlock.time} · protected hours`,
    };
  }
  if (checkIn.completed) {
    const avgEnergy = checkIn.energy;
    return {
      headline:
        avgEnergy >= 3
          ? "Energy is up. The studio is yours."
          : "Gentle day. Small things count.",
      meta: `checked in · ${checkIn.time}`,
    };
  }
  return {
    headline: "No check-in yet today.",
    meta: "tap Today to start",
  };
}

function workSnap(items: WorkItem[]): { headline: string; meta: string } {
  const active = items.filter((i) => i.status !== "Done");
  const ready = active.find((i) => i.status === "Ready");
  const inProgress = active.find((i) => i.status === "In Progress");
  const pick = ready ?? inProgress ?? active[0];
  if (pick) {
    return {
      headline: pick.title,
      meta: `${active.length} thing${active.length === 1 ? "" : "s"} in motion`,
    };
  }
  return {
    headline: "Everything is done.",
    meta: "nothing open right now",
  };
}

function ideasSnap(
  ideas: Idea[]
): { headline: string; meta: string } {
  const saved = ideas.filter((i) => i.status === "saved");
  const drafts = ideas.filter((i) => i.status === "draft");
  const unused = ideas.filter((i) => i.status !== "used");
  const newest = unused[0];

  if (newest) {
    return {
      headline: newest.title,
      meta: `${saved.length} saved · ${drafts.length} draft${drafts.length === 1 ? "" : "s"}`,
    };
  }
  return {
    headline: "The drawer is empty.",
    meta: "add an idea when one comes",
  };
}

function guideSnap(
  guideMessages: GuideMessage[]
): { headline: string; meta: string } {
  const assistantMsgs = guideMessages.filter((m) => m.role === "assistant");
  const last = assistantMsgs.at(-1);

  if (last) {
    const truncated =
      last.content.length > 60
        ? last.content.slice(0, 57) + "..."
        : last.content;

    const date = new Date(last.timestamp);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;

    return {
      headline: truncated,
      meta: `last note · ${days[date.getDay()]} ${hour12}:${m} ${ampm}`,
    };
  }

  return {
    headline: "Ask the Guide to shape the day.",
    meta: "your planning space",
  };
}

export default function SnapGrid({
  checkIn,
  blocks,
  workItems,
  ideas,
  guideMessages,
}: {
  checkIn: CheckIn;
  blocks: ScheduleBlock[];
  workItems: WorkItem[];
  ideas: Idea[];
  guideMessages: GuideMessage[];
}) {
  const today = todaySnap(checkIn, blocks);
  const work = workSnap(workItems);
  const ideasData = ideasSnap(ideas);
  const guide = guideSnap(guideMessages);

  return (
    <div className="snap-grid">
      <SnapCard
        eyebrow="today"
        eyebrowColor="var(--teal)"
        headline={today.headline}
        meta={today.meta}
      />
      <SnapCard
        eyebrow="open work"
        headline={work.headline}
        meta={work.meta}
      />
      <SnapCard
        eyebrow="ideas"
        headline={ideasData.headline}
        meta={ideasData.meta}
      />
      <SnapCard
        eyebrow="guide"
        headline={guide.headline}
        meta={guide.meta}
      />
    </div>
  );
}
