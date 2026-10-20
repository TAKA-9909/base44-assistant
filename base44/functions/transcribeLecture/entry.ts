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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url.trim() : '';
    if (!audioUrl) {
      return Response.json({ error: 'audio_url is required' }, { status: 400 });
    }
    const course = typeof body?.course === 'string' ? body.course.slice(0, 120) : '';
    const title = typeof body?.title === 'string' ? body.title.slice(0, 200) : '';

    const transcriptRaw = await base44.asServiceRole.integrations.Core.TranscribeAudio({
      audio_url: audioUrl
    });
    const transcript = typeof transcriptRaw === 'string' ? transcriptRaw.trim() : '';
    if (!transcript) {
      return Response.json({ error: '音声を文字起こしできませんでした。' }, { status: 422 });
    }

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

    return Response.json({
      transcript,
      summary: typeof structured.summary === 'string' ? structured.summary : '',
      key_points: Array.isArray(structured.key_points) ? structured.key_points : [],
      outline: Array.isArray(structured.outline) ? structured.outline : [],
      terms: Array.isArray(structured.terms) ? structured.terms : []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}