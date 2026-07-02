"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "white", borderBottom: "1px solid #E5E7EB", height: 60 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, background: "#E31837", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 18v-5h6v5" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#E31837", letterSpacing: "-0.3px" }}>Real Estate</span>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#1F2530", letterSpacing: "-0.3px" }}> Sales</span>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { href: "/listings", label: "Buy" },
            { href: "/rentals", label: "Rent" },
            { href: "/map", label: "Map Search" },
            { href: "/sold", label: "Sold" },
            { href: "/agents", label: "Find Agent" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="nav-link" style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: pathname === href ? "#E31837" : "#404754",
              background: pathname === href ? "#FEF2F2" : "transparent"
            }}>{label}</Link>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/alerts" style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#404754", border: "1px solid #E5E7EB" }}>
            🔔 Property Alerts
          </Link>
          <Link href="/contact" style={{ padding: "8px 16px", background: "#E31837", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
