"use client";

import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from "lucide-react";

interface AudioFile {
  id: string;
  name: string;
  url: string;
  songId: string;
  songTitle: string;
}

interface ListenModeProps {
  isOpen: boolean;
  onClose: () => void;
  audioFiles: AudioFile[];
  onReorder: (reorderedFiles: AudioFile[]) => void;
}

export default function ListenMode({ isOpen, onClose, audioFiles, onReorder }: ListenModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [playlist, setPlaylist] = useState<AudioFile[]>(audioFiles);
  const [waveformReady, setWaveformReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);

  useEffect(() => {
    setPlaylist(audioFiles);
  }, [audioFiles]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentIndex < playlist.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    // Pause all other audio/video elements when this starts playing
    const handlePlay = () => {
      // Pause all HTML audio/video elements
      const allMedia = document.querySelectorAll<HTMLMediaElement>('audio, video');
      allMedia.forEach((media) => {
        if (media !== audio && !media.paused) {
          media.pause();
        }
      });

      // Dispatch custom event to pause all WaveSurfer players
      window.dispatchEvent(new CustomEvent('pause-all-players', { detail: { source: 'listen-mode' } }));
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
    };
  }, [currentIndex, playlist.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset time when track changes
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      audio.play().catch(err => console.error("Play error:", err));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentIndex]);

  // Initialize WaveSurfer for waveform visualization
  useEffect(() => {
    const currentFile = playlist[currentIndex];
    if (!waveformRef.current || !currentFile) return;

    setWaveformReady(false);

    // Clean up previous instance
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch (err) {
        console.error("Error destroying wavesurfer:", err);
      }
      wavesurferRef.current = null;
    }

    // Detect if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Dynamically import wavesurfer to avoid SSR issues
    import("wavesurfer.js").then((WaveSurfer) => {
      if (!waveformRef.current) return;

      const wavesurfer = WaveSurfer.default.create({
        container: waveformRef.current,
        waveColor: "rgba(212, 165, 116, 0.3)",
        progressColor: "#d4a574",
        cursorColor: "#d4a574",
        barWidth: 2,
        barRadius: 3,
        barGap: 2,
        height: 80,
        normalize: true,
        backend: isMobile ? "MediaElement" : "WebAudio",
        mediaControls: false,
      });

      wavesurfer.load(currentFile.url);

      wavesurfer.on("ready", () => {
        setWaveformReady(true);
      });

      wavesurfer.on("error", (err: any) => {
        console.error("WaveSurfer error:", err);
        setWaveformReady(false);
      });

      // Sync WaveSurfer with native audio element
      wavesurfer.on("interaction", () => {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = wavesurfer.getCurrentTime();
        }
      });

      wavesurferRef.current = wavesurfer;
    }).catch((err) => {
      console.error("Failed to load WaveSurfer:", err);
      setWaveformReady(false);
    });

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (err) {
          console.error("Error destroying wavesurfer:", err);
        }
        wavesurferRef.current = null;
      }
    };
  }, [playlist, currentIndex]);

  // Sync WaveSurfer playback state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    const wavesurfer = wavesurferRef.current;
    if (!audio || !wavesurfer) return;

    const syncWaveform = () => {
      if (wavesurfer && waveformReady) {
        const progress = audio.currentTime / audio.duration;
        if (!isNaN(progress)) {
          wavesurfer.seekTo(progress);
        }
      }
    };

    // Listen for pause events from track players
    const handlePauseEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.source !== 'listen-mode') {
        audio.pause();
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", syncWaveform);
    window.addEventListener('pause-all-players', handlePauseEvent);

    return () => {
      audio.removeEventListener("timeupdate", syncWaveform);
      window.removeEventListener('pause-all-players', handlePauseEvent);
    };
  }, [waveformReady, currentIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const skipBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPlaylist = [...playlist];
    const [draggedFile] = newPlaylist.splice(draggedIndex, 1);
    newPlaylist.splice(dropIndex, 0, draggedFile);

    // Update current index if needed
    if (currentIndex === draggedIndex) {
      setCurrentIndex(dropIndex);
    } else if (draggedIndex < currentIndex && dropIndex >= currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (draggedIndex > currentIndex && dropIndex <= currentIndex) {
      setCurrentIndex(currentIndex + 1);
    }

    setPlaylist(newPlaylist);
    onReorder(newPlaylist);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTrackClick = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  if (!isOpen) return null;

  const currentFile = playlist[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative ml-auto w-full md:max-w-2xl shadow-2xl flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}>
          <div className="flex items-center gap-4">
            <Music className="w-4 h-4 opacity-60" style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="text-base md:text-lg font-light tracking-tight" style={{ fontWeight: 300 }}>Listen Mode</h2>
              <p className="text-xs opacity-40 uppercase tracking-wider mt-1">{playlist.length} tracks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 opacity-40 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist */}
        <div className="flex-1 overflow-y-auto">
          {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Music className="w-12 h-12 opacity-20 mb-4" />
              <p className="text-sm opacity-40 font-light">No audio files yet</p>
              <p className="text-xs opacity-30 font-light mt-2">Upload bounces to start listening</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {playlist.map((file, index) => {
                const isCurrent = index === currentIndex;
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index && draggedIndex !== index;

                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleTrackClick(index)}
                    className="group px-4 md:px-6 py-4 md:py-4 cursor-pointer transition-all duration-200 border-b-2 md:border-b"
                    style={{
                      background: isCurrent
                        ? 'var(--highlight)'
                        : isDragging
                        ? 'var(--surface-alt)'
                        : isDropTarget
                        ? 'var(--accent)'
                        : 'var(--background)',
                      opacity: isDragging ? '0.5' : '1',
                      transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      boxShadow: isDropTarget ? '0 0 0 2px var(--accent)' : 'none',
                      borderColor: isCurrent ? 'var(--accent)' : 'var(--border)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-xs md:text-xs opacity-40 font-light" style={{ fontWeight: 300 }}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-light text-base md:text-sm truncate" style={{ fontWeight: isCurrent ? 500 : 300 }}>
                          {file.songTitle}
                        </div>
                        <div className="text-sm md:text-xs opacity-40 truncate mt-0.5">
                          {file.name}
                        </div>
                      </div>
                      {isCurrent && isPlaying && (
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-3 animate-pulse" style={{ background: 'var(--accent)' }}></div>
                          <div className="w-1 h-4 animate-pulse delay-75" style={{ background: 'var(--accent)' }}></div>
                          <div className="w-1 h-3 animate-pulse delay-150" style={{ background: 'var(--accent)' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Player Controls */}
        {currentFile && (
          <div className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}>
            <div className="px-4 md:px-8 py-4 md:py-6">
              {/* Now Playing */}
              <div className="mb-4">
                <div className="text-sm font-light mb-1" style={{ fontWeight: 300 }}>
                  {currentFile.songTitle}
                </div>
                <div className="text-xs opacity-40 truncate">
                  {currentFile.name}
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className="mb-4">
                {!waveformReady && (
                  <div className="text-xs opacity-40 text-center mb-2">Loading waveform...</div>
                )}
                <div
                  ref={waveformRef}
                  className="w-full rounded-lg overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    minHeight: '80px'
                  }}
                />
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 appearance-none rounded-full audio-slider"
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(currentTime / duration) * 100}%, var(--border) ${(currentTime / duration) * 100}%, var(--border) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs opacity-40 mt-2 font-light">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 appearance-none rounded-full audio-slider"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(isMuted ? 0 : volume) * 100}%, var(--border) ${(isMuted ? 0 : volume) * 100}%, var(--border) 100%)`
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={skipBack}
                    disabled={currentIndex === 0}
                    className="p-2 opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="p-4 rounded-full transition-opacity"
                    style={{ background: 'var(--accent)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" style={{ color: 'white' }} />
                    ) : (
                      <Play className="w-5 h-5" style={{ color: 'white' }} />
                    )}
                  </button>
                  <button
                    onClick={skipForward}
                    disabled={currentIndex === playlist.length - 1}
                    className="p-2 opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-24"></div>
              </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
              key={currentFile.id}
              ref={audioRef}
              src={currentFile.url}
              preload="metadata"
            />
          </div>
        )}
      </div>
    </div>
  );
}
