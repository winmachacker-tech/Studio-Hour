import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../components/shared/Eyebrow";
import PromptStack from "../components/guide/PromptStack";
import SettingsModal from "../components/settings/SettingsModal";
import Composer from "../components/guide/Composer";
import { useGuide } from "../hooks/useGuide";
import { useCheckIn } from "../hooks/useCheckIn";
import { useSchedule } from "../hooks/useSchedule";
import { useTasks } from "../hooks/useTasks";
import { useIdeas } from "../hooks/useIdeas";
import { useRituals } from "../hooks/useRituals";
import { colors, fonts } from "../lib/theme";

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isLoading, suggestions, send } = useGuide();
  const { checkIn } = useCheckIn();
  const { blocks } = useSchedule();
  const { items: workItems } = useTasks();
  const { items: ideas } = useIdeas();
  const { rituals } = useRituals();

  const scrollRef = useRef<ScrollView>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasConversation = messages.length > 0;

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, isLoading]);

  const buildContext = useCallback(() => {
    return {
      checkIn: checkIn.completed
        ? {
            mood: checkIn.mood,
            energy: checkIn.energy,
            focus: checkIn.focus,
            overwhelm: checkIn.overwhelm,
            completed: checkIn.completed,
          }
        : undefined,
      scheduleBlocks: blocks.map((b) => ({
        time: b.time,
        title: b.title,
        type: b.type,
      })),
      rituals: rituals.map((r) => ({ text: r.text, done: r.done })),
      openWorkItems: workItems
        .filter((w) => w.status !== "Done")
        .map((w) => ({
          title: w.title,
          status: w.status,
          energy: w.energy,
          group: w.group,
        })),
      ideas: ideas.slice(0, 6).map((i) => ({
        title: i.title,
        status: i.status,
        platform: i.platform,
      })),
    };
  }, [checkIn, blocks, rituals, workItems, ideas]);

  const handleSend = useCallback(
    (message: string) => {
      send(message, buildContext());
    },
    [send, buildContext]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 8 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Eyebrow color={colors.teal}>studio guide</Eyebrow>
            <Pressable
              onPress={() => setSettingsOpen(true)}
              style={({ pressed }) => [
                styles.gearButton,
                pressed && styles.gearButtonPressed,
              ]}
              hitSlop={10}
            >
              <Text style={styles.gearIcon}>⚙</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>What's on your mind?</Text>
          {!hasConversation && (
            <Text style={styles.subtitle}>
              Your private planning space. Ask anything — the Guide knows your
              studio.
            </Text>
          )}
        </View>

        {!hasConversation && (
          <PromptStack onSelect={handleSend} disabled={isLoading} />
        )}

        {hasConversation && (
          <View style={styles.thread}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.role === "user"
                    ? styles.bubbleUser
                    : styles.bubbleAssistant,
                ]}
              >
                {msg.role === "assistant" && (
                  <Text style={styles.bubbleLabel}>Guide</Text>
                )}
                <Text
                  style={
                    msg.role === "user"
                      ? styles.bubbleTextUser
                      : styles.bubbleTextAssistant
                  }
                >
                  {msg.content}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <Text style={styles.bubbleLabel}>Guide</Text>
                <Text style={styles.thinking}>· · ·</Text>
              </View>
            )}
            {suggestions.length > 0 && !isLoading && (
              <View style={styles.suggestions}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [
                      styles.sugTile,
                      pressed && styles.sugTilePressed,
                    ]}
                    onPress={() => handleSend(s)}
                  >
                    <Text style={styles.sugText}>{s}</Text>
                    <Text style={styles.sugArrow}>→</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {!hasConversation && (
          <Text style={styles.foot}>
            — picks up where you left off.
          </Text>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 68 }}>
        <Composer onSend={handleSend} isLoading={isLoading} />
      </View>

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.nightPlum,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
  },
  header: {
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  gearButtonPressed: {
    backgroundColor: "rgba(245, 238, 248, 0.08)",
  },
  gearIcon: {
    fontSize: 16,
    color: colors.lavender,
    opacity: 0.7,
  },
  title: {
    fontFamily: fonts.light,
    fontStyle: "italic",
    fontSize: 30,
    letterSpacing: -0.7,
    color: colors.creamWarm,
    marginTop: 6,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 22,
    color: colors.lavender,
    maxWidth: 300,
  },
  thread: {
    gap: 16,
    marginBottom: 16,
  },
  bubble: {
    maxWidth: "92%",
  },
  bubbleUser: {
    alignSelf: "flex-end",
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
  },
  bubbleLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.teal,
    opacity: 0.8,
    marginBottom: 6,
  },
  bubbleTextUser: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    backgroundColor: "rgba(17, 153, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(17, 153, 153, 0.25)",
    overflow: "hidden",
  },
  bubbleTextAssistant: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 15.5,
    lineHeight: 23,
    color: colors.cream,
    letterSpacing: -0.1,
  },
  thinking: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.teal,
    letterSpacing: 4,
    opacity: 0.5,
  },
  suggestions: {
    gap: 7,
    marginTop: 4,
  },
  sugTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(15, 40, 40, 0.42)",
  },
  sugTilePressed: {
    borderColor: "rgba(17, 153, 153, 0.4)",
    backgroundColor: "rgba(15, 40, 40, 0.6)",
  },
  sugText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.cream,
    flex: 1,
  },
  sugArrow: {
    fontSize: 14,
    color: colors.teal,
  },
  foot: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 13,
    color: colors.lavender,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 22,
  },
});
