import React from "react";
import { GripVertical, Maximize2, X } from "lucide-react";
import CanvasTextBlock from "./CanvasTextBlock";
import NoteCanvasImage from "./NoteCanvasImage";
import { inkColor } from "@/lib/notebookCanvas";

const HANDLE =
  "flex h-6 w-6 items-center justify-center rounded-full bg-canvas-bar text-canvas-bar-foreground shadow";

export default function CanvasBlock({ block, selected, onSelect, onChange, onDelete, onMoveStart, onResizeStart }) {
  return (
    <div
      className={selected ? "absolute rounded-md ring-2 ring-accent/60" : "absolute"}
      style={{ left: `${block.x}px`, top: `${block.y}px`, width: `${block.width}px` }}
      onPointerDown={onSelect}
    >
      {block.type === "text" && (
        <CanvasTextBlock
          block={block}
          onSelect={onSelect}
          onChange={(text) => onChange({ text })}
        />
      )}

      {block.type === "image" && (
        <div
          className="overflow-hidden rounded-lg ring-1 ring-notebook-paper-foreground/15"
          style={{ aspectRatio: "4 / 3" }}
        >
          <NoteCanvasImage fileUri={block.file_uri} />
        </div>
      )}

      {block.type === "marker" && (
        <div className="h-3 rounded-full" style={{ background: inkColor(block.color) }} />
      )}

      {selected && (
        <>
          <button
            type="button"
            aria-label="移動"
            onPointerDown={onMoveStart}
            className={`${HANDLE} absolute -top-8 left-0 cursor-grab touch-none`}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="削除"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onDelete}
            className={`${HANDLE} absolute -top-8 left-8`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {block.type !== "text" && (
            <button
              type="button"
              aria-label="幅を変える"
              onPointerDown={onResizeStart}
              className={`${HANDLE} absolute -bottom-3 -right-3 cursor-nwse-resize touch-none`}
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}