import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../lib/theme";

export default function ProgressRail({
  percent,
  color = "gold",
}: {
  percent: number;
  color?: "gold" | "teal";
}) {
  const fillColor = color === "teal" ? colors.teal : colors.gold;
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(245, 238, 248, 0.06)",
    marginTop: 8,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
