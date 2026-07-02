"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { PropertyCard } from "@/components/PropertyCard";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bedFilter, setBedFilter] = useState("Any");
  const [typeFilter, setTypeFilter] = useState("Any");
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    fetch("/api/public/listings")
      .then(r => r.json())
      .then(d => { setListings(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = listings
    .filter(l => {
      if (search && !`${l.address} ${l.suburb}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (bedFilter !== "Any" && l.beds < parseInt(bedFilter)) return false;
      if (typeFilter !== "Any" && l.type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return (parseInt(a.price?.replace(/[^0-9]/g,"") || "0")) - (parseInt(b.price?.replace(/[^0-9]/g,"") || "0"));
      if (sortBy === "price-desc") return (parseInt(b.price?.replace(/[^0-9]/g,"") || "0")) - (parseInt(a.price?.replace(/[^0-9]/g,"") || "0"));
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>
        {/* Header */}
        <div style={{ background: "#1F2530", padding: "32px 20px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 4 }}>Properties For Sale</h1>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>{filtered.length} properties found</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: "white", borderBottom: "1px solid #E5E7EB", padding: "12px 20px", position: "sticky", top: 60, zIndex: 40 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search suburb or address..."
              style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />

            <select value={bedFilter} onChange={e => setBedFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}>
              <option value="Any">Any Beds</option>
              {["1","2","3","4","5"].map(n => <option key={n} value={n}>{n}+ Beds</option>)}
            </select>

            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}>
              <option value="Any">Any Type</option>
              {["House","Apartment","Townhouse","Land","Rural"].map(t => <option key={t}>{t}</option>)}
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 60px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px" }}><p style={{ color: "#6B7280" }}>Loading properties…</p></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🏠</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#1F2530" }}>No properties found</p>
              <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {filtered.map(l => <PropertyCard key={l.id} {...l} href={`/listings/${l.id}`} />)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
