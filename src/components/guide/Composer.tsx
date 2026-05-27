"use client";

import { useState, useRef, useEffect } from "react";

export default function Composer({
  onSend,
  isLoading,
  prefill,
  onPrefillUsed,
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
  prefill?: string;
  onPrefillUsed?: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      onPrefillUsed?.();
      inputRef.current?.focus();
    }
  }, [prefill, onPrefillUsed]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer-wrap">
      <div className="composer">
        <input
          ref={inputRef}
          type="text"
          placeholder={isLoading ? "Thinking…" : "Ask the Guide anything…"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          className="send"
          onClick={submit}
          disabled={!value.trim() || isLoading}
          type="button"
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="send-loading" aria-hidden="true">
              &middot;&middot;
            </span>
          ) : (
            <span aria-hidden="true">&uarr;</span>
          )}
        </button>
      </div>
    </div>
  );
}
