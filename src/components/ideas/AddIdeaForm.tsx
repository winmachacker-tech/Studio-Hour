import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { Platform, IdeaKind, IdeaStatus } from "../../lib/types";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "nextdoor", label: "Nextdoor" },
  { value: "artwork", label: "Artwork" },
];

const PLATFORM_TO_KIND: Record<Platform, IdeaKind> = {
  tiktok: "Voiceover",
  instagram: "Posts",
  facebook: "Posts",
  nextdoor: "Posts",
  artwork: "Artwork",
};

export default function AddIdeaForm({
  onAdd,
  onClose,
}: {
  onAdd: (idea: {
    title: string;
    platform: Platform;
    status: IdeaStatus;
    note: string;
    kind: IdeaKind;
  }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("artwork");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      platform,
      status: "saved",
      note: note.trim(),
      kind: PLATFORM_TO_KIND[platform],
    });
    onClose();
  };

  return (
    <Card>
      <View style={styles.header}>
        <Eyebrow>new idea</Eyebrow>
        <Pressable onPress={onClose}>
          <Text style={styles.cancel}>cancel</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's the idea?"
        placeholderTextColor={colors.lavender}
        value={title}
        onChangeText={setTitle}
        autoFocus
        returnKeyType="next"
      />

      <View style={styles.platformRow}>
        {PLATFORMS.map((p) => (
          <Pressable
            key={p.value}
            style={[
              styles.platformPill,
              platform === p.value && styles.platformPillActive,
            ]}
            onPress={() => setPlatform(p.value)}
          >
            <Text
              style={[
                styles.platformText,
                platform === p.value && styles.platformTextActive,
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Short note (optional)"
        placeholderTextColor={colors.lavender}
        value={note}
        onChangeText={setNote}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <Pressable
        style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
        onPress={submit}
        disabled={!title.trim()}
      >
        <Text style={styles.saveBtnText}>Save idea</Text>
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
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  platformPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  platformPillActive: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(17, 153, 153, 0.12)",
  },
  platformText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.lavender,
    letterSpacing: 0.3,
  },
  platformTextActive: {
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
