import { useState } from "react";

type TestResult = {
  name: string;
  pass: boolean;
  detail: string;
};

export default function TestDashboard() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [coverage, setCoverage] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setStatus("running");
    setError(null);
    setResults([]);
    setCoverage(0);

    try {
      const res = await fetch("/api/test");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const testResults: TestResult[] = (data.results || []).map((item: any) => ({
        name: item.name,
        pass: item.pass,
        detail: item.detail || "",
      }));

      setResults(testResults);
      setCoverage(data.coverage ?? 0);
      setStatus(data.pass ? "pass" : "fail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const passed = results.filter((item) => item.pass).length;
  const total = results.length;

  return (
    <div className="min-h-screen bg-[#03131f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-3xl font-bold tracking-tight">RANIA Local QA Dashboard</div>
              <div className="text-sm text-slate-300 mt-1">Run local validation for chat, flights, visa, weather, tourism, payment, and memory.</div>
            </div>
            <button
              onClick={runTests}
              className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              {status === "running" ? "Running tests…" : "Run Local QA"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="text-xs uppercase text-slate-400">Coverage</div>
              <div className="mt-2 text-2xl font-bold">{coverage}%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="text-xs uppercase text-slate-400">Passed</div>
              <div className="mt-2 text-2xl font-bold">{passed}/{total}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="text-xs uppercase text-slate-400">Backend</div>
              <div className="mt-2 text-2xl font-bold">localhost:8787</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr,0.8fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <div className="mb-4 text-lg font-semibold">Test results</div>
              {error ? (
                <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">Error running tests: {error}</div>
              ) : results.length === 0 ? (
                <div className="text-sm text-slate-400">Click "Run Local QA" to execute the local suite.</div>
              ) : (
                <div className="space-y-3">
                  {results.map((item) => (
                    <div
                      key={item.name}
                      className={`rounded-2xl border p-4 ${item.pass ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{item.name}</div>
                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.pass ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                          {item.pass ? "PASS" : "FAIL"}
                        </div>
                      </div>
                      {item.detail ? <div className="mt-2 text-sm text-slate-300">{item.detail}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <div className="mb-4 text-lg font-semibold">Checklist</div>
              <div className="space-y-3 text-sm text-slate-300">
                <div>✅ Chat</div>
                <div>✅ Flight cards</div>
                <div>✅ Visa</div>
                <div>✅ Weather</div>
                <div>✅ Tourism</div>
                <div>✅ Payment</div>
                <div>✅ Session</div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <div className="text-lg font-semibold">Quick links</div>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  Frontend: <a href="http://localhost:3000" className="text-cyan-300 underline">http://localhost:3000</a>
                </div>
                <div>
                  Backend: <a href="http://localhost:8787" className="text-cyan-300 underline">http://localhost:8787</a>
                </div>
                <div>
                  API test: <a href="http://localhost:3000/test" className="text-cyan-300 underline">/test</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
