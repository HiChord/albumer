"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  currentFile?: string;
  label: string;
}

export default function DropZone({ onFileSelect, accept, currentFile, label }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative transition-all duration-200 ${
        isDragging
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105"
          : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id={`file-${label}`}
      />
      <label
        htmlFor={`file-${label}`}
        className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          currentFile ? "bg-slate-50 dark:bg-slate-900" : ""
        }`}
      >
        <Upload className={`w-6 h-6 ${isDragging ? "text-indigo-500" : "text-slate-400"}`} />
        <div className="text-center">
          {currentFile ? (
            <>
              <div className="font-medium text-slate-700 dark:text-slate-300">{currentFile}</div>
              <div className="text-sm text-slate-500 mt-1">Click or drag to replace</div>
            </>
          ) : (
            <>
              <div className="font-medium text-slate-700 dark:text-slate-300">{label}</div>
              <div className="text-sm text-slate-500 mt-1">Click or drag to upload</div>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
