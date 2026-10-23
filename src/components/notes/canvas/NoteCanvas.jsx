import React, { useRef } from "react";
import CanvasBlock from "./CanvasBlock";
import {
  MARKER_HEIGHT,
  MAX_MARKER_HEIGHT,
  MAX_STAMP_SIZE,
  MIN_MARKER_HEIGHT,
  MIN_STAMP_SIZE,
  PAPER_HEIGHT,
  PAPER_WIDTH,
  STAMP_SIZE,
  clamp,
  normalizeAngle,
  stampSize
} from "@/lib/notebookCanvas";

export default function NoteCanvas({ blocks, selectedId, onSelect, onCreate, onUpdate, onDelete }) {
  const surfaceRef = useRef(null);

  const surfaceWidth = () => {
    const el = surfaceRef.current;
    return el ? el.getBoundingClientRect().width : PAPER_WIDTH;
  };

  const handleSurfaceClick = (event) => {
    if (event.target !== event.currentTarget) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    onCreate({ x: event.clientX - rect.left, y: event.clientY - rect.top, surfaceWidth: rect.width });
  };

  const beginGesture = (event, block, mode) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const width = surfaceWidth();
    // スタンプは固有の幅を持たないので、文字の大きさを目安にする
    const spanWidth = block.width || (block.type === "stamp" ? stampSize(block) : 0);

    // 回転はブロックの中心を軸にする（回転しても中心は動かない）
    const box = event.currentTarget?.parentElement?.getBoundingClientRect();
    const center = box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: startX, y: startY };
    const pointerAngle = (pointEvent) =>
      (Math.atan2(pointEvent.clientY - center.y, pointEvent.clientX - center.x) * 180) / Math.PI;
    const startAngle = pointerAngle(event);

    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (mode === "rotate") {
        onUpdate(block.id, { angle: normalizeAngle((block.angle || 0) + pointerAngle(moveEvent) - startAngle) });
        return;
      }
      if (mode === "move") {
        onUpdate(block.id, {
          x: Math.round(clamp(block.x + dx, 0, Math.max(width - spanWidth, 0))),
          y: Math.round(clamp(block.y + dy, 0, PAPER_HEIGHT - 44))
        });
        return;
      }
      if (mode === "height") {
        onUpdate(block.id, {
          height: Math.round(
            clamp((block.height || MARKER_HEIGHT) + dy, MIN_MARKER_HEIGHT, MAX_MARKER_HEIGHT)
          )
        });
        return;
      }
      if (block.type === "stamp") {
        onUpdate(block.id, {
          size: Math.round(
            clamp((block.size || STAMP_SIZE) + dx + dy, MIN_STAMP_SIZE, MAX_STAMP_SIZE)
          )
        });
        return;
      }
      onUpdate(block.id, {
        width: Math.round(clamp(block.width + dx, 80, Math.max(width - block.x, 80)))
      });
    };

    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  return (
    <div
      ref={surfaceRef}
      onClick={handleSurfaceClick}
      style={{ height: `${PAPER_HEIGHT}px` }}
      className="notebook-ruled-soft relative w-full cursor-text overflow-hidden bg-card"
    >
      {blocks.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-24 text-center text-sm text-notebook-paper-foreground/40">
          好きな場所をタップすると書き込めます
        </p>
      )}

      {blocks.map((block) => (
        <CanvasBlock
          key={block.id}
          block={block}
          selected={block.id === selectedId}
          onSelect={() => onSelect(block.id)}
          onChange={(patch) => onUpdate(block.id, patch)}
          onDelete={() => onDelete(block.id)}
          onMoveStart={(event) => beginGesture(event, block, "move")}
          onResizeStart={(event) => beginGesture(event, block, "resize")}
          onResizeHeightStart={(event) => beginGesture(event, block, "height")}
          onRotateStart={(event) => beginGesture(event, block, "rotate")}
        />
      ))}
    </div>
  );
}