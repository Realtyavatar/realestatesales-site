import { NextRequest, NextResponse } from "next/server";
import { captureLead } from "@/lib/realtyavatar/leads";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { body = await req.json(); } catch {}
  } else {
    try { body = Object.fromEntries((await req.formData()).entries()) as Record<string, string>; } catch {}
  }

  await captureLead({
    name: body.name || "Website Enquiry",
    email: body.email || "",
    phone: body.phone || "",
    property: body.property || "",
    requested: body.requested || "Website Enquiry",
    notes: body.message || "",
    source: "realestatesales.com.au",
  });

  // If JSON request return JSON, else redirect
  if (ct.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(new URL("/enquiry-sent", req.url), 303);
}
