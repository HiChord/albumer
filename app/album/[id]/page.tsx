"use client";

import { useState, useEffect, use, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Music,
  Play,
  Pause,
  X,
  Loader2,
  ExternalLink,
  Youtube,
  Trash2,
  Headphones,
  Download,
  Upload as UploadIcon,
  Search
} from "lucide-react";
import Link from "next/link";
import {
  getAlbum,
  createSong,
  updateSong,
  deleteSong,
  addReference,
  deleteReference,
  addComment,
  updateComment,
  deleteComment,
  searchSpotify,
  searchYouTube,
  addFile,
  deleteFile,
  updateAlbum,
  deleteAlbum,
  reorderSongs
} from "@/lib/actions";
import VersionHistory from "@/components/VersionHistory";
import ListenMode from "@/components/ListenMode";
import FileUpload from "@/components/FileUpload";
import WaveformPlayer from "@/components/WaveformPlayer";
import DragDropOverlay from "@/components/DragDropOverlay";
import FileAssignmentModal from "@/components/FileAssignmentModal";
import FileManager from "@/components/FileManager";
import YouTubePlayer from "@/components/YouTubePlayer";
import { useUser } from "@/lib/UserContext";

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { currentUser } = useUser();
  const [album, setAlbum] = useState<any>(null);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [showRefSearch, setShowRefSearch] = useState<string | null>(null);
  const [refSearchQuery, setRefSearchQuery] = useState("");
  const [refSearchType, setRefSearchType] = useState<"spotify" | "youtube">("youtube");
  const [refSearchResults, setRefSearchResults] = useState<any[]>([]);
  const [searchingRefs, setSearchingRefs] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");
  const [editingCommentUser, setEditingCommentUser] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});
  const [editingAlbumName, setEditingAlbumName] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showListenMode, setShowListenMode] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<Array<{ file: File; type: "audio" | "logic" }> | null>(null);
  const [dragOverSongId, setDragOverSongId] = useState<string | null>(null);
  const [fileManagerOpen, setFileManagerOpen] = useState<{ songId: string; type: "audio" | "logic"; songTitle: string } | null>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<{ videoId: string; title: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [songId: string]: { [fileKey: string]: { progress: number; status: string; fileName: string } } }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("All");

  useEffect(() => {
    loadAlbum();

    // Auto-refresh every 30 seconds, but only if not editing or playing
    const interval = setInterval(() => {
      // Don't refresh if user is editing (has typing debounce active) or if audio is playing
      const hasActiveEdits = Object.keys(editingValuesRef.current).length > 0;
      if (!hasActiveEdits && !playingSongRef.current) {
        loadAlbum();
      }
    }, 30000); // Increased to 30 seconds

    return () => clearInterval(interval);
  }, [resolvedParams.id]); // Only depend on the album ID, not editing state

  const loadAlbum = async () => {
    setLoading(true);
    const data = await getAlbum(resolvedParams.id);
    setAlbum(data);
    if (data) setAlbumName(data.name);
    setLoading(false);
  };

  const handleUpdateAlbumName = async () => {
    if (!albumName.trim() || albumName === album.name) {
      setEditingAlbumName(false);
      setAlbumName(album.name);
      return;
    }
    await updateAlbum(resolvedParams.id, albumName);
    await loadAlbum();
    setEditingAlbumName(false);
  };

  const handleAddSong = async () => {
    await createSong(resolvedParams.id);
    await loadAlbum();
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!confirm(`Delete "${songTitle}"? This cannot be undone.`)) return;
    await deleteSong(songId);
    await loadAlbum();
  };

  const handleDeleteAlbum = async () => {
    if (!confirm(`Delete album "${album.name}"? This will delete all songs and cannot be undone.`)) return;
    await deleteAlbum(resolvedParams.id);
    window.location.href = "/";
  };

  // Debounce timers and refs to track current state for interval
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const editingValuesRef = useRef(editingValues);
  const playingSongRef = useRef(playingSong);

  // Update refs when state changes
  useEffect(() => {
    editingValuesRef.current = editingValues;
  }, [editingValues]);

  useEffect(() => {
    playingSongRef.current = playingSong;
  }, [playingSong]);

  const handleUpdateSong = async (songId: string, field: string, value: any) => {
    // Update local state immediately for responsive UI
    const key = `${songId}-${field}`;
    setEditingValues(prev => ({ ...prev, [key]: value }));

    // Debounce the database update
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }

    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await updateSong(songId, { [field]: value, user: currentUser });
        // Update the album state directly without full reload
        setAlbum((prevAlbum: any) => {
          if (!prevAlbum) return prevAlbum;
          return {
            ...prevAlbum,
            songs: prevAlbum.songs.map((s: any) =>
              s.id === songId ? { ...s, [field]: value } : s
            ),
          };
        });
        // Don't remove from editing values - keep it until user moves away
      } catch (error) {
        console.error("Error saving:", error);
        // Keep the editing value if save failed
      }
    }, 1000); // Increased to 1 second for better stability
  };

  // Helper to get the current value (from editing state or song)
  const getValue = (songId: string, field: string, defaultValue: any) => {
    const key = `${songId}-${field}`;
    return editingValues[key] !== undefined ? editingValues[key] : defaultValue;
  };

  // Clear editing value on blur
  const handleBlur = (songId: string, field: string) => {
    const key = `${songId}-${field}`;
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  const handleSearchReferences = async () => {
    if (!refSearchQuery.trim()) return;

    setSearchingRefs(true);
    try {
      if (refSearchType === "spotify") {
        const results = await searchSpotify(refSearchQuery);
        setRefSearchResults(results.tracks || []);
      } else {
        const results = await searchYouTube(refSearchQuery);
        setRefSearchResults(results.videos || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      setRefSearchResults([]);
    }
    setSearchingRefs(false);
  };

  const handleAddReference = async (songId: string, ref: any) => {
    await addReference(songId, {
      type: refSearchType,
      user: currentUser,
      ...ref
    });
    await loadAlbum();
    setShowRefSearch(null);
    setRefSearchQuery("");
    setRefSearchResults([]);
  };

  const handleAddYouTubeUrl = async (songId: string, url: string) => {
    // Extract video ID from YouTube URL
    let videoId = "";
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }

    await addReference(songId, {
      type: "youtube",
      title: "YouTube Video",
      artist: "",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      user: currentUser,
    });
    await loadAlbum();
    setShowRefSearch(null);
    setRefSearchQuery("");
    setRefSearchResults([]);
  };

  const handleDeleteReference = async (refId: string) => {
    await deleteReference(refId);
    await loadAlbum();
  };

  const handleAddComment = async (songId: string) => {
    if (!commentText[songId]?.trim()) return;

    await addComment(songId, {
      user: currentUser,
      text: commentText[songId]
    });
    await loadAlbum();
    setCommentText({ ...commentText, [songId]: "" });
  };

  const handleStartEditComment = (comment: any) => {
    setEditingComment(comment.id);
    setEditingCommentText(comment.text);
    setEditingCommentUser(comment.user);
  };

  const handleUpdateComment = async (commentId: string) => {
    await updateComment(commentId, {
      text: editingCommentText,
      user: editingCommentUser
    });
    await loadAlbum();
    setEditingComment(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    await deleteComment(commentId);
    await loadAlbum();
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

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSongs = [...album.songs];
    const [draggedSong] = newSongs.splice(draggedIndex, 1);
    newSongs.splice(dropIndex, 0, draggedSong);

    setAlbum({ ...album, songs: newSongs });
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist order to database
    const songIds = newSongs.map(s => s.id);
    await reorderSongs(album.id, songIds);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTrackDragOver = (e: React.DragEvent, songId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setDragOverSongId(songId);
    }
  };

  const handleTrackDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSongId(null);
  };

  const handleTrackDrop = async (e: React.DragEvent, songId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSongId(null);
    setIsDraggingFiles(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Upload files directly to this track
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isAudio = ["mp3", "wav", "aac", "flac", "m4a", "ogg", "aiff"].includes(ext || "");
      const isLogic = ["logicx", "logic"].includes(ext || "");
      const type = isLogic ? "logic" : "audio";

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.file) {
        await addFile(songId, {
          name: data.file.name,
          type,
          url: data.file.url,
          mimeType: data.file.mimeType,
          size: data.file.size,
          externalId: data.file.externalId ?? undefined,
        });
      }
    }

    await loadAlbum();
  };

  const getAudioFile = (song: any) => {
    return song.files?.find((f: any) => f.type === "audio");
  };

  const getLogicFile = (song: any) => {
    return song.files?.find((f: any) => f.type === "logic");
  };

  const getProgressColor = (progress: string) => {
    const colors: { [key: string]: string } = {
      "Voice Memo": "#60A5FA",
      "In Progress": "#FBBF24",
      "Recording": "#EF4444",
      "Mixing": "#A78BFA",
      "Mastering": "#F97316",
      "Complete": "#10B981",
    };
    return colors[progress] || "#FBBF24"; // Default to "In Progress" color
  };

  const getOriginColor = (origin: string) => {
    const colors: { [key: string]: string } = {
      "Dev +": "#8B5CF6",
      "Andy +": "#06B6D4",
      "Khal +": "#EC4899",
      "Bunnetta Week": "#F59E0B",
      "Group Nashville": "#10B981",
    };
    return colors[origin] || "#10B981"; // Default to "Group Nashville" color
  };

  const getAudioFiles = () => {
    return album.songs
      .map((song: any) => {
        const audioFile = getAudioFile(song);
        if (!audioFile) return null;
        return {
          id: audioFile.id,
          name: audioFile.name,
          url: audioFile.url,
          songId: song.id,
          songTitle: song.title,
        };
      })
      .filter((file: any) => file !== null);
  };

  const getFilteredSongs = () => {
    if (!album) return [];

    let filtered = album.songs;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((song: any) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          song.title.toLowerCase().includes(searchLower) ||
          song.notes?.toLowerCase().includes(searchLower) ||
          song.lyrics?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by origin
    if (originFilter !== "All") {
      filtered = filtered.filter((song: any) => {
        const songOrigin = song.origin || "Group Nashville";
        return songOrigin === originFilter;
      });
    }

    return filtered;
  };

  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingFiles(true);
    }
  };

  const handlePageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the page container
    if (e.currentTarget === e.target) {
      setIsDraggingFiles(false);
    }
  };

  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const categorizedFiles = files.map((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isAudio = ["mp3", "wav", "aac", "flac", "m4a", "ogg", "aiff"].includes(ext || "");
      const isLogic = ["logicx", "logic", "zip"].includes(ext || "") || file.name.includes(".logicx.");

      return {
        file,
        type: (isLogic ? "logic" : "audio") as "audio" | "logic",
      };
    });

    setDroppedFiles(categorizedFiles);
  };

  const handleFileAssignment = async (songId: string | "new", files: Array<{ file: File; type: "audio" | "logic" }>) => {
    let targetSongId = songId;

    // Create new track if needed
    if (songId === "new") {
      const newSong = await createSong(resolvedParams.id);
      targetSongId = newSong.id;
    }

    setDroppedFiles(null);

    // Group files by type
    const audioFiles = files.filter(f => f.type === "audio").map(f => f.file);
    const logicFiles = files.filter(f => f.type === "logic").map(f => f.file);

    // Use background upload for each type
    if (audioFiles.length > 0) {
      handleBackgroundUpload(targetSongId, "audio", audioFiles);
    }
    if (logicFiles.length > 0) {
      handleBackgroundUpload(targetSongId, "logic", logicFiles);
    }
  };

  const handleReorderFromListenMode = async (reorderedFiles: any[]) => {
    // Extract song IDs in the new order
    const songIds = reorderedFiles.map(file => file.songId);

    // Update local state immediately for responsive UI
    const reorderedSongs = songIds.map(songId =>
      album.songs.find((s: any) => s.id === songId)
    );
    setAlbum({ ...album, songs: reorderedSongs });

    // Update database
    await reorderSongs(album.id, songIds);
    await loadAlbum();
  };

  const handleFileManagerUpload = async (songId: string, type: "audio" | "logic", files: any[]) => {
    for (const file of files) {
      await addFile(songId, {
        name: file.name,
        type,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size,
        externalId: file.externalId ?? undefined,
      });
    }
    setFileManagerOpen(null);
    await loadAlbum();
  };

  const handleFileDelete = async (fileId: string, songId: string) => {
    await deleteFile(fileId, songId);
    await loadAlbum();
  };

  const handleBackgroundUpload = async (songId: string, type: "audio" | "logic", files: File[]) => {
    console.log("AlbumPage: handleBackgroundUpload called", { songId, type, filesCount: files.length });
    // Dynamic import Supabase
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileKey = `${file.name}-${i}`;

      try {
        // Show immediate feedback
        setUploadProgress(prev => ({
          ...prev,
          [songId]: {
            ...(prev[songId] || {}),
            [fileKey]: { progress: 0, status: 'Preparing...', fileName: file.name }
          }
        }));

        // Longer timeout to ensure UI renders before blocking arrayBuffer
        await new Promise(resolve => setTimeout(resolve, 200));

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const basename = file.name
          .replace(`.${ext}`, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueFilename = `${basename}_${timestamp}_${randomStr}.${ext}`;

        const bucketName = type === "logic" ? "Logic-files" : "Audio-files";

        // Convert to bytes
        setUploadProgress(prev => ({
          ...prev,
          [songId]: {
            ...(prev[songId] || {}),
            [fileKey]: { progress: 5, status: 'Reading file...', fileName: file.name }
          }
        }));

        const bytes = await file.arrayBuffer();

        setUploadProgress(prev => ({
          ...prev,
          [songId]: {
            ...(prev[songId] || {}),
            [fileKey]: { progress: 10, status: 'Uploading to storage...', fileName: file.name }
          }
        }));

        // Progress ticker
        let progressValue = 10;
        let tickerActive = true;
        const progressTicker = setInterval(() => {
          if (tickerActive && progressValue < 85) {
            progressValue += 5;
            setUploadProgress(prev => ({
              ...prev,
              [songId]: {
                ...(prev[songId] || {}),
                [fileKey]: { progress: progressValue, status: 'Uploading to storage...', fileName: file.name }
              }
            }));
          }
        }, 5000);

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(uniqueFilename, bytes, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        tickerActive = false;
        clearInterval(progressTicker);

        if (error) throw new Error(error.message);

        setUploadProgress(prev => ({
          ...prev,
          [songId]: {
            ...(prev[songId] || {}),
            [fileKey]: { progress: 90, status: 'Finalizing...', fileName: file.name }
          }
        }));

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniqueFilename);

        setUploadProgress(prev => ({
          ...prev,
          [songId]: {
            ...(prev[songId] || {}),
            [fileKey]: { progress: 100, status: 'Complete!', fileName: file.name }
          }
        }));

        // Save to database
        await addFile(songId, {
          name: file.name,
          type,
          url: urlData.publicUrl,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          externalId: uniqueFilename,
        });

        await loadAlbum();

        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            if (newProgress[songId]) {
              delete newProgress[songId][fileKey];
              if (Object.keys(newProgress[songId]).length === 0) {
                delete newProgress[songId];
              }
            }
            return newProgress;
          });
        }, 2000);

      } catch (err: any) {
        console.error("Upload error:", err);
        setUploadProgress(prev => ({
          ...prev,
          [songId]: {
            ...(prev[songId] || {}),
            [fileKey]: { progress: 0, status: `Failed: ${err.message}`, fileName: file.name }
          }
        }));
      }
    }
  };

  const themeClass = `theme-${currentUser.toLowerCase()}`;

  if (loading || !album) {
    return (
      <div className={`${themeClass} min-h-screen flex items-center justify-center`} style={{ background: 'var(--background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div
      className={`${themeClass} min-h-screen`}
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
    >
      {/* Drag Drop Overlay */}
      <DragDropOverlay isDragging={isDraggingFiles} onDrop={handlePageDrop} />

      {/* File Assignment Modal */}
      {droppedFiles && (
        <FileAssignmentModal
          files={droppedFiles}
          songs={album.songs.map((s: any) => ({ id: s.id, title: s.title }))}
          onAssign={handleFileAssignment}
          onClose={() => setDroppedFiles(null)}
        />
      )}

      {/* File Manager Modal */}
      {fileManagerOpen && (
        <FileManager
          songId={fileManagerOpen.songId}
          songTitle={fileManagerOpen.songTitle}
          type={fileManagerOpen.type}
          files={
            album.songs
              .find((s: any) => s.id === fileManagerOpen.songId)
              ?.files.filter((f: any) => f.type === fileManagerOpen.type) || []
          }
          onUpload={(files) => handleFileManagerUpload(fileManagerOpen.songId, fileManagerOpen.type, files)}
          onDelete={(fileId) => handleFileDelete(fileId, fileManagerOpen.songId)}
          onClose={() => setFileManagerOpen(null)}
          onUploadStart={(files) => {
            // Start background upload and close modal
            handleBackgroundUpload(fileManagerOpen.songId, fileManagerOpen.type, files);
          }}
        />
      )}

      {/* YouTube Player */}
      {youtubePlayer && (
        <YouTubePlayer
          videoId={youtubePlayer.videoId}
          title={youtubePlayer.title}
          onClose={() => setYoutubePlayer(null)}
        />
      )}

      {/* Minimal Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="max-w-[2000px] mx-auto px-4 md:px-8 py-4 md:py-6 md:pr-72">
          <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-4 md:gap-8">
            {/* Left: Back */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link
                href="/"
                className="flex items-center gap-2 transition-opacity hover:opacity-60 text-xs uppercase tracking-[0.2em] font-light"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </Link>
            </div>

            {/* Center: Album Name */}
            <div className="flex flex-col items-center justify-center w-full">
              {editingAlbumName ? (
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  onBlur={handleUpdateAlbumName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateAlbumName();
                    if (e.key === 'Escape') {
                      setEditingAlbumName(false);
                      setAlbumName(album.name);
                    }
                  }}
                  className="text-2xl md:text-3xl font-light tracking-tight text-center border-b bg-transparent focus:outline-none px-2 w-full"
                  style={{ borderColor: 'var(--accent)', color: 'var(--foreground)', fontWeight: 200 }}
                  autoFocus
                />
              ) : (
                <h1
                  className="text-2xl md:text-3xl font-light tracking-tight cursor-pointer hover:opacity-60 transition-opacity"
                  onClick={() => setEditingAlbumName(true)}
                  title="Click to edit"
                  style={{ fontWeight: 200 }}
                >
                  {album.name}
                </h1>
              )}
              <p className="text-xs opacity-40 mt-2 uppercase tracking-wider">
                {album.songs.length} {album.songs.length === 1 ? "track" : "tracks"}
              </p>
            </div>

            {/* Right: Search, Filter, and Actions */}
            <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto flex-wrap">
              {/* Search Input - Compact */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-32 pl-7 pr-2 py-1.5 text-xs font-light bg-transparent border rounded focus:outline-none transition-colors"
                  style={{
                    borderColor: searchQuery ? 'var(--accent)' : 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              {/* Origin Filter - Compact */}
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="px-2 py-1.5 text-xs uppercase tracking-wider font-medium rounded focus:outline-none transition-all"
                style={{
                  background: originFilter === "All" ? 'var(--border)' : getOriginColor(originFilter),
                  color: originFilter === "All" ? 'var(--foreground)' : 'white',
                  border: 'none'
                }}
              >
                <option>All</option>
                <option>Dev +</option>
                <option>Andy +</option>
                <option>Khal +</option>
                <option>Bunnetta Week</option>
                <option>Group Nashville</option>
              </select>

              {/* Clear Filters */}
              {(searchQuery || originFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setOriginFilter("All");
                  }}
                  className="p-1.5 text-xs opacity-40 hover:opacity-100 transition-opacity"
                  title="Clear filters"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-4 opacity-20" style={{ background: 'var(--foreground)' }}></div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowListenMode(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs uppercase tracking-wider font-light transition-opacity"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Headphones className="w-3 h-3" />
                <span className="hidden sm:inline">Listen Mode</span>
                <span className="sm:hidden">Listen</span>
              </button>
              <button
                onClick={handleAddSong}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs uppercase tracking-wider font-light transition-opacity"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Add Track</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[2000px] mx-auto px-4 md:px-8 py-6 md:py-12">
        {album.songs.length === 0 ? (
          <div className="text-center py-16 md:py-32">
            <div className="w-2 h-2 rounded-full mx-auto mb-8 opacity-20" style={{ background: 'var(--accent)' }}></div>
            <p className="text-sm opacity-40 font-light tracking-wide mb-12">No tracks yet</p>
            <button
              onClick={handleAddSong}
              className="text-xs uppercase tracking-[0.2em] font-light transition-opacity"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Add Your First Track
            </button>
          </div>
        ) : getFilteredSongs().length === 0 ? (
          <div className="text-center py-16 md:py-32">
            <div className="w-2 h-2 rounded-full mx-auto mb-8 opacity-20" style={{ background: 'var(--accent)' }}></div>
            <p className="text-sm opacity-40 font-light tracking-wide mb-4">No tracks match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setOriginFilter("All");
              }}
              className="text-xs uppercase tracking-[0.2em] font-light transition-opacity"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-px" style={{ background: 'var(--border)' }}>
            {getFilteredSongs().map((song: any, index: number) => {
              const isDragging = draggedIndex === index;
              const isDropTarget = dragOverIndex === index && draggedIndex !== index;

              return (
              <div
                key={song.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => {
                  handleDragOver(e, index);
                  handleTrackDragOver(e, song.id);
                }}
                onDragLeave={(e) => {
                  handleDragLeave();
                  handleTrackDragLeave(e);
                }}
                onDrop={(e) => {
                  // Check if it's a file drop or song reorder
                  if (e.dataTransfer.types.includes("Files")) {
                    handleTrackDrop(e, song.id);
                  } else {
                    handleDrop(e, index);
                  }
                }}
                onDragEnd={handleDragEnd}
                className="group overflow-hidden transition-all duration-200"
                style={{
                  background: isDragging
                    ? 'var(--highlight)'
                    : isDropTarget || dragOverSongId === song.id
                    ? 'var(--accent)'
                    : 'var(--surface-alt)',
                  opacity: isDragging ? '0.5' : '1',
                  transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  boxShadow: (isDropTarget || dragOverSongId === song.id) ? '0 0 0 2px var(--accent)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (draggedIndex === null) {
                    e.currentTarget.style.background = 'var(--surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggedIndex === null && dragOverIndex !== index) {
                    e.currentTarget.style.background = 'var(--surface-alt)';
                  }
                }}
              >
                {/* Main Track Row */}
                <div className="px-4 md:px-8 py-4 md:py-6 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    {/* Mobile: Track # + Title + Play */}
                    <div className="flex items-center gap-4 md:hidden">
                      <div className="text-xs opacity-30 font-light w-6">{String(index + 1).padStart(2, '0')}</div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={getValue(song.id, "title", song.title)}
                          onChange={(e) => handleUpdateSong(song.id, "title", e.target.value)}
                          onBlur={() => handleBlur(song.id, "title")}
                          className="w-full bg-transparent border-none focus:outline-none font-light text-base tracking-tight"
                          style={{ color: 'var(--foreground)', fontWeight: 300 }}
                          placeholder="Untitled"
                        />
                      </div>
                      {getAudioFile(song) ? (
                        playingSong === song.id ? (
                          <button
                            onClick={() => setPlayingSong(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity flex-shrink-0"
                            style={{ background: 'var(--accent)' }}
                            title="Close player"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setPlayingSong(song.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity flex-shrink-0"
                            style={{ background: 'var(--accent)' }}
                            title="Play"
                          >
                            <Play className="w-3 h-3 text-white ml-0.5" />
                          </button>
                        )
                      ) : (
                        <div className="w-2 h-2 rounded-full opacity-20 flex-shrink-0" style={{ background: 'var(--accent)' }}></div>
                      )}
                      <button
                        onClick={() => handleDeleteSong(song.id, song.title)}
                        className="w-6 h-6 flex items-center justify-center opacity-40 flex-shrink-0"
                        title="Delete track"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Desktop: Track # + Play + Delete */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-xs opacity-30 font-light w-8 text-center">{String(index + 1).padStart(2, '0')}</div>
                      {getAudioFile(song) ? (
                        playingSong === song.id ? (
                          <button
                            onClick={() => setPlayingSong(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity"
                            style={{ background: 'var(--accent)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            title="Close player"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setPlayingSong(song.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity"
                            style={{ background: 'var(--accent)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            title="Play"
                          >
                            <Play className="w-3 h-3 text-white ml-0.5" />
                          </button>
                        )
                      ) : (
                        <div className="w-2 h-2 rounded-full opacity-20" style={{ background: 'var(--accent)' }}></div>
                      )}
                      <button
                        onClick={() => handleDeleteSong(song.id, song.title)}
                        className="w-6 h-6 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-40"
                        title="Delete track"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Desktop: Title */}
                    <div className="hidden md:flex flex-1">
                      <input
                        type="text"
                        value={getValue(song.id, "title", song.title)}
                        onChange={(e) => handleUpdateSong(song.id, "title", e.target.value)}
                        onBlur={() => handleBlur(song.id, "title")}
                        className="w-full bg-transparent border-none focus:outline-none font-light text-lg tracking-tight"
                        style={{ color: 'var(--foreground)', fontWeight: 300 }}
                        placeholder="Untitled"
                      />
                    </div>

                    {/* Mobile + Desktop: Controls Grid */}
                    <div className="grid grid-cols-2 md:flex md:items-start gap-3 md:gap-4 md:flex-wrap lg:flex-nowrap">
                      {/* Status */}
                      <div className="w-full md:w-32">
                        <div className="text-[10px] opacity-30 mb-1 uppercase tracking-wider text-center">
                          Status
                        </div>
                        <select
                          value={song.progress}
                          onChange={(e) => handleUpdateSong(song.id, "progress", e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 text-xs uppercase tracking-wider font-medium rounded focus:outline-none transition-all hover:opacity-90"
                          style={{
                            background: getProgressColor(song.progress),
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          <option>Voice Memo</option>
                          <option>In Progress</option>
                          <option>Recording</option>
                          <option>Mixing</option>
                          <option>Mastering</option>
                          <option>Complete</option>
                        </select>
                      </div>

                      {/* Origin */}
                      <div className="w-full md:w-32">
                        <div className="text-[10px] opacity-30 mb-1 uppercase tracking-wider text-center">
                          Origin
                        </div>
                        <select
                          value={song.origin || "Group Nashville"}
                          onChange={(e) => handleUpdateSong(song.id, "origin", e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 text-xs uppercase tracking-wider font-medium rounded focus:outline-none transition-all hover:opacity-90"
                          style={{
                            background: getOriginColor(song.origin || "Group Nashville"),
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          <option>Dev +</option>
                          <option>Andy +</option>
                          <option>Khal +</option>
                          <option>Bunnetta Week</option>
                          <option>Group Nashville</option>
                        </select>
                      </div>

                      {/* Logic File */}
                      <div className="w-full md:w-28">
                        <div className="text-[10px] opacity-30 mb-1 uppercase tracking-wider text-center">
                          Logic
                        </div>
                        <button
                          onClick={() => setFileManagerOpen({ songId: song.id, type: "logic", songTitle: song.title })}
                          className="w-full px-2 md:px-3 py-1.5 text-xs uppercase tracking-wider font-light transition-opacity hover:opacity-80"
                          style={{ background: getLogicFile(song) ? 'var(--accent)' : 'var(--border)', color: getLogicFile(song) ? 'white' : 'var(--foreground)' }}
                        >
                          {getLogicFile(song) ? `${song.files.filter((f: any) => f.type === "logic").length} Files` : 'Upload'}
                        </button>
                      </div>

                      {/* Audio Bounce */}
                      <div className="w-full md:w-28">
                        <div className="text-[10px] opacity-30 mb-1 uppercase tracking-wider text-center">
                          Audio
                        </div>
                        <button
                          onClick={() => setFileManagerOpen({ songId: song.id, type: "audio", songTitle: song.title })}
                          className="w-full px-2 md:px-3 py-1.5 text-xs uppercase tracking-wider font-light transition-opacity hover:opacity-80"
                          style={{ background: getAudioFile(song) ? 'var(--accent)' : 'var(--border)', color: getAudioFile(song) ? 'white' : 'var(--foreground)' }}
                        >
                          {getAudioFile(song) ? `${song.files.filter((f: any) => f.type === "audio").length} Files` : 'Upload'}
                        </button>
                      </div>

                      {/* Version History */}
                      <div className="w-full md:w-32">
                        <div className="text-[10px] opacity-30 mb-1 uppercase tracking-wider text-center">
                          History
                        </div>
                        <VersionHistory
                          songId={song.id}
                          songTitle={song.title}
                          versions={song.versions || []}
                          onRestore={loadAlbum}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress (all devices) */}
                  {uploadProgress[song.id] && Object.keys(uploadProgress[song.id]).length > 0 && (
                    <div className="mt-3 space-y-1 px-0.5">
                      {Object.entries(uploadProgress[song.id]).map(([fileKey, { progress, status, fileName }]) => (
                        <div key={fileKey} className="text-[9px]">
                          <div className="flex items-center justify-between mb-0.5 px-0.5">
                            <span className="opacity-60 truncate max-w-[150px] md:max-w-[70px]" title={fileName}>{fileName}</span>
                            <span className="opacity-40 text-[8px]">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full h-0.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${Math.max(progress, 5)}%`,
                                background: 'var(--accent)'
                              }}
                            />
                          </div>
                          <div className="opacity-30 mt-0.5 px-0.5 text-[8px]">{status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audio Player */}
                {playingSong === song.id && getAudioFile(song) && (
                  <div className="px-4 md:px-8 py-4 border-b" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                    <WaveformPlayer
                      url={getAudioFile(song).url}
                      filename={getAudioFile(song).name}
                      autoplay={true}
                    />
                  </div>
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-px p-px" style={{ background: 'var(--border)' }}>
                  {/* Notes */}
                  <div className="p-4 md:p-6" style={{ background: 'var(--background)' }}>
                    <label className="block text-xs opacity-30 uppercase tracking-[0.2em] font-light mb-4">
                      Notes
                    </label>
                    <textarea
                      value={getValue(song.id, "notes", song.notes)}
                      onChange={(e) => handleUpdateSong(song.id, "notes", e.target.value)}
                      onBlur={() => handleBlur(song.id, "notes")}
                      placeholder="..."
                      className="w-full h-32 md:h-40 text-sm font-light bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>

                  {/* Lyrics */}
                  <div className="p-4 md:p-6" style={{ background: 'var(--background)' }}>
                    <label className="block text-xs opacity-30 uppercase tracking-[0.2em] font-light mb-4">
                      Lyrics
                    </label>
                    <textarea
                      value={getValue(song.id, "lyrics", song.lyrics)}
                      onChange={(e) => handleUpdateSong(song.id, "lyrics", e.target.value)}
                      onBlur={() => handleBlur(song.id, "lyrics")}
                      placeholder="..."
                      className="w-full h-32 md:h-40 text-sm font-light bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>

                  {/* References */}
                  <div className="p-4 md:p-6" style={{ background: 'var(--background)' }}>
                    <label className="block text-xs opacity-30 mb-4 uppercase tracking-[0.2em] font-light">
                      References
                    </label>
                    <div className="space-y-px max-h-40 overflow-y-auto">
                      {song.references.map((ref: any) => (
                        <div
                          key={ref.id}
                          className="flex items-center gap-3 py-2 group/ref"
                        >
                          {ref.thumbnail && (
                            <img src={ref.thumbnail} alt={ref.title} className="w-6 h-6 object-cover flex-shrink-0 opacity-60" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-light truncate opacity-80">{ref.title}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs opacity-40 truncate">{ref.artist}</div>
                              {ref.user && (
                                <span className="text-[10px] opacity-30">• {ref.user}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover/ref:opacity-60">
                            {ref.type === "youtube" && (
                              <button
                                onClick={() => {
                                  // Extract video ID from YouTube URL
                                  const patterns = [
                                    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
                                    /youtube\.com\/embed\/([^&\s]+)/,
                                    /youtube\.com\/v\/([^&\s]+)/
                                  ];
                                  let videoId = "";
                                  for (const pattern of patterns) {
                                    const match = ref.url.match(pattern);
                                    if (match) {
                                      videoId = match[1];
                                      break;
                                    }
                                  }
                                  if (videoId) {
                                    setPlayingSong(null); // Pause any playing waveform
                                    setYoutubePlayer({ videoId, title: ref.title });
                                  }
                                }}
                                className="transition-opacity hover:opacity-100"
                                title="Play"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="transition-opacity hover:opacity-100"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleDeleteReference(ref.id)}
                              className="transition-opacity hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Reference */}
                      {showRefSearch === song.id ? (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                          <div className="mb-2 text-xs opacity-30 uppercase tracking-wider">
                            Search YouTube
                          </div>
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              value={refSearchQuery}
                              onChange={(e) => setRefSearchQuery(e.target.value)}
                              placeholder="Search for artist or song..."
                              className="flex-1 px-3 py-1.5 text-xs font-light border-b bg-transparent focus:outline-none"
                              style={{ borderColor: 'var(--border)' }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSearchReferences();
                                }
                                if (e.key === "Escape") {
                                  setShowRefSearch(null);
                                  setRefSearchQuery("");
                                  setRefSearchResults([]);
                                }
                              }}
                            />
                            <button
                              onClick={handleSearchReferences}
                              disabled={searchingRefs || !refSearchQuery.trim()}
                              className="text-xs uppercase tracking-wider font-light transition-opacity opacity-60 hover:opacity-100 disabled:opacity-30"
                            >
                              {searchingRefs ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
                            </button>
                          </div>

                          {refSearchResults.length > 0 ? (
                            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                              {refSearchResults.map((result, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 py-1 group/result"
                                >
                                  {result.thumbnail && (
                                    <img src={result.thumbnail} alt={result.title} className="w-6 h-6 object-cover opacity-60" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-light truncate">{result.title}</div>
                                    <div className="text-xs opacity-40 truncate">{result.artist}</div>
                                  </div>
                                  <button
                                    onClick={() => handleAddReference(song.id, result)}
                                    className="text-xs uppercase tracking-wider font-light opacity-0 group-hover/result:opacity-60 hover:opacity-100 transition-opacity"
                                  >
                                    Add
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : searchingRefs ? null : refSearchQuery && refSearchResults.length === 0 ? (
                            <div className="mb-3 py-2 text-xs opacity-40">
                              No results found. Try a different search.
                            </div>
                          ) : null}

                          <button
                            onClick={() => {
                              setShowRefSearch(null);
                              setRefSearchQuery("");
                              setRefSearchResults([]);
                            }}
                            className="text-xs uppercase tracking-wider font-light opacity-30 hover:opacity-100 transition-opacity"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRefSearch(song.id)}
                          className="mt-4 w-full py-2 text-xs uppercase tracking-wider font-light opacity-30 hover:opacity-100 transition-opacity"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="p-4 md:p-6" style={{ background: 'var(--background)' }}>
                    <label className="block text-xs opacity-30 mb-4 uppercase tracking-[0.2em] font-light">
                      Comments
                    </label>
                    <div className="space-y-3 max-h-32 overflow-y-auto mb-4">
                      {song.comments.map((comment: any) => (
                        <div key={comment.id} className="group/comment flex gap-3 text-xs">
                          {editingComment === comment.id ? (
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <select
                                  value={editingCommentUser}
                                  onChange={(e) => setEditingCommentUser(e.target.value)}
                                  className="px-2 py-1 text-xs font-light border-b bg-transparent focus:outline-none"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  <option value="Dev">Dev</option>
                                  <option value="Andy">Andy</option>
                                  <option value="Khal">Khal</option>
                                </select>
                              </div>
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs font-light border bg-transparent focus:outline-none resize-none"
                                style={{ borderColor: 'var(--border)' }}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateComment(comment.id)}
                                  className="text-xs uppercase tracking-wider font-light opacity-60 hover:opacity-100 transition-opacity"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingComment(null)}
                                  className="text-xs uppercase tracking-wider font-light opacity-30 hover:opacity-100 transition-opacity"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-light flex-shrink-0 opacity-60" style={{ background: 'var(--highlight)' }}>
                                {comment.user[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="font-light opacity-80">{comment.user}</span>
                                  <span className="opacity-30 text-[10px]">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                  <div className="flex gap-2 ml-auto opacity-0 group-hover/comment:opacity-40">
                                    <button
                                      onClick={() => handleStartEditComment(comment)}
                                      className="hover:opacity-100 transition-opacity"
                                      title="Edit"
                                    >
                                      <span className="text-[10px]">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="hover:opacity-100 transition-opacity"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="font-light opacity-60 leading-relaxed">
                                  {comment.text}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[song.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [song.id]: e.target.value })}
                        placeholder="..."
                        className="flex-1 px-3 py-1.5 text-xs font-light border-b bg-transparent focus:outline-none"
                        style={{ borderColor: 'var(--border)' }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(song.id);
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(song.id)}
                        className="text-xs uppercase tracking-wider font-light transition-opacity opacity-60 hover:opacity-100"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

      </div>

      {/* Listen Mode */}
      <ListenMode
        isOpen={showListenMode}
        onClose={() => setShowListenMode(false)}
        audioFiles={getAudioFiles()}
        onReorder={handleReorderFromListenMode}
      />
    </div>
  );
}
