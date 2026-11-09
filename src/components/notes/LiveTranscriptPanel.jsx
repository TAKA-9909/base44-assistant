import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function LiveTranscriptPanel({ text, processing }) {
  const boxRef = useRef(null);

  // 文字が増えるたびに一番下まで送る
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [text]);

  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card p-4 text-left">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>文字起こし（30秒ごとに追加）</span>
        {processing && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
      <div
        ref={boxRef}
        className="max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-7"
      >
        {text ||
          (processing
            ? "最初の区間を文字起こししています…"
            : "話し始めると、ここに文字起こしが表示されます。")}
      </div>
    </div>
  );
}