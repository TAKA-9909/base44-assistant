import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { rangesForField, selectionOffsets, splitByRanges, toggleRange } from "@/lib/highlightRanges";

// なぞって選んだ範囲にマーカーを引く読み物テキスト。もう一度なぞると消える
export default function MarkedText({ text, field, marks, onMark, className }) {
  const ref = useRef(null);

  const handleSelectionEnd = () => {
    const offsets = selectionOffsets(ref.current);
    if (!offsets) return;
    window.getSelection()?.removeAllRanges();
    onMark(toggleRange(marks, field, offsets.start, offsets.end));
  };

  return (
    <span
      ref={ref}
      onPointerUp={handleSelectionEnd}
      className={cn("select-text", className)}
    >
      {splitByRanges(text, rangesForField(marks, field)).map((segment, index) =>
        segment.marked ? (
          <span key={index} className="marker-ink">
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </span>
  );
}