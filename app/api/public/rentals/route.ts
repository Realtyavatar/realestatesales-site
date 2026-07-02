import { NextRequest, NextResponse } from "next/server";
import { raFetch } from "@/lib/realtyavatar/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const data = await raFetch("/api/rentals");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
