import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, RotateCcw } from "lucide-react";
import { formatClock, formatDuration } from "@/lib/lectureUtils";

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

export default function AudioCapture({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      // 長い講義でも送信が途切れないよう、音声だけを小さく録音する
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000
      });
      chunksRef.current = [];
      elapsedRef.current = 0;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        onChange({
          blob,
          url: URL.createObjectURL(blob),
          source: "recording",
          duration: elapsedRef.current
        });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
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
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    // 文字起こしできる音声は 25MB までなので、それを超えるファイルは先に知らせる
    if (file.size > 25 * 1024 * 1024) {
      setError("ファイルが大きすぎます（25MBまで）。講義を分けて読み込んでください。");
      return;
    }
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
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {value.source === "recording" ? "録り直す" : "選び直す"}
          </Button>
        </div>
        <audio controls src={value.url} className="w-full" />
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
              講義中にスマホやパソコンのマイクで録音します
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