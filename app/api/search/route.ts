import { NextRequest, NextResponse } from "next/server";
import { aiSearch } from "@/lib/realtyavatar/search";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const result = await aiSearch(prompt || "");
  return NextResponse.json(result);
}
