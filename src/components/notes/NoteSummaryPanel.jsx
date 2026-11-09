import React from "react";
import SummaryMemoSlot from "./SummaryMemoSlot";

const SectionTitle = ({ children }) => (
  <h3 className="mb-4 font-display text-base tracking-wide text-foreground">{children}</h3>
);

export default function NoteSummaryPanel({ note, memos = [], onMemosChange = () => {} }) {
  const hasContent =
    note.summary || note.key_points?.length || note.outline?.length || note.terms?.length;
  const recordingMemos = memos.filter((memo) => memo.anchor === "recording");

  if (!hasContent && recordingMemos.length === 0) {
    return <p className="text-sm text-muted-foreground">まだまとめがありません。</p>;
  }

  return (
    <div className="space-y-10">
      {recordingMemos.length > 0 && (
        <section>
          <SectionTitle>録音中に書いたメモ</SectionTitle>
          <SummaryMemoSlot anchor="recording" memos={memos} onChange={onMemosChange} />
        </section>
      )}

      {note.summary && (
        <section>
          <SectionTitle>要約</SectionTitle>
          <p className="text-[15px] leading-8 text-foreground/90">{note.summary}</p>
          <SummaryMemoSlot anchor="summary" memos={memos} onChange={onMemosChange} />
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
                <span className="text-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
          <SummaryMemoSlot anchor="points" memos={memos} onChange={onMemosChange} />
        </section>
      )}

      {note.outline?.length > 0 && (
        <section>
          <SectionTitle>講義の流れ</SectionTitle>
          <div className="space-y-6">
            {note.outline.map((block, index) => (
              <div key={index} className="border-l-2 border-border pl-5">
                <p className="mb-2 font-medium">{block.heading}</p>
                <ul className="space-y-1.5 text-sm leading-7 text-muted-foreground">
                  {(block.points || []).map((point, pointIndex) => (
                    <li key={pointIndex}>・{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <SummaryMemoSlot anchor="outline" memos={memos} onChange={onMemosChange} />
        </section>
      )}

      {note.terms?.length > 0 && (
        <section>
          <SectionTitle>用語メモ</SectionTitle>
          <dl className="grid gap-4 sm:grid-cols-2">
            {note.terms.map((item, index) => (
              <div key={index} className="rounded-2xl border border-border/70 bg-card p-4">
                <dt className="text-sm font-medium">{item.term}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">{item.meaning}</dd>
              </div>
            ))}
          </dl>
          <SummaryMemoSlot anchor="terms" memos={memos} onChange={onMemosChange} />
        </section>
      )}
    </div>
  );
}