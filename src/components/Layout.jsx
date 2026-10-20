import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { BookOpen, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-display text-lg tracking-wide">講義ノート</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-2 text-muted-foreground transition hover:text-foreground",
                  isActive && "bg-secondary text-foreground"
                )
              }
            >
              ノート一覧
            </NavLink>
            <NavLink
              to="/new"
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 transition",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Mic className="h-3.5 w-3.5" />
              録音する
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
}