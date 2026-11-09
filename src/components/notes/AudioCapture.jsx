import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, RotateCcw, Loader2 } from "lucide-react";
import {
  formatClock,
  formatDuration,
  transcribeAudioUrl,
  uploadAudioFiles
} from "@/lib/lectureUtils";
import { needsSplit, splitAudioFile } from "@/lib/audioSplit";
import AudioPlayer from "./AudioPlayer";
import LiveTranscriptPanel from "./LiveTranscriptPanel";

// 30秒ごとに区切って、録音しながら文字起こししていく
const SEGMENT_SECONDS = 30;

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
};

const readDuration = (url) =>
  new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () =>
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
    audio.onerror = () => resolve(0);
    audio.src = url;
  });

const segmentExtension = (mimeType) => ((mimeType || "").includes("mp4") ? "m4a" : "webm");

export default function AudioCapture({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [liveText, setLiveText] = useState("");
  const [processing, setProcessing] = useState(false);

  const recorderRef = useRef(null);
  const segmentTimerRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const recordingRef = useRef(false);
  const slotsRef = useRef([]);
  const pendingRef = useRef(0);
  const queueRef = useRef(Promise.resolve());
  const stopRequestedRef = useRef(false);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      clearTimeout(segmentTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  // 区切った音声を1つずつ保存して文字起こしする
  const processSlot = async (slot) => {
    try {
      const extension = segmentExtension(slot.blob.type);
      const file = new File([slot.blob], `lecture-part-${slot.index}.${extension}`, {
        type: slot.blob.type || "audio/webm"
      });
      // 画面を閉じていた等で区間が長くなったときも、送る前に分ける
      const parts = await splitAudioFile(file);
      slot.urls = await uploadAudioFiles(parts);
      const texts = [];
      for (const url of slot.urls) texts.push(await transcribeAudioUrl(url));
      slot.transcript = texts.filter(Boolean).join("\n");
      setLiveText((prev) => (prev ? `${prev}\n${slot.transcript}` : slot.transcript));
    } catch {
      // 失敗した区間は文字起こしなしで残し、ノート作成のときにやり直す
    }
  };

  // すべての区間の処理が終わったら、停止済みの録音を親に渡す
  const finishIfReady = () => {
    if (!stopRequestedRef.current || pendingRef.current > 0 || recordingRef.current) return;
    stopRequestedRef.current = false;
    const slots = slotsRef.current;
    if (slots.length === 0) {
      setFinishing(false);
      return;
    }
    const recorded = slots.filter((slot) => slot.urls.length > 0);
    const wholeBlob =
      recorded.length === 0
        ? new Blob(slots.map((slot) => slot.blob), { type: slots[0].blob.type || "audio/webm" })
        : slots[0].blob;
    const url = recorded.length > 0 ? recorded[0].urls[0] : URL.createObjectURL(wholeBlob);

    setFinishing(false);
    onChange({
      blob: wholeBlob,
      url,
      source: "recording",
      duration: elapsedRef.current,
      parts: recorded.map((slot) => ({ urls: slot.urls, transcript: slot.transcript }))
    });
  };

  const handleSegment = (blob) => {
    const slot = { blob, urls: [], transcript: "", index: slotsRef.current.length + 1 };
    slotsRef.current.push(slot);
    pendingRef.current += 1;
    setProcessing(true);
    // 順番どおりに1つずつ処理する
    queueRef.current = queueRef.current.then(() => processSlot(slot)).then(() => {
      pendingRef.current -= 1;
      if (pendingRef.current === 0) setProcessing(false);
      finishIfReady();
    });
  };

  const startSegment = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickMimeType();
    // 長い講義でも送信が途切れないよう、音声だけを小さく録音する
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 32000
    });
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (blob.size > 0) handleSegment(blob);
      if (recordingRef.current) {
        startSegment();
      } else {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size === 0) finishIfReady();
      }
    };
    recorder.start();
    recorderRef.current = recorder;
    clearTimeout(segmentTimerRef.current);
    segmentTimerRef.current = setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, SEGMENT_SECONDS * 1000);
  };

  const startRecording = async () => {
    setError("");
    setLiveText("");
    setProcessing(false);
    slotsRef.current = [];
    pendingRef.current = 0;
    stopRequestedRef.current = false;
    elapsedRef.current = 0;
    setSeconds(0);
    setFinishing(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      recordingRef.current = true;
      setRecording(true);
      startSegment();
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setSeconds(elapsedRef.current);
      }, 1000);
    } catch {
      setError("マイクを使えませんでした。ブラウザの許可設定を確認してください。");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    clearTimeout(segmentTimerRef.current);
    recordingRef.current = false;
    stopRequestedRef.current = true;
    setRecording(false);
    setFinishing(true);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      finishIfReady();
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    const duration = await readDuration(url);
    onChange({ blob: file, url, source: "upload", duration });
  };

  if (value) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {value.source === "recording" ? "録音した音声" : "読み込んだ音声"}
            </p>
            {value.duration > 0 && (
              <p className="text-xs text-muted-foreground">{formatDuration(value.duration)}</p>
            )}
            {value.parts?.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {value.parts.length}分割で保存しました（続けて再生できます）
              </p>
            )}
            {needsSplit(value.blob) && (
              <p className="text-xs text-muted-foreground">
                大きな音声なので、文字起こしのときに自動で分割します
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {value.source === "recording" ? "録り直す" : "選び直す"}
          </Button>
        </div>
        <AudioPlayer
          src={value.url}
          urls={value.parts?.flatMap((part) => part.urls || [])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recording ? (
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-accent/40 bg-accent/5 p-8">
          <span className="flex items-center gap-2 text-sm font-medium text-accent">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            録音中
          </span>
          <p className="font-display text-4xl tabular-nums tracking-wider">
            {formatClock(seconds)}
          </p>
          <Button onClick={stopRecording} className="h-11 rounded-full px-7">
            <Square className="mr-2 h-3.5 w-3.5" />
            停止して保存
          </Button>
          <LiveTranscriptPanel text={liveText} processing={processing} />
        </div>
      ) : finishing ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-border/70 bg-card p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">録音を保存しています…</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={startRecording}
            className="flex flex-col items-start gap-2 rounded-3xl border border-border/70 bg-card p-6 text-left transition hover:border-primary/30 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Mic className="h-4 w-4" />
            </span>
            <span className="font-medium">その場で録音する</span>
            <span className="text-xs text-muted-foreground">
              録音しながら文字起こしが伸びていきます
            </span>
          </button>

          <label className="flex cursor-pointer flex-col items-start gap-2 rounded-3xl border border-border/70 bg-card p-6 text-left transition hover:border-primary/30 hover:shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Upload className="h-4 w-4" />
            </span>
            <span className="font-medium">録音済みのファイルを読み込む</span>
            <span className="text-xs text-muted-foreground">
              ボイスメモなどで録音した音声ファイルを選びます
            </span>
            <input type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}