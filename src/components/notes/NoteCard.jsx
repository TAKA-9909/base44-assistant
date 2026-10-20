import React from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, CalendarDays, Clock } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/lectureUtils";

export default function NoteCard({ note }) {
  return (
    <Link
      to={`/notes/${note.id}`}
      className="group flex flex-col rounded-3xl border border-border/70 bg-card p-6 transition hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-2">
        {note.course && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            {note.course}
          </span>
        )}
        {note.status === "processing" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <Loader2 className="h-3 w-3 animate-spin" />
            作成中
          </span>
        )}
        {note.status === "failed" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <AlertCircle className="h-3 w-3" />
            失敗
          </span>
        )}
      </div>

      <h3 className="font-display text-lg leading-snug transition group-hover:text-primary">
        {note.title}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {note.summary ||
          note.transcript?.slice(0, 120) ||
          note.content?.slice(0, 120) ||
          "ノートの内容はまだありません。"}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {note.lecture_date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(note.lecture_date)}
          </span>
        )}
        {note.duration_seconds > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(note.duration_seconds)}
          </span>
        )}
      </div>
    </Link>
  );
}