-- ============================================================
-- Nexro – Initial Database Schema
-- Run this in the Supabase SQL editor or via migrations
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── files ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Display name shown before access code entry
  name             TEXT         NOT NULL CHECK (char_length(name) <= 255),
  -- Sanitized original file name stored separately
  original_name    TEXT         NOT NULL,
  size             BIGINT       NOT NULL CHECK (size > 0),
  mime_type        TEXT         NOT NULL,

  -- Bcrypt hash of the access code (server never stores raw code)
  access_code_hash TEXT         NOT NULL,

  -- PBKDF2 salt (base64) – sent to client so it can derive the AES key
  salt             TEXT         NOT NULL,
  -- Base AES-GCM IV (base64) – sent to client for decryption
  iv               TEXT         NOT NULL,

  chunk_count      INTEGER      NOT NULL DEFAULT 1 CHECK (chunk_count >= 1),
  download_count   INTEGER      NOT NULL DEFAULT 0,
  max_downloads    INTEGER      CHECK (max_downloads IS NULL OR max_downloads > 0),

  expires_at       TIMESTAMPTZ,         -- NULL = never expire
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Path prefix in Supabase Storage bucket (e.g. "uploads/{id}")
  storage_path     TEXT         NOT NULL
);

-- ─── upload_sessions ─────────────────────────────────────────────────────────
-- Temporary record created at init; deleted after upload is completed.
CREATE TABLE IF NOT EXISTS upload_sessions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id          UUID         NOT NULL,
  expected_chunks  INTEGER      NOT NULL,
  -- Array of chunk indices that have been successfully uploaded
  received_chunks  INTEGER[]    NOT NULL DEFAULT '{}',
  ip_hash          TEXT         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '6 hours',
  completed        BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ─── access_attempts ─────────────────────────────────────────────────────────
-- Used for rate-limiting wrong access-code guesses.
CREATE TABLE IF NOT EXISTS access_attempts (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id      UUID         REFERENCES files(id) ON DELETE CASCADE,
  -- SHA-256(ip + salt) so we never store raw IPs
  ip_hash      TEXT         NOT NULL,
  attempted_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  success      BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_files_active
  ON files(id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_files_expires
  ON files(expires_at) WHERE is_deleted = FALSE AND expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_upload_sessions_file
  ON upload_sessions(file_id);

CREATE INDEX IF NOT EXISTS idx_access_attempts_lookup
  ON access_attempts(file_id, ip_hash, attempted_at);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- All access goes through API routes using the service-role key.
-- Anon clients have no direct table access.
ALTER TABLE files            ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_attempts  ENABLE ROW LEVEL SECURITY;

-- Deny all direct access (API routes use service role which bypasses RLS)
CREATE POLICY "no_anon_files"            ON files            USING (FALSE);
CREATE POLICY "no_anon_upload_sessions"  ON upload_sessions  USING (FALSE);
CREATE POLICY "no_anon_access_attempts"  ON access_attempts  USING (FALSE);

-- ─── Increment download count ────────────────────────────────────────────────
-- Called in the access route to atomically bump the counter.
CREATE OR REPLACE FUNCTION increment_download_count(file_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE files
  SET    download_count = download_count + 1
  WHERE  id = file_id AND is_deleted = FALSE
  RETURNING download_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- ─── Cleanup function ────────────────────────────────────────────────────────
-- Called by a cron endpoint to soft-delete expired/exhausted files.
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE files
  SET    is_deleted = TRUE
  WHERE  is_deleted = FALSE
    AND (
      (expires_at IS NOT NULL AND expires_at < NOW())
      OR
      (max_downloads IS NOT NULL AND download_count >= max_downloads)
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Prune old access attempts (keep 24 h)
  DELETE FROM access_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';

  -- Prune expired upload sessions
  DELETE FROM upload_sessions
  WHERE expires_at < NOW();

  RETURN deleted_count;
END;
$$;

-- ─── Supabase Storage bucket ──────────────────────────────────────────────────
-- Run this separately in the Supabase Storage UI or via the JS client:
--
--   await supabaseAdmin.storage.createBucket('encrypted-files', {
--     public: false,
--     fileSizeLimit: 10737418240,  -- 10 GB per chunk (adjust as needed)
--   });
--
-- Then add a storage policy that only allows service-role access:
--
--   CREATE POLICY "service_role_only" ON storage.objects
--     FOR ALL USING (auth.role() = 'service_role');
