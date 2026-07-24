-- Share-to-Try-Next: bookmark provenance + multi inspiration source links
-- Private by default (RLS). Does not expose sources to feed/public profiles.

-- ─── Extend bookmarks ─────────────────────────────────────────────────────────
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'in_app';
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'linked';
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS source_platform TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS primary_source_title TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS primary_source_thumbnail_url TEXT;

-- Allow multiple link-only saves (null google_place_id) while keeping uniqueness for places.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookmarks_user_id_google_place_id_key'
  ) THEN
    ALTER TABLE bookmarks DROP CONSTRAINT bookmarks_user_id_google_place_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_google_place_unique
  ON bookmarks (user_id, google_place_id)
  WHERE google_place_id IS NOT NULL;

-- ─── saved_item_sources ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_item_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saved_restaurant_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  source_platform TEXT NOT NULL DEFAULT 'unknown',
  title TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, canonical_url)
);

CREATE INDEX IF NOT EXISTS idx_saved_item_sources_bookmark
  ON saved_item_sources (saved_restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_item_sources_user
  ON saved_item_sources (user_id, created_at DESC);

ALTER TABLE saved_item_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_item_sources_select_own" ON saved_item_sources;
CREATE POLICY "saved_item_sources_select_own" ON saved_item_sources
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_item_sources_insert_own" ON saved_item_sources;
CREATE POLICY "saved_item_sources_insert_own" ON saved_item_sources
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_item_sources_update_own" ON saved_item_sources;
CREATE POLICY "saved_item_sources_update_own" ON saved_item_sources
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_item_sources_delete_own" ON saved_item_sources;
CREATE POLICY "saved_item_sources_delete_own" ON saved_item_sources
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
