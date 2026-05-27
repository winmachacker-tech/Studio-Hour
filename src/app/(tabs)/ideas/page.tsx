"use client";

import { useState } from "react";
import Eyebrow from "@/components/shared/Eyebrow";
import FilterRow from "@/components/shared/FilterRow";
import IdeaCard from "@/components/ideas/IdeaCard";
import AddIdeaFab from "@/components/ideas/AddIdeaFab";
import { useIdeas } from "@/hooks/useIdeas";

const FILTERS = ["All", "Posts", "Artwork", "Voiceover"];

export default function IdeasPage() {
  const [filter, setFilter] = useState("All");
  const { items, addIdea, cycleStatus, isHydrated } = useIdeas();

  const shown =
    filter === "All" ? items : items.filter((i) => i.kind === filter);

  return (
    <>
      <header className="sh-page-head">
        <Eyebrow>the idea drawer</Eyebrow>
        <h1 className="sh-page-title">Loose thoughts, kept.</h1>
        <p className="sh-page-sub">
          Nothing here has to become anything. Open the drawer when the room
          feels quiet.
        </p>
      </header>

      <FilterRow filters={FILTERS} active={filter} onChange={setFilter} />

      {isHydrated && (
        <div className="ideas-list">
          {shown.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onCycleStatus={() => cycleStatus(idea.id)}
            />
          ))}
        </div>
      )}

      <AddIdeaFab onAdd={addIdea} />
    </>
  );
}
