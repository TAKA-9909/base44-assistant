import React, { useEffect, useRef } from "react";
import { MIN_TEXT_WIDTH, fontPixels, fontStack, inkColor, toggleTextMarks } from "@/lib/notebookCanvas";

// なぞった範囲をマーカーの帯つきで描けるよう、文字列を断片に分ける
const markSegments = (text, marks) => {
  const ranges = (Array.isArray(marks) ? marks : [])
    .map((mark) => ({ start: Math.max(mark.start, 0), end: Math.min(mark.end, text.length) }))
    .filter((mark) => mark.end > mark.start)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  ranges.forEach((range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  });

  const segments = [];
  let cursor = 0;
  merged.forEach((range) => {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), marked: false });
    segments.push({ text: text.slice(range.start, range.end), marked: true });
    cursor = range.end;
  });
  segments.push({ text: text.slice(cursor), marked: false });
  return segments;
};

const MARK_STYLE = {
  backgroundImage: "linear-gradient(hsl(var(--marker) / 0.85), hsl(var(--marker) / 0.85))",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 0.45em",
  backgroundPosition: "0 88%"
};

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

  // なぞり終えたときに、選択した範囲へマーカーの線を引く
  const handleTrace = (event) => {
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (selectionEnd <= selectionStart) return;
    onChange({ marks: toggleTextMarks(block.marks, selectionStart, selectionEnd) });
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words"
        style={{ ...textStyle, color: "transparent" }}
      >
        {markSegments(block.text, block.marks).map((segment, index) =>
          segment.marked ? (
            <span key={index} style={MARK_STYLE}>
              {segment.text}
            </span>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        )}
      </div>
      <textarea
        id={`canvas-text-${block.id}`}
        ref={ref}
        rows={1}
        value={block.text}
        onChange={(event) => onChange({ text: event.target.value })}
        onFocus={onSelect}
        onBlur={onBlur}
        onPointerUp={handleTrace}
        placeholder="ここに入力"
        className="relative block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-notebook-paper-foreground/35"
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