# Share Intake — Native Spike Notes (Expo SDK 54)

## Library choice

Use **`expo-share-intent@5.1.1`** (peer: `expo@^54`).

Newer majors target SDK 55–57 and are **not** compatible with this project.

## What the library provides

| Platform | Capability |
|----------|------------|
| **iOS** | Share Extension target via config plugin; App Group handoff; URL + text shares |
| **Android** | `ACTION_SEND` / `text/plain` intent filter; cold + warm launch via Linking |

## Gaps / product rules we own in JS

1. **Consume-once** — library delivers the intent; we persist `IncomingSharedContent` in AsyncStorage and mark consumed only after save/cancel.
2. **Auth resume** — pending share survives login via `returnTo` + `pendingId`.
3. **No silent save** — always route to `/share-import` confirmation.
4. **Extension must stay light** — no API keys in the Share Extension; all Places/Yelp/OG work runs in the main app + Edge Functions.

## Required builds

- **Cannot test in Expo Go.**
- Use `eas build --profile development` (or preview/production).
- iOS: verify App Group `group.com.pickybites.app` + Share Extension signing on the same team.
- Android: verify `SEND` intent filter merged into `AndroidManifest.xml` after prebuild.

## App Group

Configured via plugin options in `app.json`:

- `iosAppGroupIdentifier`: `group.com.pickybites.app`

## Prebuild

Managed workflow — no committed `ios/` / `android/`. EAS runs prebuild; local debug:

```bash
npx expo prebuild --clean
```
