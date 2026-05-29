import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import StatusChip from "../shared/StatusChip";
import EnergyChip from "../shared/EnergyChip";
import { colors, fonts } from "../../lib/theme";
import type { WorkItem } from "../../lib/types";

export default function WorkCard({
  item,
  onToggleDone,
  onCycleStatus,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  item: WorkItem;
  onToggleDone: () => void;
  onCycleStatus: () => void;
  onAddSubtask: (text: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}) {
  const isDone = item.status === "Done";
  const subtasks = item.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  // Derive from subtasks so the bar always matches the "n/m" count shown.
  const progressPct =
    subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const [expanded, setExpanded] = useState(false);
  const [newStep, setNewStep] = useState("");

  const submitStep = () => {
    const trimmed = newStep.trim();
    if (!trimmed) return;
    onAddSubtask(trimmed);
    setNewStep("");
  };

  return (
    <Card style={isDone ? styles.done : undefined}>
      <Eyebrow color={isDone ? colors.lavender : undefined}>
        {item.project}
      </Eyebrow>
      <Pressable onPress={onToggleDone}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
        >
          {item.title}
        </Text>
      </Pressable>
      <Text style={styles.note}>{item.note}</Text>
      <View style={styles.chipRow}>
        <StatusChip status={item.status} onPress={onCycleStatus} />
        <EnergyChip level={item.energy} />
      </View>

      <Pressable
        style={styles.stepsToggle}
        onPress={() => setExpanded((v) => !v)}
        accessibilityLabel={
          subtasks.length > 0
            ? `Steps, ${doneCount} of ${subtasks.length} done`
            : "Add steps"
        }
      >
        <Text style={styles.stepsToggleText}>
          {subtasks.length > 0
            ? `steps · ${doneCount}/${subtasks.length}`
            : "＋ add steps"}
        </Text>
        {subtasks.length > 0 && (
          <Text style={styles.chevron}>{expanded ? "▾" : "▸"}</Text>
        )}
      </Pressable>

      {subtasks.length > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{progressPct}%</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.steps}>
          {subtasks.map((s) => (
            <View key={s.id} style={styles.stepRow}>
              <Pressable
                style={[styles.checkbox, s.done && styles.checkboxDone]}
                onPress={() => onToggleSubtask(s.id)}
                accessibilityLabel={
                  s.done ? `Mark "${s.text}" not done` : `Mark "${s.text}" done`
                }
                hitSlop={6}
              >
                {s.done && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
              <Text style={[styles.stepText, s.done && styles.stepTextDone]}>
                {s.text}
              </Text>
              <Pressable
                onPress={() => onDeleteSubtask(s.id)}
                accessibilityLabel={`Delete step "${s.text}"`}
                hitSlop={6}
              >
                <Text style={styles.delete}>✕</Text>
              </Pressable>
            </View>
          ))}

          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add a step…"
              placeholderTextColor={colors.lavender}
              value={newStep}
              onChangeText={setNewStep}
              returnKeyType="done"
              onSubmitEditing={submitStep}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.addBtn, !newStep.trim() && styles.addBtnDisabled]}
              onPress={submitStep}
              disabled={!newStep.trim()}
              accessibilityLabel="Add step"
            >
              <Text style={styles.addBtnText}>＋</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  done: {
    opacity: 0.5,
    borderStyle: "dashed" as const,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 6,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: colors.lavender,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.lavender,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  stepsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 2,
  },
  stepsToggleText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.lavender,
  },
  chevron: {
    fontSize: 11,
    color: colors.lavender,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.teal,
  },
  progressPct: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.lavender,
    minWidth: 30,
    textAlign: "right",
  },
  steps: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    borderColor: "rgba(17, 153, 153, 0.6)",
    backgroundColor: "rgba(17, 153, 153, 0.16)",
  },
  checkmark: {
    fontSize: 11,
    lineHeight: 13,
    color: colors.teal,
    fontFamily: fonts.semiBold,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.cream,
  },
  stepTextDone: {
    textDecorationLine: "line-through",
    color: colors.lavender,
  },
  delete: {
    fontSize: 12,
    color: colors.lavender,
    opacity: 0.6,
    paddingHorizontal: 2,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  addInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(15, 8, 22, 0.5)",
    color: colors.cream,
    fontFamily: fonts.regular,
    fontSize: 13.5,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(17, 153, 153, 0.5)",
    backgroundColor: "rgba(17, 153, 153, 0.14)",
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    fontSize: 15,
    color: colors.teal,
    lineHeight: 18,
  },
});
