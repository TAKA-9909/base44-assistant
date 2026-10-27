export const CANVAS_VERSION = 1;
export const PAPER_WIDTH = 760;
export const PAPER_HEIGHT = 780;

export const FONT_OPTIONS = [
  { id: "mincho", label: "明朝", value: "var(--font-display)" },
  { id: "classic", label: "古明朝", value: "var(--font-classic)" },
  { id: "antique", label: "アンティーク", value: "var(--font-antique)" },
  { id: "gothic", label: "ゴシック", value: "var(--font-body)" },
  { id: "rounded", label: "丸ゴシック", value: "var(--font-rounded)" },
  { id: "hand", label: "手書き", value: "var(--font-hand)" },
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
  { id: "gray", label: "灰", value: "hsl(var(--ink-gray))" },
  { id: "navy", label: "紺", value: "hsl(var(--primary))" },
  { id: "blue", label: "青", value: "hsl(var(--ink-blue))" },
  { id: "sky", label: "空色", value: "hsl(var(--ink-sky))" },
  { id: "teal", label: "青緑", value: "hsl(var(--ink-teal))" },
  { id: "green", label: "緑", value: "hsl(var(--ink-green))" },
  { id: "olive", label: "萌黄", value: "hsl(var(--ink-olive))" },
  { id: "amber", label: "山吹", value: "hsl(var(--ink-amber))" },
  { id: "orange", label: "橙", value: "hsl(var(--ink-orange))" },
  { id: "brown", label: "茶", value: "hsl(var(--ink-brown))" },
  { id: "red", label: "赤", value: "hsl(var(--destructive))" },
  { id: "vermilion", label: "朱", value: "hsl(var(--accent))" },
  { id: "pink", label: "桃", value: "hsl(var(--ink-pink))" },
  { id: "purple", label: "紫", value: "hsl(var(--ink-purple))" }
];

export const SYMBOL_OPTIONS = [
  "→", "←", "↑", "↓", "⇒", "⇔",
  "★", "☆", "✓", "☑", "◎", "●",
  "▲", "▼", "■", "□", "※", "≈",
  "＋", "－", "±", "×", "÷", "＝",
  "≠", "＜", "＞", "≤", "≥", "√",
  "∑", "∫", "∞", "π", "∠", "∴"
];

export const DEFAULT_STYLE = { font: "mincho", color: "ink", size: 18 };

// ブロックは共通で angle（度）を持つ。未設定は 0 度として扱う。
export const normalizeAngle = (value) => {
  const rounded = Math.round(Number(value) || 0);
  return ((rounded % 360) + 360) % 360;
};

export const MIN_TEXT_WIDTH = 24;

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
    marks: [],
    font: style.font,
    color: style.color,
    size: style.size
  };
}

export function createImageBlock(fileUri, x, y, width = 260) {
  return { id: createId(), type: "image", x: Math.round(x), y: Math.round(y), width, file_uri: fileUri };
}

export const MARKER_HEIGHT = 16;
export const MIN_MARKER_HEIGHT = 4;
export const MAX_MARKER_HEIGHT = 160;

export const markerHeight = (block) =>
  clamp(Math.round(block.height || MARKER_HEIGHT), MIN_MARKER_HEIGHT, MAX_MARKER_HEIGHT);

export const blockSpanWidth = (block) =>
  block.width || (block.type === "stamp" ? stampSize(block) : 0);

// ドラッグ中の移動先（紙の外に出ないように収める）
export const movedBlockPosition = (block, dx, dy, surfaceWidth) => ({
  x: Math.round(clamp(block.x + dx, 0, Math.max(surfaceWidth - blockSpanWidth(block), 0))),
  y: Math.round(clamp(block.y + dy, 0, PAPER_HEIGHT - 44))
});

// 上下の辺は水平、左右の辺は右に傾いた平行四辺形にする
export const markerClipPath = (height) => {
  const shear = clamp(Math.round(height * 0.5), 4, 40);
  return `polygon(${shear}px 0, 100% 0, calc(100% - ${shear}px) 100%, 0 100%)`;
};

export function createMarkerBlock(x, y, color, width = 220) {
  return {
    id: createId(),
    type: "marker",
    x: Math.round(x),
    y: Math.round(y),
    width,
    height: MARKER_HEIGHT,
    color
  };
}

export const STAMP_SIZE = 34;
export const MIN_STAMP_SIZE = 14;
export const MAX_STAMP_SIZE = 140;

// スタンプはフォント設定を持たず、大きさとインク色だけで描く
export const stampSize = (block) =>
  clamp(Math.round(block.size || STAMP_SIZE), MIN_STAMP_SIZE, MAX_STAMP_SIZE);

export function createStampBlock(symbol, x, y, color) {
  return {
    id: createId(),
    type: "stamp",
    x: Math.round(x),
    y: Math.round(y),
    symbol,
    size: STAMP_SIZE,
    color
  };
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