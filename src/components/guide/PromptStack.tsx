"use client";

const PROMPTS = [
  { label: "Plan my day", key: "plan-day" },
  { label: "Help me choose what to work on", key: "choose-work" },
  { label: "Give me a low-energy plan", key: "low-energy" },
  { label: "Turn this idea into a post", key: "idea-post" },
  { label: "Help me follow up on a mural lead", key: "mural-lead" },
];

export default function PromptStack({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="prompt-stack">
      {PROMPTS.map((p) => (
        <button
          key={p.key}
          className="prompt-tile"
          onClick={() => onSelect(p.label)}
          disabled={disabled}
          type="button"
        >
          <span>{p.label}</span>
          <span className="arr" aria-hidden="true">
            &rarr;
          </span>
        </button>
      ))}
    </div>
  );
}
