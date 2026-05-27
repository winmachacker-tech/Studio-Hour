import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

export default function DotScale({
  value,
  max = 5,
  color,
  onChange,
}: {
  value: number;
  max?: number;
  color: string;
  onChange?: (value: number) => void;
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        const dotStyle = [
          styles.dot,
          {
            backgroundColor: filled ? color : "transparent",
            borderColor: filled ? color : "rgba(245,238,248,0.22)",
          },
        ];

        if (onChange) {
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i + 1)}
              hitSlop={6}
              accessibilityLabel={`Set to ${i + 1}`}
              accessibilityRole="button"
            >
              <View style={dotStyle} />
            </Pressable>
          );
        }

        return <View key={i} style={dotStyle} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
});
