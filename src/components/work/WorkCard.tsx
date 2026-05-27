"use client";

import Eyebrow from "@/components/shared/Eyebrow";
import StatusChip from "@/components/shared/StatusChip";
import EnergyChip from "@/components/shared/EnergyChip";
import type { WorkItem } from "@/lib/types";

export default function WorkCard({
  item,
  onToggleDone,
  onCycleStatus,
}: {
  item: WorkItem;
  onToggleDone: () => void;
  onCycleStatus: () => void;
}) {
  const isDone = item.status === "Done";

  return (
    <article className={`work-card ${isDone ? "is-done" : ""}`}>
      <Eyebrow color={isDone ? "var(--lavender)" : undefined}>
        {item.project}
      </Eyebrow>
      <h3
        className="work-title"
        onClick={onToggleDone}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleDone();
          }
        }}
      >
        {item.title}
      </h3>
      <p className="work-note">{item.note}</p>
      <div className="chip-row">
        <StatusChip status={item.status} onClick={onCycleStatus} />
        <EnergyChip level={item.energy} />
      </div>
    </article>
  );
}
