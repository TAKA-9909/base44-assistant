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

export async function uploadAudioFiles(files) {
  const urls = [];
  for (const file of files) {
    urls.push(await uploadAudio(file));
  }
  return urls;
}

const invoke = async (payload) => {
  try {
    return await base44.functions.invoke("transcribeLecture", payload);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return base44.functions.invoke("transcribeLecture", payload);
  }
};

// 1つの音声を文字起こしする
export async function transcribeAudioUrl(audioUrl) {
  const response = await invoke({ mode: "transcribe", audio_url: audioUrl });
  const data = response?.data || {};
  if (data.error) throw new Error(data.error);
  return data.transcript || "";
}

// 長い文字起こしはそのままでは保存できないため、テキストファイルにして URL を持つ
const MAX_STORED_TRANSCRIPT = 15000;

async function storeTranscript(noteId, text) {
  if (text.length <= MAX_STORED_TRANSCRIPT) {
    return { transcript: text, transcript_url: "" };
  }

  const file = new File([text], `transcript-${noteId}.txt`, {
    type: "text/plain;charset=utf-8"
  });
  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
  return { transcript: "", transcript_url: file_url };
}

// 保存された文字起こしを、必要ならファイルから読み込む
export async function loadTranscript(note) {
  if (!note) return "";
  if (note.transcript) return note.transcript;
  if (!note.transcript_url) return "";
  try {
    const response = await fetch(note.transcript_url);
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
}

// 文字起こし済みの内容からノートを作る
export async function generateNoteFromTranscript({ noteId, transcript, title, course }) {
  const text = (transcript || "").trim();
  if (!text) throw new Error("音声を文字起こしできませんでした。");

  const response = await invoke({
    mode: "note",
    transcript: text,
    title: title || "",
    course: course || ""
  });
  const data = response?.data || {};
  if (data.error) throw new Error(data.error);

  const stored = await storeTranscript(noteId, text);

  await base44.entities.LectureNote.update(noteId, {
    ...stored,
    summary: data.summary || "",
    key_points: data.key_points || [],
    outline: data.outline || [],
    terms: data.terms || [],
    status: "ready",
    error_message: ""
  });

  return data;
}

const isTooLargeError = (error) => /too large|25\s*MB/i.test(error?.message || "");
const LIMIT_BYTES = 24 * 1024 * 1024;

// 大きすぎる音声かどうかを、送る前に確認する
async function isTooLargeUrl(audioUrl) {
  try {
    const head = await fetch(audioUrl, { method: "HEAD" });
    const size = Number(head.headers.get("content-length") || 0);
    return size > LIMIT_BYTES;
  } catch {
    return false;
  }
}

// 大きな音声はサーバー側で分けてもらい、1つずつ文字起こしする
async function transcribeBySplitting(audioUrl) {
  const response = await invoke({ mode: "split", audio_url: audioUrl });
  const parts = response?.data?.parts || [];
  if (parts.length === 0) {
    throw new Error("音声を分割できませんでした。25MB以下の音声でお試しください。");
  }

  const texts = [];
  for (const url of parts) {
    texts.push(await transcribeAudioUrl(url));
  }
  return texts.filter(Boolean).join("\n");
}

// 25MB を超える音声は、必ず分割してから文字起こしする
async function transcribeSafely(audioUrl) {
  if (await isTooLargeUrl(audioUrl)) {
    return transcribeBySplitting(audioUrl);
  }

  try {
    return await transcribeAudioUrl(audioUrl);
  } catch (error) {
    if (!isTooLargeError(error)) throw error;
  }

  return transcribeBySplitting(audioUrl);
}

// 分割された音声を1つずつ文字起こしし、まとめてからノートを作る
export async function generateNote({ noteId, audioUrls, title, course }) {
  const urls = (audioUrls || []).filter(Boolean);
  if (urls.length === 0) throw new Error("音声が見つかりませんでした。");

  const parts = [];
  for (const audioUrl of urls) {
    parts.push(await transcribeSafely(audioUrl));
  }

  const transcript = parts.filter(Boolean).join("\n");
  if (!transcript.trim()) throw new Error("音声を文字起こしできませんでした。");

  return generateNoteFromTranscript({ noteId, transcript, title, course });
}