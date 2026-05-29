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
import EditWorkForm from "../components/work/EditWorkForm";
import { useTasks } from "../hooks/useTasks";
import { colors, fonts } from "../lib/theme";

const FILTERS = ["All", "Murals", "Studio art", "Design", "Leads"];

const WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
];

// ── Keyboard scroll tuning ───────────────────────────────────────────
// KeyboardSafeScrollView (behavior="padding") makes lower fields scrollable
// when the keyboard opens but does NOT auto-scroll the focused field into
// view, so these fixed offsets nudge each lower form field up. Values are
// px from the top of the scroll content, tuned per form layout.
// See docs/open-projects-keyboard-rca.md.
const SCROLL_Y = {
  // Add form (has group + energy pills, so the note sits lower).
  addGoal: 340,
  addNote: 520,
  // Edit form (no pills, renders at the top of the page).
  editGoal: 340,
  editNote: 430,
};
// How far above a card's bottom edge to land its inline add-step input.
const ADD_STEP_SCROLL_MARGIN = 300;

// Scroll content bottom padding (the safe-area inset is added on top of these).
const BOTTOM_PADDING = {
  base: 130, // normal browsing
  topForm: 240, // a top form (add or edit) is open
  stepFocused: 400, // an inline add-step input is focused (beats max-scroll clamp)
};

export default function OpenWorkScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  // While an inline add-step input is focused we add extra bottom space so the
  // last card can scroll above the keyboard (otherwise it clamps at max scroll).
  const [isStepInputFocused, setIsStepInputFocused] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    items,
    addWorkItem,
    updateWorkItem,
    toggleDone,
    cycleStatus,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    isHydrated,
  } = useTasks();

  const shown =
    filter === "All" ? items : items.filter((t) => t.group === filter);

  // The project currently being edited (edit form renders at the top of the
  // page, not inline in the list).
  const editingItem = items.find((i) => i.id === editingId) ?? null;

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
            // Extra room while a top form (add or edit) is open so its lower
            // fields and Save button can scroll clear of the keyboard. While an
            // inline add-step input is focused, add even more so the LAST card
            // can scroll above the keyboard instead of clamping at max scroll.
            paddingBottom:
              (isStepInputFocused
                ? BOTTOM_PADDING.stepFocused
                : showForm || editingItem
                  ? BOTTOM_PADDING.topForm
                  : BOTTOM_PADDING.base) + insets.bottom,
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

        {editingItem && (
          <EditWorkForm
            key={editingItem.id}
            item={editingItem}
            onSave={(edits) => {
              updateWorkItem(editingItem.id, edits);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            // Top-anchored form (like add): fixed scroll offsets, no per-card
            // position math. Edit form has no group/energy pills, so the note
            // field sits a little higher than the add form's.
            onFocusGoalField={() =>
              scrollFieldAboveKeyboard(scrollRef, SCROLL_Y.editGoal)
            }
            onFocusNoteField={() =>
              scrollFieldAboveKeyboard(scrollRef, SCROLL_Y.editNote)
            }
          />
        )}

        {showForm && (
          <AddWorkForm
            onAdd={addWorkItem}
            onClose={() => setShowForm(false)}
            onFocusNextMoveField={() =>
              scrollFieldAboveKeyboard(scrollRef, SCROLL_Y.addNote)
            }
            // Goal sits above the note field, so a smaller scroll target.
            onFocusGoalField={() =>
              scrollFieldAboveKeyboard(scrollRef, SCROLL_Y.addGoal)
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
              onEdit={() => {
                // Edit renders at the top of the page; close the add form so
                // the two never compete.
                setShowForm(false);
                setEditingId(item.id);
              }}
              onAddSubtask={(text) => addSubtask(item.id, text)}
              onToggleSubtask={(subtaskId) => toggleSubtask(item.id, subtaskId)}
              onDeleteSubtask={(subtaskId) => deleteSubtask(item.id, subtaskId)}
              onFocusAddStep={(cardBottomY) => {
                // Grow the bottom padding first so the scroll isn't clamped,
                // then scroll the card's bottom edge (where the add-step input
                // sits) to ~300px from the top — above the keyboard —
                // regardless of where the card is in the list.
                setIsStepInputFocused(true);
                scrollFieldAboveKeyboard(
                  scrollRef,
                  Math.max(0, cardBottomY - ADD_STEP_SCROLL_MARGIN)
                );
              }}
              onBlurAddStep={() => setIsStepInputFocused(false)}
            />
          ))}

        <Text style={styles.foot}>— done is a kind of rest, too.</Text>
      </KeyboardSafeScrollView>

      {!showForm && !editingItem && (
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
