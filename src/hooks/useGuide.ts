import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAsyncStorage } from "./useAsyncStorage";

export interface GuideMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface GuideResponse {
  content: string;
  conversationId: string;
  suggestions?: string[];
  createdAt: string;
}

const LOCAL_KEY = "sh-guide-recent";
const MAX_LOCAL = 50;

export function useGuide() {
  const [localMessages, setLocalMessages, isHydrated] = useAsyncStorage<
    GuideMessage[]
  >(LOCAL_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

      setLocalMessages((prev) => [...prev, userMsg].slice(-MAX_LOCAL));
      setIsLoading(true);
      setSuggestions([]);

      try {
        const { data, error } = await supabase.functions.invoke(
          "studio-hour-guide",
          {
            body: {
              message,
              context,
              conversationId,
            },
          }
        );

        if (error) {
          throw new Error(error.message ?? "Guide function error");
        }

        if (data?.error) {
          const errorMsg: GuideMessage = {
            id: nextId(),
            role: "assistant",
            content: data.error,
            timestamp: new Date().toISOString(),
          };
          setLocalMessages((prev) =>
            [...prev, errorMsg].slice(-MAX_LOCAL)
          );
          return null;
        }

        const response = data as GuideResponse;

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        const assistantMsg: GuideMessage = {
          id: nextId(),
          role: "assistant",
          content: response.content,
          timestamp: response.createdAt,
        };

        setLocalMessages((prev) =>
          [...prev, assistantMsg].slice(-MAX_LOCAL)
        );

        if (response.suggestions) {
          setSuggestions(response.suggestions);
        }

        return response;
      } catch {
        const errorMsg: GuideMessage = {
          id: nextId(),
          role: "assistant",
          content:
            "I couldn't connect just now. Try again in a moment — I'm not going anywhere.",
          timestamp: new Date().toISOString(),
        };
        setLocalMessages((prev) =>
          [...prev, errorMsg].slice(-MAX_LOCAL)
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [nextId, setLocalMessages, conversationId]
  );

  const clearHistory = useCallback(() => {
    setLocalMessages([]);
    setConversationId(null);
    setSuggestions([]);
  }, [setLocalMessages]);

  const lastAssistantMessage = localMessages
    .filter((m) => m.role === "assistant")
    .at(-1);

  return {
    messages: localMessages,
    isLoading,
    isHydrated,
    suggestions,
    send,
    clearHistory,
    lastAssistantMessage,
  };
}
