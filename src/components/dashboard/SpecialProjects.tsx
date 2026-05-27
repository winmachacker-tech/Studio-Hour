import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import ProgressRail from "./ProgressRail";
import { colors, fonts } from "../../lib/theme";
import type { SpecialProject } from "../../lib/types";

export default function SpecialProjects({
  projects,
}: {
  projects: SpecialProject[];
}) {
  if (projects.length === 0) return null;

  return (
    <Card>
      <Eyebrow>special projects</Eyebrow>
      <View style={styles.row}>
        {projects.map((project) => (
          <View key={project.id} style={styles.projectCard}>
            <Text
              style={[
                styles.tag,
                project.tagColor ? { color: project.tagColor } : undefined,
              ]}
            >
              {project.tag}
            </Text>
            <Text style={styles.title}>{project.title}</Text>
            <Text style={styles.desc}>{project.description}</Text>
            <ProgressRail
              percent={project.progress}
              color={project.progressColor}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  projectCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: "rgba(15, 8, 22, 0.3)",
  },
  tag: {
    fontFamily: fonts.semiBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.gold,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.cream,
    marginBottom: 3,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.lavender,
  },
});
