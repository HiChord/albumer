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
  MessageSquare,
  ExternalLink,
  Youtube,
  Trash2,
  MoreVertical,
  Loader2
} from "lucide-react";
import Link from "next/link";
import {
  getAlbum,
  createSong,
  updateSong,
  addReference,
  deleteReference,
  addComment,
  searchSpotify,
  searchYouTube,
  addFile
} from "@/lib/actions";

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [album, setAlbum] = useState<any>(null);
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [showRefSearch, setShowRefSearch] = useState<string | null>(null);
  const [refSearchQuery, setRefSearchQuery] = useState("");
  const [refSearchType, setRefSearchType] = useState<"spotify" | "youtube">("spotify");
  const [refSearchResults, setRefSearchResults] = useState<any[]>([]);
  const [searchingRefs, setSearchingRefs] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbum();
  }, [resolvedParams.id]);

  const loadAlbum = async () => {
    setLoading(true);
    const data = await getAlbum(resolvedParams.id);
    setAlbum(data);
    setLoading(false);
  };

  const handleAddSong = async () => {
    await createSong(resolvedParams.id);
    await loadAlbum();
  };

  const handleUpdateSong = async (songId: string, field: string, value: any) => {
    await updateSong(songId, { [field]: value });
    await loadAlbum();
  };

  const handleSearchReferences = async () => {
    if (!refSearchQuery.trim()) return;

    setSearchingRefs(true);
    if (refSearchType === "spotify") {
      const results = await searchSpotify(refSearchQuery);
      setRefSearchResults(results.tracks || []);
    } else {
      const results = await searchYouTube(refSearchQuery);
      setRefSearchResults(results.videos || []);
    }
    setSearchingRefs(false);
  };

  const handleAddReference = async (songId: string, ref: any) => {
    await addReference(songId, {
      type: refSearchType,
      ...ref
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
    if (!commentText.trim()) return;

    await addComment(songId, {
      user: "User",
      text: commentText
    });
    await loadAlbum();
    setCommentText("");
  };

  const getAudioFile = (song: any) => {
    return song.files?.find((f: any) => f.type === "audio");
  };

  const getLogicFile = (song: any) => {
    return song.files?.find((f: any) => f.type === "logic");
  };

  const handleFileUpload = async (songId: string, file: File, type: "audio" | "logic") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("songId", songId);
    formData.append("type", type);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (!data.file) {
        throw new Error("Upload response missing file");
      }

      await addFile(songId, {
        name: data.file.name,
        type,
        url: data.file.url,
        mimeType: data.file.mimeType ?? file.type,
        size: data.file.size ?? file.size,
        externalId: data.file.externalId ?? undefined,
      });
      await loadAlbum();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  if (loading || !album) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8b7355] dark:text-[#a0866d]" />
      </div>
    );
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
                  {album.songs.length} {album.songs.length === 1 ? "track" : "tracks"}
                </p>
              </div>
            </div>
            <button
              onClick={handleAddSong}
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
        {album.songs.length === 0 ? (
          <div className="text-center py-24">
            <Music className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 mb-6">No tracks yet</p>
            <button
              onClick={handleAddSong}
              className="px-6 py-3 bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white rounded-lg font-medium"
            >
              Add Your First Track
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {album.songs.map((song: any, index: number) => (
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
                    {getAudioFile(song) ? (
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
                      onChange={(e) => handleUpdateSong(song.id, "title", e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                      placeholder="Track title"
                    />
                  </div>

                  {/* Progress */}
                  <div className="w-36">
                    <select
                      value={song.progress}
                      onChange={(e) => handleUpdateSong(song.id, "progress", e.target.value)}
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
                    <label className={`${getLogicFile(song) ? 'bg-[#e8d4c0] dark:bg-[#7a6a5a] text-[#8b7355] dark:text-[#a0866d]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600'} p-2 rounded-lg h-8 w-8 flex items-center justify-center cursor-pointer`}>
                      <FileText className="w-4 h-4" />
                      <input
                        type="file"
                        accept=".logicx,.logic"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(song.id, file, "logic");
                        }}
                      />
                    </label>
                    <label className={`${getAudioFile(song) ? 'bg-[#e8d4c0] dark:bg-[#7a6a5a] text-[#8b7355] dark:text-[#a0866d]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600'} p-2 rounded-lg h-8 w-8 flex items-center justify-center cursor-pointer`}>
                      <FileAudio className="w-4 h-4" />
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(song.id, file, "audio");
                        }}
                      />
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

                {/* Audio Player */}
                {playingSong === song.id && getAudioFile(song) && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-neutral-50 dark:bg-neutral-950">
                    <audio src={getAudioFile(song).url} controls className="w-full" />
                  </div>
                )}

                {/* Expanded Details */}
                {expandedSong === song.id && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 bg-neutral-50 dark:bg-neutral-950">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Lyrics */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">LYRICS</label>
                        <textarea
                          value={song.lyrics}
                          onChange={(e) => handleUpdateSong(song.id, "lyrics", e.target.value)}
                          placeholder="Enter lyrics..."
                          className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d] resize-none"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">NOTES</label>
                        <textarea
                          value={song.notes}
                          onChange={(e) => handleUpdateSong(song.id, "notes", e.target.value)}
                          placeholder="Production notes, ideas..."
                          className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d] resize-none"
                        />
                      </div>

                      {/* References */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-neutral-500 mb-2">REFERENCES</label>
                        <div className="space-y-2">
                          {song.references.map((ref: any) => (
                            <div
                              key={ref.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 group/ref"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {ref.thumbnail && (
                                  <img src={ref.thumbnail} alt={ref.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                )}
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
                                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleDeleteReference(ref.id)}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded opacity-0 group-hover/ref:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add Reference */}
                          {showRefSearch === song.id ? (
                            <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border-2 border-[#8b7355] dark:border-[#a0866d]">
                              <div className="flex gap-2 mb-3">
                                <button
                                  onClick={() => {
                                    setRefSearchType("spotify");
                                    setRefSearchResults([]);
                                  }}
                                  className={`flex-1 py-2 px-4 text-sm rounded ${refSearchType === "spotify" ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                                >
                                  Spotify
                                </button>
                                <button
                                  onClick={() => {
                                    setRefSearchType("youtube");
                                    setRefSearchResults([]);
                                  }}
                                  className={`flex-1 py-2 px-4 text-sm rounded ${refSearchType === "youtube" ? 'bg-red-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                                >
                                  YouTube
                                </button>
                              </div>
                              <div className="flex gap-2 mb-3">
                                <input
                                  type="text"
                                  value={refSearchQuery}
                                  onChange={(e) => setRefSearchQuery(e.target.value)}
                                  placeholder="Search..."
                                  className="flex-1 px-3 py-2 text-sm rounded border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:border-[#8b7355] dark:border-[#a0866d]"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearchReferences();
                                    if (e.key === "Escape") {
                                      setShowRefSearch(null);
                                      setRefSearchQuery("");
                                      setRefSearchResults([]);
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleSearchReferences}
                                  disabled={searchingRefs}
                                  className="px-4 py-2 bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white text-sm rounded disabled:opacity-50"
                                >
                                  {searchingRefs ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                                </button>
                              </div>

                              {refSearchResults.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {refSearchResults.map((result, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-3 p-2 rounded bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                                    >
                                      {result.thumbnail && (
                                        <img src={result.thumbnail} alt={result.title} className="w-12 h-12 rounded object-cover" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{result.title}</div>
                                        <div className="text-xs text-neutral-500 truncate">{result.artist}</div>
                                      </div>
                                      <button
                                        onClick={() => handleAddReference(song.id, result)}
                                        className="px-3 py-1 bg-[#8b7355] dark:bg-[#a0866d] hover:bg-[#a0866d] dark:hover:bg-[#b89b80] text-white text-xs rounded"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  setShowRefSearch(null);
                                  setRefSearchQuery("");
                                  setRefSearchResults([]);
                                }}
                                className="w-full py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowRefSearch(song.id)}
                              className="w-full py-3 px-3 text-sm border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-[#8b7355] dark:border-[#a0866d] hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            >
                              + Add Reference Track
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
                      {song.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e8d4c0] dark:bg-[#7a6a5a] dark:bg-indigo-900/30 flex items-center justify-center text-xs font-medium text-[#8b7355] dark:text-[#a0866d] dark:text-[#a0866d] dark:text-[#b89b80] flex-shrink-0">
                            {comment.user[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium">{comment.user}</span>
                              <span className="text-xs text-neutral-500">
                                {new Date(comment.createdAt).toLocaleString()}
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
                          if (e.key === "Enter") handleAddComment(song.id);
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(song.id)}
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
