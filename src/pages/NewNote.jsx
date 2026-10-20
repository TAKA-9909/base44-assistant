import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, PenLine } from "lucide-react";

export default function NewNote() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        content
      });
      navigate(`/notes/${created.id}`);
    } catch {
      setSaving(false);
      setError("保存できませんでした。時間をおいてもう一度お試しください。");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        ノート一覧に戻る
      </Link>

      <h1 className="mt-6 font-display text-3xl leading-tight">ノートを書く</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        録音を使わず、自分の言葉でノートを書けます。あとから自由に書き足せます。
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div className="space-y-5 rounded-3xl border border-border/70 bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例: 経済学入門の要点メモ"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course">科目名</Label>
              <Input
                id="course"
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                placeholder="例: 経済学入門"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={noteDate}
                onChange={(event) => setNoteDate(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">本文</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="授業の内容、気づいたこと、覚えておきたいことを自由に書けます。"
            className="min-h-[320px] resize-y rounded-2xl p-5 text-[15px] leading-8"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={saving} className="h-12 rounded-full px-7">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PenLine className="mr-2 h-4 w-4" />
          )}
          ノートを保存する
        </Button>
      </form>
    </div>
  );
}