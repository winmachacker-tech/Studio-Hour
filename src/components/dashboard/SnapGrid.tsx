import React from "react";
import { View, StyleSheet } from "react-native";
import SnapCard from "./SnapCard";
import { colors } from "../../lib/theme";
import type { GuideMessage } from "../../hooks/useGuide";
import type { CheckIn, ScheduleBlock, WorkItem, Idea } from "../../lib/types";

function guideSnap(
  messages: GuideMessage[]
): { headline: string; meta: string } {
  const assistantMsgs = messages.filter((m) => m.role === "assistant");
  const last = assistantMsgs.at(-1);
  if (last) {
    const truncated =
      last.content.length > 55
        ? last.content.slice(0, 52) + "..."
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
    return {
      headline:
        checkIn.energy >= 3
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
  const pick =
    active.find((i) => i.status === "Ready") ??
    active.find((i) => i.status === "In Progress") ??
    active[0];
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

function ideasSnap(ideas: Idea[]): { headline: string; meta: string } {
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

export type SnapTile = "Today" | "Open Work" | "Ideas" | "Guide";

export default function SnapGrid({
  checkIn,
  blocks,
  workItems,
  ideas,
  guideMessages = [],
  onTilePress,
}: {
  checkIn: CheckIn;
  blocks: ScheduleBlock[];
  workItems: WorkItem[];
  ideas: Idea[];
  guideMessages?: GuideMessage[];
  onTilePress?: (tile: SnapTile) => void;
}) {
  const today = todaySnap(checkIn, blocks);
  const work = workSnap(workItems);
  const ideasData = ideasSnap(ideas);
  const guide = guideSnap(guideMessages);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <SnapCard
          eyebrow="today"
          eyebrowColor={colors.teal}
          headline={today.headline}
          meta={today.meta}
          onPress={onTilePress ? () => onTilePress("Today") : undefined}
          accessibilityLabel="Open Today"
        />
        <SnapCard
          eyebrow="open work"
          headline={work.headline}
          meta={work.meta}
          onPress={onTilePress ? () => onTilePress("Open Work") : undefined}
          accessibilityLabel="Open Work"
        />
      </View>
      <View style={styles.row}>
        <SnapCard
          eyebrow="ideas"
          headline={ideasData.headline}
          meta={ideasData.meta}
          onPress={onTilePress ? () => onTilePress("Ideas") : undefined}
          accessibilityLabel="Open Ideas"
        />
        <SnapCard
          eyebrow="guide"
          headline={guide.headline}
          meta={guide.meta}
          onPress={onTilePress ? () => onTilePress("Guide") : undefined}
          accessibilityLabel="Open Guide"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
});
