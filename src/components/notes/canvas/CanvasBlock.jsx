import React from "react";
import { GripVertical, Maximize2, MoveVertical, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CanvasTextBlock from "./CanvasTextBlock";
import NoteCanvasImage from "./NoteCanvasImage";
import { inkColor, markerClipPath, markerHeight, stampSize } from "@/lib/notebookCanvas";

const HANDLE =
  "flex h-6 w-6 items-center justify-center rounded-full bg-canvas-bar text-canvas-bar-foreground shadow";

export default function CanvasBlock({
  block,
  selected,
  onSelect,
  onPressStart,
  onChange,
  onDelete,
  onMoveStart,
  onResizeStart,
  onResizeHeightStart,
  onRotateStart,
  tracing
}) {
  const markerSize = block.type === "marker" ? markerHeight(block) : 0;
  const stampPx = block.type === "stamp" ? stampSize(block) : 0;

  return (
    <div
      className={cn(
        "absolute",
        // 長押しドラッグでの移動中に画面がスクロールしないようにする
        block.type !== "image" && "touch-none",
        selected && "rounded-md ring-2 ring-accent/60"
      )}
      style={{
        left: `${block.x}px`,
        top: `${block.y}px`,
        ...(block.width ? { width: `${block.width}px` } : {}),
        ...(block.angle ? { transform: `rotate(${block.angle}deg)` } : {})
      }}
      onPointerDown={onPressStart}
    >
      {block.type === "text" && (
        <CanvasTextBlock
          block={block}
          onSelect={onSelect}
          onChange={onChange}
          tracing={tracing}
          onWidth={(width) => onChange({ width })}
          onBlur={() => {
            if (!block.text.trim()) onDelete();
          }}
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
        <div
          style={{
            height: `${markerSize}px`,
            background: inkColor(block.color),
            clipPath: markerClipPath(markerSize)
          }}
        />
      )}

      {block.type === "stamp" && (
        <div
          className="select-none leading-none"
          // 小さく縮めたシンボルも長押ししやすいよう、見た目を変えずに当たり判定だけ広げる
          style={{ fontSize: `${stampPx}px`, color: inkColor(block.color), padding: "8px", margin: "-8px" }}
        >
          {block.symbol}
        </div>
      )}

      {selected && (
        <>
          {/* 小さなシンボルでも重ならないよう、3つのボタンを横一列に並べる */}
          <div className="absolute -top-9 left-0 flex items-center gap-1">
            <button
              type="button"
              aria-label="移動"
              onPointerDown={onMoveStart}
              className={`${HANDLE} cursor-grab touch-none`}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="削除"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onDelete}
              className={HANDLE}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="回転"
              onPointerDown={onRotateStart}
              className={`${HANDLE} cursor-grab touch-none`}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {block.type !== "text" && (
            <button
              type="button"
              aria-label={block.type === "stamp" ? "大きさを変える" : "幅を変える"}
              onPointerDown={onResizeStart}
              className={`${HANDLE} absolute -bottom-3 -right-3 cursor-nwse-resize touch-none`}
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
          {block.type === "marker" && (
            <button
              type="button"
              aria-label="高さを変える"
              onPointerDown={onResizeHeightStart}
              className={`${HANDLE} absolute -bottom-3 left-1/2 -translate-x-1/2 cursor-ns-resize touch-none`}
            >
              <MoveVertical className="h-3 w-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}