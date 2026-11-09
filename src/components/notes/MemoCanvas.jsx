import React, { useRef, useState } from "react";
import {
  DEFAULT_STYLE,
  clamp,
  createTextBlock,
  parseCanvas,
  serializeCanvas
} from "@/lib/notebookCanvas";
import MemoBlock from "./MemoBlock";

// 押した場所に文字を置けるメモ用の小さな紙
export default function MemoCanvas({ value, onChange }) {
  const surfaceRef = useRef(null);
  const [blocks, setBlocks] = useState(() => parseCanvas(value)?.blocks || []);
  const [selectedId, setSelectedId] = useState(null);

  const apply = (next) => {
    setBlocks(next);
    onChange(serializeCanvas(next));
  };

  const patch = (id, data) => apply(blocks.map((block) => (block.id === id ? { ...block, ...data } : block)));
  const remove = (id) => {
    apply(blocks.filter((block) => block.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSurfaceClick = (event) => {
    if (event.target !== event.currentTarget) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const width = Math.min(220, Math.max(rect.width - 16, 100));
    const block = createTextBlock(
      clamp(event.clientX - rect.left, 0, Math.max(rect.width - width, 0)),
      clamp(event.clientY - rect.top, 0, Math.max(rect.height - 40, 0)),
      DEFAULT_STYLE,
      width
    );
    apply([...blocks, block]);
    setSelectedId(block.id);
  };

  return (
    <div
      ref={surfaceRef}
      onClick={handleSurfaceClick}
      className="relative h-56 w-full cursor-text overflow-y-auto"
    >
      {blocks.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-12 text-center text-xs text-foreground/40">
          押した場所に文字を書けます
        </p>
      )}

      {blocks.map((block) => (
        <MemoBlock
          key={block.id}
          block={block}
          surfaceRef={surfaceRef}
          selected={block.id === selectedId}
          onSelect={() => setSelectedId(block.id)}
          onChange={(text) => patch(block.id, { text })}
          onPatch={(data) => patch(block.id, data)}
          onRemove={() => remove(block.id)}
        />
      ))}
    </div>
  );
}