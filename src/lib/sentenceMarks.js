// 一文ずつに分けて、押された文にマーカーを引くための共通処理
export const splitSentences = (text) => {
  const lines = String(text || "").match(/[^\n]+|\n/g) || [];
  return lines.flatMap((line) =>
    line === "\n" ? ["\n"] : line.match(/[^。．！？!?]*[。．！？!?]|[^。．！？!?]+/g) || []
  );
};

export const isMarked = (marks, key) => (marks || []).includes(key);

export const toggleMark = (marks, key) => {
  const list = marks || [];
  return list.includes(key) ? list.filter((entry) => entry !== key) : [...list, key];
};