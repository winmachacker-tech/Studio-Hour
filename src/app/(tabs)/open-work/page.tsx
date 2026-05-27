"use client";

import { useState } from "react";
import Eyebrow from "@/components/shared/Eyebrow";
import FilterRow from "@/components/shared/FilterRow";
import WorkCard from "@/components/work/WorkCard";
import { useTasks } from "@/hooks/useTasks";

const FILTERS = ["All", "Murals", "Studio art", "Design", "Leads"];

function countLine(total: number, active: number): string {
  const words = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  const n = words[total] ?? String(total);
  return `${n} thing${total === 1 ? "" : "s"} in motion — not all for today. Pick by energy, not by guilt.`;
}

export default function OpenWorkPage() {
  const [filter, setFilter] = useState("All");
  const { items, toggleDone, cycleStatus, activeCount, isHydrated } =
    useTasks();

  const shown =
    filter === "All" ? items : items.filter((t) => t.group === filter);

  return (
    <>
      <header className="sh-page-head">
        <Eyebrow>open work</Eyebrow>
        <h1 className="sh-page-title">Ready when you are.</h1>
        <p className="sh-page-sub">{countLine(items.length, activeCount)}</p>
      </header>

      <FilterRow filters={FILTERS} active={filter} onChange={setFilter} />

      {isHydrated && (
        <div className="work-list">
          {shown.map((item) => (
            <WorkCard
              key={item.id}
              item={item}
              onToggleDone={() => toggleDone(item.id)}
              onCycleStatus={() => cycleStatus(item.id)}
            />
          ))}
        </div>
      )}

      <p className="foot-mark">&mdash; done is a kind of rest, too.</p>
    </>
  );
}
