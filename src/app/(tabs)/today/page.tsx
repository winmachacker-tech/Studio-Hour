"use client";

import Greeting from "@/components/today/Greeting";
import CheckInCard from "@/components/today/CheckInCard";
import SuggestedFocus from "@/components/today/SuggestedFocus";
import ScheduleCard from "@/components/today/ScheduleCard";
import RitualsCard from "@/components/today/RitualsCard";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useRituals } from "@/hooks/useRituals";
import { useSchedule } from "@/hooks/useSchedule";
import { useTasks } from "@/hooks/useTasks";

export default function TodayPage() {
  const { checkIn, update, isHydrated } = useCheckIn();
  const {
    rituals,
    doneCount,
    total,
    toggle,
    isHydrated: ritualsHydrated,
  } = useRituals();
  const { blocks } = useSchedule();
  const { items: workItems } = useTasks();

  return (
    <>
      <Greeting />

      <CheckInCard
        checkIn={checkIn}
        onUpdate={update}
        isHydrated={isHydrated}
      />

      <SuggestedFocus checkIn={checkIn} workItems={workItems} />

      <ScheduleCard blocks={blocks} />

      {ritualsHydrated && (
        <RitualsCard
          rituals={rituals}
          doneCount={doneCount}
          total={total}
          onToggle={toggle}
        />
      )}

      <p className="foot-mark">&mdash; a quiet hour belongs to you.</p>
    </>
  );
}
