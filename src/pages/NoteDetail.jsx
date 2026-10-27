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
import { ArrowLeft, Loader2, RefreshCw, Check } from "lucide-react";
import NoteSummaryPanel from "@/components/notes/NoteSummaryPanel";
import CanvasNotePanel from "@/components/notes/CanvasNotePanel";
import AudioPlayer from "@/components/notes/AudioPlayer";
import NoteMenuButton from "@/components/notes/NoteMenuButton";
import NotePaper from "@/components/notes/NotePaper";
import { createTextBlock, DEFAULT_STYLE, parseCanvas } from "@/lib/notebookCanvas";
import { formatDate, formatDuration, generateNote, noteErrorMessage } from "@/lib/lectureUtils";

// 選択中のタブだけ白いピルにする
const TAB_TRIGGER =
  "rounded-xl px-5 py-2 text-sm data-[state=active]:border data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
          <Link to="/notes">ノート一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  const isManual = note.source === "manual";
  const canvasLayout = parseCanvas(note.content);
  // 以前に文章で書いたメモは、キャンバス上のテキストとして引き継ぐ
  const memoBlocks = canvasLayout
    ? canvasLayout.blocks
    : note.content?.trim()
      ? [{ ...createTextBlock(48, 48, DEFAULT_STYLE, 420), text: note.content }]
      : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={isManual ? "/notes" : "/recordings"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isManual ? "ノート一覧に戻る" : "録音一覧に戻る"}
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-[220px] flex-1">
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

        <div className="flex items-center gap-2">
          {note.audio_url ? (
            <AudioPlayer src={note.audio_url}>
              <NoteMenuButton onDelete={() => setConfirmOpen(true)} />
            </AudioPlayer>
          ) : (
            <NoteMenuButton onDelete={() => setConfirmOpen(true)} />
          )}
        </div>
      </header>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
        <TabsList className="h-auto flex-wrap gap-1 rounded-2xl bg-secondary/70 p-1.5">
          {!isManual && (
            <TabsTrigger value="summary" className={TAB_TRIGGER}>
              まとめ
            </TabsTrigger>
          )}
          {!isManual && (
            <TabsTrigger value="transcript" className={TAB_TRIGGER}>
              文字起こし
            </TabsTrigger>
          )}
          <TabsTrigger value="memo" className={TAB_TRIGGER}>
            {isManual ? "ノート本文" : "自分のメモ"}
          </TabsTrigger>
        </TabsList>

        {!isManual && (
          <TabsContent value="summary" className="mt-5">
            <NotePaper>
              <NoteSummaryPanel note={note} />
            </NotePaper>
          </TabsContent>
        )}

        {!isManual && (
        <TabsContent value="transcript" className="mt-5">
          {note.transcript ? (
            <NotePaper className="space-y-4">
              <p className="max-h-[560px] overflow-y-auto whitespace-pre-wrap text-[15px] leading-8">
                {note.transcript}
              </p>
              <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-full">
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : null}
                {copied ? "コピーしました" : "文字起こしをコピー"}
              </Button>
            </NotePaper>
          ) : (
            <NotePaper>
              <p className="text-sm text-muted-foreground">まだ文字起こしがありません。</p>
            </NotePaper>
          )}
        </TabsContent>
        )}

        <TabsContent value="memo" className="mt-5">
          <CanvasNotePanel key={note.id} noteId={note.id} initialBlocks={memoBlocks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}