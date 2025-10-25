"use client";

import { useState } from "react";
import { Search, Music, Youtube, ExternalLink, Plus } from "lucide-react";

interface Reference {
  id: string;
  type: "spotify" | "youtube";
  title: string;
  artist: string;
  url: string;
  thumbnail?: string;
}

interface ReferenceSearchProps {
  onAddReference: (reference: Omit<Reference, "id">) => void;
  currentReferences: Reference[];
}

export default function ReferenceSearch({ onAddReference, currentReferences }: ReferenceSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"spotify" | "youtube">("spotify");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    // This is a placeholder. In production, you'd call the actual APIs
    setIsSearching(true);

    // Simulated search results
    setTimeout(() => {
      setSearchResults([
        {
          title: searchQuery,
          artist: "Example Artist",
          url: searchType === "spotify" ? `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
        }
      ]);
      setIsSearching(false);
    }, 500);
  };

  const addReference = (result: any) => {
    onAddReference({
      type: searchType,
      title: result.title,
      artist: result.artist,
      url: result.url,
      thumbnail: result.thumbnail,
    });
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-indigo-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Reference Track
      </button>
    );
  }

  return (
    <div className="border-2 border-indigo-500 rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSearchType("spotify")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            searchType === "spotify"
              ? "bg-green-600 text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          <Music className="w-4 h-4 inline mr-2" />
          Spotify
        </button>
        <button
          onClick={() => setSearchType("youtube")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            searchType === "youtube"
              ? "bg-red-600 text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          <Youtube className="w-4 h-4 inline mr-2" />
          YouTube
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") setIsOpen(false);
          }}
          placeholder={`Search ${searchType}...`}
          className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none bg-white dark:bg-slate-800"
          autoFocus
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {isSearching && (
        <div className="text-center py-4 text-slate-500">Searching...</div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2 mb-3">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg"
            >
              <div>
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-slate-500">{result.artist}</div>
              </div>
              <button
                onClick={() => addReference(result)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setIsOpen(false);
          setSearchQuery("");
          setSearchResults([]);
        }}
        className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
      >
        Cancel
      </button>
    </div>
  );
}
