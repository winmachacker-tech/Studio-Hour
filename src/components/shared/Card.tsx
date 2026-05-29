import React from "react";
import {
  View,
  StyleSheet,
  type ViewStyle,
  type LayoutChangeEvent,
} from "react-native";
import { colors } from "../../lib/theme";

type CardVariant = "default" | "quiet" | "feature" | "gold";

const VARIANTS: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: "rgba(37, 22, 64, 0.55)",
    borderColor: colors.line,
  },
  quiet: {
    backgroundColor: "rgba(15, 40, 40, 0.35)",
    borderColor: colors.line,
  },
  feature: {
    backgroundColor: "rgba(37, 22, 64, 0.55)",
    borderColor: "rgba(17, 153, 153, 0.2)",
  },
  gold: {
    backgroundColor: "rgba(37, 22, 64, 0.55)",
    borderColor: "rgba(212, 168, 67, 0.2)",
  },
};

export default function Card({
  variant = "default",
  children,
  style,
  onLayout,
}: {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View style={[styles.card, VARIANTS[variant], style]} onLayout={onLayout}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
});
