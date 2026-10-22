import React, { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_FONT_SIZE, MIN_FONT_SIZE, SIZE_OPTIONS, clamp, fontPixels } from "@/lib/notebookCanvas";

const STEP =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border transition hover:bg-secondary";
const PRESET = "rounded-md border border-border px-2 py-1.5 text-xs transition hover:bg-secondary";

export default function CanvasSizeControl({ size, onSize }) {
  const inputRef = useRef(null);
  const [text, setText] = useState(String(fontPixels(size)));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setText(String(fontPixels(size)));
  }, [size]);

  const apply = (value) => onSize(clamp(Math.round(value), MIN_FONT_SIZE, MAX_FONT_SIZE));

  const handleInput = (raw) => {
    setText(raw);
    const numeric = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(numeric) && numeric >= MIN_FONT_SIZE) apply(numeric);
  };

  const handleBlur = () => {
    const numeric = Number(text);
    if (text.trim() === "" || !Number.isFinite(numeric)) {
      setText(String(fontPixels(size)));
      return;
    }
    const next = clamp(Math.round(numeric), MIN_FONT_SIZE, MAX_FONT_SIZE);
    apply(next);
    setText(String(next));
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="小さく"
          onClick={() => apply(fontPixels(size) - 1)}
          className={STEP}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-1 items-center gap-1 rounded-md border border-border px-2">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={1}
            value={text}
            onChange={(event) => handleInput(event.target.value)}
            onBlur={handleBlur}
            className="h-8 w-full border-0 bg-transparent p-0 text-right text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        <button
          type="button"
          aria-label="大きく"
          onClick={() => apply(fontPixels(size) + 1)}
          className={STEP}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1">
        {SIZE_OPTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => apply(entry.value)}
            className={`${PRESET} ${
              fontPixels(size) === entry.value ? "border-accent text-accent" : "text-foreground"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </div>
  );
}