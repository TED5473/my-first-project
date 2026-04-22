"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LangToggle } from "./lang-toggle";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/simulator", label: "Launch Simulator" },
  { href: "/alerts", label: "Alerts" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="container flex h-14 items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-8 w-8 rounded-[10px] bg-primary flex items-center justify-center">
            <Car className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
              IL CarLens
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              · Israel Market Intelligence
            </span>
          </div>
        </Link>

        <nav className="ml-2 hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Badge variant="success" className="hidden sm:inline-flex">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            Live · Week {getIsoWeekLabel()}
          </Badge>
          <LangToggle />
        </div>
      </div>
      <div className="israel-stripe h-[2px] opacity-80" />
    </header>
  );
}

function getIsoWeekLabel() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
