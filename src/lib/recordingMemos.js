import { base44 } from "@/api/base44Client";
import { parseCanvas } from "@/lib/notebookCanvas";

// 録音中にメモした内容（キャンバス、または文章）を付箋の文に分ける
// 空行（改行を一行あける）で区切られた部分は、それぞれ別の付箋にする
export function recordingMemoTexts(content) {
  const layout = parseCanvas(content);
  const blocks = layout
    ? layout.blocks.map((block) => block.text || "")
    : [content || ""];

  return blocks
    .flatMap((text) => text.split(/\n\s*\n/))
    .map((text) => text.trim())
    .filter(Boolean);
}

// 録音中のメモを、まとめページに貼る付箋として一度だけ登録する
export async function ensureRecordingMemos(note) {
  const memos = note.summary_memos || [];
  if (note.recording_memos_saved || note.source === "manual") return memos;

  const texts = recordingMemoTexts(note.content);
  if (texts.length === 0) return memos;

  const stamp = Date.now();
  const added = texts.map((text, index) => ({
    id: `memo-rec-${stamp}-${index}`,
    anchor: "recording",
    text
  }));
  const next = [...memos, ...added];

  try {
    await base44.entities.LectureNote.update(note.id, {
      summary_memos: next,
      recording_memos_saved: true
    });
  } catch {
    return memos;
  }
  return next;
}