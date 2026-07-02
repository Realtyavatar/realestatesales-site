import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { PropertyCard } from "@/components/PropertyCard";
import { getListings } from "@/lib/realtyavatar/listings";
import { raFetch } from "@/lib/realtyavatar/client";
import HomeClient from "@/components/HomeClient";

async function getStats() {
  try {
    const [listings, rentals] = await Promise.all([
      raFetch("/api/listings"),
      raFetch("/api/rentals"),
    ]);
    return {
      listings: (listings as any[]).filter(l => l.status === "Active").length,
      rentals: (rentals as any[]).filter(r => r.status === "Available").length,
    };
  } catch { return { listings: 0, rentals: 0 }; }
}

export default async function Home() {
  const [stats, featured] = await Promise.all([getStats(), getListings({ status: "Active" })]);
  const featuredSlice = featured.slice(0, 6);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>

        {/* AI Search Hero */}
        <section style={{ background: "linear-gradient(160deg, #0F1923 0%, #1a2332 60%, #0F3460 100%)", padding: "70px 20px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "20%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(227,24,55,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(35,66,176,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(227,24,55,0.12)", border: "1px solid rgba(227,24,55,0.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, background: "#E31837", borderRadius: "50%", display: "inline-block" }} />
              <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 600 }}>AI-Powered Property Search</span>
            </div>

            <h1 style={{ fontSize: "clamp(34px,6vw,60px)", fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-1.5px", marginBottom: 16 }}>
              Find Your Perfect<br />
              <span style={{ color: "#E31837" }}>Property</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 17, marginBottom: 36, lineHeight: 1.6 }}>
              {stats.listings > 0 ? `${stats.listings} properties for sale · ${stats.rentals} rentals available` : "Browse the latest properties across Australia"}
            </p>

            {/* AI Search + Sam — client component */}
            <HomeClient listings={featuredSlice} />
            <a href="/map" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              🗺️ Or explore on the map →
            </a>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px", display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
            {[
              { n: `${stats.listings || "–"}`, label: "For Sale" },
              { n: `${stats.rentals || "–"}`, label: "For Rent" },
              { n: "Sam AI", label: "Property Assistant" },
              { n: "Free", label: "Enquiry Service" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#E31837" }}>{s.n}</p>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured listings */}
        <section style={{ padding: "48px 20px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1F2530", letterSpacing: "-0.5px" }}>Latest Listings</h2>
              <p style={{ color: "#6B7280", fontSize: 14, marginTop: 4 }}>Fresh properties on the market</p>
            </div>
            <Link href="/listings" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "1px solid #E5E7EB", background: "white", color: "#404754" }}>View all →</Link>
          </div>

          {featuredSlice.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🏠</p>
              <p style={{ fontSize: 16, color: "#6B7280" }}>No listings yet — add some in the RealtyAvatar dashboard</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {featuredSlice.map(l => <PropertyCard key={l.id} {...l} href={`/listings/${l.id}`} />)}
            </div>
          )}
        </section>

        {/* Property alerts */}
        <section style={{ padding: "48px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", background: "linear-gradient(135deg, #E31837, #9B1C1C)", borderRadius: 20, padding: "40px 32px", color: "white", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>🔔 Never Miss a Property</p>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginBottom: 24 }}>Get notified the moment a new property matching your criteria hits the market</p>
            <form action="/api/enquire" method="POST" style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
              <input type="hidden" name="requested" value="Property Alert" />
              <input name="email" type="email" required placeholder="your@email.com" style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "none", outline: "none", fontSize: 14 }} />
              <button type="submit" style={{ background: "white", color: "#E31837", borderRadius: 8, padding: "12px 20px", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>Alert Me</button>
            </form>
          </div>
        </section>

        {/* Why us */}
        <section style={{ background: "white", padding: "60px 20px", borderTop: "1px solid #E5E7EB" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", marginBottom: 40 }}>Why Real Estate Sales?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
              {[
                { icon: "🤖", title: "Sam AI Assistant", desc: "Chat with Sam — our AI property expert — available 24/7 to answer your questions" },
                { icon: "📸", title: "Real Photos", desc: "Genuine property photos uploaded by agents — no stock images" },
                { icon: "📄", title: "Documents On Demand", desc: "Request Section 32s, contracts and floor plans instantly through Sam" },
                { icon: "⚡", title: "Instant Enquiries", desc: "Contact agents instantly — all enquiries go direct to the agent dashboard" },
              ].map(f => (
                <div key={f.title} style={{ textAlign: "center", padding: "24px 16px" }}>
                  <p style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</p>
                  <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{f.title}</p>
                  <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: "#1F2530", color: "white", padding: "40px 20px 20px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, background: "#E31837", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontWeight: 900, fontSize: 15 }}>Real Estate Sales Australia</span>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                {["Buy", "Rent", "Sold", "Contact"].map(l => (
                  <Link key={l} href={l === "Buy" ? "/listings" : l === "Rent" ? "/rentals" : l === "Sold" ? "/sold" : "/contact"}
                    style={{ color: "#6B7280", fontSize: 13 }}>{l}</Link>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #374151", paddingTop: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <p style={{ color: "#6B7280", fontSize: 12 }}>© 2026 realestatesales.com.au — All rights reserved</p>
              <p style={{ color: "#4B5563", fontSize: 12 }}>Powered by RealtyAvatar AI · <Link href="https://realtyavatar-dashboard.vercel.app" style={{ color: "#4B5563" }}>Agent Login</Link></p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
