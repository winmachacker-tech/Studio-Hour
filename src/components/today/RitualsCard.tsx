"use client";

import Eyebrow from "@/components/shared/Eyebrow";
import type { Ritual } from "@/lib/types";

export default function RitualsCard({
  rituals,
  doneCount,
  total,
  onToggle,
}: {
  rituals: Ritual[];
  doneCount: number;
  total: number;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="sh-card sh-card-quiet">
      <div className="row-between">
        <Eyebrow>today&rsquo;s small rituals</Eyebrow>
        <span className="meta">
          {doneCount} of {total}
        </span>
      </div>
      <ul className="ritual-list">
        {rituals.map((ritual) => (
          <li
            key={ritual.id}
            className={`ritual ${ritual.done ? "is-on" : ""}`}
            onClick={() => onToggle(ritual.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(ritual.id);
              }
            }}
          >
            <span className="check">{"✓"}</span>
            <span className="label-text">{ritual.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
