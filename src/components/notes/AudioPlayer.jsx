import React, { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// 録音を再生するための細いプレイヤー。右端は children（メニュー）を差し込める
export default function AudioPlayer({ src, children }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleTime = () => setProgress(audio.currentTime || 0);
    const handleEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.play();
    setPlaying(true);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted((current) => !current);
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    const value = Number(event.target.value);
    if (!audio) return;
    audio.currentTime = value;
    setProgress(value);
  };

  const percent = duration ? (progress / duration) * 100 : 0;
  const iconButton = "flex h-8 w-8 items-center justify-center rounded-full transition";

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-2 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sticky-2 text-sticky-foreground">
        <Mic className="h-4 w-4" />
      </span>

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "一時停止" : "再生"}
        className={cn(iconButton, "bg-primary text-primary-foreground hover:bg-primary/90")}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
      </button>

      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={progress}
        onChange={handleSeek}
        disabled={!duration}
        aria-label="再生位置"
        style={{
          background: `linear-gradient(to right, hsl(var(--accent)) ${percent}%, hsl(var(--border)) ${percent}%)`
        }}
        className="h-1.5 w-24 cursor-pointer appearance-none rounded-full sm:w-36 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "ミュートを解除" : "ミュート"}
        className={cn(iconButton, "text-muted-foreground hover:text-foreground")}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {children}

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}