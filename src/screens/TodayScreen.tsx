import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Greeting from "../components/today/Greeting";
import CheckInCard from "../components/today/CheckInCard";
import SuggestedFocus from "../components/today/SuggestedFocus";
import ScheduleCard from "../components/today/ScheduleCard";
import RitualsCard from "../components/today/RitualsCard";
import { useCheckIn } from "../hooks/useCheckIn";
import { useRituals } from "../hooks/useRituals";
import { useSchedule } from "../hooks/useSchedule";
import { useTasks } from "../hooks/useTasks";
import { colors, fonts } from "../lib/theme";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { checkIn, update, isHydrated } = useCheckIn();
  const {
    rituals,
    doneCount,
    total,
    toggle,
    isHydrated: ritualsHydrated,
  } = useRituals();
  const { blocks } = useSchedule();
  const { items: workItems } = useTasks();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: 130 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Greeting />

      <CheckInCard
        checkIn={checkIn}
        onUpdate={update}
        isHydrated={isHydrated}
      />

      <SuggestedFocus checkIn={checkIn} workItems={workItems} />

      <ScheduleCard blocks={blocks} />

      {ritualsHydrated && (
        <RitualsCard
          rituals={rituals}
          doneCount={doneCount}
          total={total}
          onToggle={toggle}
        />
      )}

      <Text style={styles.foot}>— a quiet hour belongs to you.</Text>
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
