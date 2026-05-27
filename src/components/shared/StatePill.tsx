import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DotScale from "./DotScale";
import { colors, fonts } from "../../lib/theme";

export default function StatePill({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange?: (value: number) => void;
}) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <DotScale value={value} max={5} color={color} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: "rgba(15, 8, 22, 0.3)",
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.lavender,
  },
});
