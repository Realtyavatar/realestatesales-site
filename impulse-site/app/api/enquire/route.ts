import { NextResponse } from "next/server";

// Sends the enquiry to the business inbox via Resend (same provider the
// impulse-reports app uses). Without RESEND_API_KEY configured we fail
// loudly so the visitor is told to call/email instead of the enquiry
// silently going nowhere.

const TO_EMAIL = process.env.ENQUIRY_TO_EMAIL || "info@impulseelectrical.com.au";
const FROM_EMAIL = process.env.ENQUIRY_FROM_EMAIL || "website@impulseelectrical.com.au";

type Enquiry = {
  name?: string;
  phone?: string;
  email?: string;
  suburb?: string;
  service?: string;
  message?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  let body: Enquiry;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 200);
  const phone = (body.phone || "").trim().slice(0, 50);
  const message = (body.message || "").trim().slice(0, 5000);
  if (!name || !phone || !message) {
    return NextResponse.json(
      { error: "Please fill in your name, phone and message." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Online enquiries aren't available right now." },
      { status: 503 }
    );
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Phone", phone],
    ["Email", (body.email || "—").trim().slice(0, 200)],
    ["Suburb", (body.suburb || "—").trim().slice(0, 200)],
    ["Service", (body.service || "—").trim().slice(0, 200)],
  ];

  const html = `
    <h2>New website enquiry</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="font-weight:bold;border:1px solid #ddd">${k}</td><td style="border:1px solid #ddd">${esc(v)}</td></tr>`
        )
        .join("")}
    </table>
    <h3>Message</h3>
    <p>${esc(message).replace(/\n/g, "<br>")}</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Impulse Electrical Website <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      reply_to: body.email?.trim() || undefined,
      subject: `Website enquiry from ${name}${body.suburb ? ` (${body.suburb.trim()})` : ""}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    return NextResponse.json(
      { error: "We couldn't send your enquiry just now." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
