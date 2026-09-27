"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { curriculum, PATHS } from "@/lib/curriculum";
import { useDesk } from "@/components/progress-provider";

const LINKS = [
  { href: "/", label: "Desk" },
  { href: "/plan", label: "Today" },
  { href: "/map", label: "16 weeks" },
  { href: "/library", label: "Library" },
  { href: "/loops", label: "Loops" },
  { href: "/builds", label: "Builds" },
  { href: "/cheats", label: "Cheats" },
  { href: "/stories", label: "Stories" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const desk = useDesk();
  const done = Object.values(desk.days).filter((d) => d.status === "Done").length;

  return (
    <header className="sticky top-0 z-30 border-b border-[#e4d9c8] bg-[#f6f1e7]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-heading text-2xl tracking-tight text-[#1e2a32]">Meridian</span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-[#8c6a2f] sm:inline">
              SDE-2 desk
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="path">
              Preparation path
            </label>
            <select
              id="path"
              value={desk.path}
              onChange={(e) => desk.setPath(e.target.value as typeof desk.path)}
              className="h-8 max-w-[11rem] rounded-full border border-[#e4d9c8] bg-white px-3 text-xs text-[#1e2a32] md:max-w-none"
            >
              {PATHS.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.name}
                </option>
              ))}
            </select>
            <span className="hidden rounded-full bg-[#1e2a32] px-3 py-1 text-xs text-[#f6f1e7] sm:inline">
              {done}/{curriculum.days.length} days
            </span>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-sm",
                  active ? "bg-[#1e2a32] text-[#f6f1e7]" : "text-[#5e584e] hover:bg-[#efe8dc]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
