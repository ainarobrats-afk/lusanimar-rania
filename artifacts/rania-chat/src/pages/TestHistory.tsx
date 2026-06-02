import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from "recharts";

const API = "/api";
function getToken() { return localStorage.getItem("adminToken") || ""; }

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { "x-admin-token": getToken() },
  });
  if (res.status === 401) { window.location.href = "/admin"; throw new Error("Unauthorized"); }
  return res.json();
}

type OtaStatus = "OTA_READY" | "PRODUCTION_READY" | "NEEDS_IMPROVEMENT" | "CRITICAL" | "PENDING" | "NO_DATA";
interface TestRun {
  id: string; createdAt: string; trigger: string; durationMs: number;
  totalTests: number; passCount: number; warnCount: number; failCount: number;
  passRate: number; otaScore: number; otaStatus: OtaStatus;
  regressionDetected: boolean; categoryScores: Record<string, number>; status: string;
}
interface Failure { id: string; category: string; name: string; query: string; error: string; rootCause: string; confidence: number; recommendedFix: string; }
interface ImprovementRec { id: string; area: string; priority: string; suggestion: string; autoFixable: boolean; status: string; }
interface ActiveRun { id: string; progress: number; total: number; phase: string; }
interface LatestRun { run: TestRun | null; failures: Failure[]; improvements: ImprovementRec[]; active: ActiveRun | null; }
interface ScoreData { otaScore: number | null; otaStatus: OtaStatus; passRate: number; categoryScores: Record<string, number>; createdAt: string; regressionDetected: boolean; activeRun: boolean; }

const OTA_COLORS: Record<OtaStatus, { text: string; bg: string; border: string; label: string }> = {
  OTA_READY:         { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "✅ OTA READY" },
  PRODUCTION_READY:  { text: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    label: "🟢 PRODUCTION READY" },
  NEEDS_IMPROVEMENT: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   label: "⚠️ NEEDS IMPROVEMENT" },
  CRITICAL:          { text: "text-red-400",      bg: "bg-red-500/10",     border: "border-red-500/30",     label: "🔴 CRITICAL" },
  PENDING:           { text: "text-gray-400",     bg: "bg-white/5",        border: "border-white/10",       label: "⏳ PENDING" },
  NO_DATA:           { text: "text-gray-500",     bg: "bg-white/3",        border: "border-white/8",        label: "— NO DATA" },
};

const CAT_ICONS: Record<string, string> = {
  "Simple Conversation": "💬", "Flight Search": "✈️", "Multi-Language": "🌍",
  "Complex Travel": "🗺️", "Booking Flow": "📋", "Payment": "💳", "Memory": "🧠", "Stress Test": "⚡",
  "Hotels": "🏨", "Visa": "🛂", "Voice & TTS": "🎙️", "Mobile UX": "📱",
};

const PRI_COLORS: Record<string, string> = {
  high: "text-red-400 border-red-500/30 bg-red-500/8",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/8",
  low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/8",
};

function OtaGauge({ score, status }: { score: number; status: OtaStatus }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, score / 100)) * circ;
  const strokeColor = status === "OTA_READY" ? "#34d399" : status === "PRODUCTION_READY" ? "#00FFD1" : status === "NEEDS_IMPROVEMENT" ? "#fbbf24" : "#f87171";
  const st = OTA_COLORS[status] || OTA_COLORS.NO_DATA;
  return (
    <div className="flex flex-col items-center">
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={strokeColor} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 72 72)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="72" y="65" textAnchor="middle" fontSize="28" fontWeight="900" fill={strokeColor}>{score}</text>
        <text x="72" y="84" textAnchor="middle" fontSize="11" fill="#64748b">OTA Score</text>
      </svg>
      <div className={`text-xs font-bold px-3 py-1 rounded-full border ${st.text} ${st.bg} ${st.border}`}>{st.label}</div>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: string }) {
  const map: Record<string, string> = {
    "nightly-cron": "🌙 Nightly", "manual": "👤 Manual", "startup": "🚀 Startup", "deploy": "🚢 Deploy",
  };
  return <span className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-gray-400 font-mono">{map[trigger] || trigger}</span>;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default function TestHistory() {
  const [history, setHistory] = useState<TestRun[]>([]);
  const [latest, setLatest] = useState<LatestRun | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "history" | "detail">("overview");
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");
  const [days, setDays] = useState(30);

  const loadData = useCallback(async () => {
    try {
      const [histRes, latestRes, scoreRes] = await Promise.all([
        apiFetch(`/admin/cqap/history?days=${days}`),
        apiFetch("/admin/cqap/latest"),
        apiFetch("/admin/cqap/score"),
      ]);
      setHistory(histRes.runs || []);
      setLatest(latestRes);
      setScore(scoreRes);
    } catch { /* silent */ }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!score?.activeRun && !latest?.active) return;
    const iv = setInterval(loadData, 5000);
    return () => clearInterval(iv);
  }, [score?.activeRun, latest?.active, loadData]);

  const loadRunDetail = useCallback(async (runId: string) => {
    try {
      const d = await apiFetch(`/admin/cqap/history/${runId}`);
      setRunDetail(d);
      setSelectedRun(runId);
      setTab("detail");
    } catch { /* silent */ }
  }, []);

  const triggerRun = useCallback(async () => {
    setTriggering(true);
    setTriggerMsg("");
    try {
      const r = await fetch(`${API}/admin/cqap/trigger`, {
        method: "POST",
        headers: { "x-admin-token": getToken() },
      });
      const d = await r.json();
      setTriggerMsg(d.success ? `✅ Run started — ID: ${d.runId}` : `⚠️ ${d.message}`);
      if (d.success) setTimeout(loadData, 3000);
    } catch { setTriggerMsg("❌ Trigger failed"); }
    setTriggering(false);
  }, [loadData]);

  const trendData = history
    .slice().reverse()
    .slice(-30)
    .map(r => ({
      date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      passRate: r.passRate ?? 0,
      otaScore: r.otaScore ?? 0,
      regression: r.regressionDetected ? 100 : 0,
    }));

  const catBarData = latest?.run?.categoryScores
    ? Object.entries(latest.run.categoryScores).map(([cat, score]) => ({
        name: (CAT_ICONS[cat] || "🔬") + " " + cat.replace(" ", "\n"),
        score: score ?? 0,
      }))
    : [];

  const isActiveRun = !!(score?.activeRun || latest?.active);

  return (
    <div className="min-h-screen bg-[#030b14] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/6 bg-[#040d18]/80 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-base">📊</div>
            <div>
              <div className="font-black text-sm tracking-wide text-white">CQAP — Continuous QA Platform</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Nightly · Automated · Executive Reports</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isActiveRun && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {latest?.active ? `Running… ${latest.active.phase} (${latest.active.progress}/${latest.active.total})` : "Running…"}
              </div>
            )}
            <button
              onClick={triggerRun}
              disabled={triggering || isActiveRun}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${triggering || isActiveRun ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-purple-500 text-white hover:bg-purple-400 active:scale-95"}`}
            >
              {triggering ? "⏳ Starting…" : isActiveRun ? "⏳ Running…" : "▶ Run Now"}
            </button>
            <a href="/admin/dashboard" className="px-3 py-2 rounded-xl text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all">
              ← Admin
            </a>
          </div>
        </div>
        {triggerMsg && (
          <div className="max-w-7xl mx-auto px-4 pb-2 text-xs text-cyan-400">{triggerMsg}</div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-white/6">
          {(["overview", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-xs font-bold rounded-t-lg border-b-2 -mb-px transition-all ${tab === t ? "border-purple-500 text-purple-400 bg-purple-500/5" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t === "overview" ? "🎯 Overview" : `📋 History (${history.length})`}
            </button>
          ))}
          {tab === "detail" && (
            <button className="px-5 py-2.5 text-xs font-bold rounded-t-lg border-b-2 -mb-px border-cyan-500 text-cyan-400 bg-cyan-500/5">
              🔍 Run Detail
            </button>
          )}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* No data yet */}
            {!latest?.run && !isActiveRun && (
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-10 text-center">
                <div className="text-5xl mb-4">🧪</div>
                <div className="text-lg font-black text-purple-300 mb-2">No QA Runs Yet</div>
                <div className="text-sm text-gray-400 mb-6">Run your first automated QA test to see the OTA Readiness Score, regression alerts, and executive reports.</div>
                <button onClick={triggerRun} className="px-8 py-3 bg-purple-500 text-white font-black rounded-xl hover:bg-purple-400 transition-all text-sm">
                  ▶ Run First QA Test
                </button>
                <div className="mt-4 text-xs text-gray-500">Nightly cron: 02:00 Dili (UTC+9) · ~2 min to complete</div>
              </div>
            )}

            {/* Active run banner */}
            {isActiveRun && latest?.active && (
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-bold text-cyan-300">QA Run In Progress</span>
                  <span className="text-xs text-gray-400">Phase: {latest.active.phase}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${latest.active.total > 0 ? (latest.active.progress / latest.active.total) * 100 : 5}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{latest.active.progress}/{latest.active.total} tests complete</div>
              </div>
            )}

            {latest?.run && (
              <>
                {/* OTA Score + Regression */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-1 rounded-2xl border border-white/6 bg-white/3 p-6 flex flex-col items-center justify-center">
                    <OtaGauge score={Math.round(latest.run.otaScore ?? 0)} status={latest.run.otaStatus} />
                    <div className="mt-4 text-center">
                      <div className="text-[10px] text-gray-500 uppercase">Last Run</div>
                      <div className="text-xs text-gray-400">{timeAgo(latest.run.createdAt)}</div>
                      <TriggerBadge trigger={latest.run.trigger} />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    {/* Regression alert */}
                    {latest.run.regressionDetected && (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🚨</span>
                          <span className="font-black text-red-400">REGRESSION DETECTED</span>
                        </div>
                        <div className="text-xs text-red-300">One or more critical categories dropped &gt;5% from yesterday's baseline.</div>
                      </div>
                    )}

                    {/* Pass rate stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Pass", value: latest.run.passCount, total: latest.run.totalTests, color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/5" },
                        { label: "Warn", value: latest.run.warnCount, total: latest.run.totalTests, color: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/5" },
                        { label: "Fail", value: latest.run.failCount, total: latest.run.totalTests, color: "text-red-400", bg: "border-red-500/20 bg-red-500/5" },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                          <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                          <div className="text-[10px] text-gray-500 uppercase mt-0.5">{s.label}</div>
                          <div className="text-[10px] text-gray-600">{s.total > 0 ? Math.round((s.value / s.total) * 100) : 0}%</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/6 bg-white/3 p-4">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Pass Rate</div>
                        <div className="text-xl font-black text-white">{latest.run.passRate ?? 0}%</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Target: ≥ 95%</div>
                        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${(latest.run.passRate ?? 0) >= 95 ? "bg-emerald-400" : (latest.run.passRate ?? 0) >= 80 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${latest.run.passRate ?? 0}%` }} />
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/6 bg-white/3 p-4">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Duration</div>
                        <div className="text-xl font-black text-white">{formatDuration(latest.run.durationMs ?? 0)}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{latest.run.totalTests} tests</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OTA Score breakdown */}
                {catBarData.length > 0 && (
                  <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                    <h3 className="text-white/60 text-xs font-mono uppercase mb-4">Category Scores — Latest Run</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {Object.entries(latest.run.categoryScores || {}).map(([cat, s]) => (
                        <div key={cat} className="rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{CAT_ICONS[cat] || "🔬"}</span>
                            <span className="text-[10px] text-gray-400 truncate">{cat}</span>
                          </div>
                          <div className={`text-lg font-black ${(s ?? 0) >= 95 ? "text-emerald-400" : (s ?? 0) >= 80 ? "text-amber-400" : "text-red-400"}`}>{s ?? 0}%</div>
                          <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${(s ?? 0) >= 95 ? "bg-emerald-400" : (s ?? 0) >= 80 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${s ?? 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={catBarData} margin={{ top: 0, right: 0, left: -30, bottom: 20 }}>
                        <XAxis dataKey="name" tick={{ fill: "#ffffff40", fontSize: 9 }} angle={-20} textAnchor="end" />
                        <YAxis domain={[0, 100]} tick={{ fill: "#ffffff40", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff10", borderRadius: "8px" }}
                          formatter={(v: any) => [`${v}%`, "Score"]} />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {catBarData.map((entry, i) => (
                            <Cell key={i} fill={entry.score >= 95 ? "#34d399" : entry.score >= 80 ? "#fbbf24" : "#f87171"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* 30-day trend */}
                {trendData.length > 1 && (
                  <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                    <h3 className="text-white/60 text-xs font-mono uppercase mb-4">30-Day Pass Rate & OTA Score Trend</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={trendData}>
                        <XAxis dataKey="date" tick={{ fill: "#ffffff30", fontSize: 9 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#ffffff30", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff10", borderRadius: "8px" }}
                          formatter={(v: any, n: string) => [`${v}%`, n === "passRate" ? "Pass Rate" : "OTA Score"]} />
                        <Legend wrapperStyle={{ fontSize: 10, color: "#ffffff60" }} />
                        <Line type="monotone" dataKey="passRate" stroke="#00FFD1" strokeWidth={2} dot={false} name="passRate" />
                        <Line type="monotone" dataKey="otaScore" stroke="#a78bfa" strokeWidth={2} dot={false} name="otaScore" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Regression improvements */}
                {latest.improvements.length > 0 && (
                  <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                    <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Improvement Recommendations ({latest.improvements.length})</h3>
                    <div className="space-y-2">
                      {latest.improvements.map(imp => (
                        <div key={imp.id} className={`rounded-xl border px-4 py-3 ${PRI_COLORS[imp.priority] || PRI_COLORS.low}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-bold">{imp.area}</div>
                            <div className="flex items-center gap-2">
                              {imp.autoFixable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">AUTO-FIX OK</span>}
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 font-bold uppercase">{imp.priority}</span>
                            </div>
                          </div>
                          <div className="text-[11px] opacity-90">{imp.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failures */}
                {latest.failures.length > 0 && (
                  <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                    <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Top Failures — Root Cause Analysis</h3>
                    <div className="space-y-2">
                      {latest.failures.slice(0, 8).map(f => (
                        <div key={f.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="text-xs font-bold text-red-400">{f.name}</div>
                              <div className="text-[10px] text-gray-500">{f.category}</div>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">FAIL</span>
                          </div>
                          {f.error && <div className="text-[10px] text-gray-400 mb-1"><span className="text-gray-600">Error:</span> {f.error.substring(0, 120)}</div>}
                          <div className="text-[10px] text-amber-400 mb-1"><span className="text-gray-600">Root Cause:</span> {f.rootCause}</div>
                          {f.recommendedFix && <div className="text-[10px] text-cyan-400"><span className="text-gray-600">Fix:</span> {f.recommendedFix}</div>}
                          <div className="text-[9px] text-gray-600 mt-1">Confidence: {Math.round((f.confidence || 0.5) * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive report */}
                {(latest.run.executiveReport as any)?.generatedAt && (
                  <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                    <h3 className="text-white/60 text-xs font-mono uppercase mb-3">📋 Executive Report</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-black text-white">{(latest.run.executiveReport as any).totalTests}</div>
                        <div className="text-[10px] text-gray-500">Total Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-emerald-400">{(latest.run.executiveReport as any).passRate}%</div>
                        <div className="text-[10px] text-gray-500">Pass Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-purple-400">{(latest.run.executiveReport as any).otaScore}</div>
                        <div className="text-[10px] text-gray-500">OTA Score</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-black ${(latest.run.executiveReport as any).regressionDetected ? "text-red-400" : "text-emerald-400"}`}>
                          {(latest.run.executiveReport as any).regressionDetected ? "🚨 YES" : "✅ NO"}
                        </div>
                        <div className="text-[10px] text-gray-500">Regression</div>
                      </div>
                    </div>
                    <div className={`rounded-lg border px-4 py-3 text-xs ${(latest.run.executiveReport as any).revenueImpact?.includes("HIGH") ? "border-red-500/30 bg-red-500/5 text-red-300" : (latest.run.executiveReport as any).revenueImpact?.includes("MEDIUM") ? "border-amber-500/30 bg-amber-500/5 text-amber-300" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"}`}>
                      <span className="text-gray-400 mr-2">Revenue Impact:</span>
                      {(latest.run.executiveReport as any).revenueImpact}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-gray-400">Show last:</span>
              {[7, 14, 30, 60].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${days === d ? "bg-purple-500 text-white border-purple-500" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  {d}d
                </button>
              ))}
              <span className="ml-auto text-[10px] text-gray-600">{history.length} runs</span>
            </div>

            {history.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-3xl mb-2">📭</div>
                <div>No test runs in the last {days} days</div>
              </div>
            )}

            <div className="space-y-2">
              {history.map(run => {
                const st = OTA_COLORS[run.otaStatus as OtaStatus] || OTA_COLORS.PENDING;
                return (
                  <button key={run.id} onClick={() => loadRunDetail(run.id)}
                    className="w-full text-left rounded-xl border border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/10 transition-all p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${st.text}`}>{st.label}</span>
                          {run.regressionDetected && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">🚨 REGRESSION</span>}
                          <TriggerBadge trigger={run.trigger} />
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(run.createdAt).toLocaleString()} · {timeAgo(run.createdAt)} · {run.totalTests} tests · {formatDuration(run.durationMs ?? 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className={`text-lg font-black ${(run.passRate ?? 0) >= 95 ? "text-emerald-400" : (run.passRate ?? 0) >= 80 ? "text-amber-400" : "text-red-400"}`}>{run.passRate ?? 0}%</div>
                          <div className="text-[9px] text-gray-500">pass rate</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-purple-400">{Math.round(run.otaScore ?? 0)}</div>
                          <div className="text-[9px] text-gray-500">OTA</div>
                        </div>
                        <div className="flex gap-2 text-[10px]">
                          <span className="text-emerald-400">✓{run.passCount}</span>
                          <span className="text-amber-400">⚠{run.warnCount}</span>
                          <span className="text-red-400">✗{run.failCount}</span>
                        </div>
                        <span className="text-gray-500 text-xs">→</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DETAIL TAB ── */}
        {tab === "detail" && runDetail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setTab("history")} className="text-xs text-gray-400 hover:text-white transition-colors">← Back to History</button>
              <span className="text-xs text-gray-600">{selectedRun}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: runDetail.run.totalTests, color: "text-white" },
                { label: "Pass", value: runDetail.run.passCount, color: "text-emerald-400" },
                { label: "Warn", value: runDetail.run.warnCount, color: "text-amber-400" },
                { label: "Fail", value: runDetail.run.failCount, color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/6 bg-white/3 p-4 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase">{s.label}</div>
                </div>
              ))}
            </div>

            {runDetail.failures?.length > 0 && (
              <div>
                <h3 className="text-white/60 text-xs font-mono uppercase mb-3">Failures ({runDetail.failures.length})</h3>
                <div className="space-y-2">
                  {runDetail.failures.map((f: Failure) => (
                    <div key={f.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <div className="text-xs font-bold text-red-400 mb-1">[{f.category}] {f.name}</div>
                      <div className="text-[10px] text-gray-400 mb-1"><span className="text-gray-600">Error:</span> {f.error?.substring(0, 150)}</div>
                      <div className="text-[10px] text-amber-400 mb-1"><span className="text-gray-600">Root Cause:</span> {f.rootCause}</div>
                      {f.recommendedFix && <div className="text-[10px] text-cyan-400"><span className="text-gray-600">Fix:</span> {f.recommendedFix}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {runDetail.results?.length > 0 && (
              <div>
                <h3 className="text-white/60 text-xs font-mono uppercase mb-3">All Test Results ({runDetail.results.length})</h3>
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {runDetail.results.map((r: any) => (
                    <div key={r.id} className={`rounded-lg border px-3 py-2 text-[10px] flex items-center gap-3 ${r.status === "pass" ? "border-emerald-500/15 bg-emerald-500/5" : r.status === "warn" ? "border-amber-500/15 bg-amber-500/5" : "border-red-500/15 bg-red-500/5"}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === "pass" ? "bg-emerald-400" : r.status === "warn" ? "bg-amber-400" : "bg-red-400"}`} />
                      <span className="text-gray-500 w-28 truncate flex-shrink-0">{r.category}</span>
                      <span className="text-gray-300 flex-1 truncate">{r.name}</span>
                      <span className={`font-bold flex-shrink-0 ${r.status === "pass" ? "text-emerald-400" : r.status === "warn" ? "text-amber-400" : "text-red-400"}`}>{r.status.toUpperCase()}</span>
                      <span className="text-gray-600 flex-shrink-0">{r.latencyMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
