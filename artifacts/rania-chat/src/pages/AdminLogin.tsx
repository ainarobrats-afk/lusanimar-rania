import { useState } from "react";
import { useLocation } from "wouter";

const API = "/api";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.email);
      localStorage.setItem("adminRole", data.role);
      setLocation("/admin/dashboard");
    } catch {
      setError("Network error. Check server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✈️</div>
          <h1 className="text-3xl font-black text-white tracking-wider">RANIA</h1>
          <p className="text-[#00FFD1] text-sm font-mono mt-1">ADMIN CONTROL CENTER</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111118] border border-[#00FFD1]/20 rounded-2xl p-8 shadow-2xl shadow-[#00FFD1]/5">
          <h2 className="text-white font-bold text-xl mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[#00FFD1] text-xs font-mono mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1a1a25] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00FFD1]/50 transition-colors"
              placeholder="admin@sanimar.tl"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#00FFD1] text-xs font-mono mb-2 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1a1a25] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00FFD1]/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00FFD1] text-black font-bold py-3 rounded-lg hover:bg-[#00e6bb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6 font-mono">
          SANIMAR TRAVEL · RANIA AI ADMIN v2.0
        </p>
      </div>
    </div>
  );
}
