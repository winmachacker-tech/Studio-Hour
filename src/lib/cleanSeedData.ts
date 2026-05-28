import AsyncStorage from "@react-native-async-storage/async-storage";

const MIGRATION_KEY = "sh-seed-cleaned-v1";

const SEED_WORK_IDS = new Set([
  "cobalt-mural",
  "tote-art",
  "maya-lead",
  "workshop-deck",
]);

const SEED_IDEA_IDS = new Set([
  "cobalt-mix",
  "wall-carousel",
  "lavender-cobalt-series",
  "mural-day-longform",
  "open-studio-tea",
  "wildflower-tote",
]);

const SEED_RITUAL_IDS = new Set(["pages", "walk", "phone", "lunch"]);

const SEED_SCHEDULE_IDS = new Set(["settle", "art", "lunch", "spa", "kids"]);

export async function cleanSeedData(): Promise<void> {
  try {
    const already = await AsyncStorage.getItem(MIGRATION_KEY);
    if (already === "done") return;

    const workRaw = await AsyncStorage.getItem("sh-work-items");
    if (workRaw) {
      const items = JSON.parse(workRaw) as { id: string }[];
      const cleaned = items.filter((item) => !SEED_WORK_IDS.has(item.id));
      await AsyncStorage.setItem("sh-work-items", JSON.stringify(cleaned));
    }

    const ideasRaw = await AsyncStorage.getItem("sh-ideas");
    if (ideasRaw) {
      const items = JSON.parse(ideasRaw) as { id: string }[];
      const cleaned = items.filter((item) => !SEED_IDEA_IDS.has(item.id));
      await AsyncStorage.setItem("sh-ideas", JSON.stringify(cleaned));
    }

    const ritualsRaw = await AsyncStorage.getItem("sh-rituals");
    if (ritualsRaw) {
      const store = JSON.parse(ritualsRaw) as Record<
        string,
        { date: string; rituals: { id: string }[] }
      >;
      const cleaned: Record<string, { date: string; rituals: { id: string }[] }> = {};
      for (const [date, entry] of Object.entries(store)) {
        const kept = entry.rituals.filter((r) => !SEED_RITUAL_IDS.has(r.id));
        if (kept.length > 0) {
          cleaned[date] = { ...entry, rituals: kept };
        }
      }
      await AsyncStorage.setItem("sh-rituals", JSON.stringify(cleaned));
    }

    const schedulesRaw = await AsyncStorage.getItem("sh-schedules");
    if (schedulesRaw) {
      const store = JSON.parse(schedulesRaw) as Record<
        string,
        { date: string; blocks: { id: string }[] }
      >;
      const cleaned: Record<string, { date: string; blocks: { id: string }[] }> = {};
      for (const [date, entry] of Object.entries(store)) {
        const kept = entry.blocks.filter((b) => !SEED_SCHEDULE_IDS.has(b.id));
        if (kept.length > 0) {
          cleaned[date] = { ...entry, blocks: kept };
        }
      }
      await AsyncStorage.setItem("sh-schedules", JSON.stringify(cleaned));
    }

    await AsyncStorage.setItem(MIGRATION_KEY, "done");
  } catch {
    // Silent failure — cleanup retries next launch.
  }
}
