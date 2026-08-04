// delete-account
//
// Permanently deletes the calling user's auth record. Required by App Store
// Review Guideline 5.1.1(v) for any app that supports account creation, and by
// Google Play's Data safety deletion requirements.
//
// Deleting from auth.users cascades through public.users into every user-owned
// table. Storage objects do not cascade, so they are removed explicitly first.
//
// Deploy:
//   supabase functions deploy delete-account
// The SERVICE_ROLE key is injected automatically; do not add it to .env.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Remove every object under `prefix` in `bucket`. Best effort. */
async function purgePrefix(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
) {
  try {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data?.length) return;

    const files: string[] = [];
    for (const entry of data) {
      // A null id means it's a folder; recurse one level (review-photos/<uid>/<reviewId>/).
      if (entry.id === null) {
        const { data: nested } = await admin.storage
          .from(bucket)
          .list(`${prefix}/${entry.name}`, { limit: 1000 });
        for (const child of nested ?? []) {
          files.push(`${prefix}/${entry.name}/${child.name}`);
        }
      } else {
        files.push(`${prefix}/${entry.name}`);
      }
    }
    if (files.length) await admin.storage.from(bucket).remove(files);
  } catch {
    // Never block account deletion on storage cleanup.
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return json({ error: "Function is not configured" }, 500);
  }

  // Resolve the caller from their own JWT — never trust a user id from the body.
  const scoped = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await scoped.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ error: "Invalid or expired session" }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  await purgePrefix(admin, "avatars", user.id);
  await purgePrefix(admin, "review-photos", user.id);

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ error: deleteError.message }, 500);

  return json({ ok: true });
});
