#!/usr/bin/env bash
# One-time / update Secrets for Places + Yelp Edge Functions.
# Usage (from repo root, after `supabase login` + `supabase link`):
#
#   ./scripts/setup-api-secrets.sh
#
# You will be prompted for keys — nothing is printed back or committed.

set -euo pipefail

echo "Set GOOGLE_PLACES_API_KEY (Supabase secret for functions/places)…"
read -r -s -p "Google Places API key: " GOOGLE_KEY
echo
if [[ -n "${GOOGLE_KEY}" ]]; then
  supabase secrets set "GOOGLE_PLACES_API_KEY=${GOOGLE_KEY}"
else
  echo "Skipped Google Places secret."
fi

echo "Set YELP_API_KEY (Supabase secret for functions/yelp)…"
read -r -s -p "Yelp Fusion API key: " YELP_KEY
echo
if [[ -n "${YELP_KEY}" ]]; then
  supabase secrets set "YELP_API_KEY=${YELP_KEY}"
else
  echo "Skipped Yelp secret."
fi

echo "Deploy Edge Functions…"
supabase functions deploy places
supabase functions deploy yelp

echo "Done. Do not put YELP_API_KEY in Expo .env (EXPO_PUBLIC_*)."
