import { base44 } from "@/api/base44Client";

export function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  if (total <= 0) return "";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) return `${h}時間${m}分`;
  if (m > 0) return `${m}分${String(s).padStart(2, "0")}秒`;
  return `${s}秒`;
}

export function formatClock(seconds) {
  const total = Number(seconds) || 0;
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export function noteErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    "ノートを作成できませんでした。もう一度お試しください。"
  );
}

export async function generateNote({ noteId, audioUrl, title, course }) {
  const response = await base44.functions.invoke("transcribeLecture", {
    audio_url: audioUrl,
    title: title || "",
    course: course || ""
  });
  const data = response?.data || {};
  if (data.error) throw new Error(data.error);

  await base44.entities.LectureNote.update(noteId, {
    transcript: data.transcript || "",
    summary: data.summary || "",
    key_points: data.key_points || [],
    outline: data.outline || [],
    terms: data.terms || [],
    status: "ready",
    error_message: ""
  });

  return data;
}