"use client";

import { useState, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { GuideMessage } from "@/lib/types";

const STORAGE_KEY = "sh-guide-history";

export interface GuideResponse {
  content: string;
  suggestions?: string[];
  createdAt: string;
}

export function useGuide() {
  const [messages, setMessages, isHydrated] = useLocalStorage<GuideMessage[]>(
    STORAGE_KEY,
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken } = useAuth();
  const idCounter = useRef(0);

  const nextId = useCallback(() => {
    idCounter.current += 1;
    return `msg-${Date.now()}-${idCounter.current}`;
  }, []);

  const send = useCallback(
    async (
      message: string,
      context?: Record<string, unknown>
    ): Promise<GuideResponse | null> => {
      const userMsg: GuideMessage = {
        id: nextId(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const res = await fetch("/api/guide", {
          method: "POST",
          headers,
          body: JSON.stringify({ message, context }),
        });

        if (res.status === 401) {
          throw new Error("auth");
        }

        if (res.status === 429) {
          const data = await res.json();
          const limitMsg: GuideMessage = {
            id: nextId(),
            role: "assistant",
            content:
              data.error ||
              "You've reached today's limit. The Guide will be ready again tomorrow morning.",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, limitMsg]);
          return null;
        }

        if (!res.ok) {
          throw new Error(`Guide API error: ${res.status}`);
        }

        const data: GuideResponse = await res.json();

        const assistantMsg: GuideMessage = {
          id: nextId(),
          role: "assistant",
          content: data.content,
          timestamp: data.createdAt,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        return data;
      } catch (err) {
        const isAuthError =
          err instanceof Error && err.message === "auth";
        const errorMsg: GuideMessage = {
          id: nextId(),
          role: "assistant",
          content: isAuthError
            ? "Your session expired. Please sign in again."
            : "I couldn't connect just now. Try again in a moment — I'm not going anywhere.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [nextId, setMessages, accessToken]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .at(-1);

  return {
    messages,
    isLoading,
    isHydrated,
    send,
    clearHistory,
    lastAssistantMessage,
  };
}
