"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Plus,
  Music,
  FileAudio,
  FileText,
  Search,
  History,
  ExternalLink,
  Trash2
} from "lucide-react";
import Link from "next/link";
import DropZone from "@/components/DropZone";
import AudioPlayer from "@/components/AudioPlayer";
import ReferenceSearch from "@/components/ReferenceSearch";

interface Song {
  id: string;
  title: string;
  logicFile?: string;
  audioFile?: string;
  lyrics: string;
  notes: string;
  progress: string;
  references: Reference[];
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
  const [showAddSong, setShowAddSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [editingSong, setEditingSong] = useState<string | null>(null);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);

  useEffect(() => {
    // Load album and songs
    const albums = JSON.parse(localStorage.getItem("albums") || "[]");
    const currentAlbum = albums.find((a: Album) => a.id === resolvedParams.id);
    setAlbum(currentAlbum);

    const storedSongs = JSON.parse(localStorage.getItem(`songs_${resolvedParams.id}`) || "[]");
    setSongs(storedSongs);
  }, [resolvedParams.id]);

  const addSong = () => {
    if (!newSongTitle.trim()) return;

    const newSong: Song = {
      id: Date.now().toString(),
      title: newSongTitle,
      lyrics: "",
      notes: "",
      progress: "Not Started",
      references: [],
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

    // Update album
    const albums = JSON.parse(localStorage.getItem("albums") || "[]");
    const albumIndex = albums.findIndex((a: Album) => a.id === resolvedParams.id);
    if (albumIndex !== -1) {
      albums[albumIndex].songCount = updatedSongs.length;
      albums[albumIndex].updatedAt = new Date().toISOString();
      localStorage.setItem("albums", JSON.stringify(albums));
      setAlbum(albums[albumIndex]);
    }

    setNewSongTitle("");
    setShowAddSong(false);
  };

  const updateSong = (songId: string, field: keyof Song, value: any) => {
    const updatedSongs = songs.map(song => {
      if (song.id === songId) {
        const updatedSong = { ...song, [field]: value, updatedAt: new Date().toISOString() };

        // Add version history
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

  const handleFileUpload = async (songId: string, file: File, type: "logic" | "audio") => {
    // Store file in browser storage (for demo - in production, upload to server/cloud)
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

  const addReference = (songId: string, reference: Omit<Reference, "id">) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const newRef: Reference = {
      ...reference,
      id: Date.now().toString(),
    };

    const updatedReferences = [...song.references, newRef];
    updateSong(songId, "references", updatedReferences);
  };

  const removeReference = (songId: string, refId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const updatedReferences = song.references.filter(r => r.id !== refId);
    updateSong(songId, "references", updatedReferences);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  {album.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {songs.length} {songs.length === 1 ? "song" : "songs"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddSong(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Song
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Add Song Modal */}
        {showAddSong && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Add New Song</h2>
              <input
                type="text"
                value={newSongTitle}
                onChange={(e) => setNewSongTitle(e.target.value)}
                placeholder="Song title..."
                className="w-full text-lg px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none bg-transparent mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSong();
                  if (e.key === "Escape") {
                    setShowAddSong(false);
                    setNewSongTitle("");
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={addSong}
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddSong(false);
                    setNewSongTitle("");
                  }}
                  className="px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Songs Grid */}
        {songs.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-6">
              No songs yet. Add your first song to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {songs.map((song) => (
              <div
                key={song.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 border-transparent hover:border-indigo-500 transition-all"
              >
                {/* Song Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                      {song.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span>Updated {new Date(song.updatedAt).toLocaleString()}</span>
                      <button
                        onClick={() => setShowVersionHistory(showVersionHistory === song.id ? null : song.id)}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        {song.versions.length} versions
                      </button>
                    </div>
                  </div>
                  <select
                    value={song.progress}
                    onChange={(e) => updateSong(song.id, "progress", e.target.value)}
                    className="px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none bg-transparent font-semibold"
                  >
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Recording</option>
                    <option>Mixing</option>
                    <option>Mastering</option>
                    <option>Complete</option>
                  </select>
                </div>

                {/* Version History */}
                {showVersionHistory === song.id && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="font-semibold mb-3">Version History</h4>
                    <div className="space-y-2">
                      {song.versions.slice().reverse().map((version) => (
                        <div key={version.id} className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">{version.changes}</span>
                            {version.comment && <span className="text-slate-500"> - {version.comment}</span>}
                          </div>
                          <span className="text-slate-500">
                            {new Date(version.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Files */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Logic File
                      </label>
                      <DropZone
                        onFileSelect={(file) => handleFileUpload(song.id, file, "logic")}
                        accept=".logic,.logicx"
                        currentFile={getFileData(song.logicFile)?.name}
                        label="Upload Logic file"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <FileAudio className="w-4 h-4 inline mr-2" />
                        Audio Bounce
                      </label>
                      <DropZone
                        onFileSelect={(file) => handleFileUpload(song.id, file, "audio")}
                        accept=".wav,.mp3,.aiff"
                        currentFile={getFileData(song.audioFile)?.name}
                        label="Upload audio file"
                      />
                      {song.audioFile && getFileData(song.audioFile)?.data && (
                        <div className="mt-4">
                          <AudioPlayer
                            src={getFileData(song.audioFile)!.data}
                            title={song.title}
                          />
                        </div>
                      )}
                    </div>

                    {/* Lyrics */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Lyrics
                      </label>
                      <textarea
                        value={song.lyrics}
                        onChange={(e) => updateSong(song.id, "lyrics", e.target.value)}
                        placeholder="Enter lyrics..."
                        className="w-full h-32 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none bg-transparent resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={song.notes}
                        onChange={(e) => updateSong(song.id, "notes", e.target.value)}
                        placeholder="Add production notes, ideas, etc..."
                        className="w-full h-32 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none bg-transparent resize-none"
                      />
                    </div>

                    {/* References */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <Search className="w-4 h-4 inline mr-2" />
                        Reference Tracks
                      </label>
                      <div className="space-y-2">
                        {song.references.map((ref) => (
                          <div
                            key={ref.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg group"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{ref.title}</div>
                              <div className="text-sm text-slate-500">{ref.artist}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => removeReference(song.id, ref.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <ReferenceSearch
                          onAddReference={(ref) => addReference(song.id, ref)}
                          currentReferences={song.references}
                        />
                      </div>
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
