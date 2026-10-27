import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "ホーム", bar: "bg-accent", end: true },
  { to: "/new", label: "録音", bar: "bg-ink-sky" },
  { to: "/write", label: "ノート書く", bar: "bg-ink-amber" },
  { to: "/recordings", label: "録音一覧", bar: "bg-ink-orange" }
];

export default function PageNav() {
  return (
    <nav className="flex flex-wrap items-center gap-x-7 gap-y-3">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="group flex items-center gap-2.5"
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  "h-6 w-2 rounded-l-sm rounded-r-[2px] shadow-sm transition",
                  item.bar,
                  isActive ? "ring-1 ring-notebook-cover-foreground/25" : "opacity-40"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-sm tracking-wide text-notebook-cover-foreground/70 transition group-hover:text-notebook-cover-foreground",
                  isActive && "font-medium text-notebook-cover-foreground"
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}