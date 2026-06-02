import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";

const API = "/api";

interface Booking {
  id: string;
  createdAt: string;
  status: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  airline: string;
  flightNum: string;
  flightClass: string;
  totalPrice: number;
  currency: string;
  email: string;
  phone: string;
  passengerName: string;
  passengers?: { name: string; type: string }[];
  adults: number;
  children: number;
  fraudScore?: number;
  fraudFlags?: string[];
  fraudAction?: "allow" | "review" | "block";
  reviewFlag?: boolean;
}

interface TestResult {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  latencyMs?: number;
}

interface TestReport {
  summary: { total: number; passed: number; failed: number; warned: number };
  results: TestResult[];
  duration: number;
  generatedAt: string;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  confirmed:        { bg: "#f0fdf4",  color: "#16a34a", dot: "#16a34a", label: "CONFIRMED" },
  completed:        { bg: "#f0fdf4",  color: "#16a34a", dot: "#16a34a", label: "COMPLETED" },
  ticket_issued:    { bg: "#eff6ff",  color: "#2563eb", dot: "#3b82f6", label: "TICKET ✈" },
  payment_verified: { bg: "#f0fdf4",  color: "#059669", dot: "#10b981", label: "VERIFIED" },
  processing:       { bg: "#eff6ff",  color: "#0284c7", dot: "#0ea5e9", label: "PROCESSING" },
  pending:          { bg: "#fffbeb",  color: "#d97706", dot: "#f59e0b", label: "PENDING" },
  received:         { bg: "#fffbeb",  color: "#d97706", dot: "#f59e0b", label: "RECEIVED" },
  payment_pending:  { bg: "#fff7ed",  color: "#ea580c", dot: "#f97316", label: "PAYMENT" },
  pending_payment:  { bg: "#fff7ed",  color: "#ea580c", dot: "#f97316", label: "PAYMENT" },
  under_review:     { bg: "#fdf4ff",  color: "#9333ea", dot: "#a855f7", label: "🔍 REVIEW" },
  refund_requested: { bg: "#fef9c3",  color: "#a16207", dot: "#ca8a04", label: "REFUND REQ" },
  refunded:         { bg: "#f1f5f9",  color: "#64748b", dot: "#94a3b8", label: "REFUNDED" },
  failed:           { bg: "#fff1f2",  color: "#dc2626", dot: "#f43f5e", label: "⚠ FAILED" },
  cancelled:        { bg: "#fff1f2",  color: "#dc2626", dot: "#ef4444", label: "CANCELLED" },
};

const STATUS_PRIORITY_UI: Record<string, number> = {
  pending_payment: 1, payment_pending: 1, failed: 2,
  under_review: 3, processing: 4, pending: 5, received: 6,
  payment_verified: 7, ticket_issued: 8,
  confirmed: 9, completed: 9,
  refund_requested: 10, refunded: 11, cancelled: 12,
};

function sortByPriority(list: Booking[]) {
  return [...list].sort((a, b) => {
    const pa = STATUS_PRIORITY_UI[a.status] ?? 99;
    const pb = STATUS_PRIORITY_UI[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getCfg(status: string) {
  return STATUS_CFG[status] || STATUS_CFG.pending;
}

const FRAUD_FLAG_LABELS: Record<string, { label: string; color: string }> = {
  ip_velocity_high:         { label: "⚡ IP Velocity High",      color: "#dc2626" },
  ip_velocity_medium:       { label: "⚡ IP Velocity Medium",    color: "#ea580c" },
  email_velocity:           { label: "📧 Email Velocity",        color: "#ea580c" },
  duplicate_booking:        { label: "♊ Duplicate Booking",     color: "#dc2626" },
  duplicate_passenger_today:{ label: "👤 Duplicate Passenger",  color: "#d97706" },
  high_value_transaction:   { label: "💰 High Value",            color: "#9333ea" },
  suspicious_email_domain:  { label: "🚨 Suspicious Email",      color: "#dc2626" },
  price_anomaly:            { label: "📈 Price Anomaly",         color: "#d97706" },
  blocked_ip:               { label: "🚫 Blocked IP",           color: "#dc2626" },
};

function FraudScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#dc2626" : score >= 35 ? "#ea580c" : "#16a34a";
  const bg    = score >= 70 ? "#fff1f2" : score >= 35 ? "#fff7ed" : "#f0fdf4";
  const label = score >= 70 ? "HIGH RISK" : score >= 35 ? "MEDIUM" : "LOW";
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}30`,
      borderRadius: 20, padding: "2px 10px",
      fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
    }}>
      ⚠ {score} · {label}
    </span>
  );
}

function FraudReviewCard({ b, onAction }: { b: Booking; onAction: (id: string, action: "approve" | "reject" | "hold") => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const paxName = b.passengerName || b.passengers?.[0]?.name || "—";
  const cfg = getCfg(b.status);
  const flags = b.fraudFlags || [];

  const act = async (action: "approve" | "reject" | "hold") => {
    setLoading(action);
    await onAction(b.id, action);
    setLoading(null);
  };

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #f97316",
      borderRadius: 16,
      marginBottom: 10,
      overflow: "hidden",
      boxShadow: "0 0 0 3px #fff7ed",
    }}>
      <div style={{ background: "#fff7ed", padding: "10px 14px 8px", borderBottom: "1px solid #fed7aa" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#9a3412" }}>🛡 FRAUD REVIEW</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#92400e" }}>{b.id}</span>
          </div>
          {b.fraudScore !== undefined && <FraudScoreBadge score={b.fraudScore} />}
        </div>
        {flags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {flags.map(f => {
              const fl = FRAUD_FLAG_LABELS[f] || { label: f, color: "#64748b" };
              return (
                <span key={f} style={{
                  background: "#fff",
                  border: `1px solid ${fl.color}40`,
                  color: fl.color,
                  borderRadius: 12, padding: "2px 8px",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {fl.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.color}30`,
            borderRadius: 20, padding: "2px 9px",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(b.createdAt)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{b.from}</span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{b.to}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{b.date}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{paxName}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.email || b.phone || "—"} · {b.flightClass}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#16a34a" }}>${b.totalPrice}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.currency}</div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #fed7aa", display: "flex", gap: 0 }}>
        <button
          onClick={() => act("approve")}
          disabled={!!loading}
          style={{
            flex: 1, background: loading === "approve" ? "#dcfce7" : "#f0fdf4",
            color: "#16a34a", border: "none", borderRight: "1px solid #fed7aa",
            padding: "11px 4px", fontSize: 12, fontWeight: 800, cursor: "pointer",
          }}
        >
          {loading === "approve" ? "..." : "✓ Approve"}
        </button>
        <button
          onClick={() => act("hold")}
          disabled={!!loading}
          style={{
            flex: 1, background: loading === "hold" ? "#f3e8ff" : "#fdf4ff",
            color: "#9333ea", border: "none", borderRight: "1px solid #fed7aa",
            padding: "11px 4px", fontSize: 12, fontWeight: 800, cursor: "pointer",
          }}
        >
          {loading === "hold" ? "..." : "⏸ Hold"}
        </button>
        <a
          href={`/status/${b.id}`}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1, background: "#f8fafc", color: "#475569",
            border: "none", borderRight: "1px solid #fed7aa",
            padding: "11px 4px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", textDecoration: "none", textAlign: "center" as const,
            display: "block",
          }}
        >
          🔗 Status
        </a>
        <button
          onClick={() => act("reject")}
          disabled={!!loading}
          style={{
            flex: 1, background: loading === "reject" ? "#fee2e2" : "#fff1f2",
            color: "#dc2626", border: "none",
            padding: "11px 4px", fontSize: 12, fontWeight: 800, cursor: "pointer",
          }}
        >
          {loading === "reject" ? "..." : "✕ Reject"}
        </button>
      </div>
    </div>
  );
}

function StatPill({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px", minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: accent || "#0f172a", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function BookingCard({
  b, onConfirm, onCancel, onResend, highlight,
}: {
  b: Booking;
  onConfirm: () => void;
  onCancel: () => void;
  onResend: () => void;
  highlight: boolean;
}) {
  const cfg = getCfg(b.status);
  const paxName = b.passengerName || b.passengers?.[0]?.name || "—";

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${highlight ? "#f59e0b" : "#e2e8f0"}`,
      borderRadius: 16,
      marginBottom: 10,
      overflow: "hidden",
      transition: "border-color 0.4s",
      boxShadow: highlight ? "0 0 0 3px #fef3c7" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.color}30`,
            borderRadius: 20, padding: "3px 10px",
            fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{b.id}</span>
        </div>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(b.createdAt)}</span>
      </div>

      <div style={{ padding: "8px 14px 0", display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{b.from}</span>
        <span style={{ fontSize: 16, color: "#94a3b8" }}>→</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{b.to}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{b.date}</span>
      </div>

      <div style={{ padding: "4px 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{paxName}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {b.email || b.phone || "—"} · {b.flightClass || "Economy"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>${b.totalPrice}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.currency}</div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", display: "flex", gap: 0 }}>
        {b.status !== "confirmed" && (
          <button onClick={onConfirm} style={actionBtn("#f0fdf4", "#16a34a")}>✓ Confirm</button>
        )}
        <button onClick={onResend} style={actionBtn("#eff6ff", "#2563eb")}>📧 Resend</button>
        <a
          href={`/status/${b.id}`}
          target="_blank"
          rel="noreferrer"
          style={{ ...actionBtn("#f8fafc", "#475569"), textDecoration: "none", textAlign: "center" as const }}
        >
          🔗 Status
        </a>
        {b.status !== "cancelled" && (
          <button onClick={onCancel} style={actionBtn("#fff1f2", "#dc2626")}>✕</button>
        )}
      </div>
    </div>
  );
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    flex: 1, background: bg, color, border: "none", borderRight: "1px solid #f1f5f9",
    padding: "10px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    transition: "opacity 0.1s",
  };
}

function TestResultCard({ result }: { result: TestResult }) {
  const cfg = result.status === "pass"
    ? { bg: "#f0fdf4", color: "#16a34a", icon: "✓" }
    : result.status === "fail"
    ? { bg: "#fff1f2", color: "#dc2626", icon: "✕" }
    : { bg: "#fffbeb", color: "#d97706", icon: "⚠" };

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 0", borderBottom: "1px solid #f1f5f9",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: cfg.bg, color: cfg.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 1,
        border: `1px solid ${cfg.color}30`,
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{result.name}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{result.detail}</div>
      </div>
      {result.latencyMs !== undefined && (
        <div style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>{result.latencyMs}ms</div>
      )}
    </div>
  );
}

export default function LiveMonitor() {
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "review" | "confirmed" | "pending" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [refreshIn, setRefreshIn] = useState(10);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [liveHealth, setLiveHealth] = useState<"live" | "degraded" | "offline">("live");
  const [lastLatency, setLastLatency] = useState<number>(0);
  const prevIds = useRef<Set<string>>(new Set());
  const dinggedIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastServerTime = useRef<number>(0);
  const lastActiveRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playDing = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const playTone = (freq: number, startTime: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const t = ctx.currentTime;
      playTone(880, t, 0.5, 0.35);
      playTone(1320, t + 0.12, 0.5, 0.25);
      playTone(1760, t + 0.24, 0.7, 0.2);
    } catch { /* AudioContext not available */ }
  }, []);

  // 🧠 Priority-based polling interval
  function getPollInterval(list: Booking[]): number {
    // Check for idle (no activity > 5 min → slow down)
    const idleMs = Date.now() - lastActiveRef.current;
    if (idleMs > 5 * 60 * 1000) return 30000;
    // HIGH PRIORITY: any booking needs urgent attention
    const hasHighPriority = list.some(b =>
      b.status === "under_review" || b.status === "payment_pending" ||
      b.status === "pending_payment" || b.status === "processing"
    );
    if (hasHighPriority) return 8000;
    // Network-aware
    const conn = (navigator as any).connection;
    if (conn && (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) return 20000;
    return 10000;
  }

  const fetchBookings = useCallback(async (delta = false) => {
    const t0 = Date.now();
    try {
      const params = new URLSearchParams();
      if (delta && lastServerTime.current > 0) {
        params.set("since", String(lastServerTime.current - 5000)); // 5s overlap for safety
      }
      const res = await fetch(`${API}/rania/bookings?${params}`);
      const latency = Date.now() - t0;
      setLastLatency(latency);
      setLiveHealth(latency < 800 ? "live" : latency < 2500 ? "degraded" : "live");

      const data = await res.json();
      if (data.serverTime) lastServerTime.current = data.serverTime;

      const incoming: Booking[] = data.bookings || [];

      setBookings(prev => {
        let merged = delta ? [...prev] : [];
        if (delta) {
          // Merge delta: update existing + add new
          incoming.forEach(nb => {
            const idx = merged.findIndex(b => b.id === nb.id);
            if (idx >= 0) merged[idx] = nb; else merged.unshift(nb);
          });
        } else {
          merged = incoming;
        }

        const incomingIds = new Set(incoming.map(b => b.id));
        const fresh: string[] = [];
        incomingIds.forEach(id => {
          if (!prevIds.current.has(id) && !dinggedIds.current.has(id)) fresh.push(id);
        });

        if (fresh.length > 0) {
          setNewIds(new Set(fresh));
          setTimeout(() => setNewIds(new Set()), 5000);
          // Sound dedup — only ding once per booking
          fresh.forEach(id => dinggedIds.current.add(id));
          playDing();
        }

        if (!delta) prevIds.current = incomingIds;
        return merged;
      });

      setLastFetch(new Date());
    } catch {
      setLiveHealth("offline");
    } finally {
      setLoading(false);
    }
  }, [playDing]);

  useEffect(() => {
    fetchBookings(false);

    // Track user activity for idle detection
    const onActivity = () => { lastActiveRef.current = Date.now(); };
    document.addEventListener("mousemove", onActivity, { passive: true });
    document.addEventListener("keydown", onActivity, { passive: true });
    document.addEventListener("touchstart", onActivity, { passive: true });

    function scheduleNext(list?: Booking[]) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!document.hidden) {
          fetchBookings(true);
        }
        scheduleNext();
      }, list ? getPollInterval(list) : 10000);
    }

    scheduleNext();

    const onVisibility = () => {
      if (!document.hidden) {
        fetchBookings(false);
        scheduleNext();
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("mousemove", onActivity);
      document.removeEventListener("keydown", onActivity);
      document.removeEventListener("touchstart", onActivity);
    };
  }, [fetchBookings]);

  useEffect(() => {
    const interval = getPollInterval(bookings);
    setRefreshIn(Math.round(interval / 1000));
    const t = setInterval(() => {
      if (!document.hidden) setRefreshIn(n => (n <= 1 ? Math.round(getPollInterval(bookings) / 1000) : n - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [lastFetch, bookings]);

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 2000);
  };

  const patchStatus = async (id: string, status: string) => {
    await fetch(`${API}/rania/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showMsg(status === "confirmed" ? "✅ Booking confirmed!" : "❌ Booking cancelled");
    fetchBookings();
  };

  const resend = async (id: string) => {
    await fetch(`${API}/rania/bookings/${id}/resend`, { method: "POST" });
    showMsg("📧 E-ticket resent!");
  };

  const handleFraudAction = async (id: string, action: "approve" | "reject" | "hold") => {
    await fetch(`${API}/rania/fraud/review/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const msgs = { approve: "✅ Booking approved!", reject: "🚫 Booking rejected", hold: "⏸ Booking held for review" };
    showMsg(msgs[action]);
    fetchBookings();
  };

  const runSystemTest = async () => {
    setTestLoading(true);
    setShowTestPanel(true);
    try {
      const res = await fetch(`${API}/rania/test/run`);
      const data: TestReport = await res.json();
      setTestReport(data);
    } catch {
      setTestReport(null);
    } finally {
      setTestLoading(false);
    }
  };

  const REVIEW_STATUSES = ["under_review", "payment_pending", "pending_payment", "failed"];
  const PENDING_STATUSES = ["pending", "received", "payment_pending", "pending_payment", "processing", "payment_verified"];
  const CONFIRMED_STATUSES = ["confirmed", "completed", "ticket_issued"];

  const sortedBookings = sortByPriority(bookings);

  const fraudQueue = sortedBookings.filter(b =>
    b.reviewFlag === true || b.fraudAction === "review" || b.status === "under_review"
  );

  const filtered = sortedBookings.filter(b => {
    if (filter === "review"    && !REVIEW_STATUSES.includes(b.status)) return false;
    if (filter === "pending"   && !PENDING_STATUSES.includes(b.status)) return false;
    if (filter === "confirmed" && !CONFIRMED_STATUSES.includes(b.status)) return false;
    if (filter === "cancelled" && b.status !== "cancelled") return false;
    const q = search.toLowerCase();
    if (q && !b.id.toLowerCase().includes(q)
      && !b.email?.toLowerCase().includes(q)
      && !b.from.toLowerCase().includes(q)
      && !b.to.toLowerCase().includes(q)
      && !(b.passengerName || "").toLowerCase().includes(q)) return false;
    return true;
  });

  const todayAll = bookings.filter(b => isToday(b.createdAt));
  const todayRevenue = todayAll.reduce((s, b) => s + (b.totalPrice || 0), 0);
  const pending = bookings.filter(b => PENDING_STATUSES.includes(b.status)).length;
  const reviewCount = bookings.filter(b => REVIEW_STATUSES.includes(b.status)).length;
  const totalRevenue = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial,sans-serif" }}>
      <div style={{
        background: "#0f172a", padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}
          >←</button>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: "-0.02em" }}>📡 LIVE MONITOR</div>
            <div style={{ color: "#475569", fontSize: 10 }}>SANIMAR TRAVEL · RANIA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pending > 0 && (
            <div style={{
              background: "#ef4444", color: "#fff",
              borderRadius: 20, padding: "2px 10px",
              fontSize: 11, fontWeight: 800,
              animation: "pulse 1.5s ease infinite",
            }}>
              {pending} PENDING
            </div>
          )}
          <button
            onClick={runSystemTest}
            disabled={testLoading}
            style={{
              background: testLoading ? "#374151" : "#1e293b",
              color: testLoading ? "#94a3b8" : "#22d3ee",
              border: "1px solid #334155",
              borderRadius: 8, padding: "5px 10px",
              fontSize: 11, fontWeight: 700, cursor: testLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            {testLoading ? "⏳ Testing..." : "🧪 Run Test"}
          </button>
          {/* 📊 LIVE HEALTH BADGE */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: liveHealth === "live" ? "rgba(34,197,94,0.1)" : liveHealth === "degraded" ? "rgba(251,146,60,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${liveHealth === "live" ? "rgba(34,197,94,0.3)" : liveHealth === "degraded" ? "rgba(251,146,60,0.35)" : "rgba(239,68,68,0.35)"}`,
            borderRadius: 20, padding: "3px 10px",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: liveHealth === "live" ? "#22c55e" : liveHealth === "degraded" ? "#fb923c" : "#ef4444",
              boxShadow: liveHealth === "live" ? "0 0 6px #22c55e" : liveHealth === "degraded" ? "0 0 6px #fb923c" : "0 0 6px #ef4444",
              animation: liveHealth !== "offline" ? "pulse 1.5s ease infinite" : "none",
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.04em",
              color: liveHealth === "live" ? "#22c55e" : liveHealth === "degraded" ? "#fb923c" : "#ef4444",
            }}>
              {liveHealth === "live" ? "LIVE" : liveHealth === "degraded" ? "DEGRADED" : "OFFLINE"}
              {liveHealth !== "offline" && ` · ${refreshIn}s`}
            </span>
            {lastLatency > 0 && liveHealth !== "offline" && (
              <span style={{ fontSize: 9, color: "#475569", marginLeft: 2 }}>{lastLatency}ms</span>
            )}
          </div>
        </div>
      </div>

      {actionMsg && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: "#0f172a", color: "#fff",
          borderRadius: 24, padding: "10px 22px",
          fontSize: 13, fontWeight: 700, zIndex: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>
          {actionMsg}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .bk-card { animation: slideIn 0.25s ease forwards; }
      `}</style>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "14px 12px 48px" }}>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <StatPill label="Today" value={todayAll.length} sub={`$${todayRevenue.toFixed(0)}`} accent="#2563eb" />
          <StatPill label="Pending" value={pending} sub="need action" accent={pending > 0 ? "#dc2626" : "#94a3b8"} />
          <StatPill label="Total Rev" value={`$${totalRevenue.toFixed(0)}`} sub={`${bookings.length} bookings`} accent="#16a34a" />
        </div>

        {/* E2E Test Results Panel */}
        {showTestPanel && (
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 16, marginBottom: 14, overflow: "hidden",
          }}>
            <div style={{
              background: "#0f172a", padding: "10px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ color: "#22d3ee", fontWeight: 800, fontSize: 13 }}>🧪 System Test Results</div>
              <button
                onClick={() => setShowTestPanel(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}
              >✕</button>
            </div>
            {testLoading && (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                Running tests...
              </div>
            )}
            {!testLoading && testReport && (
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: "#f0fdf4", borderRadius: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>{testReport.summary.passed}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>PASSED</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: "#fff1f2", borderRadius: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#dc2626" }}>{testReport.summary.failed}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>FAILED</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: "#fffbeb", borderRadius: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#d97706" }}>{testReport.summary.warned}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>WARNED</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: "#f1f5f9", borderRadius: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#475569" }}>{testReport.duration}ms</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>DURATION</div>
                  </div>
                </div>
                <div>
                  {testReport.results.map((r, i) => (
                    <TestResultCard key={i} result={r} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, textAlign: "right" }}>
                  Run at {new Date(testReport.generatedAt).toLocaleTimeString()}
                </div>
              </div>
            )}
            {!testLoading && !testReport && (
              <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                Failed to load test results
              </div>
            )}
          </div>
        )}

        {/* Fraud Review Queue */}
        {fraudQueue.length > 0 && filter !== "confirmed" && filter !== "cancelled" && filter !== "pending" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              padding: "8px 12px",
              background: "#fff7ed", border: "1px solid #fed7aa",
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 14 }}>🛡</span>
              <span style={{ fontWeight: 800, fontSize: 12, color: "#9a3412" }}>
                FRAUD REVIEW QUEUE — {fraudQueue.length} booking{fraudQueue.length !== 1 ? "s" : ""} need attention
              </span>
            </div>
            {fraudQueue.map(b => (
              <div key={b.id} className="bk-card">
                <FraudReviewCard b={b} onAction={handleFraudAction} />
              </div>
            ))}
          </div>
        )}

        {/* Search + filter */}
        <div style={{ marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search ID, email, route, passenger..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: "#0f172a", outline: "none",
              marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {(([
              { key: "all",       label: `All (${bookings.length})`,                                                    accent: undefined },
              { key: "review",    label: `🔍 Review (${reviewCount})`,                                                   accent: reviewCount > 0 ? "#9333ea" : undefined },
              { key: "pending",   label: `⏳ Pending (${bookings.filter(b => PENDING_STATUSES.includes(b.status)).length})`, accent: undefined },
              { key: "confirmed", label: `✓ Done (${bookings.filter(b => CONFIRMED_STATUSES.includes(b.status)).length})`,  accent: undefined },
              { key: "cancelled", label: `✕ Cancelled (${bookings.filter(b => b.status === "cancelled").length})`,        accent: undefined },
            ]) as { key: typeof filter; label: string; accent: string | undefined }[]).map(({ key, label, accent }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  flexShrink: 0,
                  background: filter === key ? (accent || "#0f172a") : "#fff",
                  color: filter === key ? "#fff" : (accent || "#64748b"),
                  border: `1px solid ${accent && filter !== key ? accent : "#e2e8f0"}`,
                  borderRadius: 20, padding: "5px 14px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
            <div style={{ fontSize: 13 }}>Loading bookings...</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{bookings.length === 0 ? "📭" : "🔍"}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              {bookings.length === 0 ? "No bookings yet" : "No results"}
            </div>
            <div style={{ fontSize: 12 }}>
              {bookings.length === 0 ? "Bookings from RANIA chat will appear here" : "Try a different search or filter"}
            </div>
          </div>
        )}

        {!loading && filtered.map(b => (
          <div key={b.id} className="bk-card">
            <BookingCard
              b={b}
              highlight={newIds.has(b.id)}
              onConfirm={() => patchStatus(b.id, "confirmed")}
              onCancel={() => patchStatus(b.id, "cancelled")}
              onResend={() => resend(b.id)}
            />
          </div>
        ))}

        {!loading && filtered.length > 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""} · updated {timeAgo(lastFetch.toISOString())}
          </div>
        )}
      </div>
    </div>
  );
}
