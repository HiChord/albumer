"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Plus,
  Music,
  Play,
  Pause,
  Loader2,
  ExternalLink,
  Youtube,
  Trash2
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
import { UploadButton } from "@/lib/uploadthing";

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [album, setAlbum] = useState<any>(null);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [showRefSearch, setShowRefSearch] = useState<string | null>(null);
  const [refSearchQuery, setRefSearchQuery] = useState("");
  const [refSearchType, setRefSearchType] = useState<"spotify" | "youtube">("spotify");
  const [refSearchResults, setRefSearchResults] = useState<any[]>([]);
  const [searchingRefs, setSearchingRefs] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
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
    if (!commentText[songId]?.trim()) return;

    await addComment(songId, {
      user: "User",
      text: commentText[songId]
    });
    await loadAlbum();
    setCommentText({ ...commentText, [songId]: "" });
  };

  const getAudioFile = (song: any) => {
    return song.files?.find((f: any) => f.type === "audio");
  };

  const getLogicFile = (song: any) => {
    return song.files?.find((f: any) => f.type === "logic");
  };

  if (loading || !album) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Track
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[2000px] mx-auto px-6 py-6">
        {album.songs.length === 0 ? (
          <div className="text-center py-24">
            <Music className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 mb-6">No tracks yet</p>
            <button
              onClick={handleAddSong}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Add Your First Track
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {album.songs.map((song: any, index: number) => (
              <div
                key={song.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden"
              >
                {/* Main Track Row */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                  {/* Track # */}
                  <div className="w-8 text-center">
                    <div className="text-xs text-neutral-400 mb-1">#</div>
                    <div className="text-sm font-medium">{index + 1}</div>
                  </div>

                  {/* Play */}
                  <div className="w-12">
                    <div className="text-xs text-neutral-400 mb-1 text-center">Play</div>
                    {getAudioFile(song) ? (
                      <button
                        onClick={() => setPlayingSong(playingSong === song.id ? null : song.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white mx-auto"
                      >
                        {playingSong === song.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mx-auto">
                        <Music className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-xs text-neutral-400 mb-1">Track Title</div>
                    <input
                      type="text"
                      value={song.title}
                      onChange={(e) => handleUpdateSong(song.id, "title", e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                      placeholder="Track title"
                    />
                  </div>

                  {/* Progress */}
                  <div className="w-40">
                    <div className="text-xs text-neutral-400 mb-1">Status</div>
                    <select
                      value={song.progress}
                      onChange={(e) => handleUpdateSong(song.id, "progress", e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:border-indigo-500"
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Recording</option>
                      <option>Mixing</option>
                      <option>Mastering</option>
                      <option>Complete</option>
                    </select>
                  </div>

                  {/* Logic File */}
                  <div className="w-28">
                    <div className="text-xs text-neutral-400 mb-1 text-center">Logic File</div>
                    <UploadButton
                      endpoint="logicUploader"
                      onClientUploadComplete={async (res) => {
                        if (res?.[0]) {
                          await addFile(song.id, {
                            name: res[0].name,
                            type: "logic",
                            url: res[0].url,
                            mimeType: res[0].type,
                            size: res[0].size,
                          });
                          await loadAlbum();
                        }
                      }}
                      appearance={{
                        button: `w-full ${getLogicFile(song) ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'} px-3 py-2 rounded-lg text-xs font-medium transition-colors`,
                        allowedContent: "hidden"
                      }}
                      content={{
                        button: getLogicFile(song) ? "✓ Uploaded" : "Upload"
                      }}
                    />
                  </div>

                  {/* Audio Bounce */}
                  <div className="w-28">
                    <div className="text-xs text-neutral-400 mb-1 text-center">Bounce</div>
                    <UploadButton
                      endpoint="audioUploader"
                      onClientUploadComplete={async (res) => {
                        if (res?.[0]) {
                          await addFile(song.id, {
                            name: res[0].name,
                            type: "audio",
                            url: res[0].url,
                            mimeType: res[0].type,
                            size: res[0].size,
                          });
                          await loadAlbum();
                        }
                      }}
                      appearance={{
                        button: `w-full ${getAudioFile(song) ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'} px-3 py-2 rounded-lg text-xs font-medium transition-colors`,
                        allowedContent: "hidden"
                      }}
                      content={{
                        button: getAudioFile(song) ? "✓ Uploaded" : "Upload"
                      }}
                    />
                  </div>
                </div>

                {/* Audio Player */}
                {playingSong === song.id && getAudioFile(song) && (
                  <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800">
                    <audio src={getAudioFile(song).url} controls className="w-full" autoPlay />
                  </div>
                )}

                {/* Always Visible Content Grid */}
                <div className="grid grid-cols-4 gap-4 p-4">
                  {/* Notes (swapped with Lyrics) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                      Notes
                    </label>
                    <textarea
                      value={song.notes}
                      onChange={(e) => handleUpdateSong(song.id, "notes", e.target.value)}
                      placeholder="Production notes, ideas..."
                      className="w-full h-40 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Lyrics (swapped with Notes) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                      Lyrics
                    </label>
                    <textarea
                      value={song.lyrics}
                      onChange={(e) => handleUpdateSong(song.id, "lyrics", e.target.value)}
                      placeholder="Enter lyrics..."
                      className="w-full h-40 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* References */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                      References
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {song.references.map((ref: any) => (
                        <div
                          key={ref.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 group/ref"
                        >
                          {ref.thumbnail && (
                            <img src={ref.thumbnail} alt={ref.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          {ref.type === "spotify" ? (
                            <Music className="w-3 h-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <Youtube className="w-3 h-3 text-red-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{ref.title}</div>
                            <div className="text-xs text-neutral-500 truncate">{ref.artist}</div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/ref:opacity-100">
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleDeleteReference(ref.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Reference Inline */}
                      {showRefSearch === song.id ? (
                        <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border-2 border-indigo-500">
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => {
                                setRefSearchType("spotify");
                                setRefSearchResults([]);
                              }}
                              className={`flex-1 py-1 px-2 text-xs rounded ${refSearchType === "spotify" ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                            >
                              Spotify
                            </button>
                            <button
                              onClick={() => {
                                setRefSearchType("youtube");
                                setRefSearchResults([]);
                              }}
                              className={`flex-1 py-1 px-2 text-xs rounded ${refSearchType === "youtube" ? 'bg-red-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                            >
                              YouTube
                            </button>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={refSearchQuery}
                              onChange={(e) => setRefSearchQuery(e.target.value)}
                              placeholder="Search..."
                              className="flex-1 px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:border-indigo-500"
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
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded disabled:opacity-50"
                            >
                              {searchingRefs ? <Loader2 className="w-3 h-3 animate-spin" /> : "Go"}
                            </button>
                          </div>

                          {refSearchResults.length > 0 && (
                            <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                              {refSearchResults.map((result, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-1 rounded bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                                >
                                  {result.thumbnail && (
                                    <img src={result.thumbnail} alt={result.title} className="w-8 h-8 rounded object-cover" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{result.title}</div>
                                    <div className="text-xs text-neutral-500 truncate">{result.artist}</div>
                                  </div>
                                  <button
                                    onClick={() => handleAddReference(song.id, result)}
                                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
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
                            className="w-full py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRefSearch(song.id)}
                          className="w-full py-2 px-2 text-xs border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          + Add Reference
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                      Comments
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                      {song.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-2 text-xs">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            {comment.user[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium">{comment.user}</span>
                              <span className="text-neutral-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[song.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [song.id]: e.target.value })}
                        placeholder="Add comment..."
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(song.id);
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(song.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-medium"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
