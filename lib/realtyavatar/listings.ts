/**
 * Listings service — wraps RealtyAvatar /api/listings endpoint
 *
 * Backend contract:
 *   GET  /api/listings          → array of listings
 *   GET  /api/listings/:id      → single listing
 *   GET  /api/listings?status=Active&search=x → filtered
 */

import { raFetch } from "./client";

export interface Listing {
  id: string;
  address: string;
  suburb: string;
  price: string;
  beds: number;
  baths: number;
  cars: number;
  type: string;
  status: string;
  agent: string;
  days: number;
  img?: string;
  created_at: string;
  // Extended fields (to be added to RealtyAvatar backend when ready)
  lat?: number;
  lng?: number;
  auction_time?: string;
  inspection_times?: string[];
  description?: string;
}

export async function getListings(params?: { status?: string; search?: string }): Promise<Listing[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    return await raFetch(`/api/listings${qs.toString() ? "?" + qs : ""}`);
  } catch {
    return MOCK_LISTINGS;
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    return await raFetch(`/api/listings/${id}`);
  } catch {
    return MOCK_LISTINGS.find(l => l.id === id) || null;
  }
}

export async function getActiveListings(): Promise<Listing[]> {
  return getListings({ status: "Active" });
}

// Mock fallback — used when RealtyAvatar backend is unavailable
export const MOCK_LISTINGS: Listing[] = [
  { id: "mock-1", address: "32 Ocean Parade", suburb: "Brighton VIC 3186", price: "$2,850,000", beds: 4, baths: 3, cars: 2, type: "House", status: "Active", agent: "Sam Banks", days: 5, created_at: new Date().toISOString() },
  { id: "mock-2", address: "7 Hillcrest Ave", suburb: "Toorak VIC 3142", price: "$4,200,000", beds: 5, baths: 4, cars: 3, type: "House", status: "Active", agent: "Jake Wilson", days: 8, created_at: new Date().toISOString() },
];
