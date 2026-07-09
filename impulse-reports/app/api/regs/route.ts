import { NextRequest, NextResponse } from "next/server";

const CURATED: { keywords: string[]; content: string }[] = [
  {
    keywords: ["switchboard", "switchroom", "distribution board", "mdb", "main switch"],
    content: `SWITCHBOARD REQUIREMENTS (AS/NZS 3000:2018):
- Cl 2.10.3: Min 600mm clear working space in front of any switchboard
- Cl 2.10.3.3: Switchboards must be in accessible, dry, ventilated locations
- Cl 2.10.4: Enclosures must be IP2X minimum; outdoor IP44 minimum
- Cl 2.10.6: All circuits must be labelled clearly and permanently
- Cl 7.5: RCD protection required on all final subcircuits in dwellings (new work from 2018)
- VIC ESV: All new/upgraded switchboards in dwellings must have whole-of-switchboard RCD protection`,
  },
  {
    keywords: ["rcd", "residual current", "safety switch", "earth leakage"],
    content: `RCD REQUIREMENTS (AS/NZS 3000:2018 + VIC):
- Cl 2.6.3: RCDs ≤30mA required on all socket outlet circuits and lighting circuits in dwellings (new work)
- Cl 7.5.3: All final subcircuits in new domestic installations must be RCD protected
- VIC ESV: Whole-of-switchboard RCD (Type S or selective) mandatory on new installations
- Trip test: RCDs must be tested on installation and annually
- Min 2 RCDs recommended to avoid whole-house loss on trip`,
  },
  {
    keywords: ["earthing", "earth electrode", "earth stake", "main earthing", "MEN", "neutral earth"],
    content: `EARTHING REQUIREMENTS (AS/NZS 3000:2018):
- Cl 5.4: Main earthing conductor must be sized per Table 5.1 (min 6mm² Cu for most dwellings)
- Cl 5.6: Earth electrode resistance must not exceed 1 Ω without supplementary electrode
- Cl 5.5.2: Main earth electrode: min 1.2m driven rod, or ring electrode, or structural steel
- Cl 5.7: MEN (Multiple Earthed Neutral) link must be at the point of supply only
- Testing: Earth electrode resistance tested by fall-of-potential or clamp method
- Label: Main earthing conductor must be green/yellow and labelled at both ends`,
  },
  {
    keywords: ["cable", "wiring", "conductor", "wire size", "current rating", "cable size"],
    content: `CABLE SIZING (AS/NZS 3000:2018):
- Table 4.1: Reference method determines current-carrying capacity
- Cl 4.3.2: Cables must be derated for ambient temp, grouping, and installation method
- Min 1.0mm² for lighting, 2.5mm² for socket outlets (domestic)
- Cl 4.4: Voltage drop must not exceed 5% from supply to any point of use
- Cl 4.5: Mechanical protection required in concealed locations (conduit or armoured cable)
- All wiring must comply with AS/NZS 5000 series`,
  },
  {
    keywords: ["smoke alarm", "smoke detector"],
    content: `SMOKE ALARM (VIC + AS/NZS 3786:2014):
- VIC: All dwellings must have smoke alarms on every level and in every bedroom corridor
- New builds: Hardwired (240V) with battery backup, photoelectric type
- Existing dwellings: Battery-only acceptable if hardwiring is not practical
- AS/NZS 3786:2014: Must be photoelectric (ionisation not recommended)
- Min 300mm from walls, corners, and light fittings
- AS/NZS 3000 Cl 4.6: Smoke alarm circuit must be on a lighting or dedicated circuit with RCD`,
  },
  {
    keywords: ["pool", "spa", "swimming pool", "equipotential", "bonding"],
    content: `POOL/SPA ELECTRICAL (AS/NZS 3000:2018 Cl 7.6):
- Cl 7.6.2: All metalwork within 1.5m of pool edge (horizontally) and 3.5m vertically must be bonded
- Equipotential bonding conductor: min 4mm² Cu, green/yellow
- No 240V socket outlets within 3.5m of pool edge
- Low-voltage luminaires (12V/24V) required within 1.5m of water
- Pool pump circuits must be RCD protected
- Safety switch must be accessible without entering pool area`,
  },
];

function buildContext(question: string): string {
  const q = question.toLowerCase();
  return CURATED
    .filter((k) => k.keywords.some((kw) => q.includes(kw)))
    .map((k) => k.content)
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "No question provided" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Standards lookup not configured" }, { status: 501 });
  }

  const curated = buildContext(question);
  const system = `You are a trade compliance assistant for licensed electricians working in Victoria, Australia.

Primary standards: AS/NZS 3000:2018 Wiring Rules, AS/NZS 3008.1 Cable Selection, ESV (Energy Safe Victoria) requirements.
${curated ? `\nRELEVANT REFERENCE DATA:\n${curated}` : ""}

RULES:
1. Give a direct, practical answer — no refusals.
2. Always cite the clause number and standard inline, e.g. "AS/NZS 3000:2018 Cl 4.6 requires…"
3. Be specific: numbers, clearances, sizes, ratings.
4. Plain English — like a knowledgeable colleague on site.
5. Call out VIC-specific rules where they differ from national.
6. Keep answers under 200 words.
7. End with: 📚 [Standard name] — Cl [number]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: question.trim() }],
    }),
  });

  const data = await res.json();
  const answer = data.content?.[0]?.text ?? "No answer received.";
  return NextResponse.json({ answer });
}
