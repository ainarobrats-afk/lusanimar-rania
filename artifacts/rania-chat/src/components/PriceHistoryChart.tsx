import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart, Legend,
} from "recharts";

interface PricePoint { date: string; price: number; priceMin: number; priceMax: number; }
interface RouteData {
  from: string; to: string; name: string; airline: string; flag: string;
  basePrice: number; points: PricePoint[];
  minPrice: number; maxPrice: number; avgPrice: number; currentPrice: number;
  trendPct: number; trend: "up" | "down"; label: string;
}

const ROUTE_TABS = [
  { to: "DPS", label: "Bali",      flag: "🇮🇩" },
  { to: "DRW", label: "Darwin",    flag: "🇦🇺" },
  { to: "SIN", label: "Singapore", flag: "🇸🇬" },
  { to: "CGK", label: "Jakarta",   flag: "🇮🇩" },
  { to: "KUL", label: "KL",        flag: "🇲🇾" },
  { to: "SYD", label: "Sydney",    flag: "🇦🇺" },
  { to: "NRT", label: "Tokyo",     flag: "🇯🇵" },
  { to: "DXB", label: "Dubai",     flag: "🇦🇪" },
  { to: "ICN", label: "Seoul",     flag: "🇰🇷" },
  { to: "LHR", label: "London",    flag: "🇬🇧" },
];

const GRAD_COLORS: Record<string, { line: string; fill: string; glow: string }> = {
  DPS: { line: "#22d3ee", fill: "rgba(34,211,238,0.12)", glow: "rgba(34,211,238,0.5)" },
  DRW: { line: "#34d399", fill: "rgba(52,211,153,0.12)", glow: "rgba(52,211,153,0.5)" },
  SIN: { line: "#a78bfa", fill: "rgba(167,139,250,0.12)", glow: "rgba(167,139,250,0.5)" },
  CGK: { line: "#fbbf24", fill: "rgba(251,191,36,0.12)",  glow: "rgba(251,191,36,0.5)" },
  KUL: { line: "#f472b6", fill: "rgba(244,114,182,0.12)", glow: "rgba(244,114,182,0.5)" },
  SYD: { line: "#60a5fa", fill: "rgba(96,165,250,0.12)",  glow: "rgba(96,165,250,0.5)" },
  NRT: { line: "#f87171", fill: "rgba(248,113,113,0.12)", glow: "rgba(248,113,113,0.5)" },
  DXB: { line: "#34d399", fill: "rgba(52,211,153,0.12)",  glow: "rgba(52,211,153,0.5)" },
  ICN: { line: "#818cf8", fill: "rgba(129,140,248,0.12)", glow: "rgba(129,140,248,0.5)" },
  LHR: { line: "#e879f9", fill: "rgba(232,121,249,0.12)", glow: "rgba(232,121,249,0.5)" },
};

function StatBadge({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2 min-w-[72px]">
      <div className="text-[9px] font-mono text-white/35 uppercase tracking-widest">{label}</div>
      <div className="text-[15px] font-bold font-mono" style={{ color: color || "#22d3ee" }}>{value}</div>
      {sub && <div className="text-[9px] font-mono text-white/30">{sub}</div>}
    </div>
  );
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload as PricePoint;
  if (!p) return null;
  const date = new Date(p.date);
  const fmt = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return (
    <div className="bg-[#0d1730] border border-cyan-500/30 rounded-xl px-3 py-2.5 text-[11px] font-mono shadow-2xl">
      <div className="text-white/40 mb-1">{fmt}</div>
      <div className="text-cyan-300 font-bold text-[14px]">${p.price}</div>
      {p.priceMin && p.priceMax && (
        <div className="text-white/25 mt-0.5">range: ${p.priceMin}–${p.priceMax}</div>
      )}
    </div>
  );
}

export default function PriceHistoryChart() {
  const [data, setData] = useState<RouteData[]>([]);
  const [selectedTo, setSelectedTo] = useState("DPS");
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchData = useCallback(async () => {
    if (Date.now() - lastFetch < 5 * 60_000 && data.length > 0) return;
    try {
      const res = await fetch("/api/rania/price-chart");
      if (!res.ok) return;
      const json = await res.json();
      setData(json.routes || []);
      setLastFetch(Date.now());
    } catch { }
    finally { setLoading(false); }
  }, [lastFetch, data.length]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const route = data.find(r => r.to === selectedTo);
  const colors = GRAD_COLORS[selectedTo] || GRAD_COLORS.DPS;

  // Format date label to "Jun 1" etc
  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch { return d.slice(5); }
  };

  const chartData = route?.points.map(p => ({
    ...p,
    dateLabel: fmtDate(p.date),
  })) ?? [];

  // Find best price index
  const bestIdx = chartData.reduce((bi, p, i) => p.price < chartData[bi].price ? i : bi, 0);

  return (
    <div className="rounded-2xl border border-cyan-500/15 bg-[#060b18] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-cyan-400 text-sm font-bold font-mono">📈 Harga 30 Hari</span>
          <span className="text-white/25 text-[10px] font-mono">· rute dari Dili (DIL)</span>
          <span className="ml-auto text-[9px] font-mono text-white/15 bg-white/5 px-1.5 py-0.5 rounded border border-white/8">indicative</span>
        </div>

        {/* Route tabs — scrollable on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {ROUTE_TABS.map(tab => (
            <button key={tab.to}
              onClick={() => setSelectedTo(tab.to)}
              className={`flex items-center gap-1 shrink-0 text-[10px] font-mono px-2.5 py-1.5 rounded-xl border transition-all ${
                selectedTo === tab.to
                  ? "border-cyan-400/60 text-cyan-300 bg-cyan-500/10"
                  : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/65"
              }`}>
              <span>{tab.flag}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/25 text-[11px] font-mono gap-2">
          <span className="animate-spin">⏳</span> Loading price data...
        </div>
      ) : !route ? (
        <div className="flex items-center justify-center py-12 text-white/25 text-[11px] font-mono">No data available</div>
      ) : (
        <>
          {/* ── Route info + stats ───────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-lg">{route.flag}</span>
              <div>
                <div className="text-white text-[13px] font-bold">DIL → {route.to} · {route.name}</div>
                <div className="text-white/35 text-[10px] font-mono">{route.airline}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[22px] font-bold font-mono" style={{ color: colors.line }}>
                  ${route.currentPrice}
                </span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-lg border ${
                  route.trend === "up"
                    ? "text-red-400 border-red-400/30 bg-red-500/10"
                    : "text-emerald-400 border-emerald-400/30 bg-emerald-500/10"
                }`}>
                  {route.trend === "up" ? "↑" : "↓"} {Math.abs(route.trendPct)}% vs last wk
                </span>
              </div>
            </div>

            {/* Stat badges */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
              <StatBadge label="Min"  value={`$${route.minPrice}`}     color="#34d399" />
              <StatBadge label="Avg"  value={`$${route.avgPrice}`}     color="#fbbf24" />
              <StatBadge label="Max"  value={`$${route.maxPrice}`}     color="#f87171" />
              <StatBadge label="Now"  value={`$${route.currentPrice}`} color={colors.line} />
              <div className="flex flex-col items-center gap-0.5 bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-3 py-2 min-w-[90px] ml-auto shrink-0">
                <div className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest">Best Day</div>
                <div className="text-[13px] font-bold font-mono text-emerald-400">${chartData[bestIdx]?.price}</div>
                <div className="text-[9px] font-mono text-emerald-400/50">{chartData[bestIdx]?.dateLabel}</div>
              </div>
            </div>
          </div>

          {/* ── Chart ───────────────────────────────────────────────────── */}
          <div className="px-2 pb-3" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${selectedTo}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={colors.line} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={colors.line} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "monospace" }}
                  tickLine={false} axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "monospace" }}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v}`}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(34,211,238,0.2)", strokeWidth: 1 }} />
                {/* Average reference line */}
                <ReferenceLine
                  y={route.avgPrice}
                  stroke="rgba(251,191,36,0.35)"
                  strokeDasharray="4 4"
                  label={{ value: `avg $${route.avgPrice}`, fill: "rgba(251,191,36,0.5)", fontSize: 9, fontFamily: "monospace", position: "insideTopLeft" }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={colors.line}
                  strokeWidth={2}
                  fill={`url(#grad-${selectedTo})`}
                  dot={false}
                  activeDot={{ r: 4, fill: colors.line, stroke: "rgba(255,255,255,0.8)", strokeWidth: 1 }}
                  style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Footer note ──────────────────────────────────────────────── */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="text-[9px] font-mono text-white/15">
              ⚠ Harga indikatif · variasi tergantung maskapai & ketersediaan kursi
            </div>
            <div className="text-[9px] font-mono text-cyan-400/30">
              Chat dengan RANIA untuk harga real-time ↗
            </div>
          </div>
        </>
      )}
    </div>
  );
}
