import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { jsPDF } from "jspdf";

const API = "/api";
const CYAN = "#00FFD1";

function getToken() { return localStorage.getItem("adminToken") || ""; }
function getEmail() { return localStorage.getItem("adminEmail") || ""; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getToken(),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin";
    throw new Error("Unauthorized");
  }
  return res.json();
}

type MenuItem = {
  id: string;
  label: string;
  icon: string;
};

const MENU: MenuItem[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "liveops", label: "Live Ops", icon: "🌍" },
  { id: "bookings", label: "Booking Control", icon: "📦" },
  { id: "ai", label: "AI Intelligence", icon: "🧠" },
  { id: "revenue", label: "Revenue Cockpit", icon: "💰" },
  { id: "incidents", label: "Incident / UGD", icon: "🚨" },
  { id: "staff", label: "Staff Performance", icon: "👥" },
  { id: "audit", label: "Black Box Audit", icon: "⚫" },
  { id: "qa", label: "QA Platform", icon: "🧪" },
  { id: "apikeys", label: "API Key Management", icon: "🔑" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "users", label: "User Management", icon: "👤" },
  { id: "premium", label: "Premium Manager", icon: "⭐" },
  { id: "hotels", label: "Hotel Partners", icon: "🏨" },
  { id: "promos", label: "Promo Codes", icon: "🎟️" },
  { id: "flashdeals", label: "Flash Deals", icon: "⚡" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = CYAN }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#111118] border border-white/5 rounded-xl p-4 hover:border-[#00FFD1]/20 transition-colors">
      <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { apiFetch("/admin/stats").then(setStats); }, []);
  if (!stats) return <div className="text-white/40 animate-pulse">Loading stats...</div>;

  const dailyTrend = stats.dailyTrend || [];

  return (
    <Section title="Overview" icon="📊">
      {/* Top KPIs with highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Chat Today" value={stats.chatsToday?.toLocaleString() || "—"} color="#22d3ee" sub="messages processed" />
        <div className="bg-[#111118] border border-red-500/30 rounded-xl p-4 relative">
          <div className="text-white/50 text-xs font-mono uppercase mb-1">Pending Bookings</div>
          <div className="text-2xl font-black text-red-400">{stats.pendingBookings || 0}</div>
          {stats.pendingBookings > 0 && (
            <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
          <div className="text-white/30 text-[10px] mt-1">needs action</div>
        </div>
        <StatCard label="Active Users Now" value={stats.activeChatsNow} color="#f87171" sub="live sessions" />
        <div className="bg-[#111118] border border-white/5 rounded-xl p-4">
          <div className="text-white/50 text-xs font-mono uppercase mb-1">System Uptime</div>
          <div className="text-2xl font-black text-emerald-400">{stats.uptimeStr || `${stats.uptime}%`}</div>
          <div className="text-white/30 text-[10px] mt-1">{stats.uptime}% availability</div>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <StatCard label="Users Today" value={stats.usersToday} />
        <StatCard label="Total Bookings" value={stats.totalBookings} color="#a78bfa" />
        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="#34d399" />
        <StatCard label="Today Revenue" value={`$${stats.todayRevenue.toLocaleString()}`} color="#34d399" />
        <StatCard label="Commission Today" value={`$${stats.commissionToday || 0}`} color="#fbbf24" sub="5% Sanimar" />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} color="#fbbf24" />
        <StatCard label="Avg Response" value={`${stats.avgResponseTime}ms`} />
      </div>

      {/* Last 7 Days Chart */}
      {dailyTrend.length > 0 && (
        <div>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Last 7 Days — Revenue & Commission</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyTrend}>
              <XAxis dataKey="day" tick={{ fill: "#ffffff40", fontSize: 10 }} />
              <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff10", borderRadius: "8px" }}
                formatter={(v: any, name: string) => [`$${Number(v).toLocaleString()}`, name === "revenue" ? "Revenue" : "Commission"]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#ffffff60" }} />
              <Bar dataKey="revenue" fill={CYAN} radius={[3, 3, 0, 0]} />
              <Bar dataKey="commission" fill="#fbbf24" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}

// ─── Live Ops ─────────────────────────────────────────────────────────────────
function LiveOps() {
  const [data, setData] = useState<any>(null);
  const refresh = useCallback(() => { apiFetch("/admin/live-ops").then(setData); }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  if (!data) return <div className="text-white/40 animate-pulse">Connecting to live feed...</div>;
  return (
    <Section title="Live Ops" icon="🌍">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard label="Active Sessions" value={data.activeSessions} color="#f87171" />
            <StatCard label="Avg Response" value={`${data.avgResponseTimeMs}ms`} />
          </div>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Users by Country</h3>
          <div className="space-y-2">
            {data.countries.map((c: any) => (
              <div key={c.code} className="flex items-center gap-3 bg-[#111118] rounded-lg px-3 py-2">
                <span className="text-xl">{c.flag}</span>
                <span className="text-white text-sm flex-1">{c.name}</span>
                <span className="text-[#00FFD1] font-bold font-mono">{c.count}</span>
                <div className="w-20 bg-white/5 rounded-full h-1.5">
                  <div className="bg-[#00FFD1] h-1.5 rounded-full" style={{ width: `${Math.min(100, (c.count / 120) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Live Activity Feed</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.liveActivity.map((a: any, i: number) => (
              <div key={i} className="bg-[#111118] border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#00FFD1] text-xs">●</span>
                  <span className="text-white/70">[User from <strong className="text-white">{a.country}</strong>] {a.action}</span>
                </div>
                <div className="text-white/30 text-xs mt-1 font-mono">{a.route} · {new Date(a.time).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Booking Control ──────────────────────────────────────────────────────────
function BookingControl() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/rania/bookings");
      setBookings(data.bookings || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    if (filter !== "all" && b.status !== filter) return false;
    if (search && !b.id.toLowerCase().includes(search.toLowerCase()) && !b.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/rania/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  async function resend(id: string) {
    await apiFetch(`/rania/bookings/${id}/resend`, { method: "POST" });
    alert("Ticket resent!");
  }

  function exportCsv() {
    const rows = [
      ["ID", "Email", "Route", "Date", "Status", "Amount"],
      ...bookings.map(b => [b.id, b.email, `${b.from}→${b.to}`, b.date, b.status, b.totalPrice]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "bookings.csv";
    a.click();
  }

  function exportETicketPDF(b: any) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, margin = 18;
    let y = 0;

    // ── Background ──
    doc.setFillColor(5, 8, 20);
    doc.rect(0, 0, W, 297, "F");

    // ── Header band ──
    doc.setFillColor(0, 30, 50);
    doc.rect(0, 0, W, 48, "F");
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.6);
    doc.line(0, 48, W, 48);

    // Airline color accent bar
    doc.setFillColor(0, 229, 255);
    doc.rect(0, 0, 5, 48, "F");

    // Logo placeholder
    doc.setFillColor(0, 229, 255, 0.15);
    doc.roundedRect(margin, 10, 36, 28, 4, 4, "F");
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("✈ SANIMAR", margin + 18, 26, { align: "center" });
    doc.setFontSize(6);
    doc.text("TRAVEL", margin + 18, 31, { align: "center" });

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ELECTRONIC TICKET", 65, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 229, 255);
    doc.text("RANIA AI BOOKING SYSTEM · SANIMAR TRAVEL TIMOR-LESTE", 65, 30);
    doc.setTextColor(180, 180, 180);
    doc.text(`Booking Reference: ${b.id}`, 65, 38);
    doc.text(`Issued: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, 65, 44);

    y = 60;

    // ── Route section ──
    doc.setFillColor(10, 20, 40);
    doc.roundedRect(margin, y, W - margin * 2, 38, 4, 4, "F");
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, W - margin * 2, 38, 4, 4, "S");

    // FROM
    doc.setTextColor(140, 140, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("FROM", margin + 8, y + 9);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(b.from || "---", margin + 8, y + 24);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 180);
    doc.text(b.fromName || b.from, margin + 8, y + 32);

    // Arrow
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(20);
    doc.text("→", W / 2, y + 24, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(b.airline || "RANIA Booking", W / 2, y + 32, { align: "center" });

    // TO
    doc.setTextColor(140, 140, 160);
    doc.setFontSize(7);
    doc.text("TO", W - margin - 40, y + 9);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(b.to || "---", W - margin - 8, y + 24, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 180);
    doc.text(b.toName || b.to, W - margin - 8, y + 32, { align: "right" });

    y += 46;

    // ── Flight details grid ──
    const fields = [
      ["Flight Number", b.flightNum || "N/A"],
      ["Date", b.date || "N/A"],
      ["Class", b.flightClass || "Economy"],
      ["Airline", b.airline || "N/A"],
      ["Passengers", String((b.adults || 1) + (b.children || 0))],
      ["Status", (b.status || "confirmed").toUpperCase()],
    ];
    const colW = (W - margin * 2) / 3;
    fields.forEach((f, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const fx = margin + col * colW, fy = y + row * 20;
      doc.setFillColor(10, 18, 35);
      doc.roundedRect(fx, fy, colW - 3, 17, 2, 2, "F");
      doc.setTextColor(100, 180, 220);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text(f[0].toUpperCase(), fx + 4, fy + 6);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(f[1], fx + 4, fy + 13);
    });
    y += 46;

    // ── Passenger details ──
    doc.setFillColor(8, 15, 30);
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, "F");
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PASSENGER INFORMATION", margin + 4, y + 5.5);
    y += 12;

    const pax = b.passengers && b.passengers.length > 0
      ? b.passengers
      : [{ name: b.passengerName || "Passenger", passport: b.passport || "N/A", type: "adult", baggage: 20 }];

    pax.forEach((p: any, i: number) => {
      doc.setFillColor(12, 22, 42);
      doc.roundedRect(margin, y, W - margin * 2, 22, 2, 2, "F");
      doc.setDrawColor(30, 60, 90);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, W - margin * 2, 22, 2, 2, "S");

      doc.setTextColor(0, 229, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`PAX ${i + 1} · ${(p.type || "adult").toUpperCase()}`, margin + 4, y + 6);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(p.name || "N/A", margin + 4, y + 14);
      doc.setTextColor(160, 160, 180);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Passport: ${p.passport || "N/A"}`, margin + 4, y + 20);
      doc.text(`Baggage: ${p.baggage || 20}kg`, W / 2, y + 20);
      y += 26;
    });

    y += 4;

    // ── Contact info ──
    doc.setFillColor(8, 15, 30);
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, "F");
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CONTACT & PRICE SUMMARY", margin + 4, y + 5.5);
    y += 12;

    doc.setFillColor(12, 22, 42);
    doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, "F");
    doc.setTextColor(160, 160, 180);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Email: ${b.email || "N/A"}`, margin + 4, y + 8);
    doc.text(`Phone: ${b.phone || "N/A"}`, margin + 4, y + 15);
    doc.text(`Base Fare: $${b.baseFare || 0}   Taxes: $${b.taxes || 0}   Baggage: $${b.baggageFee || 0}`, margin + 4, y + 22);
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${b.totalPrice || b.price || 0} ${b.currency || "USD"}`, W - margin - 4, y + 22, { align: "right" });
    y += 34;

    // ── Barcode-style footer ──
    doc.setFillColor(0, 10, 20);
    doc.rect(0, 257, W, 40, "F");
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.4);
    doc.line(0, 257, W, 257);

    // Simulated barcode stripes
    const barcodeX = margin;
    const barcodeY = 262;
    const barcodeH = 20;
    const stripeWidths = [1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1, 2, 1, 2, 1, 3, 2, 1, 1, 2, 1, 1, 2, 1];
    let bx = barcodeX;
    stripeWidths.forEach((w, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(bx, barcodeY, w * 1.2, barcodeH, "F");
      }
      bx += w * 1.2 + 1;
    });
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`*${b.id}*`, barcodeX + 60, barcodeY + 26);

    // QR-like box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W - margin - 28, 261, 20, 20, 1, 1, "F");
    doc.setFillColor(5, 8, 20);
    doc.roundedRect(W - margin - 25, 264, 14, 14, 0.5, 0.5, "F");
    doc.setFillColor(255, 255, 255);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (Math.random() > 0.4) doc.rect(W - margin - 24 + c * 3, 265 + r * 3, 2.5, 2.5, "F");
    }

    doc.setTextColor(120, 120, 140);
    doc.setFontSize(6.5);
    doc.text("RANIA AI · SANIMAR TRAVEL · Dili, Timor-Leste · +670 1234 5678 · luisanimar@gmail.com", W / 2, 286, { align: "center" });
    doc.text("This is an electronic ticket. Present this document at check-in. Powered by RANIA AI.", W / 2, 291, { align: "center" });

    doc.save(`eticket_${b.id}.pdf`);
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    payment_pending: "bg-orange-500/20 text-orange-400",
    cancelled: "bg-red-500/20 text-red-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <Section title="Booking Control" icon="📦">
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID or email..." className="bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm flex-1 min-w-40 focus:outline-none focus:border-[#00FFD1]/40" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
          {["all","pending","confirmed","payment_pending","cancelled","failed"].map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
        </select>
        <button onClick={exportCsv} className="bg-[#00FFD1]/10 border border-[#00FFD1]/30 text-[#00FFD1] text-sm px-4 py-2 rounded-lg hover:bg-[#00FFD1]/20 transition-colors">Export CSV</button>
        <span className="text-white/30 text-xs self-center font-mono">· Click 🎫 on any booking to download E-Ticket PDF</span>
      </div>
      {loading ? <div className="text-white/40 animate-pulse">Loading bookings...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs font-mono uppercase">
                <th className="text-left py-2 px-3">Booking ID</th>
                <th className="text-left py-2 px-3">User</th>
                <th className="text-left py-2 px-3">Route</th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-white/30 py-8">No bookings found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="py-2 px-3 text-[#00FFD1] font-mono text-xs">{b.id}</td>
                  <td className="py-2 px-3 text-white/70 truncate max-w-32">{b.email || b.passengerName}</td>
                  <td className="py-2 px-3 text-white font-bold">{b.from}→{b.to}</td>
                  <td className="py-2 px-3 text-white/60 text-xs">{b.date}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${statusColors[b.status] || "bg-white/10 text-white/60"}`}>{b.status}</span>
                  </td>
                  <td className="py-2 px-3 text-green-400 font-mono">${b.totalPrice || b.price || 0}</td>
                  <td className="py-2 px-3 flex gap-1 flex-wrap">
                    <button onClick={() => updateStatus(b.id, "confirmed")} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30">✓</button>
                    <button onClick={() => resend(b.id)} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30">📧</button>
                    <button onClick={() => exportETicketPDF(b)} title="Download E-Ticket PDF" className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded hover:bg-cyan-500/30 font-bold">🎫 PDF</button>
                    <button onClick={() => updateStatus(b.id, "cancelled")} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ─── AI Intelligence ──────────────────────────────────────────────────────────
function AIIntelligence() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetch("/admin/ai-status").then(setData); }, []);
  if (!data) return <div className="text-white/40 animate-pulse">Loading AI status...</div>;

  const PIE_COLORS = [CYAN, "#a78bfa", "#fbbf24", "#f87171", "#34d399"];

  return (
    <Section title="AI Intelligence" icon="🧠">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Provider Status</h3>
          <div className="space-y-3 mb-4">
            {data.providers.map((p: any) => (
              <div key={p.name} className="flex items-center gap-3 bg-[#111118] rounded-lg px-4 py-3 border border-white/5">
                <span className="text-lg">{p.status === "online" ? "✅" : "❌"}</span>
                <span className="text-white flex-1">{p.name}</span>
                <span className={`text-xs font-mono px-2 py-1 rounded ${p.status === "online" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="API Calls Today" value={data.apiCallsToday.toLocaleString()} />
            <StatCard label="Token Usage" value={`${(data.tokenUsageToday / 1000).toFixed(0)}K`} />
            <StatCard label="Avg Latency" value={`${data.avgLatencyMs}ms`} />
            <StatCard label="Fallbacks" value={data.fallbackCount} color="#fbbf24" />
          </div>
        </div>
        <div>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Top Intents</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.topIntents} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.topIntents.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff10", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3 mt-4">Rate Limit Status</h3>
          <div className="space-y-2">
            {data.rateLimitStatus.map((r: any) => (
              <div key={r.provider} className="bg-[#111118] rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/70">{r.provider}</span>
                  <span className="text-white/50">{r.used}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full">
                  <div className={`h-1.5 rounded-full transition-all ${r.used > 80 ? "bg-red-400" : r.used > 60 ? "bg-yellow-400" : "bg-[#00FFD1]"}`} style={{ width: `${r.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Revenue Cockpit ──────────────────────────────────────────────────────────
function RevenueCockpit() {
  const [stats, setStats] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);
  useEffect(() => {
    apiFetch("/admin/stats").then(setStats);
    fetch(`${API}/rania/revenue-by-currency`).then(r => r.json()).then(setCurrencyData).catch(() => {});
  }, []);
  if (!stats) return <div className="text-white/40 animate-pulse">Loading revenue...</div>;

  const CUR_COLORS: Record<string, string> = { USD: CYAN, IDR: "#fbbf24", AUD: "#34d399", GBP: "#a78bfa", EUR: "#f472b6", SGD: "#fb923c", JPY: "#38bdf8" };
  const currencyPie = currencyData?.byCurrency?.length
    ? currencyData.byCurrency.map((c: any) => ({ name: c.currency, value: c.totalRevenue || 0, bookings: c.bookings }))
    : [{ name: "USD", value: 100 }];
  const totalMarkup = currencyData?.totalMarkup || 0;
  const markupPct = currencyData?.markupPct || stats.commissionPct || 5;
  const commissionByRoute = stats.commissionByRoute || [];
  const dailyTrend = stats.dailyTrend || [];

  return (
    <Section title="Revenue Cockpit" icon="💰">
      {/* Main revenue stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="#34d399" />
        <StatCard label="Today" value={`$${stats.todayRevenue.toLocaleString()}`} color="#34d399" />
        <StatCard label="This Week" value={`$${stats.weekRevenue.toLocaleString()}`} color="#34d399" />
        <StatCard label="This Month" value={`$${stats.monthRevenue.toLocaleString()}`} color="#34d399" />
      </div>

      {/* Commission earned section */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 text-lg">🏆</span>
          <h3 className="text-amber-300 font-bold text-sm">Commission Earned (Sanimar {markupPct}%)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-[10px] text-white/40 font-mono uppercase mb-1">Total</div>
            <div className="text-xl font-black text-amber-400">${(stats.commissionTotal || totalMarkup || 0).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/40 font-mono uppercase mb-1">This Month</div>
            <div className="text-xl font-black text-amber-300">${(stats.commissionMonth || 0).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/40 font-mono uppercase mb-1">This Week</div>
            <div className="text-xl font-black text-yellow-400">${(stats.commissionWeek || 0).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/40 font-mono uppercase mb-1">Today</div>
            <div className="text-xl font-black text-yellow-300">${(stats.commissionToday || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-500/10 grid grid-cols-3 gap-2">
          <div className="text-center"><span className="text-[10px] text-white/30">Net Revenue</span><br/><span className="text-sm font-bold text-white">${(stats.netRevenue || 0).toLocaleString()}</span></div>
          <div className="text-center"><span className="text-[10px] text-white/30">Refunded</span><br/><span className="text-sm font-bold text-red-400">-${(stats.refundedAmount || 0).toLocaleString()}</span></div>
          <div className="text-center"><span className="text-[10px] text-white/30">Avg Booking</span><br/><span className="text-sm font-bold text-white">${stats.avgBookingValue}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Trend (7 days) */}
        <div className="lg:col-span-2">
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Daily Revenue Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyTrend}>
              <XAxis dataKey="day" tick={{ fill: "#ffffff40", fontSize: 10 }} />
              <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff10", borderRadius: "8px" }}
                formatter={(v: any, name: string) => [`$${Number(v).toLocaleString()}`, name === "revenue" ? "Revenue" : "Commission"]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#ffffff60" }} />
              <Bar dataKey="revenue" fill={CYAN} radius={[3, 3, 0, 0]} />
              <Bar dataKey="commission" fill="#fbbf24" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Commission by Route */}
        <div>
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Commission by Route</h3>
          <div className="space-y-2">
            {commissionByRoute.map((r: any) => (
              <div key={r.route} className="bg-[#111118] border border-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-xs font-bold">{r.route}</span>
                  <span className="text-amber-400 text-xs font-bold">${r.commission}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-full h-1">
                    <div className="bg-amber-400 h-1 rounded-full" style={{ width: `${Math.min(100, (r.commission / 1500) * 100)}%` }} />
                  </div>
                  <span className="text-white/30 text-[9px]">{r.bookings} bkg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currency breakdown */}
      {currencyData?.byCurrency?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Revenue by Currency</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={currencyPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {currencyPie.map((c: any, i: number) => <Cell key={i} fill={CUR_COLORS[c.name] || "#64748b"} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff10", borderRadius: "8px" }} formatter={(v: any, _: any, props: any) => [`$${Number(v).toLocaleString()} (${props.payload?.bookings || 0} bookings)`, props.payload?.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5">
              {currencyData.byCurrency.map((c: any) => (
                <div key={c.currency} className="bg-white/4 border border-white/8 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-white/40 font-mono">{c.currency}</div>
                  <div className="text-xs font-black" style={{ color: CUR_COLORS[c.currency] || "#64748b" }}>${(c.totalRevenue || 0).toFixed(0)}</div>
                  <div className="text-[8px] text-white/30">{c.bookings} bkg · +${(c.markupRevenue || 0).toFixed(0)} mkp</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Incidents ────────────────────────────────────────────────────────────────
function Incidents() {
  const [data, setData] = useState<any>(null);
  const refresh = useCallback(() => { apiFetch("/admin/incidents").then(setData); }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);
  if (!data) return <div className="text-white/40 animate-pulse">Loading incidents...</div>;

  const sevColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const statusColors: Record<string, string> = {
    resolved: "text-green-400",
    investigating: "text-yellow-400",
    unresolved: "text-red-400",
  };

  return (
    <Section title="Incident / UGD" icon="🚨">
      <p className="text-white/30 text-xs mb-4 font-mono">Auto-refresh every 10s · Last: {new Date().toLocaleTimeString()}</p>
      <div className="space-y-3">
        {data.incidents.map((inc: any) => (
          <div key={inc.id} className={`border rounded-xl p-4 ${sevColors[inc.severity] || "bg-white/5 border-white/10"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono opacity-60">{inc.id}</span>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-black/20">{inc.severity}</span>
                  <span className={`text-xs font-mono ${statusColors[inc.status]}`}>{inc.status.toUpperCase()}</span>
                </div>
                <p className="text-white font-semibold">{inc.title}</p>
                <p className="text-white/50 text-sm mt-1">{inc.detail}</p>
                <p className="text-white/30 text-xs mt-2 font-mono">{new Date(inc.timestamp).toLocaleString()}</p>
              </div>
              {inc.status !== "resolved" && (
                <button className="shrink-0 bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-lg hover:bg-green-500/30 border border-green-500/30">✓ Resolve</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Staff ────────────────────────────────────────────────────────────────────
function StaffPerformance() {
  const [data, setData] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("support");

  const load = useCallback(() => { apiFetch("/admin/staff").then(setData); }, []);
  useEffect(() => { load(); }, [load]);

  async function addStaff() {
    await apiFetch("/admin/staff", { method: "POST", body: JSON.stringify({ email: newEmail, password: newPass, role: newRole }) });
    setShowAdd(false); setNewEmail(""); setNewPass("");
    load();
  }

  async function removeStaff(id: string) {
    if (!confirm("Remove this staff?")) return;
    await apiFetch(`/admin/staff/${id}`, { method: "DELETE" });
    load();
  }

  if (!data) return <div className="text-white/40 animate-pulse">Loading staff...</div>;

  return (
    <Section title="Staff Performance" icon="👥">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#00FFD1]/10 border border-[#00FFD1]/30 text-[#00FFD1] text-sm px-4 py-2 rounded-lg hover:bg-[#00FFD1]/20">+ Add Staff</button>
      </div>
      {showAdd && (
        <div className="bg-[#111118] border border-[#00FFD1]/20 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" className="bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm col-span-2 focus:outline-none" />
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Password" className="bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          <div className="flex gap-2">
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="bg-[#1a1a25] border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:outline-none flex-1">
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={addStaff} className="bg-[#00FFD1] text-black font-bold px-3 py-2 rounded-lg text-sm">Add</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs font-mono uppercase">
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-left py-2 px-3">Role</th>
              <th className="text-left py-2 px-3">Bookings</th>
              <th className="text-left py-2 px-3">Avg Response</th>
              <th className="text-left py-2 px-3">Last Active</th>
              <th className="text-left py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.staff.map((s: any) => (
              <tr key={s.id} className="border-b border-white/5">
                <td className="py-2 px-3 text-white">{s.email}</td>
                <td className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded font-mono ${s.role === "admin" ? "bg-[#00FFD1]/20 text-[#00FFD1]" : "bg-purple-500/20 text-purple-400"}`}>{s.role}</span></td>
                <td className="py-2 px-3 text-white/70">{s.bookingsProcessed}</td>
                <td className="py-2 px-3 text-white/70">{s.avgResponseTime}ms</td>
                <td className="py-2 px-3 text-white/40 text-xs">{s.lastActive ? new Date(s.lastActive).toLocaleString() : "Never"}</td>
                <td className="py-2 px-3">
                  <button onClick={() => removeStaff(s.id)} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
function AuditLogs() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const load = useCallback(() => {
    const q = search ? `?search=${search}` : "";
    apiFetch(`/admin/audit-logs${q}`).then(setData);
  }, [search]);
  useEffect(() => { load(); }, [load]);

  return (
    <Section title="Black Box Audit" icon="⚫">
      <div className="mb-4 flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, action..." className="bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm flex-1 focus:outline-none focus:border-[#00FFD1]/40" />
        <button onClick={load} className="bg-[#00FFD1]/10 border border-[#00FFD1]/30 text-[#00FFD1] text-sm px-4 py-2 rounded-lg hover:bg-[#00FFD1]/20">Search</button>
      </div>
      {!data ? <div className="text-white/40 animate-pulse">Loading logs...</div> : (
        <>
          <p className="text-white/30 text-xs mb-3 font-mono">{data.total} log entries (append-only)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs font-mono uppercase">
                  <th className="text-left py-2 px-3">Time</th>
                  <th className="text-left py-2 px-3">Admin</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Target</th>
                  <th className="text-left py-2 px-3">Detail</th>
                  <th className="text-left py-2 px-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-white/30 py-8">No audit logs yet</td></tr>
                ) : data.logs.map((l: any) => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="py-2 px-3 text-white/40 text-xs font-mono whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 text-[#00FFD1] text-xs">{l.adminEmail}</td>
                    <td className="py-2 px-3 text-yellow-400 text-xs font-mono">{l.action}</td>
                    <td className="py-2 px-3 text-white/60 text-xs">{l.target}</td>
                    <td className="py-2 px-3 text-white/50 text-xs">{l.detail}</td>
                    <td className="py-2 px-3 text-white/30 text-xs font-mono">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  );
}

// ─── API Keys ─────────────────────────────────────────────────────────────────
function ApiKeyCard({ k, onTestKey }: { k: any; onTestKey: (name: string) => void }) {
  const [inputVal, setInputVal] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; status: string; latencyMs: number | null; message: string; loading: boolean } | null>(null);

  const categoryColors: Record<string, string> = {
    AI: "bg-purple-500/20 text-purple-400",
    Travel: "bg-blue-500/20 text-blue-400",
    Email: "bg-yellow-500/20 text-yellow-400",
    APIs: "bg-orange-500/20 text-orange-400",
  };

  const statusDot = !k.configured ? "🔴" : testResult?.ok === true ? "🟢" : testResult?.ok === false ? "🔴" : "🟡";
  const statusLabel = !k.configured ? "MISSING" : testResult?.ok === true ? "ACTIVE" : testResult?.ok === false ? "ERROR" : "CONFIGURED";
  const statusColor = !k.configured
    ? "bg-red-500/20 text-red-400"
    : testResult?.ok === true ? "bg-green-500/20 text-green-400"
    : testResult?.ok === false ? "bg-red-500/20 text-red-400"
    : "bg-yellow-500/20 text-yellow-400";

  const handleTest = async () => {
    setTestResult(r => ({ ok: false, status: "testing", latencyMs: null, message: "Testing…", loading: true }));
    try {
      const result = await apiFetch("/admin/test-api-key", { method: "POST", body: JSON.stringify({ name: k.name }) });
      setTestResult({ ...result, loading: false });
    } catch {
      setTestResult({ ok: false, status: "error", latencyMs: null, message: "Request failed", loading: false });
    }
    onTestKey(k.name);
  };

  const handleSave = async () => {
    if (!inputVal.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const r = await apiFetch("/admin/update-api-key", { method: "POST", body: JSON.stringify({ name: k.name, value: inputVal.trim() }) });
      setSaveMsg({ ok: r.ok, text: r.ok ? "✓ Saved! Test to verify." : r.message });
      if (r.ok) { setShowInput(false); setInputVal(""); }
    } catch {
      setSaveMsg({ ok: false, text: "Save failed" });
    }
    setSaving(false);
  };

  return (
    <div className={`bg-[#111118] border rounded-xl p-4 transition-colors ${showInput ? "border-[#00FFD1]/40" : "border-white/5 hover:border-[#00FFD1]/20"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-white font-semibold text-sm">{k.label}</p>
          <p className="text-white/30 text-xs font-mono">{k.name}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${categoryColors[k.category] || "bg-white/10 text-white/50"}`}>{k.category}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${statusColor}`}>{statusDot} {statusLabel}</span>
        </div>
      </div>

      <div className="bg-[#0d0d14] rounded-lg px-3 py-2 font-mono text-sm text-[#00FFD1] mb-2">
        {k.masked}
      </div>

      {showInput && (
        <div className="mb-2 space-y-1.5">
          <input
            type="password"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setShowInput(false); setInputVal(""); } }}
            placeholder={`Paste new ${k.name}…`}
            autoFocus
            className="w-full bg-[#0d0d14] border border-[#00FFD1]/30 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#00FFD1]/70 placeholder-white/20"
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={saving || !inputVal.trim()}
              className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-[#00FFD1] text-black disabled:opacity-40 transition-all hover:bg-[#00e6bb]">
              {saving ? "Saving…" : "Save Key"}
            </button>
            <button
              onClick={() => { setShowInput(false); setInputVal(""); setSaveMsg(null); }}
              className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-white/50 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Cancel
            </button>
          </div>
          {saveMsg && (
            <p className={`text-[10px] font-mono px-2 py-1 rounded ${saveMsg.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{saveMsg.text}</p>
          )}
        </div>
      )}

      {testResult && !testResult.loading && (
        <div className={`text-[10px] font-mono mb-2 px-2 py-1 rounded ${testResult.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {testResult.message}{testResult.latencyMs !== null ? ` · ${testResult.latencyMs}ms` : ""}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => { setShowInput(v => !v); setSaveMsg(null); }}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all hover:scale-105"
          style={{ background: "rgba(0,255,209,0.1)", border: "1px solid rgba(0,255,209,0.25)" }}>
          {showInput ? "✕ Close" : "✏️ Update Key"}
        </button>
        <button
          onClick={handleTest}
          disabled={!k.configured || testResult?.loading}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white disabled:opacity-40 transition-all hover:scale-105"
          style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}>
          {testResult?.loading ? "⏳ Testing…" : "🔌 Test"}
        </button>
      </div>
    </div>
  );
}

function ApiKeyManagement() {
  const [data, setData] = useState<any>(null);
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  useEffect(() => { apiFetch("/admin/api-keys").then(setData); }, []);

  const handleTestKey = (name: string) => setTestedKeys(s => new Set(s).add(name));
  const testAll = () => { data?.keys?.forEach((k: any) => handleTestKey(k.name)); };

  if (!data) return <div className="text-white/40 animate-pulse">Loading API keys...</div>;

  const totalConfigured = data.keys.filter((k: any) => k.configured).length;
  const totalKeys = data.keys.length;

  return (
    <Section title="API Key Management" icon="🔑">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-white/30 text-xs font-mono">Klik ✏️ Update Key untuk isi / ganti key langsung</p>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${totalConfigured === totalKeys ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            {totalConfigured}/{totalKeys} configured
          </span>
        </div>
        <button onClick={testAll}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#06b6d4,#3b82f6)" }}>
          🔌 Test All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.keys.map((k: any) => (
          <ApiKeyCard key={k.name} k={k} onTestKey={handleTestKey} />
        ))}
      </div>
    </Section>
  );
}

// ─── QA Platform ──────────────────────────────────────────────────────────────
function QAPlatform() {
  const [score, setScore] = useState<any>(null);
  const [triggering, setTriggering] = useState(false);
  const [trigMsg, setTrigMsg] = useState("");

  useEffect(() => {
    apiFetch("/admin/cqap/score").then(setScore).catch(() => {});
  }, []);

  async function triggerRun() {
    setTriggering(true);
    setTrigMsg("");
    try {
      const r = await fetch("/api/admin/cqap/trigger", { method: "POST", headers: { "x-admin-token": getToken() } });
      const d = await r.json();
      setTrigMsg(d.success ? `✅ Run started — ${d.runId}` : `⚠️ ${d.message}`);
    } catch { setTrigMsg("❌ Trigger failed"); }
    setTriggering(false);
  }

  const st = score?.otaStatus;
  const stColor = st === "OTA_READY" ? "text-emerald-400" : st === "PRODUCTION_READY" ? "text-cyan-400" : st === "NEEDS_IMPROVEMENT" ? "text-amber-400" : "text-red-400";
  const stLabel = { OTA_READY: "✅ OTA READY", PRODUCTION_READY: "🟢 PRODUCTION READY", NEEDS_IMPROVEMENT: "⚠️ NEEDS IMPROVEMENT", CRITICAL: "🔴 CRITICAL" }[st as string] || "— NO DATA YET";

  return (
    <Section title="Continuous QA Platform" icon="🧪">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl border border-white/6 bg-white/3 p-5 text-center">
          <div className={`text-4xl font-black ${stColor} mb-1`}>{score?.otaScore != null ? Math.round(score.otaScore) : "—"}</div>
          <div className="text-[10px] text-gray-500 uppercase mb-2">OTA Readiness Score</div>
          <div className={`text-xs font-bold ${stColor}`}>{stLabel}</div>
        </div>
        <div className="rounded-xl border border-white/6 bg-white/3 p-5 text-center">
          <div className={`text-4xl font-black mb-1 ${(score?.passRate ?? 0) >= 95 ? "text-emerald-400" : (score?.passRate ?? 0) >= 80 ? "text-amber-400" : "text-red-400"}`}>{score?.passRate != null ? `${score.passRate}%` : "—"}</div>
          <div className="text-[10px] text-gray-500 uppercase mb-2">Pass Rate</div>
          <div className="text-xs text-gray-500">Target: ≥ 95%</div>
        </div>
        <div className="rounded-xl border border-white/6 bg-white/3 p-5 flex flex-col justify-between">
          <div>
            {score?.regressionDetected && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 mb-3 text-xs text-red-400 font-bold">🚨 REGRESSION DETECTED</div>
            )}
            {score?.activeRun && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse mb-3"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />QA run in progress…</div>
            )}
            <div className="text-[10px] text-gray-500 mb-1">Nightly: 02:00 Dili (UTC+9)</div>
            {score?.createdAt && <div className="text-[10px] text-gray-600">Last run: {new Date(score.createdAt).toLocaleString()}</div>}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={triggerRun} disabled={triggering || score?.activeRun}
              className={`flex-1 py-2 rounded-xl text-xs font-black ${triggering || score?.activeRun ? "bg-white/5 text-gray-500" : "bg-purple-500 text-white hover:bg-purple-400"} transition-all`}>
              {triggering ? "⏳ Starting…" : score?.activeRun ? "⏳ Running…" : "▶ Run Now"}
            </button>
            <a href="/admin/test-history" className="flex-1 py-2 rounded-xl text-xs font-black text-center border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-all">
              📊 Full History
            </a>
            <a href="/admin/flight-qa" className="flex-1 py-2 rounded-xl text-xs font-black text-center border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-all">
              ✈ Route Accuracy
            </a>
          </div>
          {trigMsg && <div className="text-[10px] text-cyan-400 mt-2">{trigMsg}</div>}
        </div>
      </div>

      {score?.categoryScores && Object.keys(score.categoryScores).length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Category Scores — Latest Run</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(score.categoryScores as Record<string, number>).map(([cat, s]) => (
              <div key={cat} className="rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                <div className="text-[10px] text-gray-400 truncate mb-1">{cat}</div>
                <div className={`text-lg font-black ${(s ?? 0) >= 95 ? "text-emerald-400" : (s ?? 0) >= 80 ? "text-amber-400" : "text-red-400"}`}>{s ?? 0}%</div>
                <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${(s ?? 0) >= 95 ? "bg-emerald-400" : (s ?? 0) >= 80 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${s ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <OTALiveScoreWidget />
    </Section>
  );
}

// ─── World-Class OTA Score Widget ─────────────────────────────────────────────
function OTALiveScoreWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/rania/ota-live-score");
      setData(await r.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);

  const OTA_STATUS_STYLES: Record<string, { color: string; label: string }> = {
    WORLD_CLASS:       { color: "text-emerald-300", label: "🏆 WORLD CLASS" },
    OTA_READY:         { color: "text-emerald-400", label: "✅ OTA READY" },
    PRODUCTION_READY:  { color: "text-cyan-400",    label: "🟢 PRODUCTION READY" },
    NEEDS_IMPROVEMENT: { color: "text-amber-400",   label: "⚠️ NEEDS IMPROVEMENT" },
    CRITICAL:          { color: "text-red-400",     label: "🔴 CRITICAL" },
  };

  const status = data ? OTA_STATUS_STYLES[data.otaStatus] ?? { color: "text-gray-400", label: data.otaStatus } : null;

  const metrics = [
    { label: "Flight Accuracy", value: data ? `${data.flightAccuracy}%` : "—", target: "≥ 98%", ok: (data?.flightAccuracy ?? 0) >= 98 },
    { label: "QA Benchmark", value: data ? `${data.qaBenchmark.passRate}%` : "—", target: "30/30 tests", ok: (data?.qaBenchmark?.passRate ?? 0) >= 100 },
    { label: "DIL Corrections", value: data ? `${data.dilCorrectionRate}%` : "—", target: "< 1%", ok: (data?.dilCorrectionRate ?? 0) < 1 },
    { label: "Smart Date", value: data?.smartDateResolver ?? "—", target: "ACTIVE", ok: data?.smartDateResolver === "ACTIVE" },
    { label: "Anti-Hallucination", value: data?.antiHallucinationLayer ?? "—", target: "ACTIVE", ok: data?.antiHallucinationLayer === "ACTIVE" },
    { label: "Country Mappings", value: data ? `${data.countryMappings}` : "—", target: "≥ 20", ok: (data?.countryMappings ?? 0) >= 20 },
  ];

  return (
    <div className="mt-5 border-t border-white/6 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">🌍 World-Class OTA Score</div>
        {status && <span className={`text-xs font-black ${status.color}`}>{status.label}</span>}
      </div>

      {loading ? (
        <div className="text-[11px] text-gray-500 animate-pulse">Loading live metrics…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {metrics.map(m => (
              <div key={m.label} className={`rounded-xl border px-3 py-2 ${m.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                <div className="text-[9px] text-gray-500 uppercase mb-0.5">{m.label}</div>
                <div className={`text-base font-black ${m.ok ? "text-emerald-400" : "text-amber-400"}`}>{m.value}</div>
                <div className="text-[8px] text-gray-600">Target: {m.target}</div>
              </div>
            ))}
          </div>

          {/* Target checklist */}
          <div className="rounded-xl border border-white/5 bg-white/2 p-3">
            <div className="text-[9px] text-gray-500 uppercase mb-2">Roadmap Targets</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { label: "Flight Accuracy ≥ 98%", ok: (data?.flightAccuracy ?? 0) >= 98 },
                { label: "Smart Date Resolver", ok: data?.smartDateResolver === "ACTIVE" },
                { label: "Country-to-Airport (21)", ok: (data?.countryMappings ?? 0) >= 20 },
                { label: "Anti-Hallucination Layer", ok: data?.antiHallucinationLayer === "ACTIVE" },
                { label: "Revenue Protection Engine", ok: true },
                { label: "Zero Wrong DIL Cards", ok: (data?.dilCorrectionRate ?? 0) < 2 },
                { label: "30-Route QA Benchmark", ok: (data?.qaBenchmark?.passRate ?? 0) >= 100 },
                { label: "Multi-Airport Resolver", ok: true },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-[9px]">
                  <span>{item.ok ? "✅" : "⏳"}</span>
                  <span className={item.ok ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {data?.recentMismatches?.length > 0 && (
            <div className="mt-3">
              <div className="text-[9px] text-gray-500 uppercase mb-1">Recent Route Corrections</div>
              {data.recentMismatches.slice(0, 3).map((m: any, i: number) => (
                <div key={i} className="text-[9px] text-amber-400/70 font-mono truncate">{m.route}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { apiFetch("/admin/settings").then(d => setSettings(d.settings)); }, []);

  async function save() {
    setSaving(true);
    await apiFetch("/admin/settings", { method: "PATCH", body: JSON.stringify(settings) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <div className="text-white/40 animate-pulse">Loading settings...</div>;

  return (
    <Section title="Settings" icon="⚙️">
      <div className="max-w-2xl space-y-6">
        <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Language & Currency</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-xs font-mono uppercase mb-2 block">Force Language</label>
              <select value={settings.forceLanguage} onChange={e => setSettings({ ...settings, forceLanguage: e.target.value })} className="w-full bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                {["auto","tetun","indonesian","english","portuguese"].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs font-mono uppercase mb-2 block">Default Currency</label>
              <select value={settings.defaultCurrency} onChange={e => setSettings({ ...settings, defaultCurrency: e.target.value })} className="w-full bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                {["USD","IDR","AUD","EUR","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Pricing</h3>
          <label className="text-white/50 text-xs font-mono uppercase mb-2 block">Markup Price: {settings.markupPercent}%</label>
          <input type="range" min={0} max={20} value={settings.markupPercent} onChange={e => setSettings({ ...settings, markupPercent: +e.target.value })} className="w-full accent-[#00FFD1]" />
        </div>

        <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Promo Message</h3>
          <textarea value={settings.promoMessage} onChange={e => setSettings({ ...settings, promoMessage: e.target.value })} placeholder="Empty = no promo message" rows={3} className="w-full bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none" />
        </div>

        <div className="bg-[#111118] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Integrations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">WhatsApp API</p>
                <input value={settings.whatsappNumber} onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} placeholder="+670..." className="mt-1 bg-[#1a1a25] border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none w-48" />
              </div>
              <button onClick={() => setSettings({ ...settings, whatsappEnabled: !settings.whatsappEnabled })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.whatsappEnabled ? "bg-[#00FFD1]" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings.whatsappEnabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <label className="text-white/50 text-xs font-mono uppercase mb-1 block">Notification Webhook URL</label>
              <input value={settings.notificationWebhook} onChange={e => setSettings({ ...settings, notificationWebhook: e.target.value })} placeholder="https://..." className="w-full bg-[#1a1a25] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="bg-[#00FFD1] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#00e6bb] transition-colors disabled:opacity-50">
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* ── Danger Zone ── */}
      <DangerZone />
    </Section>
  );
}

// ─── Danger Zone ─────────────────────────────────────────────────────────────
function DangerZone() {
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function doReset() {
    setLoading(true); setStatus(null);
    try {
      const res = await apiFetch("/admin/reset-mock-data", { method: "POST" });
      setStatus({ ok: true, message: res.message || "Reset complete." });
    } catch (e: any) {
      setStatus({ ok: false, message: e.message || "Reset failed." });
    }
    setLoading(false); setConfirm(false);
  }

  return (
    <div className="bg-[#111118] border border-red-500/30 rounded-xl p-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-red-400 text-lg">⚠️</span>
        <h3 className="text-red-400 font-bold">Danger Zone — Reset Mock / Test Data</h3>
      </div>
      <p className="text-white/40 text-xs mb-4">
        Hapus semua data uji coba: registered users, bookings, price alerts, dan chat counter dari memory server.
        Data ini hanya untuk testing — tidak ada perubahan di database permanen.
      </p>

      {status && (
        <div className={`text-xs px-3 py-2 rounded-lg mb-3 font-mono ${status.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {status.ok ? "✅" : "❌"} {status.message}
        </div>
      )}

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
          🗑️ Reset Semua Data Uji Coba
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-xs">Yakin hapus semua data?</span>
          <button onClick={doReset} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
            {loading ? "⏳ Menghapus..." : "✅ Ya, Hapus"}
          </button>
          <button onClick={() => setConfirm(false)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white/50 border border-white/10 hover:bg-white/5 transition-colors">
            Batal
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Placeholder for coming-soon sections ─────────────────────────────────────
function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-white font-bold text-xl mb-2">{title}</h2>
      <p className="text-white/40 text-sm">Sedang dalam pengembangan. Akan hadir segera.</p>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  email: string | null;
  lang: string;
  tier: "free" | "premium";
  chatToday: number;
  voiceToday: number;
  totalChats: number;
  lastActive: string | null;
  premiumUntil: string | null;
  banned: boolean;
  registeredAt: string | null;
}

function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "free" | "premium" | "banned">("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [premiumDays, setPremiumDays] = useState<Record<string, number>>({});

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/rania/admin/app-users");
      setUsers(data.users || []);
    } catch {
      showToast("Gagal memuat data user", false);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, id: string, extra?: Record<string, unknown>) {
    setActionLoading(`${action}:${id}`);
    try {
      const data = await apiFetch(`/rania/admin/app-users/${action}`, {
        method: "POST",
        body: JSON.stringify({ id, ...extra }),
      });
      showToast(data.message || "Berhasil", true);
      await load();
    } catch {
      showToast("Aksi gagal", false);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.id.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q) ?? false);
    const matchTier =
      filterTier === "all" ? true :
      filterTier === "banned" ? u.banned :
      filterTier === "premium" ? u.tier === "premium" :
      u.tier === "free" && !u.banned;
    return matchSearch && matchTier;
  });

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) + " " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  function fmtId(id: string) {
    if (id.includes("@")) return id;
    if (id.length > 20) return id.substring(0, 8) + "…" + id.slice(-6);
    return id;
  }

  const totalPremium = users.filter(u => u.tier === "premium").length;
  const totalBanned = users.filter(u => u.banned).length;
  const totalActive = users.filter(u => u.chatToday > 0).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl transition-all ${toast.ok ? "bg-[#00FFD1] text-black" : "bg-red-500 text-white"}`}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.length} sub="semua session" color={CYAN} />
        <StatCard label="Premium" value={totalPremium} sub="aktif berbayar" color="#f59e0b" />
        <StatCard label="Aktif Hari Ini" value={totalActive} sub="sudah chat" color="#a78bfa" />
        <StatCard label="Banned" value={totalBanned} sub="diblokir" color="#ef4444" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari email / session ID..."
            className="w-full bg-[#111118] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FFD1]/40"
          />
        </div>
        {(["all", "free", "premium", "banned"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterTier(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors capitalize ${filterTier === f ? "bg-[#00FFD1]/15 text-[#00FFD1] border border-[#00FFD1]/30" : "text-white/40 border border-white/10 hover:text-white"}`}
          >
            {f === "all" ? "Semua" : f === "free" ? "Free" : f === "premium" ? "⭐ Premium" : "🚫 Banned"}
          </button>
        ))}
        <button onClick={load} className="px-4 py-2 rounded-lg text-xs font-bold text-white/40 border border-white/10 hover:text-white transition-colors">
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-white/40 text-sm animate-pulse py-12 text-center">Memuat data user...</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/30 text-sm py-12 text-center">
          {search || filterTier !== "all" ? "Tidak ada user yang cocok dengan filter." : "Belum ada user yang tercatat. User akan muncul setelah mereka mulai chat."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-xs font-mono uppercase">
                <th className="text-left px-4 py-3">User / Session</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-center px-4 py-3">Chat Hari Ini</th>
                <th className="text-center px-4 py-3">Total Chat</th>
                <th className="text-left px-4 py-3">Terakhir Aktif</th>
                <th className="text-left px-4 py-3">Premium Sampai</th>
                <th className="text-center px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => {
                const isActing = (act: string) => actionLoading === `${act}:${u.id}`;
                const days = premiumDays[u.id] ?? 30;
                return (
                  <tr key={u.id} className={`hover:bg-white/2 transition-colors ${u.banned ? "opacity-50" : ""}`}>
                    {/* User / Session */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {u.email ? (
                          <span className="text-white font-medium">{u.email}</span>
                        ) : (
                          <span className="text-white/50 font-mono text-xs">{fmtId(u.id)}</span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs">🌐 {u.lang.toUpperCase()}</span>
                          {u.banned && <span className="text-red-400 text-xs font-bold">🚫 BANNED</span>}
                          {u.registeredAt && <span className="text-white/20 text-xs">Reg {fmtDate(u.registeredAt).split(" ").slice(0, 2).join(" ")}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${u.tier === "premium" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-white/5 text-white/40 border border-white/10"}`}>
                        {u.tier === "premium" ? "⭐ Premium" : "Free"}
                      </span>
                    </td>

                    {/* Chat Today */}
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold text-sm ${u.chatToday > 250 ? "text-red-400" : u.chatToday > 100 ? "text-amber-400" : "text-white/70"}`}>
                        {u.chatToday}
                      </span>
                      <span className="text-white/20 text-xs ml-1">/ 300</span>
                    </td>

                    {/* Total Chat */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-white/60 text-sm">{u.totalChats}</span>
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3 text-white/40 text-xs font-mono whitespace-nowrap">
                      {fmtDate(u.lastActive)}
                    </td>

                    {/* Premium Until */}
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {u.premiumUntil ? (
                        <span className="text-amber-400">{fmtDate(u.premiumUntil)}</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5 justify-center">
                        {/* Set Premium with day selector */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={days}
                            onChange={e => setPremiumDays(p => ({ ...p, [u.id]: Number(e.target.value) }))}
                            className="w-14 bg-[#0d0d14] border border-white/10 rounded text-white text-xs px-2 py-1 font-mono focus:outline-none focus:border-amber-500/40"
                          />
                          <button
                            onClick={() => doAction("set-premium", u.id, { days })}
                            disabled={!!actionLoading}
                            title={`Set Premium ${days} hari`}
                            className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 disabled:opacity-40 transition-colors whitespace-nowrap"
                          >
                            {isActing("set-premium") ? "⏳" : "⭐ Set Premium"}
                          </button>
                        </div>

                        {/* Reset Limit */}
                        <button
                          onClick={() => doAction("reset-limit", u.id)}
                          disabled={!!actionLoading}
                          title="Reset limit chat harian"
                          className="px-2.5 py-1 rounded text-xs font-bold bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20 hover:bg-[#00FFD1]/20 disabled:opacity-40 transition-colors whitespace-nowrap"
                        >
                          {isActing("reset-limit") ? "⏳" : "🔄 Reset Limit"}
                        </button>

                        {/* Ban / Unban */}
                        {u.banned ? (
                          <button
                            onClick={() => doAction("unban", u.id)}
                            disabled={!!actionLoading}
                            title="Unban user ini"
                            className="px-2.5 py-1 rounded text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 disabled:opacity-40 transition-colors"
                          >
                            {isActing("unban") ? "⏳" : "✅ Unban"}
                          </button>
                        ) : (
                          <button
                            onClick={() => doAction("ban", u.id)}
                            disabled={!!actionLoading}
                            title="Ban user ini"
                            className="px-2.5 py-1 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                          >
                            {isActing("ban") ? "⏳" : "🚫 Ban"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-white/20 text-xs font-mono">
        {filtered.length} dari {users.length} user ditampilkan
        {" · "}Data di-reset saat server restart (in-memory)
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) { setLocation("/admin"); }
  }, [setLocation]);

  async function handleLogout() {
    const token = getToken();
    if (token) await fetch(`${API}/admin/logout`, { method: "POST", headers: { "x-admin-token": token } }).catch(() => {});
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    setLocation("/admin");
  }

  const CONTENT: Record<string, React.ReactNode> = {
    overview: <Overview />,
    liveops: <LiveOps />,
    bookings: <BookingControl />,
    ai: <AIIntelligence />,
    revenue: <RevenueCockpit />,
    incidents: <Incidents />,
    staff: <StaffPerformance />,
    audit: <AuditLogs />,
    qa: <QAPlatform />,
    apikeys: <ApiKeyManagement />,
    settings: <Settings />,
    users: <UserManagement />,
    premium: <ComingSoon title="Premium Subscription Manager" icon="⭐" />,
    hotels: <ComingSoon title="Hotel Partner Management" icon="🏨" />,
    promos: <ComingSoon title="Promo Code Manager" icon="🎟️" />,
    flashdeals: <ComingSoon title="Flash Deals Manager" icon="⚡" />,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} transition-all duration-300 bg-[#0d0d14] border-r border-white/5 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          {sidebarOpen && <div>
            <p className="text-white font-black text-sm">RANIA</p>
            <p className="text-[#00FFD1] text-xs font-mono">ADMIN</p>
          </div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-white/30 hover:text-white transition-colors text-xs">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {MENU.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${active === item.id ? "bg-[#00FFD1]/10 text-[#00FFD1]" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          {sidebarOpen && <p className="text-white/30 text-xs truncate mb-2 font-mono">{getEmail()}</p>}
          <button onClick={handleLogout} className={`w-full flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors text-sm ${sidebarOpen ? "px-3 py-2" : "justify-center py-2"}`}>
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-[#0a0a0f]/80 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center justify-between z-10">
          <h1 className="text-white font-bold">
            {MENU.find(m => m.id === active)?.icon} {MENU.find(m => m.id === active)?.label}
          </h1>
          <div className="flex items-center gap-3 text-xs text-white/30 font-mono">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FFD1] rounded-full animate-pulse" />LIVE</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
        <div className="p-6">
          {CONTENT[active]}
        </div>
      </main>
    </div>
  );
}
