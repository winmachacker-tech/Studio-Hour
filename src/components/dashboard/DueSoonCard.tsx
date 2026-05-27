import Eyebrow from "@/components/shared/Eyebrow";
import type { DueItem } from "@/lib/types";

export default function DueSoonCard({ items }: { items: DueItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="sh-card sh-card-gold">
      <Eyebrow color="var(--gold)">due soon</Eyebrow>
      <ul className="due-list">
        {items.map((item, i) => (
          <li key={i}>
            <strong>{item.title}</strong>
            <span>{item.deadline}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
