"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Sparkles, ShieldCheck, BellRing, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LangToggle } from "./lang-toggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/simulator", label: "Launch Simulator", icon: Sparkles },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 glass backdrop-blur-md">
      <div className="container flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-primary via-primary to-sky-400 flex items-center justify-center shadow-glow">
            <Car className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight">
              IL <span className="text-primary">CarLens</span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Israel Market Intelligence
            </span>
          </div>
        </Link>

        <nav className="ml-4 hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Badge variant="success" className="hidden sm:inline-flex">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            Live · Week {getIsoWeekLabel()}
          </Badge>
          <LangToggle />
        </div>
      </div>
      <div className="israel-stripe h-[3px]" />
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
