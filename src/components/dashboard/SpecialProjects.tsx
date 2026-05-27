import Eyebrow from "@/components/shared/Eyebrow";
import ProgressRail from "./ProgressRail";
import type { SpecialProject } from "@/lib/types";

export default function SpecialProjects({
  projects,
}: {
  projects: SpecialProject[];
}) {
  if (projects.length === 0) return null;

  return (
    <section className="sh-card">
      <Eyebrow>special projects</Eyebrow>
      <div className="special-row">
        {projects.map((project) => (
          <article key={project.id} className="special-card">
            <span
              className="proj-tag"
              style={project.tagColor ? { color: project.tagColor } : undefined}
            >
              {project.tag}
            </span>
            <h4>{project.title}</h4>
            <p>{project.description}</p>
            <ProgressRail
              percent={project.progress}
              color={project.progressColor}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
