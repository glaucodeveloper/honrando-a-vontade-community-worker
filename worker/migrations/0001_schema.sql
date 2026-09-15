PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK(status IN ('incomplete','pending','approved','rejected','private')),
  display_name TEXT,
  city TEXT,
  writing_genres TEXT,
  writing_style TEXT,
  goals TEXT,
  reading_preferences TEXT,
  bio TEXT,
  style_summary TEXT,
  photo_key TEXT,
  public_consent INTEGER NOT NULL DEFAULT 0 CHECK(public_consent IN (0,1)),
  approved_at TEXT
);

CREATE TABLE IF NOT EXISTS community_sessions (
  session_hash TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'display_name',
  turnstile_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_sessions_member ON community_sessions(member_id);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  location TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK(status IN ('scheduled','cancelled','finished')),
  visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

CREATE TABLE IF NOT EXISTS reading_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  tags TEXT,
  notes TEXT,
  url TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reading_active ON reading_catalog(active);
