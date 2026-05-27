import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import type { DueItem } from "../../lib/types";

export default function DueSoonCard({ items }: { items: DueItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card variant="gold">
      <Eyebrow color={colors.gold}>due soon</Eyebrow>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={i} style={[styles.item, i > 0 && styles.itemBorder]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.deadline}>{item.deadline}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 10,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.cream,
    flex: 1,
  },
  deadline: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 0.2,
  },
});
