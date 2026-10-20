import React from "react";
import { Link } from "react-router-dom";
import { Mic, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotebookCover({ userName }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-notebook-cover text-notebook-cover-foreground shadow-xl ring-1 ring-notebook-cover-foreground/10">
      <div className="absolute inset-y-0 left-0 w-6 bg-notebook-label-foreground/20 sm:w-8" aria-hidden="true" />
      <div className="absolute inset-y-0 left-6 w-px bg-notebook-cover-foreground/15 sm:left-8" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-accent" aria-hidden="true" />

      <div className="relative px-6 py-9 pl-12 sm:px-12 sm:py-12 sm:pl-20">
        <div className="flex items-baseline justify-between gap-4 text-[10px] uppercase tracking-[0.4em] text-notebook-cover-foreground/55">
          <span>University Lecture Notes</span>
          <span className="font-display tracking-[0.2em]">{new Date().getFullYear()}</span>
        </div>

        <div className="notebook-ruled-soft mt-6 max-w-2xl rounded-md bg-notebook-label px-6 py-7 text-notebook-label-foreground shadow-lg sm:px-8">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">講義ノート</h1>
          <p className="mt-3 text-sm leading-7 text-notebook-label-foreground/70">
            講義を録音すると、文字起こしと要約が自動でノートになります。録音せず、普通のノートとして書くこともできます。
          </p>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-end gap-3">
              <dt className="w-12 shrink-0 font-display text-notebook-label-foreground/70">科目</dt>
              <dd className="flex-1 border-b border-dashed border-notebook-label-foreground/30 pb-1">全科目</dd>
            </div>
            <div className="flex items-end gap-3">
              <dt className="w-12 shrink-0 font-display text-notebook-label-foreground/70">氏名</dt>
              <dd className="flex-1 border-b border-dashed border-notebook-label-foreground/30 pb-1">
                {userName || "記入してください"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild className="h-11 rounded-md bg-accent px-6 text-accent-foreground hover:bg-accent/90">
            <Link to="/new">
              <Mic className="mr-2 h-4 w-4" />
              録音する
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-md border-notebook-cover-foreground/40 bg-transparent px-6 text-notebook-cover-foreground hover:bg-notebook-cover-foreground/10 hover:text-notebook-cover-foreground"
          >
            <Link to="/write">
              <PenLine className="mr-2 h-4 w-4" />
              ノートを書く
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}