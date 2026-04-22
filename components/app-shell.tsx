import Link from "next/link";
import { BookMarked, CalendarDays, Home, Settings2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/archive", label: "Archive", icon: CalendarDays },
  { href: "/notebook", label: "Notebook", icon: BookMarked },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(0,241,255,0.15),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(241,0,255,0.16),transparent_35%),radial-gradient(circle_at_40%_80%,rgba(88,101,242,0.2),transparent_45%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl border border-cyan-400/40 bg-cyan-500/10" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Agent Internet
              </p>
              <p className="text-xs text-fuchsia-200/90">Sci-Fi Spark Forge</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-white/75 transition",
                  "hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-50",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-white/15 bg-black/55 p-2 backdrop-blur md:hidden">
        <ul className="grid grid-cols-4 gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-white/75 transition hover:bg-cyan-400/10 hover:text-cyan-50"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
