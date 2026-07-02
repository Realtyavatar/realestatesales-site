import { Navbar } from "@/components/Navbar";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64 }}>
        <div style={{ background: "#2342B0", padding: "40px 20px 32px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 4 }}>Contact Us</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>Get in touch with our team</p>
          </div>
        </div>

        <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
            {[
              { icon: "📍", label: "Address", value: "Melbourne, VIC, Australia" },
              { icon: "📞", label: "Phone", value: "+61 400 000 000" },
              { icon: "✉️", label: "Email", value: "hello@realestatesales.com.au" },
              { icon: "🕐", label: "Hours", value: "Mon–Sat 9am–6pm AEST" },
            ].map(c => (
              <div key={c.label} style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: "20px" }}>
                <p style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</p>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>{c.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1F2530" }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", padding: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Send Us a Message</h2>
            <form style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>First Name</label><input placeholder="John" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Last Name</label><input placeholder="Smith" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
              </div>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Email</label><input type="email" placeholder="you@email.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Phone</label><input placeholder="0400 000 000" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#404754", marginBottom: 4 }}>Message</label><textarea rows={4} placeholder="How can we help you?" style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, fontSize: 14, outline: "none", resize: "none" }} /></div>
              <button type="submit" style={{ background: "#2342B0", color: "white", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Send Message</button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
