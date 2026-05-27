import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { Ritual } from "../../lib/types";

export default function RitualsCard({
  rituals,
  doneCount,
  total,
  onToggle,
}: {
  rituals: Ritual[];
  doneCount: number;
  total: number;
  onToggle: (id: string) => void;
}) {
  return (
    <Card variant="quiet">
      <View style={styles.header}>
        <Eyebrow>today's small rituals</Eyebrow>
        <Text style={styles.meta}>
          {doneCount} of {total}
        </Text>
      </View>
      <View style={styles.list}>
        {rituals.map((ritual) => (
          <Pressable
            key={ritual.id}
            style={[styles.ritual, ritual.done && styles.ritualDone]}
            onPress={() => onToggle(ritual.id)}
          >
            <View
              style={[styles.check, ritual.done && styles.checkDone]}
            >
              {ritual.done && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text
              style={[
                styles.ritualText,
                ritual.done && styles.ritualTextDone,
              ]}
            >
              {ritual.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.lavender,
    letterSpacing: 0.4,
  },
  list: {
    gap: 2,
  },
  ritual: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  ritualDone: {
    opacity: 0.6,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    borderColor: colors.teal,
    backgroundColor: "rgba(17, 153, 153, 0.15)",
  },
  checkMark: {
    fontSize: 11,
    color: colors.teal,
    fontWeight: "600",
  },
  ritualText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.cream,
    lineHeight: 20,
  },
  ritualTextDone: {
    textDecorationLine: "line-through",
    color: colors.lavender,
  },
});
