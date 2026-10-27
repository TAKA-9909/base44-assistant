import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "ホーム", fill: "bg-tab-1", end: true },
  { to: "/new", label: "録音", fill: "bg-tab-2" },
  { to: "/write", label: "ノート書く", fill: "bg-tab-3" },
  { to: "/recordings", label: "録音一覧", fill: "bg-tab-4" }
];

// 白いページの上辺に付く、縦書きの付箋タブ
export default function PageNav() {
  return (
    <nav className="flex items-end gap-1.5 pl-3">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex h-24 w-12 items-center justify-center rounded-t-lg px-1 pb-3 pt-4 text-xs tracking-widest text-notebook-cover transition",
              item.fill,
              isActive ? "shadow-lg" : "opacity-60 hover:opacity-90"
            )
          }
        >
          <span style={{ writingMode: "vertical-rl" }}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}