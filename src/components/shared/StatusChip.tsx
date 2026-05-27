import type { WorkStatus } from "@/lib/types";

const STATUS_COLORS: Record<WorkStatus, string> = {
  Ready: "teal",
  "In Progress": "teal",
  "Needs Follow-Up": "gold",
  Waiting: "lavender",
  Done: "muted",
};

export default function StatusChip({
  status,
  onClick,
}: {
  status: WorkStatus;
  onClick?: () => void;
}) {
  return (
    <span
      className={`chip chip-${STATUS_COLORS[status]}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {status}
    </span>
  );
}
