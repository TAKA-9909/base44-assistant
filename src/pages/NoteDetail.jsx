import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, RefreshCw, Trash2, Check } from "lucide-react";
import NoteSummaryPanel from "@/components/notes/NoteSummaryPanel";
import NoteMemoEditor from "@/components/notes/NoteMemoEditor";
import { formatDate, formatDuration, generateNote, noteErrorMessage } from "@/lib/lectureUtils";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.LectureNote.get(id);
      setNote(data);
    } catch {
      setMissing(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await base44.entities.LectureNote.update(id, { status: "processing", error_message: "" });
      setNote((current) => ({ ...current, status: "processing", error_message: "" }));
      await generateNote({
        noteId: id,
        audioUrl: note.audio_url,
        title: note.title,
        course: note.course
      });
    } catch (err) {
      await base44.entities.LectureNote
        .update(id, { status: "failed", error_message: noteErrorMessage(err) })
        .catch(() => {});
    } finally {
      await load();
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    await base44.entities.LectureNote.delete(id);
    navigate("/");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(note.transcript || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (missing || !note) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">ノートが見つかりませんでした</p>
        <Button asChild variant="outline" className="mt-6 rounded-full px-6">
          <Link to="/">ノート一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  const isManual = note.source === "manual";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        ノート一覧に戻る
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          {note.course && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {note.course}
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl leading-tight">{note.title}</h1>
          <p className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {note.lecture_date && <span>{formatDate(note.lecture_date)}</span>}
            {note.duration_seconds > 0 && <span>{formatDuration(note.duration_seconds)}</span>}
            <span>
              {note.source === "upload"
                ? "ファイル読み込み"
                : note.source === "manual"
                  ? "自分で書いたノート"
                  : "その場で録音"}
            </span>
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              削除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>このノートを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                文字起こしとメモを含め、すべて削除されます。元に戻せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>削除する</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {note.audio_url && (
        <div className="mt-8 rounded-3xl border border-border/70 bg-card p-4">
          <audio controls src={note.audio_url} className="w-full" />
        </div>
      )}

      {note.status === "processing" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-secondary px-5 py-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          文字起こしとノートを作成しています。少しお待ちください。
        </div>
      )}

      {note.status === "failed" && (
        <div className="mt-6 rounded-2xl bg-destructive/10 px-5 py-4">
          <p className="text-sm text-destructive">
            {note.error_message || "ノートを作成できませんでした。"}
          </p>
          <Button
            onClick={handleRetry}
            disabled={retrying}
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
          >
            {retrying ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            もう一度ノート化する
          </Button>
        </div>
      )}

      <Tabs defaultValue={isManual ? "memo" : "summary"} className="mt-10">
        <TabsList className="rounded-full">
          {!isManual && (
            <TabsTrigger value="summary" className="rounded-full px-5">
              まとめ
            </TabsTrigger>
          )}
          {!isManual && (
            <TabsTrigger value="transcript" className="rounded-full px-5">
              文字起こし
            </TabsTrigger>
          )}
          <TabsTrigger value="memo" className="rounded-full px-5">
            {isManual ? "ノート本文" : "自分のメモ"}
          </TabsTrigger>
        </TabsList>

        {!isManual && (
          <TabsContent value="summary" className="mt-8">
            <NoteSummaryPanel note={note} />
          </TabsContent>
        )}

        {!isManual && (
        <TabsContent value="transcript" className="mt-8">
          {note.transcript ? (
            <div className="space-y-4">
              <p className="max-h-[560px] overflow-y-auto whitespace-pre-wrap rounded-3xl border border-border/70 bg-card p-6 text-[15px] leading-8">
                {note.transcript}
              </p>
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-full">
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : null}
                {copied ? "コピーしました" : "文字起こしをコピー"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">まだ文字起こしがありません。</p>
          )}
        </TabsContent>
        )}

        <TabsContent value="memo" className="mt-8">
          <NoteMemoEditor
            key={note.id}
            noteId={note.id}
            initialContent={note.content}
            placeholder={
              isManual
                ? "ノートの本文です。箇条書きでも文章でも、自由に書き足せます。"
                : "講義を聞いて気づいたこと、先生が強調していた点、次回までの課題などを自由に書けます。"
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}