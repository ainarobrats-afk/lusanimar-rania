import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";

const API = "/api";

interface TimelineStep {
  key: string;
  label: string;
  labelId: string;
  labelTet: string;
  icon: string;
  done: boolean;
  time: string | null;
  desc: string;
}

interface StatusData {
  bookingId: string;
  status: "received" | "processing" | "completed" | "cancelled";
  steps: TimelineStep[];
  currentStep: number;
  booking: {
    from: string;
    to: string;
    fromName: string;
    toName: string;
    date: string;
    airline: string;
    flightNum: string;
    flightClass: string;
    passengers: number;
    totalPrice: number;
    currency: string;
    passengerName: string;
    email: string;
  };
  createdAt: string;
  estimatedCompletion: string;
}

function timeSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease infinite",
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

export default function BookingStatus() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  const [, navigate] = useLocation();

  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  const CACHE_KEY = `rania_status_${bookingId}`;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/rania/status/${bookingId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Booking not found");
          localStorage.removeItem(CACHE_KEY);
        } else {
          // Try offline cache before showing error
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            setData(JSON.parse(cached));
            setError("⚡ Showing cached data · retrying...");
          } else {
            setError("Failed to load status");
          }
        }
        return;
      }
      const json = await res.json();
      // Persist snapshot for offline use
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(json)); } catch { /* storage full */ }
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      // Network error — serve from cache if available
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setError("📶 Offline — showing last saved status");
      } else {
        setError("Koneksi bermasalah. Cek internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, CACHE_KEY]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ⚡ SMART POLLING — priority-based intervals
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function getInterval(): number {
      if (!data) return 12000;
      const s: string = data.status;
      // HIGH PRIORITY: processing states
      if (s === "processing" || s === "received" || s === "payment_pending" || s === "pending_payment") return 10000;
      // MEDIUM: under review
      if (s === "under_review") return 8000;
      // LOW: stable states
      if (s === "confirmed" || s === "completed" || s === "ticket_issued") return 45000;
      // CANCELLED/FAILED: slow
      if (s === "cancelled" || s === "failed") return 60000;
      // Network-aware: reduce on slow connections
      const conn = (navigator as any).connection;
      if (conn && (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) return 25000;
      return 15000;
    }

    function schedule() {
      timer = setTimeout(() => {
        if (!document.hidden) {
          fetchStatus();
        }
        schedule();
      }, getInterval());
    }

    schedule();

    const onVisibility = () => {
      if (!document.hidden) {
        if (timer) clearTimeout(timer);
        fetchStatus();
        schedule();
      } else {
        if (timer) clearTimeout(timer);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchStatus, data?.status]);

  // Tick for "X seconds ago" label
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const getStatusUrl = () => {
    const base = window.location.origin + window.location.pathname.replace(/\/status\/.*$/, "");
    return `${base}/status/${bookingId}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getStatusUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = getStatusUrl();
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const shareWhatsApp = () => {
    if (!data) return;
    const route = `${data.booking.from} → ${data.booking.to}`;
    const statusLabel = data.status === "completed" ? "✅ CONFIRMED" : data.status === "processing" ? "🔵 PROCESSING" : data.status === "cancelled" ? "❌ CANCELLED" : "🟡 RECEIVED";
    const msg = `✈ *SANIMAR TRAVEL — Booking Status*\n\nRoute: *${route}*\nDate: ${data.booking.date}\nStatus: ${statusLabel}\nID: ${data.bookingId}\n\n🔗 Track live: ${getStatusUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareNative = async () => {
    if (!data) return;
    const url = getStatusUrl();
    const route = `${data.booking.from} → ${data.booking.to}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "RANIA Booking Status",
          text: `Booking ${route} — ${data.status.toUpperCase()} · ${data.bookingId}`,
          url,
        });
        return;
      } catch { /* user cancelled */ }
    }
    copyLink();
  };

  const statusConfig = {
    received: { color: "#f59e0b", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "#f59e0b40", label: "RECEIVED", emoji: "🟡" },
    processing: { color: "#2563eb", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#2563eb30", label: "PROCESSING", emoji: "🔵" },
    completed: { color: "#16a34a", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#16a34a30", label: "CONFIRMED ✓", emoji: "🟢" },
    cancelled: { color: "#dc2626", bg: "linear-gradient(135deg,#fff1f2,#ffe4e6)", border: "#dc262630", label: "CANCELLED", emoji: "🔴" },
  };

  const cfg = data ? (statusConfig[data.status] || statusConfig.received) : statusConfig.received;

  const raniaTip: Record<string, string> = {
    received: "RANIA: Ha'u simu ona booking ita nian. Dadaun ami verifika informasaun.",
    processing: "RANIA: Tiket ita nian dadaun diak liu. Lalais ita sei simu e-ticket.",
    completed: "RANIA: Prontu! Tiket ita nian emitidu ona. Bom viajen! ✈️",
    cancelled: "RANIA: Booking ne'e kansela tiha. Kontaktu ami iha WhatsApp ba ajuda.",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial,sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .status-page-section { animation: fadeIn 0.35s ease forwards; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#0f172a", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0 }}
          aria-label="Back"
        >←</button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>✈ SANIMAR TRAVEL</div>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.05em" }}>RANIA AI · Booking Status</div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px 48px" }}>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton style={{ height: 130, width: "100%" }} />
            <Skeleton style={{ height: 90, width: "100%" }} />
            <Skeleton style={{ height: 180, width: "100%" }} />
            <Skeleton style={{ height: 120, width: "100%" }} />
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 24px" }} className="status-page-section">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Booking Not Found</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>{error}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 24, fontFamily: "monospace" }}>ID: {bookingId}</div>
            <button
              onClick={() => { setLoading(true); fetchStatus(); }}
              style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/")}
              style={{ background: "none", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 32px", fontSize: 14, cursor: "pointer", width: "100%", marginTop: 10 }}
            >
              Back to Home
            </button>
          </div>
        )}

        {/* ── Main content ── */}
        {!loading && !error && data && (
          <>
            {/* SECTION 1 — Hero Status Card */}
            <div className="status-page-section" style={{
              background: cfg.bg,
              border: `1.5px solid ${cfg.border}`,
              borderRadius: 20,
              padding: "22px 20px",
              marginBottom: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                    Booking Status
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      background: cfg.color,
                      color: "#fff",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}>
                      {data.status !== "processing" ? null : (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", opacity: 0.9, display: "inline-block" }} />
                      )}
                      {cfg.label}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Booking ID</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{data.bookingId}</div>
                </div>
              </div>

              {/* Route big display */}
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {data.booking.from} → {data.booking.to}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {data.booking.fromName} → {data.booking.toName}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                Updated {timeSince(lastUpdated.toISOString())} · {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {/* ── Share Button Group ── */}
            <div className="status-page-section" style={{
              display: "flex",
              gap: 10,
              marginBottom: 12,
              position: "relative",
            }}>
              {/* WhatsApp Share */}
              <button
                onClick={shareWhatsApp}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  background: "#dcfce7",
                  color: "#15803d",
                  border: "1.5px solid #bbf7d0",
                  borderRadius: 12,
                  padding: "11px 8px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share WhatsApp
              </button>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  background: copied ? "#eff6ff" : "#f1f5f9",
                  color: copied ? "#2563eb" : "#475569",
                  border: `1.5px solid ${copied ? "#bfdbfe" : "#e2e8f0"}`,
                  borderRadius: 12,
                  padding: "11px 8px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {copied ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy Link
                  </>
                )}
              </button>

              {/* Native Share (if supported — shows as third button) */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={shareNative}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "11px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  aria-label="Share"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
              )}
            </div>

            {/* SECTION 2 — Route Visual */}
            <div className="status-page-section" style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                Flight Route
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {/* Origin */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{data.booking.from}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{data.booking.fromName}</div>
                </div>
                {/* Line + plane */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                  <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1, height: 1, background: "#cbd5e1" }} />
                    <div style={{ fontSize: 20, margin: "0 4px" }}>✈</div>
                    <div style={{ flex: 1, height: 1, background: "#cbd5e1" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
                    {data.booking.airline && `${data.booking.airline} ${data.booking.flightNum}`}
                  </div>
                </div>
                {/* Destination */}
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{data.booking.to}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{data.booking.toName}</div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Date</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{data.booking.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Class</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{data.booking.flightClass || "Economy"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Passengers</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{data.booking.passengers}</div>
                </div>
              </div>
            </div>

            {/* SECTION 3 — Live Status Timeline */}
            <div className="status-page-section" style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                Live Status Timeline
              </div>
              <div style={{ position: "relative" }}>
                {data.steps.map((step, idx) => {
                  const isActive = !step.done && (idx === 0 || data.steps[idx - 1].done);
                  const isDone = step.done;
                  const isFuture = !step.done && !isActive;

                  const dotColor = isDone ? "#16a34a" : isActive ? "#2563eb" : "#cbd5e1";
                  const dotBg = isDone ? "#16a34a" : isActive ? "#eff6ff" : "#f8fafc";
                  const dotBorder = isDone ? "#16a34a" : isActive ? "#2563eb" : "#cbd5e1";
                  const lineColor = isDone ? "#16a34a" : "#e2e8f0";
                  const textColor = isDone ? "#0f172a" : isActive ? "#0f172a" : "#94a3b8";

                  return (
                    <div key={step.key} style={{ display: "flex", gap: 14, position: "relative" }}>
                      {/* Left column: dot + line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                        <div style={{
                          width: 28, height: 28,
                          borderRadius: "50%",
                          background: dotBg,
                          border: `2px solid ${dotBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: isDone ? 14 : 13,
                          fontWeight: 700,
                          color: dotColor,
                          flexShrink: 0,
                          zIndex: 1,
                        }}>
                          {isDone ? "✓" : isActive ? "●" : "○"}
                        </div>
                        {idx < data.steps.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: lineColor, minHeight: 24, margin: "2px 0" }} />
                        )}
                      </div>

                      {/* Right column: content */}
                      <div style={{ paddingBottom: idx < data.steps.length - 1 ? 20 : 0, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: isDone || isActive ? 700 : 400, color: textColor }}>
                              {step.icon} {step.label}
                            </div>
                            {(isDone || isActive) && (
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{step.desc}</div>
                            )}
                          </div>
                          {step.time && (
                            <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", paddingLeft: 8 }}>
                              {formatTime(step.time)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4 — Booking Details */}
            <div className="status-page-section" style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                Booking Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Passenger", value: data.booking.passengerName || "—" },
                  { label: "Route", value: `${data.booking.from} → ${data.booking.to}` },
                  { label: "Travel Date", value: data.booking.date },
                  { label: "Airline", value: data.booking.airline ? `${data.booking.airline} ${data.booking.flightNum}` : "—" },
                  { label: "Class", value: data.booking.flightClass || "Economy" },
                  { label: "Total Paid", value: `$${data.booking.totalPrice} ${data.booking.currency}` },
                  { label: "Contact", value: data.booking.email ? `${data.booking.email.slice(0, 3)}***${data.booking.email.slice(data.booking.email.indexOf("@"))}` : "—" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", textAlign: "right", maxWidth: "55%" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5 — RANIA AI Tip + Live Update Info */}
            <div className="status-page-section" style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, color: "#15803d", lineHeight: 1.5 }}>
                🤖 {raniaTip[data.status] || raniaTip.received}
              </div>
            </div>

            <div className="status-page-section" style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                🔄 Auto update every 15s
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {timeSince(lastUpdated.toISOString())}
              </div>
            </div>

            {/* WhatsApp contact */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <a
                href="https://wa.me/?text=SANIMAR+Travel+Booking+Status+Inquiry"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#25D366", color: "#fff",
                  borderRadius: 12, padding: "12px 24px",
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  width: "100%", justifyContent: "center", boxSizing: "border-box",
                }}
              >
                💬 Contact SANIMAR on WhatsApp
              </a>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
                SANIMAR TRAVEL · Dili, Timor-Leste 🇹🇱
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
