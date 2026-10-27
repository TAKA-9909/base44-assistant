// なぞって選んだ範囲にマーカーを引くための範囲計算（文字位置で保存する）
const overlaps = (range, start, end) => range.start < end && start < range.end;

const limit = (value, min, max) => Math.min(Math.max(value, min), max);

export const rangesForField = (marks, field) =>
  (marks || []).filter((mark) => mark.field === field);

const mergeRanges = (ranges) => {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  return sorted.reduce((merged, range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
    return merged;
  }, []);
};

// すでにマーカーの上をなぞったときは消し、それ以外は引く
export const toggleRange = (marks, field, start, end) => {
  const list = marks || [];
  const same = rangesForField(list, field);
  const others = list.filter((mark) => mark.field !== field);
  const covered = same.some((mark) => mark.start <= start && end <= mark.end);
  const trimmed = same.flatMap((mark) => {
    if (!overlaps(mark, start, end)) return [mark];
    const pieces = [];
    if (mark.start < start) pieces.push({ ...mark, end: start });
    if (end < mark.end) pieces.push({ ...mark, start: end });
    return pieces;
  });
  if (covered) return [...others, ...trimmed];
  return [...others, ...mergeRanges([...trimmed, { field, start, end }])];
};

// 描画用に、マーカーの内側と外側でテキストを切り分ける
export const splitByRanges = (text, ranges) => {
  const source = String(text || "");
  const sorted = mergeRanges((ranges || []).filter((range) => range.start < range.end));
  const segments = [];
  let cursor = 0;
  sorted.forEach((range) => {
    const start = limit(range.start, 0, source.length);
    const end = limit(range.end, 0, source.length);
    if (start > cursor) segments.push({ text: source.slice(cursor, start), marked: false });
    if (end > start) segments.push({ text: source.slice(start, end), marked: true });
    cursor = Math.max(cursor, end);
  });
  if (cursor < source.length) segments.push({ text: source.slice(cursor), marked: false });
  return segments;
};

// 画面上で選んでいる範囲を、その要素の中の文字位置に置き換える
export const selectionOffsets = (root) => {
  if (!root) return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const offsetOf = (node, offset) => {
    const probe = document.createRange();
    probe.setStart(root, 0);
    probe.setEnd(node, offset);
    return probe.toString().length;
  };
  const start = offsetOf(range.startContainer, range.startOffset);
  const end = offsetOf(range.endContainer, range.endOffset);
  return end > start ? { start, end } : null;
};