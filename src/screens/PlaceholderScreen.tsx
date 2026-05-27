import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import { colors, fonts } from "../lib/theme";

export default function PlaceholderScreen({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 20 }]}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Coming in the next phase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.nightPlum,
    paddingHorizontal: 22,
  },
  title: {
    fontFamily: fonts.light,
    fontSize: 30,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 15,
    color: colors.lavender,
  },
});
