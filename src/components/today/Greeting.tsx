"use client";

import { useState, useEffect } from "react";
import Eyebrow from "@/components/shared/Eyebrow";
import { formatDateLine, getGreeting } from "@/lib/dates";
import { useCalendarDay } from "@/hooks/useCalendarDay";

const SUBTITLES: Record<string, string[]> = {
  morning: [
    "Tender start. Clear skies. The studio is yours until one.",
    "A slow morning. Let the quiet do its work.",
    "The light is good. Ease into it.",
  ],
  afternoon: [
    "The afternoon light is soft. What still has your attention?",
    "Halfway through. Check in with yourself.",
    "The hard part is behind you. Coast if you need to.",
  ],
  evening: [
    "The day is winding down. Let it.",
    "Rest is not the opposite of progress.",
    "Put the brushes down. Tomorrow will be here.",
  ],
};

function pickSubtitle(timeOfDay: string, dateStr: string): string {
  const seed = dateStr.split("-").reduce((a, b) => a + Number(b), 0);
  const options = SUBTITLES[timeOfDay] ?? SUBTITLES.morning;
  return options[seed % options.length];
}

export default function Greeting() {
  const today = useCalendarDay();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { timeOfDay, greeting } = getGreeting();
  const dateLine = formatDateLine(today);
  const subtitle = pickSubtitle(timeOfDay, today);

  if (!mounted) {
    return (
      <header className="sh-greeting">
        <Eyebrow>&nbsp;</Eyebrow>
        <h1 className="sh-greet-title">
          &nbsp;
        </h1>
        <p className="sh-greet-sub">&nbsp;</p>
      </header>
    );
  }

  return (
    <header className="sh-greeting">
      <Eyebrow>{dateLine}</Eyebrow>
      <h1 className="sh-greet-title">
        {greeting}, <em>Danielle.</em>
      </h1>
      <p className="sh-greet-sub">{subtitle}</p>
    </header>
  );
}
