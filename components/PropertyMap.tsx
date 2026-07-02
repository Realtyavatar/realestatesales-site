"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Listing } from "@/lib/realtyavatar/listings";

interface Props {
  listings: Listing[];
  onSelect?: (listing: Listing) => void;
  focusListing?: Listing | null;
  onVisibleChange?: (listings: Listing[]) => void;
}

interface SuburbCoords {
  lat: number;
  lng: number;
  zoom: number;
  name: string;
}

async function geocodeSuburb(query: string): Promise<SuburbCoords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Victoria, Australia")}&format=json&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "realestatesales.com.au" } }
    );
    const data = await res.json();
    if (data[0]) {
      const type = data[0].type || "";
      const zoom = type.includes("house") || type.includes("road") ? 16 : 14;
      const name = data[0].address?.suburb || data[0].address?.town || data[0].address?.city || query;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), zoom, name };
    }
  } catch {}
  return null;
}

// Geocode full street address for precise pin placement
async function geocodeAddress(address: string, suburb: string): Promise<{ lat: number; lng: number } | null> {
  const fullAddress = `${address}, ${suburb}, Australia`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
      { headers: { "User-Agent": "realestatesales.com.au" } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  // Fallback: try suburb only
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(suburb + ", Australia")}&format=json&limit=1`,
      { headers: { "User-Agent": "realestatesales.com.au" } }
    );
    const data = await res.json();
    if (data[0]) {
      // Add small random offset so suburb-level pins don't all stack
      const jitter = () => (Math.random() - 0.5) * 0.006;
      return { lat: parseFloat(data[0].lat) + jitter(), lng: parseFloat(data[0].lon) + jitter() };
    }
  } catch {}
  return null;
}

// Haversine distance in km between two lat/lng points
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Address coordinate cache — keyed by full address
const addressCache: Record<string, { lat: number; lng: number }> = {};
// Suburb cache so we don't re-geocode
const suburbCache: Record<string, { lat: number; lng: number }> = {};

export default function PropertyMap({ listings, onSelect, focusListing, onVisibleChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const [search, setSearch] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [searchedSuburb, setSearchedSuburb] = useState<SuburbCoords | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [visibleListings, setVisibleListings] = useState<Listing[]>([]);
  const [loadingPins, setLoadingPins] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, {
        center: [-38.2, 145.0],
        zoom: 10,
        zoomControl: true,
      });
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
    });
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  // Zoom to focused listing from panel — use precise address coords
  useEffect(() => {
    if (!focusListing || !mapInstanceRef.current) return;
    const addrKey = `${focusListing.address}|${focusListing.suburb}`;
    const cached = addressCache[addrKey];
    if (cached) {
      mapInstanceRef.current.flyTo([cached.lat, cached.lng], 17, { duration: 1.2, easeLinearity: 0.5 });
    } else {
      geocodeAddress(focusListing.address, focusListing.suburb).then(coords => {
        if (coords && mapInstanceRef.current) {
          addressCache[addrKey] = coords;
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 17, { duration: 1.2, easeLinearity: 0.5 });
        }
      });
    }
  }, [focusListing]);

  const showPins = useCallback(async (suburb: SuburbCoords, radius: number | null, L: any, map: any) => {
    setLoadingPins(true);

    // Clear existing markers and circle
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }

    const searchRadius = radius || 3; // default 3km = suburb only

    // Only draw circle if user explicitly chose a radius
    if (radius !== null) {
      circleRef.current = L.circle([suburb.lat, suburb.lng], {
        radius: searchRadius * 1000,
        color: "#E31837",
        fillColor: "#E31837",
        fillOpacity: 0.04,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);
    }

    // Filter listings by suburb proximity, then geocode exact addresses
    const relevant: Listing[] = [];

    // First pass: filter by suburb coords (fast)
    const suburbPromises = listings.map(async (listing) => {
      const key = listing.suburb;
      if (!suburbCache[key]) {
        const coords = await geocodeSuburb(listing.suburb);
        if (coords) suburbCache[key] = { lat: coords.lat, lng: coords.lng };
      }
      if (suburbCache[key]) {
        const dist = distanceKm(suburb.lat, suburb.lng, suburbCache[key].lat, suburbCache[key].lng);
        if (dist <= searchRadius) relevant.push(listing);
      }
    });
    await Promise.all(suburbPromises);
    setVisibleListings(relevant);
    onVisibleChange?.(relevant);

    // Second pass: geocode exact street address for precise pin placement
    // Rate limit: 1 request per 200ms to respect Nominatim
    for (const listing of relevant) {
      const addrKey = `${listing.address}|${listing.suburb}`;
      if (!addressCache[addrKey]) {
        await new Promise(r => setTimeout(r, 200)); // rate limit
        const coords = await geocodeAddress(listing.address, listing.suburb);
        if (coords) addressCache[addrKey] = coords;
      }
    }

    // Add pins using precise address coords
    for (const listing of relevant) {
      const addrKey = `${listing.address}|${listing.suburb}`;
      const coords = addressCache[addrKey] || suburbCache[listing.suburb];
      if (!coords) continue;
      const marker = L.marker([coords.lat, coords.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#E31837;color:white;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;border:2px solid white">${listing.price}</div>`,
          iconAnchor: [20, 10],
        })
      }).addTo(map);

      marker.on("click", () => {
        onSelect?.(listing);
        map.flyTo([coords.lat, coords.lng], 17, { duration: 1.2, easeLinearity: 0.5 });
      });

      markersRef.current.push(marker);
    }

    setLoadingPins(false);
    setStatus(`${relevant.length} listing${relevant.length !== 1 ? "s" : ""} ${radius !== null ? `within ${searchRadius}km` : `in ${suburb.name}`}`);
    setTimeout(() => setStatus(""), 4000);
  }, [listings, onSelect]);

  async function doSearch(query: string) {
    if (!query.trim() || !mapInstanceRef.current) return;
    setStatus("Searching...");
    const coords = await geocodeSuburb(query);
    if (!coords) { setStatus("Location not found"); setTimeout(() => setStatus(""), 3000); return; }

    setSearchedSuburb(coords);
    setSelectedRadius(null); // no radius ring on initial search
    mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13, { duration: 1.5, easeLinearity: 0.5 });

    import("leaflet").then(L => showPins(coords, null, L, mapInstanceRef.current));
  }

  async function applyRadius(km: number) {
    if (!searchedSuburb || !mapInstanceRef.current) return;
    const current = selectedRadius === km ? null : km; // toggle off if same
    setSelectedRadius(current);
    const zoom = current === null ? 13 : current <= 10 ? 11 : current <= 20 ? 10 : 9;
    mapInstanceRef.current.flyTo([searchedSuburb.lat, searchedSuburb.lng], zoom, { duration: 1 });
    import("leaflet").then(L => showPins(searchedSuburb, current, L, mapInstanceRef.current));
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("Voice not supported — try Chrome"); return; }
    const rec = new SR();
    rec.lang = "en-AU";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearch(text);
      doSearch(text);
    };
    rec.onerror = () => setListening(false);
    rec.start();
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Search bar */}
      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "min(500px, calc(100% - 40px))" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", background: "white", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <span style={{ padding: "0 12px", display: "flex", alignItems: "center", color: "#9CA3AF", fontSize: 16 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(search)}
              placeholder="Search suburb (e.g. Dromana)..."
              style={{ flex: 1, padding: "11px 0", border: "none", outline: "none", fontSize: 14, color: "#1F2530" }}
            />
            <button onClick={() => doSearch(search)}
              style={{ background: "#E31837", color: "white", border: "none", padding: "0 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              Search
            </button>
          </div>
          <button onClick={startVoice}
            style={{ width: 44, background: listening ? "#E31837" : "white", color: listening ? "white" : "#374151", border: "none", borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            🎤
          </button>
        </div>

        {/* Radius options — only shows after a search */}
        {searchedSuburb && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", marginRight: 2 }}>Surrounding:</span>
            {[10, 15, 20, 30].map(km => (
              <button key={km} onClick={() => applyRadius(km)}
                style={{
                  background: selectedRadius === km ? "#E31837" : "white",
                  color: selectedRadius === km ? "white" : "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: 100, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "all 0.15s"
                }}>
                {km}km
              </button>
            ))}
            <button onClick={() => {
              markersRef.current.forEach(m => m.remove()); markersRef.current = [];
              if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }
              setSearchedSuburb(null); setVisibleListings([]); setSelectedRadius(null);
              onVisibleChange?.([]);
              mapInstanceRef.current?.flyTo([-38.2, 145.0], 10, { duration: 1 });
            }}
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Empty state overlay */}
      {!searchedSuburb && (
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(31,37,48,0.85)", color: "white", padding: "12px 24px", borderRadius: 100, fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)", whiteSpace: "nowrap" }}>
          🔍 Search a suburb above to see listings
        </div>
      )}

      {/* Loading pins */}
      {loadingPins && (
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", padding: "10px 20px", borderRadius: 100, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, border: "2px solid #E31837", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Finding listings...
        </div>
      )}

      {/* Status */}
      {status && !loadingPins && (
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(0,0,0,0.75)", color: "white", padding: "8px 16px", borderRadius: 100, fontSize: 13 }}>
          {status}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.1)} }
      `}</style>
    </div>
  );
}
