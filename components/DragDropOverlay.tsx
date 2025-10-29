"use client";

import { useState } from "react";
import { Upload, Music, File } from "lucide-react";

interface DragDropOverlayProps {
  isDragging: boolean;
  onDrop: (files: FileList) => void;
}

export default function DragDropOverlay({ isDragging, onDrop }: DragDropOverlayProps) {
  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="border-4 border-dashed rounded-2xl p-12 pointer-events-none"
        style={{ borderColor: "var(--accent)" }}
      >
        <Upload
          className="w-20 h-20 mx-auto mb-4"
          style={{ color: "var(--accent)" }}
        />
        <p
          className="text-2xl font-light text-center"
          style={{ color: "var(--accent)" }}
        >
          Drop files to upload
        </p>
        <p className="text-sm opacity-60 text-center mt-2" style={{ color: "var(--foreground)" }}>
          Audio files (MP3, WAV, etc.) or Logic projects
        </p>
      </div>
    </div>
  );
}
