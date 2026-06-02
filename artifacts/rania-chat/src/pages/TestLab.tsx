import { useState, useEffect, useRef, useCallback } from "react";

type Status = "pass" | "warn" | "fail";

interface LabTest {
  id: string;
  category: string;
  name: string;
  status: Status;
  latencyMs: number;
  detail: string;
  query?: string;
  response?: string;
  timestamp: string;
}

interface CategoryScore {
  name: string;
  pass: number;
  warn: number;
  fail: number;
  total: number;
  score: number;
}

interface BugReport {
  testId: string;
  category: string;
  name: string;
  query: string;
  response: string;
  error: string;
  timestamp: string;
  rootCause: string;
}

interface Improvement {
  area: string;
  priority: "high" | "medium" | "low";
  suggestion: string;
  autoFixable: boolean;
}

interface Summary {
  total: number;
  passed: number;
  warned: number;
  failed: number;
  passRate: number;
  targetMet: boolean;
}

type RunState = "idle" | "running" | "done";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CAT_ICONS: Record<string, string> = {
  "Simple Conversation": "💬",
  "Flight Search": "✈️",
  "Multi-Language": "🌍",
  "Complex Travel": "🗺️",
  "Booking Flow": "📋",
  "Payment": "💳",
  "Memory": "🧠",
  "Stress Test": "⚡",
  "Hotels": "🏨",
  "Visa": "🛂",
  "Voice & TTS": "🎙️",
  "Mobile UX": "📱",
};

const STATUS_COLOR: Record<Status, string> = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
};

const STATUS_BG: Record<Status, string> = {
  pass: "bg-emerald-500/15 border-emerald-500/30",
  warn: "bg-amber-500/15 border-amber-500/30",
  fail: "bg-red-500/15 border-red-500/30",
};

const STATUS_DOT: Record<Status, string> = {
  pass: "bg-emerald-400",
  warn: "bg-amber-400",
  fail: "bg-red-400",
};

const PRI_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

function ScoreRing({ pct }: { pct: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 95 ? "#34d399" : pct >= 80 ? "#fbbf24" : "#f87171";
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 28 28)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function TestLab() {
  const [runState, setRunState] = useState<RunState>("idle");
  const [phase, setPhase] = useState<string>("");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<CategoryScore[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [tab, setTab] = useState<"live" | "bugs" | "improve">("live");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const esRef = useRef<EventSource | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [tests]);

  const startTest = useCallback(() => {
    if (esRef.current) esRef.current.close();
    setRunState("running");
    setPhase("");
    setPhaseIdx(0);
    setTests([]);
    setCategories([]);
    setBugs([]);
    setImprovements([]);
    setSummary(null);
    setSelectedTest(null);

    const es = new EventSource(`${BASE}/api/rania/test/lab`);
    esRef.current = es;

    es.addEventListener("test", (e) => {
      const t = JSON.parse(e.data) as LabTest;
      setTests(prev => [...prev, t]);
    });

    es.addEventListener("category", (e) => {
      const c = JSON.parse(e.data) as CategoryScore;
      setCategories(prev => {
        const idx = prev.findIndex(x => x.name === c.name);
        if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
        return [...prev, c];
      });
    });

    es.addEventListener("phase", (e) => {
      const p = JSON.parse(e.data);
      setPhase(p.phase);
      setPhaseIdx(p.index);
    });

    es.addEventListener("done", (e) => {
      const d = JSON.parse(e.data);
      setSummary(d.summary);
      setBugs(d.bugs || []);
      setImprovements(d.improvements || []);
      setRunState("done");
      es.close();
    });

    es.onerror = () => {
      setRunState("done");
      es.close();
    };
  }, []);

  useEffect(() => () => { esRef.current?.close(); }, []);

  const filtered = filter === "all" ? tests : tests.filter(t => t.status === filter);
  const totalTests = tests.length;
  const passCount = tests.filter(t => t.status === "pass").length;
  const warnCount = tests.filter(t => t.status === "warn").length;
  const failCount = tests.filter(t => t.status === "fail").length;
  const liveRate = totalTests > 0 ? Math.round(((passCount + warnCount * 0.5) / totalTests) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#030b14] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/6 bg-[#040d18]/80 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-base">🧪</div>
            <div>
              <div className="font-black text-sm tracking-wide text-white">RANIA TEST LAB</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Global E2E Autonomous</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {runState === "running" && (
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Phase {phaseIdx}/8 — {phase}
              </div>
            )}
            {runState === "done" && summary && (
              <div className={`text-xs font-bold px-3 py-1 rounded-full border ${summary.targetMet ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30"}`}>
                {summary.passRate}% — {summary.targetMet ? "TARGET MET ✓" : "BELOW 95% TARGET"}
              </div>
            )}
            <button
              onClick={startTest}
              disabled={runState === "running"}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${runState === "running" ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95"}`}
            >
              {runState === "running" ? "⏳ Running…" : runState === "done" ? "▶ Re-run" : "▶ Run Test Lab"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* LEFT: Main panel */}
        <div className="space-y-5">

          {/* Stats row */}
          {(runState !== "idle") && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: totalTests, color: "text-gray-300" },
                { label: "PASS", value: passCount, color: "text-emerald-400" },
                { label: "WARN", value: warnCount, color: "text-amber-400" },
                { label: "FAIL", value: failCount, color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/6 bg-white/3 px-4 py-3">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Idle welcome */}
          {runState === "idle" && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8 text-center">
              <div className="text-5xl mb-4">🧪</div>
              <div className="text-lg font-black text-cyan-300 mb-2">RANIA Global E2E Autonomous Test Lab</div>
              <div className="text-sm text-gray-400 mb-6 max-w-xl mx-auto">
                Menjalankan 50+ simulasi pelanggan sungguhan — percakapan, pencarian penerbangan, booking, pembayaran, memori, dan stress test — secara otomatis dengan laporan bug & rekomendasi perbaikan.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-left">
                {["💬 Simple Conversation","✈️ Flight Search (Global)","🌍 Multi-Language","🗺️ Complex Travel","📋 Booking Flow","💳 Payment","🧠 Memory","⚡ Stress Test"].map(c => (
                  <div key={c} className="rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-xs text-gray-400">{c}</div>
                ))}
              </div>
              <button onClick={startTest} className="px-8 py-3 bg-cyan-500 text-black font-black rounded-xl hover:bg-cyan-400 transition-all active:scale-95 text-sm">
                ▶ Jalankan Test Lab
              </button>
            </div>
          )}

          {/* Category scores */}
          {categories.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Category Scores</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map(c => (
                  <div key={c.name} className="rounded-xl border border-white/6 bg-white/3 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CAT_ICONS[c.name] || "🔬"}</span>
                        <span className="text-xs font-bold text-white">{c.name}</span>
                      </div>
                      <ScoreRing pct={c.score} />
                    </div>
                    <div className="flex gap-3 text-[10px] mb-2">
                      <span className="text-emerald-400">✓ {c.pass} pass</span>
                      <span className="text-amber-400">⚠ {c.warn} warn</span>
                      <span className="text-red-400">✗ {c.fail} fail</span>
                    </div>
                    <ProgressBar value={c.pass + c.warn * 0.5} max={c.total} color="bg-emerald-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          {runState !== "idle" && (
            <div>
              <div className="flex gap-1 mb-4 border-b border-white/6 pb-0">
                {(["live","bugs","improve"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all -mb-px ${tab === t ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
                    {t === "live" ? `📡 Live Feed (${tests.length})` : t === "bugs" ? `🐛 Bugs (${bugs.length})` : `💡 Improvements (${improvements.length})`}
                  </button>
                ))}
              </div>

              {/* Live feed */}
              {tab === "live" && (
                <>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {(["all","pass","warn","fail"] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${filter === f ? "bg-cyan-500 text-black border-cyan-500" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                        {f === "all" ? `All (${totalTests})` : f === "pass" ? `✓ Pass (${passCount})` : f === "warn" ? `⚠ Warn (${warnCount})` : `✗ Fail (${failCount})`}
                      </button>
                    ))}
                    {runState === "running" && (
                      <div className="ml-auto flex items-center gap-1.5 text-[10px] text-cyan-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Live · {liveRate}% passing
                      </div>
                    )}
                  </div>
                  <div ref={feedRef} className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                    {filtered.length === 0 && runState === "running" && (
                      <div className="text-center py-8 text-gray-500 text-sm">Running tests…</div>
                    )}
                    {filtered.map(t => (
                      <button key={t.id} onClick={() => setSelectedTest(selectedTest?.id === t.id ? null : t)}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${STATUS_BG[t.status]} hover:opacity-80 ${selectedTest?.id === t.id ? "ring-1 ring-cyan-500/50" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[t.status]}`} />
                          <span className="text-[10px] text-gray-400 flex-shrink-0 w-20 truncate">{t.category}</span>
                          <span className="text-xs font-semibold text-white flex-1 truncate">{t.name}</span>
                          <span className={`text-[10px] font-bold ${STATUS_COLOR[t.status]} flex-shrink-0`}>{t.status.toUpperCase()}</span>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">{t.latencyMs}ms</span>
                        </div>
                        {selectedTest?.id === t.id && (
                          <div className="mt-2 space-y-1 border-t border-white/6 pt-2">
                            <div className="text-[10px] text-gray-400">{t.detail}</div>
                            {t.query && <div className="text-[10px] text-cyan-400 truncate">Q: {t.query}</div>}
                            {t.response && <div className="text-[10px] text-gray-300 line-clamp-3">{t.response}</div>}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Bug reports */}
              {tab === "bugs" && (
                <div className="space-y-3">
                  {bugs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-3xl mb-2">{runState === "done" ? "🎉" : "⏳"}</div>
                      <div className="text-sm">{runState === "done" ? "No bugs found!" : "Waiting for test results…"}</div>
                    </div>
                  )}
                  {bugs.map((b, i) => (
                    <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="text-xs font-bold text-red-400">[{b.testId}] {b.name}</div>
                          <div className="text-[10px] text-gray-500">{b.category} · {new Date(b.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">FAIL</span>
                      </div>
                      <div className="text-[10px] text-gray-300 mb-1"><span className="text-gray-500">Error:</span> {b.error}</div>
                      <div className="text-[10px] text-amber-400"><span className="text-gray-500">Root Cause:</span> {b.rootCause}</div>
                      {b.query && <div className="text-[10px] text-gray-500 mt-1 truncate">Q: {b.query}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Improvements */}
              {tab === "improve" && (
                <div className="space-y-3">
                  {improvements.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-3xl mb-2">{runState === "done" ? "✅" : "⏳"}</div>
                      <div className="text-sm">{runState === "done" ? "No improvements needed!" : "Waiting for results…"}</div>
                    </div>
                  )}
                  {improvements.map((imp, i) => (
                    <div key={i} className={`rounded-xl border px-4 py-3 ${PRI_COLOR[imp.priority]}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-xs font-bold">{imp.area}</div>
                        <div className="flex items-center gap-2">
                          {imp.autoFixable && <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-gray-300">AUTO-FIX OK</span>}
                          <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 font-bold uppercase">{imp.priority}</span>
                        </div>
                      </div>
                      <div className="text-[11px] opacity-90">{imp.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Summary sidebar */}
        <div className="space-y-4">
          {/* Live gauge */}
          {runState !== "idle" && (
            <div className="rounded-2xl border border-white/6 bg-white/3 p-5 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">
                {runState === "running" ? "Live Pass Rate" : "Final Score"}
              </div>
              <div className="flex justify-center mb-3">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle cx="60" cy="60" r="48" fill="none"
                    stroke={liveRate >= 95 ? "#34d399" : liveRate >= 80 ? "#fbbf24" : "#f87171"}
                    strokeWidth="10"
                    strokeDasharray={`${(liveRate / 100) * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dasharray 0.5s ease" }} />
                  <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="900"
                    fill={liveRate >= 95 ? "#34d399" : liveRate >= 80 ? "#fbbf24" : "#f87171"}>{liveRate}%</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#64748b">passing</text>
                </svg>
              </div>
              <div className={`text-xs font-bold ${liveRate >= 95 ? "text-emerald-400" : liveRate >= 80 ? "text-amber-400" : "text-red-400"}`}>
                {liveRate >= 95 ? "✓ TARGET MET (≥95%)" : liveRate >= 80 ? "⚠ BELOW TARGET" : "✗ CRITICAL — BELOW 80%"}
              </div>
              {runState === "done" && summary && (
                <div className="mt-4 pt-3 border-t border-white/6 grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-lg font-black text-emerald-400">{summary.passed}</div><div className="text-[9px] text-gray-500">PASS</div></div>
                  <div><div className="text-lg font-black text-amber-400">{summary.warned}</div><div className="text-[9px] text-gray-500">WARN</div></div>
                  <div><div className="text-lg font-black text-red-400">{summary.failed}</div><div className="text-[9px] text-gray-500">FAIL</div></div>
                </div>
              )}
            </div>
          )}

          {/* Phase progress */}
          {runState !== "idle" && (
            <div className="rounded-2xl border border-white/6 bg-white/3 p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Test Phases</div>
              <div className="space-y-2">
                {["Simple Conversation","Flight Search","Multi-Language","Complex Travel","Booking Flow","Payment","Memory","Stress Test","Hotels","Visa","Voice & TTS","Mobile UX"].map((cat, i) => {
                  const catDone = categories.find(c => c.name === cat);
                  const isActive = phase === cat;
                  const isDone = !!catDone;
                  return (
                    <div key={cat} className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${isActive ? "bg-cyan-500/10 border border-cyan-500/20" : isDone ? "bg-white/3" : "opacity-40"}`}>
                      <span className={`text-sm ${isActive ? "animate-bounce" : ""}`}>{CAT_ICONS[cat]}</span>
                      <span className="text-[10px] font-medium text-gray-300 flex-1">{cat}</span>
                      {isDone && <span className={`text-[10px] font-bold ${catDone.score >= 95 ? "text-emerald-400" : catDone.score >= 80 ? "text-amber-400" : "text-red-400"}`}>{catDone.score}%</span>}
                      {isActive && !isDone && <span className="text-[10px] text-cyan-400 animate-pulse">…</span>}
                      {!isActive && !isDone && <span className="text-[10px] text-gray-600">{i + 1}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back to chat */}
          <a href={BASE || "/"} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/8 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all">
            ← Back to RANIA Chat
          </a>
        </div>
      </div>
    </div>
  );
}
