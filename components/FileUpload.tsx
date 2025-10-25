"use client";

import { useState } from "react";

interface FileUploadProps {
  onUploadComplete: (file: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }) => void;
  accept?: string;
  label: string;
}

export default function FileUpload({ onUploadComplete, accept, label }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onUploadComplete(data.file);

      // Reset input
      e.target.value = "";
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        className="cursor-pointer px-3 py-1.5 text-xs uppercase tracking-wider font-light transition-opacity hover:opacity-80"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          disabled={isUploading}
        />
        {isUploading ? "Uploading..." : label}
      </label>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
