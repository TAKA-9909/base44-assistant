import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import NoteCanvas from "./NoteCanvas";
import CanvasToolbar from "./CanvasToolbar";
import {
  DEFAULT_STYLE,
  clamp,
  createImageBlock,
  createMarkerBlock,
  createTextBlock
} from "@/lib/notebookCanvas";

export default function CanvasEditor({ blocks, onChange }) {
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const lastPoint = useRef({ x: 40, y: 40 });

  const selected = blocks.find((block) => block.id === selectedId);

  const updateBlock = (id, patch) =>
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  const appendBlock = (block) => {
    onChange([...blocks, block]);
    setSelectedId(block.id);
  };

  const handleCreate = ({ x, y, surfaceWidth }) => {
    const width = Math.round(clamp(surfaceWidth - x, 160, 320));
    const point = { x: Math.round(clamp(x, 0, Math.max(surfaceWidth - width, 0))), y: Math.round(y) };
    lastPoint.current = point;

    const block = createTextBlock(point.x, point.y, style, width);
    appendBlock(block);
    setTimeout(() => document.getElementById(`canvas-text-${block.id}`)?.focus(), 0);
  };

  const applyStyle = (patch) => {
    setStyle((current) => ({ ...current, ...patch }));
    if (!selected) return;
    if (patch.color && selected.type === "marker") {
      updateBlock(selected.id, { color: patch.color });
      return;
    }
    if (selected.type === "text") updateBlock(selected.id, patch);
  };

  const handleInsertLine = () => {
    appendBlock(createMarkerBlock(lastPoint.current.x, lastPoint.current.y, style.color));
  };

  const handleInsertSymbol = (symbol) => {
    if (selected?.type === "text") {
      updateBlock(selected.id, { text: `${selected.text}${symbol}` });
      return;
    }
    appendBlock({ ...createTextBlock(lastPoint.current.x, lastPoint.current.y, style), text: symbol });
  };

  const handleDelete = (id) => {
    onChange(blocks.filter((block) => block.id !== id));
    setSelectedId(null);
  };

  const handlePickImage = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      appendBlock(createImageBlock(file_uri, lastPoint.current.x, lastPoint.current.y));
    } catch {
      setError("画像を挿入できませんでした。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <NoteCanvas
        blocks={blocks}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onUpdate={updateBlock}
        onDelete={handleDelete}
      />
      <div className="sticky bottom-0 z-30">
        {error && <p className="bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>}
        <CanvasToolbar
          font={style.font}
          color={style.color}
          size={style.size}
          onFont={(id) => applyStyle({ font: id })}
          onColor={(id) => applyStyle({ color: id })}
          onSize={(id) => applyStyle({ size: id })}
          onInsertLine={handleInsertLine}
          onInsertSymbol={handleInsertSymbol}
          onPickImage={handlePickImage}
          uploading={uploading}
        />
      </div>
    </div>
  );
}