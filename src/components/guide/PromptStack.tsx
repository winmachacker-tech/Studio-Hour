import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";

const PROMPTS = [
  { label: "Plan my day", key: "plan-day" },
  { label: "Help me choose what to work on", key: "choose-work" },
  { label: "Give me a low-energy plan", key: "low-energy" },
  { label: "Turn this idea into a post", key: "idea-post" },
  { label: "Help me write a follow-up message", key: "follow-up" },
];

export default function PromptStack({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.stack}>
      {PROMPTS.map((p) => (
        <Pressable
          key={p.key}
          style={({ pressed }) => [
            styles.tile,
            pressed && styles.tilePressed,
            disabled && styles.tileDisabled,
          ]}
          onPress={() => onSelect(p.label)}
          disabled={disabled}
        >
          <Text style={styles.label}>{p.label}</Text>
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 9,
    marginBottom: 22,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(15, 40, 40, 0.42)",
  },
  tilePressed: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(15, 40, 40, 0.6)",
  },
  tileDisabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.cream,
    letterSpacing: -0.1,
    flex: 1,
  },
  arrow: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.teal,
  },
});
