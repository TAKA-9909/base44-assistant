import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { startLongPressDrag } from "@/lib/longPressDrag";

// まとめの隙間に貼る付箋メモ（長押ししたままドラッグで移動できる）
export default function StickyMemo({ memo, angle = 0, onSave, onMove, onDelete }) {
  const [text, setText] = useState(memo.text || "");
  const [editing, setEditing] = useState(!memo.text);
  const noteRef = useRef(null);
  const draggedRef = useRef(false);

  const commit = () => {
    if (!text.trim()) {
      onDelete();
      return;
    }
    setEditing(false);
    if (text !== memo.text) onSave(text);
  };

  const handlePress = (event) => {
    const element = noteRef.current;
    if (!element) return;

    const base = { x: memo.x || 0, y: memo.y || 0 };
    let position = base;

    startLongPressDrag(event, {
      onActivate: () => {
        draggedRef.current = true;
        const active = document.activeElement;
        if (active instanceof HTMLElement && element.contains(active)) active.blur();
        element.style.zIndex = "30";
      },
      onDrag: (dx, dy) => {
        position = { x: base.x + dx, y: base.y + dy };
        element.style.transform =
          `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`;
      },
      onEnd: () => {
        element.style.zIndex = "";
        if (position.x !== base.x || position.y !== base.y) onMove(position);
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }
    });
  };

  const startEditing = () => {
    if (draggedRef.current) return;
    setEditing(true);
  };

  return (
    <div
      ref={noteRef}
      onPointerDown={handlePress}
      style={{
        transform: `translate(${memo.x || 0}px, ${memo.y || 0}px) rotate(${angle}deg)`
      }}
      className="relative w-44 shrink-0 cursor-grab rounded-sm bg-memo p-3 text-left shadow-md shadow-black/15"
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
          onClick={startEditing}
          className="w-full whitespace-pre-wrap text-left font-hand text-[13px] leading-6 text-sticky-foreground"
        >
          {text}
        </button>
      )}
    </div>
  );
}