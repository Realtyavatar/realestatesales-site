"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { PropertyCard } from "@/components/PropertyCard";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bedFilter, setBedFilter] = useState("Any");
  const [statusFilter, setStatusFilter] = useState("Available");

  useEffect(() => {
    fetch("/api/public/rentals")
      .then(r => r.json())
      .then(d => { setRentals(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = rentals.filter(r => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (search && !`${r.address} ${r.suburb}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (bedFilter !== "Any" && r.beds < parseInt(bedFilter)) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>
        <div style={{ background: "#0F766E", padding: "32px 20px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 4 }}>Properties For Rent</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{filtered.length} properties found</p>
          </div>
        </div>

        <div style={{ background: "white", borderBottom: "1px solid #E5E7EB", padding: "12px 20px", position: "sticky", top: 60, zIndex: 40 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search suburb or address..."
              style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
            <select value={bedFilter} onChange={e => setBedFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}>
              <option value="Any">Any Beds</option>
              {["1","2","3","4"].map(n => <option key={n} value={n}>{n}+ Beds</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}>
              <option value="Available">Available Now</option>
              <option value="All">All Rentals</option>
              <option value="Leased">Leased</option>
            </select>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 60px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px" }}><p style={{ color: "#6B7280" }}>Loading rentals…</p></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔑</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>No rentals found</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {filtered.map(r => <PropertyCard key={r.id} {...r} price={r.rent || r.price} href={`/rentals/${r.id}`} />)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
