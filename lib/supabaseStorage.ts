import { createClient } from "@supabase/supabase-js";

// Data Types (same as driveStorage)
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

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase credentials are missing. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}`
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Album Operations
export async function getAllAlbums(): Promise<Album[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .order("updatedAt", { ascending: false });

  if (error) {
    console.error("Error fetching albums:", error);
    return [];
  }

  return data || [];
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching album:", error);
    return null;
  }

  return data;
}

export async function createAlbum(name: string): Promise<Album> {
  const supabase = getSupabaseClient();
  const newAlbum = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("albums")
    .insert([newAlbum])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating album: ${error.message}`);
  }

  return data;
}

export async function updateAlbum(id: string, name: string): Promise<Album | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("albums")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating album:", error);
    return null;
  }

  return data;
}

export async function touchAlbum(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase
    .from("albums")
    .update({ updatedAt: new Date().toISOString() })
    .eq("id", id);
}

// Song Operations
export async function getAllSongs(): Promise<Song[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching songs:", error);
    return [];
  }

  return data || [];
}

export async function getSongsByAlbumId(albumId: string): Promise<Song[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("albumId", albumId)
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching songs:", error);
    return [];
  }

  return data || [];
}

export async function getSongById(id: string): Promise<Song | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching song:", error);
    return null;
  }

  return data;
}

export async function createSong(albumId: string, title: string = "Untitled"): Promise<Song> {
  const supabase = getSupabaseClient();

  // Get max order for this album
  const { data: albumSongs } = await supabase
    .from("songs")
    .select("order")
    .eq("albumId", albumId);

  const maxOrder = albumSongs && albumSongs.length > 0
    ? Math.max(...albumSongs.map((s) => s.order))
    : -1;

  const newSong: Song = {
    id: generateId(),
    title,
    lyrics: "",
    notes: "",
    progress: "Not Started",
    order: maxOrder + 1,
    albumId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("songs")
    .insert([newSong])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating song: ${error.message}`);
  }

  // Create initial version
  await createVersion(data.id, "Song created", "Initial creation", "User");

  // Touch album
  await touchAlbum(albumId);

  return data;
}

export async function updateSong(
  id: string,
  data: Partial<Omit<Song, "id" | "albumId" | "createdAt">>,
  user: string = "User"
): Promise<Song | null> {
  const supabase = getSupabaseClient();

  // Get current song for snapshot
  const currentSong = await getSongById(id);
  if (!currentSong) return null;

  // Store snapshot before update
  const snapshot = {
    title: currentSong.title,
    lyrics: currentSong.lyrics,
    notes: currentSong.notes,
    progress: currentSong.progress,
    timestamp: new Date().toISOString(),
  };

  // Track user attribution for lyrics and notes
  const updatedData: any = { ...data, updatedAt: new Date().toISOString() };
  if (data.lyrics !== undefined) {
    updatedData.lyricsUser = user;
    updatedData.lyricsUpdatedAt = new Date().toISOString();
  }
  if (data.notes !== undefined) {
    updatedData.notesUser = user;
    updatedData.notesUpdatedAt = new Date().toISOString();
  }

  const { data: updatedSong, error } = await supabase
    .from("songs")
    .update(updatedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating song:", error);
    return null;
  }

  // Create version history
  const field = Object.keys(data)[0];
  if (field && field !== "updatedAt" && field !== "order") {
    await createVersion(
      id,
      `Updated ${field}`,
      "",
      user,
      JSON.stringify(snapshot)
    );
  }

  // Touch album
  await touchAlbum(updatedSong.albumId);

  return updatedSong;
}

export async function deleteSong(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const song = await getSongById(id);
  if (!song) return;

  await supabase.from("songs").delete().eq("id", id);

  // Touch album
  await touchAlbum(song.albumId);
}

export async function reorderSongs(albumId: string, songIds: string[]): Promise<void> {
  const supabase = getSupabaseClient();

  // Update each song's order
  for (let i = 0; i < songIds.length; i++) {
    await supabase
      .from("songs")
      .update({ order: i, updatedAt: new Date().toISOString() })
      .eq("id", songIds[i]);
  }

  await touchAlbum(albumId);
}

// File Operations
export async function getAllFiles(): Promise<File[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("files").select("*");

  if (error) {
    console.error("Error fetching files:", error);
    return [];
  }

  return data || [];
}

export async function getFilesBySongId(songId: string): Promise<File[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("songId", songId);

  if (error) {
    console.error("Error fetching files:", error);
    return [];
  }

  return data || [];
}

export async function createFile(
  songId: string,
  data: Omit<File, "id" | "songId" | "createdAt">
): Promise<File> {
  const supabase = getSupabaseClient();
  const newFile: File = {
    ...data,
    id: generateId(),
    songId,
    createdAt: new Date().toISOString(),
  };

  const { data: insertedFile, error } = await supabase
    .from("files")
    .insert([newFile])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating file: ${error.message}`);
  }

  // Create version
  await createVersion(songId, `Uploaded ${data.type} file`, data.name, "User");

  // Touch song's album
  const song = await getSongById(songId);
  if (song) await touchAlbum(song.albumId);

  return insertedFile;
}

// Reference Operations
export async function getAllReferences(): Promise<Reference[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("references").select("*");

  if (error) {
    console.error("Error fetching references:", error);
    return [];
  }

  return data || [];
}

export async function getReferencesBySongId(songId: string): Promise<Reference[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("references")
    .select("*")
    .eq("songId", songId);

  if (error) {
    console.error("Error fetching references:", error);
    return [];
  }

  return data || [];
}

export async function createReference(
  songId: string,
  data: Omit<Reference, "id" | "songId" | "createdAt">
): Promise<Reference> {
  const supabase = getSupabaseClient();
  const newReference: Reference = {
    ...data,
    id: generateId(),
    songId,
    createdAt: new Date().toISOString(),
  };

  const { data: insertedReference, error } = await supabase
    .from("references")
    .insert([newReference])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating reference: ${error.message}`);
  }

  // Create version
  await createVersion(songId, "Added reference", data.title, data.user || "User");

  // Touch song's album
  const song = await getSongById(songId);
  if (song) await touchAlbum(song.albumId);

  return insertedReference;
}

export async function deleteReference(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const reference = await supabase
    .from("references")
    .select("*")
    .eq("id", id)
    .single();

  if (reference.data) {
    await supabase.from("references").delete().eq("id", id);

    // Touch song's album
    const song = await getSongById(reference.data.songId);
    if (song) await touchAlbum(song.albumId);
  }
}

// Comment Operations
export async function getAllComments(): Promise<Comment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("comments").select("*");

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return data || [];
}

export async function getCommentsBySongId(songId: string): Promise<Comment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("songId", songId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return data || [];
}

export async function createComment(
  songId: string,
  data: { user: string; text: string }
): Promise<Comment> {
  const supabase = getSupabaseClient();
  const newComment: Comment = {
    ...data,
    id: generateId(),
    songId,
    createdAt: new Date().toISOString(),
  };

  const { data: insertedComment, error } = await supabase
    .from("comments")
    .insert([newComment])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating comment: ${error.message}`);
  }

  return insertedComment;
}

export async function updateComment(
  id: string,
  data: { user?: string; text?: string }
): Promise<Comment | null> {
  const supabase = getSupabaseClient();
  const { data: updatedComment, error } = await supabase
    .from("comments")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    return null;
  }

  return updatedComment;
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from("comments").delete().eq("id", id);
}

// Version Operations
export async function getAllVersions(): Promise<Version[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("versions").select("*");

  if (error) {
    console.error("Error fetching versions:", error);
    return [];
  }

  return data || [];
}

export async function getVersionsBySongId(songId: string): Promise<Version[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("versions")
    .select("*")
    .eq("songId", songId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching versions:", error);
    return [];
  }

  return data || [];
}

export async function createVersion(
  songId: string,
  changes: string,
  comment: string,
  user: string,
  snapshot?: string
): Promise<Version> {
  const supabase = getSupabaseClient();
  const newVersion: Version = {
    id: generateId(),
    changes,
    comment,
    user,
    songId,
    createdAt: new Date().toISOString(),
    snapshot,
  };

  const { data, error } = await supabase
    .from("versions")
    .insert([newVersion])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating version: ${error.message}`);
  }

  return data;
}

export async function updateVersionUser(id: string, user: string): Promise<Version | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("versions")
    .update({ user })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating version:", error);
    return null;
  }

  return data;
}

export async function restoreSongFromVersion(
  songId: string,
  versionId: string
): Promise<Song | null> {
  const supabase = getSupabaseClient();
  const { data: version } = await supabase
    .from("versions")
    .select("*")
    .eq("id", versionId)
    .single();

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
