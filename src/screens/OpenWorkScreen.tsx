import React, { useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import FilterRow from "../components/shared/FilterRow";
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
    <KeyboardAvoidingView
      style={styles.container}
      // Android's manifest uses windowSoftInputMode="adjustResize", which
      // already shrinks the window when the keyboard opens — so we let it
      // handle Android and only apply padding on iOS (which has no resize).
      // Stacking both would create a double gap above the keyboard.
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            // Extra room while the add-project form is open so the lower
            // fields and Save button can scroll clear of the keyboard.
            paddingBottom: (showForm ? 240 : 130) + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
            onFocusNextMoveField={() => {
              // Fixed-offset scroll to bring the lower "next small move" field
              // and the Save button above the Android keyboard. Fire twice —
              // once early, once after adjustResize has finished shrinking the
              // window — so it lands reliably regardless of resize timing.
              const scrollDown = () =>
                scrollRef.current?.scrollTo({ y: 520, animated: true });
              setTimeout(scrollDown, 100);
              setTimeout(scrollDown, 300);
            }}
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
            />
          ))}

        <Text style={styles.foot}>— done is a kind of rest, too.</Text>
      </ScrollView>

      {!showForm && (
        <Pressable
          style={[styles.fab, { bottom: 90 + insets.bottom }]}
          onPress={() => setShowForm(true)}
          accessibilityLabel="Add project"
        >
          <Text style={styles.fabText}>＋  add project</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
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
