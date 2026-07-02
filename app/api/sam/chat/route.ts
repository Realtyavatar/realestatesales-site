import { NextRequest, NextResponse } from "next/server";
import { buildSamSystemPrompt, SamContext, ChatMessage } from "@/lib/realtyavatar/chat";

export const dynamic = "force-dynamic";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ||
  process.env.REALTYAVATAR_ANTHROPIC_KEY || "";

export async function POST(req: NextRequest) {
  const { messages, context }: { messages: ChatMessage[]; context: SamContext } = await req.json();

  // Try to get Anthropic key from RealtyAvatar backend env
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ reply: "Sam is currently unavailable. Please contact the agent directly." });
  }

  const systemPrompt = buildSamSystemPrompt(context);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || "I'm having trouble responding right now.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "I'm having trouble connecting. Please try again." });
  }
}
