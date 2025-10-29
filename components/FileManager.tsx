"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, Clock, FileAudio, File as FileIcon, Trash2 } from "lucide-react";

interface FileWithHistory {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
  externalId?: string | null;
}

interface FileManagerProps {
  songId: string;
  songTitle: string;
  type: "audio" | "logic";
  files: FileWithHistory[];
  onUpload: (files: { name: string; url: string; size: number; mimeType: string; externalId?: string }[]) => void;
  onClose: () => void;
}

export default function FileManager({
  songId,
  songTitle,
  type,
  files,
  onUpload,
  onClose,
}: FileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploadedFiles: any[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileKey = `${file.name}-${i}`;

      try {
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.file) {
          throw new Error(data.error || "Upload failed");
        }

        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
        uploadedFiles.push(data.file);
      } catch (err: any) {
        console.error("Upload error:", err);
        alert(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setUploadProgress({});

    if (uploadedFiles.length > 0) {
      onUpload(uploadedFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("audio/")) {
      return <FileAudio className="w-5 h-5" />;
    }
    return <FileIcon className="w-5 h-5" />;
  };

  // Sort files by date, newest first
  const sortedFiles = [...files].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[80vh] mx-4 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
        >
          <div>
            <h2 className="text-lg font-light tracking-tight">
              {type === "audio" ? "Audio Files" : "Logic Project Files"}
            </h2>
            <p className="text-xs opacity-40 mt-1">{songTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="opacity-40 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 opacity-20 flex items-center justify-center">
                {type === "audio" ? <FileAudio className="w-16 h-16" /> : <FileIcon className="w-16 h-16" />}
              </div>
              <p className="text-sm opacity-40">No {type} files uploaded yet</p>
              <p className="text-xs opacity-30 mt-2">Click &quot;Upload New File&quot; to add files</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="group flex items-center gap-4 p-4 rounded border transition-all hover:bg-opacity-50"
                  style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
                >
                  <div className="opacity-60">{getFileIcon(file.mimeType)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs opacity-40">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-xs opacity-30">•</span>
                      <span className="text-xs opacity-40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(file.createdAt)}
                      </span>
                      {index === 0 && (
                        <>
                          <span className="text-xs opacity-30">•</span>
                          <span className="text-xs opacity-60" style={{ color: "var(--accent)" }}>
                            Current
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.url}
                      download={file.name}
                      className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
        >
          <p className="text-xs opacity-40">
            {sortedFiles.length} file{sortedFiles.length !== 1 ? "s" : ""} • History preserved
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
            >
              Close
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-light text-white transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)" }}
              onMouseEnter={(e) => !isUploading && (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload New File"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={type === "audio" ? "audio/*" : ".logicx,.logic"}
          multiple
        />
      </div>
    </div>
  );
}
