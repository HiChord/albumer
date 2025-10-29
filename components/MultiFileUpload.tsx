"use client";

import { useState, useRef } from "react";
import { Upload, X, FileAudio, File as FileIcon, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  url?: string;
  error?: string;
}

interface MultiFileUploadProps {
  onUploadComplete: (files: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
    externalId?: string | null;
    previewUrl?: string | null;
  }[]) => void;
  accept?: string;
  label: string;
  onClose: () => void;
}

export default function MultiFileUpload({
  onUploadComplete,
  accept,
  label,
  onClose,
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const uploadedFiles: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      if (fileData.status === "success") continue;

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "uploading" as const, progress: 0 } : f
          )
        );

        const formData = new FormData();
        formData.append("file", fileData.file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.file) {
          throw new Error(data.error || "Upload failed");
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "success" as const,
                  progress: 100,
                  url: data.file.url,
                }
              : f
          )
        );

        uploadedFiles.push(data.file);
      } catch (err: any) {
        console.error("Upload error:", err);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error" as const,
                  error: err.message || "Upload failed",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    // Call onUploadComplete with all successfully uploaded files
    if (uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
      onClose();
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["mp3", "wav", "aac", "flac", "m4a", "ogg"].includes(ext || "")) {
      return <FileAudio className="w-5 h-5" />;
    }
    return <FileIcon className="w-5 h-5" />;
  };

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
          style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
        >
          <h2 className="text-lg font-light tracking-tight">{label}</h2>
          <button
            onClick={onClose}
            className="opacity-40 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File List */}
        <div className="p-6">
          {files.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors"
              style={{ borderColor: "var(--border)" }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "var(--surface-alt)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm opacity-60 mb-2">Click to select files or drag and drop</p>
              <p className="text-xs opacity-40">
                {accept ? `Accepted: ${accept}` : "All files accepted"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((fileData, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded border"
                  style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
                >
                  <div className="opacity-60">{getFileIcon(fileData.file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{fileData.file.name}</p>
                    <p className="text-xs opacity-40">
                      {formatFileSize(fileData.file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {fileData.status === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {fileData.status === "error" && (
                      <AlertCircle
                        className="w-4 h-4 text-red-500"
                        title={fileData.error}
                      />
                    )}
                    {fileData.status === "uploading" && (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)" }} />
                    )}
                    {fileData.status === "pending" && (
                      <button
                        onClick={() => removeFile(index)}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add More Button */}
          {files.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full mt-4 py-2 text-sm opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
              style={{ color: "var(--foreground)" }}
            >
              + Add More Files
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={accept}
            multiple
          />
        </div>

        {/* Footer */}
        {files.length > 0 && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}
          >
            <p className="text-xs opacity-40">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
              >
                Cancel
              </button>
              <button
                onClick={uploadAllFiles}
                disabled={isUploading || files.length === 0}
                className="px-6 py-2 text-sm font-light text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent)" }}
                onMouseEnter={(e) => !isUploading && (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
