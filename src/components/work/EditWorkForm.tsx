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
};

export default function EditWorkForm({
  item,
  onSave,
  onCancel,
  onFocusNoteField,
  onBlurNoteField,
}: {
  item: WorkItem;
  onSave: (edits: WorkItemEdits) => void;
  onCancel: () => void;
  // Keyboard-safe scroll: report this form's bottom edge (y + height) within
  // the parent ScrollView when the lower note field focuses; signal blur so
  // the parent can restore normal padding. Mirrors the WorkCard add-step path.
  onFocusNoteField?: (formBottomY: number) => void;
  onBlurNoteField?: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [project, setProject] = useState(item.project);
  const [dueDate, setDueDate] = useState(item.dueDate ?? "");
  const [note, setNote] = useState(item.note);

  // Captured from onLayout: this form's top offset and height within the
  // scroll content, so the parent can scroll the note field above the keyboard
  // regardless of where in the list the project sits.
  const formTopRef = useRef(0);
  const formHeightRef = useRef(0);
  const noteRef = useRef<TextInput>(null);

  const focusNoteField = () => {
    noteRef.current?.focus();
    onFocusNoteField?.(formTopRef.current + formHeightRef.current);
  };

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      project: project.trim(),
      note: note.trim(),
      dueDate: dueDate.trim() || undefined,
    });
  };

  return (
    <Card
      onLayout={(e) => {
        formTopRef.current = e.nativeEvent.layout.y;
        formHeightRef.current = e.nativeEvent.layout.height;
      }}
    >
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

      <Pressable onPressIn={focusNoteField} accessibilityRole="none">
        <TextInput
          ref={noteRef}
          style={[styles.input, styles.noteInput]}
          placeholder="What's the next small move?"
          placeholderTextColor={colors.lavender}
          value={note}
          onChangeText={setNote}
          onFocus={() =>
            onFocusNoteField?.(formTopRef.current + formHeightRef.current)
          }
          onBlur={onBlurNoteField}
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
