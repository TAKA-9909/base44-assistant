import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    key_points: { type: 'array', items: { type: 'string' } },
    outline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          points: { type: 'array', items: { type: 'string' } }
        },
        required: ['heading', 'points']
      }
    },
    terms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          meaning: { type: 'string' }
        },
        required: ['term', 'meaning']
      }
    }
  },
  required: ['summary', 'key_points', 'outline', 'terms']
};

const SUPPORTED_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

// 録音ファイルが .weba など未対応の拡張子で保存されている場合は、.webm として保存し直す
async function normalizeAudioUrl(base44, audioUrl) {
  const extension = (audioUrl.split('?')[0].split('.').pop() || '').toLowerCase();
  if (SUPPORTED_FORMATS.includes(extension)) return audioUrl;

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) return audioUrl;
    const blob = await response.blob();
    const file = new File([blob], 'lecture.webm', { type: 'video/webm' });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
    return uploaded?.file_url || audioUrl;
  } catch {
    return audioUrl;
  }
}

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const PART_BYTES = 18 * 1024 * 1024;
const SPLITTABLE_FORMATS = ['wav', 'mp3', 'mpeg'];

const extensionOf = (url) => (url.split('?')[0].split('.').pop() || '').toLowerCase();

// WAV はヘッダーを付け直して PCM を区切る
function splitWav(bytes) {
  const header = bytes.subarray(0, 44);
  const pcm = bytes.subarray(44);
  const step = PART_BYTES - 44;
  const parts = [];

  for (let offset = 0; offset < pcm.length; offset += step) {
    const chunk = pcm.subarray(offset, Math.min(offset + step, pcm.length));
    const part = new Uint8Array(44 + chunk.length);
    part.set(header, 0);
    const view = new DataView(part.buffer);
    view.setUint32(4, 36 + chunk.length, true);
    view.setUint32(40, chunk.length, true);
    part.set(chunk, 44);
    parts.push(part);
  }

  return parts;
}

// MP3 はフレームの切れ目まで進めてから区切る
function splitMp3(bytes) {
  const parts = [];
  let start = 0;

  while (start < bytes.length) {
    let end = Math.min(start + PART_BYTES, bytes.length);
    if (end < bytes.length) {
      while (end < bytes.length - 1 && !(bytes[end] === 0xff && (bytes[end + 1] & 0xe0) === 0xe0)) end += 1;
    }
    parts.push(bytes.subarray(start, end));
    start = end;
  }

  return parts;
}

async function transcribeUrl(base44, audioUrl) {
  const raw = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
  return typeof raw === 'string' ? raw.trim() : '';
}

// 25MB を超える音声は、文字起こしできる大きさに区切ってから送る
async function transcribe(base44, audioUrl) {
  const normalized = await normalizeAudioUrl(base44, audioUrl);
  const extension = extensionOf(normalized);

  let size = 0;
  try {
    const head = await fetch(normalized, { method: 'HEAD' });
    size = Number(head.headers.get('content-length') || 0);
  } catch {
    size = 0;
  }

  if (!size || size <= MAX_AUDIO_BYTES || !SPLITTABLE_FORMATS.includes(extension)) {
    return transcribeUrl(base44, normalized);
  }

  const bytes = new Uint8Array(await (await fetch(normalized)).arrayBuffer());
  const chunks = extension === 'wav' ? splitWav(bytes) : splitMp3(bytes);
  const texts = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const file = new File([chunks[index]], `lecture-part-${index + 1}.${extension}`, {
      type: extension === 'wav' ? 'audio/wav' : 'audio/mpeg'
    });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
    if (!uploaded?.file_url) continue;
    texts.push(await transcribeUrl(base44, uploaded.file_url));
  }

  return texts.filter(Boolean).join('\n');
}

// 文字起こしからノート（要約・重要ポイント・アウトライン・用語）を作る
async function buildNote(base44, { transcript, course, title }) {
  const prompt = [
    'あなたは大学生の講義ノートを整える優秀なアシスタントです。',
    '以下は大学の講義を録音して文字起こししたテキストです。',
    course ? `科目名: ${course}` : '',
    title ? `講義タイトル: ${title}` : '',
    '',
    'この文字起こしを読み、日本語で復習しやすい講義ノートを作成してください。',
    '- summary: 講義全体の要約（3〜5文、です・ます調）',
    '- key_points: 覚えるべき重要ポイント（5〜8個、それぞれ1文）',
    '- outline: 講義の流れを3〜6個のセクションに分け、各セクションに見出しと箇条書きの内容を入れる',
    '- terms: 講義に出てきた専門用語とその簡潔な説明（最大8個）',
    '文字起こしの誤変換は文脈から自然に補正し、話し言葉は読みやすい書き言葉に整えてください。',
    '必ず文字起こしに書かれている内容だけを使い、講義で触れられていない一般知識・背景説明・推測を補ってはいけません。',
    '文字起こしが短い場合は、ノートもその分量に見合う簡潔な内容にしてください。',
    '',
    '--- 文字起こし ---',
    transcript
  ]
    .filter(Boolean)
    .join('\n');

  const note = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: NOTE_SCHEMA
  });

  const structured = typeof note === 'string' ? JSON.parse(note) : note || {};

  return {
    summary: typeof structured.summary === 'string' ? structured.summary : '',
    key_points: Array.isArray(structured.key_points) ? structured.key_points : [],
    outline: Array.isArray(structured.outline) ? structured.outline : [],
    terms: Array.isArray(structured.terms) ? structured.terms : []
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = typeof body?.mode === 'string' ? body.mode : '';
    const course = typeof body?.course === 'string' ? body.course.slice(0, 120) : '';
    const title = typeof body?.title === 'string' ? body.title.slice(0, 200) : '';

    // 分割された音声を1つずつ文字起こしする
    if (mode === 'transcribe') {
      const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url.trim() : '';
      if (!audioUrl) {
        return Response.json({ error: 'audio_url is required' }, { status: 400 });
      }
      const transcript = await transcribe(base44, audioUrl);
      if (!transcript) {
        return Response.json({ error: '音声を文字起こしできませんでした。' }, { status: 422 });
      }
      return Response.json({ transcript });
    }

    // まとめた文字起こしからノートを作る
    if (mode === 'note') {
      const transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : '';
      if (!transcript) {
        return Response.json({ error: '文字起こしが空でした。' }, { status: 400 });
      }
      const note = await buildNote(base44, { transcript, course, title });
      return Response.json({ transcript, ...note });
    }

    const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url.trim() : '';
    if (!audioUrl) {
      return Response.json({ error: 'audio_url is required' }, { status: 400 });
    }

    const transcript = await transcribe(base44, audioUrl);
    if (!transcript) {
      return Response.json({ error: '音声を文字起こしできませんでした。' }, { status: 422 });
    }

    const note = await buildNote(base44, { transcript, course, title });
    return Response.json({ transcript, ...note });
  } catch (error) {
    const message = /too large|25\s*MB/i.test(error?.message || '')
      ? '音声が大きすぎて文字起こしできませんでした。25MB以下の音声に分けてお試しください。'
      : error.message;
    return Response.json({ error: message }, { status: 500 });
  }
}