import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isMarked, splitSentences, toggleMark } from "@/lib/sentenceMarks";
import { MIN_TEXT_WIDTH, fontPixels, fontStack, inkColor } from "@/lib/notebookCanvas";

const TAP_MS = 350;
const TAP_MOVE = 6;

export default function CanvasTextBlock({ block, onChange, onSelect, onBlur, onWidth }) {
  const ref = useRef(null);
  const mirrorRef = useRef(null);
  const pressRef = useRef(null);
  // 文章があるときは読み取り表示（文を押すとマーカー）で、ダブルタップすると書き込みに戻る
  const [editing, setEditing] = useState(!block.text);

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
  }, [block.text, block.width, block.x, block.size, block.font, editing]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const textStyle = {
    fontFamily: fontStack(block.font),
    fontSize: `${fontPixels(block.size)}px`,
    lineHeight: 1.7,
    color: inkColor(block.color)
  };

  // 軽く押したときだけマーカーを引く（長押し移動やドラッグのときは引かない）
  const handleSentenceClick = (event, sentence) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    const moved =
      Math.abs(event.clientX - press.x) > TAP_MOVE || Math.abs(event.clientY - press.y) > TAP_MOVE;
    if (moved || Date.now() - press.time > TAP_MS) return;
    onChange({ marks: toggleMark(block.marks, sentence) });
  };

  return (
    <>
      {editing ? (
        <textarea
          id={`canvas-text-${block.id}`}
          ref={ref}
          rows={1}
          value={block.text}
          onChange={(event) => onChange({ text: event.target.value })}
          onFocus={onSelect}
          onBlur={() => {
            setEditing(false);
            onBlur();
          }}
          placeholder="ここに入力"
          className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-notebook-paper-foreground/35"
          style={{ ...textStyle, whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
        />
      ) : (
        <div
          onPointerDown={(event) =>
            (pressRef.current = { x: event.clientX, y: event.clientY, time: Date.now() })
          }
          onDoubleClick={() => setEditing(true)}
          className="w-full whitespace-pre-wrap break-words"
          style={textStyle}
        >
          {splitSentences(block.text).map((sentence, index) =>
            sentence === "\n" ? (
              <br key={`br-${index}`} />
            ) : (
              <span
                key={`${index}-${sentence}`}
                onClick={(event) => handleSentenceClick(event, sentence)}
                className={cn(
                  "cursor-pointer",
                  isMarked(block.marks, sentence) ? "marker-ink" : "marker-target"
                )}
              >
                {sentence}
              </span>
            )
          )}
        </div>
      )}
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