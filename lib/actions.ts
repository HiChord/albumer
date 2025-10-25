"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

// Album Actions
export async function createAlbum(name: string) {
  const album = await prisma.album.create({
    data: { name },
  });
  revalidatePath("/");
  return album;
}

export async function updateAlbum(id: string, name: string) {
  const album = await prisma.album.update({
    where: { id },
    data: { name },
  });
  revalidatePath(`/album/${id}`);
  return album;
}

export async function getAlbums() {
  return await prisma.album.findMany({
    include: {
      songs: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getAlbum(id: string) {
  return await prisma.album.findUnique({
    where: { id },
    include: {
      songs: {
        include: {
          files: true,
          references: true,
          comments: {
            orderBy: {
              createdAt: "desc",
            },
          },
          versions: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });
}

// Song Actions
export async function createSong(albumId: string, title: string = "Untitled") {
  // Get the current max order for this album
  const existingSongs = await prisma.song.findMany({
    where: { albumId },
    select: { order: true },
    orderBy: { order: "desc" },
    take: 1,
  });

  const nextOrder = existingSongs.length > 0 ? existingSongs[0].order + 1 : 0;

  const song = await prisma.song.create({
    data: {
      title,
      albumId,
      order: nextOrder,
      versions: {
        create: {
          changes: "Song created",
          comment: "Initial creation",
          user: "User",
        },
      },
    },
    include: {
      files: true,
      references: true,
      comments: true,
      versions: true,
    },
  });

  await prisma.album.update({
    where: { id: albumId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/album/${albumId}`);
  return song;
}

export async function updateSong(
  songId: string,
  data: {
    title?: string;
    lyrics?: string;
    notes?: string;
    progress?: string;
    user?: string;
  }
) {
  const { user = "User", ...songData } = data;
  const field = Object.keys(songData)[0];

  // Get current song state for snapshot BEFORE updating
  const currentSong = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      files: true,
      references: true,
    },
  });

  const song = await prisma.song.update({
    where: { id: songId },
    data: {
      ...songData,
      versions: {
        create: {
          changes: `Updated ${field}`,
          comment: "",
          user,
          snapshot: JSON.stringify({
            title: currentSong?.title,
            lyrics: currentSong?.lyrics,
            notes: currentSong?.notes,
            progress: currentSong?.progress,
            files: currentSong?.files,
            references: currentSong?.references,
            timestamp: new Date().toISOString(),
          }),
        },
      },
    },
    include: {
      album: true,
      files: true,
      references: true,
      comments: true,
      versions: true,
    },
  });

  await prisma.album.update({
    where: { id: song.albumId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/album/${song.albumId}`);
  return song;
}

export async function deleteSong(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { albumId: true },
  });

  if (!song) return;

  await prisma.song.delete({
    where: { id: songId },
  });

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
  }
) {
  const file = await prisma.file.create({
    data: {
      ...data,
      songId,
    },
  });

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { albumId: true },
  });

  if (song) {
    await prisma.song.update({
      where: { id: songId },
      data: {
        versions: {
          create: {
            changes: `Uploaded ${data.type} file`,
            comment: data.name,
            user: "User",
          },
        },
      },
    });

    await prisma.album.update({
      where: { id: song.albumId },
      data: { updatedAt: new Date() },
    });

    revalidatePath(`/album/${song.albumId}`);
  }

  return file;
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
  }
) {
  const reference = await prisma.reference.create({
    data: {
      ...data,
      songId,
    },
  });

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { albumId: true },
  });

  if (song) {
    await prisma.song.update({
      where: { id: songId },
      data: {
        versions: {
          create: {
            changes: "Added reference",
            comment: data.title,
            user: "User",
          },
        },
      },
    });

    await prisma.album.update({
      where: { id: song.albumId },
      data: { updatedAt: new Date() },
    });

    revalidatePath(`/album/${song.albumId}`);
  }

  return reference;
}

export async function deleteReference(referenceId: string) {
  const reference = await prisma.reference.findUnique({
    where: { id: referenceId },
    include: {
      song: {
        select: { albumId: true },
      },
    },
  });

  if (!reference) return;

  await prisma.reference.delete({
    where: { id: referenceId },
  });

  revalidatePath(`/album/${reference.song.albumId}`);
}

// Comment Actions
export async function addComment(
  songId: string,
  data: {
    user: string;
    text: string;
  }
) {
  const comment = await prisma.comment.create({
    data: {
      ...data,
      songId,
    },
  });

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { albumId: true },
  });

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
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data,
    include: {
      song: {
        select: { albumId: true },
      },
    },
  });

  revalidatePath(`/album/${comment.song.albumId}`);
  return comment;
}

export async function deleteComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      song: {
        select: { albumId: true },
      },
    },
  });

  if (!comment) return;

  await prisma.comment.delete({
    where: { id: commentId },
  });

  revalidatePath(`/album/${comment.song.albumId}`);
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
  const version = await prisma.version.update({
    where: { id: versionId },
    data: { user },
    include: {
      song: {
        select: { albumId: true },
      },
    },
  });

  revalidatePath(`/album/${version.song.albumId}`);
  return version;
}

// Version History - Restore to previous version
export async function restoreSongVersion(songId: string, versionId: string) {
  const version = await prisma.version.findUnique({
    where: { id: versionId },
  });

  if (!version || !version.snapshot) {
    throw new Error("Version not found or no snapshot available");
  }

  const snapshot = JSON.parse(version.snapshot);

  const song = await prisma.song.update({
    where: { id: songId },
    data: {
      title: snapshot.title,
      lyrics: snapshot.lyrics,
      notes: snapshot.notes,
      progress: snapshot.progress,
      versions: {
        create: {
          changes: "Restored from version history",
          comment: `Restored to ${new Date(version.createdAt).toLocaleString()}`,
          user: "System",
          snapshot: JSON.stringify(snapshot),
        },
      },
    },
    include: {
      album: true,
      files: true,
      references: true,
      comments: true,
      versions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const albumId = song.albumId;
  await prisma.album.update({
    where: { id: albumId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/album/${albumId}`);
  return song;
}

// Reorder songs
export async function reorderSongs(albumId: string, songIds: string[]) {
  // Update the order field for each song based on its position in the array
  await Promise.all(
    songIds.map((songId, index) =>
      prisma.song.update({
        where: { id: songId },
        data: { order: index },
      })
    )
  );

  await prisma.album.update({
    where: { id: albumId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/album/${albumId}`);
}
