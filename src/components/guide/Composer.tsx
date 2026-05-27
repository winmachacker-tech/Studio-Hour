import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { colors, fonts } from "../../lib/theme";

export default function Composer({
  onSend,
  isLoading,
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.composer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={isLoading ? "Thinking…" : "Ask the Guide anything…"}
          placeholderTextColor={colors.lavender}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          editable={!isLoading}
          returnKeyType="send"
          autoCorrect
        />
        <Pressable
          style={[
            styles.send,
            (!value.trim() || isLoading) && styles.sendDisabled,
          ]}
          onPress={submit}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.creamWarm} size="small" />
          ) : (
            <Text style={styles.sendText}>↑</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: "rgba(15, 8, 22, 0.85)",
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 15,
    color: colors.cream,
    paddingVertical: 8,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.35,
  },
  sendText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.creamWarm,
  },
});
