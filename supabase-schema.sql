-- Albumer Database Schema for Supabase
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ufqepgqouzlymvcuzjjv/sql

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lyrics TEXT DEFAULT '',
  "lyricsUser" TEXT,
  "lyricsUpdatedAt" TIMESTAMP,
  notes TEXT DEFAULT '',
  "notesUser" TEXT,
  "notesUpdatedAt" TIMESTAMP,
  progress TEXT DEFAULT 'Not Started',
  "order" INTEGER DEFAULT 0,
  "albumId" TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('logic', 'audio')),
  url TEXT NOT NULL,
  "externalId" TEXT,
  "mimeType" TEXT NOT NULL,
  size INTEGER NOT NULL,
  "songId" TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- References table
CREATE TABLE IF NOT EXISTS "references" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('spotify', 'youtube')),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  "user" TEXT,
  "songId" TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL,
  text TEXT NOT NULL,
  "songId" TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Versions table
CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY,
  changes TEXT NOT NULL,
  comment TEXT DEFAULT '',
  "user" TEXT NOT NULL,
  "songId" TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  snapshot TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_songs_albumId ON songs("albumId");
CREATE INDEX IF NOT EXISTS idx_files_songId ON files("songId");
CREATE INDEX IF NOT EXISTS idx_references_songId ON "references"("songId");
CREATE INDEX IF NOT EXISTS idx_comments_songId ON comments("songId");
CREATE INDEX IF NOT EXISTS idx_versions_songId ON versions("songId");

-- Enable Row Level Security (RLS)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since you're using anon key)
-- For production, you'd want to add proper authentication

CREATE POLICY "Allow public read access on albums" ON albums FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on albums" ON albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on albums" ON albums FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on albums" ON albums FOR DELETE USING (true);

CREATE POLICY "Allow public read access on songs" ON songs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on songs" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on songs" ON songs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on songs" ON songs FOR DELETE USING (true);

CREATE POLICY "Allow public read access on files" ON files FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on files" ON files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on files" ON files FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on files" ON files FOR DELETE USING (true);

CREATE POLICY "Allow public read access on references" ON "references" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on references" ON "references" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on references" ON "references" FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on references" ON "references" FOR DELETE USING (true);

CREATE POLICY "Allow public read access on comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on comments" ON comments FOR DELETE USING (true);

CREATE POLICY "Allow public read access on versions" ON versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on versions" ON versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on versions" ON versions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on versions" ON versions FOR DELETE USING (true);
