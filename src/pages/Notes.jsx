import React from "react";
import NoteList from "@/components/notes/NoteList";

const MANUAL_QUERY = { source: "manual" };

export default function Notes() {
  return (
    <NoteList
      title="ノート一覧"
      baseQuery={MANUAL_QUERY}
      emptyTitle="まだノートがありません"
      emptyDescription="「ノートを書く」から、自分の言葉でノートを書けます。"
      actionLabel="ノートを書く"
      actionTo="/write"
    />
  );
}