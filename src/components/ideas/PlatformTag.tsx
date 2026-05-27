import type { Platform } from "@/lib/types";

const LABELS: Record<Platform, string> = {
  tiktok: "tiktok",
  instagram: "instagram",
  facebook: "facebook",
  nextdoor: "nextdoor",
  artwork: "artwork",
};

export default function PlatformTag({ platform }: { platform: Platform }) {
  return (
    <span className={`platform-tag platform-${platform}`}>
      {LABELS[platform]}
    </span>
  );
}
