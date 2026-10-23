import React, { useEffect, useRef } from "react";
import { fontPixels, fontStack, inkColor } from "@/lib/notebookCanvas";

export default function CanvasTextBlock({ block, onChange, onSelect, onBlur, onWidth }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    // 折り返さないので、はみ出した分だけ枠を横に伸ばす
    const needed = el.scrollWidth;
    if (needed > block.width + 2) onWidth(needed);
  }, [block.text, block.width, block.size, block.font]);

  return (
    <textarea
      id={`canvas-text-${block.id}`}
      ref={ref}
      rows={1}
      wrap="off"
      value={block.text}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onSelect}
      onBlur={onBlur}
      placeholder="ここに入力"
      className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-notebook-paper-foreground/35"
      style={{
        fontFamily: fontStack(block.font),
        fontSize: `${fontPixels(block.size)}px`,
        lineHeight: 1.7,
        whiteSpace: "pre",
        color: inkColor(block.color)
      }}
    />
  );
}