import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";

export default function EnergyChip({ level }: { level: string }) {
  return <Text style={styles.chip}>{level}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.lavender,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(155, 138, 170, 0.15)",
    backgroundColor: "rgba(155, 138, 170, 0.06)",
    overflow: "hidden",
    alignSelf: "flex-start",
  },
});
