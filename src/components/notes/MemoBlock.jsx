import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createCanvasDrag } from "@/lib/canvasDrag";
import { startLongPressDrag } from "@/lib/longPressDrag";
import { fontPixels, fontStack, inkColor } from "@/lib/notebookCanvas";

// メモ欄に置いた1つの文字ブロック（長押しで移動できる）
export default function MemoBlock({ block, surfaceRef, selected, onSelect, onChange, onPatch, onRemove }) {
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [block.text]);

  useEffect(() => {
    if (selected) inputRef.current?.focus();
  }, [selected]);

  const handlePress = (event) => {
    onSelect();
    const surface = surfaceRef.current;
    if (!surface) return;

    const drag = createCanvasDrag(boxRef.current, block, surface.getBoundingClientRect().width);
    startLongPressDrag(event, {
      onActivate: () => inputRef.current?.blur(),
      onDrag: (dx, dy) => drag?.update(dx, dy),
      onEnd: () => {
        const position = drag?.commit();
        if (position) onPatch(position);
      }
    });
  };

  return (
    <div ref={boxRef} style={{ left: block.x, top: block.y, width: block.width }} className="absolute">
      <textarea
        ref={inputRef}
        value={block.text}
        onChange={(event) => onChange(event.target.value)}
        onPointerDown={handlePress}
        onBlur={() => {
          if (!block.text.trim()) onRemove();
        }}
        rows={1}
        placeholder="メモ"
        className="w-full resize-none overflow-hidden bg-transparent leading-7 outline-none placeholder:text-foreground/30"
        style={{
          fontFamily: fontStack(block.font),
          color: inkColor(block.color),
          fontSize: `${fontPixels(block.size)}px`
        }}
      />

      {selected && block.text.trim() && (
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          aria-label="このメモを消す"
          className="absolute -right-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 text-foreground/60"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}