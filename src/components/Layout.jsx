import React from "react";
import { Link, Outlet } from "react-router-dom";
import { BookOpen } from "lucide-react";
import StickyNav from "@/components/nav/StickyNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 py-3">
          <Link to="/" className="flex w-fit items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-display text-lg tracking-wide">講義ノート</span>
          </Link>

          <div className="mt-2.5">
            <StickyNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
}