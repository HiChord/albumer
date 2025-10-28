-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "lyrics" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "progress" TEXT NOT NULL DEFAULT 'Not Started',
    "order" INTEGER NOT NULL DEFAULT 0,
    "albumId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "songs_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "external_id" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "files_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "references_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comments_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changes" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "user" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" TEXT,
    CONSTRAINT "versions_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

