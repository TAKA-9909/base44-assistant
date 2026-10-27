import React from "react";
import { cn } from "@/lib/utils";

// 罫線の入った白い紙。タブの中身を載せる
export default function NotePaper({ children, className }) {
  return (
    <div
      className={cn(
        "notebook-ruled-soft rounded-[22px] border border-border/70 bg-card p-6 shadow-xl sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}