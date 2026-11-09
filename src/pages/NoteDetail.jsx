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
import { Check, FileAudio, List, Loader2, RefreshCw } from "lucide-react";
import NoteSummaryPanel from "@/components/notes/NoteSummaryPanel";
import CanvasNotePanel from "@/components/notes/CanvasNotePanel";
import AudioPlayer from "@/components/notes/AudioPlayer";
import NoteMenuButton from "@/components/notes/NoteMenuButton";
import NotePaper from "@/components/notes/NotePaper";
import { createTextBlock, DEFAULT_STYLE, parseCanvas } from "@/lib/notebookCanvas";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDuration,
  generateNote,
  loadTranscript,
  noteErrorMessage
} from "@/lib/lectureUtils";

// 3つのタブは同じ背景のまま、選択中のラベルにだけマーカーを引く
const TAB_TRIGGER =
  "tab-trigger rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.LectureNote.get(id);
      setNote(data);
      setTranscript(await loadTranscript(data));
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
        audioUrls: note.audio_urls?.length ? note.audio_urls : [note.audio_url],
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
    await navigator.clipboard.writeText(transcript || "");
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

  // 戻るタグは他のページの付箋タブと同じ色とアイコンに揃える
  const backItem = isManual
    ? { to: "/notes", label: "ノート一覧", icon: List, tone: "bg-sticky-4" }
    : { to: "/recordings", label: "録音一覧", icon: FileAudio, tone: "bg-sticky-1" };
  const BackIcon = backItem.icon;

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="flex h-28 items-end pl-3" aria-label="戻る">
        <Link
          to={backItem.to}
          className={cn(
            "group flex h-10 w-12 shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-t-lg text-xs text-sticky-foreground shadow-lg ring-1 ring-sticky-foreground/25 transition-all duration-300 ease-out hover:h-28",
            backItem.tone
          )}
        >
          <BackIcon className="h-4 w-4 shrink-0" />
          <span
            className="max-h-0 overflow-hidden tracking-widest opacity-0 transition-all duration-300 ease-out group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:max-h-24 group-focus-visible:opacity-100"
            style={{ writingMode: "vertical-rl" }}
          >
            {backItem.label}
          </span>
        </Link>
      </nav>

      <Tabs defaultValue={isManual ? "memo" : "summary"} className="mt-0">
        <NotePaper className="overflow-hidden p-0 sm:p-0">
          <header className="px-6 pb-6 pt-7 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
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
                  <AudioPlayer src={note.audio_url} urls={note.audio_urls}>
                    <NoteMenuButton onDelete={() => setConfirmOpen(true)} />
                  </AudioPlayer>
                ) : (
                  <NoteMenuButton onDelete={() => setConfirmOpen(true)} />
                )}
              </div>
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
            <div className="mx-6 mb-5 flex items-center gap-3 rounded-2xl bg-secondary px-5 py-4 text-sm sm:mx-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              文字起こしとノートを作成しています。少しお待ちください。
            </div>
          )}

          {note.status === "failed" && (
            <div className="mx-6 mb-5 rounded-2xl bg-destructive/10 px-5 py-4 sm:mx-8">
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

          <div className="border-t border-border/70 px-6 py-3.5 sm:px-8">
            <TabsList className="h-auto flex-wrap gap-1 rounded-2xl bg-secondary/70 p-1.5">
              {!isManual && (
                <TabsTrigger value="summary" className={TAB_TRIGGER}>
                  <span className="tab-label">
                    <span className="tab-label-text">まとめ</span>
                  </span>
                </TabsTrigger>
              )}
              {!isManual && (
                <TabsTrigger value="transcript" className={TAB_TRIGGER}>
                  <span className="tab-label">
                    <span className="tab-label-text">文字起こし</span>
                  </span>
                </TabsTrigger>
              )}
              <TabsTrigger value="memo" className={TAB_TRIGGER}>
                <span className="tab-label">
                  <span className="tab-label-text">{isManual ? "ノート本文" : "自分のメモ"}</span>
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="px-6 py-7 sm:px-8">
            <NoteSummaryPanel note={note} />
          </TabsContent>

          <TabsContent value="transcript" className="px-6 py-7 sm:px-8">
            {transcript ? (
              <div className="space-y-4">
                <p className="max-h-[560px] overflow-y-auto whitespace-pre-wrap text-[15px] leading-8">
                  {transcript}
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

          <TabsContent value="memo" className="px-6 py-7 sm:px-8">
            <CanvasNotePanel key={note.id} noteId={note.id} initialBlocks={memoBlocks} />
          </TabsContent>
        </NotePaper>
      </Tabs>
    </div>
  );
}