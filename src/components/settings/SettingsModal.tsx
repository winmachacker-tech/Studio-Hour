import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../shared/Eyebrow";
import CalendarConnectionCard from "./CalendarConnectionCard";
import { colors, fonts } from "../../lib/theme";

export default function SettingsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            hitSlop={12}
          >
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Eyebrow color={colors.lavender}>Integrations</Eyebrow>
          <View style={styles.section}>
            <CalendarConnectionCard />
          </View>

          <Text style={styles.footer}>
            More settings will live here as Studio Hour grows.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.nightPlum,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.cream,
    letterSpacing: -0.3,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  closeButtonPressed: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(15, 40, 40, 0.4)",
  },
  closeText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.teal,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginTop: 12,
  },
  footer: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 12,
    color: colors.lavender,
    opacity: 0.5,
    textAlign: "center",
    marginTop: 32,
  },
});
