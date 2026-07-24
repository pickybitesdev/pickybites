# Share to Try Next — QA & Build Checklist

**Cannot be tested in Expo Go.** Use an EAS development/preview/production build.

## Build

```bash
# Apply DB migration (Supabase SQL editor or CLI)
# supabase/migrations/010_share_sources.sql

# Deploy edge function
npx supabase functions deploy share-resolve --project-ref <your-ref>

# Development client
eas build --profile development --platform ios
eas build --profile development --platform android
```

After install, confirm:

- [ ] iOS Share Extension target exists post-prebuild
- [ ] App Group `group.com.pickybites.app` (or plugin default) on app + extension
- [ ] AndroidManifest contains `ACTION_SEND` / `text/*` intent filter
- [ ] `patch-package` ran (`postinstall`) for xcode patch

## Manual matrix

### iOS Share Sheet

- [ ] PickyBites appears when sharing a URL from Safari
- [ ] Plain-text URL share works
- [ ] App closed → opens Import screen
- [ ] App backgrounded → opens Import screen
- [ ] App already open → opens Import screen
- [ ] Logged out → login → returns to `/share-import` with same pending share
- [ ] Cancel consumes pending share (not re-opened on next launch)
- [ ] Unsupported media (video file) does not crash / shows friendly error

### Android SEND

- [ ] PickyBites appears for text/plain shares
- [ ] EXTRA_TEXT parsed
- [ ] Cold launch / warm launch / activity recreation do not double-save
- [ ] Auth handoff preserves pending share
- [ ] Back / Cancel behavior

### Product flows

- [ ] Instagram / TikTok / YouTube / Maps / Yelp links reach confirmation (not silent save)
- [ ] Multiple candidates require explicit pick
- [ ] Unresolved → Search / Save Link Only
- [ ] Save to Try Next attaches source; duplicate restaurant adds second link
- [ ] Success: Continue Browsing / Open in PickyBites / View Try Next
- [ ] Try Next card shows “Saved from …”
- [ ] View Original opens source app or browser
- [ ] Remove source does not delete restaurant
- [ ] Sources never appear in Feed

### Security

- [ ] `javascript:` / `file:` / `http:` rejected
- [ ] share-resolve blocks private IPs / redirects
- [ ] No API secrets in Share Extension
- [ ] RLS: user A cannot read user B sources
