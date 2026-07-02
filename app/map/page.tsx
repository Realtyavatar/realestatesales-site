"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { Listing } from "@/lib/realtyavatar/listings";
import { getFallbackPhotoUrl, getApartmentPhotoUrl } from "@/lib/photos";

function getPhoto(l: Listing, w: number, h: number) {
  return l.type === "Apartment" || l.type === "Unit" ? getApartmentPhotoUrl(l.id, w, h) : getFallbackPhotoUrl(l.id, w, h);
}

const STATUS_COLORS: Record<string, string> = {
  "Active": "#16A34A",
  "Under Offer": "#D97706",
  "Sold": "#DC2626",
  "Available": "#16A34A",
  "Leased": "#6B7280",
};

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), { ssr: false, loading: () => (
  <div style={{ width: "100%", height: "100%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #E31837", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
      <p style={{ color: "#6B7280", fontSize: 13 }}>Loading map...</p>
    </div>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
  </div>
)});

export default function MapPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sidebarListings, setSidebarListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("price-asc");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    fetch("/api/public/listings")
      .then(r => r.json())
      .then(d => { setListings(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const sortedSidebar = [...sidebarListings]
    .filter(l => typeFilter === "All" || l.type === typeFilter)
    .sort((a, b) => {
      const pa = parseInt(a.price?.replace(/[^0-9]/g, "") || "0");
      const pb = parseInt(b.price?.replace(/[^0-9]/g, "") || "0");
      if (sortBy === "price-asc") return pa - pb;
      if (sortBy === "price-desc") return pb - pa;
      if (sortBy === "beds") return (b.beds || 0) - (a.beds || 0);
      return 0;
    });

  return (
    <>
      <Navbar />
      <div style={{ height: "100vh", paddingTop: 60, display: "flex" }}>

        {/* Left panel */}
        <div style={{ width: 340, display: "flex", flexDirection: "column", background: "white", borderRight: "1px solid #E5E7EB", flexShrink: 0 }}>
          {/* Header */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #E5E7EB" }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1F2530", marginBottom: 8 }}>
              {sidebarListings.length > 0
                ? `${sortedSidebar.length} propert${sortedSidebar.length !== 1 ? "ies" : "y"} found`
                : "Search a suburb to see listings"}
            </h2>

            {sidebarListings.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, outline: "none", background: "white", color: "#374151" }}>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="beds">Most Bedrooms</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, outline: "none", background: "white", color: "#374151" }}>
                  <option value="All">All Types</option>
                  <option value="House">Houses</option>
                  <option value="Apartment">Apartments</option>
                  <option value="Townhouse">Townhouses</option>
                </select>
              </div>
            )}
          </div>

          {/* Listing cards */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {sidebarListings.length === 0 && !loading && (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>🗺️</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>Search a suburb above</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>e.g. Dromana, Sorrento, Mornington</p>
              </div>
            )}

            {sortedSidebar.map(l => (
              <div key={l.id} onClick={() => setSelected(l)}
                style={{ padding: "10px 12px", borderBottom: "1px solid #F3F4F6", cursor: "pointer", background: selected?.id === l.id ? "#FEF2F2" : "white", transition: "background 0.15s" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={getPhoto(l, 80, 64)} alt={l.address}
                      style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 8 }}
                      onError={e => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1564013799919-ab3a9b1b6e2c?w=80&h=64&fit=crop`; }} />
                    <span style={{ position: "absolute", top: 3, left: 3, background: STATUS_COLORS[l.status] || "#6B7280", color: "white", fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 4 }}>{l.status}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#E31837", marginBottom: 1 }}>{l.price}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#1F2530", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.address}</p>
                    <p style={{ fontSize: 10, color: "#6B7280", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.suburb}</p>
                    <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#6B7280" }}>
                      <span>🛏 {l.beds}</span>
                      <span>🚿 {l.baths}</span>
                      <span>🚗 {l.cars || 0}</span>
                      <span style={{ marginLeft: "auto", color: "#9CA3AF", fontSize: 10 }}>{l.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <PropertyMap
            listings={listings}
            onSelect={setSelected}
            onVisibleChange={setSidebarListings}
            focusListing={selected}
          />

          {/* Selected property popup */}
          {selected && (
            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", padding: 16, width: "min(400px, calc(100% - 40px))", display: "flex", gap: 12, alignItems: "center" }}>
              <img src={getPhoto(selected, 80, 64)} alt={selected.address}
                style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1564013799919-ab3a9b1b6e2c?w=80&h=64&fit=crop`; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#E31837" }}>{selected.price}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1F2530", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.address}</p>
                <p style={{ fontSize: 11, color: "#6B7280" }}>{selected.suburb}</p>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                  <span>🛏 {selected.beds}</span>
                  <span>🚿 {selected.baths}</span>
                  <span>🚗 {selected.cars || 0}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Link href={`/listings/${selected.id}`}
                  style={{ background: "#E31837", color: "white", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                  View →
                </Link>
                <button onClick={() => setSelected(null)}
                  style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", fontSize: 13, color: "#6B7280" }}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
