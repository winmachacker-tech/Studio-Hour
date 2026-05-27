import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";

export default function FilterRow({
  filters,
  active,
  onChange,
}: {
  filters: string[];
  active: string;
  onChange: (filter: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {filters.map((f) => (
        <Pressable
          key={f}
          style={[styles.pill, active === f && styles.pillActive]}
          onPress={() => onChange(f)}
        >
          <Text style={[styles.pillText, active === f && styles.pillTextActive]}>
            {f}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  row: {
    gap: 6,
    paddingRight: 4,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "transparent",
  },
  pillActive: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(17, 153, 153, 0.12)",
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.lavender,
  },
  pillTextActive: {
    color: colors.teal,
  },
});
