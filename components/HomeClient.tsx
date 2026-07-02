"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/realtyavatar/listings";

interface Props { listings: Listing[]; }

interface ChatMsg { role: "user" | "assistant"; content: string; }

export default function HomeClient({ listings }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [samOpen, setSamOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I'm Sam 👋 I'm your AI property assistant. Tell me what you're looking for — suburb, budget, bedrooms — and I'll help you find the perfect property." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSearch, setActiveSearch] = useState(false);
  const [results, setResults] = useState<Listing[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) { router.push("/listings"); return; }
    setActiveSearch(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });
      const data = await res.json();
      setResults(data.listings || listings);
    } catch {
      setResults(listings);
    }
  }

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
        body: JSON.stringify({ messages: newMsgs, context: {} }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "I'm having trouble responding right now." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ maxWidth: 620, margin: "0 auto 16px" }}>
        <div style={{ background: "white", borderRadius: "0 12px 12px 12px", padding: 8, display: "flex", gap: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", gap: 0, borderRadius: "8px 8px 0 0", overflow: "hidden", position: "absolute", top: -40 }}>
            {["Buy", "Rent", "Sold"].map((t, i) => (
              <a key={t} href={t === "Buy" ? "/listings" : t === "Rent" ? "/rentals" : "/sold"}
                style={{ padding: "8px 20px", fontSize: 14, fontWeight: 700, background: i === 0 ? "white" : "rgba(255,255,255,0.15)", color: i === 0 ? "#E31837" : "white" }}>
                {t}
              </a>
            ))}
          </div>
          <span style={{ fontSize: 18, paddingLeft: 8, display: "flex", alignItems: "center" }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search suburb, address, or describe your ideal property..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#1F2530", background: "transparent", padding: "10px 4px" }}
          />
          <button type="submit" style={{ background: "#E31837", color: "white", borderRadius: 8, padding: "10px 24px", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Search</button>
        </div>
      </form>

      {/* Quick filters */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
        {["Houses", "Apartments", "Townhouses", "Land"].map(f => (
          <a key={f} href={`/listings?type=${f}`}
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
            {f}
          </a>
        ))}
        <button
          onClick={() => setSamOpen(true)}
          style={{ background: "rgba(227,24,55,0.2)", color: "#FCA5A5", borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(227,24,55,0.3)", cursor: "pointer" }}>
          🤖 Ask Sam AI
        </button>
      </div>

      {/* Sam assistant drawer */}
      {samOpen && (
        <div style={{ position: "fixed", bottom: 0, right: 0, width: "min(400px, 100vw)", height: "min(560px, 85vh)", background: "white", boxShadow: "-4px 0 40px rgba(0,0,0,0.15)", zIndex: 200, display: "flex", flexDirection: "column", borderRadius: "20px 0 0 0" }}>
          {/* Header */}
          <div style={{ background: "#1F2530", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "20px 0 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E31837", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
              <div>
                <p style={{ color: "white", fontWeight: 800, fontSize: 14 }}>Sam</p>
                <p style={{ color: "#86EFAC", fontSize: 11 }}>● AI Property Assistant</p>
              </div>
            </div>
            <button onClick={() => setSamOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "#E31837" : "#F3F4F6",
                  color: m.role === "user" ? "white" : "#1F2530",
                  fontSize: 13, lineHeight: 1.5
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#F3F4F6", borderRadius: "16px 16px 16px 4px", width: "fit-content" }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#9CA3AF", display: "inline-block", animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendSam} style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Sam anything about properties..."
              style={{ flex: 1, padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, outline: "none" }}
            />
            <button type="submit" disabled={loading || !input.trim()}
              style={{ background: "#E31837", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: loading || !input.trim() ? 0.5 : 1 }}>
              Send
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,80%,100% { transform: scale(0) } 40% { transform: scale(1) } }
      `}</style>
    </>
  );
}
