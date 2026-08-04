# Launch runbook

Everything that has to happen outside the codebase to ship v1 to TestFlight and
Google Play closed testing. Steps are ordered by what blocks what.

---

## 1. Database — migration 011

```bash
supabase db push
```

Adds:

- `users.diet_preferences`, `budget_range`, `favorite_restaurant`, `food_goals`
  — the taste quiz previously stored steps 2-5 only in AsyncStorage, so answers
  were lost on reinstall and invisible to anything server-side.
- `is_username_available(candidate)` RPC — `SECURITY DEFINER`, granted to `anon`
  and `authenticated`, because the `profiles_select` policy is
  authenticated-only and signup runs while anonymous.
- A warning check that `public.users.id` still cascades from `auth.users`.
  Account deletion depends on that cascade; if the migration raises the warning,
  fix the FK before shipping deletion.

Verify:

```sql
select is_username_available('definitely_not_taken');  -- expect true
select is_username_available('Bad Name');             -- expect false (format)
```

## 2. Edge function — account deletion

Required by App Store Review Guideline 5.1.1(v) for any app with account
creation, and by Google Play's Data safety deletion policy.

```bash
supabase functions deploy delete-account
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically. Do **not** put the service role key in `.env` — it must
never reach the client bundle.

The function resolves the caller from their own JWT rather than trusting a user
id in the request body, purges their `avatars/<uid>/` and
`review-photos/<uid>/` prefixes (storage objects do not cascade), then calls
`auth.admin.deleteUser`.

Both buckets should exist. Storage cleanup is wrapped in try/catch so a missing
bucket will not block the deletion, but it will silently leave orphaned files.

Verify end to end with a throwaway account: Settings → Danger Zone → Delete
Account, then confirm the row is gone from `auth.users` and `public.users`.

## 3. Supabase Auth settings

**Redirect URLs** — Authentication → URL Configuration → Redirect URLs. Both are
needed; only the reset one was there before:

```
pickybites://reset-password
pickybites://login
```

Without `pickybites://login`, confirmation emails bounce to the default Site URL
(usually `localhost:3000`) and new users cannot finish signing up on a phone.

**Confirm email** — Authentication → Providers → Email.

The code now handles both settings correctly, so this is a product decision:

| | On (default) | Off |
|---|---|---|
| Signup | Two steps: create → tap email link | One tap, straight into the quiz |
| Play closed testing | Extra friction for all 12 testers | Fastest path to 12 opted-in |
| Junk accounts | Blocked | Possible |

If you turn it off, revisit before the public launch.

## 4. Build

```bash
eas build --platform all --profile production
```

Confirm before uploading:

- `EXPO_PUBLIC_ENABLE_DEMO` is **not** set for store builds. It gates the
  "Try Demo — Alex Rivera" button, which loads mock data and sets
  `useSupabase: false`. Shipping it means real users — and possibly an App
  Review tester — can end up reviewing a sandbox instead of the app.
- Google Places / Yelp keys are set as Supabase function secrets, not
  `EXPO_PUBLIC_*`.
- `RECORD_AUDIO` is gone from `app.json`. The app has no audio feature and an
  unjustified sensitive permission is an easy Play rejection.

## 5. Google Play — start this first

New **personal** developer accounts created after 2023-11-13 must run a
**closed** test with at least 12 testers opted in for 14 continuous days before
applying for production access. Organization accounts and older personal
accounts are exempt. Internal testing does **not** count toward the 14 days.

The clock only starts once 12 people have actually opted in and installed, so
upload the AAB to the closed track and send invites before anything else
tonight. Testers who merely receive an invite do not count.

Also required in Play Console:

- Data safety form, including the account-deletion path (step 2)
- Privacy policy URL — must be publicly reachable, matching `/privacy` in-app

## 6. Apple

TestFlight **internal** testing (up to 100 people on your team) needs a
processed build but no review, so it is the fastest way to get iOS testers.
External TestFlight needs Beta App Review. Full App Review is typically 1-2
days and does not gate on tester counts.

Before submitting:

- **Account deletion is reachable** — Settings → Danger Zone. This is the single
  most common rejection for apps with signup, and this build is the first to
  have it.
- App Privacy questionnaire matches what is actually collected: email, location
  (Discover), photos (reviews).
- Demo credentials in App Store Connect — use a **real** seeded account, not the
  mock demo button.
- Sign in with Apple is **not** required here, because the app offers no
  third-party login. If Google or Facebook sign-in is ever added, 5.1.1(iv)
  applies and Sign in with Apple becomes mandatory.
- Permission strings explain why, not just what. Current ones are in the
  `expo-location` and `expo-image-picker` plugin config in `app.json`.

## 7. Bundle identifier

`app.json` declares `com.pickybites.app` for both iOS and Android. Earlier work
used `com.hritishbhargava.FoodieNative`. If an App Store Connect record exists
under the old identifier, this is a **new app record**, not an update — it
cannot inherit the old one's reviews, TestFlight testers, or history. Confirm
which record you are shipping into before the first upload; the identifier
cannot be changed afterward.

---

## Verify before every submission

```bash
npx tsc --noEmit   # expect no output
npx jest           # expect 48 suites / 330 tests passing
```
