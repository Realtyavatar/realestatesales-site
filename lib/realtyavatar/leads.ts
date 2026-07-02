/**
 * Lead capture service — wraps RealtyAvatar /api/leads endpoint
 *
 * Backend contract:
 *   POST /api/leads → create lead
 *   Payload: { name, email, phone, property, suburb, budget, requested, status, captured, notes }
 */

import { raPost } from "./client";

// ORG_ID is resolved in client.ts and passed here via the payload so the
// dashboard can file this lead under the correct agency.
const ORG_ID = process.env.REALTYAVATAR_ORG_ID || "1";

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  property?: string;
  suburb?: string;
  budget?: string;
  requested: string; // "Website Enquiry" | "Section 32" | "Contract" | "Inspection" | "Document Request"
  status?: string;
  notes?: string;
  source?: string; // "realestatesales.com.au"
}

export async function captureLead(payload: LeadPayload): Promise<{ id: string } | null> {
  try {
    const result = await raPost("/api/leads", {
      ...payload,
      orgId: ORG_ID,
      status: payload.status || "New",
      captured: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      notes: `Source: ${payload.source || "realestatesales.com.au"}\n${payload.notes || ""}`.trim(),
    });
    return result;
  } catch {
    // Silently fail — don't break UX if lead capture fails
    console.error("Lead capture failed");
    return null;
  }
}
