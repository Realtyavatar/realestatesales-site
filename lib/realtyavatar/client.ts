/**
 * RealtyAvatar API Client
 * Base client for all RealtyAvatar backend calls.
 * All API calls go through here — keeps logic out of UI components.
 */

const BASE = process.env.NEXT_PUBLIC_REALTYAVATAR_API_BASE ||
             process.env.REALTYAVATAR_API_BASE_URL ||
             "https://realtyavatar-dashboard.vercel.app";

// Widget API key — forwarded on all requests so the dashboard can verify
// the source and resolve orgId. Set via REALTYAVATAR_WIDGET_API_KEY env var.
const WIDGET_KEY = process.env.REALTYAVATAR_WIDGET_API_KEY || "";
const ORG_ID = process.env.REALTYAVATAR_ORG_ID || "1";

export async function raFetch(path: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-site-id": process.env.NEXT_PUBLIC_REALTYAVATAR_SITE_ID || "realestatesales-com-au",
    ...(options?.headers as Record<string, string> || {}),
  };
  // Forward widget key so dashboard can authenticate + resolve orgId
  if (WIDGET_KEY) headers["x-widget-key"] = WIDGET_KEY;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    next: { revalidate: 60 }, // cache 60s for SSR
  });
  if (!res.ok) throw new Error(`RealtyAvatar API ${path} failed: ${res.status}`);
  return res.json();
}

export async function raPost(path: string, body: unknown) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-site-id": process.env.NEXT_PUBLIC_REALTYAVATAR_SITE_ID || "realestatesales-com-au",
  };
  if (WIDGET_KEY) headers["x-widget-key"] = WIDGET_KEY;

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RealtyAvatar POST ${path} failed: ${res.status}`);
  return res.json();
}
