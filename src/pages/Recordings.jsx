import React from "react";
import NoteList from "@/components/notes/NoteList";

const AUDIO_QUERY = { source: { $in: ["recording", "upload"] } };

export default function Recordings() {
  return (
    <NoteList
      title="録音一覧"
      baseQuery={AUDIO_QUERY}
      emptyTitle="まだ録音がありません"
      emptyDescription="「録音する」で講義を録音すると、文字起こしと要約からノートを自動作成します。"
      actionLabel="講義を録音する"
      actionTo="/new"
    />
  );
}