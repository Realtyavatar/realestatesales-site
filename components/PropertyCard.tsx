"use client";
import Link from "next/link";
import { useState } from "react";
import { getFallbackPhotoUrl, getApartmentPhotoUrl } from "@/lib/photos";

interface Props {
  id: string;
  address: string;
  suburb: string;
  price: string;
  beds: number;
  baths: number;
  cars: number;
  type: string;
  status: string;
  img?: string;
  days?: number;
  agent?: string;
  href: string;
  rent?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "Active":           { bg: "#DCFCE7", color: "#16A34A" },
  "Available":        { bg: "#DCFCE7", color: "#16A34A" },
  "Under Offer":      { bg: "#FEF9C3", color: "#CA8A04" },
  "Under Application":{ bg: "#FEF9C3", color: "#CA8A04" },
  "Sold":             { bg: "#FEE2E2", color: "#DC2626" },
  "Leased":           { bg: "#F3F4F6", color: "#6B7280" },
};

export function PropertyCard({ id, address, suburb, price, beds, baths, cars, type, status, img, days, agent, href, rent }: Props) {
  const [saved, setSaved] = useState(false);
  // Clean up price — remove double $$ that can occur from formatting
  const rawPrice = rent || price || "";
  const displayPrice = rawPrice.startsWith("$$") ? rawPrice.slice(1) : rawPrice;
  const sc = STATUS_COLORS[status] || { bg: "#F3F4F6", color: "#6B7280" };

  return (
    <div className="property-card" style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      {/* Photo */}
      <Link href={href} style={{ display: "block", position: "relative" }}>
        <div style={{ height: 200, background: img && img.startsWith("data:") ? "transparent" : "#EEF2FF", overflow: "hidden", position: "relative" }}>
          {img && img.startsWith("data:") ? (
            <img src={img} alt={address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img
              src={type === "Apartment" || type === "Unit" ? getApartmentPhotoUrl(id, 600, 400) : getFallbackPhotoUrl(id, 600, 400)}
              alt={address}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1564013799919-ab3a9b1b6e2c?w=600&h=400&fit=crop`; }}
            />
          )}

          {/* Badges */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            <span style={{ background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>{status}</span>
            {days !== undefined && days <= 7 && (
              <span style={{ background: "#E31837", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100 }}>New</span>
            )}
          </div>

          {/* Type badge */}
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <span style={{ background: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100, backdropFilter: "blur(4px)" }}>{type}</span>
          </div>
        </div>
      </Link>

      {/* Save button */}
      <button onClick={() => setSaved(!saved)}
        style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
        {saved ? "❤️" : "🤍"}
      </button>

      {/* Details */}
      <Link href={href} style={{ display: "block", padding: "14px 16px 16px" }}>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#E31837", marginBottom: 4, letterSpacing: "-0.3px" }}>{displayPrice}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1F2530", marginBottom: 2 }}>{address}</p>
        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>{suburb}</p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#374151", paddingTop: 10, borderTop: "1px solid #F3F4F6", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4h20v12H2zM7 20h10M12 16v4"/></svg>
            {beds}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12V5a2 2 0 012-2h12a2 2 0 012 2v7"/><path d="M2 13h20v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
            {baths}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="22" height="18" rx="2"/><path d="M1 9h22"/></svg>
            {cars || 0}
          </span>
          {days !== undefined && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>{days}d ago</span>
          )}
        </div>

        {agent && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#2342B0", flexShrink: 0 }}>
              {agent.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{agent}</span>
          </div>
        )}
      </Link>
    </div>
  );
}
