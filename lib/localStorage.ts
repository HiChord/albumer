import fs from "fs/promises";
import path from "path";

// Data Types
export interface Album {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  id: string;
  title: string;
  lyrics: string;
  lyricsUser?: string;
  lyricsUpdatedAt?: string;
  notes: string;
  notesUser?: string;
  notesUpdatedAt?: string;
  progress: string;
  origin: string;
  order: number;
  albumId: string;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  name: string;
  type: "logic" | "audio";
  url: string;
  externalId?: string;
  mimeType: string;
  size: number;
  songId: string;
  createdAt: string;
}

export interface Reference {
  id: string;
  type: "spotify" | "youtube";
  title: string;
  artist: string;
  url: string;
  thumbnail?: string;
  user?: string;
  songId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  songId: string;
  createdAt: string;
}

export interface Version {
  id: string;
  changes: string;
  comment: string;
  user: string;
  songId: string;
  createdAt: string;
  snapshot?: string;
}

// Storage paths
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure directories exist
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// JSON file operations
async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDir(DATA_DIR);
  const filePath = path.join(DATA_DIR, filename);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDir(DATA_DIR);
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Album Operations
export async function getAllAlbums(): Promise<Album[]> {
  return await readJsonFile<Album>("albums.json");
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const albums = await getAllAlbums();
  return albums.find((a) => a.id === id) || null;
}

export async function createAlbum(name: string): Promise<Album> {
  const albums = await getAllAlbums();
  const newAlbum: Album = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  albums.push(newAlbum);
  await writeJsonFile("albums.json", albums);
  return newAlbum;
}

export async function updateAlbum(id: string, name: string): Promise<Album | null> {
  const albums = await getAllAlbums();
  const index = albums.findIndex((a) => a.id === id);
  if (index === -1) return null;

  albums[index].name = name;
  albums[index].updatedAt = new Date().toISOString();
  await writeJsonFile("albums.json", albums);
  return albums[index];
}

export async function touchAlbum(id: string): Promise<void> {
  const albums = await getAllAlbums();
  const index = albums.findIndex((a) => a.id === id);
  if (index !== -1) {
    albums[index].updatedAt = new Date().toISOString();
    await writeJsonFile("albums.json", albums);
  }
}

// Song Operations
export async function getAllSongs(): Promise<Song[]> {
  return await readJsonFile<Song>("songs.json");
}

export async function getSongsByAlbumId(albumId: string): Promise<Song[]> {
  const songs = await getAllSongs();
  return songs.filter((s) => s.albumId === albumId).sort((a, b) => a.order - b.order);
}

export async function getSongById(id: string): Promise<Song | null> {
  const songs = await getAllSongs();
  return songs.find((s) => s.id === id) || null;
}

export async function createSong(albumId: string, title: string = "Untitled"): Promise<Song> {
  const songs = await getAllSongs();
  const albumSongs = songs.filter((s) => s.albumId === albumId);
  const maxOrder = albumSongs.length > 0 ? Math.max(...albumSongs.map((s) => s.order)) : -1;

  const newSong: Song = {
    id: generateId(),
    title,
    lyrics: "",
    notes: "",
    progress: "Not Started",
    origin: "Group Nashville",
    order: maxOrder + 1,
    albumId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  songs.push(newSong);
  await writeJsonFile("songs.json", songs);

  // Create initial version
  await createVersion(newSong.id, "Song created", "Initial creation", "User");

  // Touch album
  await touchAlbum(albumId);

  return newSong;
}

export async function updateSong(
  id: string,
  data: Partial<Omit<Song, "id" | "albumId" | "createdAt">>,
  user?: string
): Promise<Song | null> {
  const songs = await getAllSongs();
  const index = songs.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const currentSong = songs[index];

  // Store snapshot before update
  const snapshot = {
    title: currentSong.title,
    lyrics: currentSong.lyrics,
    notes: currentSong.notes,
    progress: currentSong.progress,
    timestamp: new Date().toISOString(),
  };

  // Add user attribution for lyrics and notes
  const updateData = { ...data };
  if (user) {
    if ('lyrics' in data) {
      updateData.lyricsUser = user;
      updateData.lyricsUpdatedAt = new Date().toISOString();
    }
    if ('notes' in data) {
      updateData.notesUser = user;
      updateData.notesUpdatedAt = new Date().toISOString();
    }
  }

  // Update song
  songs[index] = {
    ...currentSong,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFile("songs.json", songs);

  // Create version history
  const field = Object.keys(data)[0];
  if (field && field !== "updatedAt" && field !== "order") {
    await createVersion(
      id,
      `Updated ${field}`,
      "",
      user || "User",
      JSON.stringify(snapshot)
    );
  }

  // Touch album
  await touchAlbum(songs[index].albumId);

  return songs[index];
}

export async function deleteSong(id: string): Promise<void> {
  const songs = await getAllSongs();
  const song = songs.find((s) => s.id === id);
  if (!song) return;

  // Delete song
  const filtered = songs.filter((s) => s.id !== id);
  await writeJsonFile("songs.json", filtered);

  // Delete related data
  const files = await getAllFiles();
  await writeJsonFile("files.json", files.filter((f) => f.songId !== id));

  const references = await getAllReferences();
  await writeJsonFile("references.json", references.filter((r) => r.songId !== id));

  const comments = await getAllComments();
  await writeJsonFile("comments.json", comments.filter((c) => c.songId !== id));

  const versions = await getAllVersions();
  await writeJsonFile("versions.json", versions.filter((v) => v.songId !== id));

  // Touch album
  await touchAlbum(song.albumId);
}

export async function reorderSongs(albumId: string, songIds: string[]): Promise<void> {
  const songs = await getAllSongs();

  songIds.forEach((songId, index) => {
    const songIndex = songs.findIndex((s) => s.id === songId);
    if (songIndex !== -1) {
      songs[songIndex].order = index;
      songs[songIndex].updatedAt = new Date().toISOString();
    }
  });

  await writeJsonFile("songs.json", songs);
  await touchAlbum(albumId);
}

// File Operations
export async function getAllFiles(): Promise<File[]> {
  return await readJsonFile<File>("files.json");
}

export async function getFilesBySongId(songId: string): Promise<File[]> {
  const files = await getAllFiles();
  return files.filter((f) => f.songId === songId);
}

export async function createFile(songId: string, data: Omit<File, "id" | "songId" | "createdAt">): Promise<File> {
  const files = await getAllFiles();
  const newFile: File = {
    ...data,
    id: generateId(),
    songId,
    createdAt: new Date().toISOString(),
  };

  files.push(newFile);
  await writeJsonFile("files.json", files);

  // Create version
  await createVersion(songId, `Uploaded ${data.type} file`, data.name, "User");

  // Touch song's album
  const song = await getSongById(songId);
  if (song) await touchAlbum(song.albumId);

  return newFile;
}

// Reference Operations
export async function getAllReferences(): Promise<Reference[]> {
  return await readJsonFile<Reference>("references.json");
}

export async function getReferencesBySongId(songId: string): Promise<Reference[]> {
  const references = await getAllReferences();
  return references.filter((r) => r.songId === songId);
}

export async function createReference(
  songId: string,
  data: Omit<Reference, "id" | "songId" | "createdAt">
): Promise<Reference> {
  const references = await getAllReferences();
  const newReference: Reference = {
    ...data,
    id: generateId(),
    songId,
    createdAt: new Date().toISOString(),
  };

  references.push(newReference);
  await writeJsonFile("references.json", references);

  // Create version
  await createVersion(songId, "Added reference", data.title, data.user || "User");

  // Touch song's album
  const song = await getSongById(songId);
  if (song) await touchAlbum(song.albumId);

  return newReference;
}

export async function deleteReference(id: string): Promise<void> {
  const references = await getAllReferences();
  const reference = references.find((r) => r.id === id);
  if (!reference) return;

  const filtered = references.filter((r) => r.id !== id);
  await writeJsonFile("references.json", filtered);

  // Touch song's album
  const song = await getSongById(reference.songId);
  if (song) await touchAlbum(song.albumId);
}

// Comment Operations
export async function getAllComments(): Promise<Comment[]> {
  return await readJsonFile<Comment>("comments.json");
}

export async function getCommentsBySongId(songId: string): Promise<Comment[]> {
  const comments = await getAllComments();
  return comments.filter((c) => c.songId === songId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createComment(
  songId: string,
  data: { user: string; text: string }
): Promise<Comment> {
  const comments = await getAllComments();
  const newComment: Comment = {
    ...data,
    id: generateId(),
    songId,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  await writeJsonFile("comments.json", comments);

  return newComment;
}

export async function updateComment(
  id: string,
  data: { user?: string; text?: string }
): Promise<Comment | null> {
  const comments = await getAllComments();
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) return null;

  comments[index] = { ...comments[index], ...data };
  await writeJsonFile("comments.json", comments);
  return comments[index];
}

export async function deleteComment(id: string): Promise<void> {
  const comments = await getAllComments();
  const filtered = comments.filter((c) => c.id !== id);
  await writeJsonFile("comments.json", filtered);
}

// Version Operations
export async function getAllVersions(): Promise<Version[]> {
  return await readJsonFile<Version>("versions.json");
}

export async function getVersionsBySongId(songId: string): Promise<Version[]> {
  const versions = await getAllVersions();
  return versions.filter((v) => v.songId === songId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createVersion(
  songId: string,
  changes: string,
  comment: string,
  user: string,
  snapshot?: string
): Promise<Version> {
  const versions = await getAllVersions();
  const newVersion: Version = {
    id: generateId(),
    changes,
    comment,
    user,
    songId,
    createdAt: new Date().toISOString(),
    snapshot,
  };

  versions.push(newVersion);
  await writeJsonFile("versions.json", versions);
  return newVersion;
}

export async function updateVersionUser(id: string, user: string): Promise<Version | null> {
  const versions = await getAllVersions();
  const index = versions.findIndex((v) => v.id === id);
  if (index === -1) return null;

  versions[index].user = user;
  await writeJsonFile("versions.json", versions);
  return versions[index];
}

export async function restoreSongFromVersion(songId: string, versionId: string): Promise<Song | null> {
  const version = (await getAllVersions()).find((v) => v.id === versionId);
  if (!version || !version.snapshot) {
    throw new Error("Version not found or no snapshot available");
  }

  const snapshot = JSON.parse(version.snapshot);
  const song = await updateSong(songId, {
    title: snapshot.title,
    lyrics: snapshot.lyrics,
    notes: snapshot.notes,
    progress: snapshot.progress,
  });

  if (song) {
    await createVersion(
      songId,
      "Restored from version history",
      `Restored to ${new Date(version.createdAt).toLocaleString()}`,
      "System",
      version.snapshot
    );
  }

  return song;
}

// Upload file path helper
export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export async function ensureUploadsDir(): Promise<void> {
  await ensureDir(UPLOADS_DIR);
}
