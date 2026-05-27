import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts } from "../lib/theme";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>STUDIO HOUR</Text>
      <View style={styles.rule} />
      <Text style={styles.title}>You're in.</Text>
      <Text style={styles.subtitle}>
        Signed in as {user?.email ?? "unknown"}
      </Text>
      <Text style={styles.body}>
        Tabs and screens are coming in the next phase.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.signOut,
          pressed && styles.signOutPressed,
        ]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.foot}>— your private studio companion.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.nightPlum,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 1.9,
    color: colors.teal,
    marginBottom: 14,
  },
  rule: {
    width: 48,
    height: 1,
    backgroundColor: colors.lineStrong,
    marginBottom: 28,
  },
  title: {
    fontFamily: fonts.light,
    fontSize: 32,
    color: colors.creamWarm,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.lavender,
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.lavender,
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 32,
  },
  signOut: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  signOutPressed: {
    borderColor: colors.rose,
  },
  signOutText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.lavender,
    letterSpacing: 0.3,
  },
  foot: {
    marginTop: 32,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.lavender,
    opacity: 0.7,
    textAlign: "center",
  },
});
