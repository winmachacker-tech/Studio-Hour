"use client";

import DotScale from "./DotScale";

export default function StatePill({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange?: (value: number) => void;
}) {
  return (
    <div className="state-pill">
      <span className="state-label">{label}</span>
      <DotScale value={value} max={5} color={color} onChange={onChange} />
    </div>
  );
}
