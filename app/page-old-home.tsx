"use client";

import { useState, useEffect } from "react";
import { Music, Plus, Clock } from "lucide-react";
import Link from "next/link";

interface Album {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  songCount: number;
}

export default function Home() {
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");

  useEffect(() => {
    // Load recent albums from localStorage for now
    const albums = JSON.parse(localStorage.getItem("albums") || "[]");
    setRecentAlbums(albums.sort((a: Album, b: Album) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).slice(0, 6));
  }, []);

  const createAlbum = () => {
    if (!newAlbumName.trim()) return;

    const newAlbum: Album = {
      id: Date.now().toString(),
      name: newAlbumName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songCount: 0,
    };

    const albums = JSON.parse(localStorage.getItem("albums") || "[]");
    albums.push(newAlbum);
    localStorage.setItem("albums", JSON.stringify(albums));

    window.location.href = `/album/${newAlbum.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Albumer
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Organize your album production beautifully
          </p>
        </div>

        {/* New Album Button */}
        <div className="max-w-2xl mx-auto mb-12">
          {!showNewAlbum ? (
            <button
              onClick={() => setShowNewAlbum(true)}
              className="w-full py-6 px-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 group border-2 border-transparent hover:border-indigo-500"
            >
              <Plus className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                New Album
              </span>
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Enter album name..."
                className="w-full text-2xl font-semibold px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none bg-transparent mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") createAlbum();
                  if (e.key === "Escape") {
                    setShowNewAlbum(false);
                    setNewAlbumName("");
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={createAlbum}
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewAlbum(false);
                    setNewAlbumName("");
                  }}
                  className="px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Albums */}
        {recentAlbums.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                Recent Albums
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 group border-2 border-transparent hover:border-indigo-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Music className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {album.songCount} {album.songCount === 1 ? "song" : "songs"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">
                    {album.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Updated {new Date(album.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
