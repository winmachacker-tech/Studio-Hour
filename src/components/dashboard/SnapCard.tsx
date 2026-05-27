import Eyebrow from "@/components/shared/Eyebrow";

export default function SnapCard({
  eyebrow,
  eyebrowColor,
  headline,
  meta,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  headline: string;
  meta: string;
}) {
  return (
    <article className="snap-card">
      <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
      <h3>{headline}</h3>
      <span className="meta">{meta}</span>
    </article>
  );
}
