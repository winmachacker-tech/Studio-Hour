"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginCard from "@/components/auth/LoginCard";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/today");
  }, [session, router]);

  if (session) return null;

  return <LoginCard />;
}
