import React, { useState } from "react";
import { Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import Card from "../shared/Card";
import Eyebrow from "../shared/Eyebrow";
import { colors, fonts } from "../../lib/theme";
import { useCalendarConnection } from "../../hooks/useCalendarConnection";
import { supabase } from "../../lib/supabase";
import { getCalendarDay } from "../../lib/dates";
import { requestCalendarSync } from "../../lib/calendar/syncSignal";

type SyncStatus =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "synced"; count: number }
  | { state: "empty" }
  | { state: "error"; message: string }
  | { state: "reauth" };

export default function CalendarConnectionCard() {
  const { state, isConnecting, error, connect, refresh } =
    useCalendarConnection();
  const [sync, setSync] = useState<SyncStatus>({ state: "idle" });

  if (state === "loading") return null;

  async function handleSync() {
    setSync({ state: "syncing" });
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke(
        "calendar-sync",
        { body: { date: getCalendarDay() } }
      );

      if (invokeErr || !data) {
        setSync({
          state: "error",
          message: "Couldn't sync calendar. Try again.",
        });
        return;
      }

      if (data.error === "reauth_required") {
        setSync({ state: "reauth" });
        return;
      }

      if (data.error) {
        setSync({
          state: "error",
          message: "Couldn't sync calendar. Try again.",
        });
        return;
      }

      const count = Array.isArray(data.blocks) ? data.blocks.length : 0;
      if (count > 0) {
        setSync({ state: "synced", count });
      } else {
        setSync({ state: "empty" });
      }

      requestCalendarSync();
    } catch {
      setSync({
        state: "error",
        message: "Couldn't sync calendar. Try again.",
      });
    }
  }

  async function handleReconnect() {
    const result = await connect();
    if (result.connected) {
      setSync({ state: "idle" });
      await refresh();
      requestCalendarSync();
    }
  }

  const needsReauth = state === "expired" || sync.state === "reauth";
  const isNotConnected = state === "not_connected";

  // ── Not connected or needs reauth → show connect/reconnect ─────────

  if (isNotConnected || needsReauth) {
    const label = isNotConnected
      ? "Connect Google Calendar"
      : "Reconnect Google Calendar";
    const buttonLabel = isNotConnected ? "Connect" : "Reconnect";

    return (
      <Card variant="quiet">
        <Eyebrow color={colors.lavender}>google calendar</Eyebrow>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>
          Read-only. Studio Hour uses this to understand your schedule.
        </Text>
        {error && <Text style={styles.syncError}>{error}</Text>}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isConnecting && styles.buttonDisabled,
          ]}
          onPress={handleReconnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color={colors.nightPlum} />
          ) : (
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          )}
        </Pressable>
      </Card>
    );
  }

  // ── Connected → show sync ──────────────────────────────────────────

  const isBusy = sync.state === "syncing" || isConnecting;

  return (
    <Card variant="quiet">
      <Eyebrow color={colors.teal}>google calendar</Eyebrow>
      <Text style={styles.connectedLabel}>Connected</Text>
      {sync.state === "synced" && (
        <Text style={styles.syncStatus}>
          {sync.count === 1
            ? "Found 1 event today"
            : `Found ${sync.count} events today`}
        </Text>
      )}
      {sync.state === "empty" && (
        <Text style={styles.syncStatus}>No calendar events found today</Text>
      )}
      {sync.state === "error" && (
        <Text style={styles.syncError}>{sync.message}</Text>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.syncButton,
          pressed && styles.syncButtonPressed,
          isBusy && styles.buttonDisabled,
        ]}
        onPress={handleSync}
        disabled={isBusy}
      >
        {sync.state === "syncing" ? (
          <ActivityIndicator size="small" color={colors.teal} />
        ) : (
          <Text style={styles.syncButtonText}>Sync now</Text>
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
  connectedLabel: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 13,
    color: colors.teal,
    marginTop: 6,
    marginBottom: 10,
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
  syncStatus: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 12,
    color: colors.lavender,
    marginBottom: 10,
  },
  syncError: {
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
  syncButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  syncButtonPressed: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(15, 40, 40, 0.4)",
  },
  syncButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.teal,
    letterSpacing: 0.3,
  },
});
