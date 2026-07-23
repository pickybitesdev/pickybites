-- =============================================================================
-- Run this FIRST in SQL Editor on a fresh/broken project, then run schema.sql
-- Safe for empty projects. Wipes public app tables if a partial run left junk.
-- =============================================================================

DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.list_items CASCADE;
DROP TABLE IF EXISTS public.lists CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.review_photos CASCADE;
DROP TABLE IF EXISTS public.review_comparisons CASCADE;
DROP TABLE IF EXISTS public.dishes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.list_collaborators CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Confirm users is gone (should return 0 rows)
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';
