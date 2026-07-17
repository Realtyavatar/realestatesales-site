// All site content lives here so copy changes never require touching layout
// code. Edit this file to update services, suburbs, reviews or contact info.

export const business = {
  name: "Impulse Electrical Contractors",
  shortName: "Impulse Electrical",
  phone: "0418 383 232",
  phoneHref: "tel:+61418383232",
  email: "info@impulseelectrical.com.au",
  baseUrl: "https://impulseelectrical.com.au",
  locality: "Dromana",
  region: "VIC",
  postcode: "3936",
  rec: "REC 25266",
  licence: "A-Grade Licence A53308",
  insurance: "$25M public liability insurance",
  yearsExperience: "10+ years",
  serviceAreaBlurb: "Servicing the entire Mornington Peninsula, Frankston to Portsea",
};

export type Service = {
  slug: string;
  title: string;
  short: string; // card blurb
  icon: string; // key into components/icons.tsx
  hero: string; // intro paragraph on the service page
  points: string[]; // what's included
  faq?: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "emergency-electrician",
    title: "24/7 Emergency Call-Outs",
    short:
      "Lost power, burning smell, tripping switchboard? We answer around the clock, every day of the year.",
    icon: "alert",
    hero: "Electrical faults don't keep business hours. Whether the power's gone out during dinner, a storm has taken down half the house, or your switchboard won't stop tripping, Impulse Electrical runs a genuine 24/7 emergency call-out service across the Mornington Peninsula.",
    points: [
      "Genuine 24/7 availability — nights, weekends and public holidays",
      "Fast response across the Peninsula, Frankston to Portsea",
      "Power loss, tripping circuits, burning smells, storm damage",
      "Safe fault isolation first, then a clear plan and price for repair",
      "Fully licensed and insured — a Certificate of Electrical Safety with every job",
    ],
    faq: [
      {
        q: "What counts as an electrical emergency?",
        a: "Anything that's unsafe or leaves you without power: a switchboard that keeps tripping, sparking or burning smells from outlets, exposed wiring, storm or water damage to electrics, or total loss of power when the network isn't at fault. If you're not sure, call — we'll tell you honestly whether it can wait.",
      },
      {
        q: "How fast can you get to me?",
        a: "We're based on the Peninsula, so response times are usually well under what a Melbourne-based service can offer. Call 0418 383 232 and we'll give you a realistic ETA on the spot.",
      },
    ],
  },
  {
    slug: "switchboard-upgrades",
    title: "Switchboard Upgrades",
    short:
      "Replace old fuse boxes with modern safety switches that protect your family, appliances and home.",
    icon: "switchboard",
    hero: "Older homes across the Peninsula still run on ceramic fuses and switchboards that were never designed for today's loads — air conditioning, induction cooktops, EV chargers and pool equipment. A modern switchboard with RCD safety switches on every circuit is the single biggest safety upgrade you can make to your home.",
    points: [
      "Full switchboard replacements with safety switches (RCDs) on every circuit",
      "Rewireable fuse and asbestos-panel board replacements",
      "Extra capacity for air conditioning, EV chargers and pool equipment",
      "Fault-level testing and clear labelling on every board",
      "Certificate of Electrical Safety issued on completion",
    ],
    faq: [
      {
        q: "How do I know if my switchboard needs upgrading?",
        a: "Warning signs include ceramic or rewireable fuses, no safety switches, frequent tripping, flickering lights, or any warmth or buzzing from the board. If your home is more than 25 years old and the board has never been touched, it's worth an inspection.",
      },
      {
        q: "How long does a switchboard upgrade take?",
        a: "Most straightforward residential upgrades are done in a day, with power off for only part of it. We confirm the scope and timing before any work starts.",
      },
    ],
  },
  {
    slug: "ev-charger-installation",
    title: "EV Charger Installation",
    short:
      "Home and workplace EV charging installed properly — load-assessed, safe and ready for your car.",
    icon: "ev",
    hero: "Charging from a standard power point is slow and pushes circuits that were never designed for it. We install dedicated EV chargers for homes and businesses across the Peninsula — properly load-assessed, on their own protected circuit, and set up for the car you actually drive.",
    points: [
      "Single-phase and three-phase home charger installations",
      "Load assessment so your switchboard and supply can handle charging",
      "Dedicated protected circuits — no overloaded power points",
      "Workplace and fleet charging for commercial premises",
      "All major charger brands supplied or install of your own unit",
    ],
    faq: [
      {
        q: "Can my house handle an EV charger?",
        a: "Most can, but it depends on your supply and switchboard. We check your existing load and board capacity first, and if an upgrade is needed we'll quote it up front — no surprises after the fact.",
      },
    ],
  },
  {
    slug: "lighting",
    title: "Lighting & LED Upgrades",
    short:
      "LED downlights, feature lighting and full lighting design for renovations and new builds.",
    icon: "bulb",
    hero: "Good lighting changes how a home feels — and switching old halogens to LED pays for itself on the power bill. From swapping tired downlights through to complete lighting design for a renovation or new build, we handle supply, layout and installation.",
    points: [
      "Halogen-to-LED downlight conversions",
      "Lighting design for renovations and new builds",
      "Feature, pendant and strip lighting installation",
      "Dimmers, sensors and smart lighting control",
      "Energy-efficient options that cut running costs",
    ],
  },
  {
    slug: "outdoor-garden-lighting",
    title: "Outdoor & Garden Lighting",
    short:
      "Garden, deck, pool and security lighting that makes Peninsula outdoor living usable all year.",
    icon: "tree",
    hero: "Peninsula homes are built around outdoor living — decks, gardens, pools and long summer evenings. Well-planned outdoor lighting makes those spaces usable after dark, adds real security, and lifts the look of the whole property. Everything we install outdoors is rated for coastal weather.",
    points: [
      "Garden, path and feature lighting design and installation",
      "Deck, alfresco and entertaining-area lighting",
      "Pool and water-feature lighting",
      "Sensor and security floodlighting",
      "Weatherproof, coastal-rated fittings and wiring",
    ],
  },
  {
    slug: "commercial-electrical",
    title: "Commercial Electrical",
    short:
      "Fit-outs, maintenance and emergency support for shops, hospitality, strata and light industrial.",
    icon: "building",
    hero: "We look after commercial clients across the Peninsula — retailers, cafes and restaurants, property managers, strata buildings and light industrial sites. That means scheduled maintenance you can rely on, fit-out work delivered on program, and an emergency number that actually answers when something stops your business.",
    points: [
      "Shop and office fit-outs and de-fits",
      "Scheduled maintenance for strata and property managers",
      "Emergency lighting and exit light testing",
      "Test and tag, safety inspections and compliance",
      "Three-phase power, machinery and light industrial work",
    ],
  },
  {
    slug: "residential-electrical",
    title: "Residential Electrical",
    short:
      "Power points, fault finding, ceiling fans, smoke alarms, renovations — all the everyday jobs, done properly.",
    icon: "home",
    hero: "The bread and butter of what we do: every electrical job a Peninsula home needs, done safely, tidily and to standard. No job is too small — and because we're local, you're not paying Melbourne travel time for a couple of power points.",
    points: [
      "Extra power points, USB outlets and circuit additions",
      "Fault finding and repairs",
      "Ceiling fans, exhaust fans and appliance connections",
      "Smoke alarm installation and compliance",
      "Renovation and extension wiring, new builds",
    ],
  },
  {
    slug: "safety-inspections",
    title: "Safety Inspections & Fault Finding",
    short:
      "Pre-purchase checks, rental compliance and tracking down the fault that keeps tripping your power.",
    icon: "shield",
    hero: "Whether you're buying a home, managing a rental with compliance obligations, or chasing a nuisance fault that keeps tripping the power, a proper inspection by an A-Grade electrician gives you a straight answer about what's actually going on behind the walls.",
    points: [
      "Pre-purchase electrical inspections",
      "Rental property electrical safety checks (Victorian compliance)",
      "Smoke alarm testing and replacement",
      "Systematic fault finding for tripping circuits",
      "Written reports and a Certificate of Electrical Safety where applicable",
    ],
  },
];

// Suburb list drives the /areas pages. Grouped roughly north to south.
export const suburbs: string[] = [
  "Mount Eliza",
  "Frankston",
  "Langwarrin",
  "Baxter",
  "Somerville",
  "Tyabb",
  "Moorooduc",
  "Mornington",
  "Mount Martha",
  "Hastings",
  "Bittern",
  "Crib Point",
  "Somers",
  "Balnarring",
  "Merricks",
  "Red Hill",
  "Main Ridge",
  "Shoreham",
  "Flinders",
  "Dromana",
  "Safety Beach",
  "Arthurs Seat",
  "McCrae",
  "Rosebud",
  "Capel Sound",
  "Boneo",
  "Cape Schanck",
  "Tootgarook",
  "Rye",
  "St Andrews Beach",
  "Fingal",
  "Blairgowrie",
  "Sorrento",
  "Portsea",
];

export function suburbSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function suburbFromSlug(slug: string): string | undefined {
  return suburbs.find((s) => suburbSlug(s) === slug);
}

// Real reviews only. Add more here as they come in (Google, Facebook,
// service.com.au) — each needs the quote and where it was left.
export const reviews = [
  {
    quote:
      "Sam was fantastic. Arrived on time, completed the work efficiently and left the job site spotless.",
    source: "Review via service.com.au",
  },
];
