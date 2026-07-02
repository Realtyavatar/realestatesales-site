import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getRental(id: string) {
  try {
    const { data } = await supabase.from("rentals").select("*").eq("id", id).single();
    return data;
  } catch { return null; }
}

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await getRental(id);
  if (!rental) notFound();
  const rent = rental.rent || rental.price;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64 }}>
        <div style={{ height: 360, background: rental.img && rental.img.startsWith("data:") ? "transparent" : "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          {rental.img && rental.img.startsWith("data:") ? (
            <img src={rental.img} alt={rental.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", color: "#94A3B8" }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <p style={{ marginTop: 8, fontSize: 14 }}>No photo yet</p>
            </div>
          )}
          <div style={{ position: "absolute", top: 20, left: 20 }}>
            <Link href="/rentals" style={{ background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>← Back to rentals</Link>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          <div>
            <span style={{ background: rental.status === "Available" ? "#ECFDF3" : "#F3F4F6", color: rental.status === "Available" ? "#16A34A" : "#6B7280", borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 700, border: `1px solid ${rental.status === "Available" ? "#86EFAC" : "#E5E7EB"}`, display: "inline-block", marginBottom: 12 }}>{rental.status}</span>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1F2530", marginBottom: 4 }}>{rental.address}</h1>
            <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 12 }}>{rental.suburb}</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: "#0891B2", marginBottom: 8 }}>{rent}</p>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>Available: <strong style={{ color: "#1F2530" }}>{rental.available}</strong></p>

            <div style={{ display: "flex", gap: 24, padding: "20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
              {[["🛏", rental.beds, "Bedrooms"], ["🚿", rental.baths, "Bathrooms"], ["🚗", rental.cars || 0, "Car spaces"]].map(([icon, n, label]) => (
                <div key={String(label)} style={{ textAlign: "center", flex: 1 }}>
                  <p style={{ fontSize: 24 }}>{icon}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#1F2530" }}>{n}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", padding: 24, position: "sticky", top: 80 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Apply for This Rental</h3>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Express your interest today</p>
              <form style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Full Name</label><input placeholder="John Smith" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Email</label><input type="email" placeholder="you@email.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Phone</label><input placeholder="0400 000 000" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
                <button type="submit" style={{ background: "#0891B2", color: "white", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Express Interest</button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
