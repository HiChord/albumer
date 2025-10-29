"use client";

import { useState, useEffect } from "react";
import { Music, Plus, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { createAlbum, getAlbums, deleteAlbum } from "@/lib/actions";

interface Album {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  songs: any[];
}

export default function Home() {
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbums();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadAlbums();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const albums = await getAlbums();
      setRecentAlbums(albums.slice(0, 6));
    } catch (error) {
      console.error("Failed to load albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;

    await createAlbum(newAlbumName);
    await loadAlbums();
    setNewAlbumName("");
    setShowNewAlbum(false);
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, albumId: string, albumName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete album "${albumName}"? This will delete all songs and cannot be undone.`)) return;
    await deleteAlbum(albumId);
    await loadAlbums();
  };

  if (loading) {
    return (
      <div className="theme-home min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="opacity-60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="theme-home min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Minimal Header */}
      <div className="pt-20 pb-32">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-3 h-3 rounded-full opacity-60" style={{ background: 'var(--accent)' }}></div>
          </div>
          <h1 className="text-7xl md:text-8xl font-light tracking-tight text-center mb-6" style={{ fontWeight: 200 }}>
            Wild Rivers :)
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-8 pb-20">
        {/* New Album Input/Button */}
        <div className="mb-20">
          {!showNewAlbum ? (
            <button
              onClick={() => setShowNewAlbum(true)}
              className="group w-full max-w-2xl mx-auto py-8 flex items-center justify-center gap-4 border-b transition-all duration-300"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Plus className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-light tracking-wide opacity-60 group-hover:opacity-100 transition-opacity">
                New Album
              </span>
            </button>
          ) : (
            <div className="max-w-2xl mx-auto">
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Album name"
                className="w-full text-3xl font-light tracking-tight text-center border-b-2 bg-transparent focus:outline-none py-6 mb-6"
                style={{ borderColor: 'var(--accent)', color: 'var(--foreground)' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAlbum();
                  if (e.key === "Escape") {
                    setShowNewAlbum(false);
                    setNewAlbumName("");
                  }
                }}
              />
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCreateAlbum}
                  className="px-8 py-3 text-sm font-light tracking-wide transition-opacity"
                  style={{ color: 'var(--accent)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewAlbum(false);
                    setNewAlbumName("");
                  }}
                  className="px-8 py-3 text-sm font-light tracking-wide opacity-40 transition-opacity hover:opacity-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Albums Grid */}
        {recentAlbums.length > 0 && (
          <div>
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-3 opacity-40">
                <div className="w-px h-4" style={{ background: 'var(--foreground)' }}></div>
                <span className="text-xs uppercase tracking-[0.3em] font-light">Recent</span>
                <div className="w-px h-4" style={{ background: 'var(--foreground)' }}></div>
              </div>
            </div>
            <div
              className={`grid gap-px ${
                recentAlbums.length === 1
                  ? 'grid-cols-1 max-w-md mx-auto'
                  : recentAlbums.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}
              style={{ background: 'var(--border)' }}
            >
              {recentAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="group p-12 transition-all duration-300 relative"
                  style={{
                    background: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--background)';
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-8">
                      <div className="w-2 h-2 rounded-full opacity-40 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--accent)' }}></div>
                    </div>
                    <h3 className="text-2xl font-light tracking-tight mb-3">
                      {album.name}
                    </h3>
                    <div className="mt-auto pt-6 flex items-center justify-between text-xs opacity-40 group-hover:opacity-60 transition-opacity">
                      <span>{album.songs.length}</span>
                      <span className="uppercase tracking-wider">{new Date(album.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
