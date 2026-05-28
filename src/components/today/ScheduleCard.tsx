import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { ScheduleBlock } from "../../lib/types";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];

function blockCount(n: number): string {
  return `${WORDS[n] ?? n} quiet block${n === 1 ? "" : "s"}`;
}

const TYPE_COLORS: Record<string, string> = {
  protected: colors.gold,
  now: colors.teal,
  normal: colors.studioPlum2,
  "soft-block": colors.studioPlum2,
};

export default function ScheduleCard({ blocks }: { blocks: ScheduleBlock[] }) {
  if (blocks.length === 0) {
    return (
      <Card>
        <View style={styles.header}>
          <Eyebrow>today's plan</Eyebrow>
        </View>
        <Text style={styles.emptyTitle}>No calendar events today</Text>
        <Text style={styles.emptySubtitle}>Your studio time is open.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Eyebrow>today's plan</Eyebrow>
        <Text style={styles.meta}>{blockCount(blocks.length)}</Text>
      </View>
      <View style={styles.timeline}>
        {blocks.map((block, i) => (
          <View key={block.id} style={styles.block}>
            <View style={styles.timeCol}>
              <Text style={styles.time}>{block.time}</Text>
              {i < blocks.length - 1 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: TYPE_COLORS[block.type] ?? colors.studioPlum2 },
                  ]}
                />
              )}
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.blockTitle,
                    block.type === "protected" && styles.protectedTitle,
                  ]}
                >
                  {block.title}
                </Text>
                {block.type === "protected" && (
                  <Text style={styles.glyph}>✦</Text>
                )}
              </View>
              <Text style={styles.blockMeta}>{block.meta}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.lavender,
    letterSpacing: 0.4,
  },
  timeline: {
    gap: 0,
  },
  block: {
    flexDirection: "row",
    minHeight: 52,
  },
  timeCol: {
    width: 52,
    alignItems: "flex-start",
    paddingTop: 2,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.lavender,
    letterSpacing: 0.3,
  },
  line: {
    width: 1,
    flex: 1,
    marginLeft: 6,
    marginTop: 6,
    marginBottom: 4,
    opacity: 0.4,
  },
  content: {
    flex: 1,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  blockTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.cream,
    letterSpacing: -0.1,
  },
  protectedTitle: {
    color: colors.gold,
  },
  glyph: {
    fontSize: 10,
    color: colors.gold,
  },
  blockMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.lavender,
    marginTop: 3,
    lineHeight: 17,
  },
  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.cream,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 13,
    color: colors.lavender,
  },
});
