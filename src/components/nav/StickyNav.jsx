import React from "react";
import { Link, NavLink } from "react-router-dom";
import { BookOpen, List, Mic, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/new", label: "録音する", icon: Mic, tone: "bg-sticky-2", tilt: "-rotate-1" },
  { to: "/write", label: "ノートを書く", icon: PenLine, tone: "bg-sticky-3", tilt: "rotate-1" },
  { to: "/notes", label: "ノートの一覧", icon: List, tone: "bg-sticky-4", tilt: "-rotate-1", plain: true },
  { to: "/notes", label: "講義ノート一覧", icon: BookOpen, tone: "bg-sticky-1", tilt: "rotate-1", end: true }
];

const stickyClass = (tone, tilt) =>
  cn(
    "flex items-center justify-center gap-1.5 rounded-[6px] px-3 py-2.5 text-xs font-medium text-sticky-foreground shadow-[0_3px_6px_-2px_hsl(var(--notebook-paper-foreground)/0.4)] transition hover:-translate-y-0.5",
    tone,
    tilt
  );

export default function StickyNav() {
  return (
    <nav className="grid grid-cols-2 gap-2" aria-label="メインメニュー">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{item.label}</span>
          </>
        );

        if (item.plain) {
          return (
            <Link key={item.to} to={item.to} className={stickyClass(item.tone, item.tilt)}>
              {content}
            </Link>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(stickyClass(item.tone, item.tilt), isActive && "ring-2 ring-sticky-foreground/30")
            }
          >
            {content}
          </NavLink>
        );
      })}
    </nav>
  );
}