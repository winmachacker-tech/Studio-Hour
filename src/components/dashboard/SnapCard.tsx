import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";

export default function SnapCard({
  eyebrow,
  eyebrowColor,
  headline,
  meta,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  headline: string;
  meta: string;
}) {
  return (
    <View style={styles.card}>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <Text style={styles.headline} numberOfLines={2}>
        {headline}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(37, 22, 64, 0.45)",
    justifyContent: "space-between",
  },
  headline: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.1,
    color: colors.cream,
    marginTop: 6,
    flex: 1,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.lavender,
    letterSpacing: 0.3,
    marginTop: 6,
  },
});
