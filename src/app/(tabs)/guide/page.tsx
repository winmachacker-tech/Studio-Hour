"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Eyebrow from "@/components/shared/Eyebrow";
import PromptStack from "@/components/guide/PromptStack";
import RecentNotes from "@/components/guide/RecentNotes";
import Composer from "@/components/guide/Composer";
import { useGuide } from "@/hooks/useGuide";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useSchedule } from "@/hooks/useSchedule";
import { useTasks } from "@/hooks/useTasks";
import { useIdeas } from "@/hooks/useIdeas";
import { useRituals } from "@/hooks/useRituals";

export default function GuidePage() {
  const { messages, isLoading, send, lastAssistantMessage } = useGuide();
  const { checkIn } = useCheckIn();
  const { blocks } = useSchedule();
  const { items: workItems } = useTasks();
  const { items: ideas } = useIdeas();
  const { rituals } = useRituals();

  const [prefill, setPrefill] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationMessages = messages;
  const hasConversation = conversationMessages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const buildContext = useCallback(() => {
    return {
      checkIn: checkIn.completed
        ? {
            mood: checkIn.mood,
            energy: checkIn.energy,
            focus: checkIn.focus,
            overwhelm: checkIn.overwhelm,
            headline: checkIn.headline,
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
    async (message: string) => {
      const ctx = buildContext();
      const response = await send(message, ctx);
      if (response?.suggestions) {
        setSuggestions(response.suggestions);
      } else {
        setSuggestions([]);
      }
    },
    [buildContext, send]
  );

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      handleSend(prompt);
    },
    [handleSend]
  );

  const handleSuggestionTap = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  const clearPrefill = useCallback(() => {
    setPrefill(undefined);
  }, []);

  return (
    <div className="guide-page">
      <header className="sh-page-head">
        <Eyebrow color="var(--teal)">studio guide</Eyebrow>
        <h1 className="sh-page-title is-italic">
          What&rsquo;s on your mind?
        </h1>
        {!hasConversation && (
          <p className="sh-page-sub">
            Your private planning space. Ask anything &mdash; the Guide knows
            your studio.
          </p>
        )}
      </header>

      {!hasConversation && (
        <>
          <PromptStack onSelect={handlePromptSelect} disabled={isLoading} />
          <RecentNotes messages={messages} />
        </>
      )}

      {hasConversation && (
        <div className="guide-thread" ref={scrollRef}>
          {conversationMessages.map((msg) => (
            <div
              key={msg.id}
              className={`guide-bubble ${msg.role === "user" ? "guide-bubble-user" : "guide-bubble-assistant"}`}
            >
              {msg.role === "assistant" && (
                <span className="guide-bubble-label">Guide</span>
              )}
              <p className="guide-bubble-text">{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="guide-bubble guide-bubble-assistant">
              <span className="guide-bubble-label">Guide</span>
              <p className="guide-bubble-text guide-thinking">
                <span className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </p>
            </div>
          )}
          {suggestions.length > 0 && !isLoading && (
            <div className="guide-suggestions">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="prompt-tile prompt-tile-sm"
                  onClick={() => handleSuggestionTap(s)}
                  type="button"
                >
                  <span>{s}</span>
                  <span className="arr" aria-hidden="true">
                    &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Composer
        onSend={handleSend}
        isLoading={isLoading}
        prefill={prefill}
        onPrefillUsed={clearPrefill}
      />

      {!hasConversation && (
        <p className="foot-mark">
          &mdash; picks up where you left off.
        </p>
      )}
    </div>
  );
}
