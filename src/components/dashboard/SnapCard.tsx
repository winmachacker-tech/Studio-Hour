import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";

export default function SnapCard({
  eyebrow,
  eyebrowColor,
  headline,
  meta,
  onPress,
  accessibilityLabel,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  headline: string;
  meta: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const body = (
    <>
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <Text style={styles.headline} numberOfLines={2}>
        {headline}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `Open ${eyebrow}`}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.card}>{body}</View>;
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
  cardPressed: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(37, 22, 64, 0.6)",
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
