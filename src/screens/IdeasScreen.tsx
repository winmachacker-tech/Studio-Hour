import React, { useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import FilterRow from "../components/shared/FilterRow";
import KeyboardSafeScrollView, {
  scrollFieldAboveKeyboard,
} from "../components/shared/KeyboardSafeScrollView";
import IdeaCard from "../components/ideas/IdeaCard";
import AddIdeaForm from "../components/ideas/AddIdeaForm";
import { useIdeas } from "../hooks/useIdeas";
import { colors, fonts } from "../lib/theme";

const FILTERS = ["All", "Posts", "Artwork", "Voiceover"];

export default function IdeasScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const { items, addIdea, cycleStatus, isHydrated } = useIdeas();

  const shown =
    filter === "All" ? items : items.filter((i) => i.kind === filter);

  return (
    <View style={styles.container}>
      <KeyboardSafeScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            // Extra room while the add-idea form is open so the lower note
            // field and Save button can scroll clear of the keyboard.
            paddingBottom: (showForm ? 240 : 130) + insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <Eyebrow>the idea drawer</Eyebrow>
          <Text style={styles.title}>Loose thoughts, kept.</Text>
          <Text style={styles.subtitle}>
            Nothing here has to become anything. Open the drawer when the room
            feels quiet.
          </Text>
        </View>

        {items.length > 0 && (
          <FilterRow filters={FILTERS} active={filter} onChange={setFilter} />
        )}

        {showForm && (
          <AddIdeaForm
            onAdd={addIdea}
            onClose={() => setShowForm(false)}
            onFocusNoteField={() => scrollFieldAboveKeyboard(scrollRef, 360)}
          />
        )}

        {isHydrated && items.length === 0 && !showForm && (
          <Text style={styles.emptyText}>No ideas yet.</Text>
        )}

        {isHydrated &&
          shown.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onCycleStatus={() => cycleStatus(idea.id)}
            />
          ))}
      </KeyboardSafeScrollView>

      {!showForm && (
        <Pressable
          style={[styles.fab, { bottom: 90 + insets.bottom }]}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.fabText}>＋  add an idea</Text>
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
    marginBottom: 12,
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
