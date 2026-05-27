"use client";

import Eyebrow from "@/components/shared/Eyebrow";
import SnapGrid from "@/components/dashboard/SnapGrid";
import DueSoonCard from "@/components/dashboard/DueSoonCard";
import LeadsCard from "@/components/dashboard/LeadsCard";
import SpecialProjects from "@/components/dashboard/SpecialProjects";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useSchedule } from "@/hooks/useSchedule";
import { useTasks } from "@/hooks/useTasks";
import { useIdeas } from "@/hooks/useIdeas";
import { formatDateLine } from "@/lib/dates";
import { useCalendarDay } from "@/hooks/useCalendarDay";
import {
  SEED_DUE_ITEMS,
  SEED_MURAL_LEADS,
  SEED_SPECIAL_PROJECTS,
} from "@/lib/constants";

export default function DashboardPage() {
  const today = useCalendarDay();
  const { checkIn } = useCheckIn();
  const { blocks } = useSchedule();
  const { items: workItems } = useTasks();
  const { items: ideas } = useIdeas();

  return (
    <>
      <header className="sh-page-head">
        <Eyebrow>the studio at a glance</Eyebrow>
        <h1 className="sh-page-title">Where things stand.</h1>
        <p className="sh-page-sub">
          {formatDateLine(today)} · the one headline from each room.
        </p>
      </header>

      <SnapGrid checkIn={checkIn} blocks={blocks} workItems={workItems} ideas={ideas} />

      <DueSoonCard items={SEED_DUE_ITEMS} />

      <LeadsCard leads={SEED_MURAL_LEADS} />

      <SpecialProjects projects={SEED_SPECIAL_PROJECTS} />

      <p className="foot-mark">
        &mdash; a calm room is its own kind of command.
      </p>
    </>
  );
}
