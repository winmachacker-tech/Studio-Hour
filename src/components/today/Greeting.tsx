import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Eyebrow from "../shared/Eyebrow";
import { formatDateLine, getGreeting, getCalendarDay } from "../../lib/dates";
import { colors, fonts } from "../../lib/theme";

const SUBTITLES: Record<string, string[]> = {
  morning: [
    "Tender start. Clear skies. The studio is yours until one.",
    "A slow morning. Let the quiet do its work.",
    "The light is good. Ease into it.",
  ],
  afternoon: [
    "The afternoon light is soft. What still has your attention?",
    "Halfway through. Check in with yourself.",
    "The hard part is behind you. Coast if you need to.",
  ],
  evening: [
    "The day is winding down. Let it.",
    "Rest is not the opposite of progress.",
    "Put the brushes down. Tomorrow will be here.",
  ],
};

function pickSubtitle(timeOfDay: string, dateStr: string): string {
  const seed = dateStr.split("-").reduce((a, b) => a + Number(b), 0);
  const options = SUBTITLES[timeOfDay] ?? SUBTITLES.morning;
  return options[seed % options.length];
}

export default function Greeting() {
  const today = getCalendarDay();
  const { timeOfDay, greeting } = getGreeting();
  const dateLine = formatDateLine(today);
  const subtitle = pickSubtitle(timeOfDay, today);

  return (
    <View style={styles.container}>
      <Eyebrow>{dateLine}</Eyebrow>
      <Text style={styles.title}>
        {greeting},{" "}
        <Text style={styles.titleItalic}>Danielle.</Text>
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.light,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 12,
  },
  titleItalic: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    color: colors.cream,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 23,
    color: colors.lavender,
    maxWidth: 280,
  },
});
