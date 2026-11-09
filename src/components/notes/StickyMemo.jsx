import React, { useState } from "react";
import { X } from "lucide-react";

// まとめの隙間に貼る付箋メモ
export default function StickyMemo({ memo, angle = 0, onSave, onDelete }) {
  const [text, setText] = useState(memo.text || "");
  const [editing, setEditing] = useState(!memo.text);

  const commit = () => {
    if (!text.trim()) {
      onDelete();
      return;
    }
    setEditing(false);
    if (text !== memo.text) onSave(text);
  };

  return (
    <div
      style={{ transform: `rotate(${angle}deg)` }}
      className="relative w-44 shrink-0 rounded-sm bg-memo p-3 text-left shadow-md shadow-black/15"
    >
      <button
        type="button"
        aria-label="このメモをはがす"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted-foreground shadow ring-1 ring-border"
      >
        <X className="h-3 w-3" />
      </button>

      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          rows={3}
          placeholder="メモを書きこむ"
          className="w-full resize-none bg-transparent font-hand text-[13px] leading-6 text-sticky-foreground outline-none placeholder:text-sticky-foreground/40"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full whitespace-pre-wrap text-left font-hand text-[13px] leading-6 text-sticky-foreground"
        >
          {text}
        </button>
      )}
    </div>
  );
}