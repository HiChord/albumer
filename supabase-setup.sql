-- Create tables for Albumer
CREATE TABLE albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lyrics TEXT DEFAULT '',
  lyrics_user TEXT,
  lyrics_updated_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  notes_user TEXT,
  notes_updated_at TIMESTAMPTZ,
  progress TEXT DEFAULT 'Not Started',
  "order" INTEGER NOT NULL,
  album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  external_id TEXT,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE references (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  "user" TEXT,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL,
  text TEXT NOT NULL,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  changes TEXT NOT NULL,
  comment TEXT NOT NULL,
  "user" TEXT NOT NULL,
  snapshot TEXT,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_files_song_id ON files(song_id);
CREATE INDEX idx_references_song_id ON references(song_id);
CREATE INDEX idx_comments_song_id ON comments(song_id);
CREATE INDEX idx_versions_song_id ON versions(song_id);

-- Enable Row Level Security (but allow all operations for now - no auth)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations without authentication
CREATE POLICY "Allow all on albums" ON albums FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on songs" ON songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on files" ON files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on references" ON references FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on versions" ON versions FOR ALL USING (true) WITH CHECK (true);
