import React, { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface WhatsAppVoicePlayerProps {
  audioUrl: string;
  duration?: number;
  avatarUrl?: string;
  senderName?: string;
  isOwn?: boolean;
  className?: string;
}

export function WhatsAppVoicePlayer({
  audioUrl,
  duration = 0,
  avatarUrl,
  senderName = "User",
  isOwn = false,
  className,
}: WhatsAppVoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isSeeking, setIsSeeking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const isSeekingRef = useRef(false);
  const totalDurationRef = useRef(duration || 0);

  // Keep totalDurationRef synced with prop or state
  useEffect(() => {
    if (duration > 0) {
      setTotalDuration(duration);
      totalDurationRef.current = duration;
    }
  }, [duration]);

  // Generate a deterministic pseudo-waveform based on audioUrl
  const waveformBars = useMemo(() => {
    const count = 36;
    const bars: number[] = [];
    let hash = 0;
    for (let i = 0; i < audioUrl.length; i++) {
      hash = (hash << 5) - hash + audioUrl.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < count; i++) {
      const seed = Math.abs(Math.sin(hash + i * 999));
      // height between 25% and 100%
      const h = Math.floor(25 + seed * 75);
      bars.push(h);
    }
    return bars;
  }, [audioUrl]);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
        totalDurationRef.current = audio.duration;
      } else if (audio.duration === Infinity) {
        // WebM duration workaround for recorded blobs in Chrome/Firefox
        const onTimeUpdateForDuration = () => {
          audio.removeEventListener("timeupdate", onTimeUpdateForDuration);
          if (isFinite(audio.currentTime) && audio.currentTime > 0) {
            setTotalDuration(audio.currentTime);
            totalDurationRef.current = audio.currentTime;
          }
          audio.currentTime = 0;
        };
        audio.addEventListener("timeupdate", onTimeUpdateForDuration);
        audio.currentTime = 1e101;
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    const handleDurationChange = () => {
      updateDuration();
    };

    const handleTimeUpdate = () => {
      // If duration wasn't known initially, capture it if available
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        if (totalDurationRef.current <= 0) {
          setTotalDuration(audio.duration);
          totalDurationRef.current = audio.duration;
        }
      }
      if (!isSeekingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Pause any other playing audio on the page
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== audioRef.current) el.pause();
      });
      audioRef.current.play().catch(() => {});
    }
  };

  const calculateSeekTime = (clientX: number) => {
    if (!waveformRef.current) return 0;
    const rect = waveformRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = offsetX / rect.width;

    const dur =
      totalDurationRef.current > 0
        ? totalDurationRef.current
        : totalDuration > 0
        ? totalDuration
        : duration > 0
        ? duration
        : audioRef.current?.duration && isFinite(audioRef.current.duration)
        ? audioRef.current.duration
        : 0;

    return percentage * dur;
  };

  const performSeek = (clientX: number) => {
    const seekTime = calculateSeekTime(clientX);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    isSeekingRef.current = true;
    setIsSeeking(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    performSeek(clientX);
  };

  useEffect(() => {
    const handleSeekMove = (e: MouseEvent | TouchEvent) => {
      if (!isSeekingRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      performSeek(clientX);
    };

    const handleSeekEnd = (e?: MouseEvent | TouchEvent) => {
      if (isSeekingRef.current) {
        if (e) {
          const clientX =
            "touches" in e
              ? (e as TouchEvent).changedTouches?.[0]?.clientX ?? 0
              : (e as MouseEvent).clientX;
          if (clientX) performSeek(clientX);
        }
        isSeekingRef.current = false;
        setIsSeeking(false);
      }
    };

    if (isSeeking) {
      window.addEventListener("mousemove", handleSeekMove);
      window.addEventListener("mouseup", handleSeekEnd);
      window.addEventListener("touchmove", handleSeekMove);
      window.addEventListener("touchend", handleSeekEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleSeekMove);
      window.removeEventListener("mouseup", handleSeekEnd);
      window.removeEventListener("touchmove", handleSeekMove);
      window.removeEventListener("touchend", handleSeekEnd);
    };
  }, [isSeeking]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0 || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const effectiveDuration =
    totalDuration > 0
      ? totalDuration
      : totalDurationRef.current > 0
      ? totalDurationRef.current
      : duration;

  const progressPercent =
    effectiveDuration > 0
      ? Math.min((currentTime / effectiveDuration) * 100, 100)
      : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 select-none max-w-xs sm:max-w-sm",
        isOwn
          ? "bg-emerald-950/60 text-emerald-100 border border-emerald-500/30"
          : "bg-card/70 text-foreground border border-border/60",
        className
      )}
    >
      {/* Sender Avatar with Mic Badge */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border-2 border-background/80 shadow-md">
          <AvatarImage
            src={
              avatarUrl ||
              `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
                senderName
              )}`
            }
          />
          <AvatarFallback>{senderName[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
          <Mic className="h-2.5 w-2.5" />
        </div>
      </div>

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:scale-105 active:scale-95 transition"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-emerald-400 text-emerald-400" />
        ) : (
          <Play className="h-4 w-4 fill-emerald-400 text-emerald-400 ml-0.5" />
        )}
      </button>

      {/* Waveform Seekbar Track & Handle */}
      <div className="flex-1 space-y-1 min-w-0">
        <div
          ref={waveformRef}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          className="relative flex items-center h-8 cursor-pointer group py-1 touch-none select-none"
        >
          {/* Waveform Bars Container */}
          <div className="flex items-center justify-between w-full h-full gap-[2px] pointer-events-none">
            {waveformBars.map((heightPercent, idx) => {
              const barPosPercent = (idx / waveformBars.length) * 100;
              const isPlayed = barPosPercent <= progressPercent;

              return (
                <span
                  key={idx}
                  className={cn(
                    "w-[3px] rounded-full transition-colors duration-100",
                    isPlayed
                      ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                      : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                  )}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          {/* Draggable Blue Seekbar Thumb Dot (WhatsApp Style) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-sky-400 shadow-md ring-2 ring-sky-300/40 transition-transform duration-75 group-hover:scale-125 pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />
        </div>

        {/* Time Label */}
        <div className="flex items-center justify-between text-[11px] font-mono opacity-80 px-0.5">
          <span>{formatTime(currentTime)}</span>
          {effectiveDuration > 0 && <span>{formatTime(effectiveDuration)}</span>}
        </div>
      </div>
    </div>
  );
}
