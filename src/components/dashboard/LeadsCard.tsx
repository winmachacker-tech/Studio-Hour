import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import StatusChip from "../shared/StatusChip";
import { colors, fonts } from "../../lib/theme";
import type { MuralLead } from "../../lib/types";

export default function LeadsCard({ leads }: { leads: MuralLead[] }) {
  if (leads.length === 0) return null;

  return (
    <Card>
      <Eyebrow color={colors.teal}>mural leads</Eyebrow>
      <View style={styles.list}>
        {leads.map((lead) => (
          <View key={lead.id} style={styles.item}>
            <Text style={styles.name}>{lead.name}</Text>
            <Text style={styles.desc}>{lead.description}</Text>
            <StatusChip status={lead.status} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 12,
    gap: 16,
  },
  item: {
    gap: 4,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.cream,
    letterSpacing: -0.1,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.lavender,
    marginBottom: 4,
  },
});
