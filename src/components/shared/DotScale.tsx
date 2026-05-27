"use client";

export default function DotScale({
  value,
  max = 5,
  color,
  onChange,
}: {
  value: number;
  max?: number;
  color: string;
  onChange?: (value: number) => void;
}) {
  return (
    <div
      className="dot-scale"
      role="group"
      aria-label={`${value} of ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="dot"
          role={onChange ? "button" : undefined}
          tabIndex={onChange ? 0 : undefined}
          aria-label={onChange ? `Set to ${i + 1}` : undefined}
          onClick={onChange ? () => onChange(i + 1) : undefined}
          onKeyDown={
            onChange
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(i + 1);
                  }
                }
              : undefined
          }
          style={{
            background: i < value ? color : "transparent",
            borderColor:
              i < value ? color : "rgba(245,238,248,0.22)",
            cursor: onChange ? "pointer" : undefined,
          }}
        />
      ))}
    </div>
  );
}
