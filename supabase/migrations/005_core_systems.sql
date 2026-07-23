-- ForkLoop core systems: reviews, rankings, taste DNA, journal, saved restaurants
-- Run after 001-004. App maps users=profiles, dishes=dish_reviews, bookmarks=saved_restaurants.

-- ─── Extend restaurants ───────────────────────────────────────────────────────
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Extend reviews ───────────────────────────────────────────────────────────
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS price_level INTEGER CHECK (price_level BETWEEN 1 AND 4);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Extend dishes (dish_reviews) ─────────────────────────────────────────────
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Backfill dish user_id from parent review
UPDATE dishes d
SET user_id = r.user_id
FROM reviews r
WHERE d.review_id = r.id AND d.user_id IS NULL;

-- ─── Extend review_photos ─────────────────────────────────────────────────────
ALTER TABLE review_photos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

UPDATE review_photos rp
SET user_id = r.user_id
FROM reviews r
WHERE rp.review_id = r.id AND rp.user_id IS NULL;

-- ─── Extend bookmarks (saved_restaurants) ─────────────────────────────────────
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'want_to_try';
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- ─── Extend users (profiles) ──────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Compatibility views (spec naming) ────────────────────────────────────────
-- Fresh projects / templates sometimes leave a TABLE named profiles.
-- DROP VIEW fails with 42809 when the name is a table (IF EXISTS does not help).
DO $$
DECLARE
  obj TEXT;
  kind "char";
BEGIN
  FOREACH obj IN ARRAY ARRAY['profiles', 'dish_reviews', 'saved_restaurants'] LOOP
    SELECT c.relkind INTO kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = obj;

    IF kind = 'r' THEN
      EXECUTE format('DROP TABLE public.%I CASCADE', obj);
    ELSIF kind = 'v' THEN
      EXECUTE format('DROP VIEW public.%I CASCADE', obj);
    ELSIF kind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW public.%I CASCADE', obj);
    END IF;
  END LOOP;
END $$;

CREATE VIEW public.profiles AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  city,
  state,
  bio,
  favorite_cuisines,
  has_completed_taste_quiz,
  created_at,
  updated_at
FROM users;

CREATE VIEW public.dish_reviews AS
SELECT
  id,
  review_id,
  restaurant_id,
  user_id,
  name AS dish_name,
  rating AS dish_rating,
  notes AS dish_notes,
  is_best_dish AS is_favorite,
  photo_url,
  created_at
FROM dishes;

CREATE VIEW public.saved_restaurants AS
SELECT
  id,
  user_id,
  restaurant_id,
  google_place_id,
  place_name,
  place_address,
  place_city,
  place_cuisine,
  place_image_url,
  latitude,
  longitude,
  status,
  notes,
  created_at
FROM bookmarks;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX IF NOT EXISTS idx_dishes_user_id ON dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_visit_date ON reviews(visit_date DESC);

-- ─── RLS: dishes owned by review author ───────────────────────────────────────
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dishes are viewable by everyone" ON dishes;
CREATE POLICY "Dishes are viewable by everyone" ON dishes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own dishes" ON dishes;
CREATE POLICY "Users insert own dishes" ON dishes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users update own dishes" ON dishes;
CREATE POLICY "Users update own dishes" ON dishes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users delete own dishes" ON dishes;
CREATE POLICY "Users delete own dishes" ON dishes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
  );

-- ─── RLS: review_photos ───────────────────────────────────────────────────────
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review photos viewable by everyone" ON review_photos;
CREATE POLICY "Review photos viewable by everyone" ON review_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own review photos" ON review_photos;
CREATE POLICY "Users insert own review photos" ON review_photos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users delete own review photos" ON review_photos;
CREATE POLICY "Users delete own review photos" ON review_photos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid())
  );

-- ─── Updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS restaurants_updated_at ON restaurants;
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

