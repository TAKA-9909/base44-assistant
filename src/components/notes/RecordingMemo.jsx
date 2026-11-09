import React from "react";
import { PenLine } from "lucide-react";

// 録音しながら書き留めるためのメモ欄（付箋のような黄色い紙）
export default function RecordingMemo({ value, onChange }) {
  return (
    <div className="w-full rounded-md bg-memo p-4 text-left shadow-md shadow-black/15">
      <div className="mb-2 flex items-center gap-2 text-xs text-foreground/60">
        <PenLine className="h-3.5 w-3.5" />
        <span>自分のメモ（録音を止めても残ります）</span>
      </div>
      <div className="rounded-sm px-3 py-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="気づいたこと、先生が強調した言葉、あとで調べたいことを書いておけます。"
          rows={5}
          className="w-full resize-y bg-transparent text-sm leading-8 text-foreground outline-none placeholder:text-foreground/40"
        />
      </div>
    </div>
  );
}