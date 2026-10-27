import React from "react";
import { cn } from "@/lib/utils";
import { isMarked, splitSentences } from "@/lib/sentenceMarks";

// 文を押すとマーカーが引かれる読み物テキスト。prefix ごとにマーカーを分けて保存する
export default function SentenceText({ text, prefix = "", marks, onToggle, className }) {
  return (
    <span className={className}>
      {splitSentences(text).map((sentence, index) => {
        if (sentence === "\n") return <br key={`br-${index}`} />;
        const key = `${prefix}${sentence}`;
        const marked = isMarked(marks, key);
        return (
          <span
            key={`${index}-${sentence}`}
            onClick={() => onToggle(key)}
            className={cn("cursor-pointer", marked ? "marker-ink" : "marker-target")}
          >
            {sentence}
          </span>
        );
      })}
    </span>
  );
}