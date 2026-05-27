"use client";

import Eyebrow from "@/components/shared/Eyebrow";
import type { ScheduleBlock } from "@/lib/types";

function blockCount(n: number): string {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
  ];
  return `${words[n] ?? n} quiet block${n === 1 ? "" : "s"}`;
}

export default function ScheduleCard({
  blocks,
}: {
  blocks: ScheduleBlock[];
}) {
  return (
    <section className="sh-card">
      <div className="row-between">
        <Eyebrow>today&rsquo;s plan</Eyebrow>
        <span className="meta">{blockCount(blocks.length)}</span>
      </div>
      <ul className="time-list">
        {blocks.map((block) => (
          <li key={block.id} className={`time-block ${block.type}`}>
            <time>{block.time}</time>
            <div>
              <div className="block-title">
                {block.title}
                {block.type === "protected" && (
                  <span className="lock-glyph">{"✦"}</span>
                )}
              </div>
              <div className="block-meta">{block.meta}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
