import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;
const MAX_BODY = 256 * 1024;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // Literal IPs
  const ipv4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

function assertSafeHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
  if (!url.hostname || isPrivateHostname(url.hostname)) throw new Error("SSRF_BLOCKED");
  return url;
}

async function fetchWithGuards(startUrl: string): Promise<{ finalUrl: string; html: string }> {
  let current = assertSafeHttpsUrl(startUrl).toString();
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "PickyBitesShareBot/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timer);

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get("location");
        if (!loc) throw new Error("REDIRECT_FAILED");
        const next = new URL(loc, current).toString();
        assertSafeHttpsUrl(next);
        current = next;
        continue;
      }

      if (!res.ok) throw new Error("FETCH_FAILED");
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_BODY) throw new Error("BODY_TOO_LARGE");
      const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      return { finalUrl: current, html };
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  return html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null;
}

function extractTitle(html: string): string | null {
  const og = metaContent(html, "og:title");
  if (og) return decodeHtml(og);
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return t ? decodeHtml(t.trim()) : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractJsonLdRestaurant(html: string): { name?: string; address?: string } | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of blocks) {
    try {
      const data = JSON.parse(m[1]!);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const type = item["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.some((t: string) => /Restaurant|FoodEstablishment/i.test(String(t)))) {
          const addr = item.address;
          const address =
            typeof addr === "string"
              ? addr
              : [addr?.streetAddress, addr?.addressLocality, addr?.addressRegion]
                  .filter(Boolean)
                  .join(", ");
          return { name: item.name, address: address || undefined };
        }
      }
    } catch {
      // ignore bad JSON-LD
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const action = body.action as string;
    const url = body.url as string;

    if (action === "expandUrl" || action === "fetchMetadata") {
      assertSafeHttpsUrl(url);
      const { finalUrl, html } = await fetchWithGuards(url);
      if (action === "expandUrl") {
        return json({ expandedUrl: finalUrl });
      }
      const ld = extractJsonLdRestaurant(html);
      return json({
        title: extractTitle(html),
        description: metaContent(html, "og:description") || metaContent(html, "description"),
        image: metaContent(html, "og:image"),
        canonicalUrl:
          html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
          metaContent(html, "og:url"),
        expandedUrl: finalUrl,
        restaurantName: ld?.name ?? null,
        address: ld?.address ?? null,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    const code =
      msg === "SSRF_BLOCKED" ||
      msg === "HTTPS_REQUIRED" ||
      msg === "INVALID_URL" ||
      msg === "TOO_MANY_REDIRECTS" ||
      msg === "BODY_TOO_LARGE"
        ? msg
        : "FETCH_FAILED";
    return json({ error: code }, 400);
  }
});
