import React, { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { WorkGroup, EnergyLevel, WorkStatus } from "../../lib/types";

const GROUPS: WorkGroup[] = ["Murals", "Studio art", "Design", "Leads"];
const ENERGY_LEVELS: EnergyLevel[] = ["High focus", "Medium energy", "Low lift"];

export default function AddWorkForm({
  onAdd,
  onClose,
  onFocusNextMoveField,
}: {
  onAdd: (item: {
    title: string;
    project: string;
    group: WorkGroup;
    energy: EnergyLevel;
    note: string;
    dueDate?: string;
    goal?: string;
    status?: WorkStatus;
  }) => void;
  onClose: () => void;
  // Called when the lower "next small move" field focuses, so the parent
  // ScrollView can scroll it (and the Save button) above the keyboard.
  onFocusNextMoveField?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [group, setGroup] = useState<WorkGroup>("Murals");
  const [energy, setEnergy] = useState<EnergyLevel>("Medium energy");
  const [dueDate, setDueDate] = useState("");
  const [goal, setGoal] = useState("");
  const [note, setNote] = useState("");

  // The "next small move" field sits at the bottom of the form. On Android,
  // onFocus alone can fire late/inconsistently, so we also force focus from
  // the wrapper's onPressIn and request the parent scroll from both paths.
  const noteRef = useRef<TextInput>(null);

  const focusNoteField = () => {
    noteRef.current?.focus();
    onFocusNextMoveField?.();
  };

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      project: project.trim(),
      group,
      energy,
      note: note.trim(),
      dueDate: dueDate.trim() || undefined,
      goal: goal.trim() || undefined,
    });
    setTitle("");
    setProject("");
    setGroup("Murals");
    setEnergy("Medium energy");
    setDueDate("");
    setGoal("");
    setNote("");
    onClose();
  };

  return (
    <Card>
      <View style={styles.header}>
        <Eyebrow>new work</Eyebrow>
        <Pressable onPress={onClose}>
          <Text style={styles.cancel}>cancel</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What are you working on?"
        placeholderTextColor={colors.lavender}
        value={title}
        onChangeText={setTitle}
        autoFocus
        returnKeyType="next"
      />

      <TextInput
        style={styles.input}
        placeholder="Project or client"
        placeholderTextColor={colors.lavender}
        value={project}
        onChangeText={setProject}
        returnKeyType="next"
      />

      <TextInput
        style={styles.input}
        placeholder="Due date (optional) · YYYY-MM-DD"
        placeholderTextColor={colors.lavender}
        value={dueDate}
        onChangeText={setDueDate}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />

      <Text style={styles.fieldLabel}>goal / intended outcome</Text>
      <TextInput
        style={styles.input}
        placeholder="What should this become?"
        placeholderTextColor={colors.lavender}
        value={goal}
        onChangeText={setGoal}
        returnKeyType="next"
      />

      <Text style={styles.fieldLabel}>group</Text>
      <View style={styles.pillRow}>
        {GROUPS.map((g) => (
          <Pressable
            key={g}
            style={[styles.pill, group === g && styles.pillActive]}
            onPress={() => setGroup(g)}
          >
            <Text
              style={[styles.pillText, group === g && styles.pillTextActive]}
            >
              {g}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>energy</Text>
      <View style={styles.pillRow}>
        {ENERGY_LEVELS.map((e) => (
          <Pressable
            key={e}
            style={[styles.pill, energy === e && styles.pillActive]}
            onPress={() => setEnergy(e)}
          >
            <Text
              style={[styles.pillText, energy === e && styles.pillTextActive]}
            >
              {e}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPressIn={focusNoteField} accessibilityRole="none">
        <TextInput
          ref={noteRef}
          style={[styles.input, styles.noteInput]}
          placeholder="What's the next small move?"
          placeholderTextColor={colors.lavender}
          value={note}
          onChangeText={setNote}
          onFocus={onFocusNextMoveField}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </Pressable>

      <Pressable
        style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
        onPress={submit}
        disabled={!title.trim()}
      >
        <Text style={styles.saveBtnText}>Save</Text>
        <Text style={styles.saveBtnArrow}>→</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cancel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.teal,
    letterSpacing: 0.4,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: "rgba(15, 8, 22, 0.5)",
    color: colors.cream,
    fontFamily: fonts.regular,
    fontSize: 15,
    marginBottom: 10,
  },
  noteInput: {
    fontSize: 13,
    fontStyle: "italic",
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.lavender,
    opacity: 0.8,
    marginTop: 2,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillActive: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(17, 153, 153, 0.12)",
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.lavender,
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: colors.teal,
  },
  saveBtn: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17, 153, 153, 0.5)",
    backgroundColor: "rgba(17, 153, 153, 0.14)",
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.cream,
    letterSpacing: 0.2,
  },
  saveBtnArrow: {
    fontSize: 14,
    color: colors.teal,
  },
});
