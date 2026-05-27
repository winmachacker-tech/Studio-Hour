"use client";

import PlatformTag from "./PlatformTag";
import type { Idea } from "@/lib/types";

export default function IdeaCard({
  idea,
  onCycleStatus,
}: {
  idea: Idea;
  onCycleStatus: () => void;
}) {
  return (
    <article className={`idea-card status-${idea.status}`}>
      <div className="idea-head">
        <PlatformTag platform={idea.platform} />
        <span
          className={`idea-status status-${idea.status}`}
          role="button"
          tabIndex={0}
          onClick={onCycleStatus}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCycleStatus();
            }
          }}
          style={{ cursor: "pointer" }}
        >
          {idea.status}
        </span>
      </div>
      <h3 className="idea-title">{idea.title}</h3>
      {idea.note && <p className="idea-note">{idea.note}</p>}
    </article>
  );
}
