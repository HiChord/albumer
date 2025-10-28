"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface WaveformPlayerProps {
  url: string;
  filename: string;
}

export default function WaveformPlayer({ url, filename }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  useEffect(() => {
    if (!waveformRef.current) return;

    // Dynamically import wavesurfer to avoid SSR issues
    import("wavesurfer.js").then((WaveSurfer) => {
      const wavesurfer = WaveSurfer.default.create({
        container: waveformRef.current!,
        waveColor: "rgba(255, 255, 255, 0.3)",
        progressColor: "rgba(255, 255, 255, 0.8)",
        cursorColor: "rgba(255, 255, 255, 0.5)",
        barWidth: 2,
        barRadius: 3,
        barGap: 2,
        height: 60,
        normalize: true,
        backend: "WebAudio",
      });

      wavesurfer.load(url);

      wavesurfer.on("ready", () => {
        setIsLoading(false);
        setDuration(formatTime(wavesurfer.getDuration()));
      });

      wavesurfer.on("audioprocess", () => {
        setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
      });

      wavesurfer.on("play", () => setIsPlaying(true));
      wavesurfer.on("pause", () => setIsPlaying(false));
      wavesurfer.on("finish", () => setIsPlaying(false));

      wavesurferRef.current = wavesurfer;

      return () => {
        wavesurfer.destroy();
      };
    });
  }, [url]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border border-white/10 rounded-lg bg-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{filename}</span>
            <span className="text-xs opacity-40">
              {currentTime} / {duration}
            </span>
          </div>
        </div>
      </div>

      <div ref={waveformRef} className="w-full" />

      {isLoading && (
        <div className="text-xs opacity-40 text-center">Loading waveform...</div>
      )}
    </div>
  );
}
