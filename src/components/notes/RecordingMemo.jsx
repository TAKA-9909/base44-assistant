import React from "react";
import { PenLine } from "lucide-react";

// 録音しながら書き留めるためのメモ欄
export default function RecordingMemo({ value, onChange }) {
  return (
    <div className="w-full rounded-2xl border border-border/70 bg-notebook-label/60 p-4 text-left">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <PenLine className="h-3.5 w-3.5" />
        <span>自分のメモ（録音を止めても残ります）</span>
      </div>
      <div className="notebook-ruled-soft rounded-xl bg-card px-3 py-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="気づいたこと、先生が強調した言葉、あとで調べたいことを書いておけます。"
          rows={5}
          className="w-full resize-y bg-transparent text-sm leading-8 outline-none placeholder:text-muted-foreground/70"
        />
      </div>
    </div>
  );
}