"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, X, SkipBack, SkipForward } from "lucide-react";
import WaveSurfer from "wavesurfer.js";

interface BottomPlayerProps {
  song: {
    id: string;
    title: string;
    audioUrl: string;
  } | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function BottomPlayer({ song, onClose, onNext, onPrevious, hasNext, hasPrevious }: BottomPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!waveformRef.current || !song) return;

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Create new WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(255, 255, 255, 0.3)",
      progressColor: "rgba(255, 255, 255, 0.8)",
      cursorColor: "rgba(255, 255, 255, 0.5)",
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 1,
      height: 60,
      barGap: 2,
      normalize: true,
      hideScrollbar: true,
    });

    wavesurfer.load(song.audioUrl);

    wavesurfer.on("ready", () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
      wavesurfer.play();
      setIsPlaying(true);
      // Pause all other players when this starts playing
      window.dispatchEvent(new CustomEvent('pause-all-players', { detail: { source: 'bottom-player' } }));
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
      // Pause all other players when this starts playing
      window.dispatchEvent(new CustomEvent('pause-all-players', { detail: { source: 'bottom-player' } }));
    });

    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      if (onNext && hasNext) {
        onNext();
      }
    });

    wavesurfer.on("audioprocess", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on("seeking", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setIsLoading(false);
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [song?.id, song?.audioUrl]);

  // Listen for pause events from other players (ListenMode, etc.)
  useEffect(() => {
    const handlePauseEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.source !== 'bottom-player' && wavesurferRef.current) {
        wavesurferRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('pause-all-players', handlePauseEvent);

    return () => {
      window.removeEventListener('pause-all-players', handlePauseEvent);
    };
  }, []);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!song) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl"
      style={{
        background: "rgba(0, 0, 0, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="max-w-[2000px] mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Song Info */}
          <div className="flex-shrink-0 w-48 md:w-64">
            <div className="text-sm font-light text-white truncate">{song.title}</div>
            <div className="text-xs opacity-40 text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity disabled:opacity-20"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
              title="Previous"
            >
              <SkipBack className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-opacity disabled:opacity-50"
              style={{ background: "rgba(255, 255, 255, 0.2)" }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <Pause className="w-4 h-4 text-white" fill="white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity disabled:opacity-20"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
              title="Next"
            >
              <SkipForward className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Waveform */}
          <div className="flex-1 min-w-0">
            <div ref={waveformRef} className="w-full" />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
            style={{ background: "rgba(255, 255, 255, 0.1)" }}
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
