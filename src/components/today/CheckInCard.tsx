"use client";

import { useState } from "react";
import Eyebrow from "@/components/shared/Eyebrow";
import StatePill from "@/components/shared/StatePill";
import type { CheckIn } from "@/lib/types";

const HEADLINES: Record<string, string[]> = {
  low: [
    "Heavy. Go gently today.",
    "Quiet start. Small things count.",
    "Not much in the tank. That’s okay.",
  ],
  mid: [
    "Tender. Steady energy. Open to play.",
    "Settled. The day has room in it.",
    "Even keel. A good place to start from.",
  ],
  high: [
    "Bright and ready. Let the hands move.",
    "Energy to spare. Spend it on the real work.",
    "Sharp. This is the window — use it.",
  ],
};

function pickHeadline(checkIn: CheckIn): string {
  const avg = (checkIn.mood + checkIn.energy + checkIn.focus) / 3;
  const bucket = avg < 2.5 ? "low" : avg < 4 ? "mid" : "high";
  const seed = checkIn.date
    .split("-")
    .reduce((a, b) => a + Number(b), 0);
  const options = HEADLINES[bucket];
  return options[seed % options.length];
}

export default function CheckInCard({
  checkIn,
  onUpdate,
  isHydrated,
}: {
  checkIn: CheckIn;
  onUpdate: (patch: Partial<CheckIn>) => void;
  isHydrated: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const hasValues = checkIn.mood > 0;
  const headline = hasValues ? pickHeadline(checkIn) : "";

  if (!isHydrated) {
    return (
      <section className="sh-card">
        <div className="row-between">
          <Eyebrow>morning check-in</Eyebrow>
        </div>
        <h2 className="sh-card-title">&nbsp;</h2>
      </section>
    );
  }

  if (!hasValues || editing) {
    return (
      <section className="sh-card">
        <div className="row-between">
          <Eyebrow>morning check-in</Eyebrow>
          {editing && (
            <button className="link" onClick={() => setEditing(false)}>
              done
            </button>
          )}
        </div>
        <h2 className="sh-card-title">
          {hasValues ? (
            <em>{pickHeadline(checkIn)}</em>
          ) : (
            <em>How are you feeling?</em>
          )}
        </h2>
        <div className="check-grid">
          <StatePill
            label="mood"
            value={checkIn.mood}
            color="var(--rose)"
            onChange={(v) => onUpdate({ mood: v })}
          />
          <StatePill
            label="energy"
            value={checkIn.energy}
            color="var(--gold)"
            onChange={(v) => onUpdate({ energy: v })}
          />
          <StatePill
            label="focus"
            value={checkIn.focus}
            color="var(--teal)"
            onChange={(v) => onUpdate({ focus: v })}
          />
          <StatePill
            label="overwhelm"
            value={checkIn.overwhelm}
            color="var(--lavender)"
            onChange={(v) => onUpdate({ overwhelm: v })}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="sh-card">
      <div className="row-between">
        <Eyebrow>morning check-in · {checkIn.time}</Eyebrow>
        <button className="link" onClick={() => setEditing(true)}>
          edit
        </button>
      </div>
      <h2 className="sh-card-title">
        <em>{headline}</em>
      </h2>
      <div className="check-grid">
        <StatePill label="mood" value={checkIn.mood} color="var(--rose)" />
        <StatePill
          label="energy"
          value={checkIn.energy}
          color="var(--gold)"
        />
        <StatePill label="focus" value={checkIn.focus} color="var(--teal)" />
        <StatePill
          label="overwhelm"
          value={checkIn.overwhelm}
          color="var(--lavender)"
        />
      </div>
    </section>
  );
}
