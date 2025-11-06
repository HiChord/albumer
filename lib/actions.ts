"use server";

import * as storage from "./supabaseStorage";
import { revalidatePath } from "next/cache";

// Album Actions
export async function createAlbum(name: string) {
  const album = await storage.createAlbum(name);
  revalidatePath("/");
  return album;
}

export async function updateAlbum(id: string, name: string) {
  const album = await storage.updateAlbum(id, name);
  revalidatePath(`/album/${id}`);
  return album;
}

export async function deleteAlbum(id: string) {
  await storage.deleteAlbum(id);
  revalidatePath("/");
}

export async function duplicateAlbum(id: string) {
  const originalAlbum = await storage.getAlbumById(id);
  if (!originalAlbum) return null;

  // Create new album with "Copy of" prefix
  const newAlbumName = `Copy of ${originalAlbum.name}`;
  const newAlbum = await storage.createAlbum(newAlbumName);

  // Get all songs from original album
  const originalSongs = await storage.getSongsByAlbumId(id);

  // Duplicate each song (without files/references/comments)
  for (const song of originalSongs) {
    await storage.createSong(newAlbum.id, song.title);
    // Get the newly created song
    const newSongs = await storage.getSongsByAlbumId(newAlbum.id);
    const newSong = newSongs[newSongs.length - 1];

    // Update song with original data
    await storage.updateSong(newSong.id, {
      lyrics: song.lyrics,
      notes: song.notes,
      progress: song.progress,
      origin: song.origin,
    }, "User");
  }

  revalidatePath("/");
  return newAlbum;
}

export async function getAlbums() {
  const albums = await storage.getAllAlbums();

  // Get songs for each album
  const albumsWithSongs = await Promise.all(
    albums.map(async (album) => {
      const songs = await storage.getSongsByAlbumId(album.id);
      return {
        ...album,
        songs,
      };
    })
  );

  // Sort by most recently updated
  return albumsWithSongs.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getAlbum(id: string) {
  const album = await storage.getAlbumById(id);
  if (!album) return null;

  const songs = await storage.getSongsByAlbumId(id);

  // Get all related data for each song
  const songsWithData = await Promise.all(
    songs.map(async (song) => {
      const [files, references, comments, versions] = await Promise.all([
        storage.getFilesBySongId(song.id),
        storage.getReferencesBySongId(song.id),
        storage.getCommentsBySongId(song.id),
        storage.getVersionsBySongId(song.id),
      ]);

      return {
        ...song,
        files,
        references,
        comments,
        versions,
      };
    })
  );

  return {
    ...album,
    songs: songsWithData,
  };
}

// Song Actions
export async function createSong(albumId: string, title: string = "Untitled") {
  const song = await storage.createSong(albumId, title);

  // Get related data
  const [files, references, comments, versions] = await Promise.all([
    storage.getFilesBySongId(song.id),
    storage.getReferencesBySongId(song.id),
    storage.getCommentsBySongId(song.id),
    storage.getVersionsBySongId(song.id),
  ]);

  revalidatePath(`/album/${albumId}`);

  return {
    ...song,
    files,
    references,
    comments,
    versions,
  };
}

export async function updateSong(
  songId: string,
  data: {
    title?: string;
    lyrics?: string;
    notes?: string;
    progress?: string;
    origin?: string;
    user?: string;
  }
) {
  const { user = "User", ...songData } = data;

  const song = await storage.updateSong(songId, songData, user);
  if (!song) return null;

  // Get related data
  const [files, references, comments, versions] = await Promise.all([
    storage.getFilesBySongId(song.id),
    storage.getReferencesBySongId(song.id),
    storage.getCommentsBySongId(song.id),
    storage.getVersionsBySongId(song.id),
  ]);

  const album = await storage.getAlbumById(song.albumId);
  revalidatePath(`/album/${song.albumId}`);

  return {
    ...song,
    album,
    files,
    references,
    comments,
    versions,
  };
}

export async function deleteSong(songId: string) {
  const song = await storage.getSongById(songId);
  if (!song) return;

  await storage.deleteSong(songId);
  revalidatePath(`/album/${song.albumId}`);
}

// File Actions
export async function addFile(
  songId: string,
  data: {
    name: string;
    type: "logic" | "audio";
    url: string;
    mimeType: string;
    size: number;
    externalId?: string;
  }
) {
  const file = await storage.createFile(songId, data);

  const song = await storage.getSongById(songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }

  return file;
}

export async function deleteFile(fileId: string, songId: string) {
  await storage.deleteFile(fileId);

  const song = await storage.getSongById(songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }
}

// Reference Actions
export async function addReference(
  songId: string,
  data: {
    type: "spotify" | "youtube";
    title: string;
    artist: string;
    url: string;
    thumbnail?: string;
    user?: string;
  }
) {
  const reference = await storage.createReference(songId, data);

  const song = await storage.getSongById(songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }

  return reference;
}

export async function deleteReference(referenceId: string) {
  const reference = (await storage.getAllReferences()).find((r) => r.id === referenceId);
  if (!reference) return;

  await storage.deleteReference(referenceId);

  const song = await storage.getSongById(reference.songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }
}

// Comment Actions
export async function addComment(
  songId: string,
  data: {
    user: string;
    text: string;
  }
) {
  const comment = await storage.createComment(songId, data);

  const song = await storage.getSongById(songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }

  return comment;
}

export async function updateComment(
  commentId: string,
  data: {
    text?: string;
    user?: string;
  }
) {
  const comment = await storage.updateComment(commentId, data);
  if (!comment) return null;

  const song = await storage.getSongById(comment.songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }

  return comment;
}

export async function deleteComment(commentId: string) {
  const comment = (await storage.getAllComments()).find((c) => c.id === commentId);
  if (!comment) return;

  await storage.deleteComment(commentId);

  const song = await storage.getSongById(comment.songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }
}

// Spotify Integration
export async function searchSpotify(query: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { tracks: [] };
  }

  try {
    // Get access token
    const authResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    const { access_token } = await authResponse.json();

    // Search tracks
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await searchResponse.json();

    return {
      tracks: data.tracks.items.map((track: any) => ({
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        url: track.external_urls.spotify,
        thumbnail: track.album.images[0]?.url,
      })),
    };
  } catch (error) {
    console.error("Spotify search error:", error);
    return { tracks: [] };
  }
}

// YouTube Integration
export async function searchYouTube(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return { videos: [] };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`
    );

    const data = await response.json();

    return {
      videos: data.items.map((item: any) => ({
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
      })),
    };
  } catch (error) {
    console.error("YouTube search error:", error);
    return { videos: [] };
  }
}

// Version History - Update user attribution
export async function updateVersionUser(versionId: string, user: string) {
  const version = await storage.updateVersionUser(versionId, user);
  if (!version) return null;

  const song = await storage.getSongById(version.songId);
  if (song) {
    revalidatePath(`/album/${song.albumId}`);
  }

  return version;
}

// Version History - Restore to previous version
export async function restoreSongVersion(songId: string, versionId: string) {
  const song = await storage.restoreSongFromVersion(songId, versionId);
  if (!song) return null;

  const [files, references, comments, versions] = await Promise.all([
    storage.getFilesBySongId(song.id),
    storage.getReferencesBySongId(song.id),
    storage.getCommentsBySongId(song.id),
    storage.getVersionsBySongId(song.id),
  ]);

  const album = await storage.getAlbumById(song.albumId);
  revalidatePath(`/album/${song.albumId}`);

  return {
    ...song,
    album,
    files,
    references,
    comments,
    versions,
  };
}

// Reorder songs
export async function reorderSongs(albumId: string, songIds: string[]) {
  await storage.reorderSongs(albumId, songIds);
  revalidatePath(`/album/${albumId}`);
}
