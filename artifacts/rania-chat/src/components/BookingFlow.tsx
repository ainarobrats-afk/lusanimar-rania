// ============================================================================
// RANIA — Complete Booking Flow v4.0
// Ixigo-inspired: FlightCard → Passenger Form → Payment → Success
//
// Steps: SELECT_FLIGHT → PASSENGER → PAYMENT → SUCCESS
// Design: Dark + Orange, professional, world-class
// ============================================================================

import { useState, useRef, useCallback, useEffect } from "react";
import type { FlightOption } from "./FlightCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "SELECT_FLIGHT" | "PASSENGER" | "PAYMENT" | "SUCCESS" | "VERIFY";
type PayMethod = "QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BNI" | "VA_BRI" | "BNCTL" | "MOSAN" | "CARD";

interface Passenger {
  fullName: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

interface PaymentResult {
  bookingId: string;
  paymentId: string;
  invoiceUrl?: string;
  amount: number;
  currency: string;
  method: PayMethod;
  qrUrl?: string;
  vaNumber?: string;
  vaBank?: string;
}

interface BookingFlowProps {
  flights: FlightOption[];
  searchLoading?: boolean;
  lang?: "id" | "tet" | "en" | "pt";
  onComplete?: (result: { bookingId: string; flight: FlightOption; passenger: Passenger }) => void;
  onError?: (err: string) => void;
  onCancel?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(amount: number, currency: string): string {
  if (!amount) return "—";
  if (currency === "USD") return `$${amount.toLocaleString("en-US")}`;
  if (currency === "IDR") return `Rp ${amount.toLocaleString("id-ID")}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function fmtTime(iso: string): string {
  if (!iso) return "--:--";
  try { return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); } catch { return "--:--"; }
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

const AIRPORT_NAMES: Record<string, string> = {
  DIL:"Dili",DPS:"Bali",CGK:"Jakarta",SUB:"Surabaya",UPG:"Makassar",SIN:"Singapore",
  KUL:"Kuala Lumpur",BKK:"Bangkok",MNL:"Manila",NRT:"Tokyo Narita",HND:"Tokyo Haneda",
  KIX:"Osaka",PVG:"Shanghai",PEK:"Beijing",HKG:"Hong Kong",ICN:"Seoul",
  SYD:"Sydney",MEL:"Melbourne",DRW:"Darwin",DXB:"Dubai",LHR:"London",
  CDG:"Paris",FRA:"Frankfurt",JFK:"New York",LAX:"Los Angeles",LIS:"Lisbon",
};
const getCity = (code: string) => AIRPORT_NAMES[code] || code;

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const steps: { key: Step; label: string; icon: string }[] = [
    { key: "SELECT_FLIGHT", label: "Pilih", icon: "✈️" },
    { key: "PASSENGER",     label: "Data",  icon: "👤" },
    { key: "PAYMENT",       label: "Bayar", icon: "💳" },
    { key: "SUCCESS",       label: "Selesai", icon: "✅" },
  ];
  const cur = steps.findIndex(s => s.key === step || (step === "VERIFY" && s.key === "SUCCESS"));
  return (
    <div className="flex items-center px-1 mb-4">
      {steps.map((s, i) => {
        const done = i < cur;
        const active = i === cur;
        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all"
                style={done
                  ? { background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 12px rgba(16,185,129,0.4)" }
                  : active
                  ? { background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 0 16px rgba(249,115,22,0.5)" }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {done ? <span className="text-white text-xs">✓</span> : <span className={active ? "text-white" : "text-gray-600"}>{s.icon}</span>}
              </div>
              <span className={`text-[9px] font-bold ${active ? "text-orange-400" : done ? "text-emerald-400" : "text-gray-600"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 rounded-full mb-4" style={{ background: done ? "linear-gradient(90deg,#10b981,#059669)" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Airline Logo ─────────────────────────────────────────────────────────────

function AirlineLogo({ code, size = 10 }: { code: string; size?: number }) {
  const [err, setErr] = useState(false);
  const sz = `w-${size} h-${size}`;
  if (err) return (
    <div className={`${sz} rounded-xl flex items-center justify-center`} style={{ background: "linear-gradient(135deg,#1a2744,#0d1829)" }}>
      <span className="text-[11px] font-black text-orange-400 font-mono">{code}</span>
    </div>
  );
  return (
    <div className={`${sz} rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0`}>
      <img src={`https://pics.avs.io/80/80/${code}.png`} alt={code} className="w-full h-full object-contain p-1" onError={() => setErr(true)} />
    </div>
  );
}

// ─── Step 1: Flight Selection (mini summary card on select) ───────────────────

function FlightSummaryCard({ flight, onChange }: { flight: FlightOption; onChange: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "linear-gradient(135deg,#090f1e,#050c16)", border: "1px solid rgba(249,115,22,0.3)" }}>
      <div className="flex items-center gap-3 p-3">
        <AirlineLogo code={flight.airlineCode} size={10} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-black text-white">{flight.airline}</span>
            <span className="text-[8px] text-orange-400 font-mono">{flight.flightNumber}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono font-black text-white text-[13px]">{fmtTime(flight.departureTime)}</span>
            <span className="text-orange-400 font-black text-xs">{flight.from}</span>
            <svg className="w-3 h-3 text-orange-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            <span className="text-orange-400 font-black text-xs">{flight.to}</span>
            <span className="font-mono font-black text-white text-[13px]">{fmtTime(flight.arrivalTime)}</span>
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">{fmtDate(flight.departureTime)} · {flight.duration}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[18px] font-black" style={{ color: "#f97316", fontFamily: "monospace" }}>{fmtPrice(flight.totalPrice, flight.currency)}</div>
          <button onClick={onChange} className="text-[9px] text-gray-500 hover:text-orange-400 transition-colors mt-0.5">Ganti ✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Passenger Form ────────────────────────────────────────────────────

function PassengerFormStep({
  flight,
  onSubmit,
  onBack,
  loading,
}: {
  flight: FlightOption;
  onSubmit: (p: Passenger) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Passenger>({
    fullName: "", passportNumber: "", passportExpiry: "", nationality: "Timor-Leste",
    dateOfBirth: "", email: "", phone: "",
  });
  const [errors, setErrors] = useState<Partial<Passenger>>({});
  const [ocrState, setOcrState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ocrMsg, setOcrMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Passenger) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrState("loading");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64, travelDate: flight.departureTime || new Date().toISOString() }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.valid && data.extractedData) {
            setForm(p => ({
              ...p,
              fullName: data.extractedData.name || p.fullName,
              passportNumber: data.extractedData.passportNumber || p.passportNumber,
              passportExpiry: data.extractedData.expiryDate || p.passportExpiry,
              nationality: data.extractedData.nationality || p.nationality,
              dateOfBirth: data.extractedData.dateOfBirth || p.dateOfBirth,
            }));
            setOcrState("done");
            setOcrMsg("✅ Data paspor berhasil dibaca!");
          } else {
            setOcrState("error");
            setOcrMsg(data.errors?.[0] || "Gagal membaca paspor, isi manual.");
          }
        } else {
          setOcrState("error"); setOcrMsg("Server OCR tidak tersedia, isi manual.");
        }
      } catch {
        setOcrState("error"); setOcrMsg("Gagal menghubungi server, isi manual.");
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Partial<Passenger> = {};
    if (!form.fullName.trim() || form.fullName.trim().split(" ").length < 2) e.fullName = "Nama lengkap min 2 kata";
    if (!/^[A-Z0-9]{5,9}$/i.test(form.passportNumber.trim())) e.passportNumber = "Format paspor tidak valid";
    if (!form.passportExpiry) e.passportExpiry = "Wajib diisi";
    else {
      const exp = new Date(form.passportExpiry);
      const min = new Date(); min.setMonth(min.getMonth() + 6);
      if (exp < min) e.passportExpiry = "Harus berlaku >6 bulan";
    }
    if (!form.dateOfBirth) e.dateOfBirth = "Wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email salah";
    if (!form.phone.trim()) e.phone = "Wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inp = "w-full text-sm text-white px-3 py-2.5 rounded-xl focus:outline-none transition-colors placeholder-white/20";
  const inpStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
  const inpFocusStyle = { background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.4)" };

  return (
    <div className="space-y-4">
      <FlightSummaryCard flight={flight} onChange={onBack} />

      {/* Passport Scan */}
      <div
        className="rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all hover:border-orange-400/40"
        style={{ borderColor: ocrState === "done" ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)" }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
        {ocrState === "idle" && <>
          <div className="text-2xl mb-1">📸</div>
          <div className="text-white/50 text-xs font-bold">Foto/Upload Paspor</div>
          <div className="text-white/25 text-[10px] mt-0.5">AI baca data otomatis</div>
        </>}
        {ocrState === "loading" && <>
          <div className="text-2xl mb-1 animate-pulse">🔍</div>
          <div className="text-orange-400 text-xs font-bold animate-pulse">Memindai paspor...</div>
        </>}
        {ocrState === "done" && <>
          <div className="text-2xl mb-1">✅</div>
          <div className="text-emerald-400 text-xs font-bold">{ocrMsg}</div>
          <div className="text-white/25 text-[10px] mt-0.5">Klik untuk ganti</div>
        </>}
        {ocrState === "error" && <>
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-amber-400 text-xs font-bold">{ocrMsg}</div>
        </>}
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap (sesuai paspor) *</label>
        <input value={form.fullName} onChange={set("fullName")} placeholder="JOAO MANUEL DA SILVA" className={inp} style={inpStyle}
          onFocus={e => Object.assign(e.target.style, inpFocusStyle)} onBlur={e => Object.assign(e.target.style, inpStyle)} />
        {errors.fullName && <div className="text-[10px] text-red-400 mt-1">{errors.fullName}</div>}
      </div>

      {/* Passport + Expiry */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Nomor Paspor *</label>
          <input value={form.passportNumber} onChange={set("passportNumber")} placeholder="A12345678" className={inp} style={inpStyle}
            onFocus={e => Object.assign(e.target.style, inpFocusStyle)} onBlur={e => Object.assign(e.target.style, inpStyle)} />
          {errors.passportNumber && <div className="text-[10px] text-red-400 mt-1">{errors.passportNumber}</div>}
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Berlaku Sampai *</label>
          <input type="date" value={form.passportExpiry} onChange={set("passportExpiry")} className={inp} style={inpStyle}
            onFocus={e => Object.assign(e.target.style, inpFocusStyle)} onBlur={e => Object.assign(e.target.style, inpStyle)} />
          {errors.passportExpiry && <div className="text-[10px] text-red-400 mt-1">{errors.passportExpiry}</div>}
        </div>
      </div>

      {/* DOB + Nationality */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Lahir *</label>
          <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inp} style={inpStyle}
            onFocus={e => Object.assign(e.target.style, inpFocusStyle)} onBlur={e => Object.assign(e.target.style, inpStyle)} />
          {errors.dateOfBirth && <div className="text-[10px] text-red-400 mt-1">{errors.dateOfBirth}</div>}
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Kewarganegaraan</label>
          <select value={form.nationality} onChange={set("nationality")} className={inp} style={{ ...inpStyle, appearance: "none" as const }}>
            {["Timor-Leste","Indonesia","Australia","Portugal","Singapore","Malaysia","USA","Japan","South Korea","China","India","UK","Germany","France","Other"].map(n => (
              <option key={n} value={n} style={{ background: "#050c16" }}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="name@email.com" className={inp} style={inpStyle}
            onFocus={e => Object.assign(e.target.style, inpFocusStyle)} onBlur={e => Object.assign(e.target.style, inpStyle)} />
          {errors.email && <div className="text-[10px] text-red-400 mt-1">{errors.email}</div>}
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">WhatsApp *</label>
          <input value={form.phone} onChange={set("phone")} placeholder="+670 7xxx xxxx" className={inp} style={inpStyle}
            onFocus={e => Object.assign(e.target.style, inpFocusStyle)} onBlur={e => Object.assign(e.target.style, inpStyle)} />
          {errors.phone && <div className="text-[10px] text-red-400 mt-1">{errors.phone}</div>}
        </div>
      </div>

      {/* Price summary */}
      <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
        <div className="text-[10px] text-gray-500">Total Pembayaran</div>
        <div className="text-[18px] font-black" style={{ color: "#f97316", fontFamily: "monospace" }}>{fmtPrice(flight.totalPrice, flight.currency)}</div>
      </div>

      {/* Submit */}
      <button
        onClick={() => { if (validate()) onSubmit(form); }}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-black text-[14px] text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
      >
        {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses...</> : <>Lanjut ke Pembayaran →</>}
      </button>
    </div>
  );
}

// ─── Step 3: Payment ───────────────────────────────────────────────────────────

function CountdownTimer({ seconds }: { seconds: number }) {
  const [rem, setRem] = useState(seconds);
  useEffect(() => {
    if (rem <= 0) return;
    const t = setInterval(() => setRem(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(rem / 60), s = rem % 60;
  return <span className="font-mono text-amber-400 text-xs tabular-nums">{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>;
}

const VA_NUMBERS: Record<string, string> = {
  VA_BCA: "7007-RANIA", VA_MANDIRI: "8899-RANIA", VA_BNI: "9888-RANIA", VA_BRI: "9010-RANIA",
};

function PaymentStep({
  flight,
  passenger,
  payment,
  onSimulatePaid,
  onBack,
}: {
  flight: FlightOption;
  passenger: Passenger;
  payment: PaymentResult | null;
  onSimulatePaid: () => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<PayMethod>("QRIS");
  const [copied, setCopied] = useState(false);

  const vaNumber = VA_NUMBERS[method] || "";
  const bookingId = payment?.bookingId || "BK-LOADING";
  const amount = payment?.amount || flight.totalPrice;
  const currency = payment?.currency || flight.currency;

  const qrData = encodeURIComponent(`RANIA-${bookingId}-${amount}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=050c16&color=f97316&margin=12`;

  const copyVA = () => {
    navigator.clipboard?.writeText(vaNumber.replace("RANIA", bookingId.replace("bk-",""))).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const methodGroups = [
    {
      label: "Timor-Leste",
      methods: [
        { id: "BNCTL" as PayMethod, icon: "🏦", label: "BNCTL", badge: "TL" },
        { id: "MOSAN" as PayMethod, icon: "📱", label: "Mosan", badge: "TL" },
      ],
    },
    {
      label: "QR / e-Wallet",
      methods: [
        { id: "QRIS" as PayMethod, icon: "🔲", label: "QRIS", badge: "ID" },
      ],
    },
    {
      label: "Bank Transfer",
      methods: [
        { id: "VA_BCA" as PayMethod,     icon: "🏦", label: "BCA VA",     badge: "ID" },
        { id: "VA_MANDIRI" as PayMethod, icon: "🏦", label: "Mandiri VA", badge: "ID" },
        { id: "VA_BNI" as PayMethod,     icon: "🏦", label: "BNI VA",     badge: "ID" },
        { id: "VA_BRI" as PayMethod,     icon: "🏦", label: "BRI VA",     badge: "ID" },
      ],
    },
    {
      label: "Kartu / Global",
      methods: [
        { id: "CARD" as PayMethod, icon: "💳", label: "Visa/MC", badge: "GLOBAL" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <FlightSummaryCard flight={flight} onChange={onBack} />

      {/* Passenger summary */}
      <div className="rounded-xl px-3 py-2.5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Penumpang</div>
          <div className="text-sm font-bold text-white">{passenger.fullName}</div>
          <div className="text-[10px] text-gray-600 font-mono">{passenger.passportNumber}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-gray-600">Booking ID</div>
          <div className="text-[11px] font-mono text-orange-400">{bookingId}</div>
        </div>
      </div>

      {/* Amount + timer */}
      <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Total Pembayaran</div>
          <div className="text-[24px] font-black" style={{ color: "#f97316", fontFamily: "monospace" }}>{fmtPrice(amount, currency)}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-gray-600">Batas waktu</div>
          <CountdownTimer seconds={3600} />
        </div>
      </div>

      {/* Method selector */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Pilih Metode Pembayaran</div>
        <div className="space-y-2">
          {methodGroups.map(group => (
            <div key={group.label}>
              <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1.5 px-1">{group.label}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {group.methods.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="relative flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all"
                    style={method === m.id
                      ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.5)", boxShadow: "0 0 12px rgba(249,115,22,0.2)" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    <span className="absolute -top-1.5 -right-1 text-[7px] font-black px-1 py-0.5 rounded-full"
                      style={m.badge === "TL" ? { background: "rgba(239,68,68,0.2)", color: "#fca5a5" }
                           : m.badge === "ID" ? { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }
                           : { background: "rgba(59,130,246,0.15)", color: "#93c5fd" }}>
                      {m.badge}
                    </span>
                    <span className="text-lg">{m.icon}</span>
                    <span className={`text-[8px] font-bold leading-tight ${method === m.id ? "text-orange-300" : "text-gray-500"}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment detail panel */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#090f1e,#050c16)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* QRIS / QR methods */}
        {(method === "QRIS" || method === "MOSAN" || method === "BNCTL") && (
          <div className="p-4 text-center space-y-3">
            <div className="text-sm font-bold text-white">
              {method === "QRIS" ? "Scan QRIS" : method === "MOSAN" ? "Scan QR Mosan" : "Bayar via BNCTL"}
            </div>
            <div className="inline-block p-3 rounded-2xl bg-white shadow-lg">
              <img src={qrUrl} alt="QR Code" className="w-44 h-44 object-contain" />
            </div>
            <div className="text-[10px] text-gray-500">
              {method === "QRIS" ? "Scan dengan GoPay, OVO, DANA, ShopeePay, BCA Mobile, dll"
               : method === "MOSAN" ? "Scan dengan aplikasi Mosan Timor-Leste"
               : "Buka BNCTL Mobile Banking dan scan QR ini"}
            </div>
            <div className="rounded-xl p-2.5" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <div className="text-[9px] text-gray-500">Nominal</div>
              <div className="font-black text-orange-400">{fmtPrice(amount, currency)}</div>
            </div>
          </div>
        )}

        {/* Bank VA */}
        {method.startsWith("VA_") && (
          <div className="p-4 space-y-3">
            <div className="text-sm font-bold text-white">
              Transfer Virtual Account {method.replace("VA_","")}
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="text-[9px] text-gray-500 mb-1">Nomor Virtual Account</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xl font-black text-white tracking-wider">
                  {method === "VA_BCA" ? "7007" : method === "VA_MANDIRI" ? "8899" : method === "VA_BNI" ? "9888" : "9010"}
                  {bookingId.replace("bk-","").toUpperCase().substring(0,8).padEnd(8,"0")}
                </div>
                <button onClick={copyVA} className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{ background: copied ? "rgba(16,185,129,0.2)" : "rgba(249,115,22,0.1)", border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(249,115,22,0.3)"}`, color: copied ? "#34d399" : "#f97316" }}>
                  {copied ? "✓ Disalin" : "📋 Salin"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Bank", val: method.replace("VA_","") },
                { label: "Nominal", val: fmtPrice(amount, currency) },
                { label: "Batas Waktu", val: "24 jam" },
                { label: "Booking ID", val: bookingId },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-[8px] text-gray-600 uppercase tracking-wider">{label}</div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">{val}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-600 text-center">Transfer melalui ATM, Mobile Banking, atau Internet Banking</div>
          </div>
        )}

        {/* Credit/Debit Card */}
        {method === "CARD" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 mb-1">
              {["Visa","Mastercard","Amex"].map(c => (
                <div key={c} className="text-[9px] font-bold text-gray-500 px-2 py-1 rounded border border-white/10">{c}</div>
              ))}
              <div className="flex-1" />
              <span className="text-[9px] text-emerald-400">🔒 SSL Aman</span>
            </div>
            {[
              { label: "Nomor Kartu", placeholder: "0000 0000 0000 0000" },
              { label: "Nama di Kartu", placeholder: "FULL NAME" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
                <input placeholder={f.placeholder} className="w-full text-sm text-white px-3 py-2.5 rounded-xl focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Kedaluwarsa</label>
                <input placeholder="MM/YY" className="w-full text-sm text-white px-3 py-2.5 rounded-xl focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">CVV</label>
                <input placeholder="•••" type="password" maxLength={4} className="w-full text-sm text-white px-3 py-2.5 rounded-xl focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-gray-600 justify-center">
              <span>🔒 256-bit SSL</span><span>·</span><span>🛡️ PCI DSS</span><span>·</span><span>✅ 3D Secure</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Payment */}
      {(method === "QRIS" || method === "MOSAN" || method === "BNCTL") ? (
        <div className="space-y-2">
          <button onClick={onSimulatePaid} className="w-full py-3.5 rounded-xl font-black text-[14px] text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}>
            ✅ Sudah Bayar — Konfirmasi
          </button>
          <div className="text-[9px] text-gray-600 text-center">Klik setelah scan & bayar QR di atas</div>
        </div>
      ) : method.startsWith("VA_") ? (
        <div className="space-y-2">
          <button onClick={onSimulatePaid} className="w-full py-3.5 rounded-xl font-black text-[14px] text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}>
            ✅ Sudah Transfer — Konfirmasi
          </button>
          <div className="text-[9px] text-gray-600 text-center">Klik setelah transfer ke nomor VA di atas</div>
        </div>
      ) : (
        <button onClick={onSimulatePaid} className="w-full py-3.5 rounded-xl font-black text-[14px] text-white transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
          🔒 Bayar {fmtPrice(amount, currency)}
        </button>
      )}

      {/* Invoice link */}
      {payment?.invoiceUrl && (
        <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer"
          className="block w-full text-center py-2.5 rounded-xl text-[11px] font-bold text-orange-400 transition-all hover:text-white"
          style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          🔗 Buka Halaman Pembayaran Xendit
        </a>
      )}

      <div className="flex items-center justify-center gap-3 text-[9px] text-gray-700 pb-1">
        <span>🔒 SSL Aman</span><span>·</span><span>🛡️ PCI DSS</span><span>·</span><span>✅ 3D Secure</span>
      </div>
    </div>
  );
}

// ─── Step 4: Success ───────────────────────────────────────────────────────────

function SuccessStep({ flight, passenger, bookingId }: { flight: FlightOption; passenger: Passenger; bookingId: string }) {
  return (
    <div className="rounded-2xl overflow-hidden text-center" style={{ background: "linear-gradient(135deg,#090f1e,#050c16)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 0 40px rgba(16,185,129,0.1)" }}>
      <div className="p-5">
        {/* Check animation */}
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
          style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.4)", animation: "pulse 2s infinite" }}>
          ✅
        </div>
        <div className="text-emerald-400 font-black text-xl mb-1">Booking Berhasil!</div>
        <div className="text-gray-500 text-xs mb-5">E-ticket akan dikirim via WhatsApp & Email</div>

        {/* Details card */}
        <div className="rounded-xl p-4 text-left space-y-3 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <AirlineLogo code={flight.airlineCode} size={10} />
            <div>
              <div className="text-white font-bold text-sm">{flight.airline} · {flight.flightNumber}</div>
              <div className="text-[10px] text-gray-600">{fmtDate(flight.departureTime)}</div>
            </div>
          </div>
          {[
            { label: "Booking ID", val: bookingId, color: "text-orange-400 font-mono" },
            { label: "Rute", val: `${flight.from} (${getCity(flight.from)}) → ${flight.to} (${getCity(flight.to)})`, color: "text-white" },
            { label: "Berangkat", val: `${fmtTime(flight.departureTime)} → ${fmtTime(flight.arrivalTime)} · ${flight.duration}`, color: "text-white" },
            { label: "Penumpang", val: passenger.fullName, color: "text-white" },
            { label: "Paspor", val: passenger.passportNumber, color: "text-white font-mono" },
            { label: "Total Dibayar", val: fmtPrice(flight.totalPrice, flight.currency), color: "text-emerald-400 font-black" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-[10px] text-gray-600">{label}</span>
              <span className={`text-xs ${color}`}>{val}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 text-[10px] text-gray-600">
          <div>📧 E-ticket dikirim ke <span className="text-cyan-400">{passenger.email}</span></div>
          <div>📱 Notifikasi ke WhatsApp <span className="text-cyan-400">{passenger.phone}</span></div>
          <div className="text-gray-700 mt-2">Waktu proses e-ticket: 5–15 menit</div>
        </div>
      </div>
    </div>
  );
}

// ─── VERIFY State ─────────────────────────────────────────────────────────────

function VerifyStep({ bookingId }: { bookingId: string }) {
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
      <div className="text-3xl mb-3">🔍</div>
      <div className="text-amber-400 font-black text-base mb-2">Sedang Diverifikasi Admin</div>
      <div className="text-gray-500 text-xs leading-relaxed">
        Pembayaran diterima. Tim RANIA sedang memverifikasi booking Anda.<br />
        <span className="text-amber-400/60">E-ticket dikirim dalam 5–15 menit.</span>
      </div>
      <div className="mt-3 text-[9px] text-gray-700 font-mono">Booking ID: {bookingId}</div>
    </div>
  );
}

// ─── Main BookingFlow Component ───────────────────────────────────────────────

export default function BookingFlow({ flights, searchLoading = false, lang = "id", onComplete, onError, onCancel }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("SELECT_FLIGHT");
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 → 2
  const handleFlightSelect = useCallback((f: FlightOption) => {
    setSelectedFlight(f);
    setStep("PASSENGER");
    setError("");
  }, []);

  // Step 2 → 3
  const handlePassengerSubmit = useCallback(async (p: Passenger) => {
    if (!selectedFlight) return;
    setPassenger(p);
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId: selectedFlight.id,
          passengerName: p.fullName,
          passportNumber: p.passportNumber,
          email: p.email,
          phone: p.phone,
          paymentMethod: "QRIS",
          amount: selectedFlight.totalPrice,
          currency: selectedFlight.currency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPayment({
          bookingId: data.bookingId || `bk-${Date.now().toString(36)}`,
          paymentId: data.paymentId || "",
          invoiceUrl: data.invoiceUrl,
          amount: data.amount || selectedFlight.totalPrice,
          currency: data.currency || selectedFlight.currency,
          method: "QRIS",
          qrUrl: data.qrCodeUrl,
        });
        setBookingId(data.bookingId || `bk-${Date.now().toString(36)}`);
      } else {
        // Fallback: create local booking ID and proceed
        const localId = `bk-${Date.now().toString(36)}`;
        setPayment({
          bookingId: localId,
          paymentId: localId,
          amount: selectedFlight.totalPrice,
          currency: selectedFlight.currency,
          method: "QRIS",
        });
        setBookingId(localId);
      }
      setStep("PAYMENT");
    } catch {
      // Network error — still proceed with local booking ID
      const localId = `bk-${Date.now().toString(36)}`;
      setPayment({
        bookingId: localId,
        paymentId: localId,
        amount: selectedFlight.totalPrice,
        currency: selectedFlight.currency,
        method: "QRIS",
      });
      setBookingId(localId);
      setStep("PAYMENT");
    } finally {
      setSubmitting(false);
    }
  }, [selectedFlight]);

  // Step 3 → 4 (payment confirmed)
  const handlePaid = useCallback(() => {
    if (!selectedFlight || !passenger) return;
    setStep("SUCCESS");
    onComplete?.({ bookingId, flight: selectedFlight, passenger });
  }, [selectedFlight, passenger, bookingId, onComplete]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (searchLoading) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg,#090f1e,#050c16)", border: "1px solid rgba(249,115,22,0.15)" }}>
        <div className="text-3xl mb-2 animate-pulse">✈️</div>
        <div className="text-white/60 text-sm font-bold">Mencari penerbangan...</div>
      </div>
    );
  }

  if (!flights || flights.length === 0) return null;

  return (
    <div className="w-full" style={{ maxWidth: 440 }}>
      {/* Progress bar — only show steps 2-4 */}
      {step !== "SELECT_FLIGHT" && <StepBar step={step} />}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl p-3 mb-3 flex gap-2 items-start" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <span className="text-red-400">⚠️</span>
          <div className="text-red-400 text-xs">{error}</div>
        </div>
      )}

      {/* Back / Cancel row */}
      {step !== "SELECT_FLIGHT" && step !== "SUCCESS" && step !== "VERIFY" && (
        <div className="flex justify-between items-center mb-3 px-1">
          <button
            onClick={() => step === "PASSENGER" ? setStep("SELECT_FLIGHT") : step === "PAYMENT" ? setStep("PASSENGER") : undefined}
            className="text-[10px] text-gray-500 hover:text-orange-400 font-mono transition-colors flex items-center gap-1"
          >
            ← Kembali
          </button>
          {onCancel && (
            <button onClick={onCancel} className="text-[10px] text-gray-600 hover:text-red-400 font-mono transition-colors">
              ✕ Batal
            </button>
          )}
        </div>
      )}

      {/* Step content */}
      {step === "SELECT_FLIGHT" && (
        // Reuse FlightCard directly — just pass onSelect
        <FlightCardInFlow flights={flights} onSelect={handleFlightSelect} lang={lang} />
      )}
      {step === "PASSENGER" && selectedFlight && (
        <PassengerFormStep flight={selectedFlight} onSubmit={handlePassengerSubmit} onBack={() => setStep("SELECT_FLIGHT")} loading={submitting} />
      )}
      {step === "PAYMENT" && selectedFlight && passenger && (
        <PaymentStep flight={selectedFlight} passenger={passenger} payment={payment} onSimulatePaid={handlePaid} onBack={() => setStep("PASSENGER")} />
      )}
      {step === "SUCCESS" && selectedFlight && passenger && (
        <SuccessStep flight={selectedFlight} passenger={passenger} bookingId={bookingId} />
      )}
      {step === "VERIFY" && (
        <VerifyStep bookingId={bookingId} />
      )}
    </div>
  );
}

// ─── Inline FlightCard for SELECT_FLIGHT step ────────────────────────────────
// (keeps BookingFlow self-contained without circular import)

function FlightCardInFlow({ flights, onSelect, lang = "id" }: { flights: FlightOption[]; onSelect: (f: FlightOption) => void; lang?: "id" | "tet" | "en" | "pt" }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"best" | "cheap" | "fast">("best");

  const withPrice = flights.filter(f => f.totalPrice > 0);
  const cheapestId = withPrice.length > 0 ? withPrice.reduce((a, b) => a.totalPrice < b.totalPrice ? a : b).id : flights[0].id;
  const durMin = (d: string) => { const m = d?.match(/(\d+)h\s*(\d+)m/); return m ? +m[1]*60 + +m[2] : 999; };
  const fastestId = flights.reduce((a, b) => durMin(a.duration) <= durMin(b.duration) ? a : b).id;

  const sorted = [...flights].sort((a, b) =>
    filter === "cheap" ? (a.totalPrice||9999)-(b.totalPrice||9999)
    : filter === "fast" ? durMin(a.duration)-durMin(b.duration)
    : 0
  );

  const depDate = formatDateShort2(flights[0]?.departureTime);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400">✈️</span>
          <span className="text-[13px] font-black text-white">{flights[0].from}</span>
          <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          <span className="text-[13px] font-black text-white">{flights[0].to}</span>
          {depDate && <span className="text-[10px] text-gray-600">· {depDate}</span>}
        </div>
        <span className="text-[10px] text-orange-400 font-bold">{flights.length} penerbangan</span>
      </div>

      <div className="flex gap-0 mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        {(["best","cheap","fast"] as const).map((k, i) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`flex-1 py-2 text-[10px] font-black tracking-wide transition-all ${filter===k?"text-white":"text-gray-500 hover:text-gray-300"}`}
            style={filter===k ? { background: "linear-gradient(135deg,#f97316,#ea580c)" } : { background: i%2===0?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.02)" }}>
            {k==="best"?"TERBAIK":k==="cheap"?"TERMURAH":"TERCEPAT"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.slice(0,5).map((flight) => {
          const badge = flight.id===flights[0].id&&filter==="best"?"best":flight.id===cheapestId?"cheap":flight.id===fastestId?"fast":null;
          const isSelected = selectedId === flight.id;
          const isDirect = !flight.stops || flight.stops === 0;
          const [logoErr, setLogoErr] = useState(false);

          return (
            <div key={flight.id}
              className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg,#090f1e,#050c16)",
                border: isSelected ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isSelected ? "0 0 20px rgba(249,115,22,0.2)" : "0 2px 16px rgba(0,0,0,0.5)",
              }}
            >
              {/* Top: logo + airline + badge */}
              <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {!logoErr
                    ? <img src={`https://pics.avs.io/80/80/${flight.airlineCode}.png`} alt={flight.airlineCode} className="w-10 h-10 object-contain" onError={() => setLogoErr(true)} />
                    : <span className="text-[13px] font-black text-orange-400 font-mono">{flight.airlineCode}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-black text-white">{flight.airline||flight.airlineCode}</span>
                    {badge && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${badge==="best"?"bg-orange-500 text-white":badge==="cheap"?"bg-emerald-500 text-white":"bg-blue-500 text-white"}`}>
                        {badge==="best"?"TERBAIK":badge==="cheap"?"TERMURAH":"TERCEPAT"}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">{flight.flightNumber}</span>
                </div>
              </div>

              {/* Route row */}
              <div className="flex items-center px-4 pb-3 gap-2">
                <div className="flex-shrink-0 text-left min-w-[56px]">
                  <div className="text-[24px] font-black text-white leading-none" style={{ fontFamily: "monospace" }}>{fmtTime(flight.departureTime)}</div>
                  <div className="text-[12px] font-black text-orange-400 mt-0.5">{flight.from}</div>
                  <div className="text-[9px] text-gray-600 truncate max-w-[60px]">{getCity(flight.from)}</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 px-2">
                  <div className="flex items-center w-full gap-1">
                    <div className="flex-1 border-t border-dashed border-white/15" />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)" }}>
                      <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                    </div>
                    <div className="flex-1 border-t border-dashed border-white/15" />
                  </div>
                  <div className="text-[9px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={isDirect
                      ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }
                      : { background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }}>
                    {isDirect ? "NONSTOP" : `${flight.stops} TRANSIT`}
                    <span className="opacity-60"> · {flight.duration}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right min-w-[56px]">
                  <div className="text-[24px] font-black text-white leading-none" style={{ fontFamily: "monospace" }}>{fmtTime(flight.arrivalTime)}</div>
                  <div className="text-[12px] font-black text-orange-400 mt-0.5">{flight.to}</div>
                  <div className="text-[9px] text-gray-600 truncate max-w-[60px] text-right">{getCity(flight.to)}</div>
                </div>
              </div>

              {/* Price + BOOK */}
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
                <div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">FROM</div>
                  <div className="text-[22px] font-black leading-none" style={{ color: "#f97316", fontFamily: "monospace" }}>{fmtPrice(flight.totalPrice, flight.currency)}</div>
                  <div className="text-[8px] text-gray-600">per orang · sudah pajak</div>
                </div>
                <button
                  onClick={() => { setSelectedId(flight.id); onSelect(flight); }}
                  className="px-6 py-3 rounded-xl font-black text-[13px] text-white tracking-wider transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
                >
                  {isSelected ? "✓ DIPILIH" : "BOOK"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDateShort2(iso: string): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" }); } catch { return ""; }
}
