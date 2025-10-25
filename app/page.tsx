"use client";

import { useState, useEffect } from "react";
import { Music, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { createAlbum, getAlbums } from "@/lib/actions";

interface Album {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  songs: any[];
}

export default function Home() {
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    const albums = await getAlbums();
    setRecentAlbums(albums.slice(0, 6));
    setLoading(false);
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;

    await createAlbum(newAlbumName);
    await loadAlbums();
    setNewAlbumName("");
    setShowNewAlbum(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Albumer
          </h1>
          <p className="text-xl text-neutral-500">
            Organize your album production beautifully
          </p>
        </div>

        {/* New Album Button */}
        <div className="max-w-2xl mx-auto mb-12">
          {!showNewAlbum ? (
            <button
              onClick={() => setShowNewAlbum(true)}
              className="w-full py-6 px-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 group border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500"
            >
              <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                New Album
              </span>
            </button>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-6 border border-neutral-200 dark:border-neutral-800">
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Enter album name..."
                className="w-full text-xl font-semibold px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:outline-none bg-transparent mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAlbum();
                  if (e.key === "Escape") {
                    setShowNewAlbum(false);
                    setNewAlbumName("");
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateAlbum}
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewAlbum(false);
                    setNewAlbumName("");
                  }}
                  className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
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
              <Clock className="w-5 h-5 text-neutral-500" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Recent Albums
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="group bg-white dark:bg-neutral-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-neutral-500">
                      {album.songs.length} {album.songs.length === 1 ? "track" : "tracks"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                    {album.name}
                  </h3>
                  <p className="text-sm text-neutral-500">
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
