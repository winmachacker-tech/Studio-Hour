"use client";

import { useState, useEffect } from "react";

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useCalendarDay(): string {
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    const check = () => {
      const now = getToday();
      setToday((prev) => (prev !== now ? now : prev));
    };

    document.addEventListener("visibilitychange", check);
    const interval = setInterval(check, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", check);
      clearInterval(interval);
    };
  }, []);

  return today;
}
