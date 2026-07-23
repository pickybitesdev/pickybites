-- Custom rating scales, visibility, dish scale fields, review comparisons, RLS

-- Reviews: custom scale + normalized 0–100 + visibility
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_value DECIMAL(8,2);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_max INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS normalized_rating DECIMAL(5,2);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'friends';

UPDATE reviews
SET
  rating_value = COALESCE(rating_value, rating),
  rating_max = COALESCE(rating_max, 10),
  normalized_rating = COALESCE(normalized_rating, LEAST(100, GREATEST(0, rating * 10)))
WHERE rating_value IS NULL OR rating_max IS NULL OR normalized_rating IS NULL;

ALTER TABLE reviews ALTER COLUMN rating_value SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN rating_max SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN normalized_rating SET NOT NULL;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_max_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_max_check
  CHECK (rating_max BETWEEN 5 AND 1000);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_normalized_rating_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_normalized_rating_check
  CHECK (normalized_rating BETWEEN 0 AND 100);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_visibility_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_visibility_check
  CHECK (visibility IN ('private', 'friends', 'public'));

CREATE INDEX IF NOT EXISTS reviews_restaurant_visibility_idx
  ON reviews (restaurant_id, visibility);
CREATE INDEX IF NOT EXISTS reviews_user_created_idx
  ON reviews (user_id, created_at DESC);

-- Dishes: same scale pattern
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS rating_value DECIMAL(8,2);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS rating_max INTEGER;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS normalized_rating DECIMAL(5,2);

UPDATE dishes
SET
  rating_value = COALESCE(rating_value, rating),
  rating_max = COALESCE(rating_max, 10),
  normalized_rating = COALESCE(normalized_rating, LEAST(100, GREATEST(0, rating * 10)))
WHERE rating_value IS NULL OR rating_max IS NULL OR normalized_rating IS NULL;

ALTER TABLE dishes ALTER COLUMN rating_value SET NOT NULL;
ALTER TABLE dishes ALTER COLUMN rating_max SET NOT NULL;
ALTER TABLE dishes ALTER COLUMN normalized_rating SET NOT NULL;

ALTER TABLE dishes DROP CONSTRAINT IF EXISTS dishes_rating_max_check;
ALTER TABLE dishes ADD CONSTRAINT dishes_rating_max_check
  CHECK (rating_max BETWEEN 5 AND 1000);

ALTER TABLE dishes DROP CONSTRAINT IF EXISTS dishes_normalized_rating_check;
ALTER TABLE dishes ADD CONSTRAINT dishes_normalized_rating_check
  CHECK (normalized_rating BETWEEN 0 AND 100);

-- Optional head-to-head comparison (does not affect public score)
CREATE TABLE IF NOT EXISTS review_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  current_restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  compared_restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN ('current', 'compared', 'equal')),
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id)
);

CREATE INDEX IF NOT EXISTS review_comparisons_review_idx ON review_comparisons (review_id);
CREATE INDEX IF NOT EXISTS review_comparisons_user_idx ON review_comparisons (user_id);

ALTER TABLE review_comparisons ENABLE ROW LEVEL SECURITY;

-- Visibility-aware review SELECT (replace blanket public read)
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select_visibility" ON reviews
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR visibility = 'public'
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = reviews.user_id
      )
    )
  );

-- Comparisons: owner CRUD; SELECT if can see parent review
CREATE POLICY "review_comparisons_select" ON review_comparisons
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_comparisons.review_id
        AND (
          r.user_id = auth.uid()
          OR r.visibility = 'public'
          OR (
            r.visibility = 'friends'
            AND EXISTS (
              SELECT 1 FROM follows f
              WHERE f.follower_id = auth.uid() AND f.following_id = r.user_id
            )
          )
        )
    )
  );

CREATE POLICY "review_comparisons_insert" ON review_comparisons
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_comparisons_update" ON review_comparisons
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "review_comparisons_delete" ON review_comparisons
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
