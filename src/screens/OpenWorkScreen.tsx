import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import FilterRow from "../components/shared/FilterRow";
import WorkCard from "../components/work/WorkCard";
import { useTasks } from "../hooks/useTasks";
import { colors, fonts } from "../lib/theme";

const FILTERS = ["All", "Murals", "Studio art", "Design", "Leads"];

const WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
];

export default function OpenWorkScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const { items, toggleDone, cycleStatus, activeCount, isHydrated } =
    useTasks();

  const shown =
    filter === "All" ? items : items.filter((t) => t.group === filter);

  const countText = `${WORDS[items.length] ?? items.length} thing${items.length === 1 ? "" : "s"} in motion — not all for today. Pick by energy, not by guilt.`;

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
        <Eyebrow>open work</Eyebrow>
        <Text style={styles.title}>Ready when you are.</Text>
        <Text style={styles.subtitle}>{countText}</Text>
      </View>

      <FilterRow filters={FILTERS} active={filter} onChange={setFilter} />

      {isHydrated &&
        shown.map((item) => (
          <WorkCard
            key={item.id}
            item={item}
            onToggleDone={() => toggleDone(item.id)}
            onCycleStatus={() => cycleStatus(item.id)}
          />
        ))}

      <Text style={styles.foot}>— done is a kind of rest, too.</Text>
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
    maxWidth: 300,
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
