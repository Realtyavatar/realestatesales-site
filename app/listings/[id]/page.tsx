import { Navbar } from "@/components/Navbar";
import { getListing } from "@/lib/realtyavatar/listings";
import { getDocumentsForListing, getAvailableDocTypes } from "@/lib/realtyavatar/documents";
import { getFallbackPhotoUrl } from "@/lib/photos";
import Link from "next/link";
import { notFound } from "next/navigation";
import ListingDetailClient from "@/components/ListingDetailClient";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, docs] = await Promise.all([
    getListing(id),
    (async () => {
      try {
        const { getDocumentsForListing } = await import("@/lib/realtyavatar/documents");
        return getDocumentsForListing("");
      } catch { return []; }
    })()
  ]);

  if (!listing) notFound();

  // Get documents from RealtyAvatar backend
  let availableDocs: string[] = [];
  try {
    const docList = await getDocumentsForListing(listing.address);
    availableDocs = getAvailableDocTypes(docList);
  } catch {}

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>
        {/* Photo hero */}
        <div style={{ height: 420, background: listing.img && listing.img.startsWith("data:") ? "transparent" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          {listing.img && listing.img.startsWith("data:") ? (
            <img src={listing.img} alt={listing.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={getFallbackPhotoUrl(listing.id, 1200, 420)} alt={listing.address} style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
          )}
          <div style={{ position: "absolute", top: 20, left: 20 }}>
            <Link href="/listings" style={{ background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" }}>← All listings</Link>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
            {/* Left — property details */}
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <span style={{ background: listing.status === "Active" ? "#DCFCE7" : "#F3F4F6", color: listing.status === "Active" ? "#16A34A" : "#6B7280", borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 700, border: "1px solid currentColor" }}>{listing.status}</span>
                <span style={{ background: "#F3F4F6", color: "#6B7280", borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{listing.type}</span>
                {listing.days !== undefined && listing.days <= 7 && (
                  <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>New Listing</span>
                )}
              </div>

              <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1F2530", letterSpacing: "-0.5px", marginBottom: 4 }}>{listing.address}</h1>
              <p style={{ color: "#6B7280", fontSize: 16, marginBottom: 16 }}>{listing.suburb}</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: "#E31837", marginBottom: 24 }}>{listing.price}</p>

              {/* Stats */}
              <div style={{ display: "flex", gap: 0, marginBottom: 32, background: "white", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                {[["🛏", listing.beds, "Bedrooms"], ["🚿", listing.baths, "Bathrooms"], ["🚗", listing.cars || 0, "Car spaces"]].map(([icon, n, label], i) => (
                  <div key={String(label)} style={{ flex: 1, textAlign: "center", padding: "20px 12px", borderRight: i < 2 ? "1px solid #E5E7EB" : "none" }}>
                    <p style={{ fontSize: 24, marginBottom: 4 }}>{icon}</p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: "#1F2530" }}>{n}</p>
                    <p style={{ fontSize: 11, color: "#6B7280" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Agent */}
              {listing.agent && (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#2342B0", flexShrink: 0 }}>
                    {listing.agent.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#1F2530" }}>{listing.agent}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>Listing Agent</p>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "20px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: "#1F2530" }}>📄 Property Documents</h3>
                {availableDocs.length === 0 ? (
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>The agent has not uploaded documents for this property yet.</p>
                ) : (
                  availableDocs.map((docType, i) => (
                    <div key={docType} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < availableDocs.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#1F2530" }}>{docType}</p>
                      <span style={{ background: "#DCFCE7", color: "#16A34A", border: "1px solid #86EFAC", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Available</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right — enquiry + Sam */}
            <div style={{ position: "sticky", top: 80 }}>
              <ListingDetailClient
                listing={{ id: listing.id, address: listing.address, suburb: listing.suburb, price: listing.price, beds: listing.beds, baths: listing.baths, type: listing.type }}
                availableDocs={availableDocs}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
