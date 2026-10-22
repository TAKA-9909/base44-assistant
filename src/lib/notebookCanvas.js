export const CANVAS_VERSION = 1;
export const PAPER_WIDTH = 760;
export const PAPER_HEIGHT = 780;

export const FONT_OPTIONS = [
  { id: "mincho", label: "明朝", value: "var(--font-display)" },
  { id: "gothic", label: "ゴシック", value: "var(--font-body)" },
  { id: "mono", label: "等幅", value: "var(--font-mono)" }
];

export const SIZE_OPTIONS = [
  { id: "s", label: "小", value: 14 },
  { id: "m", label: "中", value: 18 },
  { id: "l", label: "大", value: 26 },
  { id: "xl", label: "特大", value: 36 }
];

export const COLOR_OPTIONS = [
  { id: "ink", label: "黒", value: "hsl(var(--notebook-paper-foreground))" },
  { id: "navy", label: "紺", value: "hsl(var(--primary))" },
  { id: "red", label: "赤", value: "hsl(var(--destructive))" },
  { id: "vermilion", label: "朱", value: "hsl(var(--accent))" },
  { id: "teal", label: "青緑", value: "hsl(var(--chart-3))" },
  { id: "purple", label: "紫", value: "hsl(var(--chart-5))" }
];

export const SYMBOL_OPTIONS = [
  "→", "←", "↑", "↓", "⇒", "⇔",
  "★", "☆", "✓", "☑", "◎", "●",
  "▲", "▼", "■", "□", "※", "≈"
];

export const DEFAULT_STYLE = { font: "mincho", color: "ink", size: 18 };

export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 72;

const option = (options, id) => options.find((entry) => entry.id === id) || options[0];

export const fontStack = (id) => option(FONT_OPTIONS, id).value;
export const inkColor = (id) => option(COLOR_OPTIONS, id).value;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Accepts a pixel number or a preset size id (older notes store ids).
export const fontPixels = (size) => {
  if (typeof size === "number" && Number.isFinite(size)) {
    return clamp(Math.round(size), MIN_FONT_SIZE, MAX_FONT_SIZE);
  }
  const preset = SIZE_OPTIONS.find((entry) => entry.id === size);
  return preset ? preset.value : SIZE_OPTIONS[1].value;
};

let counter = 0;
const createId = () => {
  counter += 1;
  return `blk-${Date.now().toString(36)}-${counter}`;
};

export function createTextBlock(x, y, style, width = 320) {
  return {
    id: createId(),
    type: "text",
    x: Math.round(x),
    y: Math.round(y),
    width,
    text: "",
    font: style.font,
    color: style.color,
    size: style.size
  };
}

export function createImageBlock(fileUri, x, y, width = 260) {
  return { id: createId(), type: "image", x: Math.round(x), y: Math.round(y), width, file_uri: fileUri };
}

export function createMarkerBlock(x, y, color, width = 220) {
  return { id: createId(), type: "marker", x: Math.round(x), y: Math.round(y), width, color };
}

export function parseCanvas(content) {
  if (typeof content !== "string" || !content.trim()) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.version === CANVAS_VERSION && Array.isArray(parsed.blocks)) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function serializeCanvas(blocks) {
  return JSON.stringify({ version: CANVAS_VERSION, blocks });
}

export function canvasPreview(content, limit = 120) {
  const layout = parseCanvas(content);
  if (!layout) return null;
  const text = layout.blocks
    .filter((block) => block.type === "text" && block.text.trim())
    .map((block) => block.text.trim())
    .join(" ")
    .trim();
  return text ? text.slice(0, limit) : null;
}