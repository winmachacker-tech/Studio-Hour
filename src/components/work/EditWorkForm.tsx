import React, { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { WorkItem } from "../../lib/types";

export type WorkItemEdits = {
  title: string;
  project: string;
  note: string;
  dueDate?: string;
  goal?: string;
};

export default function EditWorkForm({
  item,
  onSave,
  onCancel,
  onFocusNoteField,
  onFocusGoalField,
}: {
  item: WorkItem;
  onSave: (edits: WorkItemEdits) => void;
  onCancel: () => void;
  // Keyboard-safe scroll: the edit form now renders at a fixed position near
  // the top of the page (like the add form), so the parent just scrolls to a
  // fixed offset on focus — no per-card position math. Mirrors AddWorkForm.
  onFocusNoteField?: () => void;
  onFocusGoalField?: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [project, setProject] = useState(item.project);
  const [dueDate, setDueDate] = useState(item.dueDate ?? "");
  const [goal, setGoal] = useState(item.goal ?? "");
  const [note, setNote] = useState(item.note);

  // onFocus can fire late/inconsistently on Android, so we also force focus
  // from each field's onPressIn and request the parent scroll from both.
  const noteRef = useRef<TextInput>(null);
  const goalRef = useRef<TextInput>(null);

  const focusNoteField = () => {
    noteRef.current?.focus();
    onFocusNoteField?.();
  };

  const focusGoalField = () => {
    goalRef.current?.focus();
    onFocusGoalField?.();
  };

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      project: project.trim(),
      note: note.trim(),
      dueDate: dueDate.trim() || undefined,
      goal: goal.trim() || undefined,
    });
  };

  return (
    <Card>
      <View style={styles.header}>
        <Eyebrow>edit project</Eyebrow>
        <Pressable onPress={onCancel}>
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

      <Pressable onPressIn={focusGoalField} accessibilityRole="none">
        <TextInput
          ref={goalRef}
          style={styles.input}
          placeholder="What should this become?"
          placeholderTextColor={colors.lavender}
          value={goal}
          onChangeText={setGoal}
          onFocus={onFocusGoalField}
          returnKeyType="next"
        />
      </Pressable>

      <Pressable onPressIn={focusNoteField} accessibilityRole="none">
        <TextInput
          ref={noteRef}
          style={[styles.input, styles.noteInput]}
          placeholder="What's the next small move?"
          placeholderTextColor={colors.lavender}
          value={note}
          onChangeText={setNote}
          onFocus={onFocusNoteField}
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
