"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import TabIcon from "@/components/shell/TabIcon";

const TABS = [
  { id: "today", label: "Today", href: "/today" },
  { id: "open-work", label: "Open Work", href: "/open-work" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "ideas", label: "Ideas", href: "/ideas" },
  { id: "guide", label: "Guide", href: "/guide" },
] as const;

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeTab = TABS.find((t) => pathname === t.href)?.id ?? "today";

  return (
    <div className="sh-app">
      <div className="sh-scroll" key={activeTab}>
        {children}
      </div>
      <nav className="sh-tabbar" aria-label="Studio Hour sections">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`sh-tab ${activeTab === tab.id ? "is-on" : ""}`}
          >
            <TabIcon id={tab.id} />
            <span className="tab-label">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
