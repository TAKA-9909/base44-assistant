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

// 応答が返らずに切れた通信エラーかどうか
const isNetworkError = (error) => /network error|failed to fetch|timeout/i.test(error?.message || "");

export function noteErrorMessage(error) {
  if (isNetworkError(error)) {
    return "通信が途切れました。電波の良い場所でもう一度お試しください。";
  }
  return (
    error?.response?.data?.error ||
    error?.message ||
    "ノートを作成できませんでした。もう一度お試しください。"
  );
}

// 送信中に切れた場合は一度だけ送り直す
export async function uploadAudio(file) {
  try {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    return file_url;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    return file_url;
  }
}

export async function generateNote({ noteId, audioUrl, title, course }) {
  const payload = { audio_url: audioUrl, title: title || "", course: course || "" };
  let response;
  try {
    response = await base44.functions.invoke("transcribeLecture", payload);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    response = await base44.functions.invoke("transcribeLecture", payload);
  }
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