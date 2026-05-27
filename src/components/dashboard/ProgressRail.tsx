export default function ProgressRail({
  percent,
  color = "gold",
}: {
  percent: number;
  color?: "gold" | "teal";
}) {
  return (
    <div className={`progress-rail ${color === "teal" ? "teal" : ""}`}>
      <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}
