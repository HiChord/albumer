"use client";

import { useState } from "react";
import { History, X, RotateCcw, Clock, User, FileText, Edit } from "lucide-react";
import { restoreSongVersion, updateVersionUser } from "@/lib/actions";

interface Version {
  id: string;
  changes: string;
  comment: string;
  user: string;
  createdAt: string;
  snapshot?: string;
}

interface VersionHistoryProps {
  songId: string;
  songTitle: string;
  versions: Version[];
  onRestore: () => void;
}

export default function VersionHistory({ songId, songTitle, versions, onRestore }: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [editingVersionUser, setEditingVersionUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<string>("");

  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore to this version? Current changes will be saved as a new version.")) {
      return;
    }

    setIsRestoring(true);
    try {
      await restoreSongVersion(songId, versionId);
      onRestore();
      setIsOpen(false);
      setSelectedVersion(null);
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleStartEditUser = (versionId: string, currentUser: string) => {
    setEditingVersionUser(versionId);
    setNewUser(currentUser);
  };

  const handleUpdateUser = async (versionId: string) => {
    try {
      await updateVersionUser(versionId, newUser);
      onRestore();
      setEditingVersionUser(null);
    } catch (error) {
      console.error("Error updating version user:", error);
      alert("Failed to update user");
    }
  };

  const getSnapshotPreview = (version: Version) => {
    if (!version.snapshot) return null;
    try {
      return JSON.parse(version.snapshot);
    } catch {
      return null;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <>
      {/* Open Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-1.5 text-xs uppercase tracking-wider font-light opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        title="Version History"
        style={{ color: 'var(--foreground)' }}
      >
        <History className="w-3 h-3" />
        <span>{versions.length}</span>
      </button>

      {/* Version History Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative ml-auto w-full max-w-2xl shadow-2xl flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}>
              <div className="flex items-center gap-4">
                <History className="w-4 h-4 opacity-60" style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 className="text-lg font-light tracking-tight" style={{ fontWeight: 300 }}>Version History</h2>
                  <p className="text-xs opacity-40 uppercase tracking-wider mt-1">{songTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 opacity-40 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Version List */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {versions.map((version, index) => {
                  const snapshot = getSnapshotPreview(version);
                  const isSelected = selectedVersion?.id === version.id;

                  return (
                    <div
                      key={version.id}
                      className={`group p-6 cursor-pointer transition-all ${
                        isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        background: isSelected ? 'var(--highlight)' : 'var(--background)',
                        borderColor: 'var(--border)'
                      }}
                      onClick={() => setSelectedVersion(isSelected ? null : version)}
                    >
                      {/* Version Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-light" style={{ background: 'var(--accent)', color: 'white' }}>
                            {version.user[0]}
                          </div>
                          <div>
                            {editingVersionUser === version.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={newUser}
                                  onChange={(e) => setNewUser(e.target.value)}
                                  className="px-2 py-1 text-xs font-light border-b bg-transparent focus:outline-none"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  <option value="Dev">Dev</option>
                                  <option value="Andy">Andy</option>
                                  <option value="Khal">Khal</option>
                                </select>
                                <button
                                  onClick={() => handleUpdateUser(version.id)}
                                  className="text-xs uppercase tracking-wider font-light opacity-60 hover:opacity-100 transition-opacity"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingVersionUser(null)}
                                  className="text-xs uppercase tracking-wider font-light opacity-30 hover:opacity-100 transition-opacity"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="font-light text-sm">{version.user}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditUser(version.id, version.user);
                                  }}
                                  className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"
                                  title="Change user"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <span className="text-xs opacity-40">
                                  {formatTimeAgo(version.createdAt)}
                                </span>
                              </div>
                            )}
                            <div className="text-xs opacity-60 mt-0.5">
                              {version.changes}
                            </div>
                          </div>
                        </div>

                        {/* Version Number */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-light opacity-40">
                            v{versions.length - index}
                          </span>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-xs opacity-40 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(version.createdAt).toLocaleString()}
                      </div>

                      {/* Snapshot Preview (when selected) */}
                      {isSelected && snapshot && (
                        <div className="mt-4 p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                          <div className="text-xs font-light opacity-30 uppercase tracking-[0.2em] mb-3">
                            Snapshot Preview
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="font-light opacity-60">Title:</span>
                              <span className="ml-2 font-light">{snapshot.title}</span>
                            </div>
                            <div>
                              <span className="font-light opacity-60">Status:</span>
                              <span className="ml-2 font-light">{snapshot.progress}</span>
                            </div>
                            {snapshot.lyrics && (
                              <div>
                                <span className="font-light opacity-60">Lyrics:</span>
                                <div className="mt-2 p-3 text-xs whitespace-pre-wrap max-h-20 overflow-y-auto font-light leading-relaxed" style={{ background: 'var(--surface-alt)' }}>
                                  {snapshot.lyrics.substring(0, 200)}
                                  {snapshot.lyrics.length > 200 && "..."}
                                </div>
                              </div>
                            )}
                            {snapshot.notes && (
                              <div>
                                <span className="font-light opacity-60">Notes:</span>
                                <div className="mt-2 p-3 text-xs whitespace-pre-wrap max-h-20 overflow-y-auto font-light leading-relaxed" style={{ background: 'var(--surface-alt)' }}>
                                  {snapshot.notes.substring(0, 200)}
                                  {snapshot.notes.length > 200 && "..."}
                                </div>
                              </div>
                            )}
                            {snapshot.files && snapshot.files.length > 0 && (
                              <div>
                                <span className="font-light opacity-60">Files:</span>
                                <div className="mt-2 space-y-1">
                                  {snapshot.files.map((file: any) => (
                                    <div key={file.id} className="flex items-center gap-2 opacity-80">
                                      <FileText className="w-3 h-3" />
                                      <span className="font-light">{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Restore Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(version.id);
                            }}
                            disabled={isRestoring}
                            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-white text-xs uppercase tracking-wider font-light transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                            style={{ background: 'var(--accent)' }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            {isRestoring ? "Restoring..." : "Restore This Version"}
                          </button>
                        </div>
                      )}

                      {/* Comment */}
                      {version.comment && (
                        <div className="mt-3 text-xs opacity-60 italic font-light">
                          &quot;{version.comment}&quot;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Info */}
            <div className="px-8 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}>
              <p className="text-xs opacity-40 font-light">
                <Clock className="w-3 h-3 inline mr-2" />
                All changes are automatically saved. Click any version to see details and restore.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
