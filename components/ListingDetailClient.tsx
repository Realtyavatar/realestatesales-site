"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  listing: { id: string; address: string; suburb: string; price: string; beds: number; baths: number; type: string; };
  availableDocs: string[];
}

interface ChatMsg { role: "user" | "assistant"; content: string; }
type Mode = "enquire" | "sam" | "documents";

export default function ListingDetailClient({ listing, availableDocs }: Props) {
  const [mode, setMode] = useState<Mode>("enquire");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: `Hi! I'm Sam 👋 I can answer questions about ${listing.address}, help arrange an inspection, or assist with documents.${availableDocs.length > 0 ? ` I can see ${availableDocs.length} document(s) are available for this property.` : ""}` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enquireForm, setEnquireForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [docRequest, setDocRequest] = useState({ name: "", email: "", docType: availableDocs[0] || "" });
  const [docSubmitted, setDocSubmitted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendSam(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/sam/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          context: { listing, availableDocs },
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  }

  async function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/enquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...enquireForm,
        property: listing.address,
        suburb: listing.suburb,
        requested: "Property Enquiry",
        source: "realestatesales.com.au",
      }),
    });
    setSubmitted(true);
  }

  async function requestDoc(e: React.FormEvent) {
    e.preventDefault();
    if (availableDocs.length === 0) return;
    await fetch("/api/enquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: docRequest.name,
        email: docRequest.email,
        property: listing.address,
        requested: docRequest.docType,
        source: "realestatesales.com.au",
        notes: `Document request: ${docRequest.docType}`,
      }),
    });
    setDocSubmitted(true);
  }

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: "10px 4px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
    background: active ? "#1F2530" : "transparent", color: active ? "white" : "#6B7280",
  });

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 12px 0", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
        <button style={tabStyle(mode === "enquire")} onClick={() => setMode("enquire")}>✉️ Enquire</button>
        <button style={tabStyle(mode === "sam")} onClick={() => setMode("sam")}>🤖 Ask Sam</button>
        <button style={tabStyle(mode === "documents")} onClick={() => setMode("documents")}>
          📄 Docs {availableDocs.length > 0 && <span style={{ background: "#E31837", color: "white", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, marginLeft: 4 }}>{availableDocs.length}</span>}
        </button>
      </div>

      {/* Enquire tab */}
      {mode === "enquire" && (
        <div style={{ padding: 20 }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Enquiry Sent!</p>
              <p style={{ color: "#6B7280", fontSize: 13 }}>The agent will be in touch within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={submitEnquiry} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: "#1F2530", marginBottom: 4 }}>Enquire About This Property</p>
              <input required placeholder="Your name" value={enquireForm.name} onChange={e => setEnquireForm(p => ({ ...p, name: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none" }} />
              <input required type="email" placeholder="Email address" value={enquireForm.email} onChange={e => setEnquireForm(p => ({ ...p, email: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none" }} />
              <input placeholder="Phone number" value={enquireForm.phone} onChange={e => setEnquireForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none" }} />
              <textarea rows={3} placeholder="Message (optional)" value={enquireForm.message} onChange={e => setEnquireForm(p => ({ ...p, message: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", resize: "none" }} />
              <button type="submit" style={{ background: "#E31837", color: "white", border: "none", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Send Enquiry</button>
              <button type="button" onClick={() => {}} style={{ background: "#F9FAFB", color: "#1F2530", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📅 Book Inspection</button>
            </form>
          )}
        </div>
      )}

      {/* Sam chat tab */}
      {mode === "sam" && (
        <div style={{ display: "flex", flexDirection: "column", height: 420 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "90%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "#E31837" : "#F3F4F6", color: m.role === "user" ? "white" : "#1F2530", fontSize: 13, lineHeight: 1.5 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#F3F4F6", borderRadius: "16px 16px 16px 4px", width: "fit-content" }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#9CA3AF", display: "inline-block" }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendSam} style={{ padding: "12px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Sam about this property..." style={{ flex: 1, padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, outline: "none" }} />
            <button type="submit" disabled={loading || !input.trim()} style={{ background: "#E31837", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: loading || !input.trim() ? 0.5 : 1 }}>Send</button>
          </form>
        </div>
      )}

      {/* Documents tab */}
      {mode === "documents" && (
        <div style={{ padding: 20 }}>
          {availableDocs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "#1F2530" }}>No Documents Available</p>
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>The agent has not uploaded documents for this property yet.</p>
            </div>
          ) : docSubmitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Request Sent!</p>
              <p style={{ color: "#6B7280", fontSize: 13 }}>The agent will send the documents to your email shortly.</p>
            </div>
          ) : (
            <form onSubmit={requestDoc} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#1F2530", marginBottom: 4 }}>Request Property Documents</p>
              <select value={docRequest.docType} onChange={e => setDocRequest(p => ({ ...p, docType: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }}>
                {availableDocs.map(d => <option key={d}>{d}</option>)}
              </select>
              <input required placeholder="Your name" value={docRequest.name} onChange={e => setDocRequest(p => ({ ...p, name: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none" }} />
              <input required type="email" placeholder="Email to receive documents" value={docRequest.email} onChange={e => setDocRequest(p => ({ ...p, email: e.target.value }))} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none" }} />
              <button type="submit" style={{ background: "#1F2530", color: "white", border: "none", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Request Document</button>
              <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>Documents are sent by the listing agent. Your details are shared with them only.</p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
