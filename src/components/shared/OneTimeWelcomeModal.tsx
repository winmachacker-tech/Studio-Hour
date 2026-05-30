import React from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { useAsyncStorage } from "../../hooks/useAsyncStorage";
import { colors, fonts } from "../../lib/theme";

// Shown once per install. Persisted locally via the app's existing
// useAsyncStorage pattern — no login or backend state required.
const WELCOME_SEEN_KEY = "sh-welcome-seen-v1";

export default function OneTimeWelcomeModal() {
  const [seen, setSeen, isHydrated] = useAsyncStorage<boolean>(
    WELCOME_SEEN_KEY,
    false
  );

  // Wait for storage to hydrate so returning users never see a flash.
  const visible = isHydrated && !seen;

  const dismiss = () => setSeen(true);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>For Danielle</Text>
          <Text style={styles.message}>
            I really hope you enjoy this app as much as I loved building it for
            you
          </Text>
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Start creating</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(19, 13, 26, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.studioPlum,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    color: colors.gold,
    marginBottom: 16,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 29,
    color: colors.cream,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 26,
  },
  button: {
    alignSelf: "stretch",
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonPressed: {
    backgroundColor: colors.tealSoft,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.nightPlum,
    letterSpacing: 0.2,
  },
});
