import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function EnquirySent() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>✅</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1F2530", marginBottom: 8 }}>Enquiry Sent!</h1>
          <p style={{ color: "#6B7280", fontSize: 16, marginBottom: 28 }}>Our team will be in touch within 24 hours.</p>
          <Link href="/listings" style={{ background: "#2342B0", color: "white", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15 }}>Browse More Properties</Link>
        </div>
      </main>
    </>
  );
}
