import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import AudioCapture from "@/components/notes/AudioCapture";
import NotePaper from "@/components/notes/NotePaper";
import PageNav from "@/components/nav/PageNav";
import { formatDate, generateNote, noteErrorMessage } from "@/lib/lectureUtils";

export default function NewLecture() {
  const navigate = useNavigate();
  const [capture, setCapture] = useState(null);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [lectureDate, setLectureDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [step, setStep] = useState("");

  const busy = step !== "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!capture) {
      setError("先に音声を録音するか、ファイルを読み込んでください。");
      return;
    }
    setError("");
    setStep("uploading");
    let created = null;

    try {
      const extension = capture.source === "recording" ? "webm" : capture.blob.name?.split(".").pop() || "mp3";
      const file = new File([capture.blob], `lecture-${Date.now()}.${extension}`, {
        type: capture.blob.type || "audio/mpeg"
      });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });

      created = await base44.entities.LectureNote.create({
        title: title.trim() || `${formatDate(lectureDate)}の講義`,
        course: course.trim(),
        lecture_date: lectureDate,
        source: capture.source,
        audio_url: file_url,
        duration_seconds: capture.duration || 0,
        status: "processing"
      });

      setStep("processing");
      await generateNote({
        noteId: created.id,
        audioUrl: file_url,
        title: title.trim(),
        course: course.trim()
      });

      navigate(`/notes/${created.id}`);
    } catch (err) {
      const message = noteErrorMessage(err);
      if (created) {
        await base44.entities.LectureNote
          .update(created.id, { status: "failed", error_message: message })
          .catch(() => {});
        navigate(`/notes/${created.id}`);
      } else {
        setStep("");
        setError(message);
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="-mb-px">
        <PageNav />
      </div>

      <NotePaper className="overflow-hidden p-0 sm:p-0">
        <header className="px-6 pb-6 pt-7 sm:px-8">
          <h1 className="font-display text-3xl leading-tight">講義を録音する</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            録音した音声から文字起こしと要約を作り、復習できるノートにまとめます。
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 border-t border-border/70 px-6 py-7 sm:px-8"
        >
          <AudioCapture value={capture} onChange={setCapture} />

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">講義タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例: 経済学入門 第4回 需要と供給"
                className="h-11 rounded-xl bg-card"
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
                  className="h-11 rounded-xl bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">講義の日付</Label>
                <Input
                  id="date"
                  type="date"
                  value={lectureDate}
                  onChange={(event) => setLectureDate(event.target.value)}
                  className="h-11 rounded-xl bg-card"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          {busy ? (
            <div className="flex items-center gap-3 rounded-2xl bg-secondary px-6 py-5">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {step === "uploading" ? "音声をアップロードしています" : "文字起こしとノート作成中です"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  講義の長さによって数分かかることがあります。この画面を開いたままお待ちください。
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={!capture} className="h-12 rounded-full px-7">
                <Sparkles className="mr-2 h-4 w-4" />
                ノートを作成する
              </Button>
              <p className="text-xs text-muted-foreground">
                音声は文字起こしのために公開URLで保存されます。
              </p>
            </div>
          )}
        </form>
      </NotePaper>
    </div>
  );
}