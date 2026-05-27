import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { CheckIn, WorkItem } from "../../lib/types";

interface Suggestion {
  title: string;
  body: string;
  eyebrow: string;
}

function buildSuggestions(
  checkIn: CheckIn,
  workItems: WorkItem[]
): Suggestion[] {
  const energy = checkIn.energy || 3;
  const mood = checkIn.mood || 3;
  const overwhelm = checkIn.overwhelm || 2;
  const activeItems = workItems.filter(
    (w) => w.status !== "Done" && w.status !== "Waiting"
  );

  const suggestions: Suggestion[] = [];

  if (energy >= 3 && overwhelm <= 3) {
    const inProgress = activeItems.find((w) => w.status === "In Progress");
    if (inProgress) {
      suggestions.push({
        title: `${inProgress.title.replace(/\.$/, "")} — keep going.`,
        body:
          mood >= 3
            ? `You're ${mood >= 4 ? "bright" : "tender"} and open. The morning hours suit fine work better than client emails. Three hours, protected.`
            : "Steady energy is enough. Let the work carry you forward.",
        eyebrow: "while you have the light",
      });
    }
  }

  if (energy <= 2 || overwhelm >= 4) {
    suggestions.push({
      title: "Small things only. No big lifts today.",
      body: "When the tank is low, finish one small thing. That's enough for today.",
      eyebrow: "go gently",
    });
  }

  const followUp = activeItems.find((w) => w.status === "Needs Follow-Up");
  if (followUp && energy >= 2) {
    suggestions.push({
      title: `${followUp.title.replace(/\.$/, "")} — a short note is enough.`,
      body: "It's been a few days. A warm, brief reply keeps the thread alive.",
      eyebrow: "a quick follow-up",
    });
  }

  const readyItem = activeItems.find((w) => w.status === "Ready");
  if (readyItem && energy >= 3) {
    suggestions.push({
      title: readyItem.title,
      body: `This one is ready to go. ${readyItem.note}`,
      eyebrow: "ready when you are",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: "Take it easy. The studio will be here tomorrow.",
      body: "Not every day needs a project. Rest is part of the work.",
      eyebrow: "rest day",
    });
  }

  return suggestions;
}

export default function SuggestedFocus({
  checkIn,
  workItems,
}: {
  checkIn: CheckIn;
  workItems: WorkItem[];
}) {
  const suggestions = useMemo(
    () => buildSuggestions(checkIn, workItems),
    [checkIn, workItems]
  );
  const [index, setIndex] = useState(0);
  const suggestion = suggestions[index % suggestions.length];

  return (
    <Card variant="feature">
      <Eyebrow color={colors.teal}>{suggestion.eyebrow}</Eyebrow>
      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.body}>{suggestion.body}</Text>
      {suggestions.length > 1 && (
        <Pressable
          style={styles.showAnother}
          onPress={() => setIndex((i) => i + 1)}
        >
          <Text style={styles.showAnotherText}>show another</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.regular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 10,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.cream,
    opacity: 0.85,
  },
  showAnother: {
    marginTop: 14,
    paddingVertical: 4,
  },
  showAnotherText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.lavender,
    letterSpacing: 0.4,
  },
});
