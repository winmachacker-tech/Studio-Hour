"use client";

import { useState } from "react";
import type { Platform, IdeaKind, IdeaStatus } from "@/lib/types";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "nextdoor", label: "Nextdoor" },
  { value: "artwork", label: "Artwork" },
];

const PLATFORM_TO_KIND: Record<Platform, IdeaKind> = {
  tiktok: "Voiceover",
  instagram: "Posts",
  facebook: "Posts",
  nextdoor: "Posts",
  artwork: "Artwork",
};

export default function AddIdeaFab({
  onAdd,
}: {
  onAdd: (idea: {
    title: string;
    platform: Platform;
    status: IdeaStatus;
    note: string;
    kind: IdeaKind;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("artwork");
  const [note, setNote] = useState("");

  const reset = () => {
    setTitle("");
    setPlatform("artwork");
    setNote("");
    setOpen(false);
  };

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      platform,
      status: "saved",
      note: note.trim(),
      kind: PLATFORM_TO_KIND[platform],
    });
    reset();
  };

  if (!open) {
    return (
      <button className="fab" onClick={() => setOpen(true)}>
        ＋&nbsp; add an idea
      </button>
    );
  }

  return (
    <div className="sh-card add-idea-form">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="eyebrow">new idea</span>
        <button className="link" onClick={reset}>
          cancel
        </button>
      </div>
      <input
        type="text"
        className="add-idea-input"
        placeholder="What's the idea?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <div className="add-idea-platform-row">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            className={`filter-pill ${platform === p.value ? "is-on" : ""}`}
            onClick={() => setPlatform(p.value)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="add-idea-input add-idea-note"
        placeholder="Short note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button
        className="pill-action"
        onClick={submit}
        disabled={!title.trim()}
        style={{ marginTop: 8, opacity: title.trim() ? 1 : 0.4 }}
      >
        Save idea <span className="arr">&rarr;</span>
      </button>
    </div>
  );
}
