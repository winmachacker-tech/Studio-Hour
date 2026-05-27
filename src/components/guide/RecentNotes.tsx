"use client";

import type { GuideMessage } from "@/lib/types";

function formatWhen(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${days[date.getDay()]} ${hour12}:${m} ${ampm}`;
}

export default function RecentNotes({
  messages,
}: {
  messages: GuideMessage[];
}) {
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const recent = assistantMessages.slice(-3).reverse();

  if (recent.length === 0) return null;

  return (
    <section>
      <span className="eyebrow">recent notes</span>
      <ul className="recent-list">
        {recent.map((msg) => (
          <li key={msg.id}>
            <span className="when">{formatWhen(msg.timestamp)}</span>
            <p className="what">{msg.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
