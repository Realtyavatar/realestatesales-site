import { NextResponse } from "next/server";
import { getListings } from "@/lib/realtyavatar/listings";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await getListings();
  return NextResponse.json(listings);
}
