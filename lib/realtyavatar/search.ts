/**
 * AI Search service
 *
 * Backend contract (to be implemented in RealtyAvatar):
 *   POST /api/ai-search
 *   Body: { prompt: string, context?: string }
 *   Response: { intent: string, suburb?: string, beds?: number, type?: string, priceMax?: number, listings: Listing[] }
 *
 * Fallback: parse prompt client-side and filter local listings
 */

import { Listing, getListings } from "./listings";

export interface SearchIntent {
  suburb?: string;
  beds?: number;
  type?: string;
  priceMax?: number;
  keywords: string[];
}

export interface SearchResult {
  intent: SearchIntent;
  listings: Listing[];
  fromAI: boolean;
}

// Parse prompt into intent locally (fallback when no AI endpoint)
function parsePrompt(prompt: string): SearchIntent {
  const lower = prompt.toLowerCase();
  const intent: SearchIntent = { keywords: prompt.split(" ").filter(w => w.length > 2) };

  // Extract bed count
  const bedMatch = lower.match(/(\d)\s*(?:bed|bedroom)/);
  if (bedMatch) intent.beds = parseInt(bedMatch[1]);

  // Extract property type
  if (lower.includes("house")) intent.type = "House";
  else if (lower.includes("apartment") || lower.includes("unit")) intent.type = "Apartment";
  else if (lower.includes("townhouse")) intent.type = "Townhouse";

  // Extract price
  const priceMatch = lower.match(/under\s*\$?([\d,]+[km]?)/);
  if (priceMatch) {
    let p = priceMatch[1].replace(",", "");
    if (p.endsWith("m")) p = String(parseFloat(p) * 1000000);
    else if (p.endsWith("k")) p = String(parseFloat(p) * 1000);
    intent.priceMax = parseInt(p);
  }

  // Extract suburb (capitalised words not matching keywords)
  const knownWords = ["bedroom","bathroom","house","apartment","unit","townhouse","under","buy","rent","find","looking","need","want","for","sale","with","garage","pool"];
  const words = prompt.split(" ").filter(w => w.length > 2 && !knownWords.includes(w.toLowerCase()) && /^[A-Z]/.test(w));
  if (words.length > 0) intent.suburb = words.join(" ");

  return intent;
}

function filterListings(listings: Listing[], intent: SearchIntent): Listing[] {
  return listings.filter(l => {
    if (intent.beds && l.beds < intent.beds) return false;
    if (intent.type && l.type !== intent.type) return false;
    if (intent.suburb && !`${l.address} ${l.suburb}`.toLowerCase().includes(intent.suburb.toLowerCase())) return false;
    return true;
  });
}

export async function aiSearch(prompt: string): Promise<SearchResult> {
  // Try RealtyAvatar AI search endpoint first
  try {
    const base = process.env.NEXT_PUBLIC_REALTYAVATAR_API_BASE || "https://realtyavatar-dashboard.vercel.app";
    const res = await fetch(`${base}/api/ai-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, source: "realestatesales.com.au" }),
    });
    if (res.ok) {
      const data = await res.json();
      return { intent: data.intent || {}, listings: data.listings || [], fromAI: true };
    }
  } catch {}

  // Fallback: local parsing + filter
  const intent = parsePrompt(prompt);
  const all = await getListings();
  const filtered = filterListings(all, intent);
  return { intent, listings: filtered.length > 0 ? filtered : all, fromAI: false };
}
