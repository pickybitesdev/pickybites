-- Explicit favorites for restaurants and dishes (not visited bookmarks)

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (restaurant_id IS NOT NULL AND dish_id IS NULL)
    OR (restaurant_id IS NULL AND dish_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_restaurant_uidx
  ON favorites (user_id, restaurant_id)
  WHERE restaurant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_dish_uidx
  ON favorites (user_id, dish_id)
  WHERE dish_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON favorites (user_id, created_at DESC);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Tighten dishes/photos SELECT to follow parent review visibility
DROP POLICY IF EXISTS "dishes_select" ON dishes;
CREATE POLICY "dishes_select_visibility" ON dishes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = dishes.review_id
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

DROP POLICY IF EXISTS "review_photos_select" ON review_photos;
CREATE POLICY "review_photos_select_visibility" ON review_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_photos.review_id
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
