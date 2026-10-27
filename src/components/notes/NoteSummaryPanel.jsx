import React from "react";
import SentenceText from "@/components/notes/SentenceText";

const SectionTitle = ({ children }) => (
  <h3 className="mb-4 font-display text-base tracking-wide text-foreground">{children}</h3>
);

export default function NoteSummaryPanel({ note, marks, onToggle }) {
  const hasContent =
    note.summary || note.key_points?.length || note.outline?.length || note.terms?.length;

  if (!hasContent) {
    return <p className="text-sm text-muted-foreground">まだまとめがありません。</p>;
  }

  return (
    <div className="space-y-10">
      {note.summary && (
        <section>
          <SectionTitle>要約</SectionTitle>
          <p className="text-[15px] leading-8 text-foreground/90">
            <SentenceText text={note.summary} prefix="summary|" marks={marks} onToggle={onToggle} />
          </p>
        </section>
      )}

      {note.key_points?.length > 0 && (
        <section>
          <SectionTitle>重要ポイント</SectionTitle>
          <ul className="space-y-3">
            {note.key_points.map((point, index) => (
              <li key={index} className="flex gap-3 text-[15px] leading-7">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-foreground/90">
                  <SentenceText text={point} prefix="summary|" marks={marks} onToggle={onToggle} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {note.outline?.length > 0 && (
        <section>
          <SectionTitle>講義の流れ</SectionTitle>
          <div className="space-y-6">
            {note.outline.map((block, index) => (
              <div key={index} className="border-l-2 border-border pl-5">
                <p className="mb-2 font-medium">
                  <SentenceText text={block.heading} prefix="summary|" marks={marks} onToggle={onToggle} />
                </p>
                <ul className="space-y-1.5 text-sm leading-7 text-muted-foreground">
                  {(block.points || []).map((point, pointIndex) => (
                    <li key={pointIndex}>
                      ・
                      <SentenceText text={point} prefix="summary|" marks={marks} onToggle={onToggle} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {note.terms?.length > 0 && (
        <section>
          <SectionTitle>用語メモ</SectionTitle>
          <dl className="grid gap-4 sm:grid-cols-2">
            {note.terms.map((item, index) => (
              <div key={index} className="rounded-2xl border border-border/70 bg-card p-4">
                <dt className="text-sm font-medium">
                  <SentenceText text={item.term} prefix="summary|" marks={marks} onToggle={onToggle} />
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                  <SentenceText text={item.meaning} prefix="summary|" marks={marks} onToggle={onToggle} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}