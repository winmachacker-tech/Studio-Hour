import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import StatusChip from "../shared/StatusChip";
import EnergyChip from "../shared/EnergyChip";
import { colors, fonts } from "../../lib/theme";
import type { WorkItem } from "../../lib/types";

export default function WorkCard({
  item,
  onToggleDone,
  onCycleStatus,
}: {
  item: WorkItem;
  onToggleDone: () => void;
  onCycleStatus: () => void;
}) {
  const isDone = item.status === "Done";

  return (
    <Card style={isDone ? styles.done : undefined}>
      <Eyebrow color={isDone ? colors.lavender : undefined}>
        {item.project}
      </Eyebrow>
      <Pressable onPress={onToggleDone}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
        >
          {item.title}
        </Text>
      </Pressable>
      <Text style={styles.note}>{item.note}</Text>
      <View style={styles.chipRow}>
        <StatusChip status={item.status} onPress={onCycleStatus} />
        <EnergyChip level={item.energy} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  done: {
    opacity: 0.5,
    borderStyle: "dashed" as const,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 6,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: colors.lavender,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.lavender,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
});
