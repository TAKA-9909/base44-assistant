import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FileAudio, Home, List, Mic, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

// ホームの付箋タグと同じ色・アイコンで揃える
const HOME_ITEM = { to: "/", label: "ホーム", icon: Home, tone: "bg-notebook-cover text-notebook-cover-foreground", end: true };
const RECORD_ITEM = { to: "/new", label: "録音する", icon: Mic, tone: "bg-sticky-2" };
const WRITE_ITEM = { to: "/write", label: "ノートを書く", icon: PenLine, tone: "bg-sticky-3" };

// 4つ目のタブは一覧の入口。開いている一覧の代わりに、もう一方の一覧を出す
const RECORDINGS_ITEM = { to: "/recordings", label: "録音一覧", icon: FileAudio, tone: "bg-sticky-1" };
const NOTES_ITEM = { to: "/notes", label: "ノート一覧", icon: List, tone: "bg-sticky-4" };

// 白いページの上辺に付く、縦書きの付箋タブ
export default function PageNav() {
  const { pathname } = useLocation();
  const listItem = pathname === "/recordings" ? NOTES_ITEM : RECORDINGS_ITEM;
  const items = [HOME_ITEM, RECORD_ITEM, WRITE_ITEM, listItem];

  return (
    <nav className="flex items-end pl-3" aria-label="メインメニュー">
      {items.map((item) => {
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