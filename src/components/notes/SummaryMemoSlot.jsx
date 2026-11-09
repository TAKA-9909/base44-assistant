import React from "react";
import { Plus } from "lucide-react";
import StickyMemo from "./StickyMemo";

const newId = () => `memo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// まとめの区切りと区切りの隙間に、付箋メモを貼る場所
// anchors を渡すと、複数の区切りのメモを同じ場所にまとめて貼れる
export default function SummaryMemoSlot({ anchor, anchors, memos, onChange }) {
  const targets = anchors || [anchor];
  const own = memos.filter((memo) => targets.includes(memo.anchor));

  const addMemo = () => onChange([...memos, { id: newId(), anchor, text: "" }]);
  const saveMemo = (id, text) =>
    onChange(memos.map((memo) => (memo.id === id ? { ...memo, text } : memo)));
  const moveMemo = (id, position) =>
    onChange(memos.map((memo) => (memo.id === id ? { ...memo, ...position } : memo)));
  const deleteMemo = (id) => onChange(memos.filter((memo) => memo.id !== id));

  return (
    <div className="mt-5 flex flex-wrap items-start gap-3">
      {own.map((memo, index) => (
        <StickyMemo
          key={memo.id}
          memo={memo}
          angle={index % 2 === 0 ? -1.4 : 1.2}
          onSave={(text) => saveMemo(memo.id, text)}
          onMove={(position) => moveMemo(memo.id, position)}
          onDelete={() => deleteMemo(memo.id)}
        />
      ))}

      <button
        type="button"
        onClick={addMemo}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        メモを貼る
      </button>
    </div>
  );
}