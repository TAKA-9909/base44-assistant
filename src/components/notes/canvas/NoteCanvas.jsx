import React, { useRef } from "react";
import CanvasBlock from "./CanvasBlock";
import { PAPER_HEIGHT, PAPER_WIDTH, clamp } from "@/lib/notebookCanvas";

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

    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (mode === "move") {
        onUpdate(block.id, {
          x: Math.round(clamp(block.x + dx, 0, Math.max(width - block.width, 0))),
          y: Math.round(clamp(block.y + dy, 0, PAPER_HEIGHT - 44))
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
        />
      ))}
    </div>
  );
}