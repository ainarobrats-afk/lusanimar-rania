import { useState, useEffect, useRef } from "react";
import { detectBrowserLang } from "./SessionManager";

interface Props {
  onAction: (action: "search" | "explore" | "status" | "chat") => void;
  lang: string;
  voiceEnabled?: boolean;
}

const LS_KEY = "rania_welcomed";
const RETURNING_KEY = "rania_welcomed_count";
const AUTO_HIDE_MS = 10_000;

// Time-aware greeting
function getGreeting(lang: string): string {
  const h = new Date().getHours();
  const period = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";

  const greetings: Record<string, Record<string, string>> = {
    id: {
      morning: "Selamat pagi 👋",
      afternoon: "Selamat siang 👋",
      evening: "Selamat malam 👋",
    },
    en: {
      morning: "Good morning 👋",
      afternoon: "Good afternoon 👋",
      evening: "Good evening 👋",
    },
    pt: {
      morning: "Bom dia 👋",
      afternoon: "Boa tarde 👋",
      evening: "Boa noite 👋",
    },
    tet: {
      morning: "Bondia 👋",
      afternoon: "Botarde 👋",
      evening: "Bonoite 👋",
    },
  };
  return greetings[lang]?.[period] ?? greetings.id[period];
}

const COPY: Record<string, {
  sub: string; actions: string[];
  returning: string; secure: string;
}> = {
  id: {
    sub: "Saya RANIA, siap bantu cari tiket, hotel, atau perjalanan kamu.",
    actions: ["✈ Cari Tiket", "🏨 Explore", "📦 Cek Booking", "💬 Tanya RANIA"],
    returning: "Selamat datang kembali 👋",
    secure: "🔒 Booking aman · ⚡ Respon < 30 dtk",
  },
  en: {
    sub: "I'm RANIA. Need a flight, hotel, or travel help? I'm ready.",
    actions: ["✈ Search Flights", "🏨 Explore", "📦 My Booking", "💬 Ask RANIA"],
    returning: "Welcome back 👋",
    secure: "🔒 Secure booking · ⚡ Response < 30s",
  },
  pt: {
    sub: "Sou RANIA. Posso ajudar com voos, hotéis ou viagens.",
    actions: ["✈ Pesquisar Voos", "🏨 Explorar", "📦 Minha Reserva", "💬 Perguntar RANIA"],
    returning: "Bem-vindo de volta 👋",
    secure: "🔒 Reserva segura · ⚡ Resposta < 30s",
  },
  tet: {
    sub: "Ha'u mak RANIA. Bele ajuda ita-boot buka bilhete, hotel, ka viajen.",
    actions: ["✈ Buka Bilhete", "🏨 Esplora", "📦 Verifika Booking", "💬 Husu RANIA"],
    returning: "Bem-vindus fila-fali 👋",
    secure: "🔒 Booking seguru · ⚡ Resposta < 30s",
  },
};

export function WelcomeCard({ onAction, lang: propLang, voiceEnabled }: Props) {
  const [visible, setVisible] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [lang, setLang] = useState(propLang);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setLang(propLang);
  }, [propLang]);

  useEffect(() => {
    // Respect reduced-motion / battery-save
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const welcomed = localStorage.getItem(LS_KEY);
    const count = Number(localStorage.getItem(RETURNING_KEY) ?? "0");

    if (!welcomed) {
      // First visitor — detect browser lang
      const detected = detectBrowserLang();
      setLang(detected);
      setVisible(true);
      localStorage.setItem(LS_KEY, "1");
      localStorage.setItem(RETURNING_KEY, "1");
    } else if (count < 3) {
      // Show returning greeting for first 2 revisits
      setIsReturning(true);
      setVisible(true);
      localStorage.setItem(RETURNING_KEY, String(count + 1));
    }

    // Auto-hide after 10s
    timerRef.current = setTimeout(() => setMinimized(true), AUTO_HIDE_MS);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!visible || minimized) return null;

  const c = COPY[lang] ?? COPY.id;
  const actions: Array<"search" | "explore" | "status" | "chat"> = ["search", "explore", "status", "chat"];

  const handleAction = (a: "search" | "explore" | "status" | "chat") => {
    setMinimized(true);
    onAction(a);
  };

  if (isReturning) {
    return (
      <div
        className="fixed bottom-24 md:bottom-20 left-4 z-[200] max-w-[280px] animate-in slide-in-from-bottom-4 duration-300"
        style={{
          background: "rgba(4,9,26,0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,229,255,0.2)",
          borderRadius: 16,
          padding: "12px 16px",
          boxShadow: "0 4px 20px rgba(0,229,255,0.12)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-white font-semibold">{c.returning}</span>
          <button onClick={() => setMinimized(true)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{c.secure}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-24 md:bottom-20 left-4 z-[200] max-w-[300px] w-[calc(100vw-32px)] md:w-[300px]"
      style={{
        animation: "slideInBottom 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div
        style={{
          background: "rgba(4,9,26,0.94)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,229,255,0.18)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,229,255,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 40, height: 40, borderRadius: 12, overflow: "hidden", flexShrink: 0,
                background: "linear-gradient(135deg,#00e5ff22,#7c3aed22)",
                border: "1px solid rgba(0,229,255,0.3)",
              }}
            >
              <img
                src="https://raw.githubusercontent.com/ainarobrats-afk/SANIMAR-TRAVEL/main/Rania%20Ai/public/image/rania_avatar.png.webp"
                alt="RANIA"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:20px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">🤖</span>';
                }}
              />
            </div>
            <div>
              <div className="text-sm font-black text-white leading-tight">{getGreeting(lang)}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "blink 2s infinite" }}
                />
                <span className="text-[10px] text-emerald-400 font-semibold">RANIA · Online 24/7</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="text-gray-500 hover:text-white text-xl leading-none mt-0.5 flex-shrink-0"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-300 leading-relaxed mb-3">{c.sub}</p>

          {/* Quick action chips */}
          <div className="grid grid-cols-2 gap-1.5">
            {c.actions.map((label, i) => (
              <button
                key={i}
                onClick={() => handleAction(actions[i])}
                className="text-[11px] font-semibold text-left px-3 py-2 rounded-xl transition-all active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#d1d5db",
                  minHeight: 36,
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,229,255,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,255,0.25)";
                  (e.currentTarget as HTMLElement).style.color = "#00e5ff";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "#d1d5db";
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Trust badge */}
          <div className="mt-3 text-[9px] text-gray-600 text-center">{c.secure}</div>
        </div>

        {/* Progress bar — auto-hide countdown */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              background: "linear-gradient(90deg,#00e5ff,#7c3aed)",
              animation: `shrink ${AUTO_HIDE_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideInBottom {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default WelcomeCard;
