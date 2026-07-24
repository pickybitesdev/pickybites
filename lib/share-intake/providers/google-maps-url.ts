/** Parse Google Maps share URLs for place id / query / coords hints. */

export type GoogleMapsUrlHints = {
  placeId: string | null;
  query: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string | null;
};

export function parseGoogleMapsUrl(raw: string): GoogleMapsUrlHints | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const isMaps =
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    (host.endsWith("google.com") && url.pathname.includes("/maps"));
  if (!isMaps) return null;

  let placeId: string | null = null;
  let query: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;
  let name: string | null = null;

  const placeMatch = url.pathname.match(/place\/([^/]+)/i);
  if (placeMatch?.[1]) {
    name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  }

  const dataPlace = url.pathname.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  if (dataPlace?.[1]) placeId = dataPlace[1];

  const q = url.searchParams.get("q") || url.searchParams.get("query");
  if (q) {
    query = q;
    const coord = q.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coord) {
      latitude = Number(coord[1]);
      longitude = Number(coord[2]);
    } else if (!name) {
      name = q;
    }
  }

  const placeIdParam = url.searchParams.get("place_id") || url.searchParams.get("ftid");
  if (placeIdParam) placeId = placeIdParam;

  const atMatch = url.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    latitude = Number(atMatch[1]);
    longitude = Number(atMatch[2]);
  }

  return { placeId, query, latitude, longitude, name };
}
