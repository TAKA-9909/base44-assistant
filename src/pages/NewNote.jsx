import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, PenLine } from "lucide-react";
import CanvasEditor from "@/components/notes/canvas/CanvasEditor";
import PageNav from "@/components/nav/PageNav";
import { serializeCanvas } from "@/lib/notebookCanvas";

export default function NewNote() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("タイトルを入力してください。");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const created = await base44.entities.LectureNote.create({
        title: title.trim(),
        course: course.trim(),
        lecture_date: noteDate,
        source: "manual",
        status: "ready",
        content: serializeCanvas(blocks)
      });
      navigate(`/notes/${created.id}`);
    } catch {
      setSaving(false);
      setError("保存できませんでした。時間をおいてもう一度お試しください。");
    }
  };

  return (
    <div className="-mx-5 -mb-10 -mt-10 min-h-[calc(100vh-4rem)] bg-background sm:-mb-14 sm:-mt-14">
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-8">
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Button onClick={handleSave} disabled={saving} className="h-11 rounded-full px-6">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
            保存する
          </Button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <div className="-mb-px mt-8">
          <PageNav />
        </div>

        <section className="rounded-[22px] border border-border/70 bg-card shadow-sm">
          <header className="px-6 pb-5 pt-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-[220px] flex-1">
                <label htmlFor="note-title" className="text-[11px] tracking-[0.2em] text-muted-foreground">
                  タイトル
                </label>
                <input
                  id="note-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例: 経済学入門の要点メモ"
                  className="mt-1 w-full border-0 bg-transparent p-0 font-display text-2xl outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="flex flex-wrap items-start gap-5">
                <div>
                  <label htmlFor="note-date" className="text-[11px] tracking-[0.2em] text-muted-foreground">
                    日付
                  </label>
                  <input
                    id="note-date"
                    type="date"
                    value={noteDate}
                    onChange={(event) => setNoteDate(event.target.value)}
                    className="mt-1 block border-0 bg-transparent p-0 text-sm outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="note-course" className="text-[11px] tracking-[0.2em] text-muted-foreground">
                    科目
                  </label>
                  <input
                    id="note-course"
                    value={course}
                    onChange={(event) => setCourse(event.target.value)}
                    placeholder="例: 経済学入門"
                    className="mt-1 block w-40 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 h-px w-full bg-border" aria-hidden="true" />
          </header>

          <CanvasEditor blocks={blocks} onChange={setBlocks} />
        </section>

        <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
          罫線の上をタップすると書き込めます。下のバーでフォント・カラー・サイズを変えられます。
        </p>
      </div>
    </div>
  );
}