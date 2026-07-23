-- Savr Supabase Schema + RLS
-- Project: https://supabase.com/dashboard/project/ikevuuzfgyciqxrzgkbk
-- Run this entire file in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  city TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If a prior partial run left `users` without a PK, FKs fail with 42830.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.users ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  city TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  price_level INTEGER NOT NULL CHECK (price_level BETWEEN 1 AND 4),
  image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 10.0),
  rating_value DECIMAL(8,2) NOT NULL,
  rating_max INTEGER NOT NULL CHECK (rating_max BETWEEN 5 AND 1000),
  normalized_rating DECIMAL(5,2) NOT NULL CHECK (normalized_rating BETWEEN 0 AND 100),
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('private', 'friends', 'public')),
  food_quality DECIMAL(3,1) CHECK (food_quality BETWEEN 1.0 AND 10.0),
  service_score DECIMAL(3,1) CHECK (service_score BETWEEN 1.0 AND 10.0),
  atmosphere DECIMAL(3,1) CHECK (atmosphere BETWEEN 1.0 AND 10.0),
  value_score DECIMAL(3,1) CHECK (value_score BETWEEN 1.0 AND 10.0),
  rating_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  wait_time TEXT CHECK (wait_time IN ('under_15', '15_30', '30_60', 'over_60')),
  would_return BOOLEAN,
  would_recommend BOOLEAN,
  text TEXT DEFAULT '',
  visit_date DATE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating DECIMAL(3,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 10.0),
  rating_value DECIMAL(8,2) NOT NULL,
  rating_max INTEGER NOT NULL CHECK (rating_max BETWEEN 5 AND 1000),
  normalized_rating DECIMAL(5,2) NOT NULL CHECK (normalized_rating BETWEEN 0 AND 100),
  notes TEXT DEFAULT '',
  photo_url TEXT,
  is_best_dish BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS review_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  note TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_restaurant_uidx
  ON favorites (user_id, restaurant_id)
  WHERE restaurant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_dish_uidx
  ON favorites (user_id, dish_id)
  WHERE dish_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id ON restaurants(google_place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_review ON likes(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_review ON comments(review_id);
CREATE INDEX IF NOT EXISTS idx_dishes_review ON dishes(review_id);

-- ─── Auto-create profile on signup ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  IF base_username = '' THEN base_username := 'user'; END IF;
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.users (id, email, username, display_name, city, bio)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comparisons ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "profiles_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Restaurants (readable by all authenticated; anyone can add)
CREATE POLICY "restaurants_select" ON restaurants FOR SELECT TO authenticated USING (true);
CREATE POLICY "restaurants_insert" ON restaurants FOR INSERT TO authenticated WITH CHECK (true);

-- Reviews
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
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Dishes (visibility follows parent review)
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
CREATE POLICY "dishes_insert" ON dishes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));
CREATE POLICY "dishes_delete_own" ON dishes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));

-- Review photos (visibility follows parent review)
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
CREATE POLICY "review_photos_insert" ON review_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));
CREATE POLICY "review_photos_delete_own" ON review_photos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));

-- Favorites (owner-only)
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "follows_select" ON follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Likes
CREATE POLICY "likes_select" ON likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_select" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lists
CREATE POLICY "lists_select" ON lists FOR SELECT TO authenticated USING (is_public OR auth.uid() = user_id);
CREATE POLICY "lists_insert" ON lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_update_own" ON lists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lists_delete_own" ON lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- List items
CREATE POLICY "list_items_select" ON list_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM lists l WHERE l.id = list_id AND (l.is_public OR l.user_id = auth.uid())));
CREATE POLICY "list_items_insert" ON list_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM lists l WHERE l.id = list_id AND l.user_id = auth.uid()));
CREATE POLICY "list_items_delete_own" ON list_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM lists l WHERE l.id = list_id AND l.user_id = auth.uid()));

-- ─── Storage buckets ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "review_photos_storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'review-photos');

CREATE POLICY "review_photos_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "review_photos_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "avatars_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
