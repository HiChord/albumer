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
  onDelete: (fileId: string) => void;
  onClose: () => void;
}

export default function FileManager({
  songId,
  songTitle,
  type,
  files,
  onUpload,
  onDelete,
  onClose,
}: FileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: string}>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force a direct file input trigger
  const triggerFileInput = () => {
    const input = fileInputRef.current;
    if (!input) {
      alert("File input not found!");
      return;
    }
    input.click();
  };

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
    setUploadError(null);
    const uploadedFiles: any[] = [];

    // Dynamic import to avoid SSR issues
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const totalFiles = selectedFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = selectedFiles[i];
      const fileKey = `${file.name}-${i}`;

      try {
        // Show immediate feedback
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'Preparing...' }));
        console.log(`Starting upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const basename = file.name
          .replace(`.${ext}`, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueFilename = `${basename}_${timestamp}_${randomStr}.${ext}`;

        // Determine bucket based on type prop
        const bucketName = type === "logic" ? "Logic-files" : "Audio-files";
        console.log(`Target bucket: ${bucketName}`);

        // Convert to bytes (this can take time for large files)
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'Reading file...' }));
        const bytes = await file.arrayBuffer();
        console.log(`File converted to buffer: ${bytes.byteLength} bytes`);

        setUploadProgress(prev => ({ ...prev, [fileKey]: 10 }));
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'Uploading to storage...' }));

        // Upload to Supabase Storage (this is the slow part for large files)
        console.log(`Starting Supabase upload...`);
        const { data, error} = await supabase.storage
          .from(bucketName)
          .upload(uniqueFilename, bytes, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        if (error) {
          console.error("Supabase upload error:", error);
          throw new Error(error.message);
        }

        console.log(`Upload successful! File: ${uniqueFilename}`);
        setUploadProgress(prev => ({ ...prev, [fileKey]: 90 }));
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'Finalizing...' }));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniqueFilename);

        console.log(`Public URL: ${urlData.publicUrl}`);
        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'Complete!' }));

        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          externalId: uniqueFilename,
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        const errorMsg = err.message.includes("exceeded the maximum")
          ? `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please increase the upload limit in Supabase Storage settings.`
          : err.message || 'Unknown error occurred';

        setUploadError(`Failed to upload ${file.name}: ${errorMsg}`);
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'Failed!' }));
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

        // Don't remove progress - keep it visible so user can see the error
      }
    }

    setIsUploading(false);

    if (uploadedFiles.length > 0) {
      onUpload(uploadedFiles);
      // Only reset on success
      setUploadProgress({});
      setUploadStatus({});
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
              {type === "logic" ? (
                <p className="text-xs opacity-30 mt-2">
                  Compress your .logicx file first (right-click → Compress),<br />
                  then upload the .zip file
                </p>
              ) : (
                <p className="text-xs opacity-30 mt-2">Click &quot;Upload New File&quot; to add files</p>
              )}
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
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${file.name}? This cannot be undone.`)) {
                          onDelete(file.id);
                        }
                      }}
                      className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <div className="flex flex-col gap-2">
              {uploadError && (
                <div className="px-4 py-2 text-xs bg-red-500/20 border border-red-500/30 rounded text-red-200 max-w-sm">
                  {uploadError}
                </div>
              )}
              <label
                htmlFor={`file-input-${type}`}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-light text-white transition-opacity cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ background: "var(--accent)" }}
                onMouseEnter={(e) => !isUploading && (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload New File"}
              </label>
              {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(uploadProgress).map(([key, progress]) => {
                    const fileName = key.split('-').slice(0, -1).join('-');
                    const status = uploadStatus[key] || '';
                    const isUploading = progress > 0 && progress < 100 && status !== 'Failed!';
                    const isFailed = status === 'Failed!';
                    return (
                      <div key={key} className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="opacity-60 truncate max-w-[180px]" title={fileName}>{fileName}</span>
                          <span className={`opacity-40 ${isFailed ? 'text-red-400' : ''}`}>
                            {status || `${Math.round(progress)}%`}
                          </span>
                        </div>
                        {isUploading && progress > 0 && (
                          <div className="text-[10px] opacity-30">
                            {progress < 10 ? 'Preparing file...' : 'Large file - this may take several minutes...'}
                          </div>
                        )}
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${isUploading ? 'animate-pulse' : 'duration-300'} ${isFailed ? 'bg-red-500' : ''}`}
                            style={{
                              width: `${Math.max(progress, 5)}%`,
                              background: isFailed ? undefined : 'var(--accent)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          id={`file-input-${type}`}
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept={type === "audio" ? "audio/*" : ""}
          multiple
        />
      </div>
    </div>
  );
}
