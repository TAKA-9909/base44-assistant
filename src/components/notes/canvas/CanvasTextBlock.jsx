import React, { useEffect, useRef } from "react";
import { MIN_TEXT_WIDTH, fontPixels, fontStack, inkColor } from "@/lib/notebookCanvas";

export default function CanvasTextBlock({ block, onChange, onSelect, onBlur, onWidth }) {
  const ref = useRef(null);
  const mirrorRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const mirror = mirrorRef.current;
    if (!el || !mirror) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;

    const surface = el.closest("[data-canvas-surface]");
    const surfaceWidth = surface
      ? surface.getBoundingClientRect().width
      : el.parentElement.getBoundingClientRect().width;
    // 紙の端に届いたら折り返すので、枠はそこまでで止める
    const available = Math.max(surfaceWidth - block.x, MIN_TEXT_WIDTH);
    // 空のときは入力しやすい広さを保ち、文章があるときは一番長い行に合わせる
    const measured = block.text
      ? Math.max(mirror.offsetWidth + 2, MIN_TEXT_WIDTH)
      : Math.max(block.width, MIN_TEXT_WIDTH);
    const next = Math.round(Math.min(measured, available));
    if (Math.abs(next - block.width) > 1) onWidth(next);
  }, [block.text, block.width, block.x, block.size, block.font]);

  const textStyle = {
    fontFamily: fontStack(block.font),
    fontSize: `${fontPixels(block.size)}px`,
    lineHeight: 1.7,
    color: inkColor(block.color)
  };

  return (
    <>
      <textarea
        id={`canvas-text-${block.id}`}
        ref={ref}
        rows={1}
        value={block.text}
        onChange={(event) => onChange({ text: event.target.value })}
        onFocus={onSelect}
        onBlur={onBlur}
        placeholder="ここに入力"
        className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-notebook-paper-foreground/35"
        style={{ ...textStyle, whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
      />
      <span
        ref={mirrorRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 w-max select-none whitespace-pre"
        style={{ ...textStyle, color: "transparent" }}
      >
        {block.text}
      </span>
    </>
  );
}