import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import SnapGrid from "../components/dashboard/SnapGrid";
import { useCheckIn } from "../hooks/useCheckIn";
import { useSchedule } from "../hooks/useSchedule";
import { useTasks } from "../hooks/useTasks";
import { useIdeas } from "../hooks/useIdeas";
import { useRituals } from "../hooks/useRituals";
import { useGuide } from "../hooks/useGuide";
import { formatDateLine, getCalendarDay } from "../lib/dates";
import { colors, fonts } from "../lib/theme";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const today = getCalendarDay();
  const { checkIn } = useCheckIn();
  const { blocks } = useSchedule();
  const { items: workItems } = useTasks();
  const { items: ideas } = useIdeas();
  const { doneCount, total } = useRituals();
  const { messages: guideMessages } = useGuide();

  const followUps = workItems.filter(
    (w) => w.status === "Needs Follow-Up"
  );
  const activeWork = workItems.filter((w) => w.status !== "Done");

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: 130 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Eyebrow>the studio at a glance</Eyebrow>
        <Text style={styles.title}>Where things stand.</Text>
        <Text style={styles.subtitle}>
          {formatDateLine(today)} · the one headline from each room.
        </Text>
      </View>

      <SnapGrid
        checkIn={checkIn}
        blocks={blocks}
        workItems={workItems}
        ideas={ideas}
        guideMessages={guideMessages}
      />

      {checkIn.completed && (
        <View style={styles.pulse}>
          <Text style={styles.pulseLabel}>
            {checkIn.energy >= 3
              ? "Studio pulse"
              : "Low-energy day"}
          </Text>
          <Text style={styles.pulseBody}>
            {checkIn.energy >= 4
              ? `Energy ${checkIn.energy}/5 · focus ${checkIn.focus}/5. The window is open — ${activeWork.length} thing${activeWork.length === 1 ? "" : "s"} in motion.`
              : checkIn.energy >= 3
                ? `Steady energy. ${activeWork.length} item${activeWork.length === 1 ? "" : "s"} open, ${doneCount}/${total} rituals done.`
                : `Gentle day. ${doneCount}/${total} rituals done. Pick by ease, not by guilt.`}
          </Text>
          {followUps.length > 0 && (
            <Text style={styles.pulseFollow}>
              {followUps.length === 1
                ? `${followUps[0].title.replace(/\.$/, "")} — a short note is enough.`
                : `${followUps.length} items need a follow-up.`}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.foot}>
        — a calm room is its own kind of command.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.nightPlum,
  },
  content: {
    paddingHorizontal: 22,
  },
  header: {
    marginBottom: 22,
  },
  title: {
    fontFamily: fonts.light,
    fontSize: 30,
    letterSpacing: -0.7,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 22,
    color: colors.lavender,
  },
  pulse: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: "rgba(15, 40, 40, 0.25)",
    marginBottom: 12,
  },
  pulseLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.teal,
    marginBottom: 8,
  },
  pulseBody: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.cream,
  },
  pulseFollow: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.gold,
    marginTop: 8,
  },
  foot: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 13,
    color: colors.lavender,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 22,
    marginBottom: 6,
  },
});
