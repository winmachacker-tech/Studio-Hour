import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import { useCalendarConnection } from "../../hooks/useCalendarConnection";

export default function CalendarConnectionCard() {
  const { state, isConnecting, error, connect } = useCalendarConnection();

  if (state === "loading") return null;

  if (state === "connected") {
    return (
      <Card variant="quiet">
        <Eyebrow color={colors.teal}>google calendar</Eyebrow>
        <Text style={styles.status}>Connected</Text>
      </Card>
    );
  }

  const isExpired = state === "expired";

  return (
    <Card variant="quiet">
      <Eyebrow color={colors.lavender}>google calendar</Eyebrow>
      <Text style={styles.label}>
        {isExpired ? "Reconnect Google Calendar" : "Connect Google Calendar"}
      </Text>
      <Text style={styles.description}>
        Read-only. Studio Hour uses this to understand your schedule.
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isConnecting && styles.buttonDisabled,
        ]}
        onPress={connect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color={colors.nightPlum} />
        ) : (
          <Text style={styles.buttonText}>
            {isExpired ? "Reconnect" : "Connect"}
          </Text>
        )}
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.cream,
    marginTop: 8,
  },
  description: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 19,
    color: colors.lavender,
    marginTop: 4,
    marginBottom: 14,
  },
  status: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 13,
    color: colors.teal,
    marginTop: 6,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.rose,
    marginBottom: 10,
  },
  button: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.teal,
  },
  buttonPressed: {
    backgroundColor: colors.tealSoft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.nightPlum,
    letterSpacing: 0.3,
  },
});
