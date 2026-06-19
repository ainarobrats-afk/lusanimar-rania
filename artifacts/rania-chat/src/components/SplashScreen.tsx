import { useEffect, useRef, useState } from "react";

const FLAGS_ORBIT = [
  "🇮🇩","🇸🇬","🇯🇵","🇰🇷","🇦🇺","🇺🇸","🇲🇾","🇬🇧","🇵🇹","🇦🇪","🇨🇳","🇩🇪","🇫🇷","🇧🇷","🇮🇳",
];

// ── Use SESSION storage so splash shows every time app is opened ──
const SS_KEY = "rania_splash_session_v4";
export function hasSplashBeenShown(): boolean {
  try { return !!sessionStorage.getItem(SS_KEY); } catch { return false; }
}
export function markSplashShown(): void {
  try { sessionStorage.setItem(SS_KEY, "1"); } catch { }
}

const DURATION_MS = 18000;

// ── 15 planes with varied routes, timing, size, color ────────────────────────
const PLANES = [
  { dir: "lr",  top:  7, delay: 0.4,  dur: 9,   size: 20, color: "#22d3ee", rot:  10 },
  { dir: "lr",  top: 17, delay: 2.8,  dur: 11,  size: 16, color: "#a78bfa", rot:   6 },
  { dir: "lr",  top: 30, delay: 5.5,  dur: 8.5, size: 22, color: "#34d399", rot:  14 },
  { dir: "lr",  top: 44, delay: 1.2,  dur: 13,  size: 14, color: "#fbbf24", rot:   4 },
  { dir: "lr",  top: 58, delay: 7.0,  dur: 9,   size: 18, color: "#22d3ee", rot:   9 },
  { dir: "lr",  top: 72, delay: 3.3,  dur: 10,  size: 20, color: "#818cf8", rot:   7 },
  { dir: "lr",  top: 86, delay: 9.5,  dur: 8,   size: 16, color: "#a78bfa", rot:  11 },
  { dir: "lr",  top: 39, delay: 12.0, dur: 9,   size: 18, color: "#22d3ee", rot:   5 },
  { dir: "rl",  top: 11, delay: 1.6,  dur: 10,  size: 18, color: "#22d3ee", rot:  -8 },
  { dir: "rl",  top: 24, delay: 6.0,  dur: 8,   size: 14, color: "#f472b6", rot: -11 },
  { dir: "rl",  top: 48, delay: 0.7,  dur: 12,  size: 20, color: "#34d399", rot:  -6 },
  { dir: "rl",  top: 65, delay: 4.1,  dur: 9.5, size: 16, color: "#a78bfa", rot: -14 },
  { dir: "rl",  top: 81, delay: 8.0,  dur: 10,  size: 18, color: "#22d3ee", rot:  -9 },
  { dir: "rl",  top: 20, delay: 11.5, dur: 8.5, size: 15, color: "#fbbf24", rot:  -7 },
  { dir: "rl",  top: 55, delay: 14.0, dur: 9,   size: 17, color: "#818cf8", rot: -12 },
];

const CITY_CALLOUTS = [
  { city: "LONDON",  code: "LHR", x: 78, y: 22, delay: 2800 },
  { city: "SYDNEY",  code: "SYD", x: 80, y: 72, delay: 4500 },
  { city: "LISBON",  code: "LIS", x: 10, y: 30, delay: 6200 },
  { city: "JAKARTA", code: "CGK", x: 68, y: 58, delay: 8000 },
  { city: "TOKYO",   code: "NRT", x: 15, y: 60, delay: 10500 },
  { city: "DUBAI",   code: "DXB", x: 82, y: 40, delay: 12000 },
];

function playAmbientSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.5);
    master.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 8);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 17);
    master.connect(ctx.destination);

    const rev = ctx.createConvolver();
    const revBuf = ctx.createBuffer(2, ctx.sampleRate * 2, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = revBuf.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
    }
    rev.buffer = revBuf;
    rev.connect(master);

    [[80,0],[120,0.05],[160,0.12],[240,0.20],[320,0.28],[420,0.35]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.055, ctx.currentTime + delay);
      osc.connect(g); g.connect(rev);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + 17);
    });

    const swoosh = ctx.createOscillator(); const swooshG = ctx.createGain();
    swoosh.type = "sawtooth";
    swoosh.frequency.setValueAtTime(900, ctx.currentTime + 0.3);
    swoosh.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 2.2);
    swooshG.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    swooshG.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.6);
    swooshG.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.2);
    swoosh.connect(swooshG); swooshG.connect(master);
    swoosh.start(ctx.currentTime + 0.3); swoosh.stop(ctx.currentTime + 2.5);

    [[1047,1],[1319,1.15],[1568,1.30],[2093,1.45]].forEach(([freq, t]) => {
      const c = ctx.createOscillator(); const g = ctx.createGain();
      c.type = "sine"; c.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.10, ctx.currentTime + t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 2.5);
      c.connect(g); g.connect(master);
      c.start(ctx.currentTime + t); c.stop(ctx.currentTime + t + 3);
    });
    return ctx;
  } catch { return null; }
}

function speakWelcome() {
  try {
    if (!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(
      "Selamat datang di Lu Sanimar — saya RANIA, asisten perjalanan Anda. Mari saya bawa Anda ke dunia!"
    );
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith("id") || v.name.includes("Siri") || v.name.includes("Google")
    );
    if (preferred) msg.voice = preferred;
    msg.rate = 0.88; msg.pitch = 1.05; msg.volume = 0.75;
    setTimeout(() => window.speechSynthesis.speak(msg), 1400);
  } catch { }
}

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress]           = useState(0);
  const [textVisible, setTextVisible]     = useState(false);
  const [phase, setPhase]                 = useState(0);
  const [visibleCallouts, setVisibleCallouts] = useState<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const step = 100 / (DURATION_MS / 50);
    const iv       = setInterval(() => setProgress(p => Math.min(100, p + step)), 50);
    const t0       = setTimeout(() => setTextVisible(true), 700);
    const t1       = setTimeout(() => setPhase(1), 4000);
    const t2       = setTimeout(() => setPhase(2), 8500);
    const t3       = setTimeout(() => setPhase(3), 13000);
    const done     = setTimeout(() => { markSplashShown(); onDone(); }, DURATION_MS);

    audioCtxRef.current = playAmbientSound() as AudioContext | null;

    // Try ElevenLabs first, fallback to Web Speech
    fetch("/api/rania/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Selamat datang di Lu Sanimar — saya RANIA, asisten perjalanan Anda. Mari saya bawa Anda ke dunia!", lang: "id" }),
    })
      .then(r => r.ok ? r.blob() : Promise.reject("fail"))
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.volume = 0.85;
        setTimeout(() => a.play().catch(speakWelcome), 1400);
        a.onended = () => URL.revokeObjectURL(url);
      })
      .catch(speakWelcome);

    const calloutTimers = CITY_CALLOUTS.map((c, i) =>
      setTimeout(() => setVisibleCallouts(prev => [...prev, i]), c.delay)
    );
    return () => {
      clearInterval(iv); clearTimeout(t0); clearTimeout(t1);
      clearTimeout(t2); clearTimeout(t3); clearTimeout(done);
      calloutTimers.forEach(clearTimeout);
    };
  }, [onDone]);

  const skip = () => { markSplashShown(); onDone(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

        @keyframes sp-orbit-wrap {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sp-orbit-flag {
          from { transform: translateX(132px) rotate(0deg); }
          to   { transform: translateX(132px) rotate(-360deg); }
        }
        @keyframes sp-plane-lr {
          0%   { transform: translateX(-120px); opacity: 0; }
          4%   { opacity: 1; }
          94%  { opacity: 0.9; }
          100% { transform: translateX(calc(100vw + 120px)); opacity: 0; }
        }
        @keyframes sp-plane-rl {
          0%   { transform: translateX(calc(100vw + 120px)); opacity: 0; }
          4%   { opacity: 1; }
          94%  { opacity: 0.9; }
          100% { transform: translateX(-120px); opacity: 0; }
        }
        @keyframes sp-earth-glow {
          0%,100% { box-shadow: 0 0 60px rgba(30,136,229,0.65), 0 0 120px rgba(0,100,255,0.28), inset 0 0 30px rgba(0,60,180,0.4); }
          50%     { box-shadow: 0 0 110px rgba(30,136,229,0.95), 0 0 220px rgba(0,160,255,0.55), inset 0 0 45px rgba(0,80,220,0.55); }
        }
        @keyframes sp-title-neon {
          0%,100% { text-shadow: 0 0 20px rgba(34,211,238,0.9), 0 0 50px rgba(34,211,238,0.5), 0 0 90px rgba(99,102,241,0.35); color: #ffffff; }
          20%     { text-shadow: 0 0 35px rgba(34,211,238,1),   0 0 80px rgba(34,211,238,0.7), 0 0 140px rgba(34,211,238,0.4); color: #e0f8ff; }
          45%     { text-shadow: 0 0 30px rgba(167,139,250,1),  0 0 70px rgba(139,92,246,0.8), 0 0 130px rgba(99,102,241,0.5); color: #f3f0ff; }
          70%     { text-shadow: 0 0 40px rgba(251,191,36,0.85),0 0 80px rgba(245,158,11,0.6), 0 0 130px rgba(34,211,238,0.5); color: #fffce0; }
        }
        @keyframes sp-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-star {
          0%,100% { opacity: 0.10; } 50% { opacity: 0.75; }
        }
        @keyframes sp-ring-pulse {
          0%,100% { opacity: 0.20; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.45; transform: translate(-50%,-50%) scale(1.07); }
        }
        @keyframes sp-ring2-pulse {
          0%,100% { opacity: 0.10; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.28; transform: translate(-50%,-50%) scale(1.04); }
        }
        @keyframes sp-tagline-fade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-callout {
          0%   { opacity: 0; transform: translateY(8px) scale(0.88); }
          15%  { opacity: 1; transform: translateY(0)  scale(1); }
          72%  { opacity: 1; transform: translateY(0)  scale(1); }
          100% { opacity: 0; transform: translateY(-5px) scale(0.96); }
        }
        @keyframes sp-aurora {
          0%,100% { opacity: 0.07; transform: scaleX(1) scaleY(1); }
          50%     { opacity: 0.15; transform: scaleX(1.10) scaleY(1.06); }
        }
        @keyframes sp-shoot {
          0%   { transform: translateX(0) translateY(0); opacity: 1; }
          100% { transform: translateX(140px) translateY(70px); opacity: 0; }
        }
        @keyframes sp-dot-ping {
          0%   { transform: scale(1); opacity: 0.85; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes sp-progress-glow {
          0%,100% { box-shadow: 0 0 8px rgba(34,211,238,0.6); }
          50%     { box-shadow: 0 0 18px rgba(139,92,246,0.9); }
        }
        @keyframes sp-neon-bar {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        @keyframes sp-globe-rotate {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes sp-plane-trail {
          0%   { opacity: 0.7; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0.3); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden select-none"
        style={{ background: "radial-gradient(ellipse at 50% 18%, #0a1f50 0%, #040e28 45%, #010610 100%)" }}
        onClick={skip}
      >

        {/* ── Aurora glow bands ─────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: "63%", color: "rgba(6,182,212,0.10)",  w: "145%", h: 85,  delay: 0,   dur: 7 },
            { top: "70%", color: "rgba(139,92,246,0.07)", w: "125%", h: 55,  delay: 1.8, dur: 9 },
            { top: "56%", color: "rgba(34,197,94,0.05)",  w: "165%", h: 42,  delay: 0.9, dur: 11 },
            { top: "35%", color: "rgba(34,211,238,0.04)", w: "130%", h: 35,  delay: 3.0, dur: 13 },
          ].map((a, i) => (
            <div key={i} className="absolute left-1/2 -translate-x-1/2 rounded-full blur-3xl"
              style={{ top: a.top, width: a.w, height: a.h, background: a.color,
                animation: `sp-aurora ${a.dur}s ease-in-out infinite`, animationDelay: `${a.delay}s` }} />
          ))}
        </div>

        {/* ── Shooting stars ────────────────────────────────────────────── */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white pointer-events-none"
            style={{
              left: `${5 + i * 12}%`, top: `${4 + i * 5}%`,
              animation: `sp-shoot ${1.8 + i * 0.5}s ease-out infinite`,
              animationDelay: `${i * 1.5 + 0.3}s`, opacity: 0,
              boxShadow: "0 0 5px 1px rgba(255,255,255,0.7), 5px 2.5px 14px rgba(255,255,255,0.35)",
            }} />
        ))}

        {/* ── Twinkling stars ───────────────────────────────────────────── */}
        {[...Array(100)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white pointer-events-none"
            style={{
              width:  i % 9 === 0 ? 2.5 : i % 4 === 0 ? 1.5 : 1,
              height: i % 9 === 0 ? 2.5 : i % 4 === 0 ? 1.5 : 1,
              left: `${(i * 37 + 13) % 100}%`,
              top:  `${(i * 53 +  7) % 100}%`,
              animation: `sp-star ${2.2 + (i % 7) * 0.6}s ease-in-out infinite`,
              animationDelay: `${(i * 0.15) % 4}s`,
            }} />
        ))}

        {/* ── 15 Flying planes across screen ───────────────────────────── */}
        {PLANES.map((p, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{
              top: `${p.top}%`,
              left: p.dir === "lr" ? 0 : "auto",
              right: p.dir === "rl" ? 0 : "auto",
              animation: `sp-plane-${p.dir} ${p.dur}s ${p.delay}s linear infinite`,
              opacity: 0,
              zIndex: 5,
            }}>
            {/* Glow trail */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 0,
              filter: `drop-shadow(0 0 6px ${p.color}) drop-shadow(0 0 14px ${p.color}80)`,
            }}>
              {p.dir === "rl" && (
                <div style={{
                  width: 28, height: 2, borderRadius: 2,
                  background: `linear-gradient(to right, transparent, ${p.color}60)`,
                  marginRight: -2,
                }} />
              )}
              <span style={{
                fontSize: p.size,
                transform: `rotate(${p.rot}deg) scaleX(${p.dir === "rl" ? -1 : 1})`,
                display: "inline-block",
                color: p.color,
              }}>✈</span>
              {p.dir === "lr" && (
                <div style={{
                  width: 32, height: 2, borderRadius: 2,
                  background: `linear-gradient(to right, ${p.color}60, transparent)`,
                  marginLeft: -2,
                }} />
              )}
            </div>
          </div>
        ))}

        {/* ── City callouts ─────────────────────────────────────────────── */}
        {CITY_CALLOUTS.map((c, i) =>
          visibleCallouts.includes(i) && (
            <div key={i} className="absolute pointer-events-none z-20 flex items-center gap-1.5"
              style={{ left: `${c.x}%`, top: `${c.y}%`, animation: "sp-callout 3.8s ease-in-out both" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 relative">
                <div className="absolute inset-0 rounded-full bg-cyan-400"
                  style={{ animation: "sp-dot-ping 1.2s ease-out infinite" }} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-mono text-cyan-300/90 tracking-widest">{c.code}</span>
                <span className="text-[8px] font-mono text-white/50 tracking-wider">{c.city}</span>
              </div>
            </div>
          )
        )}

        {/* ── Globe + orbit container ───────────────────────────────────── */}
        <div className="relative flex items-center justify-center z-10" style={{ width: 340, height: 340 }}>

          {/* Outer glow ring */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ top: "50%", left: "50%", width: 330, height: 330,
              transform: "translate(-50%,-50%)",
              border: "1px solid rgba(34,211,238,0.22)",
              animation: "sp-ring-pulse 5s ease-in-out infinite" }} />
          {/* Mid ring */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ top: "50%", left: "50%", width: 248, height: 248,
              transform: "translate(-50%,-50%)",
              border: "1px solid rgba(99,102,241,0.16)",
              animation: "sp-ring2-pulse 7s ease-in-out infinite" }} />
          {/* Inner ring */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ top: "50%", left: "50%", width: 190, height: 190,
              transform: "translate(-50%,-50%)",
              border: "1px solid rgba(59,130,246,0.10)" }} />

          {/* SVG orbit trails */}
          <svg className="absolute pointer-events-none" width="340" height="340" style={{ top: 0, left: 0 }}>
            <ellipse cx="170" cy="170" rx="95" ry="40" fill="none"
              stroke="rgba(34,211,238,0.10)" strokeWidth="1.5" strokeDasharray="5 9" />
            <ellipse cx="170" cy="170" rx="152" ry="58" fill="none"
              stroke="rgba(139,92,246,0.07)" strokeWidth="1" strokeDasharray="3 13" />
          </svg>

          {/* Earth sphere */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ top: "50%", left: "50%", width: 176, height: 176,
              transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle at 34% 26%, #1565c0 0%, #0d47a1 22%, #1a237e 52%, #000b33 76%, #00052a 100%)",
              animation: "sp-earth-glow 3.5s ease-in-out infinite",
              boxShadow: "inset -20px -14px 38px rgba(0,0,0,0.78)" }}>
            <div className="absolute rounded-full opacity-30"
              style={{ width: 62, height: 44, top: "18%", left: "14%", background: "#2e7d32", transform: "rotate(-14deg)" }} />
            <div className="absolute opacity-22"
              style={{ width: 48, height: 36, top: "40%", left: "48%", background: "#1b5e20", borderRadius: "40% 60% 50% 70%" }} />
            <div className="absolute opacity-18"
              style={{ width: 34, height: 26, top: "12%", left: "56%", background: "#33691e", borderRadius: "40% 60% 50% 70%" }} />
            <div className="absolute rounded-full opacity-15"
              style={{ width: 24, height: 17, top: "58%", left: "16%", background: "#2e7d32" }} />
            {/* North America */}
            <div className="absolute opacity-20"
              style={{ width: 30, height: 22, top: "25%", left: "8%", background: "#388e3c", borderRadius: "45% 55% 50% 65%" }} />
            {/* Atmosphere */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle at 30% 22%, rgba(96,165,250,0.18) 0%, transparent 62%)" }} />
          </div>

          {/* TL flag — center */}
          <div className="absolute pointer-events-none"
            style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 46, zIndex: 10,
              filter: "drop-shadow(0 2px 22px rgba(0,0,0,0.98)) drop-shadow(0 0 8px rgba(34,211,238,0.3))" }}>
            🇹🇱
          </div>

          {/* Orbiting flags (15 flags, 24s orbit) */}
          {FLAGS_ORBIT.map((flag, i) => {
            const dur = 28;
            const delay = -(i / FLAGS_ORBIT.length) * dur;
            return (
              <div key={i} className="absolute pointer-events-none"
                style={{ top: "50%", left: "50%", width: 0, height: 0,
                  animation: `sp-orbit-wrap ${dur}s linear infinite`, animationDelay: `${delay}s` }}>
                <div style={{ position: "absolute",
                  animation: `sp-orbit-flag ${dur}s linear infinite`, animationDelay: `${delay}s`,
                  fontSize: 18, marginTop: -10, filter: "drop-shadow(0 1px 7px rgba(0,0,0,0.9))" }}>
                  {flag}
                </div>
              </div>
            );
          })}

          {/* Orbit plane 1 — inner (cyan) */}
          <div className="absolute pointer-events-none"
            style={{ top: "50%", left: "50%", width: 0, height: 0, animation: "sp-plane1 4.2s linear infinite" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", marginLeft: -11, marginTop: -11,
              filter: "drop-shadow(0 0 9px rgba(34,211,238,1)) drop-shadow(0 0 4px rgba(34,211,238,0.8))" }}>
              <path d="M11 4 L15 11 L19 10 L17 12 L11 9 L5 12 L3 10 L7 11 Z" fill="rgba(34,211,238,0.95)" />
              <circle cx="11" cy="9.5" r="1.5" fill="#22d3ee" />
            </svg>
          </div>

          {/* Orbit plane 2 — outer (violet) */}
          <div className="absolute pointer-events-none"
            style={{ top: "50%", left: "50%", width: 0, height: 0, animation: "sp-plane2 7.5s linear infinite" }}>
            <svg width="18" height="18" viewBox="0 0 22 22" style={{ position: "absolute", marginLeft: -9, marginTop: -9,
              filter: "drop-shadow(0 0 11px rgba(167,139,250,1)) drop-shadow(0 0 5px rgba(167,139,250,0.8))" }}>
              <path d="M11 4 L15 11 L19 10 L17 12 L11 9 L5 12 L3 10 L7 11 Z" fill="rgba(167,139,250,0.95)" />
              <circle cx="11" cy="9.5" r="1.5" fill="#a78bfa" />
            </svg>
          </div>
        </div>

        {/* ── Brand text ────────────────────────────────────────────────── */}
        <div className="text-center mt-5 px-4 z-10"
          style={{ animation: textVisible ? "sp-fade-up 1s ease-out both" : "none", opacity: textVisible ? 1 : 0 }}>

          <div className="text-[clamp(24px,6vw,36px)] font-black tracking-widest text-white"
            style={{
              fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
              letterSpacing: "0.24em",
              animation: textVisible ? "sp-title-neon 4s ease-in-out infinite" : "none",
            }}>
            LU SANIMAR
          </div>

          <div className="text-cyan-400 text-[11px] font-mono tracking-[0.28em] mt-1.5 uppercase"
            style={{ textShadow: "0 0 14px rgba(34,211,238,0.7), 0 0 28px rgba(34,211,238,0.4)" }}>
            Travel Intelligence · RANIA AI
          </div>

          {phase >= 1 && (
            <div className="text-white/45 text-[11px] mt-3 tracking-wide"
              style={{ animation: "sp-tagline-fade 1.2s ease-out both" }}>
              ✈ Timor-Leste — Explorasaun ba Mundu
            </div>
          )}

          {phase >= 2 && (
            <div className="flex gap-2.5 justify-center mt-2.5"
              style={{ animation: "sp-tagline-fade 1s ease-out both" }}>
              {["FLIGHTS", "HOTELS", "VISA", "TOURS", "INSURANCE"].map(s => (
                <span key={s} className="text-[8px] font-mono text-white/25 tracking-widest border border-white/8 px-1.5 py-0.5 rounded"
                  style={{ textShadow: "0 0 6px rgba(34,211,238,0.3)" }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {phase >= 3 && (
            <div className="text-emerald-400/70 text-[10px] font-mono mt-2 tracking-wider"
              style={{ animation: "sp-tagline-fade 0.8s ease-out both" }}>
              🌏 150+ Destinations · 24/7 Support · Secure Booking
            </div>
          )}
        </div>

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        <div className="w-56 h-[3px] bg-white/5 rounded-full mt-6 overflow-hidden relative z-10">
          <div className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #22d3ee, #6366f1, #a78bfa, #22d3ee)",
              backgroundSize: "200% 100%",
              transition: "width 0.05s linear",
              animation: "sp-progress-glow 2s ease-in-out infinite, sp-neon-bar 3s linear infinite",
            }} />
        </div>

        <div className="text-white/15 text-[9px] font-mono mt-1.5 tracking-widest z-10">
          {progress < 100 ? `LOADING ${Math.round(progress)}%` : "READY ✓"}
        </div>

        {/* ── Skip button ───────────────────────────────────────────────── */}
        <button onClick={skip}
          className="mt-3 text-white/20 text-[11px] hover:text-white/55 transition-colors px-4 py-1.5 rounded-full border border-white/8 hover:border-white/25 z-10"
          style={{ fontFamily: "monospace" }}>
          Skip ▶
        </button>

        {/* ── CSS for orbital planes (reused from globe section) ────────── */}
        <style>{`
          @keyframes sp-plane1 {
            from { transform: rotate(0deg) translateX(95px) rotate(0deg); }
            to   { transform: rotate(360deg) translateX(95px) rotate(-360deg); }
          }
          @keyframes sp-plane2 {
            from { transform: rotate(180deg) translateX(152px) rotate(-180deg); }
            to   { transform: rotate(540deg) translateX(152px) rotate(-540deg); }
          }
        `}</style>
      </div>
    </>
  );
}
