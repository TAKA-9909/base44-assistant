// 文字起こしできる音声は 25MB まで。
// それを超える音声は、端末の中で読みやすい WAV に変換しながら分割して送る。
const MAX_PART_BYTES = 18 * 1024 * 1024;
const TARGET_SAMPLE_RATE = 16000;

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

export function needsSplit(file) {
  return !!file && file.size > MAX_PART_BYTES;
}

const isMp3 = (file) =>
  /mp3|mpeg/i.test(file.type || "") || /\.mp3$/i.test(file.name || "");

// 読み込めない形式でも、mp3 なら位置で区切って送れる
function splitByBytes(file, partBytes) {
  const extension = (file.name?.split(".").pop() || "mp3").toLowerCase();
  const parts = [];
  for (let start = 0; start < file.size; start += partBytes) {
    const end = Math.min(start + partBytes, file.size);
    parts.push(
      new File([file.slice(start, end)], `lecture-part-${parts.length + 1}.${extension}`, {
        type: file.type || "audio/mpeg"
      })
    );
  }
  return parts;
}

// 25MB 以下ならそのまま、超えていれば 18MB ずつに分けて返す
export async function splitAudioFile(file) {
  if (!needsSplit(file)) return [file];

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    if (isMp3(file)) return splitByBytes(file, MAX_PART_BYTES);
    throw new Error("この端末では音声を分割できません。25MB以下のファイルでお試しください。");
  }

  const context = new AudioContextClass({ sampleRate: TARGET_SAMPLE_RATE });
  let decoded = null;
  try {
    decoded = await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    decoded = null;
  } finally {
    context.close?.();
  }

  // 読み込めない音声は、区切って送るだけでも文字起こしできる形式なら分ける
  if (!decoded) {
    if (isMp3(file)) return splitByBytes(file, MAX_PART_BYTES);
    throw new Error("音声を読み込めませんでした。25MB以下のファイルに分けてお試しください。");
  }

  const samples = decoded.getChannelData(0);
  const sampleRate = decoded.sampleRate || TARGET_SAMPLE_RATE;
  const partSamples = Math.floor(MAX_PART_BYTES / 2 / sampleRate) * sampleRate;
  const parts = [];

  for (let start = 0; start < samples.length; start += partSamples) {
    const chunk = samples.subarray(start, Math.min(start + partSamples, samples.length));
    parts.push(new File([encodeWav(chunk, sampleRate)], `lecture-part-${parts.length + 1}.wav`, { type: "audio/wav" }));
  }

  return parts;
}