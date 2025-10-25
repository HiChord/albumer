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
      },
    },
  });
}

// Song Actions
export async function createSong(albumId: string, title: string = "Untitled") {
  const song = await prisma.song.create({
    data: {
      title,
      albumId,
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
  }
) {
  const field = Object.keys(data)[0];

  const song = await prisma.song.update({
    where: { id: songId },
    data: {
      ...data,
      versions: {
        create: {
          changes: `Updated ${field}`,
          comment: "",
          user: "User",
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
