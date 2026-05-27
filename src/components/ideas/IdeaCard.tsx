import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../shared/Card";
import PlatformTag from "./PlatformTag";
import { colors, fonts } from "../../lib/theme";
import type { Idea } from "../../lib/types";

const STATUS_COLORS: Record<string, string> = {
  saved: colors.teal,
  draft: colors.gold,
  used: colors.lavender,
};

export default function IdeaCard({
  idea,
  onCycleStatus,
}: {
  idea: Idea;
  onCycleStatus: () => void;
}) {
  const isUsed = idea.status === "used";

  return (
    <Card style={isUsed ? styles.used : undefined}>
      <View style={styles.head}>
        <PlatformTag platform={idea.platform} />
        <Pressable onPress={onCycleStatus} hitSlop={6}>
          <Text
            style={[
              styles.status,
              { color: STATUS_COLORS[idea.status] ?? colors.lavender },
            ]}
          >
            {idea.status}
          </Text>
        </Pressable>
      </View>
      <Text style={[styles.title, isUsed && styles.titleUsed]}>
        {idea.title}
      </Text>
      {!!idea.note && (
        <Text style={styles.note}>{idea.note}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  used: {
    opacity: 0.5,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.15,
    color: colors.creamWarm,
    marginBottom: 4,
  },
  titleUsed: {
    color: colors.lavender,
  },
  note: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 12,
    lineHeight: 17,
    color: colors.lavender,
  },
});
