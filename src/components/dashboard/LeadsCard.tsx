import Eyebrow from "@/components/shared/Eyebrow";
import type { MuralLead, WorkStatus } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  "Needs Follow-Up": "gold",
  "In Progress": "teal",
  Ready: "teal",
  Waiting: "lavender",
  Done: "muted",
};

export default function LeadsCard({ leads }: { leads: MuralLead[] }) {
  if (leads.length === 0) return null;

  return (
    <section className="sh-card">
      <Eyebrow color="var(--teal)">mural leads</Eyebrow>
      <ul className="lead-list">
        {leads.map((lead) => (
          <li key={lead.id}>
            <h4>{lead.name}</h4>
            <p>{lead.description}</p>
            <span
              className={`chip chip-${STATUS_COLORS[lead.status] ?? "lavender"}`}
            >
              {lead.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
