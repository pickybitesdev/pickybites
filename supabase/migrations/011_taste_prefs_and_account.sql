-- 011_taste_prefs_and_account.sql
--
-- 1. Persist the full taste quiz server-side. Steps 2-5 (diet, budget,
--    favorite restaurant, food goals) previously lived only in AsyncStorage,
--    so they were lost on reinstall and invisible to any server-side
--    recommendation logic.
-- 2. Username availability RPC, so signup can tell the user a handle is taken
--    instead of silently renaming them via handle_new_user().
-- 3. Verify the cascade path used by account deletion.

-- ─── 1. Taste preferences ────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_preferences TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_range SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_restaurant TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS food_goals TEXT[] DEFAULT '{}';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_budget_range_check;
ALTER TABLE users
  ADD CONSTRAINT users_budget_range_check
  CHECK (budget_range IS NULL OR budget_range BETWEEN 1 AND 4);

-- ─── 2. Username availability ────────────────────────────────────────────────

-- SECURITY DEFINER because the `profiles_select` policy is authenticated-only
-- and signup runs while anonymous. Returns a bare boolean and never exposes
-- which account holds the name.
CREATE OR REPLACE FUNCTION public.is_username_available(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := LOWER(TRIM(COALESCE(candidate, '')));

  -- Reject malformed handles outright so the client and DB agree on the rules.
  IF normalized !~ '^[a-z0-9_]{3,20}$' THEN
    RETURN FALSE;
  END IF;

  RETURN NOT EXISTS (SELECT 1 FROM public.users WHERE username = normalized);
END;
$$;

REVOKE ALL ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;

-- ─── 3. Account deletion cascade ─────────────────────────────────────────────

-- public.users.id references auth.users(id) ON DELETE CASCADE, and every
-- user-owned table references public.users(id) ON DELETE CASCADE, so deleting
-- the auth user removes all app rows. The `delete-account` edge function does
-- the auth.users delete with the service role key.
--
-- Storage objects are NOT covered by the cascade; the edge function removes the
-- user's avatar and review-photo prefixes explicitly.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND confrelid = 'auth.users'::regclass
      AND confdeltype = 'c'
  ) THEN
    RAISE WARNING 'public.users.id is not ON DELETE CASCADE from auth.users — account deletion will leave orphaned rows.';
  END IF;
END $$;
