"use client";

import { X } from "lucide-react";

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onClose: () => void;
}

export default function YouTubePlayer({ videoId, title, onClose }: YouTubePlayerProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Player */}
      <div
        className="relative w-full max-w-4xl mx-4 rounded-lg shadow-2xl overflow-hidden"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
        >
          <h2 className="text-lg font-light tracking-tight truncate">{title}</h2>
          <button
            onClick={onClose}
            className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* YouTube Embed */}
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
