"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginCard() {
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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-eyebrow">studio hour</span>
        <hr className="login-rule" />

        <h1 className="login-title">
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="login-sub">
          {mode === "login"
            ? "Sign in to your private studio."
            : "One account, then you’re in."}
        </p>

        <input
          className="login-input"
          type="email"
          placeholder="danielle@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading}
          autoComplete="email"
          autoFocus
        />
        <input
          className="login-input login-input-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        <button
          className="login-submit"
          onClick={handleSubmit}
          disabled={!email.trim() || !password || isLoading}
          type="button"
        >
          {isLoading
            ? "One moment…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
          {!isLoading && (
            <span className="arr" aria-hidden="true">
              &rarr;
            </span>
          )}
        </button>

        {error && <p className="login-error">{error}</p>}

        <button
          className="login-switch"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          type="button"
        >
          {mode === "login" ? "Create account" : "Back to log in"}
        </button>

        <p className="login-foot">
          &mdash; your private studio companion.
        </p>
      </div>
    </div>
  );
}
