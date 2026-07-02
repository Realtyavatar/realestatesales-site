import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { PropertyCard } from "@/components/PropertyCard";

export default async function SoldPage() {
  let sold: any[] = [];
  try { const { data } = await supabase.from("listings").select("*").eq("status","Sold"); sold = data || []; } catch {}
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>
        <div style={{ background: "#374151", padding: "32px 20px" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 4 }}>Recently Sold</h1><p style={{ color: "#94A3B8", fontSize: 14 }}>{sold.length} properties sold</p></div></div>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 60px" }}>
          {sold.length === 0 ? <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}><p style={{ fontSize: 18, fontWeight: 700, color: "#6B7280" }}>No sold properties yet</p></div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>{sold.map((l:any) => <PropertyCard key={l.id} {...l} href={`/listings/${l.id}`} />)}</div>}
        </div>
      </main>
    </>
  );
}
