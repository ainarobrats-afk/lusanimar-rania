import { useState, useCallback } from "react";
import { useLocation } from "wouter";

interface QATest {
  id: string;
  category: string;
  message: string;
  expectedFrom: string;
  expectedTo: string;
  expectedRegion: string;
}

interface QAResult {
  id: string;
  passed: boolean;
  extractedFrom: string;
  extractedTo: string;
  airlinesOk: boolean;
  airlines: string[];
  routeInDb: boolean;
  message: string;
  error?: string;
}

interface QAResponse {
  results: QAResult[];
  summary: { total: number; passed: number; failed: number; passRate: number };
  timestamp: string;
}

const CATEGORIES = ["All","Asia","China","Europe","Americas","Africa","Oceania","India/SEA","Timor-Leste"];
const CATEGORY_COLORS: Record<string, string> = {
  "All":"#00ffd1","Asia":"#ffdd00","China":"#ff4444","Europe":"#4488ff","Americas":"#00ccff",
  "Africa":"#ff9966","Oceania":"#00dd88","India/SEA":"#ff66bb","Timor-Leste":"#ff4444",
};

export default function FlightQA() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

  const runTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/rania/flight-accuracy-test`);
      const d = await res.json() as QAResponse;
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  const filtered = data?.results.filter(r => category === "All" || r.id.startsWith(category.toLowerCase().replace("/","_").replace(" ","_")));

  return (
    <div className="min-h-screen bg-[#050e1a] text-white" style={{ fontFamily: "'JetBrains Mono','Fira Mono',monospace" }}>
      {/* Header */}
      <div className="border-b border-[#1a3a5c] px-6 py-4 flex items-center justify-between" style={{ background: "rgba(5,14,26,0.97)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/dashboard")} className="text-[#00ffd1] hover:text-white transition-colors">←</button>
          <div>
            <div className="text-[#00ffd1] font-black text-sm tracking-widest">RANIA FLIGHT ACCURACY QA</div>
            <div className="text-[#4a7aaa] text-[10px] tracking-wider">Global Route Validation · Zero Wrong Cards Policy</div>
          </div>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all"
          style={{ background: loading ? "rgba(0,255,209,0.1)" : "rgba(0,255,209,0.2)", border: "1px solid #00ffd1", color: "#00ffd1", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "▶ RUNNING..." : "▶ RUN ALL TESTS"}
        </button>
      </div>

      {/* Summary Bar */}
      {data && (
        <div className="flex items-center gap-6 px-6 py-4 border-b border-[#1a3a5c]" style={{ background: "rgba(0,255,209,0.04)" }}>
          <div className="text-center">
            <div className="text-2xl font-black text-[#00ffd1]">{data.summary.passRate}%</div>
            <div className="text-[10px] text-[#4a7aaa] tracking-widest">PASS RATE</div>
          </div>
          <div className="w-px h-10 bg-[#1a3a5c]" />
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-lg font-black text-[#00ff88]">{data.summary.passed}</div>
              <div className="text-[9px] text-[#4a7aaa]">PASSED</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-[#ff4444]">{data.summary.failed}</div>
              <div className="text-[9px] text-[#4a7aaa]">FAILED</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-[#e0f0ff]">{data.summary.total}</div>
              <div className="text-[9px] text-[#4a7aaa]">TOTAL</div>
            </div>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-2 rounded-full bg-[#1a3a5c] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${data.summary.passRate}%`, background: data.summary.passRate >= 99 ? "#00ff88" : data.summary.passRate >= 90 ? "#ffdd00" : "#ff4444" }} />
            </div>
            <div className="text-[9px] text-[#4a7aaa] mt-1">Target: 99%+</div>
          </div>
          <div className="text-[#3a5a7a] text-[9px]">{new Date(data.timestamp).toLocaleTimeString()}</div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-[#1a3a5c] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest transition-all border"
            style={{
              background: category === c ? (CATEGORY_COLORS[c] || "#00ffd1") + "22" : "rgba(5,14,26,0.8)",
              borderColor: category === c ? (CATEGORY_COLORS[c] || "#00ffd1") : "#1a3a5c",
              color: category === c ? (CATEGORY_COLORS[c] || "#00ffd1") : "#4a7aaa",
            }}>
            {c}
          </button>
        ))}
      </div>

      {/* Test Results */}
      <div className="p-6">
        {!data && !loading && (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl opacity-30">✈</div>
            <div className="text-[#3a5a7a] text-sm">Click "RUN ALL TESTS" to validate global flight accuracy</div>
            <div className="text-[#3a5a7a] text-xs mt-2">Tests: PEK→SHA, JFK→LHR, SYD→MEL, NBO→LHR, and 30+ more routes</div>
          </div>
        )}
        {loading && (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl animate-pulse">⚡</div>
            <div className="text-[#00ffd1] text-sm tracking-widest">RUNNING ACCURACY TESTS...</div>
          </div>
        )}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(filtered ?? data.results).map(result => (
              <div key={result.id} className="rounded-xl border overflow-hidden" style={{
                background: "rgba(5,14,26,0.9)",
                borderColor: result.passed ? "#00ff88" + "44" : "#ff4444" + "44",
              }}>
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{
                  background: result.passed ? "rgba(0,255,136,0.06)" : "rgba(255,68,68,0.06)",
                  borderColor: result.passed ? "#00ff8822" : "#ff444422",
                }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{result.passed ? "✅" : "❌"}</span>
                    <span className="text-xs font-black" style={{ color: result.passed ? "#00ff88" : "#ff4444" }}>
                      {result.extractedFrom} → {result.extractedTo}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#4a7aaa] capitalize">{result.id.split("_")[0]}</span>
                </div>
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="text-[#88aacc] text-[10px] italic">"{result.message}"</div>
                  {result.error && <div className="text-[#ff6644] text-[10px]">⚠️ {result.error}</div>}
                  {!result.error && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px]" style={{ color: result.airlinesOk ? "#00ff88" : "#ff8800" }}>
                          {result.airlinesOk ? "✓" : "⚠"} Airlines
                        </span>
                        <span className="text-[#4a7aaa] text-[9px]">{result.airlines.slice(0, 3).join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px]" style={{ color: result.routeInDb ? "#00ffd1" : "#4a7aaa" }}>
                          {result.routeInDb ? "✓" : "○"} Route DB
                        </span>
                        <span className="text-[#3a5a7a] text-[9px]">{result.routeInDb ? "matched" : "estimated"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target Note */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[#3a5a7a] text-[9px] tracking-widest pointer-events-none">
        TARGET: Route Accuracy ≥ 99% · Airlines Correct ≥ 98% · Zero Wrong DIL Cards
      </div>
    </div>
  );
}
