import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";
import type { Platform } from "../../lib/types";

const PLATFORM_COLORS: Record<Platform, string> = {
  tiktok: colors.teal,
  instagram: colors.rose,
  facebook: colors.lavender,
  nextdoor: colors.gold,
  artwork: colors.creamWarm,
};

export default function PlatformTag({ platform }: { platform: Platform }) {
  return (
    <Text
      style={[
        styles.tag,
        {
          color: PLATFORM_COLORS[platform],
          borderColor: PLATFORM_COLORS[platform],
          backgroundColor: `${PLATFORM_COLORS[platform]}15`,
        },
      ]}
    >
      {platform}
    </Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontFamily: fonts.semiBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
});
