"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface WaveformPlayerProps {
  url: string;
  filename: string;
  autoplay?: boolean;
}

export default function WaveformPlayer({ url, filename, autoplay = false }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [error, setError] = useState<string | null>(null);

  // Listen for pause events from other players (runs immediately on mount)
  useEffect(() => {
    const handlePauseEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[WaveformPlayer] Received pause event from:', customEvent.detail.source, 'My url:', url);
      if (customEvent.detail.source !== url) {
        console.log('[WaveformPlayer] Pausing myself');
        if (wavesurferRef.current) {
          wavesurferRef.current.pause();
        }
      }
    };

    window.addEventListener('pause-all-players', handlePauseEvent);

    return () => {
      window.removeEventListener('pause-all-players', handlePauseEvent);
    };
  }, [url]);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Prevent double initialization in React Strict Mode
    if (wavesurferRef.current) return;

    let wavesurfer: any = null;

    // Detect if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Dynamically import wavesurfer to avoid SSR issues
    import("wavesurfer.js").then((WaveSurfer) => {
      if (!waveformRef.current || wavesurferRef.current) return;

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
        backend: isMobile ? "MediaElement" : "WebAudio", // Use MediaElement for mobile
        mediaControls: false,
      });

      wavesurfer.load(url);

      wavesurfer.on("ready", () => {
        setIsLoading(false);
        setDuration(formatTime(wavesurfer.getDuration()));
        setError(null);

        // Don't auto-play on mobile (browsers block it)
        if (autoplay && !isMobile) {
          wavesurfer.play().catch((err: any) => {
            console.log("Autoplay prevented:", err);
          });
        }
      });

      wavesurfer.on("audioprocess", () => {
        setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
      });

      // timeupdate works for both WebAudio and MediaElement backends
      wavesurfer.on("timeupdate", (time: number) => {
        setCurrentTime(formatTime(time));
      });

      wavesurfer.on("play", () => {
        setIsPlaying(true);
        console.log('[WaveformPlayer] Playing:', url);
        // Pause all other audio/video elements when this starts playing
        const allMedia = document.querySelectorAll<HTMLMediaElement>('audio, video');
        console.log('[WaveformPlayer] Found audio elements:', allMedia.length);
        allMedia.forEach((media) => {
          if (!media.paused) {
            console.log('[WaveformPlayer] Pausing audio element');
            media.pause();
          }
        });

        // Dispatch custom event to pause all other players
        console.log('[WaveformPlayer] Dispatching pause-all-players event');
        window.dispatchEvent(new CustomEvent('pause-all-players', { detail: { source: url } }));
      });
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
