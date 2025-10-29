"use client";

import { useState } from "react";
import { X, Music, FileAudio, File as FileIcon, Plus } from "lucide-react";

interface FileToAssign {
  file: File;
  type: "audio" | "logic";
}

interface FileAssignmentModalProps {
  files: FileToAssign[];
  songs: Array<{ id: string; title: string }>;
  onAssign: (songId: string | "new", files: FileToAssign[]) => void;
  onClose: () => void;
}

export default function FileAssignmentModal({
  files,
  songs,
  onAssign,
  onClose,
}: FileAssignmentModalProps) {
  const [selectedSongId, setSelectedSongId] = useState<string | "new">(
    songs.length > 0 ? songs[0].id : "new"
  );

  const audioFiles = files.filter((f) => f.type === "audio");
  const logicFiles = files.filter((f) => f.type === "logic");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl overflow-hidden"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-alt)",
          }}
        >
          <h2 className="text-lg font-light tracking-tight">
            Assign Files to Track
          </h2>
          <button
            onClick={onClose}
            className="opacity-40 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Files Summary */}
          <div className="mb-6">
            <p className="text-sm opacity-60 mb-4">
              You dropped {files.length} file{files.length !== 1 ? "s" : ""}:
            </p>
            <div className="space-y-2">
              {audioFiles.length > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded border"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-alt)",
                  }}
                >
                  <FileAudio className="w-5 h-5 opacity-60" />
                  <div>
                    <p className="text-sm font-light">
                      {audioFiles.length} Audio file{audioFiles.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs opacity-40">
                      {audioFiles.map((f) => f.file.name).join(", ")}
                    </p>
                  </div>
                </div>
              )}
              {logicFiles.length > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded border"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-alt)",
                  }}
                >
                  <FileIcon className="w-5 h-5 opacity-60" />
                  <div>
                    <p className="text-sm font-light">
                      {logicFiles.length} Logic file{logicFiles.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs opacity-40">
                      {logicFiles.map((f) => f.file.name).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Track Selection */}
          <div>
            <label className="block text-sm opacity-60 mb-3">
              Select track to assign files to:
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* New Track Option */}
              <button
                onClick={() => setSelectedSongId("new")}
                className="w-full flex items-center gap-3 p-4 rounded border transition-all"
                style={{
                  borderColor:
                    selectedSongId === "new" ? "var(--accent)" : "var(--border)",
                  background:
                    selectedSongId === "new"
                      ? "var(--highlight)"
                      : "var(--surface-alt)",
                }}
              >
                <Plus
                  className="w-5 h-5"
                  style={{
                    color: selectedSongId === "new" ? "var(--accent)" : undefined,
                  }}
                />
                <span className="font-light">Create New Track</span>
              </button>

              {/* Existing Tracks */}
              {songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => setSelectedSongId(song.id)}
                  className="w-full flex items-center gap-3 p-4 rounded border transition-all"
                  style={{
                    borderColor:
                      selectedSongId === song.id ? "var(--accent)" : "var(--border)",
                    background:
                      selectedSongId === song.id
                        ? "var(--highlight)"
                        : "var(--surface-alt)",
                  }}
                >
                  <Music
                    className="w-5 h-5"
                    style={{
                      color:
                        selectedSongId === song.id ? "var(--accent)" : undefined,
                    }}
                  />
                  <span className="font-light truncate">{song.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-alt)",
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm opacity-40 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={() => onAssign(selectedSongId, files)}
            className="px-6 py-2 text-sm font-light text-white transition-opacity"
            style={{ background: "var(--accent)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Assign Files
          </button>
        </div>
      </div>
    </div>
  );
}
