"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Plus,
  Music,
  FileAudio,
  FileText,
  Play,
  Pause,
  Upload,
  MessageSquare,
  ExternalLink,
  Youtube,
  Trash2,
  MoreVertical
} from "lucide-react";
import Link from "next/link";

interface Song {
  id: string;
  title: string;
  logicFile?: string;
  audioFile?: string;
  lyrics: string;
  notes: string;
  progress: string;
  references: Reference[];
  comments: Comment[];
  versions: Version[];
  createdAt: string;
  updatedAt: string;
}

interface Reference {
  id: string;
  type: "spotify" | "youtube";
  title: string;
  artist: string;
  url: string;
  thumbnail?: string;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface Version {
  id: string;
  timestamp: string;
  changes: string;
  comment: string;
  user: string;
}

interface Album {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  songCount: number;
}

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{songId: string, field: string} | null>(null);
  const [showRefSearch, setShowRefSearch] = useState<string | null>(null);
  const [refSearchQuery, setRefSearchQuery] = useState("");
  const [refSearchType, setRefSearchType] = useState<"spotify" | "youtube">("spotify");
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState<string | null>(null);

  useEffect(() => {
    const albums = JSON.parse(localStorage.getItem("albums") || "[]");
    const currentAlbum = albums.find((a: Album) => a.id === resolvedParams.id);
    setAlbum(currentAlbum);

    const storedSongs = JSON.parse(localStorage.getItem(`songs_${resolvedParams.id}`) || "[]");
    setSongs(storedSongs);
  }, [resolvedParams.id]);

  const addSong = () => {
    const newSong: Song = {
      id: Date.now().toString(),
      title: "Untitled",
      lyrics: "",
      notes: "",
      progress: "Not Started",
      references: [],
      comments: [],
      versions: [{
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        changes: "Song created",
        comment: "Initial creation",
        user: "User"
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedSongs = [...songs, newSong];
    setSongs(updatedSongs);
    localStorage.setItem(`songs_${resolvedParams.id}`, JSON.stringify(updatedSongs));

    const albums = JSON.parse(localStorage.getItem("albums") || "[]");
    const albumIndex = albums.findIndex((a: Album) => a.id === resolvedParams.id);
    if (albumIndex !== -1) {
      albums[albumIndex].songCount = updatedSongs.length;
      albums[albumIndex].updatedAt = new Date().toISOString();
      localStorage.setItem("albums", JSON.stringify(albums));
      setAlbum(albums[albumIndex]);
    }
  };

  const updateSong = (songId: string, field: keyof Song, value: any) => {
    const updatedSongs = songs.map(song => {
      if (song.id === songId) {
        const updatedSong = { ...song, [field]: value, updatedAt: new Date().toISOString() };

        const newVersion: Version = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          changes: `Updated ${field}`,
          comment: "",
          user: "User"
        };
        updatedSong.versions = [...song.versions, newVersion];

        return updatedSong;
      }
      return song;
    });

    setSongs(updatedSongs);
    localStorage.setItem(`songs_${resolvedParams.id}`, JSON.stringify(updatedSongs));
  };

  const handleFileUpload = (songId: string, file: File, type: "logic" | "audio") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const fileData = {
          name: file.name,
          data: result as string,
          type: file.type,
        };
        const field = type === "logic" ? "logicFile" : "audioFile";
        updateSong(songId, field, JSON.stringify(fileData));
      }
    };
    if (type === "audio") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const addReference = (songId: string, ref: Omit<Reference, "id">) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const newRef: Reference = { ...ref, id: Date.now().toString() };
    const updatedReferences = [...song.references, newRef];
    updateSong(songId, "references", updatedReferences);
    setShowRefSearch(null);
    setRefSearchQuery("");
  };

  const removeReference = (songId: string, refId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const updatedReferences = song.references.filter(r => r.id !== refId);
    updateSong(songId, "references", updatedReferences);
  };

  const addComment = (songId: string) => {
    if (!commentText.trim()) return;

    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: "User",
      text: commentText,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...song.comments, newComment];
    updateSong(songId, "comments", updatedComments);
    setCommentText("");
  };

  const getFileData = (fileString?: string) => {
    if (!fileString) return null;
    try {
      return JSON.parse(fileString);
    } catch {
      return { name: fileString };
    }
  };

  if (!album) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{album.name}</h1>
                <p className="text-sm text-neutral-500">
                  {songs.length} {songs.length === 1 ? "track" : "tracks"}
                </p>
              </div>
            </div>
            <button
              onClick={addSong}
              className="flex items-center gap-2 px-4 py-2 bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white rounded-lg font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Track
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {songs.length === 0 ? (
          <div className="text-center py-24">
            <Music className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 mb-6">No tracks yet</p>
            <button
              onClick={addSong}
              className="px-6 py-3 bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white rounded-lg font-medium"
            >
              Add Your First Track
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:shadow-sm"
              >
                {/* Main Row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Track Number */}
                  <div className="w-8 text-center text-sm text-neutral-400 font-medium">
                    {index + 1}
                  </div>

                  {/* Play Button & Audio */}
                  <div className="w-10">
                    {song.audioFile && getFileData(song.audioFile)?.data ? (
                      <button
                        onClick={() => setPlayingSong(playingSong === song.id ? null : song.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white"
                      >
                        {playingSong === song.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <Music className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={song.title}
                      onChange={(e) => updateSong(song.id, "title", e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                      placeholder="Track title"
                    />
                  </div>

                  {/* Progress */}
                  <div className="w-36">
                    <select
                      value={song.progress}
                      onChange={(e) => updateSong(song.id, "progress", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d]"
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Recording</option>
                      <option>Mixing</option>
                      <option>Mastering</option>
                      <option>Complete</option>
                    </select>
                  </div>

                  {/* Files */}
                  <div className="flex items-center gap-2">
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept=".logic,.logicx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(song.id, file, "logic");
                        }}
                        className="hidden"
                      />
                      <div className={`p-2 rounded-lg ${song.logicFile ? 'bg-[#e8d4c0] dark:bg-[#7a6a5a] dark:bg-indigo-900/30 text-[#8b7355] dark:text-[#a0866d] dark:text-[#a0866d] dark:text-[#b89b80]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept=".wav,.mp3,.aiff"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(song.id, file, "audio");
                        }}
                        className="hidden"
                      />
                      <div className={`p-2 rounded-lg ${song.audioFile ? 'bg-[#e8d4c0] dark:bg-[#7a6a5a] dark:bg-indigo-900/30 text-[#8b7355] dark:text-[#a0866d] dark:text-[#a0866d] dark:text-[#b89b80]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600'}`}>
                        <FileAudio className="w-4 h-4" />
                      </div>
                    </label>
                  </div>

                  {/* Comments */}
                  <button
                    onClick={() => setShowComments(showComments === song.id ? null : song.id)}
                    className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {song.comments.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs bg-[#8b7355] dark:bg-[#a0866d] text-white rounded-full">
                        {song.comments.length}
                      </span>
                    )}
                  </button>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedSong(expandedSong === song.id ? null : song.id)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedSong === song.id && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 bg-neutral-50 dark:bg-neutral-950">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Lyrics */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">LYRICS</label>
                        <textarea
                          value={song.lyrics}
                          onChange={(e) => updateSong(song.id, "lyrics", e.target.value)}
                          placeholder="Enter lyrics..."
                          className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d] resize-none"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">NOTES</label>
                        <textarea
                          value={song.notes}
                          onChange={(e) => updateSong(song.id, "notes", e.target.value)}
                          placeholder="Production notes, ideas..."
                          className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d] resize-none"
                        />
                      </div>

                      {/* References */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">REFERENCES</label>
                        <div className="space-y-2">
                          {song.references.map((ref) => (
                            <div
                              key={ref.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 group/ref"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {ref.type === "spotify" ? (
                                  <Music className="w-4 h-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Youtube className="w-4 h-4 text-red-600 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">{ref.title}</div>
                                  <div className="text-xs text-neutral-500 truncate">{ref.artist}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                  onClick={() => removeReference(song.id, ref.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded opacity-0 group-hover/ref:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add Reference */}
                          {showRefSearch === song.id ? (
                            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border-2 border-[#8b7355] dark:border-[#a0866d]">
                              <div className="flex gap-2 mb-2">
                                <button
                                  onClick={() => setRefSearchType("spotify")}
                                  className={`flex-1 py-1.5 px-3 text-xs rounded ${refSearchType === "spotify" ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                                >
                                  Spotify
                                </button>
                                <button
                                  onClick={() => setRefSearchType("youtube")}
                                  className={`flex-1 py-1.5 px-3 text-xs rounded ${refSearchType === "youtube" ? 'bg-red-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                                >
                                  YouTube
                                </button>
                              </div>
                              <input
                                type="text"
                                value={refSearchQuery}
                                onChange={(e) => setRefSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full px-3 py-2 text-sm rounded border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d] mb-2"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && refSearchQuery.trim()) {
                                    addReference(song.id, {
                                      type: refSearchType,
                                      title: refSearchQuery,
                                      artist: "Artist",
                                      url: refSearchType === "spotify"
                                        ? `https://open.spotify.com/search/${encodeURIComponent(refSearchQuery)}`
                                        : `https://www.youtube.com/results?search_query=${encodeURIComponent(refSearchQuery)}`
                                    });
                                  }
                                  if (e.key === "Escape") {
                                    setShowRefSearch(null);
                                    setRefSearchQuery("");
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (refSearchQuery.trim()) {
                                      addReference(song.id, {
                                        type: refSearchType,
                                        title: refSearchQuery,
                                        artist: "Artist",
                                        url: refSearchType === "spotify"
                                          ? `https://open.spotify.com/search/${encodeURIComponent(refSearchQuery)}`
                                          : `https://www.youtube.com/results?search_query=${encodeURIComponent(refSearchQuery)}`
                                      });
                                    }
                                  }}
                                  className="flex-1 py-1.5 px-3 text-xs bg-[#8b7355] dark:bg-[#a0866d] text-white rounded hover:bg-[#a0866d] dark:hover:bg-[#b89b80]"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRefSearch(null);
                                    setRefSearchQuery("");
                                  }}
                                  className="px-3 py-1.5 text-xs rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowRefSearch(song.id)}
                              className="w-full py-2 px-3 text-sm border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[#8b7355] dark:border-[#a0866d] hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            >
                              + Add Reference
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {showComments === song.id && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 bg-neutral-50 dark:bg-neutral-950">
                    <label className="block text-xs font-medium text-neutral-500 mb-3">COMMENTS</label>
                    <div className="space-y-3 mb-3">
                      {song.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e8d4c0] dark:bg-[#7a6a5a] dark:bg-indigo-900/30 flex items-center justify-center text-xs font-medium text-[#8b7355] dark:text-[#a0866d] dark:text-[#a0866d] dark:text-[#b89b80] flex-shrink-0">
                            {comment.user[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium">{comment.user}</span>
                              <span className="text-xs text-neutral-500">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addComment(song.id);
                        }}
                      />
                      <button
                        onClick={() => addComment(song.id)}
                        className="px-4 py-2 bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white text-sm rounded-lg font-medium"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
