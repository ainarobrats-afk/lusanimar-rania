import { useState, useEffect, useCallback } from "react";

const API = "/api";

interface Booking {
  id: string;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled";
  passengerName: string;
  email: string;
  phone: string;
  passport?: string;
  from: string;
  to: string;
  date: string;
  airline: string;
  flightNum: string;
  flightClass: string;
  price?: number;
  currency: string;
  notes?: string;
  sentAt?: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#ffb800",
  confirmed: "#00ff88",
  cancelled: "#ff4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "⏳ Pending",
  confirmed: "✅ Confirmed",
  cancelled: "❌ Cancelled",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export default function StaffMonitor() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const url = filter === "all" ? `${API}/rania/bookings` : `${API}/rania/bookings?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
      setLastRefresh(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchBookings, 15000);
    return () => clearInterval(id);
  }, [fetchBookings, autoRefresh]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/rania/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setActionMsg(`Status updated to ${status}`);
      fetchBookings();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      setActionMsg("Failed to update status");
    }
  };

  const resend = async (id: string) => {
    try {
      await fetch(`${API}/rania/bookings/${id}/resend`, { method: "POST" });
      setActionMsg("Booking notification resent ✅");
      fetchBookings();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      setActionMsg("Resend failed");
    }
  };

  const openWhatsApp = (b: Booking) => {
    const msg = encodeURIComponent(
      `📋 BOOKING SANIMAR TRAVEL\n` +
      `ID: ${b.id}\n` +
      `Nama: ${b.passengerName}\n` +
      `Rute: ${b.from} → ${b.to}\n` +
      `Tanggal: ${b.date}\n` +
      `Maskapai: ${b.airline} ${b.flightNum}\n` +
      `Kelas: ${b.flightClass}\n` +
      `${b.price ? `Harga: $${b.price}` : ""}\n` +
      `Status: ${b.status.toUpperCase()}\n` +
      `Email: ${b.email || "-"}\n` +
      `Phone: ${b.phone || "-"}`
    );
    window.open(`https://wa.me/67012345678?text=${msg}`, "_blank");
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#fff", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Top Nav */}
      <nav style={{ background: "rgba(8,10,22,0.97)", borderBottom: "1px solid rgba(255,255,255,.07)", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00e5ff,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 0.2 }}>STAFF MONITOR</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 1 }}>SANIMAR TRAVEL · RANIA AI BOOKINGS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: autoRefresh ? "#00ff88" : "#ff4444", boxShadow: autoRefresh ? "0 0 6px #00ff88" : "none", animation: autoRefresh ? "pulse 2s infinite" : "none" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>
              {autoRefresh ? "LIVE" : "PAUSED"} · {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", border: `1px solid ${autoRefresh ? "rgba(0,229,255,.3)" : "rgba(255,255,255,.15)"}`, background: autoRefresh ? "rgba(0,229,255,.08)" : "transparent", color: autoRefresh ? "#00e5ff" : "rgba(255,255,255,.5)", fontFamily: "inherit" }}
          >
            {autoRefresh ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button
            onClick={fetchBookings}
            style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.7)", fontFamily: "inherit" }}
          >
            🔄 Refresh
          </button>
          <a href="/" style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.7)", textDecoration: "none" }}>
            ← Home
          </a>
        </div>
      </nav>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        .brow:hover{background:rgba(0,229,255,.04)!important}
        .stbtn:hover{opacity:0.85}
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>
        {/* Action toast */}
        {actionMsg && (
          <div style={{ position: "fixed", top: 76, right: 20, zIndex: 999, background: "linear-gradient(135deg,#131b2e,#0d1120)", border: "1px solid rgba(0,229,255,.35)", borderRadius: 12, padding: "10px 18px", fontSize: 12, fontWeight: 700, color: "#00e5ff", animation: "slideIn .3s ease", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
            {actionMsg}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "TOTAL", value: stats.total, color: "#00e5ff", icon: "📋" },
            { label: "PENDING", value: stats.pending, color: "#ffb800", icon: "⏳" },
            { label: "CONFIRMED", value: stats.confirmed, color: "#00ff88", icon: "✅" },
            { label: "CANCELLED", value: stats.cancelled, color: "#ff4444", icon: "❌" },
          ].map((s) => (
            <div key={s.label} onClick={() => setFilter(s.label.toLowerCase() as any)} style={{ background: "linear-gradient(135deg,rgba(0,16,40,.7),rgba(0,10,26,.9))", border: `1px solid rgba(255,255,255,.06)`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "border .2s", borderTop: `2px solid ${s.color}33` }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 16px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: 0.6, border: filter === f ? "1px solid rgba(0,229,255,.45)" : "1px solid rgba(255,255,255,.1)", background: filter === f ? "rgba(0,229,255,.12)" : "transparent", color: filter === f ? "#00e5ff" : "rgba(255,255,255,.45)" }}
            >
              {f === "all" ? `All (${stats.total})` : f === "pending" ? `Pending (${stats.pending})` : f === "confirmed" ? `Confirmed (${stats.confirmed})` : `Cancelled (${stats.cancelled})`}
            </button>
          ))}
        </div>

        {/* Bookings table */}
        <div style={{ background: "linear-gradient(135deg,rgba(0,16,40,.7),rgba(0,10,26,.9))", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 100px 120px 120px 180px", gap: 0, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.05)", background: "rgba(0,0,0,.2)" }}>
            {["ID / TIME", "PASSENGER", "ROUTE", "DATE", "AIRLINE", "STATUS", "ACTIONS"].map((h) => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,.3)" }}>
              <div style={{ fontSize: 32, marginBottom: 8, animation: "pulse 1.5s infinite" }}>⏳</div>
              <div style={{ fontSize: 12 }}>Loading bookings...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,.3)" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No bookings yet</div>
              <div style={{ fontSize: 11 }}>Bookings from RANIA AI chat will appear here</div>
            </div>
          ) : (
            <div>
              {filtered.map((b) => (
                <div key={b.id} className="brow" onClick={() => setSelected(b === selected ? null : b)}
                  style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px 100px 120px 120px 180px", gap: 0, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.04)", cursor: "pointer", background: selected?.id === b.id ? "rgba(0,229,255,.04)" : "transparent", transition: "background .15s", alignItems: "center" }}
                >
                  {/* ID / Time */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#00e5ff", fontFamily: "monospace" }}>{b.id}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{formatDate(b.createdAt)}</div>
                  </div>
                  {/* Passenger */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{b.passengerName}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 1 }}>{b.email || "-"} · {b.phone || "-"}</div>
                  </div>
                  {/* Route */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: 0.5, fontFamily: "monospace" }}>{b.from} → {b.to}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{b.flightClass}</div>
                  </div>
                  {/* Date */}
                  <div style={{ fontSize: 11, color: "#fff" }}>{b.date}</div>
                  {/* Airline */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{b.airline}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{b.flightNum}</div>
                  </div>
                  {/* Status */}
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: `${STATUS_COLOR[b.status]}18`, border: `1px solid ${STATUS_COLOR[b.status]}44`, color: STATUS_COLOR[b.status] }}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                    <button className="stbtn" onClick={() => openWhatsApp(b)} style={{ padding: "4px 8px", borderRadius: 7, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(0,255,136,.3)", background: "rgba(0,255,136,.08)", color: "#00ff88", fontFamily: "inherit" }}>
                      💬 WA
                    </button>
                    {b.status === "pending" && (
                      <button className="stbtn" onClick={() => updateStatus(b.id, "confirmed")} style={{ padding: "4px 8px", borderRadius: 7, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(0,229,255,.3)", background: "rgba(0,229,255,.08)", color: "#00e5ff", fontFamily: "inherit" }}>
                        ✅ Confirm
                      </button>
                    )}
                    <button className="stbtn" onClick={() => resend(b.id)} style={{ padding: "4px 8px", borderRadius: 7, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,184,0,.3)", background: "rgba(255,184,0,.08)", color: "#ffb800", fontFamily: "inherit" }}>
                      🔄 Resend
                    </button>
                    {b.status !== "cancelled" && (
                      <button className="stbtn" onClick={() => updateStatus(b.id, "cancelled")} style={{ padding: "4px 8px", borderRadius: 7, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,68,68,.3)", background: "rgba(255,68,68,.08)", color: "#ff4444", fontFamily: "inherit" }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking detail panel */}
        {selected && (
          <div style={{ marginTop: 16, background: "linear-gradient(135deg,rgba(0,16,40,.85),rgba(0,10,26,.95))", border: "1px solid rgba(0,229,255,.2)", borderRadius: 16, padding: 20, animation: "slideIn .25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: "#00e5ff" }}>📋 BOOKING DETAIL — {selected.id}</div>
              <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "4px 10px", color: "rgba(255,255,255,.5)", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>✕ Close</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { l: "Passenger Name", v: selected.passengerName },
                { l: "Passport", v: selected.passport || "-" },
                { l: "Email", v: selected.email || "-" },
                { l: "Phone", v: selected.phone || "-" },
                { l: "Route", v: `${selected.from} → ${selected.to}` },
                { l: "Travel Date", v: selected.date },
                { l: "Airline", v: selected.airline },
                { l: "Flight No.", v: selected.flightNum },
                { l: "Class", v: selected.flightClass },
                { l: "Price", v: selected.price ? `$${selected.price} ${selected.currency}` : "Contact RANIA" },
                { l: "Status", v: STATUS_LABEL[selected.status] },
                { l: "Last Sent", v: selected.sentAt ? formatDate(selected.sentAt) : "Not sent yet" },
              ].map((item) => (
                <div key={item.l} style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginBottom: 4, letterSpacing: 0.8 }}>{item.l.toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{item.v}</div>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div style={{ marginTop: 12, background: "rgba(255,184,0,.05)", border: "1px solid rgba(255,184,0,.2)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "#ffb800", letterSpacing: 0.8, marginBottom: 4 }}>NOTES</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)" }}>{selected.notes}</div>
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => openWhatsApp(selected)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(0,255,136,.4)", background: "rgba(0,255,136,.12)", color: "#00ff88", fontFamily: "inherit" }}>
                💬 Send via WhatsApp
              </button>
              {selected.status === "pending" && (
                <button onClick={() => updateStatus(selected.id, "confirmed")} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(0,229,255,.4)", background: "rgba(0,229,255,.12)", color: "#00e5ff", fontFamily: "inherit" }}>
                  ✅ Mark Confirmed
                </button>
              )}
              <button onClick={() => resend(selected.id)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,184,0,.4)", background: "rgba(255,184,0,.12)", color: "#ffb800", fontFamily: "inherit" }}>
                🔄 Resend Notification
              </button>
              {selected.email && (
                <a href={`mailto:${selected.email}?subject=Booking%20Confirmation%20${selected.id}&body=Dear%20${encodeURIComponent(selected.passengerName)},%0A%0AYour%20booking%20${selected.id}%20for%20${selected.from}→${selected.to}%20on%20${selected.date}%20is%20confirmed!%0A%0ASanimar%20Travel%20RANIA%20AI`}
                  style={{ padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(168,85,247,.4)", background: "rgba(168,85,247,.12)", color: "#a855f7", fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>
                  ✉️ Send Email
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,.2)" }}>
          RANIA AI STAFF MONITOR · SANIMAR TRAVEL · Auto-refreshes every 15s · {filtered.length} bookings shown
        </div>
      </div>
    </div>
  );
}
