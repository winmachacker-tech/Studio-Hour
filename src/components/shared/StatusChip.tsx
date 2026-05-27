import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";
import type { WorkStatus } from "../../lib/types";

const STATUS_COLORS: Record<WorkStatus, string> = {
  Ready: colors.teal,
  "In Progress": colors.teal,
  "Needs Follow-Up": colors.gold,
  Waiting: colors.lavender,
  Done: colors.lavender,
};

const STATUS_BG: Record<WorkStatus, string> = {
  Ready: "rgba(17, 153, 153, 0.12)",
  "In Progress": "rgba(17, 153, 153, 0.12)",
  "Needs Follow-Up": "rgba(212, 168, 67, 0.12)",
  Waiting: "rgba(155, 138, 170, 0.1)",
  Done: "rgba(155, 138, 170, 0.08)",
};

export default function StatusChip({
  status,
  onPress,
}: {
  status: WorkStatus;
  onPress?: () => void;
}) {
  const content = (
    <Text
      style={[
        styles.chip,
        {
          color: STATUS_COLORS[status],
          backgroundColor: STATUS_BG[status],
          borderColor: STATUS_COLORS[status],
        },
        status === "Done" && styles.done,
      ]}
    >
      {status}
    </Text>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  chip: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.3,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  done: {
    opacity: 0.5,
  },
});
