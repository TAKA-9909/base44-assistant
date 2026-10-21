import React from "react";
import StickyNav from "@/components/nav/StickyNav";

export default function NotebookCover() {
  return (
    <section className="relative overflow-hidden rounded-[26px] shadow-xl ring-1 ring-notebook-paper-foreground/10">
      <div
        className="notebook-spine-texture absolute inset-y-0 left-0 w-8 bg-notebook-spine sm:w-12"
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 left-8 w-px bg-notebook-paper-foreground/25 sm:left-12"
        aria-hidden="true"
      />

      <div className="notebook-paper-fiber relative ml-8 bg-notebook-paper px-5 py-8 text-notebook-paper-foreground sm:ml-12 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-3 rounded-[14px] border border-notebook-paper-foreground/35 sm:inset-5"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-[15px] rounded-[12px] border border-notebook-paper-foreground/20 sm:inset-[25px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-md pt-2 sm:pt-4">
          <div className="rounded-[12px] bg-notebook-label px-8 pb-7 pt-8 text-center text-notebook-label-foreground shadow-lg ring-1 ring-notebook-paper-foreground/10">
            <h1 className="font-display text-3xl font-semibold tracking-[0.2em] sm:text-4xl">
              My book
            </h1>
            <span
              className="mx-auto mt-5 block h-px w-24 bg-notebook-paper-foreground/40"
              aria-hidden="true"
            />
          </div>

          <div className="mt-6">
            <StickyNav />
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-notebook-paper-foreground/65">
            講義を録音すると、文字起こしと要約が自動でノートになります。手書きのノートも書けます。
          </p>

          <div
            className="mx-auto mt-7 h-px w-40 bg-notebook-paper-foreground/30"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}