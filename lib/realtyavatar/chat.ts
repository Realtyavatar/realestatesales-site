/**
 * Sam Assistant chat service
 *
 * Backend contract (RealtyAvatar Regs AI / Widget endpoint):
 *   POST /api/regs (TradeGuard) — not applicable here
 *   For RealtyAvatar, we use the widget/chat API when available
 *   Fallback: call Anthropic directly for property Q&A
 *
 * Sam knows:
 * - Selected listing context
 * - Available documents for that listing
 * - Buyer details collected so far
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SamContext {
  listing?: {
    id: string;
    address: string;
    suburb: string;
    price: string;
    beds: number;
    baths: number;
    type: string;
  };
  availableDocs?: string[];
  agencyName?: string;
}

export async function chatWithSam(
  messages: ChatMessage[],
  context: SamContext
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_REALTYAVATAR_API_BASE || "https://realtyavatar-dashboard.vercel.app";
  const widgetKey = process.env.REALTYAVATAR_WIDGET_API_KEY;
  const orgId = process.env.REALTYAVATAR_ORG_ID || "1";

  // Try RealtyAvatar widget/chat endpoint
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (widgetKey) headers["x-widget-key"] = widgetKey;

    const res = await fetch(`${base}/api/widget/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, context, orgId, source: "realestatesales.com.au" }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply || data.message || "";
    }
  } catch {}

  // Fallback: call our own chat route
  try {
    const res = await fetch("/api/sam/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply || "";
    }
  } catch {}

  return "I'm having trouble connecting right now. Please try again shortly or contact the agent directly.";
}

export function buildSamSystemPrompt(context: SamContext): string {
  const listing = context.listing;
  const docs = context.availableDocs || [];
  const agency = context.agencyName || "the agency";

  let prompt = `You are Sam, a friendly and knowledgeable AI property assistant for ${agency} on realestatesales.com.au.

Your role is to help buyers find their perfect property, answer questions, and connect them with the right agent.

IMPORTANT RULES:
- Be warm, professional and helpful
- Keep responses concise (2-4 sentences max unless asked for more)
- Do NOT offer or mention Section 32, contracts, or property documents unless a specific property has been selected AND documents are confirmed available
- Always encourage buyers to book an inspection or speak with the agent for serious enquiries
- Collect buyer contact details naturally when they express strong interest`;

  if (listing) {
    prompt += `\n\nCURRENTLY SELECTED PROPERTY:
- Address: ${listing.address}, ${listing.suburb}
- Price: ${listing.price}
- Type: ${listing.type} | ${listing.beds} bed, ${listing.baths} bath
- The buyer is viewing this property`;

    if (docs.length > 0) {
      prompt += `\n\nAVAILABLE DOCUMENTS FOR THIS PROPERTY: ${docs.join(", ")}
You MAY offer these documents if the buyer asks. Collect their name and email before sending.`;
    } else {
      prompt += `\n\nDOCUMENTS: No documents have been uploaded for this property yet. If asked, say: "The agent hasn't uploaded documents for this property yet. I can let them know you're interested."`;
    }
  } else {
    prompt += `\n\nNo property is currently selected. Help the buyer search for properties. Do NOT mention documents or contracts.`;
  }

  return prompt;
}
