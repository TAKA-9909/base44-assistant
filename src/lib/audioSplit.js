// 文字起こしできる音声は 25MB まで。
// それを超える音声は、端末の中で区切ってから送る。
const MAX_PART_BYTES = 18 * 1024 * 1024;
const TARGET_SAMPLE_RATE = 16000;

const fileExtension = (file) => (file?.name?.split(".").pop() || "").toLowerCase();
const isWebm = (file) =>
  /webm/i.test(file.type || "") || ["webm", "weba"].includes(fileExtension(file));
const isMp3 = (file) => /mp3|mpeg/i.test(file.type || "") || fileExtension(file) === "mp3";

export function needsSplit(file) {
  return !!file && file.size > MAX_PART_BYTES;
}

// --- WebM の中身を読むための小さなパーサー ---
function readVint(bytes, pos, keepMarker) {
  const first = bytes[pos];
  if (first === undefined) return null;

  let length = 1;
  let mask = 0x80;
  while (length <= 8 && !(first & mask)) {
    mask >>= 1;
    length += 1;
  }
  if (length > 8) return null;

  let value = keepMarker ? first : first & (mask - 1);
  let unknown = !keepMarker && value === mask - 1;
  for (let i = 1; i < length; i += 1) {
    const byte = bytes[pos + i];
    value = value * 256 + byte;
    if (byte !== 0xff) unknown = false;
  }

  return { length, value, unknown };
}

// サイズ欄を書き換える（先頭バイトのマーカービットは残す）
function writeSize(bytes, pos, length, value) {
  let remaining = value;
  for (let i = length - 1; i >= 0; i -= 1) {
    bytes[pos + i] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  bytes[pos] |= 0x80 >> (length - 1);
}

function findCluster(bytes, from) {
  let at = bytes.indexOf(0x1f, from);
  while (at !== -1) {
    if (bytes[at + 1] === 0x43 && bytes[at + 2] === 0xb6 && bytes[at + 3] === 0x75) return at;
    at = bytes.indexOf(0x1f, at + 1);
  }
  return -1;
}

// WebM は先頭のヘッダー（形式情報・音声情報）を各パーツに付け直し、区切りのよい位置で分ける
function splitWebm(bytes, partBytes) {
  const headId = readVint(bytes, 0, true);
  if (!headId) return [];
  const headSize = readVint(bytes, headId.length, false);
  if (!headSize || headSize.unknown) return [];

  const segmentPos = headId.length + headSize.length + headSize.value;
  const segmentId = readVint(bytes, segmentPos, true);
  if (!segmentId || segmentId.value !== 0x18538067) return [];

  const segmentSizePos = segmentPos + segmentId.length;
  const segmentSize = readVint(bytes, segmentSizePos, false);
  if (!segmentSize) return [];

  const payloadStart = segmentSizePos + segmentSize.length;
  const limit = segmentSize.unknown
    ? bytes.length
    : Math.min(payloadStart + segmentSize.value, bytes.length);

  const clusters = [];
  let cursor = payloadStart;

  while (cursor < limit) {
    const id = readVint(bytes, cursor, true);
    if (!id) break;
    const size = readVint(bytes, cursor + id.length, false);
    if (!size) break;
    const dataStart = cursor + id.length + size.length;

    if (id.value === 0x1f43b675) {
      if (size.unknown) {
        const next = findCluster(bytes, dataStart);
        clusters.push({ start: cursor, end: next === -1 ? limit : next });
        if (next === -1) break;
        cursor = next;
        continue;
      }
      const end = Math.min(dataStart + size.value, limit);
      clusters.push({ start: cursor, end });
      cursor = end;
      continue;
    }

    if (size.unknown) break;
    cursor = dataStart + size.value;
  }

  if (clusters.length < 2) return [];

  const headerLength = clusters[0].start;
  const parts = [];
  let index = 0;

  while (index < clusters.length) {
    let stop = index;
    while (
      stop + 1 < clusters.length &&
      clusters[stop + 1].end - clusters[index].start + headerLength <= partBytes
    ) {
      stop += 1;
    }

    const body = bytes.subarray(clusters[index].start, clusters[stop].end);
    const part = new Uint8Array(headerLength + body.length);
    part.set(bytes.subarray(0, headerLength), 0);
    part.set(body, headerLength);
    writeSize(part, segmentSizePos, segmentSize.length, part.length - payloadStart);

    parts.push(
      new File([part], `lecture-part-${parts.length + 1}.webm`, { type: "audio/webm" })
    );
    index = stop + 1;
  }

  return parts;
}

// MP3 はフレームの切れ目まで進めてから分ける
function splitMp3(bytes, partBytes) {
  const parts = [];
  let start = 0;

  while (start < bytes.length) {
    let end = Math.min(start + partBytes, bytes.length);
    if (end < bytes.length) {
      while (
        end < bytes.length - 1 &&
        !(bytes[end] === 0xff && (bytes[end + 1] & 0xe0) === 0xe0)
      ) {
        end += 1;
      }
    }
    parts.push(
      new File([bytes.subarray(start, end)], `lecture-part-${parts.length + 1}.mp3`, {
        type: "audio/mpeg"
      })
    );
    start = end;
  }

  return parts;
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

// 25MB 以下ならそのまま、超えていれば 18MB ずつに分けて返す
export async function splitAudioFile(file) {
  if (!needsSplit(file)) return [file];

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (isWebm(file)) {
    const parts = splitWebm(bytes, MAX_PART_BYTES);
    if (parts.length > 0) return parts;
  }

  if (isMp3(file)) {
    return splitMp3(bytes, MAX_PART_BYTES);
  }

  // それ以外の形式は、読み込んで WAV に変換しながら分割する
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("この端末では音声を分割できません。25MB以下のファイルでお試しください。");
  }

  const context = new AudioContextClass({ sampleRate: TARGET_SAMPLE_RATE });
  let decoded = null;
  try {
    decoded = await context.decodeAudioData(bytes.buffer);
  } catch {
    decoded = null;
  } finally {
    context.close?.();
  }

  if (!decoded) {
    throw new Error("音声を読み込めませんでした。25MB以下のファイルに分けてお試しください。");
  }

  const samples = decoded.getChannelData(0);
  const sampleRate = decoded.sampleRate || TARGET_SAMPLE_RATE;
  const partSamples = Math.floor(MAX_PART_BYTES / 2 / sampleRate) * sampleRate;
  const parts = [];

  for (let start = 0; start < samples.length; start += partSamples) {
    const chunk = samples.subarray(start, Math.min(start + partSamples, samples.length));
    parts.push(
      new File([encodeWav(chunk, sampleRate)], `lecture-part-${parts.length + 1}.wav`, {
        type: "audio/wav"
      })
    );
  }

  return parts;
}