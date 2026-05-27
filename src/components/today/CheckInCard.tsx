import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import StatePill from "../shared/StatePill";
import { colors, fonts } from "../../lib/theme";
import type { CheckIn } from "../../lib/types";

const HEADLINES: Record<string, string[]> = {
  low: [
    "Heavy. Go gently today.",
    "Quiet start. Small things count.",
    "Not much in the tank. That's okay.",
  ],
  mid: [
    "Tender. Steady energy. Open to play.",
    "Settled. The day has room in it.",
    "Even keel. A good place to start from.",
  ],
  high: [
    "Bright and ready. Let the hands move.",
    "Energy to spare. Spend it on the real work.",
    "Sharp. This is the window — use it.",
  ],
};

function pickHeadline(checkIn: CheckIn): string {
  const avg = (checkIn.mood + checkIn.energy + checkIn.focus) / 3;
  const bucket = avg < 2.5 ? "low" : avg < 4 ? "mid" : "high";
  const seed = checkIn.date.split("-").reduce((a, b) => a + Number(b), 0);
  const options = HEADLINES[bucket];
  return options[seed % options.length];
}

export default function CheckInCard({
  checkIn,
  onUpdate,
  isHydrated,
}: {
  checkIn: CheckIn;
  onUpdate: (patch: Partial<CheckIn>) => void;
  isHydrated: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const hasValues = checkIn.mood > 0;

  if (!isHydrated) {
    return (
      <Card>
        <Eyebrow>morning check-in</Eyebrow>
        <Text style={styles.title}> </Text>
      </Card>
    );
  }

  if (!hasValues || editing) {
    return (
      <Card>
        <View style={styles.header}>
          <Eyebrow>morning check-in</Eyebrow>
          {editing && (
            <Pressable onPress={() => setEditing(false)}>
              <Text style={styles.link}>done</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.title}>
          {hasValues ? pickHeadline(checkIn) : "How are you feeling?"}
        </Text>
        <View style={styles.grid}>
          <StatePill
            label="mood"
            value={checkIn.mood}
            color={colors.rose}
            onChange={(v) => onUpdate({ mood: v })}
          />
          <StatePill
            label="energy"
            value={checkIn.energy}
            color={colors.gold}
            onChange={(v) => onUpdate({ energy: v })}
          />
          <StatePill
            label="focus"
            value={checkIn.focus}
            color={colors.teal}
            onChange={(v) => onUpdate({ focus: v })}
          />
          <StatePill
            label="overwhelm"
            value={checkIn.overwhelm}
            color={colors.lavender}
            onChange={(v) => onUpdate({ overwhelm: v })}
          />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Eyebrow>morning check-in · {checkIn.time}</Eyebrow>
        <Pressable onPress={() => setEditing(true)}>
          <Text style={styles.link}>edit</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{pickHeadline(checkIn)}</Text>
      <View style={styles.grid}>
        <StatePill label="mood" value={checkIn.mood} color={colors.rose} />
        <StatePill label="energy" value={checkIn.energy} color={colors.gold} />
        <StatePill label="focus" value={checkIn.focus} color={colors.teal} />
        <StatePill
          label="overwhelm"
          value={checkIn.overwhelm}
          color={colors.lavender}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.creamWarm,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.teal,
    letterSpacing: 0.4,
  },
});
