// ============================================================================
// RANIA — Flight Card Component v3.0
// Dark theme + orange accent — Ixigo-inspired professional design
// Logo maskapai real dari pics.avs.io
// ============================================================================

import { useState } from "react";

export interface FlightOption {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  taxes: number;
  fees: number;
  totalPrice: number;
  available: boolean;
  source?: string;
  stops?: number;
  stopCity?: string;
  baggage?: string;
  cabinClass?: string;
}

interface FlightCardProps {
  flights: FlightOption[];
  onSelect?: (flight: FlightOption) => void;
  currency?: string;
  loading?: boolean;
  lang?: "id" | "tet" | "en" | "pt";
}

// ─── i18n labels per language ─────────────────────────────────────────────────

type Lang = "id" | "tet" | "en" | "pt";

const LABELS: Record<Lang, Record<string, string>> = {
  tet: {
    best:          "DI'AK LIU",
    cheap:         "BARATU LIU",
    fast:          "LAIS LIU",
    nonstop:       "DIRETA",
    transit:       "TRANZITU",
    from:          "HUSI",
    perPerson:     "kada ema ida",
    taxIncluded:   "taxa inklui ona",
    detail:        "Detallu Voo",
    airline:       "Aerolinia",
    flightNum:     "Numeru Voo",
    departure:     "Husi",
    destination:   "Ba",
    duration:      "Durasaun",
    stops:         "Transit",
    direct:        "Diretu (Nonstop)",
    baggageLabel:  "Bagagem",
    cabinLabel:    "Klase",
    basePrice:     "Folin Baze",
    tax:           "Taxa",
    total:         "Total",
    book:          "RESERVA",
    booked:        "✓ HILI ONA",
    loading:       "Buka voo di'ak liu...",
    loadingSub:    "Konekta ba servidor aviaun mundu",
    empty:         "La iha voo disponivel",
    emptySub:      "Tenta rota ka loron seluk",
    continue:      "✈️ KONTINUA RESERVA",
    filterTitle:   "Haree: ",
    flightCount:   "voo",
    searching:     "Huka...",
    selected:      "Hili",
    chips: ["✈️ Tiket Aviaun", "🏨 Hotel", "🚗 Karreta Aluga", "🗺️ Paket Tour", "🔥 Best Deal"],
  },
  id: {
    best:          "TERBAIK",
    cheap:         "TERMURAH",
    fast:          "TERCEPAT",
    nonstop:       "NONSTOP",
    transit:       "TRANSIT",
    from:          "MULAI",
    perPerson:     "per orang",
    taxIncluded:   "sudah pajak",
    detail:        "Detail Penerbangan",
    airline:       "Maskapai",
    flightNum:     "Nomor Penerbangan",
    departure:     "Dari",
    destination:   "Tujuan",
    duration:      "Durasi",
    stops:         "Transit",
    direct:        "Langsung (Nonstop)",
    baggageLabel:  "Bagasi",
    cabinLabel:    "Kelas",
    basePrice:     "Harga Dasar",
    tax:           "Pajak",
    total:         "Total",
    book:          "BOOK",
    booked:        "✓ DIPILIH",
    loading:       "Mencari penerbangan terbaik...",
    loadingSub:    "Terhubung ke server maskapai dunia",
    empty:         "Tidak ada penerbangan tersedia",
    emptySub:      "Coba rute atau tanggal lain",
    continue:      "✈️ LANJUTKAN BOOKING",
    filterTitle:   "",
    flightCount:   "penerbangan",
    searching:     "Mencari...",
    selected:      "Dipilih",
    chips: ["✈️ Tiket Pesawat", "🏨 Hotel", "🚗 Sewa Mobil", "🗺️ Paket Tour", "🔥 Best Deal"],
  },
  en: {
    best:          "BEST VALUE",
    cheap:         "CHEAPEST",
    fast:          "FASTEST",
    nonstop:       "NONSTOP",
    transit:       "TRANSIT",
    from:          "FROM",
    perPerson:     "per person",
    taxIncluded:   "tax included",
    detail:        "Flight Details",
    airline:       "Airline",
    flightNum:     "Flight Number",
    departure:     "From",
    destination:   "To",
    duration:      "Duration",
    stops:         "Stops",
    direct:        "Direct (Nonstop)",
    baggageLabel:  "Baggage",
    cabinLabel:    "Cabin Class",
    basePrice:     "Base Price",
    tax:           "Tax",
    total:         "Total",
    book:          "BOOK",
    booked:        "✓ SELECTED",
    loading:       "Searching best flights...",
    loadingSub:    "Connecting to world airlines",
    empty:         "No flights available",
    emptySub:      "Try a different route or date",
    continue:      "✈️ CONTINUE BOOKING",
    filterTitle:   "",
    flightCount:   "flights",
    searching:     "Searching...",
    selected:      "Selected",
    chips: ["✈️ Flights", "🏨 Hotels", "🚗 Car Rental", "🗺️ Tour Package", "🔥 Best Deal"],
  },
  pt: {
    best:          "MELHOR",
    cheap:         "MAIS BARATO",
    fast:          "MAIS RÁPIDO",
    nonstop:       "DIRETO",
    transit:       "ESCALA",
    from:          "A PARTIR DE",
    perPerson:     "por pessoa",
    taxIncluded:   "imposto incluído",
    detail:        "Detalhes do Voo",
    airline:       "Companhia",
    flightNum:     "Número do Voo",
    departure:     "De",
    destination:   "Para",
    duration:      "Duração",
    stops:         "Escalas",
    direct:        "Direto (Sem escalas)",
    baggageLabel:  "Bagagem",
    cabinLabel:    "Classe",
    basePrice:     "Preço Base",
    tax:           "Imposto",
    total:         "Total",
    book:          "RESERVAR",
    booked:        "✓ SELECIONADO",
    loading:       "Procurando voos...",
    loadingSub:    "Conectando às companhias aéreas",
    empty:         "Nenhum voo disponível",
    emptySub:      "Tente outra rota ou data",
    continue:      "✈️ CONTINUAR RESERVA",
    filterTitle:   "",
    flightCount:   "voos",
    searching:     "Procurando...",
    selected:      "Selecionado",
    chips: ["✈️ Passagens", "🏨 Hotéis", "🚗 Aluguel", "🗺️ Pacote Tour", "🔥 Best Deal"],
  },
};

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  if (!price || price <= 0) return "—";
  if (currency === "IDR") return `Rp ${price.toLocaleString("id-ID")}`;
  if (currency === "USD") return `$${price.toLocaleString("en-US")}`;
  return `${currency} ${price.toLocaleString()}`;
}

function formatTime(iso: string): string {
  if (!iso) return "--:--";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.substring(11, 16) || "--:--";
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.substring(11, 16) || "--:--";
  }
}

function formatDateShort(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return iso.substring(0, 10);
  }
}

// Airport name lookup — major world airports
const AIRPORT_NAMES: Record<string, string> = {
  DIL: "Dili", DPS: "Bali/Denpasar", CGK: "Jakarta", SUB: "Surabaya",
  UPG: "Makassar", KOE: "Kupang", JOG: "Yogyakarta", SIN: "Singapore",
  KUL: "Kuala Lumpur", BKK: "Bangkok", MNL: "Manila", SGN: "Ho Chi Minh",
  HAN: "Hanoi", NRT: "Tokyo Narita", HND: "Tokyo Haneda", KIX: "Osaka",
  PVG: "Shanghai Pudong", PEK: "Beijing", HKG: "Hong Kong", ICN: "Seoul",
  SYD: "Sydney", MEL: "Melbourne", DRW: "Darwin", BNE: "Brisbane",
  PER: "Perth", DXB: "Dubai", LHR: "London", CDG: "Paris",
  FRA: "Frankfurt", AMS: "Amsterdam", IST: "Istanbul", JFK: "New York",
  LAX: "Los Angeles", LIS: "Lisbon", MAD: "Madrid", FCO: "Rome",
  DOH: "Doha", AUH: "Abu Dhabi", BOM: "Mumbai", DEL: "Delhi",
  SHA: "Shanghai Hongqiao", CTU: "Chengdu", TPE: "Taipei",
  NAN: "Fiji/Nadi", AKL: "Auckland", TYO: "Tokyo",
};

function getAirportName(code: string): string {
  return AIRPORT_NAMES[code] || code;
}

// ─── Airline Logo ─────────────────────────────────────────────────────────────

function AirlineLogo({ code, name }: { code: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = `https://pics.avs.io/80/80/${code}.png`;

  if (imgError || !code) {
    return (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#1a2744,#0d1829)" }}
      >
        <span className="text-[13px] font-black text-orange-400 font-mono">{code || "??"}</span>
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
      <img
        src={logoUrl}
        alt={name}
        className="w-10 h-10 object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ─── Single Flight Card Item ──────────────────────────────────────────────────

type BadgeType = "best" | "cheap" | "fast" | null;

function FlightItem({
  flight,
  badge,
  onSelect,
  isSelected,
  l,
}: {
  flight: FlightOption;
  badge: BadgeType;
  onSelect: (f: FlightOption) => void;
  isSelected: boolean;
  l: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const depTime = formatTime(flight.departureTime);
  const arrTime = formatTime(flight.arrivalTime);
  const depDate = formatDateShort(flight.departureTime);
  const fromName = getAirportName(flight.from);
  const toName = getAirportName(flight.to);
  const isDirect = !flight.stops || flight.stops === 0;

  const badgeConfig = {
    best:  { label: l.best,  style: "bg-orange-500 text-white" },
    cheap: { label: l.cheap, style: "bg-emerald-500 text-white" },
    fast:  { label: l.fast,  style: "bg-blue-500 text-white" },
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
          : "border-white/8 hover:border-orange-400/30 hover:-translate-y-0.5"
      }`}
      style={{
        background: "linear-gradient(135deg, #090f1e, #050c16)",
        border: isSelected ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── TOP ROW: Logo + Airline + Badge ────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <AirlineLogo code={flight.airlineCode} name={flight.airline} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-black text-white tracking-wide leading-tight">
              {flight.airline || flight.airlineCode}
            </span>
            {badge && (
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${badgeConfig[badge].style}`}>
                {badgeConfig[badge].label}
              </span>
            )}
          </div>
          <span className="text-[9px] text-gray-600 font-mono">{flight.flightNumber}</span>
        </div>
      </div>

      {/* ── MAIN ROUTE ROW ───────────────────────────────────────────── */}
      <div className="flex items-center px-4 pb-3 gap-2">
        {/* Departure */}
        <div className="flex-shrink-0 text-left min-w-[56px]">
          <div
            className="text-[24px] font-black text-white leading-none"
            style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
          >
            {depTime}
          </div>
          <div className="text-[12px] font-black text-orange-400 mt-0.5">{flight.from}</div>
          <div className="text-[9px] text-gray-600 leading-tight max-w-[64px] truncate">{fromName}</div>
          {depDate && (
            <div className="text-[8px] text-gray-700 mt-0.5">{depDate}</div>
          )}
        </div>

        {/* Center: dashed line + plane + duration + nonstop badge */}
        <div className="flex-1 flex flex-col items-center gap-1.5 px-2">
          <div className="flex items-center w-full gap-1">
            <div className="flex-1 border-t border-dashed border-white/15" />
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)" }}
            >
              <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <div className="flex-1 border-t border-dashed border-white/15" />
          </div>
          {/* Nonstop / Transit badge */}
          <div
            className="text-[9px] font-bold px-2.5 py-0.5 rounded-full text-center whitespace-nowrap"
            style={
              isDirect
                ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }
                : { background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }
            }
          >
            {isDirect ? l.nonstop : `${flight.stops} ${l.transit}`}
            <span className="opacity-60"> · {flight.duration || "—"}</span>
          </div>
        </div>

        {/* Arrival */}
        <div className="flex-shrink-0 text-right min-w-[56px]">
          <div
            className="text-[24px] font-black text-white leading-none"
            style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
          >
            {arrTime}
          </div>
          <div className="text-[12px] font-black text-orange-400 mt-0.5">{flight.to}</div>
          <div className="text-[9px] text-gray-600 leading-tight max-w-[64px] truncate text-right">{toName}</div>
        </div>
      </div>

      {/* ── PRICE + ACTION ROW ───────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
      >
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">{l.from}</div>
          <div
            className="text-[22px] font-black leading-none"
            style={{ color: "#f97316", fontFamily: "'Orbitron', monospace" }}
          >
            {formatPrice(flight.totalPrice, flight.currency)}
          </div>
          <div className="text-[8px] text-gray-600 mt-0.5">{l.perPerson} · {l.taxIncluded}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand detail */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            title={l.detail}
          >
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* BOOK button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(flight); }}
            className="px-5 py-2.5 rounded-xl font-black text-[13px] text-white tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
            }}
          >
            {isSelected ? l.booked : l.book}
          </button>
        </div>
      </div>

      {/* ── EXPANDED DETAIL ──────────────────────────────────────────── */}
      {expanded && (
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(249,115,22,0.03)" }}
        >
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">
            {l.detail}
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              { label: l.airline,      val: `${flight.airline} (${flight.airlineCode})` },
              { label: l.flightNum,    val: flight.flightNumber },
              { label: l.departure,    val: `${flight.from} — ${fromName}` },
              { label: l.destination,  val: `${flight.to} — ${toName}` },
              { label: l.duration,     val: flight.duration || "—" },
              { label: l.stops,        val: isDirect ? l.direct : `${flight.stops} ${l.transit}${flight.stopCity ? ` via ${flight.stopCity}` : ""}` },
              ...(flight.baggage   ? [{ label: l.baggageLabel, val: `🧳 ${flight.baggage}` }]   : []),
              ...(flight.cabinClass ? [{ label: l.cabinLabel,  val: `💺 ${flight.cabinClass}` }] : []),
              { label: l.basePrice, val: formatPrice(flight.price, flight.currency) },
              { label: l.tax,       val: formatPrice(flight.taxes, flight.currency) },
              { label: l.total,     val: formatPrice(flight.totalPrice, flight.currency) },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="text-[8px] text-gray-600 uppercase tracking-wide">{label}</div>
                <div className="text-[10px] text-white/80 font-semibold">{val}</div>
              </div>
            ))}
          </div>
          {/* Lanjutkan Booking full button */}
          <button
            onClick={() => onSelect(flight)}
            className="mt-3 w-full py-2.5 rounded-xl font-black text-sm text-white tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
            }}
          >
            {l.continue}
          </button>
        </div>
      )}
    </div>
  );
}

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
          : "border-white/8 hover:border-orange-400/30 hover:-translate-y-0.5"
      }`}
      style={{
        background: "linear-gradient(135deg, #090f1e, #050c16)",
        border: isSelected ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── TOP ROW: Logo + Airline + Badge ────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <AirlineLogo code={flight.airlineCode} name={flight.airline} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-black text-white tracking-wide leading-tight">
              {flight.airline || flight.airlineCode}
            </span>
            {badge && (
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${badgeConfig[badge].style}`}>
                {badgeConfig[badge].label}
              </span>
            )}
          </div>
          <span className="text-[9px] text-gray-600 font-mono">{flight.flightNumber}</span>
        </div>
      </div>

      {/* ── MAIN ROUTE ROW ───────────────────────────────────────────── */}
      <div className="flex items-center px-4 pb-3 gap-2">
        {/* Departure */}
        <div className="flex-shrink-0 text-left min-w-[56px]">
          <div
            className="text-[24px] font-black text-white leading-none"
            style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
          >
            {depTime}
          </div>
          <div className="text-[12px] font-black text-orange-400 mt-0.5">{flight.from}</div>
          <div className="text-[9px] text-gray-600 leading-tight max-w-[64px] truncate">{fromName}</div>
          {depDate && (
            <div className="text-[8px] text-gray-700 mt-0.5">{depDate}</div>
          )}
        </div>

        {/* Center: dashed line + plane + duration + nonstop badge */}
        <div className="flex-1 flex flex-col items-center gap-1.5 px-2">
          <div className="flex items-center w-full gap-1">
            <div className="flex-1 border-t border-dashed border-white/15" />
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)" }}
            >
              <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <div className="flex-1 border-t border-dashed border-white/15" />
          </div>
          {/* Nonstop / Transit badge */}
          <div
            className="text-[9px] font-bold px-2.5 py-0.5 rounded-full text-center whitespace-nowrap"
            style={
              isDirect
                ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }
                : { background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }
            }
          >
            {isDirect ? "NONSTOP" : `${flight.stops} TRANSIT`}
            <span className="opacity-60"> · {flight.duration || "—"}</span>
          </div>
        </div>

        {/* Arrival */}
        <div className="flex-shrink-0 text-right min-w-[56px]">
          <div
            className="text-[24px] font-black text-white leading-none"
            style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
          >
            {arrTime}
          </div>
          <div className="text-[12px] font-black text-orange-400 mt-0.5">{flight.to}</div>
          <div className="text-[9px] text-gray-600 leading-tight max-w-[64px] truncate text-right">{toName}</div>
        </div>
      </div>

      {/* ── PRICE + ACTION ROW ───────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
      >
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">FROM</div>
          <div
            className="text-[22px] font-black leading-none"
            style={{ color: "#f97316", fontFamily: "'Orbitron', monospace" }}
          >
            {formatPrice(flight.totalPrice, flight.currency)}
          </div>
          <div className="text-[8px] text-gray-600 mt-0.5">per orang · sudah pajak</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand detail */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            title="Detail"
          >
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* BOOK button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(flight); }}
            className="px-5 py-2.5 rounded-xl font-black text-[13px] text-white tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
            }}
          >
            {isSelected ? "✓ DIPILIH" : "BOOK"}
          </button>
        </div>
      </div>

      {/* ── EXPANDED DETAIL ──────────────────────────────────────────── */}
      {expanded && (
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(249,115,22,0.03)" }}
        >
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">
            Detail Penerbangan
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              { label: "Maskapai", val: `${flight.airline} (${flight.airlineCode})` },
              { label: "Nomor Penerbangan", val: flight.flightNumber },
              { label: "Dari", val: `${flight.from} — ${fromName}` },
              { label: "Tujuan", val: `${flight.to} — ${toName}` },
              { label: "Durasi", val: flight.duration || "—" },
              { label: "Transit", val: isDirect ? "Langsung (Nonstop)" : `${flight.stops} transit${flight.stopCity ? ` via ${flight.stopCity}` : ""}` },
              ...(flight.baggage ? [{ label: "Bagasi", val: `🧳 ${flight.baggage}` }] : []),
              ...(flight.cabinClass ? [{ label: "Kelas", val: `💺 ${flight.cabinClass}` }] : []),
              { label: "Harga Dasar", val: formatPrice(flight.price, flight.currency) },
              { label: "Pajak", val: formatPrice(flight.taxes, flight.currency) },
              { label: "Total", val: formatPrice(flight.totalPrice, flight.currency) },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="text-[8px] text-gray-600 uppercase tracking-wide">{label}</div>
                <div className="text-[10px] text-white/80 font-semibold">{val}</div>
              </div>
            ))}
          </div>
          {/* Lanjutkan Booking full button */}
          <button
            onClick={() => onSelect(flight)}
            className="mt-3 w-full py-2.5 rounded-xl font-black text-sm text-white tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
            }}
          >
            ✈️ LANJUTKAN BOOKING
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Flight Card List (exported default) ─────────────────────────────────────

export default function FlightCard({
  flights,
  onSelect,
  loading = false,
  lang = "id",
}: FlightCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"best" | "cheap" | "fast">("best");

  // Get labels for current language
  const l = LABELS[lang] || LABELS.id;

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "linear-gradient(135deg,#090f1e,#050c16)", border: "1px solid rgba(249,115,22,0.15)" }}
      >
        <div className="text-3xl mb-2" style={{ animation: "pulse 1.5s infinite" }}>✈️</div>
        <div className="text-white/60 text-sm font-bold">{l.loading}</div>
        <div className="text-white/25 text-[10px] font-mono mt-1">{l.loadingSub}</div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────
  if (!flights || flights.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: "linear-gradient(135deg,#090f1e,#050c16)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-2xl mb-2">😔</div>
        <div className="text-white/50 text-sm font-bold">{l.empty}</div>
        <div className="text-white/25 text-[10px] mt-1">{l.emptySub}</div>
      </div>
    );
  }

  // ── Determine badges ─────────────────────────────────────────────
  const withPrice = flights.filter((f) => f.totalPrice > 0);
  const cheapestId = withPrice.length > 0
    ? withPrice.reduce((a, b) => a.totalPrice < b.totalPrice ? a : b).id
    : flights[0].id;

  const durToMin = (d: string) => {
    const m = d?.match(/(\d+)h\s*(\d+)m/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 999;
  };
  const fastestId = flights.reduce((a, b) => durToMin(a.duration) <= durToMin(b.duration) ? a : b).id;
  const bestId = flights[0].id; // first result = best by API rank

  function getBadge(f: FlightOption): BadgeType {
    if (f.id === bestId && filter === "best") return "best";
    if (f.id === cheapestId) return "cheap";
    if (f.id === fastestId) return "fast";
    return null;
  }

  // ── Sort ─────────────────────────────────────────────────────────
  const sorted = [...flights].sort((a, b) => {
    if (filter === "cheap") return (a.totalPrice || 9999) - (b.totalPrice || 9999);
    if (filter === "fast") return durToMin(a.duration) - durToMin(b.duration);
    return 0; // "best" = API order
  });

  const handleSelect = (flight: FlightOption) => {
    setSelectedId(flight.id);
    onSelect?.(flight);
  };

  const depDate = formatDateShort(flights[0].departureTime);

  return (
    <div className="w-full" style={{ maxWidth: 440 }}>

      {/* ── Route header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400 text-[13px]">✈️</span>
          <span className="text-[13px] font-black text-white">{flights[0].from}</span>
          <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="text-[13px] font-black text-white">{flights[0].to}</span>
          {depDate && <span className="text-[10px] text-gray-600">· {depDate}</span>}
        </div>
        <span className="text-[10px] text-orange-400 font-bold">
          {flights.length} {l.flightCount}
        </span>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────── */}
      <div className="flex gap-0 mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        {(["best", "cheap", "fast"] as const).map((key, i) => {
          const tabLabels = { best: l.best, cheap: l.cheap, fast: l.fast };
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 text-[10px] font-black tracking-wide transition-all ${
                filter === key ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              style={
                filter === key
                  ? { background: "linear-gradient(135deg,#f97316,#ea580c)" }
                  : { background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)" }
              }
            >
              {tabLabels[key]}
            </button>
          );
        })}
        <button
          className="px-3 py-2 text-gray-500 hover:text-gray-200 transition-all flex items-center gap-1 text-[10px] font-bold"
          style={{ background: "rgba(255,255,255,0.02)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          FILTER
        </button>
      </div>

      {/* ── Flight cards ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        {sorted.slice(0, 5).map((flight) => (
          <FlightItem
            key={flight.id}
            flight={flight}
            badge={getBadge(flight)}
            onSelect={handleSelect}
            isSelected={selectedId === flight.id}
            l={l}
          />
        ))}
      </div>

      {/* ── Bottom quick chips ────────────────────────────────────── */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {(l.chips as string[]).map((chip, i) => (
          <button
            key={i}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-gray-400 hover:text-white transition-all text-[9px] font-bold whitespace-nowrap flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(249,115,22,0.4)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(249,115,22,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
