import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts } from "../lib/theme";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) return;
    setIsLoading(true);
    setError("");

    const result =
      mode === "login"
        ? await signIn(trimmed, password)
        : await signUp(trimmed, password);

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>STUDIO HOUR</Text>
        <View style={styles.rule} />

        <Text style={styles.title}>
          {mode === "login" ? "Welcome back." : "Create your account."}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Sign in to your private studio."
            : "One account, then you're in."}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.lavender}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor={colors.lavender}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          editable={!isLoading}
          onSubmitEditing={handleSubmit}
        />

        <Pressable
          style={({ pressed }) => [
            styles.submit,
            (!email.trim() || !password || isLoading) && styles.submitDisabled,
            pressed && styles.submitPressed,
          ]}
          onPress={handleSubmit}
          disabled={!email.trim() || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.cream} size="small" />
          ) : (
            <Text style={styles.submitText}>
              {mode === "login" ? "Log in" : "Create account"}
            </Text>
          )}
        </Pressable>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={styles.switchButton}
          onPress={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          <Text style={styles.switchText}>
            {mode === "login" ? "Create account" : "Back to log in"}
          </Text>
        </Pressable>

        <Text style={styles.foot}>— your private studio companion.</Text>
      </View>
    </KeyboardAvoidingView>
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
  card: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
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
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: "rgba(15, 8, 22, 0.6)",
    color: colors.cream,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  passwordInput: {
    marginTop: 10,
  },
  submit: {
    width: "100%",
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17, 153, 153, 0.5)",
    backgroundColor: "rgba(17, 153, 153, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitPressed: {
    backgroundColor: "rgba(17, 153, 153, 0.22)",
    borderColor: colors.teal,
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.cream,
    letterSpacing: 0.3,
  },
  error: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.rose,
    textAlign: "center",
  },
  switchButton: {
    marginTop: 18,
    padding: 4,
  },
  switchText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.lavender,
    letterSpacing: 0.4,
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
