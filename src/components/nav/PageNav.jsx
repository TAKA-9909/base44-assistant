import React from "react";
import { NavLink } from "react-router-dom";
import { FileAudio, Home, Mic, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

// ホームの付箋タグと同じ色・アイコンで揃える
const ITEMS = [
  { to: "/", label: "ホーム", icon: Home, tone: "bg-sticky-4", end: true },
  { to: "/new", label: "録音する", icon: Mic, tone: "bg-sticky-2" },
  { to: "/write", label: "ノートを書く", icon: PenLine, tone: "bg-sticky-3" },
  { to: "/recordings", label: "録音一覧", icon: FileAudio, tone: "bg-sticky-1" }
];

// 白いページの上辺に付く、縦書きの付箋タブ
export default function PageNav() {
  return (
    <nav className="flex items-end pl-3" aria-label="メインメニュー">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group flex h-10 w-12 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-t-lg text-xs text-sticky-foreground transition-all duration-300 ease-out hover:h-28",
                item.tone,
                isActive ? "shadow-lg ring-1 ring-sticky-foreground/25" : "opacity-60 hover:opacity-100"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span
              className="max-h-0 overflow-hidden tracking-widest opacity-0 transition-all duration-300 ease-out group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:max-h-24 group-focus-visible:opacity-100"
              style={{ writingMode: "vertical-rl" }}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}