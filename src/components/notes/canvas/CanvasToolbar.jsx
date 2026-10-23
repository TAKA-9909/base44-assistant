import React, { useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Baseline, Highlighter, ImagePlus, Loader2, Palette, Shapes, Type } from "lucide-react";
import { COLOR_OPTIONS, FONT_OPTIONS, SYMBOL_OPTIONS, fontPixels } from "@/lib/notebookCanvas";
import CanvasSizeControl from "./CanvasSizeControl";

const ITEM =
  "flex flex-1 flex-col items-center gap-1.5 border-l border-canvas-bar-foreground/15 px-2 py-3.5 text-[11px] tracking-wide transition first:border-l-0 hover:bg-canvas-bar-foreground/10 disabled:opacity-60";
const OPTION = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-secondary";

export default function CanvasToolbar({
  font,
  color,
  size,
  onFont,
  onColor,
  onSize,
  onInsertLine,
  onInsertSymbol,
  onPickImage,
  uploading
}) {
  const fileRef = useRef(null);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPickImage(file);
  };

  return (
    <div className="sticky bottom-0 z-30 flex items-stretch overflow-hidden rounded-b-[22px] bg-canvas-bar text-canvas-bar-foreground shadow-lg">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={ITEM}>
            <Type className="h-4 w-4" />
            <span>フォント</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-44 p-2">
          {FONT_OPTIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onFont(entry.id)}
              className={OPTION}
              style={{ fontFamily: entry.value }}
            >
              <span className="text-base">{entry.label}</span>
              {font === entry.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={ITEM}>
            <Palette className="h-4 w-4" />
            <span>カラー</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-64 p-3">
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-label={entry.label}
                onClick={() => onColor(entry.id)}
                className={`flex h-9 items-center justify-center rounded-md border transition ${
                  color === entry.id ? "border-accent" : "border-border"
                }`}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: entry.value }} />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={ITEM}>
            <Baseline className="h-4 w-4" />
            <span>サイズ</span>
            <span className="text-[10px] text-canvas-bar-foreground/60">{fontPixels(size)}px</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-56 p-3">
          <CanvasSizeControl size={size} onSize={onSize} />
        </PopoverContent>
      </Popover>

      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={ITEM}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        <span>インプット</span>
      </button>

      <button type="button" onClick={onInsertLine} className={ITEM}>
        <Highlighter className="h-4 w-4" />
        <span>ライン</span>
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={ITEM}>
            <Shapes className="h-4 w-4" />
            <span>シンボル</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-56 p-2">
          <div className="grid grid-cols-6 gap-1">
            {SYMBOL_OPTIONS.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => onInsertSymbol(symbol)}
                className="flex h-8 items-center justify-center rounded-md text-base transition hover:bg-secondary"
              >
                {symbol}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}