import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";

export default function Eyebrow({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Text style={[styles.eyebrow, color ? { color } : undefined]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    color: colors.lavender,
  },
});
