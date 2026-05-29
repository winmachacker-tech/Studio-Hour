import React, { useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import FilterRow from "../components/shared/FilterRow";
import KeyboardSafeScrollView, {
  scrollFieldAboveKeyboard,
} from "../components/shared/KeyboardSafeScrollView";
import WorkCard from "../components/work/WorkCard";
import AddWorkForm from "../components/work/AddWorkForm";
import { useTasks } from "../hooks/useTasks";
import { colors, fonts } from "../lib/theme";

const FILTERS = ["All", "Murals", "Studio art", "Design", "Leads"];

const WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
];

export default function OpenWorkScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  // While an inline add-step input is focused we add extra bottom space so the
  // last card can scroll above the keyboard (otherwise it clamps at max scroll).
  const [isStepInputFocused, setIsStepInputFocused] = useState(false);
  const {
    items,
    addWorkItem,
    toggleDone,
    cycleStatus,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    isHydrated,
  } = useTasks();

  const shown =
    filter === "All" ? items : items.filter((t) => t.group === filter);

  const countText = items.length > 0
    ? `${WORDS[items.length] ?? items.length} thing${items.length === 1 ? "" : "s"} in motion — not all for today. Pick by energy, not by guilt.`
    : "";

  return (
    <View style={styles.container}>
      <KeyboardSafeScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            // Extra room while the add-project form is open so the lower
            // fields and Save button can scroll clear of the keyboard. While an
            // inline add-step input is focused, add even more so the LAST card
            // can scroll above the keyboard instead of clamping at max scroll.
            paddingBottom:
              (isStepInputFocused ? 400 : showForm ? 240 : 130) +
              insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <Eyebrow>open projects</Eyebrow>
          <Text style={styles.title}>Ready when you are.</Text>
          {countText !== "" && <Text style={styles.subtitle}>{countText}</Text>}
        </View>

        {items.length > 0 && (
          <FilterRow filters={FILTERS} active={filter} onChange={setFilter} />
        )}

        {showForm && (
          <AddWorkForm
            onAdd={addWorkItem}
            onClose={() => setShowForm(false)}
            onFocusNextMoveField={() =>
              scrollFieldAboveKeyboard(scrollRef, 520)
            }
          />
        )}

        {isHydrated && items.length === 0 && !showForm && (
          <>
            <Text style={styles.emptyText}>No open projects yet.</Text>
            <Text style={styles.emptyHint}>
              Add a piece, project, commission, idea, or follow-up you want to
              keep moving.
            </Text>
          </>
        )}

        {isHydrated &&
          shown.map((item) => (
            <WorkCard
              key={item.id}
              item={item}
              onToggleDone={() => toggleDone(item.id)}
              onCycleStatus={() => cycleStatus(item.id)}
              onAddSubtask={(text) => addSubtask(item.id, text)}
              onToggleSubtask={(subtaskId) => toggleSubtask(item.id, subtaskId)}
              onDeleteSubtask={(subtaskId) => deleteSubtask(item.id, subtaskId)}
              onFocusAddStep={(cardBottomY) => {
                // Grow the bottom padding first so the scroll isn't clamped,
                // then scroll the card's bottom edge (where the add-step input
                // sits) to ~300px from the top — above the keyboard —
                // regardless of where the card is in the list.
                setIsStepInputFocused(true);
                scrollFieldAboveKeyboard(scrollRef, Math.max(0, cardBottomY - 300));
              }}
              onBlurAddStep={() => setIsStepInputFocused(false)}
            />
          ))}

        <Text style={styles.foot}>— done is a kind of rest, too.</Text>
      </KeyboardSafeScrollView>

      {!showForm && (
        <Pressable
          style={[styles.fab, { bottom: 90 + insets.bottom }]}
          onPress={() => setShowForm(true)}
          accessibilityLabel="Add project"
        >
          <Text style={styles.fabText}>＋  add project</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.nightPlum,
  },
  scroll: {
    flex: 1,
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
  emptyText: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 22,
    color: colors.lavender,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyHint: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.lavender,
    opacity: 0.75,
    marginBottom: 12,
    maxWidth: 320,
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
  fab: {
    position: "absolute",
    right: 22,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.teal,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.creamWarm,
    letterSpacing: 0.2,
  },
});
