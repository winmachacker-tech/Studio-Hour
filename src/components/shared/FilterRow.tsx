"use client";

export default function FilterRow({
  filters,
  active,
  onChange,
}: {
  filters: string[];
  active: string;
  onChange: (filter: string) => void;
}) {
  return (
    <div className="filter-row">
      {filters.map((f) => (
        <button
          key={f}
          className={`filter-pill ${active === f ? "is-on" : ""}`}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
