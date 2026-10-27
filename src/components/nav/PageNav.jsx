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
    <nav className="flex flex-wrap items-start gap-x-8 gap-y-4">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="group flex flex-col gap-2">
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  "text-sm tracking-wide text-notebook-cover-foreground/70 transition group-hover:text-notebook-cover-foreground",
                  isActive && "font-medium text-notebook-cover-foreground"
                )}
              >
                {item.label}
              </span>
              <span
                className={cn("h-1.5 w-12 rounded-full", item.bar, !isActive && "opacity-40")}
                aria-hidden="true"
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}