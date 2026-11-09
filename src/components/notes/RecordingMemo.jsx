import React from "react";
import { PenLine } from "lucide-react";
import MemoCanvas from "./MemoCanvas";

// 録音しながら書き留めるためのメモ欄（付箋のような黄色い紙）
export default function RecordingMemo({ value, onChange }) {
  return (
    <div className="flex w-full flex-col rounded-md bg-memo p-4 text-left shadow-md shadow-black/15">
      <div className="mb-2 flex items-center gap-2 text-xs text-foreground/60">
        <PenLine className="h-3.5 w-3.5" />
        <span>自分のメモ（録音を止めても残ります）</span>
      </div>
      <MemoCanvas value={value} onChange={onChange} />
      <p className="mt-2 text-[11px] leading-5 text-foreground/50">
        空行を一行入れると、そこから先は別の付箋に分かれます。
      </p>
    </div>
  );
}