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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    let wavesurfer: any = null;

    // Dynamically import wavesurfer to avoid SSR issues
    import("wavesurfer.js").then((WaveSurfer) => {
      if (!waveformRef.current) return;

      wavesurfer = WaveSurfer.default.create({
        container: waveformRef.current,
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
        setError(null);
      });

      wavesurfer.on("audioprocess", () => {
        setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
      });

      wavesurfer.on("play", () => setIsPlaying(true));
      wavesurfer.on("pause", () => setIsPlaying(false));
      wavesurfer.on("finish", () => {
        setIsPlaying(false);
        setCurrentTime("0:00");
      });

      wavesurfer.on("error", (err: any) => {
        console.error("WaveSurfer error:", err);
        setError("Failed to load audio file");
        setIsLoading(false);
        setIsPlaying(false);
      });

      wavesurfer.on("seek", () => {
        setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
      });

      wavesurferRef.current = wavesurfer;
    }).catch((err) => {
      console.error("Failed to load WaveSurfer:", err);
      setError("Failed to load audio player");
      setIsLoading(false);
    });

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.stop();
          wavesurferRef.current.destroy();
        } catch (err) {
          console.error("Error destroying wavesurfer:", err);
        }
        wavesurferRef.current = null;
      }
    };
  }, [url]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.playPause();
      } catch (err) {
        console.error("Error toggling playback:", err);
        setError("Playback error occurred");
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border border-white/10 rounded-lg bg-white/5">
      {error ? (
        <div className="text-sm text-red-400 text-center py-4">{error}</div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                disabled={isLoading || !!error}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        </>
      )}
    </div>
  );
}
