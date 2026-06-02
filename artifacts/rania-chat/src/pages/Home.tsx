import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import LiveFlightRadar from "@/components/LiveFlightRadar";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import PassportCamera from "@/components/PassportCamera";
import { jsPDF } from "jspdf";
import { hybridSpeak, isCriticalEvent, speakTier1, getVoiceStats, stopSpeaking, triggerWelcomeVoice } from "@/components/VoiceEngine";
import { WelcomeCard } from "@/components/WelcomeCard";
import { RequestDedup } from "@/components/SessionManager";
import WhatsAppHandoff from "@/components/WhatsAppHandoff";
import BookingProgressBar from "@/components/BookingProgressBar";

const GH = "https://raw.githubusercontent.com/ainarobrats-afk/SANIMAR-TRAVEL/main/Rania%20Ai/public";
const API = "/api";

// ─── Airport autocomplete data — 160+ global airports ──────────────────────────
const AIRPORTS_LIST = [
  // TIMOR-LESTE
  { iata: "DIL", city: "Dili", country: "Timor-Leste", flag: "🇹🇱" },
  { iata: "OEC", city: "Suai", country: "Timor-Leste", flag: "🇹🇱" },
  // INDONESIA
  { iata: "CGK", city: "Jakarta", country: "Indonesia", flag: "🇮🇩" },
  { iata: "DPS", city: "Bali/Denpasar", country: "Indonesia", flag: "🇮🇩" },
  { iata: "SUB", city: "Surabaya", country: "Indonesia", flag: "🇮🇩" },
  { iata: "UPG", city: "Makassar", country: "Indonesia", flag: "🇮🇩" },
  { iata: "KOE", city: "Kupang", country: "Indonesia", flag: "🇮🇩" },
  { iata: "JOG", city: "Yogyakarta", country: "Indonesia", flag: "🇮🇩" },
  { iata: "MES", city: "Medan", country: "Indonesia", flag: "🇮🇩" },
  { iata: "MDC", city: "Manado", country: "Indonesia", flag: "🇮🇩" },
  { iata: "LOP", city: "Lombok", country: "Indonesia", flag: "🇮🇩" },
  { iata: "BDO", city: "Bandung", country: "Indonesia", flag: "🇮🇩" },
  { iata: "LBJ", city: "Labuan Bajo", country: "Indonesia", flag: "🇮🇩" },
  { iata: "AMQ", city: "Ambon", country: "Indonesia", flag: "🇮🇩" },
  { iata: "DJJ", city: "Jayapura", country: "Indonesia", flag: "🇮🇩" },
  { iata: "BPN", city: "Balikpapan", country: "Indonesia", flag: "🇮🇩" },
  { iata: "BTH", city: "Batam", country: "Indonesia", flag: "🇮🇩" },
  { iata: "SRG", city: "Semarang", country: "Indonesia", flag: "🇮🇩" },
  { iata: "SOC", city: "Solo", country: "Indonesia", flag: "🇮🇩" },
  { iata: "PLM", city: "Palembang", country: "Indonesia", flag: "🇮🇩" },
  { iata: "PNK", city: "Pontianak", country: "Indonesia", flag: "🇮🇩" },
  { iata: "MOF", city: "Maumere", country: "Indonesia", flag: "🇮🇩" },
  { iata: "ENE", city: "Ende", country: "Indonesia", flag: "🇮🇩" },
  { iata: "PDG", city: "Padang", country: "Indonesia", flag: "🇮🇩" },
  { iata: "PKU", city: "Pekanbaru", country: "Indonesia", flag: "🇮🇩" },
  { iata: "BTJ", city: "Banda Aceh", country: "Indonesia", flag: "🇮🇩" },
  { iata: "BDJ", city: "Banjarmasin", country: "Indonesia", flag: "🇮🇩" },
  { iata: "MLG", city: "Malang", country: "Indonesia", flag: "🇮🇩" },
  { iata: "WGP", city: "Waingapu", country: "Indonesia", flag: "🇮🇩" },
  // SE ASIA
  { iata: "SIN", city: "Singapore Changi", country: "Singapore", flag: "🇸🇬" },
  { iata: "KUL", city: "Kuala Lumpur", country: "Malaysia", flag: "🇲🇾" },
  { iata: "BKK", city: "Bangkok Suvarnabhumi", country: "Thailand", flag: "🇹🇭" },
  { iata: "DMK", city: "Bangkok Don Mueang", country: "Thailand", flag: "🇹🇭" },
  { iata: "HKT", city: "Phuket", country: "Thailand", flag: "🇹🇭" },
  { iata: "CNX", city: "Chiang Mai", country: "Thailand", flag: "🇹🇭" },
  { iata: "MNL", city: "Manila", country: "Philippines", flag: "🇵🇭" },
  { iata: "CEB", city: "Cebu", country: "Philippines", flag: "🇵🇭" },
  { iata: "SGN", city: "Ho Chi Minh City", country: "Vietnam", flag: "🇻🇳" },
  { iata: "HAN", city: "Hanoi", country: "Vietnam", flag: "🇻🇳" },
  { iata: "DAD", city: "Da Nang", country: "Vietnam", flag: "🇻🇳" },
  { iata: "RGN", city: "Yangon", country: "Myanmar", flag: "🇲🇲" },
  { iata: "PNH", city: "Phnom Penh", country: "Cambodia", flag: "🇰🇭" },
  { iata: "REP", city: "Siem Reap", country: "Cambodia", flag: "🇰🇭" },
  { iata: "VTE", city: "Vientiane", country: "Laos", flag: "🇱🇦" },
  { iata: "BWN", city: "Bandar Seri Begawan", country: "Brunei", flag: "🇧🇳" },
  // AUSTRALIA
  { iata: "SYD", city: "Sydney", country: "Australia", flag: "🇦🇺" },
  { iata: "MEL", city: "Melbourne", country: "Australia", flag: "🇦🇺" },
  { iata: "DRW", city: "Darwin", country: "Australia", flag: "🇦🇺" },
  { iata: "BNE", city: "Brisbane", country: "Australia", flag: "🇦🇺" },
  { iata: "PER", city: "Perth", country: "Australia", flag: "🇦🇺" },
  { iata: "ADL", city: "Adelaide", country: "Australia", flag: "🇦🇺" },
  { iata: "CNS", city: "Cairns", country: "Australia", flag: "🇦🇺" },
  { iata: "OOL", city: "Gold Coast", country: "Australia", flag: "🇦🇺" },
  { iata: "CBR", city: "Canberra", country: "Australia", flag: "🇦🇺" },
  { iata: "HBA", city: "Hobart", country: "Australia", flag: "🇦🇺" },
  // NZ/PACIFIC
  { iata: "AKL", city: "Auckland", country: "New Zealand", flag: "🇳🇿" },
  { iata: "CHC", city: "Christchurch", country: "New Zealand", flag: "🇳🇿" },
  { iata: "WLG", city: "Wellington", country: "New Zealand", flag: "🇳🇿" },
  { iata: "NAN", city: "Nadi/Fiji", country: "Fiji", flag: "🇫🇯" },
  // JAPAN
  { iata: "NRT", city: "Tokyo Narita", country: "Japan", flag: "🇯🇵" },
  { iata: "HND", city: "Tokyo Haneda", country: "Japan", flag: "🇯🇵" },
  { iata: "KIX", city: "Osaka Kansai", country: "Japan", flag: "🇯🇵" },
  { iata: "NGO", city: "Nagoya", country: "Japan", flag: "🇯🇵" },
  { iata: "FUK", city: "Fukuoka", country: "Japan", flag: "🇯🇵" },
  { iata: "OKA", city: "Okinawa", country: "Japan", flag: "🇯🇵" },
  { iata: "CTS", city: "Sapporo", country: "Japan", flag: "🇯🇵" },
  // KOREA
  { iata: "ICN", city: "Seoul Incheon", country: "South Korea", flag: "🇰🇷" },
  { iata: "GMP", city: "Seoul Gimpo", country: "South Korea", flag: "🇰🇷" },
  { iata: "PUS", city: "Busan", country: "South Korea", flag: "🇰🇷" },
  // CHINA/HK/TW
  { iata: "HKG", city: "Hong Kong", country: "Hong Kong", flag: "🇭🇰" },
  { iata: "PVG", city: "Shanghai Pudong", country: "China", flag: "🇨🇳" },
  { iata: "PEK", city: "Beijing", country: "China", flag: "🇨🇳" },
  { iata: "CAN", city: "Guangzhou", country: "China", flag: "🇨🇳" },
  { iata: "SZX", city: "Shenzhen", country: "China", flag: "🇨🇳" },
  { iata: "CTU", city: "Chengdu", country: "China", flag: "🇨🇳" },
  { iata: "TPE", city: "Taipei", country: "Taiwan", flag: "🇹🇼" },
  // MIDDLE EAST
  { iata: "DXB", city: "Dubai", country: "UAE", flag: "🇦🇪" },
  { iata: "AUH", city: "Abu Dhabi", country: "UAE", flag: "🇦🇪" },
  { iata: "DOH", city: "Doha", country: "Qatar", flag: "🇶🇦" },
  { iata: "IST", city: "Istanbul", country: "Turkey", flag: "🇹🇷" },
  { iata: "RUH", city: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦" },
  { iata: "JED", city: "Jeddah", country: "Saudi Arabia", flag: "🇸🇦" },
  { iata: "CAI", city: "Cairo", country: "Egypt", flag: "🇪🇬" },
  { iata: "BAH", city: "Bahrain", country: "Bahrain", flag: "🇧🇭" },
  { iata: "MCT", city: "Muscat", country: "Oman", flag: "🇴🇲" },
  // UK
  { iata: "LHR", city: "London Heathrow", country: "UK", flag: "🇬🇧" },
  { iata: "LGW", city: "London Gatwick", country: "UK", flag: "🇬🇧" },
  { iata: "STN", city: "London Stansted", country: "UK", flag: "🇬🇧" },
  { iata: "LTN", city: "London Luton", country: "UK", flag: "🇬🇧" },
  { iata: "MAN", city: "Manchester", country: "UK", flag: "🇬🇧" },
  { iata: "BHX", city: "Birmingham", country: "UK", flag: "🇬🇧" },
  { iata: "EDI", city: "Edinburgh", country: "UK", flag: "🇬🇧" },
  { iata: "GLA", city: "Glasgow", country: "UK", flag: "🇬🇧" },
  { iata: "BRS", city: "Bristol", country: "UK", flag: "🇬🇧" },
  { iata: "NCL", city: "Newcastle", country: "UK", flag: "🇬🇧" },
  { iata: "LBA", city: "Leeds Bradford", country: "UK", flag: "🇬🇧" },
  // PORTUGAL
  { iata: "LIS", city: "Lisbon", country: "Portugal", flag: "🇵🇹" },
  { iata: "OPO", city: "Porto", country: "Portugal", flag: "🇵🇹" },
  { iata: "FAO", city: "Faro/Algarve", country: "Portugal", flag: "🇵🇹" },
  { iata: "FNC", city: "Funchal/Madeira", country: "Portugal", flag: "🇵🇹" },
  { iata: "PDL", city: "Ponta Delgada/Azores", country: "Portugal", flag: "🇵🇹" },
  // EUROPE
  { iata: "CDG", city: "Paris CDG", country: "France", flag: "🇫🇷" },
  { iata: "ORY", city: "Paris Orly", country: "France", flag: "🇫🇷" },
  { iata: "NCE", city: "Nice", country: "France", flag: "🇫🇷" },
  { iata: "FRA", city: "Frankfurt", country: "Germany", flag: "🇩🇪" },
  { iata: "MUC", city: "Munich", country: "Germany", flag: "🇩🇪" },
  { iata: "BER", city: "Berlin", country: "Germany", flag: "🇩🇪" },
  { iata: "AMS", city: "Amsterdam", country: "Netherlands", flag: "🇳🇱" },
  { iata: "MAD", city: "Madrid", country: "Spain", flag: "🇪🇸" },
  { iata: "BCN", city: "Barcelona", country: "Spain", flag: "🇪🇸" },
  { iata: "FCO", city: "Rome Fiumicino", country: "Italy", flag: "🇮🇹" },
  { iata: "MXP", city: "Milan Malpensa", country: "Italy", flag: "🇮🇹" },
  { iata: "ZRH", city: "Zurich", country: "Switzerland", flag: "🇨🇭" },
  { iata: "VIE", city: "Vienna", country: "Austria", flag: "🇦🇹" },
  { iata: "BRU", city: "Brussels", country: "Belgium", flag: "🇧🇪" },
  { iata: "CPH", city: "Copenhagen", country: "Denmark", flag: "🇩🇰" },
  { iata: "ARN", city: "Stockholm", country: "Sweden", flag: "🇸🇪" },
  { iata: "HEL", city: "Helsinki", country: "Finland", flag: "🇫🇮" },
  { iata: "OSL", city: "Oslo", country: "Norway", flag: "🇳🇴" },
  { iata: "ATH", city: "Athens", country: "Greece", flag: "🇬🇷" },
  { iata: "WAW", city: "Warsaw", country: "Poland", flag: "🇵🇱" },
  { iata: "PRG", city: "Prague", country: "Czech Republic", flag: "🇨🇿" },
  // AFRICA
  { iata: "JNB", city: "Johannesburg", country: "South Africa", flag: "🇿🇦" },
  { iata: "CPT", city: "Cape Town", country: "South Africa", flag: "🇿🇦" },
  { iata: "NBO", city: "Nairobi", country: "Kenya", flag: "🇰🇪" },
  { iata: "ADD", city: "Addis Ababa", country: "Ethiopia", flag: "🇪🇹" },
  { iata: "LOS", city: "Lagos", country: "Nigeria", flag: "🇳🇬" },
  { iata: "CMN", city: "Casablanca", country: "Morocco", flag: "🇲🇦" },
  // INDIA
  { iata: "BOM", city: "Mumbai", country: "India", flag: "🇮🇳" },
  { iata: "DEL", city: "New Delhi", country: "India", flag: "🇮🇳" },
  { iata: "MAA", city: "Chennai", country: "India", flag: "🇮🇳" },
  { iata: "BLR", city: "Bangalore", country: "India", flag: "🇮🇳" },
  { iata: "HYD", city: "Hyderabad", country: "India", flag: "🇮🇳" },
  { iata: "CCU", city: "Kolkata", country: "India", flag: "🇮🇳" },
  // AMERICAS
  { iata: "JFK", city: "New York JFK", country: "USA", flag: "🇺🇸" },
  { iata: "LAX", city: "Los Angeles", country: "USA", flag: "🇺🇸" },
  { iata: "ORD", city: "Chicago O'Hare", country: "USA", flag: "🇺🇸" },
  { iata: "ATL", city: "Atlanta", country: "USA", flag: "🇺🇸" },
  { iata: "SFO", city: "San Francisco", country: "USA", flag: "🇺🇸" },
  { iata: "MIA", city: "Miami", country: "USA", flag: "🇺🇸" },
  { iata: "HNL", city: "Honolulu", country: "USA", flag: "🇺🇸" },
  { iata: "YYZ", city: "Toronto", country: "Canada", flag: "🇨🇦" },
  { iata: "YVR", city: "Vancouver", country: "Canada", flag: "🇨🇦" },
  { iata: "GRU", city: "São Paulo", country: "Brazil", flag: "🇧🇷" },
  { iata: "GIG", city: "Rio de Janeiro", country: "Brazil", flag: "🇧🇷" },
  { iata: "EZE", city: "Buenos Aires", country: "Argentina", flag: "🇦🇷" },
  { iata: "SCL", city: "Santiago", country: "Chile", flag: "🇨🇱" },
  { iata: "MEX", city: "Mexico City", country: "Mexico", flag: "🇲🇽" },
];

// ─── Airport Search Dropdown (Portal-based — no overflow clipping) ────────────
function AirportInput({ value, onChange, placeholder, id }: {
  value: { iata: string; city: string; country: string; flag: string } | null;
  onChange: (v: { iata: string; city: string; country: string; flag: string }) => void;
  placeholder: string;
  id: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 260 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? AIRPORTS_LIST.filter(a =>
        a.iata.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase()) ||
        a.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 80)
    : AIRPORTS_LIST.slice(0, 30);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const portal = document.getElementById(`apt-drop-${id}`);
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          !(portal && portal.contains(e.target as Node))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [id]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: Math.max(r.width, 260) });
    }
    setOpen(true);
    setQuery("");
  };

  const portal = open ? createPortal(
    <div id={`apt-drop-${id}`}
      style={{ position: "absolute", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999 }}
      className="rounded-xl border border-white/15 bg-[#040c20] shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-white/8">
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search city, country or IATA code..."
          className="w-full bg-white/6 border border-white/12 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-400/60 focus:bg-white/8 transition-all"
          style={{ fontSize: 14 }} />
      </div>
      <div className="max-h-72 overflow-y-auto">
        {filtered.map(a => (
          <div key={a.iata}
            onMouseDown={(e) => { e.preventDefault(); onChange(a); setOpen(false); setQuery(""); }}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/6 cursor-pointer transition-colors border-b border-white/3 last:border-0">
            <span className="text-xl flex-shrink-0">{a.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-orange-400 text-sm">{a.iata}</span>
                <span className="text-xs text-white/90 truncate">{a.city}</span>
              </div>
              <div className="text-[9px] text-gray-500 mt-0.5">{a.country}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-5">No airports found for "{query}"</div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <div ref={triggerRef} className="flex items-center gap-2 cursor-pointer" onClick={openDropdown}>
        {value ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{value.flag}</span>
              <span className="font-orbitron text-xl font-black text-white">{value.iata}</span>
            </div>
            <div className="text-[10px] text-gray-400 truncate">{value.city}</div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="text-sm text-gray-500">{placeholder}</div>
            <div className="text-[10px] text-gray-700">Select airport</div>
          </div>
        )}
        <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {portal}
    </div>
  );
}

// ─── Flight Search Widget (Expedia/Booking.com style) ─────────────────────────
function FlightSearchWidget({ lang, onResults }: {
  lang: Language;
  onResults: (flights: FlightCard[], from: string, to: string, date: string) => void;
}) {
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [fromAirport, setFromAirport] = useState<typeof AIRPORTS_LIST[0] | null>(AIRPORTS_LIST[0]); // default DIL
  const [toAirport, setToAirport] = useState<typeof AIRPORTS_LIST[0] | null>(null);
  const [depDate, setDepDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().substring(0, 10);
  });
  const [retDate, setRetDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().substring(0, 10);
  });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showPax, setShowPax] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const paxRef = useRef<HTMLDivElement>(null);
  const cur = useCurrency();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (paxRef.current && !paxRef.current.contains(e.target as Node)) setShowPax(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSwap = () => {
    const tmp = fromAirport; setFromAirport(toAirport); setToAirport(tmp);
  };

  const handleSearch = async () => {
    if (!fromAirport || !toAirport) { setError(lang === "id" ? "Pilih bandara asal & tujuan" : "Select departure & arrival airport"); return; }
    if (fromAirport.iata === toAirport.iata) { setError(lang === "id" ? "Bandara tidak boleh sama" : "Origin and destination cannot be the same"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/rania/flights?from=${fromAirport.iata}&to=${toAirport.iata}&date=${depDate}`);
      const data = await res.json();
      onResults(data.flights || [], fromAirport.iata, toAirport.iata, depDate);
    } catch {
      setError(lang === "id" ? "Gagal mencari penerbangan" : "Search failed. Please try again.");
    } finally { setLoading(false); }
  };

  const l = {
    from: lang === "id" ? "Dari" : lang === "tet" ? "Husi" : lang === "pt" ? "De" : "From",
    to: lang === "id" ? "Ke" : lang === "tet" ? "Ba" : lang === "pt" ? "Para" : "To",
    depart: lang === "id" ? "Berangkat" : lang === "tet" ? "Sai" : lang === "pt" ? "Partida" : "Depart",
    ret: lang === "id" ? "Pulang" : lang === "en" ? "Return" : lang === "pt" ? "Retorno" : "Fila",
    pax: lang === "id" ? "Penumpang & Kelas" : lang === "en" ? "Passengers & Class" : "Pax & Klas",
    search: lang === "id" ? "Cari Tiket" : lang === "tet" ? "Buka Tiket" : lang === "pt" ? "Buscar Voo" : "Search Flights",
    oneway: lang === "id" ? "Sekali Jalan" : lang === "en" ? "One Way" : lang === "pt" ? "Só Ida" : "Dalan Ida",
    roundtrip: lang === "id" ? "Pulang Pergi" : lang === "en" ? "Round Trip" : lang === "pt" ? "Ida e Volta" : "Fila Fali",
  };

  return (
    <div className="relative z-20 w-full max-w-4xl mx-auto px-4">
      <div className="rounded-2xl border border-white/12 overflow-hidden" style={{ background: "rgba(4,9,26,0.96)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.08)" }}>
        {/* Header row */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-white/6">
          <span className="text-lg mr-1">✈️</span>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mr-3">
            {lang === "id" ? "Cari Penerbangan" : lang === "tet" ? "Buka Voo" : lang === "pt" ? "Buscar Voos" : "Flight Search"}
          </span>
          <div className="flex gap-0 bg-white/5 border border-white/8 rounded-full p-0.5 mr-auto">
            {(["oneway", "roundtrip"] as const).map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${tripType === t ? "bg-orange-500 text-white" : "text-gray-500 hover:text-white"}`}>
                {t === "oneway" ? l.oneway : l.roundtrip}
              </button>
            ))}
          </div>
          {/* Cabin class quick pick */}
          <div className="flex gap-0.5">
            {["Economy","Business","First"].map(cls => (
              <button key={cls} onClick={() => setCabinClass(cls)}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${cabinClass === cls ? "border-orange-500 text-orange-400 bg-orange-500/12" : "border-white/8 text-gray-600 hover:text-gray-300"}`}>
                {cls === "Economy" ? (lang === "id" ? "Ekonomi" : "Economy") : cls === "Business" ? "Business" : lang === "id" ? "Pertama" : "First"}
              </button>
            ))}
          </div>
        </div>

        {/* Main search row */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 divide-y md:divide-y-0 md:divide-x divide-white/6">
          {/* FROM */}
          <div className="flex-1 px-5 py-3.5">
            <div className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1.5">{l.from}</div>
            <AirportInput value={fromAirport} onChange={setFromAirport} placeholder={l.from} id="from" />
          </div>

          {/* SWAP button */}
          <div className="flex items-center justify-center px-1 py-3 md:py-0">
            <button onClick={handleSwap}
              className="w-8 h-8 rounded-full border border-white/12 bg-white/5 hover:border-orange-500/40 hover:bg-orange-500/8 transition-all flex items-center justify-center group">
              <svg className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors md:rotate-0 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

          {/* TO */}
          <div className="flex-1 px-5 py-3.5">
            <div className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1.5">{l.to}</div>
            <AirportInput value={toAirport} onChange={setToAirport} placeholder={l.to} id="to" />
          </div>

          {/* DEPART DATE */}
          <div className="flex-1 px-5 py-3.5">
            <div className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1.5">{l.depart}</div>
            <input type="date" value={depDate} min={new Date().toISOString().substring(0,10)}
              onChange={e => setDepDate(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full text-sm font-bold cursor-pointer" />
            <div className="text-[9px] text-gray-600 mt-0.5">
              {new Date(depDate).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>

          {/* RETURN DATE (only for roundtrip) */}
          {tripType === "roundtrip" && (
            <div className="flex-1 px-5 py-3.5">
              <div className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1.5">{l.ret}</div>
              <input type="date" value={retDate} min={depDate}
                onChange={e => setRetDate(e.target.value)}
                className="bg-transparent border-none outline-none text-white w-full text-sm font-bold cursor-pointer" />
              <div className="text-[9px] text-gray-600 mt-0.5">
                {new Date(retDate).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
          )}

          {/* PAX */}
          <div className="flex-1 px-5 py-3.5 relative" ref={paxRef}>
            <div className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1.5">{l.pax}</div>
            <button onClick={() => setShowPax(!showPax)} className="text-left w-full">
              <div className="text-sm font-bold text-white">{adults + children} {lang === "id" ? "Penumpang" : "Pax"}</div>
              <div className="text-[9px] text-gray-500 mt-0.5">{adults} {lang === "id" ? "Dewasa" : "Adult"}{children > 0 ? `, ${children} ${lang === "id" ? "Anak" : "Child"}` : ""} · {cabinClass}</div>
            </button>
            {showPax && (
              <div className="absolute top-full right-0 mt-1 z-[400] bg-[#060d1e] border border-white/12 rounded-xl p-3 shadow-2xl" style={{ minWidth: 220 }}>
                {[
                  { label: lang === "id" ? "Dewasa" : "Adults", sub: "12+", val: adults, min: 1, max: 9, set: setAdults },
                  { label: lang === "id" ? "Anak" : "Children", sub: "2–11", val: children, min: 0, max: 6, set: setChildren },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between mb-3 last:mb-0">
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[9px] text-gray-500">{item.sub} {lang === "id" ? "tahun" : "yrs"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => item.set(Math.max(item.min, item.val - 1))}
                        className="w-7 h-7 rounded-full bg-white/8 text-white font-black hover:bg-white/15 transition-all flex items-center justify-center">−</button>
                      <span className="w-5 text-center font-black text-white text-sm">{item.val}</span>
                      <button onClick={() => item.set(Math.min(item.max, item.val + 1))}
                        className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 font-black hover:bg-orange-500/30 transition-all flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEARCH BUTTON */}
          <div className="px-4 py-3 flex items-center">
            <button onClick={handleSearch} disabled={loading}
              className="px-6 py-3.5 rounded-xl font-black text-white text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
              {loading
                ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
              }
              {l.search}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 pb-3 text-xs text-red-400">{error}</div>
        )}
      </div>
    </div>
  );
}

// ─── Booking Status Tracker ────────────────────────────────────────────────────
function BookingStatusTracker({ bookingId, lang, onClose }: {
  bookingId: string; lang: Language; onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState(bookingId);
  const [inputId, setInputId] = useState(bookingId);
  const [notFound, setNotFound] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API}/rania/status/${id}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const d = await res.json();
      setData(d); setNotFound(false); setLoading(false);
      if (d.currentStep >= 4) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true); setNotFound(false);
    fetchStatus(searchId);
    intervalRef.current = setInterval(() => fetchStatus(searchId), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [searchId, fetchStatus]);

  const handleSearch = () => { setSearchId(inputId.trim().toUpperCase()); setLoading(true); };

  const stepLabels = {
    payment_received: lang === "id" ? "Pembayaran Diterima" : lang === "tet" ? "Pagamentu Simu" : lang === "pt" ? "Pagamento Recebido" : "Payment Received",
    verification: lang === "id" ? "Verifikasi Identitas" : lang === "tet" ? "Verifikasaun Identidade" : lang === "pt" ? "Verificação de Identidade" : "Identity Verification",
    ticket_issued: lang === "id" ? "Tiket Diterbitkan" : lang === "tet" ? "Tiket Emitidu" : lang === "pt" ? "Bilhete Emitido" : "Ticket Issued",
    email_sent: lang === "id" ? "E-ticket Terkirim" : lang === "tet" ? "E-ticket Haruka" : lang === "pt" ? "E-ticket Enviado" : "E-ticket Sent",
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" style={{ background: "rgba(2,5,14,0.97)", backdropFilter: "blur(20px)" }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-orbitron text-xl font-black text-white">
              {lang === "id" ? "Status Booking" : lang === "tet" ? "Estadu Reserva" : lang === "pt" ? "Status da Reserva" : "Booking Status"}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {lang === "id" ? "Update otomatis setiap 5 detik" : "Auto-updates every 5 seconds"} · <span className="text-emerald-400">{lang === "id" ? "Live" : "Live"}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full border border-white/12 bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">✕</button>
        </div>

        {/* Search by booking ID */}
        <div className="flex gap-2 mb-5">
          <input value={inputId} onChange={e => setInputId(e.target.value.toUpperCase())}
            placeholder="SNM-XXXXXX"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-orange-400/60 uppercase tracking-widest" />
          <button onClick={handleSearch}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            {lang === "id" ? "Cek" : "Track"}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
            <div className="text-sm text-gray-500">{lang === "id" ? "Memuat status..." : "Loading status..."}</div>
          </div>
        )}

        {notFound && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">❓</div>
            <div className="text-white font-bold mb-1">{lang === "id" ? "Booking tidak ditemukan" : "Booking not found"}</div>
            <div className="text-gray-500 text-sm">{lang === "id" ? "Periksa kembali nomor booking Anda" : "Please check your booking reference number"}</div>
          </div>
        )}

        {data && !loading && !notFound && (
          <div className="space-y-4">
            {/* Booking summary card */}
            <div className="rounded-2xl border border-orange-500/20 overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,88,12,0.04))" }}>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-xs font-black text-orange-400">{data.bookingId}</div>
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    data.currentStep >= 4 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    data.currentStep >= 2 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  }`}>
                    {data.currentStep >= 4 ? (lang === "id" ? "✓ SELESAI" : "✓ COMPLETED") :
                     data.currentStep >= 2 ? (lang === "id" ? "⚡ DIPROSES" : "⚡ PROCESSING") :
                     (lang === "id" ? "⏳ DITERIMA" : "⏳ RECEIVED")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="font-orbitron text-2xl font-black text-white">{data.booking.from}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5 max-w-[60px] leading-tight">{data.booking.fromName}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                    <div className="text-[9px] text-gray-500">{data.booking.airline}</div>
                    <div className="text-[9px] text-orange-400 font-mono">{data.booking.flightNum}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-orbitron text-2xl font-black text-white">{data.booking.to}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5 max-w-[60px] leading-tight">{data.booking.toName}</div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-white/6 text-[9px] text-gray-500">
                  <span>📅 {data.booking.date}</span>
                  <span>💺 {data.booking.flightClass}</span>
                  <span>👤 {data.booking.passengerName}</span>
                  <span className="text-orange-400 font-bold">${data.booking.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4">
                {lang === "id" ? "Timeline Status" : "Status Timeline"}
              </div>
              <div className="space-y-0">
                {data.steps.map((step: any, i: number) => {
                  const label = stepLabels[step.key as keyof typeof stepLabels] || step.label;
                  const isActive = i === data.currentStep - 1 || (!step.done && i === data.steps.filter((s: any) => s.done).length);
                  return (
                    <div key={step.key} className="flex gap-3">
                      {/* Left: icon + line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 border-2 transition-all duration-500 ${
                          step.done ? "border-emerald-500 bg-emerald-500/20" :
                          isActive ? "border-orange-500 bg-orange-500/15 animate-pulse" :
                          "border-white/12 bg-white/3"
                        }`}>
                          {step.done ? "✓" : step.icon}
                        </div>
                        {i < data.steps.length - 1 && (
                          <div className={`w-0.5 h-8 transition-all duration-500 ${step.done ? "bg-emerald-500/40" : "bg-white/8"}`} />
                        )}
                      </div>
                      {/* Right: label + desc + time */}
                      <div className="flex-1 pb-4 min-w-0">
                        <div className={`text-sm font-bold ${step.done ? "text-white" : isActive ? "text-orange-400" : "text-gray-600"}`}>
                          {label}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${step.done ? "text-gray-400" : "text-gray-600"}`}>
                          {step.done ? step.desc : isActive
                            ? (lang === "id" ? "Sedang diproses..." : "In progress...")
                            : (lang === "id" ? "Menunggu..." : "Pending...")
                          }
                        </div>
                        {step.time && (
                          <div className="text-[9px] text-emerald-400 mt-0.5">
                            {new Date(step.time).toLocaleTimeString(lang === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion notice */}
            {data.currentStep >= 4 && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-sm font-black text-emerald-400">
                  {lang === "id" ? "Booking Selesai! E-ticket terkirim ke email" : lang === "tet" ? "Reserva kompletu! E-ticket haruka ba email" : "Booking Complete! E-ticket sent to email"}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{data.booking.email}</div>
              </div>
            )}

            {data.currentStep < 4 && (
              <div className="text-center text-[10px] text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  {lang === "id" ? "Memperbarui otomatis..." : "Auto-refreshing..."} · {lang === "id" ? "Estimasi selesai:" : "Est. completion:"} {new Date(data.estimatedCompletion).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Currency Detection Hook ──────────────────────────────────────────────────
interface CurrencyInfo {
  code: string; symbol: string; rate: number; name: string;
  country?: string; countryCode?: string; detected?: boolean;
}
function useCurrency(): CurrencyInfo {
  const [cur, setCur] = useState<CurrencyInfo>({ code: "USD", symbol: "$", rate: 1, name: "US Dollar" });
  useEffect(() => {
    fetch(`${API}/rania/currency`)
      .then(r => r.json())
      .then(d => { if (d.code) setCur(d); })
      .catch(() => {});
  }, []);
  return cur;
}
// Helper: format price in local currency
function fmtPrice(usdAmount: number, cur: CurrencyInfo): string {
  const local = Math.round(usdAmount * cur.rate);
  if (cur.code === "IDR") return `${cur.symbol} ${local.toLocaleString("id-ID")}`;
  if (cur.code === "JPY" || cur.code === "KRW") return `${cur.symbol}${local.toLocaleString()}`;
  return `${cur.symbol}${local.toLocaleString("en-US", { minimumFractionDigits: cur.code === "USD" || cur.code === "AUD" || cur.code === "SGD" || cur.code === "CAD" || cur.code === "NZD" || cur.code === "GBP" || cur.code === "EUR" ? 0 : 0 })}`;
}

type Language = "en" | "id" | "tet" | "pt";
type Intent = "flight" | "hotel" | "weather" | "visa" | "tour" | "booking" | "general" | "price" | "email_capture";

interface FlightCard {
  id: number; airline: string; airlineCode: string; flightNum: string;
  from: string; to: string; fromName: string; toName: string;
  depart: string; arrive: string; duration: string; stops: string; tag: string;
  price: number | null; currency: string; logo: string; bookUrl?: string; note?: string;
  priceSource?: string; source?: string;
}

interface WeatherData {
  city: string; temp: number; feelsLike: number; humidity: number;
  wind: number; rainChance: number; emoji: string; description: string;
}

interface VisaData {
  type: string; duration?: string; cost?: string; steps?: string[];
  processing?: string; notes?: string;
}

type BudgetAnalysis = {
  destination: string; budget: number; duration: number;
  flightCost: number; hotelTier: string; hotelPerNight: number; hotelTotal: number;
  foodTotal: number; transportTotal: number; visaFee: number; total: number;
  surplus: number; feasible: boolean; suggestion: string;
};

type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  time: string;
  intent?: Intent;
  flights?: FlightCard[];
  weather?: WeatherData;
  visa?: VisaData;
  searchParams?: { from?: string; to?: string; date?: string };
  bookingForm?: FlightCard;
  bookingSuccess?: { bookingId: string; passengerName: string; from: string; to: string };
  groupBookingForm?: FlightCard;
  groupBookingSuccess?: { bookingId: string; groupSize: number; perPersonAmount: number; currency: string; from: string; to: string; passengers: string[]; leaderWhatsapp: string; splitPayment: boolean; airline: string; date: string; };
  budgetAnalysis?: BudgetAnalysis;
  countryComparison?: string;
  waHandoff?: string;
};

const T: Record<Language, Record<string, string>> = {
  tet: {
    heroBadge: "INTELIJENSIA VIAJEN AI HUSI DILI, TIMOR-LESTE",
    heroHello: "Ola! Ha'u", rania: "RANIA",
    heroDesc: "Ita-nia Asistente Viajen AI — Koalia Tetun, Indonesia, Portugues no Ingles. Ha'u hatene aeroportu hotu, voo hotu, rota hotu iha mundu.",
    airportsStat: "Aeroportu", airlinesStat: "Aerolinia", realtimeStat: "Real-Time", supportStat: "Ajuda AI",
    navSearch: "Buka", navHistory: "Istória", navSaved: "Salva", navProfile: "Perfil",
    chatGreeting: "Bondia! Ha'u mak RANIA, ita-nia asistente viajen AI husi Timor-Leste 🇹🇱\n\nBuat saida mak ha'u bele ajuda ita-boot ohin? Ha'u bele ajuda kona-ba:\n✈️ Buka voo no tiket\n🏨 Hotel no akomodasaun\n🌤️ Klima destinasaun\n📋 Informasaun Visa\n🗺️ Paket Tour Timor-Leste\n💳 Booking no Pagamentu",
    chatPlaceholder: "Husu RANIA... (Tetun, Indonesia, English)",
    bookNow: "Reserva Agora",
    bookViaWhatsapp: "Reserva via WhatsApp",
    flightResults: "Rezultadu Voo",
    contactForPrice: "Kontaktu ba Presu",
    directFlight: "Diretu",
    stops: "Transit",
    allFlights: "Hotu",
    cheapest: "Baratu Liu",
    fastest: "Lais Liu",
    morning: "Dadeer",
    afternoon: "Meudia",
    evening: "Kalan",
    visaSteps: "Pasu-Pasu Visa",
    processing: "Tempu Prosesamentu",
    cost: "Kustu",
  },
  id: {
    heroBadge: "KECERDASAN PERJALANAN AI DARI DILI, TIMOR-LESTE",
    heroHello: "Halo! Saya", rania: "RANIA",
    heroDesc: "Asisten Perjalanan AI — Bicara Tetum, Indonesia, Portugis & Inggris. Saya tahu semua bandara, penerbangan, dan rute di dunia.",
    airportsStat: "Bandara", airlinesStat: "Maskapai", realtimeStat: "Real-Time", supportStat: "AI Support",
    navSearch: "Cari", navHistory: "Riwayat", navSaved: "Simpan", navProfile: "Profil",
    chatGreeting: "Halo! Saya RANIA, asisten perjalanan AI dari Timor-Leste 🇹🇱\n\nAda yang bisa saya bantu hari ini?\n✈️ Cari tiket penerbangan\n🏨 Hotel & akomodasi\n🌤️ Cuaca destinasi\n📋 Informasi Visa\n🗺️ Paket Tour Timor-Leste\n💳 Booking & Pembayaran",
    chatPlaceholder: "Tanya RANIA... (Tetun, Indonesia, English)",
    bookNow: "Pesan Sekarang",
    bookViaWhatsapp: "Pesan via WhatsApp",
    flightResults: "Hasil Pencarian Tiket",
    contactForPrice: "Hubungi untuk Harga",
    directFlight: "Langsung",
    stops: "Transit",
    allFlights: "Semua",
    cheapest: "Termurah",
    fastest: "Tercepat",
    morning: "Pagi",
    afternoon: "Siang",
    evening: "Malam",
    visaSteps: "Langkah-Langkah Visa",
    processing: "Waktu Proses",
    cost: "Biaya",
  },
  en: {
    heroBadge: "AI TRAVEL INTELLIGENCE FROM DILI, TIMOR-LESTE",
    heroHello: "Hello! I'm", rania: "RANIA",
    heroDesc: "Your AI Travel Intelligence — Speaks Tetum, Indonesian, Portuguese & English. I know all airports, all flights, all routes worldwide.",
    airportsStat: "Airports", airlinesStat: "Airlines", realtimeStat: "Real-Time", supportStat: "AI Support",
    navSearch: "Search", navHistory: "History", navSaved: "Saved", navProfile: "Profile",
    chatGreeting: "Hello! I'm RANIA, your AI travel assistant from Timor-Leste 🇹🇱\n\nHow can I help you today?\n✈️ Search flights & tickets\n🏨 Hotels & accommodation\n🌤️ Destination weather\n📋 Visa information\n🗺️ Timor-Leste tour packages\n💳 Booking & payment",
    chatPlaceholder: "Ask RANIA anything... (Tetun, Indonesian, English)",
    bookNow: "Book Now",
    bookViaWhatsapp: "Book via WhatsApp",
    flightResults: "Flight Search Results",
    contactForPrice: "Contact for Price",
    directFlight: "Direct",
    stops: "Stop(s)",
    allFlights: "All",
    cheapest: "Cheapest",
    fastest: "Fastest",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    visaSteps: "Visa Steps",
    processing: "Processing Time",
    cost: "Cost",
  },
  pt: {
    heroBadge: "INTELIGÊNCIA DE VIAGEM IA DE DÍLI, TIMOR-LESTE",
    heroHello: "Olá! Sou", rania: "RANIA",
    heroDesc: "Seu Assistente de Viagem IA — Falo Tétum, Indonésio, Português e Inglês. Conheço todos os aeroportos, voos e rotas do mundo.",
    airportsStat: "Aeroportos", airlinesStat: "Companhias", realtimeStat: "Tempo Real", supportStat: "Suporte IA",
    navSearch: "Buscar", navHistory: "Histórico", navSaved: "Salvos", navProfile: "Perfil",
    chatGreeting: "Olá! Sou RANIA, sua assistente de viagem IA de Timor-Leste 🇹🇱\n\nComo posso ajudar?\n✈️ Buscar voos e bilhetes\n🏨 Hotéis e alojamento\n🌤️ Clima do destino\n📋 Informações de Visto\n🗺️ Pacotes turísticos\n💳 Reservas e pagamento",
    chatPlaceholder: "Pergunte a RANIA... (Tétum, Indonésio, English)",
    bookNow: "Reservar Agora",
    bookViaWhatsapp: "Reservar via WhatsApp",
    flightResults: "Resultados de Voos",
    contactForPrice: "Contactar para Preço",
    directFlight: "Direto",
    stops: "Escala(s)",
    allFlights: "Todos",
    cheapest: "Mais Baratos",
    fastest: "Mais Rápidos",
    morning: "Manhã",
    afternoon: "Tarde",
    evening: "Noite",
    visaSteps: "Passos do Visto",
    processing: "Tempo de Processo",
    cost: "Custo",
  },
};

// ── Extract airports from user message ────────────────────────────────────────
const AIRPORT_CODES = [
  "DIL","DPS","CGK","SIN","KUL","SYD","MEL","PER","DRW","BNE",
  "NRT","ICN","HKG","BKK","MNL","KNO","SUB","JOG","UPG","LHR",
  "CDG","FRA","AMS","DXB","DOH","IST","LAX","JFK","ORD","SFO",
];
const CITY_TO_IATA: Record<string, string> = {
  "dili": "DIL", "bali": "DPS", "denpasar": "DPS", "jakarta": "CGK",
  "singapore": "SIN", "singapura": "SIN", "kuala lumpur": "KUL",
  "kl": "KUL", "sydney": "SYD", "darwin": "DRW", "perth": "PER",
  "melbourne": "MEL", "brisbane": "BNE", "tokyo": "NRT", "seoul": "ICN",
  "hong kong": "HKG", "bangkok": "BKK", "manila": "MNL", "surabaya": "SUB",
  "jogja": "JOG", "yogyakarta": "JOG", "makassar": "UPG", "london": "LHR",
  "paris": "CDG", "frankfurt": "FRA", "amsterdam": "AMS", "dubai": "DXB",
  "kupang": "KOE", "timor": "DIL", "oecusse": "OEC",
};

function extractFlightSearch(msg: string): { from?: string; to?: string; date?: string } {
  const result: { from?: string; to?: string; date?: string } = {};
  const upper = msg.toUpperCase();
  const lower = msg.toLowerCase();

  // Direct IATA codes
  const iataMatches = upper.match(/\b([A-Z]{3})\b/g);
  if (iataMatches) {
    const codes = iataMatches.filter((c) => AIRPORT_CODES.includes(c));
    if (codes.length >= 2) { result.from = codes[0]; result.to = codes[1]; }
    else if (codes.length === 1) result.to = codes[0];
  }

  // City names
  for (const [city, iata] of Object.entries(CITY_TO_IATA)) {
    if (lower.includes(city)) {
      if (!result.from && (lower.indexOf(city) < lower.length / 2)) result.from = iata;
      else if (!result.to) result.to = iata;
    }
  }

  // Date pattern
  const dateMatch = msg.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s]?(\d{4}|\d{2})?/);
  if (dateMatch) {
    const now = new Date();
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) result.date = d.toISOString().substring(0, 10);
  }

  if (!result.from && result.to) result.from = "DIL";
  return result;
}

function extractWeatherCity(msg: string): string {
  const lower = msg.toLowerCase();
  for (const city of Object.keys(CITY_TO_IATA)) {
    if (lower.includes(city)) return city;
  }
  return "dili";
}

function extractVisaCountries(msg: string): { from: string; to: string } {
  const countryMap: Record<string, string> = {
    "timor": "TL", "indonesia": "ID", "australia": "AU", "singapura": "SG",
    "singapore": "SG", "portugal": "PT", "japan": "JP", "japão": "JP",
    "malaysia": "MY", "dubai": "AE", "uae": "AE", "america": "US",
    "usa": "US", "uk": "GB", "england": "GB", "inggris": "GB",
  };
  const lower = msg.toLowerCase();
  const hits: string[] = [];
  for (const [k, v] of Object.entries(countryMap)) {
    if (lower.includes(k)) hits.push(v);
  }
  return { from: hits[0] || "TL", to: hits[1] || "SG" };
}

// ── Promo Carousel ─────────────────────────────────────────────────────────────
const PROMOS = [
  { id: 1, emoji: "✈️", tag: "FLASH DEAL", tagColor: "#f97316", title: { tet: "Dili → Bali husi $120", id: "Dili → Bali mulai $120", en: "Dili → Bali from $120", pt: "Dili → Bali desde $120" }, sub: { tet: "Aero Dili · Diretu · 2h", id: "Aero Dili · Langsung · 2h", en: "Aero Dili · Direct · 2h", pt: "Aero Dili · Direto · 2h" }, cta: "Cari Tiket", bg: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(234,88,12,0.08))", border: "rgba(249,115,22,0.3)", route: "DPS" },
  { id: 2, emoji: "🇸🇬", tag: "HEMAT 20%", tagColor: "#06b6d4", title: { tet: "Dili → Singapore", id: "Dili → Singapore", en: "Dili → Singapore", pt: "Dili → Singapura" }, sub: { tet: "Via Bali · Singapore Airlines", id: "Via Bali · Singapore Airlines", en: "Via Bali · Singapore Airlines", pt: "Via Bali · Singapore Airlines" }, cta: "Cari Tiket", bg: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(8,145,178,0.06))", border: "rgba(6,182,212,0.3)", route: "SIN" },
  { id: 3, emoji: "🇦🇺", tag: "BEST VALUE", tagColor: "#22c55e", title: { tet: "Dili → Darwin husi $95", id: "Dili → Darwin mulai $95", en: "Dili → Darwin from $95", pt: "Dili → Darwin desde $95" }, sub: { tet: "Airnorth · 1h30m", id: "Airnorth · 1 jam 30 menit", en: "Airnorth · 1h 30m", pt: "Airnorth · 1h 30m" }, cta: "Cari Tiket", bg: "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(21,128,61,0.06))", border: "rgba(34,197,94,0.25)", route: "DRW" },
  { id: 4, emoji: "🏝", tag: "BARU", tagColor: "#a855f7", title: { tet: "Labuan Bajo Adventure", id: "Labuan Bajo Adventure", en: "Labuan Bajo Adventure", pt: "Aventura Labuan Bajo" }, sub: { tet: "Komodo · Pink Beach · Diving", id: "Komodo · Pantai Pink · Diving", en: "Komodo · Pink Beach · Diving", pt: "Komodo · Praia Rosa · Mergulho" }, cta: "Explore", bg: "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(139,92,246,0.06))", border: "rgba(168,85,247,0.3)", route: "LBJ" },
  { id: 5, emoji: "🇯🇵", tag: "POPULER", tagColor: "#f43f5e", title: { tet: "Tokyo — Buka Hetan!", id: "Tokyo — Tiket Tersedia!", en: "Tokyo — Tickets Available!", pt: "Tóquio — Ingressos Disponíveis!" }, sub: { tet: "Via Qatar Airways / Singapore Airlines", id: "Via Qatar Airways / Singapore Airlines", en: "Via Qatar Airways / Singapore Airlines", pt: "Via Qatar Airways / Singapore Airlines" }, cta: "Cari Tiket", bg: "linear-gradient(135deg,rgba(244,63,94,0.1),rgba(225,29,72,0.06))", border: "rgba(244,63,94,0.25)", route: "NRT" },
  { id: 6, emoji: "🌋", tag: "NTT SPECIAL", tagColor: "#f59e0b", title: { tet: "Kupang — Ita-Nia Maun!", id: "Kupang — Saudara Kita!", en: "Kupang — Our Brothers!", pt: "Kupang — Nossos Irmãos!" }, sub: { tet: "NTT · Kelimutu · Komodo", id: "NTT · Kelimutu · Komodo", en: "NTT · Kelimutu · Komodo", pt: "NTT · Kelimutu · Komodo" }, cta: "Explore NTT", bg: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.06))", border: "rgba(245,158,11,0.3)", route: "KOE" },
];

function PromoCarousel({ lang, onOpenChat }: { lang: Language; onOpenChat: (msg?: string) => void }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % PROMOS.length), 3500);
    return () => clearInterval(t);
  }, [paused]);

  const p = PROMOS[idx];

  return (
    <div className="relative z-10 px-4 md:px-10 py-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div className="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: p.bg, border: `1px solid ${p.border}` }}
        onClick={() => onOpenChat(`Cari tiket ke ${p.route}`)}>
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Emoji */}
          <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">{p.emoji}</div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-black"
                style={{ background: p.tagColor }}>{p.tag}</span>
            </div>
            <div className="font-black text-white text-base md:text-lg truncate">{p.title[lang]}</div>
            <div className="text-gray-400 text-xs truncate">{p.sub[lang]}</div>
          </div>
          {/* CTA */}
          <div className="flex-shrink-0">
            <div className="px-4 py-2 rounded-xl font-black text-black text-xs transition-all group-hover:scale-105"
              style={{ background: p.tagColor }}>
              {p.cta} →
            </div>
          </div>
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 pb-2">
          {PROMOS.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              className="rounded-full transition-all"
              style={{ width: i === idx ? "20px" : "6px", height: "6px", background: i === idx ? p.tagColor : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Trip Timeline (Auto-generated itinerary after booking) ─────────────────────
const DEST_ITINERARIES: Record<string, { day: string; items: { time: string; title: string; desc: string; emoji: string; type: string }[] }[]> = {
  DPS: [
    { day: "Hari 1 — Ubud", items: [{ time: "09:00", title: "Tegalalang Rice Terrace", desc: "Terraced sawah Bali yang iconic", emoji: "🌾", type: "attraction" }, { time: "12:00", title: "Makan Siang di Ubud", desc: "Bebek betutu atau nasi campur Bali", emoji: "🍽", type: "food" }, { time: "15:00", title: "Ubud Palace & Monkey Forest", desc: "Pura kerajaan + hutan monyet", emoji: "🐒", type: "attraction" }, { time: "19:00", title: "Kecak Dance Uluwatu", desc: "Pertunjukan tari tradisional sunset", emoji: "🎭", type: "culture" }] },
    { day: "Hari 2 — Pantai & Temple", items: [{ time: "07:00", title: "Tanah Lot Sunrise", desc: "Pura di atas batu karang — foto terbaik", emoji: "🛕", type: "attraction" }, { time: "10:00", title: "Seminyak Beach", desc: "Renang & berjemur di pantai premium", emoji: "🏖", type: "activity" }, { time: "13:00", title: "Beach Club Lunch", desc: "Makan siang di Ku De Ta atau Potato Head", emoji: "🍹", type: "food" }, { time: "17:00", title: "Sunset di Tanah Lot", desc: "Momen golden hour terbaik Bali", emoji: "🌅", type: "attraction" }] },
    { day: "Hari 3 — Nusa Penida", items: [{ time: "07:00", title: "Ferry ke Nusa Penida", desc: "30 menit dari Sanur Beach", emoji: "⛵", type: "transport" }, { time: "09:00", title: "Kelingking Beach", desc: "T-Rex dinosaur cliff — pemandangan epic!", emoji: "🦕", type: "attraction" }, { time: "12:00", title: "Angel's Billabong & Broken Beach", desc: "Natural infinity pool + arch cliff", emoji: "💧", type: "attraction" }, { time: "15:30", title: "Kembali ke Bali", desc: "Ferry balik + bebas di Kuta/Seminyak", emoji: "🚢", type: "transport" }] },
  ],
  SIN: [
    { day: "Hari 1 — Iconic SG", items: [{ time: "10:00", title: "Marina Bay Sands", desc: "Skypark observation deck — view 360°", emoji: "🏢", type: "attraction" }, { time: "12:00", title: "Hawker Centre Maxwell", desc: "Hainanese chicken rice legendaris", emoji: "🍗", type: "food" }, { time: "15:00", title: "Gardens by the Bay", desc: "Supertrees & Cloud Forest (indoor A/C!)", emoji: "🌳", type: "attraction" }, { time: "19:30", title: "Spectra Light Show", desc: "Light & water show gratis di Marina Bay", emoji: "✨", type: "culture" }] },
    { day: "Hari 2 — Sentosa & Culture", items: [{ time: "09:00", title: "Universal Studios Singapore", desc: "Theme park seharian — banyak rides!", emoji: "🎢", type: "activity" }, { time: "13:00", title: "Siloso Beach Sentosa", desc: "Pantai buatan + makan seafood", emoji: "🏖", type: "activity" }, { time: "17:00", title: "Cable Car Sentosa → Mount Faber", desc: "Pemandangan kota dari atas gondola", emoji: "🚡", type: "attraction" }] },
    { day: "Hari 3 — Local Vibes", items: [{ time: "08:00", title: "Chinatown Hawker Breakfast", desc: "Kopi khas Singapura + kaya toast", emoji: "☕", type: "food" }, { time: "10:00", title: "Little India Mustafa Centre", desc: "Belanja oleh-oleh 24 jam, harga bagus", emoji: "🛒", type: "activity" }, { time: "14:00", title: "Haji Lane", desc: "Street art, cafe indie, pernak-pernik unik", emoji: "🎨", type: "culture" }, { time: "16:00", title: "Changi Airport Jewel", desc: "RAIN VORTEX — air terjun indoor terbesar dunia!", emoji: "💦", type: "attraction" }] },
  ],
  DRW: [
    { day: "Hari 1 — Darwin City", items: [{ time: "10:00", title: "Darwin Waterfront", desc: "Wave pool, lagoon renang, makan seafood", emoji: "🏊", type: "activity" }, { time: "13:00", title: "Mindil Beach Sunset Market", desc: "Pasar kuliner sunset (Kamis/Minggu)", emoji: "🛍", type: "food" }, { time: "16:00", title: "Darwin Military Museum", desc: "Sejarah WWII di NT, gratis masuk", emoji: "🎖", type: "culture" }] },
    { day: "Hari 2 — Litchfield NP", items: [{ time: "08:00", title: "Florence Falls", desc: "Air terjun + natural pool biru jernih", emoji: "💧", type: "attraction" }, { time: "11:00", title: "Wangi Falls", desc: "Air terjun terbesar Litchfield, renang!", emoji: "🌊", type: "activity" }, { time: "14:00", title: "Magnetic Termite Mounds", desc: "Gundukan rayap 2 meter — fenomena alam", emoji: "🐜", type: "attraction" }] },
    { day: "Hari 3 — Kakadu Day Trip", items: [{ time: "07:00", title: "Drive ke Kakadu NP", desc: "3 jam dari Darwin — full day adventure", emoji: "🚗", type: "transport" }, { time: "10:00", title: "Nourlangie Rock Art", desc: "Lukisan Aboriginal 20.000 tahun!", emoji: "🎨", type: "culture" }, { time: "14:00", title: "Yellow Water Billabong Cruise", desc: "Perahu & lihat buaya, burung kakaktua", emoji: "🐊", type: "activity" }] },
  ],
  NRT: [
    { day: "Hari 1 — Tokyo Arrival", items: [{ time: "10:00", title: "Shibuya Crossing", desc: "Foto di persimpangan paling ramai dunia", emoji: "🚦", type: "attraction" }, { time: "12:00", title: "Tsukiji Outer Market", desc: "Sushi & sashimi paling segar Tokyo!", emoji: "🐟", type: "food" }, { time: "15:00", title: "Harajuku Takeshita Street", desc: "Crepes, fashion unik, Harajuku culture", emoji: "👘", type: "culture" }, { time: "18:00", title: "Shinjuku Evening", desc: "Golden Gai, Omoide Yokocho — yakitori!", emoji: "🍢", type: "food" }] },
    { day: "Hari 2 — Culture & Temples", items: [{ time: "08:00", title: "Senso-ji Temple Asakusa", desc: "Kuil Buddha tertua Tokyo, pagi sepi", emoji: "⛩", type: "culture" }, { time: "11:00", title: "Akihabara Electric Town", desc: "Anime, manga, game, electronics paradise", emoji: "🤖", type: "activity" }, { time: "14:00", title: "Tokyo Skytree", desc: "Menara tertinggi Jepang — view 450m", emoji: "🗼", type: "attraction" }, { time: "18:00", title: "Odaiba Night", desc: "Rainbow Bridge, TeamLab Borderless (AI Art!)", emoji: "🌉", type: "attraction" }] },
    { day: "Hari 3 — Shinjuku & Shibuya", items: [{ time: "09:00", title: "Shinjuku Gyoen Garden", desc: "Taman nasional indah, bawa bekal piknik", emoji: "🌸", type: "attraction" }, { time: "12:00", title: "Ichiran Ramen", desc: "Ramen booth solo legendaris — WAJIB coba!", emoji: "🍜", type: "food" }, { time: "14:00", title: "Takeshita Street Revisit", desc: "Last minute shopping & crepes", emoji: "🛍", type: "activity" }, { time: "17:00", title: "Shibuya Sky Observation", desc: "Rooftop sunset view over Shibuya", emoji: "🏙", type: "attraction" }] },
  ],
};

const DEFAULT_ITINERARY = [
  { day: "Hari 1 — Tiba & Explore", items: [{ time: "12:00", title: "Check-in Hotel", desc: "Istirahat & siapkan diri", emoji: "🏨", type: "logistics" }, { time: "15:00", title: "Explore Kota", desc: "Jalan-jalan sekitar hotel, orienting diri", emoji: "🗺", type: "activity" }, { time: "19:00", title: "Makan Malam Lokal", desc: "Cicipi kuliner khas kota tujuan", emoji: "🍽", type: "food" }] },
  { day: "Hari 2 — Atraksi Utama", items: [{ time: "09:00", title: "Wisata Utama", desc: "Kunjungi atraksi utama kota ini", emoji: "🎯", type: "attraction" }, { time: "13:00", title: "Makan Siang", desc: "Restoran lokal terbaik", emoji: "🍛", type: "food" }, { time: "15:00", title: "Belanja & Souvenir", desc: "Pasar lokal atau mall", emoji: "🛒", type: "activity" }] },
  { day: "Hari 3 — Kepulangan", items: [{ time: "08:00", title: "Sarapan & Check-out", desc: "Sarapan hotel + persiapan pulang", emoji: "🌅", type: "logistics" }, { time: "10:00", title: "Last Minute Exploration", desc: "Kunjungi yang belum sempat kemarin", emoji: "📸", type: "activity" }, { time: "14:00", title: "Menuju Bandara", desc: "Pastikan tiba 2 jam sebelum terbang", emoji: "✈️", type: "transport" }] },
];

const TYPE_COLORS: Record<string, string> = {
  attraction: "#f97316", food: "#22c55e", activity: "#06b6d4", culture: "#a855f7",
  transport: "#6b7280", logistics: "#3b82f6",
};

function TripTimeline({ dest, from, lang }: { dest: string; from: string; lang: Language }) {
  const [open, setOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const itinerary = DEST_ITINERARIES[dest] || DEFAULT_ITINERARY;

  const titles: Record<Language, string> = {
    tet: `✈️ Itinerário RANIA — ${from}→${dest}`,
    id: `✈️ Itinerary RANIA — ${from}→${dest}`,
    en: `✈️ RANIA Itinerary — ${from}→${dest}`,
    pt: `✈️ Itinerário RANIA — ${from}→${dest}`,
  };
  const subTitles: Record<Language, string> = {
    tet: `${itinerary.length} loron viajen · Klik atu haree itinerário`,
    id: `${itinerary.length} hari perjalanan · Klik untuk lihat itinerary lengkap`,
    en: `${itinerary.length}-day trip · Click to view full itinerary`,
    pt: `${itinerary.length} dias de viagem · Clique para ver o itinerário`,
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.2)" }}>🗓</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-purple-300 text-xs">{titles[lang]}</div>
          <div className="text-[10px] text-gray-500">{subTitles[lang]}</div>
        </div>
        <div className="text-purple-400 text-xs font-bold">▼ Buka</div>
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}>
        <div>
          <div className="font-black text-purple-300 text-xs">{titles[lang]}</div>
          <div className="text-[9px] text-gray-500">✨ AI-generated · {lang === "id" ? "Digenerate otomatis oleh RANIA" : lang === "tet" ? "Kria automatiku husi RANIA" : "Auto-generated by RANIA"}</div>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white text-sm transition-colors">✕</button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 p-3 overflow-x-auto">
        {itinerary.map((d, i) => (
          <button key={i} onClick={() => setActiveDay(i)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all"
            style={i === activeDay ? { background: "rgba(168,85,247,0.4)", color: "#e9d5ff", border: "1px solid rgba(168,85,247,0.4)" } : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.06)" }}>
            {d.day.split("—")[0].trim()}
          </button>
        ))}
      </div>

      {/* Day title */}
      <div className="px-4 pb-1 text-xs font-black text-purple-300">{itinerary[activeDay].day}</div>

      {/* Timeline items */}
      <div className="px-4 pb-4 space-y-2">
        {itinerary[activeDay].items.map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            {/* Time + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="text-[9px] font-bold text-gray-500 w-10 text-right">{item.time}</div>
              {i < itinerary[activeDay].items.length - 1 && (
                <div className="w-px h-6 mt-1" style={{ background: "rgba(168,85,247,0.2)" }} />
              )}
            </div>
            {/* Dot */}
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: TYPE_COLORS[item.type] || "#a855f7" }} />
            {/* Content */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{item.emoji}</span>
                <span className="font-bold text-white text-xs">{item.title}</span>
              </div>
              <div className="text-[10px] text-gray-500">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Screenshot prompt */}
      <div className="mx-4 mb-4 px-3 py-2 rounded-xl text-[10px] text-gray-400 flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <span>📸</span>
        <span>{lang === "id" ? "Screenshot itinerary ini untuk simpan rencana perjalanan Anda!" : lang === "tet" ? "Screenshot itinerário ida-ne'e hodi hamoris ita-nia planu viajen!" : lang === "pt" ? "Tire um screenshot deste itinerário para salvar seu plano de viagem!" : "Screenshot this itinerary to save your travel plan!"}</span>
      </div>
    </div>
  );
}

// ── Price Track Button (Ixigo Price Alert) ─────────────────────────────────────
function PriceTrackButton({ flight, lang }: { flight: FlightCard; lang: Language }) {
  const [tracked, setTracked] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rania_user") || "{}").phone || ""; } catch { return ""; }
  });
  const [budget, setBudget] = useState<string>(() => String(Math.max(1, (flight.price || 150) - 10)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const budgetNum = parseFloat(budget);
    if (!phone.trim()) { setError(lang === "id" ? "Masukkan nomor WA" : "Enter WA number"); return; }
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) { setError(lang === "id" ? "Masukkan budget" : "Enter budget"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API}/rania/price-track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route: `${flight.from}-${flight.to}`, price: flight.price, budget: budgetNum, phone: phone.trim(), airline: flight.airline, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.id) setAlertId(data.id);
      // Save phone for future use
      try {
        const u = JSON.parse(localStorage.getItem("rania_user") || "{}");
        u.phone = phone.trim();
        localStorage.setItem("rania_user", JSON.stringify(u));
      } catch { /* ignore */ }
    } catch { /* network error — still mark as tracked */ }
    finally {
      setSaving(false);
      setTracked(true);
      setShowForm(false);
    }
  };

  const cancel = async () => {
    if (alertId) {
      fetch(`${API}/rania/price-track/${alertId}`, { method: "DELETE" }).catch(() => {});
    }
    setTracked(false);
    setAlertId(null);
  };

  const currentPrice = flight.price || 150;

  if (tracked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold text-emerald-400"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <span>🔔</span>
        <span className="flex-1">{lang === "id" ? `Pantau aktif — WA jika < $${budget}` : lang === "en" ? `Alert active — WA if < $${budget}` : `Alerta ativo — WA se < $${budget}`}</span>
        <button onClick={cancel} className="text-gray-600 hover:text-red-400 text-[9px] transition-colors">✕</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setShowForm(v => !v); }}
        className="px-3 py-3 rounded-xl font-black text-[10px] text-purple-300 hover:scale-105 active:scale-95 transition-all duration-150 tracking-wider border border-purple-500/25 hover:border-purple-400/50 hover:bg-purple-500/10"
        style={{ background: "rgba(168,85,247,0.07)" }}
        title={lang === "id" ? "Pantau harga" : lang === "en" ? "Track price" : "Monitorar preço"}>
        🔔
      </button>
      {showForm && (
        <div className="absolute bottom-full mb-2 right-0 z-50 rounded-xl p-3 shadow-2xl w-64"
          style={{ background: "rgba(4,9,26,0.98)", border: "1px solid rgba(168,85,247,0.3)" }}
          onClick={e => e.stopPropagation()}>
          <div className="text-[10px] font-black text-purple-300 mb-0.5">🔔 {lang === "id" ? "Price Alert WA" : lang === "en" ? "WhatsApp Price Alert" : "Alerta de Preço WA"}</div>
          <div className="text-[9px] text-gray-500 mb-2.5">
            {lang === "id"
              ? `RANIA kirim WA jika ${flight.from}→${flight.to} turun di bawah budget-mu`
              : lang === "tet"
              ? `RANIA haruka WA bainhira presu ${flight.from}→${flight.to} tuun`
              : `RANIA sends WA when ${flight.from}→${flight.to} drops below your budget`}
          </div>

          {/* Budget input */}
          <div className="mb-2">
            <div className="text-[9px] text-gray-600 mb-1 font-bold uppercase tracking-wide">
              {lang === "id" ? `Budget maks (skrg $${currentPrice})` : `Max budget (now $${currentPrice})`}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-bold">$</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                min="1"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white placeholder-gray-600 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.3)" }}
                placeholder={String(currentPrice)}
              />
            </div>
            {parseFloat(budget) >= currentPrice && (
              <div className="text-[8px] text-amber-400 mt-1">
                {lang === "id" ? "Tip: set lebih rendah dari harga sekarang untuk notif harga turun" : "Tip: set below current price to get drop alerts"}
              </div>
            )}
          </div>

          {/* Phone input */}
          <div className="mb-2">
            <div className="text-[9px] text-gray-600 mb-1 font-bold uppercase tracking-wide">WhatsApp</div>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+670 7xxx xxxx"
              className="w-full px-2.5 py-1.5 rounded-lg text-[10px] text-white placeholder-gray-600 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {error && <div className="text-[9px] text-red-400 mb-1.5">{error}</div>}

          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving || !phone.trim() || !budget}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-black text-white transition-all hover:scale-105 disabled:opacity-40 flex items-center justify-center gap-1"
              style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              {saving ? "…" : <>{lang === "id" ? "Aktifkan Alert" : lang === "en" ? "Set Alert" : "Ativar Alerta"} 🔔</>}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] text-gray-500 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              ✕
            </button>
          </div>
          <div className="text-[8px] text-gray-700 mt-2 text-center">
            {lang === "id" ? "Dicek setiap 6 jam. Notif via WA jika harga turun." : "Checked every 6h. Notified via WA on price drop."}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ixigo-style Flight Card Component ────────────────────────────────────────
function FlightCards({ flights, lang, date, onBook, onGroupBook }: { flights: FlightCard[]; lang: Language; date?: string; onBook?: (fl: FlightCard) => void; onGroupBook?: (fl: FlightCard) => void }) {
  const t = T[lang];
  const [filter, setFilter] = useState<"best" | "cheap" | "fast">("best");

  const list = flights.filter((f) => f.from !== f.to);
  if (list.length === 0) return null;

  const withPrice = list.filter(f => f.price && f.price > 0);
  const cheapest = withPrice.length > 0 ? withPrice.reduce((a, b) => ((a.price || 9999) < (b.price || 9999) ? a : b)) : list[0];
  const fastest = list.reduce((a, b) => {
    const durToMin = (d: string) => { const m = d.match(/(\d+)h\s*(\d+)m/); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 999; };
    return durToMin(a.duration) <= durToMin(b.duration) ? a : b;
  });
  const bestValue = withPrice.length > 0 ? withPrice[0] : list[0];

  const getBadge = (fl: FlightCard) => {
    if (fl.id === bestValue.id) return { label: lang === "id" ? "TERBAIK" : lang === "en" ? "BEST VALUE" : lang === "pt" ? "MELHOR" : "DI'AK LIU", color: "bg-orange-500 text-white" };
    if (fl.id === cheapest.id) return { label: lang === "id" ? "TERMURAH" : lang === "en" ? "CHEAPEST" : lang === "pt" ? "MAIS BARATO" : "BARATU", color: "bg-emerald-500 text-white" };
    if (fl.id === fastest.id) return { label: lang === "id" ? "TERCEPAT" : lang === "en" ? "FASTEST" : lang === "pt" ? "MAIS RÁPIDO" : "LAIS LIU", color: "bg-blue-500 text-white" };
    return null;
  };

  const sortedList = filter === "cheap"
    ? [...list].sort((a, b) => (a.price || 9999) - (b.price || 9999))
    : filter === "fast"
    ? [...list].sort((a, b) => {
        const durToMin = (d: string) => { const m = d.match(/(\d+)h\s*(\d+)m/); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 999; };
        return durToMin(a.duration) - durToMin(b.duration);
      })
    : list;

  const filterTabs = [
    { key: "best", label: lang === "id" ? "TERBAIK" : lang === "en" ? "BEST VALUE" : "TERBAIK" },
    { key: "cheap", label: lang === "id" ? "TERMURAH" : lang === "en" ? "CHEAPEST" : "BARATU" },
    { key: "fast", label: lang === "id" ? "TERCEPAT" : lang === "en" ? "FASTEST" : "LAIS" },
  ];

  const fromCity = list[0]?.fromName || list[0]?.from;
  const toCity = list[0]?.toName || list[0]?.to;

  const bottomChips = [
    { icon: "✈️", label: lang === "id" ? "Tiket Pesawat" : lang === "en" ? "Flight Tickets" : "Tiket Pesawat" },
    { icon: "🏨", label: lang === "id" ? "Hotel Bintang 4" : lang === "en" ? "Hotel 4-Star" : "Hotel Bintang 4" },
    { icon: "🚗", label: lang === "id" ? "Sewa Mobil" : lang === "en" ? "Car Rental" : "Sewa Mobil" },
    { icon: "🗺️", label: lang === "id" ? "Paket Tour" : lang === "en" ? "Tour Package" : "Paket Tour" },
    { icon: "🔥", label: "Best Deal" },
  ];

  return (
    <div className="mt-3 w-full" style={{ maxWidth: 440 }}>
      {/* Route header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-black text-white">{list[0]?.from}</span>
          <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          <span className="text-[12px] font-black text-white">{list[0]?.to}</span>
          {date && <span className="text-[10px] text-gray-500 ml-1">· {date}</span>}
        </div>
        <span className="text-[10px] text-cyan-400 font-bold">{list.length} {lang === "id" ? "penerbangan" : lang === "en" ? "flights" : "voo"}</span>
      </div>

      {/* Filter tabs matching screenshot */}
      <div className="flex gap-0 mb-3 rounded-xl overflow-hidden border border-white/10">
        {filterTabs.map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-2 text-[10px] font-black tracking-wide transition-all ${filter === tab.key ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" : "bg-white/4 text-gray-500 hover:text-gray-300 hover:bg-white/6"}`}>
            {tab.label}
          </button>
        ))}
        <button className="px-3 py-2 bg-white/4 text-gray-400 hover:text-gray-200 hover:bg-white/8 transition-all flex items-center gap-1 border-l border-white/8 text-[10px] font-bold">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
          {lang === "id" ? "FILTER" : lang === "en" ? "FILTER" : "FILTER"}
        </button>
      </div>

      {/* Flight cards — matching screenshot design */}
      <div className="flex flex-col gap-2.5">
        {sortedList.map((fl) => {
          const badge = getBadge(fl);
          return (
            <div key={fl.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-200 shadow-[0_2px_16px_rgba(0,0,0,0.5)] ${badge?.label.includes("BEST") || badge?.label.includes("TERBAIK") || badge?.label.includes("DI'AK") ? "border-orange-500/40 bg-gradient-to-br from-[#0d1020] to-[#060a14]" : "border-white/8 bg-gradient-to-br from-[#07101e] to-[#030810]"} hover:border-orange-400/35 hover:-translate-y-0.5`}>

              {/* Top row: logo + airline name + badge */}
              <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                {/* Big square airline logo */}
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                  {fl.logo ? (
                    <img src={fl.logo} alt={fl.airlineCode}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = "none";
                        const parent = el.parentElement;
                        if (parent) { parent.style.background = "linear-gradient(135deg,#1e3a5f,#0a1929)"; parent.innerHTML = `<span style="font-size:16px;font-weight:900;color:#60a5fa;font-family:monospace">${fl.airlineCode}</span>`; }
                      }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1e3a5f,#0a1929)" }}>
                      <span className="text-[13px] font-black text-blue-300 font-mono">{fl.airlineCode}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-black text-white tracking-wide">{fl.airline}</span>
                    {badge && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">{fl.flightNum}</span>
                </div>
              </div>

              {/* Main content: depart — plane — arrive */}
              <div className="flex items-center px-4 pb-3 gap-2">
                {/* Departure */}
                <div className="flex-shrink-0 text-left min-w-[52px]">
                  <div className="font-orbitron text-[22px] font-black text-white leading-none">{fl.depart}</div>
                  <div className="text-[11px] font-black text-orange-400 mt-0.5">{fl.from}</div>
                  <div className="text-[9px] text-gray-600 leading-tight max-w-[58px]">{fromCity}</div>
                </div>

                {/* Middle dashed line + plane icon + stops */}
                <div className="flex-1 flex flex-col items-center gap-1.5 px-1">
                  <div className="flex items-center w-full gap-1">
                    <div className="flex-1 border-t border-dashed border-white/20" />
                    <div className="w-7 h-7 rounded-full bg-[#0d1e35] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                    </div>
                    <div className="flex-1 border-t border-dashed border-white/20" />
                  </div>
                  <div className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full text-center whitespace-nowrap ${fl.tag === "direct" ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/12 text-amber-400 border border-amber-500/20"}`}>
                    {fl.stops === "Direct" || fl.stops === "Langsung" || fl.stops === "Diretu" ? "NONSTOP" : fl.stops}
                    {" "}<span className="opacity-60">· {fl.duration}</span>
                  </div>
                </div>

                {/* Arrival */}
                <div className="flex-shrink-0 text-right min-w-[52px]">
                  <div className="font-orbitron text-[22px] font-black text-white leading-none">{fl.arrive}</div>
                  <div className="text-[11px] font-black text-orange-400 mt-0.5">{fl.to}</div>
                  <div className="text-[9px] text-gray-600 leading-tight max-w-[58px] text-right">{toCity}</div>
                </div>
              </div>

              {/* Price + BOOK + GROUP button row */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/6" style={{ background: "rgba(0,0,0,0.25)" }}>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">FROM</div>
                    {fl.priceSource && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                        fl.priceSource.includes("LIVE") ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        fl.priceSource.includes("ESTIMATED") ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                        "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}>
                        {fl.priceSource.includes("LIVE") ? fl.priceSource : fl.priceSource.includes("ESTIMATED") ? "📊 ESTIMATED" : fl.priceSource}
                      </span>
                    )}
                    {fl.priceSource?.includes("ESTIMATED") && (
                      <span className="text-[7px] text-amber-400/60 font-medium">≈ typical range</span>
                    )}
                  </div>
                  {fl.price && fl.price > 0 ? (
                    <div className="font-orbitron text-[22px] font-black text-orange-400 leading-none">
                      ${fl.price}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 font-bold">Hubungi</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* 🔔 Price Tracker */}
                  <PriceTrackButton flight={fl} lang={lang} />
                  {onGroupBook && (
                    <button onClick={(e) => { e.stopPropagation(); onGroupBook(fl); }}
                      className="px-3 py-3 rounded-xl font-black text-[11px] text-cyan-300 hover:scale-105 active:scale-95 transition-all duration-150 tracking-wider border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/10"
                      style={{ background: "rgba(6,182,212,0.08)" }}
                      title={lang === "id" ? "Booking Grup" : lang === "en" ? "Group Booking" : "Reserva Grup"}>
                      👥 {lang === "id" ? "GRUP" : "GROUP"}
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); if (onBook) onBook(fl); }}
                    className="px-6 py-3 rounded-xl font-black text-[13px] text-white hover:scale-105 active:scale-95 transition-all duration-150 tracking-wider"
                    style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.45)" }}>
                    BOOK
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom quick-action chips — matching screenshot */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {bottomChips.map((chip, i) => (
          <button key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-orange-500/6 hover:text-white transition-all text-[9px] font-bold whitespace-nowrap flex-shrink-0">
            <span>{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Weather Card ──────────────────────────────────────────────────────────────
function WeatherCard({ weather }: { weather: WeatherData }) {
  return (
    <div className="mt-3 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-cyan-400/15 rounded-2xl p-4 max-w-xs">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{weather.emoji}</span>
        <div>
          <div className="text-sm font-bold text-white">{weather.city}</div>
          <div className="font-orbitron text-3xl font-black text-cyan-300">{weather.temp}°C</div>
        </div>
      </div>
      <div className="text-xs text-gray-300 mb-3">{weather.description}</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: "💧", label: "Humidity", val: `${weather.humidity}%` },
          { icon: "🌧️", label: "Udan", val: `${weather.rainChance}%` },
          { icon: "💨", label: "Anin", val: `${weather.wind} km/h` },
          { icon: "🌡️", label: "Sente", val: `${weather.feelsLike}°C` },
        ].map((w, i) => (
          <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5">
            <span className="text-sm">{w.icon}</span>
            <div>
              <div className="text-[8px] text-gray-500">{w.label}</div>
              <div className="text-xs font-bold text-white">{w.val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Visa Card ─────────────────────────────────────────────────────────────────
function VisaCard({ visa, lang }: { visa: VisaData; lang: Language }) {
  const t = T[lang];
  return (
    <div className="mt-3 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-400/20 rounded-2xl p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📋</span>
        <div>
          <div className="text-xs text-gray-400">{t.visaSteps}</div>
          <div className="text-sm font-bold text-white">{visa.type}</div>
        </div>
      </div>
      <div className="flex gap-4 mb-3">
        {visa.duration && (
          <div className="text-center"><div className="text-[8px] text-gray-500 uppercase">Durasaun</div><div className="text-xs font-bold text-cyan-300">{visa.duration}</div></div>
        )}
        {visa.cost && (
          <div className="text-center"><div className="text-[8px] text-gray-500 uppercase">{t.cost}</div><div className="text-xs font-bold text-emerald-400">{visa.cost}</div></div>
        )}
        {visa.processing && (
          <div className="text-center"><div className="text-[8px] text-gray-500 uppercase">{t.processing}</div><div className="text-xs font-bold text-amber-300">{visa.processing}</div></div>
        )}
      </div>
      {visa.steps && (
        <ol className="space-y-1.5">
          {visa.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-300">
              <span className="flex-shrink-0 w-5 h-5 rounded-full rania-gradient-btn text-black text-[9px] font-black flex items-center justify-center">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}
      {visa.notes && (
        <div className="mt-3 text-[10px] text-amber-300/80 bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2">
          ⚠️ {visa.notes}
        </div>
      )}
    </div>
  );
}

// ── Booking Form — 3-Step (Passengers → Details+Baggage → Payment) ─────────────
interface PaxForm {
  name: string; dob: string; gender: string;
  passport: string; passportExpiry: string; nationality: string;
  baggage: number; scanned: boolean;
}
function emptyPax(type: "adult" | "child"): PaxForm & { type: "adult" | "child" } {
  return { name: "", dob: "", gender: type === "adult" ? "Male" : "Male", passport: "", passportExpiry: "", nationality: "", baggage: 20, scanned: false, type };
}

const BAGGAGE_OPTS = [
  { kg: 15, label: "15 kg", fee: 0, note: "Included" },
  { kg: 20, label: "20 kg", fee: 15, note: "+$15" },
  { kg: 30, label: "30 kg", fee: 28, note: "+$28" },
];

// ── Nationality list with flag emojis (Timor-Leste first) ─────────────────────
const NATIONALITY_LIST = [
  { flag: "🇹🇱", name: "Timor-Leste" },
  { flag: "🇮🇩", name: "Indonesia" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇲🇾", name: "Malaysia" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇨🇳", name: "China" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇰🇷", name: "South Korea" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇻🇳", name: "Vietnam" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇧🇳", name: "Brunei" },
  { flag: "🇰🇭", name: "Cambodia" },
  { flag: "🇱🇦", name: "Laos" },
  { flag: "🇲🇲", name: "Myanmar" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇦🇪", name: "UAE" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇷🇺", name: "Russia" },
  { flag: "🇵🇰", name: "Pakistan" },
  { flag: "🇧🇩", name: "Bangladesh" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🌍", name: "Other" },
];

// ── Nationality Picker with flag emoji ────────────────────────────────────────
function NationalityPicker({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? NATIONALITY_LIST.filter(n => n.name.toLowerCase().includes(query.toLowerCase()))
    : NATIONALITY_LIST;

  const selected = NATIONALITY_LIST.find(n => n.name === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`${className} flex items-center gap-2 text-left`}>
        <span className="text-base leading-none">{selected?.flag || "🌍"}</span>
        <span className={value ? "text-white" : "text-gray-500"}>{value || "Timor-Leste / Indonesia / ..."}</span>
        <svg className="w-3 h-3 text-gray-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#0d1829] border border-white/15 rounded-xl shadow-xl overflow-hidden" style={{ maxHeight: 220 }}>
          <div className="px-2 py-1.5 border-b border-white/8">
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search nationality..."
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none" />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 172 }}>
            {filtered.map((n) => (
              <button key={n.name} type="button"
                onClick={() => { onChange(n.name); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-cyan-400/10 transition-colors text-left ${value === n.name ? "text-cyan-300 bg-cyan-400/8" : "text-white/80"}`}>
                <span className="text-base leading-none">{n.flag}</span>
                <span>{n.name}</span>
                {n.name === "Timor-Leste" && <span className="ml-auto text-[9px] font-bold text-cyan-400 bg-cyan-400/15 px-1.5 py-0.5 rounded-full">LOCAL</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Group Booking Success Card ────────────────────────────────────────────────
function GroupBookingSuccessCard({ data, lang }: {
  data: NonNullable<ChatMsg["groupBookingSuccess"]>; lang: Language;
}) {
  const [copied, setCopied] = useState(false);
  const [expandPax, setExpandPax] = useState(false);

  const perLine = data.passengers.map((name, i) =>
    `${i + 1}. ${name} — $${data.perPersonAmount} ${data.currency}`
  ).join("\n");

  const waMsg = encodeURIComponent(
    `✈ *BOOKING GRUP SANIMAR TRAVEL*\n` +
    `Booking ID: *${data.bookingId}*\n` +
    `Rute: *${data.from} → ${data.to}*\n` +
    `Tanggal: *${data.date}*\n` +
    `Maskapai: *${data.airline}*\n\n` +
    `👥 *Penumpang (${data.groupSize} orang):*\n${perLine}\n\n` +
    (data.splitPayment
      ? `💳 *Biaya per orang: $${data.perPersonAmount} ${data.currency}*\n` +
        `💬 Kirim pembayaran ke SANIMAR Travel (WhatsApp)\n` +
        `Ref: BAYAR ${data.bookingId}\n\n`
      : `✅ *Sudah lunas oleh leader*\n\n`) +
    `📞 Info: SANIMAR Travel\n` +
    `🤖 Powered by RANIA AI 🇹🇱`
  );

  const plainMsg =
    `✈ BOOKING GRUP SANIMAR TRAVEL\n` +
    `Booking ID: ${data.bookingId}\n` +
    `Rute: ${data.from} → ${data.to} | Tanggal: ${data.date} | ${data.airline}\n\n` +
    `👥 Penumpang (${data.groupSize} orang):\n${perLine}\n\n` +
    (data.splitPayment
      ? `💳 Biaya per orang: $${data.perPersonAmount} ${data.currency}\n` +
        `Bayar ke: SANIMAR Travel (WhatsApp)\n\n`
      : `✅ Lunas oleh leader\n\n`) +
    `Info: SANIMAR Travel | RANIA AI 🇹🇱`;

  const handleCopy = () => {
    navigator.clipboard.writeText(plainMsg).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  return (
    <div className="mt-3 w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#021828] to-[#010d1e]" style={{ maxWidth: 400 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/20" style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.15),rgba(139,92,246,0.08))" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">👥</span>
          <span className="font-orbitron text-sm font-black text-cyan-300">
            {lang === "id" ? "BOOKING GRUP DIKONFIRMASI!" : lang === "en" ? "GROUP BOOKING CONFIRMED!" : "GRUPO BOOKING KONFIRMADU!"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/70">{data.bookingId}</span>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${data.splitPayment ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
            {data.splitPayment ? (lang === "id" ? "SPLIT PAYMENT" : "SPLIT PAYMENT") : (lang === "id" ? "LUNAS" : "PAID IN FULL")}
          </span>
        </div>
      </div>

      {/* Route + stats */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 border-b border-white/6">
        <div className="text-center">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">RUTE</div>
          <div className="text-sm font-black text-white">{data.from} → {data.to}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">GRUP</div>
          <div className="text-sm font-black text-cyan-300">{data.groupSize} Pax</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">{lang === "id" ? "PER ORANG" : "PER PAX"}</div>
          <div className="text-sm font-black text-orange-400">${data.perPersonAmount}</div>
        </div>
      </div>

      {/* Passenger list (collapsible) */}
      <div className="px-4 py-2 border-b border-white/6">
        <button onClick={() => setExpandPax(!expandPax)} className="flex items-center justify-between w-full text-left">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            👥 {data.passengers.length} {lang === "id" ? "Penumpang" : "Passengers"}
          </span>
          <span className="text-gray-500 text-xs">{expandPax ? "▲" : "▼"}</span>
        </button>
        {expandPax && (
          <div className="mt-2 space-y-1.5">
            {data.passengers.map((name, i) => (
              <div key={i} className="flex items-center justify-between bg-white/4 rounded-lg px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 font-mono w-4">{i + 1}</span>
                  <span className="text-xs text-white font-semibold">{name}</span>
                </div>
                <span className="text-[10px] font-black text-orange-400">${data.perPersonAmount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Split payment section */}
      {data.splitPayment && (
        <div className="px-4 py-3 border-b border-white/6" style={{ background: "rgba(245,158,11,0.05)" }}>
          <div className="text-[10px] text-amber-400 font-bold mb-2 uppercase tracking-wider">💳 Split Payment Instructions</div>
          <div className="text-[11px] text-gray-300 leading-relaxed mb-2">
            {lang === "id"
              ? `Masing-masing anggota grup membayar $${data.perPersonAmount} ${data.currency} ke SANIMAR Travel.`
              : `Each group member pays $${data.perPersonAmount} ${data.currency} to SANIMAR Travel.`}
          </div>
          <a href={`https://wa.me/?text=BAYAR+${data.bookingId}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[11px] font-black text-white border border-emerald-500/30 hover:bg-emerald-500/15 transition-all"
            style={{ background: "rgba(16,185,129,0.1)" }}>
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span className="text-emerald-400">Bayar via WhatsApp — Ref: {data.bookingId}</span>
          </a>
        </div>
      )}

      {/* WhatsApp group message */}
      <div className="px-4 py-3">
        <div className="text-[10px] text-cyan-400 font-bold mb-2 uppercase tracking-wider">📲 Kirim ke Grup WhatsApp</div>
        <div className="bg-white/4 border border-white/8 rounded-xl p-3 mb-2 text-[10px] text-gray-400 font-mono leading-relaxed whitespace-pre-line max-h-24 overflow-y-auto">
          {plainMsg}
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className={`flex-1 py-2 rounded-xl text-[11px] font-black transition-all ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/6 text-gray-300 border border-white/10 hover:bg-white/10"}`}>
            {copied ? "✓ Tersalin!" : "📋 Salin Pesan"}
          </button>
          <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl text-[11px] font-black text-white flex items-center justify-center gap-1.5 transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Kirim WA
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Group Booking Form ────────────────────────────────────────────────────────
function GroupBookingForm({ flight, lang, onSuccess, onCancel }: {
  flight: FlightCard; lang: Language;
  onSuccess: (data: NonNullable<ChatMsg["groupBookingSuccess"]>) => void;
  onCancel: () => void;
}) {
  type GStep = 1 | 2 | 3 | 4;
  const [step, setStep] = useState<GStep>(1);
  const [leaderName, setLeaderName] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("");
  const [leaderWhatsapp, setLeaderWhatsapp] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [flightClass, setFlightClass] = useState("Economy");
  const [splitPayment, setSplitPayment] = useState(true);
  const [passengers, setPassengers] = useState<PaxForm[]>([emptyPax("adult"), emptyPax("adult")]);
  const [activePax, setActivePax] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cur = useCurrency();

  // Sync passenger array when groupSize changes
  const syncPax = (size: number) => {
    setPassengers(prev => {
      const next = Array.from({ length: size }, (_, i) => prev[i] || emptyPax("adult"));
      return next;
    });
  };

  const updatePax = (idx: number, field: keyof PaxForm, val: string | number | boolean) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const handlePassportData = (data: { full_name?: string; passport_number?: string; date_of_birth?: string; expiry_date?: string; nationality?: string }) => {
    if (data.full_name) updatePax(activePax, "name", data.full_name);
    if (data.passport_number) updatePax(activePax, "passport", data.passport_number);
    if (data.date_of_birth) updatePax(activePax, "dob", data.date_of_birth);
    if (data.expiry_date) updatePax(activePax, "passportExpiry", data.expiry_date);
    if (data.nationality) updatePax(activePax, "nationality", data.nationality);
    updatePax(activePax, "scanned", true);
    setShowCamera(false);
  };

  // Price calculation
  const basePerPax = flight.price || 150;
  const classMult = flightClass === "Business" ? 2.2 : flightClass === "First" ? 3.5 : 1;
  const baseFare = Math.round(groupSize * basePerPax * classMult);
  const baggageFee = passengers.reduce((sum, p) => sum + (BAGGAGE_OPTS.find(b => b.kg === p.baggage)?.fee || 0), 0);
  const taxes = Math.round(baseFare * 0.12);
  const total = baseFare + baggageFee + taxes;
  const perPerson = Math.ceil(total / groupSize);

  const L = {
    en: { step1: "Group Info", step2: "Passengers", step3: "Payment", step4: "Done", next: "Continue", back: "Back", cancel: "Cancel", req: "Fill all required fields", name: "Full Name", phone: "Phone", wa: "WhatsApp No.", email: "Email", size: "Group Size", class: "Class", pay: "Confirm Booking", split: "Split Payment", full: "Leader Pays All" },
    id: { step1: "Info Grup", step2: "Penumpang", step3: "Pembayaran", step4: "Selesai", next: "Lanjut", back: "Kembali", cancel: "Batal", req: "Isi semua kolom!", name: "Nama Lengkap", phone: "No. Telepon", wa: "No. WhatsApp", email: "Email", size: "Jumlah Anggota", class: "Kelas", pay: "Konfirmasi Booking", split: "Split Payment", full: "Leader Bayar Semua" },
    tet: { step1: "Info Grupu", step2: "Pasajeru", step3: "Pagamentu", step4: "Remata", next: "Kontinua", back: "Fila", cancel: "Kansela", req: "Prenxe hotu!", name: "Naran Kompletu", phone: "Telefone", wa: "WhatsApp", email: "Email", size: "Naran Grupu", class: "Klase", pay: "Konfirma Booking", split: "Split Pagamentu", full: "Leader Selu Hotu" },
    pt: { step1: "Info do Grupo", step2: "Passageiros", step3: "Pagamento", step4: "Concluído", next: "Continuar", back: "Voltar", cancel: "Cancelar", req: "Preencha todos!", name: "Nome Completo", phone: "Telefone", wa: "WhatsApp", email: "Email", size: "Tamanho do Grupo", class: "Classe", pay: "Confirmar Reserva", split: "Pagamento Dividido", full: "Líder Paga Tudo" },
  }[lang];

  const inp = "w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400/50 focus:bg-white/6 transition-all";
  const lbl = "text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1";

  const handleStep1Next = () => {
    if (!leaderName.trim() || !leaderWhatsapp.trim()) { setError(L.req); return; }
    syncPax(groupSize);
    setError(""); setActivePax(0); setStep(2);
  };

  const handleStep2Next = () => {
    const pax = passengers[activePax];
    if (!pax.name.trim() || !pax.passport.trim()) { setError(L.req); return; }
    setError("");
    if (activePax < passengers.length - 1) { setActivePax(activePax + 1); return; }
    setStep(3);
  };

  const handleConfirm = async () => {
    setSubmitting(true); setError("");
    try {
      const groupReqId = RequestDedup.newId();
      const res = await fetch(`${API}/rania/group-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-id": groupReqId },
        body: JSON.stringify({
          requestId: groupReqId,
          passengers: passengers.map(p => ({ name: p.name, dob: p.dob, gender: p.gender, passport: p.passport, passportExpiry: p.passportExpiry, nationality: p.nationality, type: "adult", baggage: p.baggage })),
          adults: groupSize, children: 0,
          leaderName, leaderWhatsapp,
          email: leaderEmail.trim(), phone: leaderPhone.trim(),
          from: flight.from, to: flight.to,
          fromName: flight.fromName || flight.from,
          toName: flight.toName || flight.to,
          date: new Date().toISOString().substring(0, 10),
          airline: flight.airline, flightNum: flight.flightNum,
          flightClass, baseFare, baggageFee, taxes, totalPrice: total,
          currency: flight.currency || "USD",
          splitPayment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess({
          bookingId: data.bookingId,
          groupSize,
          perPersonAmount: data.perPersonAmount || perPerson,
          currency: flight.currency || "USD",
          from: flight.from, to: flight.to,
          passengers: passengers.map(p => p.name),
          leaderWhatsapp,
          splitPayment,
          airline: flight.airline,
          date: new Date().toISOString().substring(0, 10),
        });
      } else { setError("Booking failed. Try again."); }
    } catch { setError("Network error. Try again."); }
    finally { setSubmitting(false); }
  };

  const STEPS: GStep[] = [1, 2, 3];
  const stepLabels = [L.step1, L.step2, L.step3];

  return (
    <>
      {showCamera && <PassportCamera lang={lang} onData={handlePassportData} onClose={() => setShowCamera(false)} />}
      <div className="mt-3 w-full rounded-2xl overflow-hidden border border-cyan-500/25 bg-gradient-to-br from-[#04091a] to-[#02060f]" style={{ maxWidth: 400 }}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/8" style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(139,92,246,0.06))" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <div>
                <div className="font-orbitron text-xs font-black text-cyan-300">
                  {lang === "id" ? "BOOKING GRUP" : lang === "en" ? "GROUP BOOKING" : "GRUPO BOOKING"}
                </div>
                <div className="text-[9px] text-gray-500">{flight.from} → {flight.to} · {flight.airline}</div>
              </div>
            </div>
            <button onClick={onCancel} className="w-7 h-7 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white text-xs">✕</button>
          </div>
        </div>

        {/* Step indicator — progress bar */}
        <div className="px-4 pt-3 pb-1">
          <BookingProgressBar currentStep={step as 1 | 2 | 3 | 4 | 5} lang={lang} variant="compact" />
        </div>
        <div className="flex px-4 pb-2 gap-0">
          {STEPS.map((s, idx) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? "bg-cyan-500 text-white" : "bg-white/8 text-gray-500"}`}>{s}</div>
              <div className="text-[9px] ml-1 font-semibold hidden sm:block" style={{ color: step >= s ? "#06b6d4" : "#4b5563" }}>{stepLabels[idx]}</div>
              {s < 3 && <div className={`flex-1 h-px mx-2 ${step > s ? "bg-cyan-500/50" : "bg-white/8"}`} />}
            </div>
          ))}
        </div>

        {error && <div className="mx-4 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

        {/* ── STEP 1: Leader info + group setup ── */}
        {step === 1 && (
          <div className="px-4 pb-4 space-y-3">
            <div className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider pt-1">👤 {lang === "id" ? "Info Leader Grup" : "Group Leader Info"}</div>
            <div>
              <label className={lbl}>{L.name}</label>
              <input className={inp} value={leaderName} onChange={e => setLeaderName(e.target.value)} placeholder={lang === "id" ? "Nama leader (sesuai paspor)" : "Leader name (as passport)"} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>{L.wa}</label>
                <input className={inp} value={leaderWhatsapp} onChange={e => setLeaderWhatsapp(e.target.value)} placeholder="+670 7514 xxxx" />
              </div>
              <div>
                <label className={lbl}>{L.phone}</label>
                <input className={inp} value={leaderPhone} onChange={e => setLeaderPhone(e.target.value)} placeholder="+670..." />
              </div>
            </div>
            <div>
              <label className={lbl}>{L.email}</label>
              <input className={inp} type="email" value={leaderEmail} onChange={e => setLeaderEmail(e.target.value)} placeholder="email@example.com" />
            </div>

            <div className="border-t border-white/8 pt-3">
              <div className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider mb-3">⚙️ {lang === "id" ? "Pengaturan Grup" : "Group Settings"}</div>
              {/* Group size */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-bold text-white">{L.size}</div>
                  <div className="text-[9px] text-gray-500">{lang === "id" ? "2–20 orang" : "2–20 passengers"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const v = Math.max(2, groupSize - 1); setGroupSize(v); }} className="w-8 h-8 rounded-lg bg-white/8 text-white font-black flex items-center justify-center hover:bg-white/15 text-base">−</button>
                  <span className="w-8 text-center font-black text-white text-lg">{groupSize}</span>
                  <button onClick={() => { const v = Math.min(20, groupSize + 1); setGroupSize(v); }} className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-black flex items-center justify-center hover:bg-cyan-500/30 text-base">+</button>
                </div>
              </div>
              {/* Class */}
              <div>
                <label className={lbl}>{L.class}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Economy", "Business", "First"].map(c => (
                    <button key={c} onClick={() => setFlightClass(c)}
                      className={`py-2 rounded-lg text-[11px] font-black transition-all ${flightClass === c ? "bg-cyan-500 text-white" : "bg-white/6 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                      {c === "Economy" ? (lang === "id" ? "Ekonomi" : "Economy") : c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price preview */}
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 flex items-center justify-between">
              <div className="text-xs text-gray-400">{lang === "id" ? `Estimasi total (${groupSize} orang)` : `Est. total (${groupSize} pax)`}</div>
              <div className="font-orbitron text-base font-black text-orange-400">${total}</div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/4 border border-white/8 hover:bg-white/8 transition-all">{L.cancel}</button>
              <button onClick={handleStep1Next} className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>{L.next} →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Passenger details one by one ── */}
        {step === 2 && (
          <div className="px-4 pb-4 space-y-3">
            {/* Passenger tabs */}
            <div className="flex gap-1 pt-1 overflow-x-auto pb-1 scrollbar-hide">
              {passengers.map((p, i) => (
                <button key={i} onClick={() => setActivePax(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activePax === i ? "bg-cyan-500 text-white" : p.name.trim() ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/6 text-gray-500 hover:text-gray-300"}`}>
                  {p.name.trim() ? `✓ ${p.name.split(" ")[0]}` : `Pax ${i + 1}`}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">
              {lang === "id" ? `Penumpang ${activePax + 1} dari ${passengers.length}` : `Passenger ${activePax + 1} of ${passengers.length}`}
            </div>

            <div>
              <label className={lbl}>{lang === "id" ? "Nama Lengkap (sesuai paspor)" : "Full Name (as passport)"}</label>
              <input className={inp} value={passengers[activePax]?.name || ""} onChange={e => updatePax(activePax, "name", e.target.value)} placeholder="e.g. MARIA DA COSTA" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>{lang === "id" ? "Tgl Lahir" : "Date of Birth"}</label>
                <input type="date" className={inp} value={passengers[activePax]?.dob || ""} onChange={e => updatePax(activePax, "dob", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>{lang === "id" ? "Jenis Kelamin" : "Gender"}</label>
                <select className={inp} value={passengers[activePax]?.gender || "male"} onChange={e => updatePax(activePax, "gender", e.target.value)}>
                  <option value="male">{lang === "id" ? "Pria" : "Male"}</option>
                  <option value="female">{lang === "id" ? "Wanita" : "Female"}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>{lang === "id" ? "No. Paspor" : "Passport No."}</label>
                <input className={inp} value={passengers[activePax]?.passport || ""} onChange={e => updatePax(activePax, "passport", e.target.value)} placeholder="A1234567" />
              </div>
              <div>
                <label className={lbl}>{lang === "id" ? "Berlaku Hingga" : "Expiry"}</label>
                <input type="date" className={inp} value={passengers[activePax]?.passportExpiry || ""} onChange={e => updatePax(activePax, "passportExpiry", e.target.value)} />
              </div>
            </div>
            <NationalityPicker value={passengers[activePax]?.nationality || ""} onChange={v => updatePax(activePax, "nationality", v)} />

            <button onClick={() => setShowCamera(true)}
              className={`w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 border transition-all hover:scale-[1.01] ${passengers[activePax]?.scanned ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/8" : "border-white/12 text-gray-400 bg-white/4 hover:border-cyan-500/30 hover:text-gray-200"}`}>
              <span>📷</span>
              {passengers[activePax]?.scanned ? (lang === "id" ? "Paspor Terpindai ✓" : "Passport Scanned ✓") : (lang === "id" ? "Scan Paspor (OCR)" : "Scan Passport (OCR)")}
            </button>

            <div className="flex gap-2 pt-1">
              <button onClick={() => activePax > 0 ? setActivePax(activePax - 1) : setStep(1)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/4 border border-white/8 hover:bg-white/8 transition-all">{L.back}</button>
              <button onClick={handleStep2Next} className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
                {activePax < passengers.length - 1 ? `${L.next} (${activePax + 2}/${passengers.length}) →` : `${L.next} →`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (
          <div className="px-4 pb-4 space-y-3">
            <div className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider pt-1">💳 {lang === "id" ? "Metode Pembayaran Grup" : "Group Payment Method"}</div>

            {/* Price breakdown */}
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-gray-400">{lang === "id" ? `Base fare (${groupSize} pax)` : `Base fare (${groupSize} pax)`}</span><span className="text-white">${baseFare}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">{lang === "id" ? "Bagasi" : "Baggage"}</span><span className="text-white">${baggageFee}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Taxes & Fees</span><span className="text-white">${taxes}</span></div>
              <div className="flex justify-between text-xs font-black border-t border-white/10 pt-1.5 mt-1"><span className="text-white">Total</span><span className="text-orange-400">${total} {flight.currency || "USD"}</span></div>
              <div className="flex justify-between text-xs mt-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2 py-1">
                <span className="text-cyan-300">{lang === "id" ? "Per orang" : "Per person"}</span>
                <span className="text-cyan-300 font-black">${perPerson}</span>
              </div>
            </div>

            {/* Split vs Full toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSplitPayment(true)}
                className={`p-3 rounded-xl border text-left transition-all ${splitPayment ? "border-amber-500/50 bg-amber-500/10" : "border-white/10 bg-white/4 hover:border-white/20"}`}>
                <div className="text-base mb-1">💳</div>
                <div className={`text-[10px] font-black ${splitPayment ? "text-amber-400" : "text-gray-300"}`}>{L.split}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{lang === "id" ? "Tiap anggota bayar bagiannya" : "Each member pays their share"}</div>
              </button>
              <button onClick={() => setSplitPayment(false)}
                className={`p-3 rounded-xl border text-left transition-all ${!splitPayment ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/4 hover:border-white/20"}`}>
                <div className="text-base mb-1">👤</div>
                <div className={`text-[10px] font-black ${!splitPayment ? "text-emerald-400" : "text-gray-300"}`}>{L.full}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{lang === "id" ? "Leader bayar total $" + total : "Leader pays total $" + total}</div>
              </button>
            </div>

            {/* Split instructions */}
            {splitPayment && (
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                <div className="text-[10px] text-amber-400 font-bold mb-2">📲 Split Payment Flow:</div>
                <div className="space-y-1">
                  {passengers.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-300">{p.name.trim() || `Pax ${i + 1}`}</span>
                      <span className="text-amber-400 font-bold">${perPerson}</span>
                    </div>
                  ))}
                  {passengers.length > 3 && <div className="text-[10px] text-gray-500">+ {passengers.length - 3} {lang === "id" ? "lainnya" : "more"}...</div>}
                </div>
              </div>
            )}

            {/* WhatsApp payment direct link for leader */}
            <div className="bg-white/4 border border-white/8 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 mb-2">{lang === "id" ? "Konfirmasi booking ke SANIMAR Travel:" : "Confirm booking with SANIMAR Travel:"}</div>
              <a href={`https://wa.me/?text=${encodeURIComponent(`BOOKING GRUP ${groupSize} orang, ${flight.from}→${flight.to}, ${flight.airline}, leader: ${leaderName}, WA: ${leaderWhatsapp}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[11px] font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp SANIMAR Travel
              </a>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/4 border border-white/8 hover:bg-white/8 transition-all">{L.back}</button>
              <button onClick={handleConfirm} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: submitting ? "#333" : "linear-gradient(135deg,#06b6d4,#7c3aed)", boxShadow: "0 4px 20px rgba(6,182,212,0.35)" }}>
                {submitting ? "⏳..." : `✓ ${L.pay}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function BookingFormInChat({ flight, lang, onSuccess, onCancel }: {
  flight: FlightCard; lang: Language;
  onSuccess: (bookingId: string, name: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [flightClass, setFlightClass] = useState("Economy");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [passengers, setPassengers] = useState<Array<PaxForm & { type: "adult" | "child" }>>([emptyPax("adult")]);
  const [activePax, setActivePax] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraForPax, setCameraForPax] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payMethod, setPayMethod] = useState<"card" | "ewallet_id" | "va_bank" | "tl_pay" | "qris" | "intl">("card");
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardType, setCardType] = useState<"visa" | "mc" | "jcb" | "amex">("visa");
  const [bankVABank, setBankVABank] = useState("BCA");
  const [ewalletApp, setEwalletApp] = useState("GoPay");
  const [tlPayApp, setTlPayApp] = useState("BNU");
  const [intlMethod, setIntlMethod] = useState<"paypal" | "gpay">("paypal");
  const [paymentRef] = useState(() => "STL-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [vaNumber] = useState(() => ({
    BCA: "8277" + Math.floor(10000000 + Math.random() * 89999999),
    Mandiri: "8912" + Math.floor(10000000 + Math.random() * 89999999),
    BNI: "9889" + Math.floor(10000000 + Math.random() * 89999999),
    BRI: "8778" + Math.floor(10000000 + Math.random() * 89999999),
    Permata: "8315" + Math.floor(10000000 + Math.random() * 89999999),
  }));
  const cur = useCurrency();

  // ─── DRAFT AUTO-SAVE ──────────────────────────────────────────────────────
  const draftKey = `rania_booking_draft_${flight.flightNum}_${flight.from}_${flight.to}`;

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.step) setStep(d.step);
      if (d.adults) setAdults(d.adults);
      if (d.children) setChildren(d.children);
      if (d.flightClass) setFlightClass(d.flightClass);
      if (d.email) setEmail(d.email);
      if (d.phone) setPhone(d.phone);
      if (d.passengers && Array.isArray(d.passengers)) setPassengers(d.passengers);
      if (d.payMethod) setPayMethod(d.payMethod);
      if (typeof d.activePax === "number") setActivePax(d.activePax);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft whenever form fields change
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ step, adults, children, flightClass, email, phone, passengers, payMethod, activePax, savedAt: Date.now() }));
    } catch { /* storage full */ }
  }, [step, adults, children, flightClass, email, phone, passengers, payMethod, activePax, draftKey]);

  // Clear draft helper
  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } };

  const L = {
    en: { step1: "Passengers", step2: "Details", step3: "Payment", adults: "Adults", children: "Children", class: "Class", next: "Continue", back: "Back", name: "Full Name (as passport)", dob: "Date of Birth", gender: "Gender", passport: "Passport No.", expiry: "Passport Expiry", nation: "Nationality", baggage: "Baggage Allowance", pay: "Pay & Confirm", cancel: "Cancel", req: "Fill all required fields", male: "Male", female: "Female", scan: "Scan Passport", scanned: "Scanned ✓", adult: "Adult", child: "Child" },
    id: { step1: "Penumpang", step2: "Detail", step3: "Pembayaran", adults: "Dewasa", children: "Anak", class: "Kelas", next: "Lanjut", back: "Kembali", name: "Nama Lengkap (sesuai paspor)", dob: "Tanggal Lahir", gender: "Jenis Kelamin", passport: "No. Paspor", expiry: "Kedaluwarsa", nation: "Kewarganegaraan", baggage: "Bagasi", pay: "Bayar & Konfirmasi", cancel: "Batal", req: "Isi semua kolom!", male: "Pria", female: "Wanita", scan: "Scan Paspor", scanned: "Terpindai ✓", adult: "Dewasa", child: "Anak" },
    tet: { step1: "Pasajeru", step2: "Detallu", step3: "Pagamentu", adults: "Adultu", children: "Labarik", class: "Klase", next: "Kontinua", back: "Fila", name: "Naran Kompletu (hanesan pasaporte)", dob: "Loron Moris", gender: "Jéneru", passport: "Numeru Pasaporte", expiry: "Valididade", nation: "Nasionalidade", baggage: "Bagaje", pay: "Selu & Konfirma", cancel: "Kansela", req: "Prenxe hotu!", male: "Mane", female: "Feto", scan: "Scan Pasaporte", scanned: "Lido ✓", adult: "Adultu", child: "Labarik" },
    pt: { step1: "Passageiros", step2: "Detalhes", step3: "Pagamento", adults: "Adultos", children: "Crianças", class: "Classe", next: "Continuar", back: "Voltar", name: "Nome Completo (como no passaporte)", dob: "Data de Nascimento", gender: "Gênero", passport: "Nº Passaporte", expiry: "Validade", nation: "Nacionalidade", baggage: "Bagagem", pay: "Pagar & Confirmar", cancel: "Cancelar", req: "Preencha todos os campos!", male: "Masculino", female: "Feminino", scan: "Digitalizar", scanned: "Lido ✓", adult: "Adulto", child: "Criança" },
  }[lang];

  // Sync passengers array when adult/child counts change
  const syncPassengers = (a: number, c: number) => {
    const total = a + c;
    const newPax = Array.from({ length: total }, (_, i) => ({
      ...(passengers[i] || emptyPax(i < a ? "adult" : "child")),
      type: (i < a ? "adult" : "child") as "adult" | "child",
    }));
    setPassengers(newPax);
  };

  const updatePax = (idx: number, field: keyof PaxForm, val: string | number | boolean) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const handlePassportData = (data: { full_name?: string; passport_number?: string; date_of_birth?: string; expiry_date?: string; nationality?: string }) => {
    const idx = cameraForPax;
    if (data.full_name) updatePax(idx, "name", data.full_name);
    if (data.passport_number) updatePax(idx, "passport", data.passport_number);
    if (data.date_of_birth) updatePax(idx, "dob", data.date_of_birth);
    if (data.expiry_date) updatePax(idx, "passportExpiry", data.expiry_date);
    if (data.nationality) updatePax(idx, "nationality", data.nationality);
    updatePax(idx, "scanned", true);
    setShowCamera(false);
  };

  // Price calculation
  const basePerAdult = flight.price || 150;
  const basePerChild = Math.round(basePerAdult * 0.75);
  const classMult = flightClass === "Business" ? 2.2 : flightClass === "First" ? 3.5 : 1;
  const baseFare = Math.round((adults * basePerAdult + children * basePerChild) * classMult);
  const baggageFee = passengers.reduce((sum, p) => sum + (BAGGAGE_OPTS.find(b => b.kg === p.baggage)?.fee || 0), 0);
  const taxes = Math.round(baseFare * 0.12);
  const total = baseFare + baggageFee + taxes;

  const handleStep1Next = () => {
    if (!email.trim() || !phone.trim()) { setError(L.req); return; }
    syncPassengers(adults, children);
    setError(""); setStep(2);
  };

  const handleStep2Next = () => {
    const pax = passengers[activePax];
    if (!pax.name.trim() || !pax.dob.trim() || !pax.passport.trim()) { setError(L.req); return; }
    setError("");
    if (activePax < passengers.length - 1) { setActivePax(activePax + 1); return; }
    setStep(3);
  };

  const handlePay = async () => {
    setSubmitting(true); setError("");
    try {
      const bookingReqId = RequestDedup.newId();
      const res = await fetch(`${API}/rania/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-id": bookingReqId },
        body: JSON.stringify({
          requestId: bookingReqId,
          passengers: passengers.map(p => ({ name: p.name, dob: p.dob, gender: p.gender, passport: p.passport, passportExpiry: p.passportExpiry, nationality: p.nationality, type: p.type, baggage: p.baggage })),
          adults, children,
          email: email.trim(), phone: phone.trim(),
          from: flight.from, to: flight.to,
          fromName: flight.fromName || flight.from,
          toName: flight.toName || flight.to,
          date: new Date().toISOString().substring(0, 10),
          airline: flight.airline, flightNum: flight.flightNum,
          flightClass, baseFare, baggageFee, taxes, totalPrice: total,
          currency: flight.currency || "USD",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        clearDraft();
        onSuccess(data.bookingId, passengers[0]?.name || "Passenger");
      } else { setError("Payment failed. Try again."); }
    } catch { setError("Network error. Try again."); }
    finally { setSubmitting(false); }
  };

  const inp = "w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-400/50 focus:bg-white/6 transition-all";
  const lbl = "text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1";

  return (
    <>
      {showCamera && <PassportCamera lang={lang} onData={handlePassportData} onClose={() => setShowCamera(false)} />}
      <div className="mt-3 w-full rounded-2xl overflow-hidden border border-white/12 bg-gradient-to-br from-[#04091a] to-[#02060f]" style={{ maxWidth: 400 }}>

        {/* Header — flight summary */}
        <div className="px-4 py-3 border-b border-white/8 bg-white/3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-lg font-black text-white">{flight.from}</span>
              <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
              <span className="font-orbitron text-lg font-black text-white">{flight.to}</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-orange-400">{flight.airline}</div>
              <div className="text-[10px] text-gray-500">{flight.depart} → {flight.arrive}</div>
            </div>
          </div>
        </div>

        {/* Step indicator — progress bar */}
        <div className="px-4 pt-3 pb-2">
          <BookingProgressBar currentStep={step as 1 | 2 | 3 | 4 | 5} lang={lang} variant="compact" />
        </div>
        <div className="flex px-4 pb-1 gap-0">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? "bg-orange-500 text-white" : "bg-white/8 text-gray-500"}`}>{s}</div>
              <div className="text-[9px] ml-1.5 font-semibold hidden sm:block" style={{ color: step >= s ? "#f97316" : "#4b5563" }}>
                {s === 1 ? L.step1 : s === 2 ? L.step2 : L.step3}
              </div>
              {s < 3 && <div className={`flex-1 h-px mx-2 ${step > s ? "bg-orange-500/50" : "bg-white/8"}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Passengers + Contact ── */}
        {step === 1 && (
          <div className="px-4 pb-4 space-y-4">
            {/* Adults & Children */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: L.adults, sub: lang === "id" ? "12+ tahun" : "12+ yrs", val: adults, min: 1, max: 9, set: (v: number) => setAdults(v) },
                { label: L.children, sub: lang === "id" ? "2-11 tahun" : "2-11 yrs", val: children, min: 0, max: 6, set: (v: number) => setChildren(v) },
              ].map((item) => (
                <div key={item.label} className="bg-white/4 border border-white/8 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 font-semibold">{item.label}</div>
                  <div className="text-[9px] text-gray-600 mb-2">{item.sub}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => item.set(Math.max(item.min, item.val - 1))}
                      className="w-7 h-7 rounded-lg bg-white/8 text-white font-black flex items-center justify-center hover:bg-white/15 transition-all text-base">−</button>
                    <span className="flex-1 text-center font-black text-white text-lg">{item.val}</span>
                    <button onClick={() => item.set(Math.min(item.max, item.val + 1))}
                      className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 font-black flex items-center justify-center hover:bg-orange-500/30 transition-all text-base">+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Class */}
            <div>
              <label className={lbl}>💺 {L.class}</label>
              <div className="flex gap-1.5">
                {["Economy", "Business", "First"].map(cls => (
                  <button key={cls} onClick={() => setFlightClass(cls)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${flightClass === cls ? "border-orange-500 bg-orange-500/15 text-orange-400" : "border-white/10 text-gray-500 hover:border-white/20 bg-white/3"}`}>
                    {cls}
                    {cls === "Business" && <div className="text-[8px] text-orange-400/70">×2.2</div>}
                    {cls === "First" && <div className="text-[8px] text-orange-400/70">×3.5</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>📧 Email *</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email" className={inp} />
              </div>
              <div>
                <label className={lbl}>📱 {lang === "id" ? "Telepon" : lang === "en" ? "Phone" : "Telemovel"} *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+670 77x xxxx" type="tel" className={inp} />
              </div>
            </div>

            {error && <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => { clearDraft(); onCancel(); }} className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-500 text-xs hover:text-white transition-all">{L.cancel}</button>
              <button onClick={handleStep1Next} className="flex-1 py-2.5 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.02] active:scale-95" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                {L.next} →
              </button>
            </div>
            <div className="text-[9px] text-gray-700 text-center">
              {adults + children} {lang === "id" ? "penumpang" : lang === "en" ? "passenger(s)" : "pasajeru"} · {flightClass} · ~${(adults * (flight.price || 150) + children * Math.round((flight.price || 150) * 0.75)).toFixed(0)} {lang === "id" ? "estimasi" : "est."}
            </div>
          </div>
        )}

        {/* ── STEP 2: Per-Passenger Details + Baggage ── */}
        {step === 2 && (
          <div className="px-4 pb-4 space-y-3">
            {/* Pax tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {passengers.map((p, i) => (
                <button key={i} onClick={() => setActivePax(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${activePax === i ? "border-orange-500 bg-orange-500/15 text-orange-400" : "border-white/10 text-gray-500 bg-white/3 hover:border-white/20"}`}>
                  {p.scanned ? "✓ " : ""}{p.type === "adult" ? L.adult : L.child} {i + 1}
                  {p.name ? ` · ${p.name.split(" ")[0]}` : ""}
                </button>
              ))}
            </div>

            {passengers[activePax] && (
              <div className="space-y-3">
                {/* Passport scan button */}
                <button onClick={() => { setCameraForPax(activePax); setShowCamera(true); }}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${passengers[activePax].scanned ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-dashed border-orange-400/40 bg-orange-400/6 text-orange-300 hover:bg-orange-400/10"}`}>
                  📷 {passengers[activePax].scanned ? L.scanned : L.scan}
                  {!passengers[activePax].scanned && <span className="text-[9px] opacity-60 ml-1">— auto-fill</span>}
                </button>

                {/* Name */}
                <div>
                  <label className={lbl}>👤 {L.name} *</label>
                  <input value={passengers[activePax].name} onChange={e => updatePax(activePax, "name", e.target.value)}
                    placeholder={lang === "id" ? "Nama lengkap sesuai paspor" : "Full name as in passport"} className={inp} />
                </div>

                {/* DOB + Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>🎂 {L.dob} *</label>
                    <input value={passengers[activePax].dob} onChange={e => updatePax(activePax, "dob", e.target.value)}
                      type="date" max={new Date().toISOString().substring(0, 10)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>⚥ {L.gender}</label>
                    <select value={passengers[activePax].gender} onChange={e => updatePax(activePax, "gender", e.target.value)}
                      className={inp + " cursor-pointer"}>
                      <option value="Male">{L.male}</option>
                      <option value="Female">{L.female}</option>
                    </select>
                  </div>
                </div>

                {/* Passport No + Expiry */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>🛂 {L.passport} *</label>
                    <input value={passengers[activePax].passport} onChange={e => updatePax(activePax, "passport", e.target.value)}
                      placeholder="A12345678" className={`${inp} font-mono`} />
                  </div>
                  <div>
                    <label className={lbl}>📅 {L.expiry}</label>
                    <input value={passengers[activePax].passportExpiry} onChange={e => updatePax(activePax, "passportExpiry", e.target.value)}
                      type="date" min={new Date().toISOString().substring(0, 10)} className={inp} />
                  </div>
                </div>

                {/* Nationality */}
                <div>
                  <label className={lbl}>🌍 {L.nation}</label>
                  <NationalityPicker
                    value={passengers[activePax].nationality}
                    onChange={v => updatePax(activePax, "nationality", v)}
                    className={inp} />
                </div>

                {/* Baggage selection */}
                <div>
                  <label className={lbl}>🧳 {L.baggage}</label>
                  <div className="flex gap-1.5">
                    {BAGGAGE_OPTS.map((opt) => (
                      <button key={opt.kg} onClick={() => updatePax(activePax, "baggage", opt.kg)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${passengers[activePax].baggage === opt.kg ? "border-orange-500 bg-orange-500/15 text-orange-400" : "border-white/10 text-gray-500 bg-white/3 hover:border-white/20"}`}>
                        {opt.label}
                        <div className="text-[8px] mt-0.5">{opt.fee === 0 ? "Free" : opt.note}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => { setError(""); if (activePax > 0) { setActivePax(activePax - 1); } else { setStep(1); } }}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-500 text-xs hover:text-white transition-all">{L.back}</button>
              <button onClick={handleStep2Next}
                className="flex-1 py-2.5 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.02] active:scale-95" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                {activePax < passengers.length - 1 ? `${L.next} (${activePax + 2}/${passengers.length})` : `${L.next} →`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (() => {
          const localTotal = fmtPrice(total, cur);
          const localFare = fmtPrice(baseFare, cur);
          const localTax = fmtPrice(taxes, cur);
          const localBag = fmtPrice(baggageFee, cur);
          const idrTotal = Math.round(total * 15800);
          const PAYMENT_METHODS = [
            { id: "card" as const,      icon: "💳", label: lang === "id" ? "Kartu Kredit / Debit" : lang === "en" ? "Credit / Debit Card" : lang === "pt" ? "Cartão de Crédito/Débito" : "Kartaun Créditu/Débitu", sub: "Visa · Mastercard · JCB · Amex", badge: "GLOBAL", badgeColor: "emerald" },
            { id: "ewallet_id" as const, icon: "📲", label: "E-Wallet Indonesia",  sub: "GoPay · OVO · DANA · ShopeePay · LinkAja", badge: "ID", badgeColor: "blue" },
            { id: "va_bank" as const,   icon: "🏧", label: lang === "id" ? "Transfer Bank VA" : "Bank Transfer VA", sub: "BCA · Mandiri · BRI · BNI · Permata", badge: "ID", badgeColor: "blue" },
            { id: "tl_pay" as const,    icon: "🇹🇱", label: lang === "tet" ? "Pagamentu Timor-Leste" : "Timor-Leste Payment", sub: "BNU Mobile · BNCTL · Mosan · Telemor Telebiru", badge: "TL", badgeColor: "red" },
            { id: "qris" as const,      icon: "📷", label: "QRIS — Scan & Pay",    sub: lang === "id" ? "Semua e-wallet & mobile banking bisa scan" : "All e-wallets & mobile banking · Indonesia", badge: "ID", badgeColor: "blue" },
            { id: "intl" as const,      icon: "🌍", label: lang === "en" ? "International" : "PayPal / Google Pay", sub: "PayPal · Google Pay", badge: "INTL", badgeColor: "purple" },
          ];
          return (
          <div className="px-4 pb-4 space-y-3">

            {/* ── TOTAL AMOUNT CARD ── */}
            <div className="rounded-2xl" style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.2),rgba(234,88,12,0.08))", border: "1px solid rgba(249,115,22,0.4)" }}>
              <div className="px-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">
                      {lang === "id" ? "Total Pembayaran" : lang === "en" ? "Total Payment" : lang === "pt" ? "Total a Pagar" : "Total Pagamentu"}
                      {cur.code !== "USD" && <span className="ml-1 text-orange-400/70">({cur.code})</span>}
                    </div>
                    <div className="font-orbitron text-2xl font-black text-orange-400">{localTotal}</div>
                    {cur.code !== "USD" && <div className="text-[9px] text-gray-600">${total} USD</div>}
                    <div className="text-[9px] text-gray-500">{adults + children} {lang === "id" ? "penumpang" : "pax"} · {flightClass}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white">{flight.from} → {flight.to}</div>
                    <div className="text-[9px] text-gray-500">{flight.airline}</div>
                    <div className="text-[9px] text-gray-600">{flight.depart} → {flight.arrive}</div>
                    {cur.detected && cur.country && (
                      <div className="text-[8px] text-emerald-500 mt-1">📍 {cur.country}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/8 text-[9px] text-gray-500 flex-wrap">
                  <span>{lang === "id" ? "Tiket" : "Fare"}: <span className="text-white">{localFare}</span></span>
                  {baggageFee > 0 && <span>🧳 <span className="text-white">{localBag}</span></span>}
                  <span>{lang === "id" ? "Pajak 12%" : "Tax 12%"}: <span className="text-white">{localTax}</span></span>
                </div>
              </div>
            </div>

            {/* ── PAYMENT METHOD SELECTOR ── */}
            <div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">
                {lang === "id" ? "Pilih Metode Pembayaran" : lang === "en" ? "Select Payment Method" : lang === "pt" ? "Método de Pagamento" : "Métodu Pagamentu"}
              </div>
              <div className="space-y-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${payMethod === m.id ? "border-orange-500 bg-orange-500/12" : "border-white/8 bg-white/3 hover:border-white/15"}`}>
                    <span className="text-lg flex-shrink-0 w-7 text-center">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{m.label}</div>
                      <div className="text-[9px] text-gray-500 truncate">{m.sub}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border ${
                        m.badgeColor === "red" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        m.badgeColor === "blue" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        m.badgeColor === "purple" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>{m.badge}</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payMethod === m.id ? "border-orange-500 bg-orange-500" : "border-white/20"}`}>
                        {payMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 1. KARTU KREDIT / DEBIT ── */}
            {payMethod === "card" && (
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">💳 Card Details</span>
                  <div className="flex gap-1">
                    {(["visa","mc","jcb","amex"] as const).map(ct => (
                      <button key={ct} onClick={() => setCardType(ct)}
                        className={`text-[7px] font-black px-1.5 py-0.5 rounded border transition-all ${cardType === ct ? "border-orange-500 text-orange-400 bg-orange-500/15" : "border-white/10 text-gray-500 bg-white/5"}`}>
                        {ct === "visa" ? "VISA" : ct === "mc" ? "MC" : ct === "jcb" ? "JCB" : "AMEX"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                    {lang === "id" ? "Nomor Kartu" : "Card Number"}
                  </label>
                  <input value={cardNum}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "").substring(0, cardType === "amex" ? 15 : 16);
                      setCardNum(cardType === "amex"
                        ? raw.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3").replace(/(\d{4})(\d{1,6})$/, "$1 $2").trim()
                        : raw.replace(/(.{4})/g, "$1 ").trim());
                    }}
                    placeholder={cardType === "amex" ? "0000 000000 00000" : "0000 0000 0000 0000"}
                    maxLength={cardType === "amex" ? 17 : 19}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-400/60 font-mono tracking-widest" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Expiry MM/YY</label>
                    <input value={cardExpiry}
                      onChange={e => { const v = e.target.value.replace(/\D/g, "").substring(0, 4); setCardExpiry(v.length > 2 ? v.substring(0, 2) + "/" + v.substring(2) : v); }}
                      placeholder="MM/YY" maxLength={5}
                      className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-400/60 font-mono" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">CVV / CVC</label>
                    <input value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/g, "").substring(0, cardType === "amex" ? 4 : 3))}
                      placeholder={cardType === "amex" ? "••••" : "•••"} maxLength={cardType === "amex" ? 4 : 3} type="password"
                      className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-400/60 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                    {lang === "id" ? "Nama di Kartu" : "Cardholder Name"}
                  </label>
                  <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="NAME AS ON CARD"
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-400/60 font-mono tracking-wider uppercase" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                  <span>🔒</span><span>256-bit SSL Encrypted · PCI DSS Compliant</span>
                </div>
              </div>
            )}

            {/* ── 2. E-WALLET INDONESIA ── */}
            {payMethod === "ewallet_id" && (
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📲 Pilih E-Wallet</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "GoPay", color: "#00AED6", label: "GoPay" },
                    { id: "OVO", color: "#4C3494", label: "OVO" },
                    { id: "DANA", color: "#108EE9", label: "DANA" },
                    { id: "ShopeePay", color: "#EE4D2D", label: "ShopeePay" },
                    { id: "LinkAja", color: "#E82529", label: "LinkAja" },
                  ].map(w => (
                    <button key={w.id} onClick={() => setEwalletApp(w.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${ewalletApp === w.id ? "border-orange-500 bg-orange-500/15 text-white" : "border-white/10 text-gray-500 bg-white/3 hover:border-white/20"}`}>
                      {w.label}
                    </button>
                  ))}
                </div>
                <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 text-center">
                  <div className="text-[9px] text-gray-400 mb-1">{lang === "id" ? "Nomor Akun" : "Account Number"} {ewalletApp}</div>
                  <div className="font-mono text-base font-black text-orange-400 tracking-widest">+62 812-3456-7890</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">a.n. SANIMAR TRAVEL</div>
                  <div className="text-xs font-black text-white mt-2">{lang === "id" ? "Nominal:" : "Amount:"} Rp {idrTotal.toLocaleString("id-ID")}</div>
                  <div className="text-[9px] text-orange-400 mt-1">Ref: <span className="font-mono font-black">{paymentRef}</span></div>
                </div>
                <div className="text-[9px] text-gray-500">💡 {lang === "id" ? `Transfer ke nomor di atas via ${ewalletApp}. Kirim bukti ke WhatsApp.` : `Transfer to the number above via ${ewalletApp}. Send proof to WhatsApp.`}</div>
              </div>
            )}

            {/* ── 3. VIRTUAL ACCOUNT BANK ── */}
            {payMethod === "va_bank" && (
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">🏧 {lang === "id" ? "Pilih Bank" : "Select Bank"}</div>
                <div className="flex gap-1.5 flex-wrap">
                  {(["BCA", "Mandiri", "BNI", "BRI", "Permata"] as const).map(b => (
                    <button key={b} onClick={() => setBankVABank(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${bankVABank === b ? "border-orange-500 bg-orange-500/15 text-orange-400" : "border-white/10 text-gray-500 bg-white/3 hover:border-white/20"}`}>
                      {b}
                    </button>
                  ))}
                </div>
                <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3">
                  <div className="text-[9px] text-gray-400 mb-1">Virtual Account {bankVABank}:</div>
                  <div className="font-mono text-lg font-black text-white tracking-widest select-all">
                    {vaNumber[bankVABank as keyof typeof vaNumber]}
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-[9px]">
                    <div className="text-gray-500">{lang === "id" ? "Nama" : "Name"}</div>
                    <div className="text-white font-bold">SANIMAR TRAVEL</div>
                    <div className="text-gray-500">{lang === "id" ? "Nominal" : "Amount"}</div>
                    <div className="text-orange-400 font-black">Rp {idrTotal.toLocaleString("id-ID")}</div>
                    <div className="text-gray-500">Ref</div>
                    <div className="text-orange-400 font-mono font-black">{paymentRef}</div>
                    <div className="text-gray-500">{lang === "id" ? "Berlaku" : "Valid"}</div>
                    <div className="text-white">24 {lang === "id" ? "jam" : "hours"}</div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500">💡 {lang === "id" ? `Bayar via ATM / m-Banking / i-Banking ${bankVABank}` : `Pay via ATM / Mobile Banking / Internet Banking ${bankVABank}`}</div>
              </div>
            )}

            {/* ── 4. TIMOR-LESTE PAYMENT ── */}
            {payMethod === "tl_pay" && (
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">🇹🇱 {lang === "tet" ? "Opsaun Pagamentu" : lang === "id" ? "Metode Pembayaran TL" : "TL Payment Method"}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "BNU", label: "BNU Mobile", sub: "Banco Nacional Ultramarino" },
                    { id: "BNCTL", label: "BNCTL Mobile", sub: "Banco Nacional Timor-Leste" },
                    { id: "Mosan", label: "Mosan Wallet", sub: "E-wallet nacional TL" },
                    { id: "Telemor", label: "Telemor Telebiru", sub: "Pagamentu móvel" },
                  ].map(a => (
                    <button key={a.id} onClick={() => setTlPayApp(a.id)}
                      className={`px-2 py-2 rounded-xl text-left border transition-all ${tlPayApp === a.id ? "border-orange-500 bg-orange-500/12" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                      <div className="text-[10px] font-black text-white">{a.label}</div>
                      <div className="text-[8px] text-gray-500 leading-tight">{a.sub}</div>
                    </button>
                  ))}
                </div>
                <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3">
                  {tlPayApp === "Mosan" ? (
                    <>
                      <div className="text-[9px] text-gray-400 mb-2 text-center">Scan ho Mosan app</div>
                      <div className="flex justify-center mb-2">
                        <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center">
                          <svg viewBox="0 0 60 60" className="w-20 h-20">
                            {[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2],[0,4],[0,5],[0,6],[1,6],[2,4],[2,5],[2,6],[4,0],[4,1],[4,2],[5,0],[6,0],[6,1],[6,2],[3,3],[3,4],[4,4],[5,3],[4,6],[5,5],[6,6],[3,6]].map(([r,c],i) => (
                              <rect key={i} x={c*8+1} y={r*8+1} width={7} height={7} fill="#f97316"/>
                            ))}
                            {[[1,1],[0,3],[6,3],[6,4],[6,5],[5,4],[4,3],[3,5],[5,6]].map(([r,c],i) => (
                              <rect key={`d${i}`} x={c*8+1} y={r*8+1} width={7} height={7} fill="#111"/>
                            ))}
                          </svg>
                        </div>
                      </div>
                      <div className="text-center text-xs font-black text-orange-400">${total} USD</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[9px] text-gray-400 mb-1">{tlPayApp} {lang === "tet" ? "konta" : "account"}:</div>
                      <div className="font-mono text-base font-black text-orange-400">+670 77 123 4567</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">a.n. SANIMAR TRAVEL LDA</div>
                      <div className="flex justify-between mt-2 text-[9px]">
                        <span className="text-gray-500">{lang === "tet" ? "Total" : "Amount"}</span>
                        <span className="text-white font-black">${total} USD</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-500">Ref</span>
                        <span className="text-orange-400 font-mono font-black">{paymentRef}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-[9px] text-gray-500">📲 {lang === "tet" ? "Haruka komprovante ba WhatsApp: +670 77 123 4567" : lang === "id" ? "Kirim bukti bayar ke WhatsApp: +670 77 123 4567" : "Send payment proof to WhatsApp: +670 77 123 4567"}</div>
              </div>
            )}

            {/* ── 5. QRIS ── */}
            {payMethod === "qris" && (
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">📷 QRIS — Scan & Pay</div>
                <div className="flex justify-center">
                  <div className="bg-white rounded-2xl p-3 w-36 h-36 flex items-center justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-[6px] font-black text-gray-400 text-center leading-tight mt-6">QRIS<br/>SANIMAR</div>
                    </div>
                    <svg viewBox="0 0 70 70" className="w-28 h-28">
                      {/* Corner finders */}
                      {[[1,1],[1,10],[10,1],[10,10]].map(([r,c],i) => <rect key={`o${i}`} x={c*4} y={r*4} width={16} height={16} fill={i<3?"#000":"#000"} rx="2"/>)}
                      {[[2,2],[2,11],[11,2]].map(([r,c],i) => <rect key={`w${i}`} x={c*4} y={r*4} width={12} height={12} fill="#fff" rx="1"/>)}
                      {[[3,3],[3,12],[12,3]].map(([r,c],i) => <rect key={`f${i}`} x={c*4} y={r*4} width={8} height={8} fill="#f97316" rx="1"/>)}
                      {/* Data modules */}
                      {[[1,14],[2,15],[3,13],[4,14],[5,15],[6,13],[7,14],[1,16],[3,16],[5,13],[7,16],[8,14],[8,15],[9,13],[9,16],[10,14],[11,15],[12,13],[13,14],[14,15],[14,13],[15,14],[16,15],[13,16],[15,16],[16,13],[16,16],[8,3],[8,4],[9,3],[10,4],[11,3],[11,4],[12,3],[13,4],[14,3],[14,4],[15,3],[16,4],[8,5],[9,6],[10,5],[11,6],[12,5],[13,6]].map(([r,c],i)=>(
                        <rect key={`m${i}`} x={c*4} y={r*4} width={4} height={4} fill="#000"/>
                      ))}
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-orange-400">Rp {idrTotal.toLocaleString("id-ID")}</div>
                  <div className="text-[9px] text-gray-500">${total} USD · {lang === "id" ? "Kurs estimasi" : "Est. rate"}</div>
                  <div className="text-[8px] text-gray-600 mt-0.5">Ref: {paymentRef}</div>
                </div>
                <div className="flex gap-1 flex-wrap justify-center">
                  {["GoPay", "OVO", "DANA", "ShopeePay", "BCA", "Mandiri", "BNI", "BRI"].map(w => (
                    <span key={w} className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-white/8 text-gray-400 border border-white/10">{w}</span>
                  ))}
                </div>
                <div className="text-[9px] text-gray-500 text-center">📱 {lang === "id" ? "Buka app → Scan QR → Bayar" : "Open app → Scan QR → Pay"}</div>
              </div>
            )}

            {/* ── 6. INTERNATIONAL (PayPal / Google Pay) ── */}
            {payMethod === "intl" && (
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">🌍 International Payment</div>
                <div className="flex gap-2">
                  {(["paypal","gpay"] as const).map(m => (
                    <button key={m} onClick={() => setIntlMethod(m)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border transition-all font-bold text-xs ${intlMethod === m ? "border-orange-500 bg-orange-500/15 text-white" : "border-white/10 text-gray-500 bg-white/3 hover:border-white/20"}`}>
                      {m === "paypal" ? "🅿️ PayPal" : "G Pay"}
                    </button>
                  ))}
                </div>
                {intlMethod === "paypal" && (
                  <div className="bg-[#003087]/15 border border-[#003087]/30 rounded-xl p-3">
                    <div className="text-[9px] text-gray-400 mb-1">Send to PayPal account:</div>
                    <div className="font-mono text-sm font-black text-[#009CDE]">payments@sanimartravel.com</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">SANIMAR TRAVEL LDA</div>
                    <div className="flex justify-between mt-2 text-[9px]">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-black text-white">{localTotal}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-gray-500">Note/Ref</span>
                      <span className="text-orange-400 font-mono font-black">{paymentRef}</span>
                    </div>
                  </div>
                )}
                {intlMethod === "gpay" && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-2">G</div>
                    <div className="text-xs font-bold text-white mb-1">Google Pay</div>
                    <div className="text-[9px] text-gray-400 mb-2">UPI / Google Pay ID:</div>
                    <div className="font-mono text-sm font-black text-emerald-400">sanimartravel@okaxis</div>
                    <div className="text-xs font-black text-white mt-2">{localTotal}</div>
                    <div className="text-[8px] text-gray-600">Ref: {paymentRef}</div>
                  </div>
                )}
                <div className="text-[9px] text-gray-500">💡 {lang === "id" ? "Setelah bayar, screenshot & kirim ke WhatsApp kami." : "After payment, screenshot and send to our WhatsApp."}</div>
              </div>
            )}

            {/* ── Passenger mini summary ── */}
            <div className="bg-white/3 border border-white/8 rounded-xl divide-y divide-white/6">
              {passengers.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5">
                  <div>
                    <div className="text-[10px] text-white font-semibold">{p.name || `Pax ${i + 1}`}</div>
                    <div className="text-[9px] text-gray-500">{p.type === "adult" ? L.adult : L.child} · {p.baggage}kg</div>
                  </div>
                  <div className="text-[10px] font-bold text-orange-400">
                    {fmtPrice(p.type === "adult" ? Math.round(basePerAdult * classMult) : Math.round(basePerChild * classMult), cur)}
                  </div>
                </div>
              ))}
            </div>

            {/* Security notice */}
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2 text-[10px] text-emerald-400 flex items-start gap-2">
              <span className="flex-shrink-0">🔒</span>
              <span>{lang === "id" ? "Setelah pembayaran dikonfirmasi, e-ticket otomatis terkirim ke email & WhatsApp Anda." : lang === "en" ? "After payment is confirmed, e-ticket sent automatically to your email & WhatsApp." : lang === "pt" ? "Após confirmação, e-ticket enviado automaticamente para email & WhatsApp." : "Hafoin pagamentu konfirmadu, e-ticket haruka automátiku ba email & WhatsApp ita."}</span>
            </div>

            {error && <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => { setError(""); setStep(2); setActivePax(passengers.length - 1); }}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-500 text-xs hover:text-white transition-all">{L.back}</button>
              <button onClick={handlePay} disabled={submitting}
                className="flex-1 py-3 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 6px 24px rgba(249,115,22,0.4)" }}>
                {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  {L.pay} · {localTotal}
                </>}
              </button>
            </div>
            <div className="text-[9px] text-gray-700 text-center">🔐 SSL Secured · RANIA AI Autopilot · Instant e-ticket</div>
          </div>
          );
        })()}
      </div>
    </>
  );
}

// ── Booking Success Card ────────────────────────────────────────────────────────
function BookingSuccessCard({ data, lang }: { data: { bookingId: string; passengerName: string; from: string; to: string }; lang: Language }) {
  const msgs: Record<Language, { title: string; sub: string; info: string; pdf: string }> = {
    tet: { title: "Booking Konfirmadu!", sub: "RANIA pronese ona booking ita. Tiket sei haruka ba email/WhatsApp ita otomatiku.", info: "📧 Tiket haruka otomatiku", pdf: "⬇ Download E-Ticket PDF" },
    id: { title: "Booking Dikonfirmasi!", sub: "RANIA telah memproses booking Anda secara otomatis. Tiket dikirim ke email/WhatsApp Anda.", info: "📧 Tiket terkirim otomatis", pdf: "⬇ Download E-Ticket PDF" },
    en: { title: "Booking Confirmed!", sub: "RANIA has processed your booking automatically. Your ticket was sent to your email/WhatsApp.", info: "📧 Ticket sent automatically", pdf: "⬇ Download E-Ticket PDF" },
    pt: { title: "Reserva Confirmada!", sub: "RANIA processou sua reserva automaticamente. Bilhete enviado para email/WhatsApp.", info: "📧 Bilhete enviado automaticamente", pdf: "⬇ Download E-Ticket PDF" },
  };
  const m = msgs[lang];
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const W = doc.internal.pageSize.getWidth();
      // Background
      doc.setFillColor(5, 8, 18);
      doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), "F");
      // Header bar
      doc.setFillColor(0, 100, 150);
      doc.rect(0, 0, W, 22, "F");
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("LU SANIMAR TRAVEL", W / 2, 10, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Powered by RANIA AI · Dili, Timor-Leste", W / 2, 17, { align: "center" });
      // E-TICKET label
      doc.setFillColor(0, 200, 150);
      doc.roundedRect(W / 2 - 18, 26, 36, 8, 2, 2, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("E-TICKET", W / 2, 31.5, { align: "center" });
      // Route display
      doc.setTextColor(0, 220, 200);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.from}  →  ${data.to}`, W / 2, 48, { align: "center" });
      // Divider
      doc.setDrawColor(255, 255, 255, 30);
      doc.setLineWidth(0.3);
      doc.line(10, 53, W - 10, 53);
      // Details
      const details = [
        ["Booking ID", data.bookingId],
        ["Passenger", data.passengerName],
        ["Route", `${data.from} → ${data.to}`],
        ["Status", "CONFIRMED"],
        ["Issued by", "RANIA AI · SANIMAR Travel"],
        ["Issue Date", new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
        ["Email", "info.lusanimar@gmail.com"],
      ];
      let y = 62;
      details.forEach(([label, value]) => {
        doc.setTextColor(140, 140, 160);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text(label, 12, y);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text(value, W - 12, y, { align: "right" });
        y += 9;
      });
      // Footer
      doc.setFillColor(0, 100, 150);
      doc.rect(0, doc.internal.pageSize.getHeight() - 14, W, 14, "F");
      doc.setTextColor(180, 220, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("This e-ticket is valid only with a valid passport. For support: info.lusanimar@gmail.com", W / 2, doc.internal.pageSize.getHeight() - 7, { align: "center" });
      doc.save(`SANIMAR-Eticket-${data.bookingId}.pdf`);
    } catch (e) {
      console.error("PDF error", e);
    }
    setDownloading(false);
  };

  return (
    <div className="mt-3 w-full max-w-sm rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 p-4 shadow-[0_0_24px_rgba(52,211,153,0.15)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">✅</div>
        <div>
          <div className="text-sm font-black text-emerald-400">{m.title}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{m.sub}</div>
        </div>
      </div>
      <div className="bg-black/20 rounded-xl p-3 mb-3 space-y-1.5">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Booking ID</span><span className="font-mono font-bold text-cyan-400">{data.bookingId}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Passenger</span><span className="text-white font-semibold">{data.passengerName}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Route</span><span className="text-white font-semibold">{data.from} → {data.to}</span></div>
      </div>
      <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
        {m.info}
      </div>
      <button onClick={downloadPDF} disabled={downloading}
        className="w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}>
        {downloading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
        {m.pdf}
      </button>
    </div>
  );
}

// ── Registration Modal — matching Image 2 design ──────────────────────────────
function RegisterModal({ onDone, lang }: { onDone: () => void; lang: Language }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch(`${API}/rania/register-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), lang, source: "register_modal" }),
      });
      // Save email for future use
      try {
        const u = JSON.parse(localStorage.getItem("rania_user") || "{}");
        u.email = email.trim();
        localStorage.setItem("rania_user", JSON.stringify(u));
      } catch { /* ignore */ }
    } catch { /* ignore */ }
    localStorage.setItem("rania_registered", email.trim());
    setLoading(false);
    onDone();
  };

  const btnLabel = lang === "id" ? "Mulai Chat Gratis" : lang === "pt" ? "Iniciar Chat Grátis" : lang === "en" ? "Start Free Chat" : "Hahu Chat Grátis";
  const tagline = lang === "id" ? "300 pesan gratis/hari · Tanpa kartu kredit" : lang === "pt" ? "300 mensagens grátis/dia · Sem cartão" : lang === "en" ? "300 free messages/day · No credit card" : "Mensajen grátis 300/loron · La presiza kartaun";
  const title = lang === "id" ? "Selamat di RANIA AI" : lang === "pt" ? "Bem-vindo ao RANIA AI" : lang === "en" ? "Welcome to RANIA AI" : "Tama ba RANIA AI";
  const subtitle = lang === "id" ? "Masukkan email untuk akses RANIA" : lang === "pt" ? "Insira o email para aceder RANIA" : lang === "en" ? "Enter your email to access RANIA" : "Hatama ita nia email hodi uza RANIA";

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center">
      {/* Blurred dark overlay */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 w-full sm:max-w-sm overflow-hidden rounded-t-[2rem] sm:rounded-2xl shadow-[0_0_80px_rgba(0,150,255,0.25)]">
        {/* Background — deep blue globe-like gradient */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(160deg,#06112b 0%,#0a1e4a 30%,#0e2b6e 55%,#0a1e4a 75%,#060f25 100%)" }}>
          {/* Atmospheric glow orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle,#3b82f6 0%,transparent 70%)", filter: "blur(30px)" }} />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#1d4ed8 0%,transparent 70%)", filter: "blur(20px)" }} />
          {/* Globe ring decoration */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border border-blue-400/10 opacity-40" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full border border-blue-300/8 opacity-30" />
          {/* Floating plane paths */}
          <div className="absolute top-6 right-8 text-white/10 text-2xl" style={{ transform: "rotate(-30deg)" }}>✈</div>
          <div className="absolute bottom-32 left-6 text-white/8 text-lg" style={{ transform: "rotate(15deg)" }}>✈</div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 pt-7 pb-8">
          {/* Flag + travel badge */}
          <div className="flex justify-between items-start mb-4">
            <span className="text-2xl">🇹🇱</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[9px] font-bold text-cyan-300 tracking-wider">
              ✈ TRAVEL TO THE WORLD
            </div>
          </div>

          {/* RANIA avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-[22px] p-[2.5px] shadow-[0_0_40px_rgba(99,102,241,0.6)]"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7,#06b6d4)" }}>
              <div className="w-full h-full rounded-[19px] overflow-hidden bg-[#0a1525]">
                <img src={`${GH}/image/rania_avatar.png.webp`} alt="RANIA"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-[22px] font-black text-white leading-tight">
              {title.split("RANIA AI").map((part, i, arr) => (
                <span key={i}>{part}{i < arr.length - 1 && <span className="text-cyan-400">RANIA AI</span>}</span>
              ))}
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">{subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-white/12 bg-white/5 focus-within:border-cyan-400/50 focus-within:bg-white/8 transition-all">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder={lang === "id" ? "Email kamu" : lang === "en" ? "Your email" : lang === "pt" ? "Seu email" : "Email ita nian"}
                className="flex-1 bg-transparent text-white text-[15px] placeholder-gray-500 outline-none" />
            </div>

            {/* Submit button — cyan to purple gradient */}
            <button type="submit" disabled={loading || !email.trim()}
              className="mt-2 w-full py-4 rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#06b6d4 0%,#3b82f6 40%,#8b5cf6 100%)", boxShadow: "0 6px 30px rgba(59,130,246,0.45)" }}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl">✈</span>
                  {btnLabel}
                </>
              )}
            </button>
          </form>

          {/* Tagline */}
          <p className="text-center text-[11px] text-gray-500 mt-4 flex items-center justify-center gap-1.5">
            <span className="text-gray-600">🌐</span>
            {tagline}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Dynamic Island (Ixigo × iPhone hybrid — morphing status pill) ─────────────
type DynamicMode = "idle" | "thinking" | "speaking" | "flights_found" | "booking" | "confirmed";

function DynamicIsland({ mode, flightCount, lang }: { mode: DynamicMode; flightCount?: number; lang: Language }) {
  if (mode === "idle") return null;
  type CfgItem = { icon: string; text: string; color: string; bg: string };
  const cfg: Record<Exclude<DynamicMode, "idle">, CfgItem> = {
    thinking: {
      icon: "🤔",
      text: lang === "id" ? "RANIA sedang berpikir…" : lang === "en" ? "RANIA is thinking…" : lang === "pt" ? "RANIA está pensando…" : "RANIA hanoin…",
      color: "#a855f7", bg: "rgba(168,85,247,0.12)",
    },
    speaking: {
      icon: "🔊",
      text: lang === "id" ? "RANIA sedang bicara…" : lang === "en" ? "RANIA is speaking…" : lang === "pt" ? "RANIA está falando…" : "RANIA koalia…",
      color: "#00e5ff", bg: "rgba(0,229,255,0.12)",
    },
    flights_found: {
      icon: "✈️",
      text: `${flightCount || ""} ${lang === "id" ? "penerbangan ditemukan!" : lang === "en" ? "flights found!" : lang === "pt" ? "voos encontrados!" : "voo hetan!"}`,
      color: "#10b981", bg: "rgba(16,185,129,0.12)",
    },
    booking: {
      icon: "💳",
      text: lang === "id" ? "Memproses booking…" : lang === "en" ? "Processing booking…" : lang === "pt" ? "Processando reserva…" : "Prosesa booking…",
      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
    },
    confirmed: {
      icon: "✅",
      text: lang === "id" ? "Booking dikonfirmasi!" : lang === "en" ? "Booking confirmed!" : lang === "pt" ? "Reserva confirmada!" : "Booking konfirmadu!",
      color: "#10b981", bg: "rgba(16,185,129,0.12)",
    },
  };
  const c = cfg[mode];
  return (
    <div className="flex justify-center px-4 pt-1 pb-0.5 flex-shrink-0">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-500 animate-in fade-in"
        style={{ background: c.bg, border: `1px solid ${c.color}40`, color: c.color, boxShadow: `0 2px 16px ${c.color}20` }}>
        <span>{c.icon}</span>
        {mode === "thinking" && (
          <div className="flex gap-[3px] items-center h-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ background: c.color, animation: `bounce 0.6s ease-in-out ${i * 0.15}s infinite alternate` }} />
            ))}
          </div>
        )}
        {mode === "speaking" && (
          <div className="flex gap-[2px] items-end h-3">
            {[1, 2, 3, 2, 1].map((h, i) => (
              <div key={i} className="w-[2px] rounded-full"
                style={{ height: h * 3, background: c.color, animation: `voiceBar 0.4s ease-in-out ${i * 0.07}s infinite alternate` }} />
            ))}
          </div>
        )}
        <span>{c.text}</span>
      </div>
    </div>
  );
}

// ── Airport Departure Board (Ixigo-style FIDS) ────────────────────────────────
const DIL_DEPARTURES = [
  { time: "06:15", dest: "Denpasar", iata: "DPS", airline: "Garuda Indonesia", code: "GA-868",   status: "On Time",      gate: "A1", flag: "🇮🇩" },
  { time: "07:30", dest: "Darwin",   iata: "DRW", airline: "Airnorth",         code: "TL-104",   status: "Boarding",     gate: "A2", flag: "🇦🇺" },
  { time: "09:00", dest: "Singapore",iata: "SIN", airline: "SilkAir",          code: "MI-234",   status: "On Time",      gate: "B1", flag: "🇸🇬" },
  { time: "11:45", dest: "Kupang",   iata: "KOE", airline: "Nam Air",          code: "IN-192",   status: "On Time",      gate: "A3", flag: "🇮🇩" },
  { time: "14:20", dest: "Bali",     iata: "DPS", airline: "Batik Air",        code: "ID-6590",  status: "Delayed +45m", gate: "B2", flag: "🇮🇩" },
  { time: "17:00", dest: "Surabaya", iata: "SUB", airline: "Lion Air",         code: "JT-775",   status: "On Time",      gate: "A1", flag: "🇮🇩" },
];

function AirportDepartureBoard({ onOpenChat }: { onOpenChat: () => void }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const statusColor = (s: string) => s === "Boarding" ? "#10b981" : s.includes("Delayed") ? "#ef4444" : "#6b7280";
  const statusBg   = (s: string) => s === "Boarding" ? "rgba(16,185,129,0.1)" : s.includes("Delayed") ? "rgba(239,68,68,0.1)" : "transparent";
  return (
    <div className="relative z-10 px-4 md:px-10 mb-6">
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(4,9,26,0.97)", border: "1px solid rgba(0,229,255,0.12)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        {/* Board header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,229,255,0.02)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-orbitron text-xs font-black text-white tracking-widest">DILI INT'L · DEPARTURES</span>
            <span className="text-[9px] text-gray-600 font-mono">DIL / WPDL</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-orbitron text-base font-black" style={{ color: "#00e5ff" }}>
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </div>
            <div className="text-[9px] text-gray-500">{now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-5 md:grid-cols-6 px-5 py-2 gap-3" style={{ background: "rgba(0,0,0,0.4)" }}>
          {[
            { label: "TIME",        cls: "" },
            { label: "DESTINATION", cls: "" },
            { label: "AIRLINE",     cls: "hidden md:block" },
            { label: "FLIGHT",      cls: "" },
            { label: "GATE",        cls: "" },
            { label: "STATUS",      cls: "" },
          ].map(h => (
            <div key={h.label} className={`text-[8px] font-black text-gray-600 tracking-widest ${h.cls}`}>{h.label}</div>
          ))}
        </div>
        {/* Rows */}
        {DIL_DEPARTURES.map((dep, i) => (
          <div key={i} onClick={onOpenChat}
            className="grid grid-cols-5 md:grid-cols-6 px-5 py-2.5 gap-3 border-t items-center cursor-pointer group transition-all hover:bg-white/3"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="font-orbitron text-sm font-black text-white group-hover:text-cyan-300 transition-colors">{dep.time}</div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{dep.flag}</span>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{dep.dest}</span>
              </div>
              <div className="text-[9px] text-gray-600 font-mono mt-0.5">{dep.iata}</div>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] text-gray-300">{dep.airline}</div>
            </div>
            <div className="text-[10px] font-bold text-gray-400 font-mono">{dep.code}</div>
            <div className="font-orbitron text-sm font-black text-orange-400">{dep.gate}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: statusColor(dep.status), background: statusBg(dep.status), border: `1px solid ${statusColor(dep.status)}30` }}>
                {dep.status}
              </span>
            </div>
          </div>
        ))}
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.25)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] text-gray-600">SANIMAR TRAVEL · DIL Flight Intelligence · Updates every 5 min</div>
          <button onClick={onOpenChat} className="text-[9px] text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
            Book any flight →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Chat Overlay ─────────────────────────────────────────────────────────
function RaniaChatOverlay({ isOpen, onClose, lang, setLang, onBookingSuccess }: {
  isOpen: boolean; onClose: () => void; lang: Language; setLang: (l: Language) => void;
  onBookingSuccess?: (bookingId: string) => void;
}) {
  const t = T[lang];
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.7);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Voice daily limit (persisted in localStorage, resets every day) ─────
  const _initVoiceUsed = (() => {
    try {
      const saved = localStorage.getItem("rania_voice_day");
      if (saved) {
        const { day, count } = JSON.parse(saved) as { day: string; count: number };
        const today = new Date().toISOString().substring(0, 10);
        if (day === today) return count;
      }
    } catch { /* ignore */ }
    return 0;
  })();
  const [voiceRepliesUsed, setVoiceRepliesUsed] = useState(_initVoiceUsed);
  const [dynamicMode, setDynamicMode] = useState<DynamicMode>("idle");
  const [dynamicFlightCount, setDynamicFlightCount] = useState(0);
  const [bookingMode, setBookingMode] = useState(false);
  const bookingModeRef = useRef(false);

  // Dynamic Island: track typing → thinking, speaking → speaking, flights → flights_found
  useEffect((): (() => void) | void => {
    if (isTyping) {
      setDynamicMode("thinking");
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.flights && last.flights.length > 0) {
      setDynamicFlightCount(last.flights.length);
      setDynamicMode("flights_found");
      const t = setTimeout(() => setDynamicMode("idle"), 4000);
      return () => clearTimeout(t);
    }
    if (last?.bookingSuccess || last?.groupBookingSuccess) {
      setDynamicMode("confirmed");
      const t = setTimeout(() => setDynamicMode("idle"), 5000);
      return () => clearTimeout(t);
    }
    setDynamicMode("idle");
  }, [isTyping, messages]);

  useEffect(() => {
    if (isSpeaking && !isTyping) setDynamicMode("speaking");
    else if (!isSpeaking && !isTyping) setDynamicMode(prev => prev === "speaking" ? "idle" : prev);
  }, [isSpeaking, isTyping]);
  // P0-K: Race condition protection — discard stale responses
  const latestRequestIdRef = useRef<string>("");
  const userMsgCountRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceEnabledRef = useRef(true);
  const voiceVolumeRef = useRef(0.7);
  const voiceUsedRef = useRef(_initVoiceUsed);

  const FREE_VOICE_LIMIT = 15;
  const isPremium = typeof window !== "undefined" && localStorage.getItem("rania_premium") === "true";

  // P1-A: Init greeting — restore from sessionStorage first, then localStorage (survives tab close)
  useEffect(() => {
    const storageKey = `rania_chat_history_${lang}`;
    try {
      // Try sessionStorage first (fastest, current tab)
      const sessionSaved = sessionStorage.getItem(storageKey);
      if (sessionSaved) {
        const parsed = JSON.parse(sessionSaved) as ChatMsg[];
        if (parsed.length > 0) { setMessages(parsed); return; }
      }
      // Fallback to localStorage (survives tab close / browser refresh)
      const lsSaved = localStorage.getItem(`rania_draft_${lang}`);
      if (lsSaved) {
        const { messages: savedMsgs, savedAt } = JSON.parse(lsSaved) as { messages: ChatMsg[]; savedAt: number };
        // Only restore if saved within last 2 hours
        if (savedMsgs && savedMsgs.length > 0 && Date.now() - (savedAt || 0) < 2 * 60 * 60 * 1000) {
          setMessages(savedMsgs);
          return;
        }
      }
    } catch { /* ignore parse errors */ }
    setMessages([{
      role: "assistant",
      text: t.chatGreeting,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      intent: "general",
    }]);
  }, [lang]);

  // Persist chat to sessionStorage + localStorage (draft auto-save) on every message
  useEffect(() => {
    if (messages.length <= 1) return;
    const storageKey = `rania_chat_history_${lang}`;
    try {
      const slim = messages.slice(-60).map(m => ({
        role: m.role, text: m.text, time: m.time, intent: m.intent,
        flights: m.flights ? m.flights.slice(0, 3) : undefined,
        bookingSuccess: m.bookingSuccess,
        groupBookingSuccess: m.groupBookingSuccess ? {
          bookingId: m.groupBookingSuccess.bookingId,
          groupSize: m.groupBookingSuccess.groupSize,
          from: m.groupBookingSuccess.from,
          to: m.groupBookingSuccess.to,
        } : undefined,
      }));
      sessionStorage.setItem(storageKey, JSON.stringify(slim));
      // Also persist to localStorage so draft survives tab close
      localStorage.setItem(`rania_draft_${lang}`, JSON.stringify({ messages: slim, savedAt: Date.now() }));
    } catch { /* storage full — ignore */ }
  }, [messages, lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addMessage = useCallback((msg: ChatMsg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // ── Init speech synthesis ──────────────────────────────────────────────────
  useEffect(() => {
    synthRef.current = window.speechSynthesis || null;
    // Pre-load voices list
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      synthRef.current?.cancel();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  // Stop speech when tab hidden or chat closed
  useEffect(() => {
    const onHide = () => { if (document.hidden) synthRef.current?.cancel(); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // 🎙 Tier 2 — Premium greeting voice on first open (branding moment)
  const hasGreetedRef = useRef(false);
  useEffect(() => {
    if (!isOpen || hasGreetedRef.current) return;
    hasGreetedRef.current = true;
    const greetings: Record<string, string> = {
      id: "Selamat datang! Saya RANIA, asisten perjalanan AI dari SANIMAR Travel. Ada yang bisa saya bantu?",
      en: "Welcome! I'm RANIA, your AI travel assistant from SANIMAR Travel. How can I help you?",
      pt: "Bem-vindo! Sou RANIA, sua assistente de viagem da SANIMAR Travel. Como posso ajudar?",
      tet: "Bem-vindus! Ha'u mak RANIA, asistente viajen AI husi SANIMAR Travel. Bele ajuda saida?",
    };
    const greetText = greetings[lang] || greetings.id;
    // Delay slightly so chat animation completes before speaking
    const timer = setTimeout(() => {
      hybridSpeak(greetText, lang, {
        forcePremium: true, // always premium for first greeting
        volume: voiceVolumeRef.current,
        onSpeakStart: () => setIsSpeaking(true),
        onSpeakEnd: () => setIsSpeaking(false),
      });
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 💰 Price Alert — check for triggered alerts when chat opens
  const hasCheckedPriceAlerts = useRef(false);
  useEffect(() => {
    if (!isOpen || hasCheckedPriceAlerts.current) return;
    hasCheckedPriceAlerts.current = true;
    try {
      const phone = JSON.parse(localStorage.getItem("rania_user") || "{}").phone || "";
      if (!phone) return;
      fetch(`${API}/rania/price-alerts/check?phone=${encodeURIComponent(phone)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.count || data.count === 0) return;
          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          data.alerts.forEach((a: { route: string; from: string; to: string; triggeredPrice: number; budget: number; airline: string; waLink?: string }) => {
            const saving = a.budget - a.triggeredPrice;
            const text = lang === "id"
              ? `🎉 **Harga tiket ${a.from}→${a.to} sudah turun!**\n\nSekarang **$${a.triggeredPrice}** via ${a.airline} (hemat $${saving} dari budget-mu $${a.budget})\n\n${a.waLink ? `[👆 Klik untuk booking via WhatsApp](${a.waLink})` : "Booking sekarang sebelum habis!"}`
              : lang === "tet"
              ? `🎉 **Presu bilhete ${a.from}→${a.to} tuun ona!**\n\nAgora **$${a.triggeredPrice}** via ${a.airline} (poupa $${saving})\n\n${a.waLink ? `[👆 Reserva via WhatsApp](${a.waLink})` : "Reserva agora!"}` 
              : `🎉 **Price drop alert: ${a.from}→${a.to}!**\n\nNow **$${a.triggeredPrice}** via ${a.airline} (save $${saving} vs your $${a.budget} budget)\n\n${a.waLink ? `[👆 Book via WhatsApp](${a.waLink})` : "Book now before it's gone!"}`;
            setTimeout(() => {
              addMessage({ role: "assistant", text, time: now, intent: "flight" });
            }, 1200);
          });
        })
        .catch(() => {});
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep refs in sync so speakText always has latest values without re-creating
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
  useEffect(() => { voiceVolumeRef.current = voiceVolume; }, [voiceVolume]);
  // Persist voice count to localStorage so it survives page refreshes
  useEffect(() => {
    try {
      const today = new Date().toISOString().substring(0, 10);
      localStorage.setItem("rania_voice_day", JSON.stringify({ day: today, count: voiceRepliesUsed }));
    } catch { /* ignore */ }
  }, [voiceRepliesUsed]);

  const stopSpeech = useCallback(() => {
    synthRef.current?.cancel();
    stopSpeaking(); // stop Google TTS audio element
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback((text: string, speechLang: string) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis) return;

    // ─── VOICE LIMIT CHECK ──────────────────────────────────────────────────
    const premiumNow = localStorage.getItem("rania_premium") === "true";
    if (!premiumNow && voiceUsedRef.current >= FREE_VOICE_LIMIT) {
      // Already at limit — show upgrade nudge via a short spoken hint only once
      if (voiceUsedRef.current === FREE_VOICE_LIMIT) {
        voiceUsedRef.current = FREE_VOICE_LIMIT + 1; // prevent loop
        const hint = new SpeechSynthesisUtterance(
          speechLang === "id"
            ? "Suara gratis habis. Upgrade ke Premium untuk lanjut ngobrol dengan suara."
            : speechLang === "tet"
            ? "Lian free ona kompletu. Upgrade Premium ba atu kontinua."
            : "Your free voice replies are used up. Upgrade to Premium to continue."
        );
        hint.rate = 0.92; hint.pitch = 1.08; hint.volume = voiceVolumeRef.current;
        synthRef.current?.speak(hint);
      }
      return;
    }

    // Strip markdown, emoji, URLs for clean natural TTS
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/[#_`~>]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      .replace(/✈|📧|🏨|🌤|📋|🗺|💳|👥|🤿|🚗|🍽|🧭|📍|⚡|🔥|✅|❌|⚠|💬|🎤|🔊/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!clean) return;

    synthRef.current?.cancel();

    // ─── RANIA TIMOR-LESTE VOICE PRIORITY ───────────────────────────────────
    // Best warmth: Indonesian female (closest to Timorese natural accent),
    // then Portuguese female, then English female as fallback.
    const voices = window.speechSynthesis.getVoices();

    // Priority list — Timorese-friendly warm female voices
    const TIMOR_PREFERRED = [
      // Indonesian (closest to Timorese)
      "Google Bahasa Indonesia", "Google Indonesian", "Indonesian Female",
      "id-ID-Standard-A", "Microsoft Andika",
      // Portuguese (official language TL)
      "Google português do Brasil", "Microsoft Maria", "pt-PT",
      // Warm English female fallback
      "Google UK English Female", "Microsoft Zira", "Samantha",
      "Victoria", "Karen", "Fiona", "Moira",
    ];

    let pickedVoice: SpeechSynthesisVoice | null = null;

    // Match by speechLang first — prefer native language voice
    if (speechLang === "id") {
      pickedVoice = voices.find(v => v.lang.startsWith("id")) || null;
    } else if (speechLang === "tet" || speechLang === "pt") {
      pickedVoice = voices.find(v => v.lang.startsWith("pt")) ||
                    voices.find(v => v.lang.startsWith("id")) || null;
    }

    // If no native match, fall through preferred list
    if (!pickedVoice) {
      for (const name of TIMOR_PREFERRED) {
        const v = voices.find(vx => vx.name.includes(name) || vx.lang.includes(name));
        if (v) { pickedVoice = v; break; }
      }
    }

    // Last resort: any female voice
    if (!pickedVoice) {
      pickedVoice = voices.find(v => /female|woman|perempuan/i.test(v.name)) || null;
    }

    // ─── BUILD UTTERANCE ────────────────────────────────────────────────────
    const utt = new SpeechSynthesisUtterance(clean);
    if (pickedVoice) utt.voice = pickedVoice;

    // TTS lang — always try pt-TL first (Timor-Leste), browser may support it
    utt.lang = speechLang === "id" ? "id-ID"
             : speechLang === "pt" ? "pt-PT"
             : speechLang === "tet" ? "pt-TL"
             : "en-US";

    // Timor girl natural voice settings
    utt.rate   = 0.90;   // slightly slow — warm, clear, friendly
    utt.pitch  = 1.10;   // a bit higher — young female, cheerful
    utt.volume = voiceVolumeRef.current;

    // Chrome resumeTimer fix (stops after 15s otherwise)
    const resumeTimer = setInterval(() => {
      if (synthRef.current?.paused) synthRef.current.resume();
    }, 10000);

    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => { setIsSpeaking(false); clearInterval(resumeTimer); };
    utt.onerror = () => { setIsSpeaking(false); clearInterval(resumeTimer); };

    // ─── INCREMENT COUNTER ──────────────────────────────────────────────────
    if (!premiumNow) {
      voiceUsedRef.current += 1;
      setVoiceRepliesUsed(voiceUsedRef.current);
    }

    synthRef.current?.speak(utt);
  }, [FREE_VOICE_LIMIT]);

  const send = useCallback(async (txt?: string) => {
    const msg = (txt || input).trim();
    if (!msg || isTyping) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInput("");
    userMsgCountRef.current += 1;
    const currentUserMsgCount = userMsgCountRef.current;

    // Detect if user typed an email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = msg.match(emailRegex);
    if (emailMatch && !emailCaptured) {
      const capturedEmail = emailMatch[0];
      setEmailCaptured(true);
      fetch(`${API}/rania/register-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: capturedEmail, lang, source: "chat_capture" }),
      }).catch(() => {});
    }

    addMessage({ role: "user", text: msg, time: now });
    setIsTyping(true);

    try {
      // P0-K: Race condition guard — generate unique requestId; discard stale responses
      const reqId = crypto.randomUUID();
      latestRequestIdRef.current = reqId;

      // Build message history for AI
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }));
      history.push({ role: "user", content: msg });

      // Call RANIA AI backend
      const aiRes = await fetch(`${API}/rania/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-request-id": reqId },
        body: JSON.stringify({ messages: history, lang, bookingMode: bookingModeRef.current }),
      });

      // Discard response if a newer request has been made
      if (latestRequestIdRef.current !== reqId) return;

      let aiReply = "Hau la konsege konekta agora. Favor tenta fila-fali.";
      let intent: Intent = "general";
      let flights: FlightCard[] | undefined;
      let weather: WeatherData | undefined;
      let visa: VisaData | undefined;
      let searchParams: { from?: string; to?: string; date?: string } | undefined;

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiReply = aiData.reply;
        intent = aiData.intent || "general";

        // Auto-switch UI language based on detected language from AI
        if (aiData.detectedLang && ["tet","id","en","pt"].includes(aiData.detectedLang) && aiData.detectedLang !== lang) {
          setLang(aiData.detectedLang as Language);
        }

        // Backend already fetched flights when RANIA output JSON flight_search block
        if (aiData.flights && aiData.flights.length > 0) {
          flights = aiData.flights;
          if (aiData.from && aiData.to) {
            searchParams = { from: aiData.from, to: aiData.to };
          }
        }

        // V2: Handle "no flights found" message from backend route validator
        if (aiData.noFlightsMessage && !flights) {
          aiReply = aiReply ? `${aiReply}\n\n${aiData.noFlightsMessage}` : aiData.noFlightsMessage;
        }

        // Budget Analysis card
        if (aiData.budgetAnalysis) {
          setTimeout(() => {
            const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            addMessage({ role: "assistant", text: "", time: t, intent: "general", budgetAnalysis: aiData.budgetAnalysis });
          }, 400);
        }

        // Country Comparison card
        if (aiData.countryComparison) {
          setTimeout(() => {
            const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            addMessage({ role: "assistant", text: "", time: t, intent: "general", countryComparison: aiData.countryComparison });
          }, 600);
        }

        // WhatsApp Autopilot Continuity
        if (aiData.waHandoff) {
          setTimeout(() => {
            const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            addMessage({ role: "assistant", text: "", time: t, intent: "general", waHandoff: aiData.waHandoff });
          }, 800);
        }

        // Auto-detect group booking intent from backend
        if (aiData.groupBookingIntent?.detected && aiData.flights && aiData.flights.length > 0) {
          const pax = aiData.groupBookingIntent.suggestedPax || 5;
          const groupHint = lang === "id"
            ? `👥 *Perjalanan grup terdeteksi!* RANIA melihat kamu merencanakan perjalanan untuk sekitar ${pax} orang. Klik tombol **"Group Booking"** di bawah kartu tiket untuk booking bersama sekaligus buat link split-payment untuk tiap anggota!`
            : lang === "en"
            ? `👥 *Group travel detected!* I see you're planning a trip for ~${pax} people. Click **"Group Booking"** on any ticket card below to book together and generate split-payment links for each member!`
            : lang === "pt"
            ? `👥 *Viagem em grupo detetada!* Vejo que está a planear para ~${pax} pessoas. Clique em **"Group Booking"** para reservar em conjunto e gerar links de pagamento dividido!`
            : `👥 *Viajen grupu detektadu!* Ha'u haree ita-boot planeia ba ~${pax} peserta. Klik **"Group Booking"** iha kartu bilhete hodi reserva hamutuk no kria link pagamentu ba kada membru!`;
          setTimeout(() => {
            const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            addMessage({ role: "assistant", text: groupHint, time: t, intent: "flight" });
          }, 900);
        }
      }

      // If backend didn't return flights, try client-side extraction as fallback
      if (!flights && (intent === "flight" || msg.toLowerCase().match(/voo|tiket|flight|aviaun|penerbangan/))) {
        const params = extractFlightSearch(msg);
        searchParams = searchParams || params;
        if (params.from && params.to && params.from !== params.to) {
          try {
            const flRes = await fetch(`${API}/rania/flights?from=${params.from}&to=${params.to}${params.date ? `&date=${params.date}` : ""}`);
            if (flRes.ok) {
              const flData = await flRes.json();
              flights = flData.flights;
              if (!searchParams) searchParams = { from: params.from, to: params.to, date: params.date };
            }
          } catch { /* ignore */ }
        }
      }

      if (intent === "weather" || msg.toLowerCase().match(/klima|cuaca|weather|temperatura/)) {
        const city = extractWeatherCity(msg);
        try {
          const wRes = await fetch(`${API}/rania/weather?city=${encodeURIComponent(city)}`);
          if (wRes.ok) weather = await wRes.json();
        } catch { /* ignore */ }
      }

      if (intent === "visa" || msg.toLowerCase().match(/visa|pasaporte|dokumentu/)) {
        const { from, to } = extractVisaCountries(msg);
        try {
          const vRes = await fetch(`${API}/rania/visa?from=${from}&to=${to}`);
          if (vRes.ok) visa = await vRes.json();
        } catch { /* ignore */ }
      }

      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      addMessage({ role: "assistant", text: aiReply, time: replyTime, intent, flights, weather, visa, searchParams });
      // 🔊 RANIA speaks the answer — Tier 2 (ElevenLabs) for critical events, Tier 1 (Web Speech) otherwise
      if (voiceEnabledRef.current) {
        const critical = isCriticalEvent(aiReply);
        hybridSpeak(aiReply, lang, {
          forcePremium: critical,
          volume: voiceVolumeRef.current,
          onSpeakStart: () => setIsSpeaking(true),
          onSpeakEnd: () => setIsSpeaking(false),
        });
        if (!isPremium) {
          voiceUsedRef.current += 1;
          setVoiceRepliesUsed(voiceUsedRef.current);
        }
      }

      // Email capture intentionally removed from chat flow — email collected at registration only
    } catch {
      addMessage({
        role: "assistant",
        text: "Hau la konsege konekta ba RANIA agora. Favor tenta fila-fali! 🙏",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, lang, addMessage]);

  const recognitionRef = useRef<any>(null);

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(lang === "id" ? "Browser tidak mendukung mikrofon. Gunakan Chrome." : lang === "en" ? "Browser doesn't support voice. Use Chrome." : "Browser la suporta mikrofone. Uza Chrome.");
      return;
    }
    // 🔔 Smart interrupt — stop RANIA talking when user starts speaking
    stopSpeech();
    // Stop if already listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const r = new SR();
    recognitionRef.current = r;
    // Multi-language detection: try all 4 languages
    r.lang = lang === "id" ? "id-ID" : lang === "pt" ? "pt-PT" : lang === "en" ? "en-US" : "pt-TL";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onstart = () => setIsListening(true);
    r.onend = () => { setIsListening(false); recognitionRef.current = null; };
    r.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    r.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript).join("");
      setInput(transcript);
      // Auto-send on final result
      if (e.results[e.results.length - 1].isFinal && transcript.trim()) {
        setTimeout(() => {
          setInput("");
          send(transcript.trim());
        }, 300);
      }
    };
    try { r.start(); } catch { setIsListening(false); }
  }, [isListening, lang, send]);

  const quickReplies: Record<Language, string[]> = {
    tet: ["✈️ Voo DIL → DPS", "🏨 Hotel iha Dili", "🌤️ Klima Dili", "📋 Visa ba Australia", "🗺️ Tour Atauro", "💳 Oinsá book?"],
    id: ["✈️ Tiket DIL → DPS", "🏨 Hotel di Dili", "🌤️ Cuaca Bali", "📋 Visa Australia", "🗺️ Tour Atauro", "💳 Cara booking?"],
    en: ["✈️ Flights DIL → DPS", "🏨 Hotels in Dili", "🌤️ Bali weather", "📋 Australia Visa", "🗺️ Atauro Tour", "💳 How to book?"],
    pt: ["✈️ Voos DIL → DPS", "🏨 Hotéis em Díli", "🌤️ Clima Bali", "📋 Visto Austrália", "🗺️ Tour Atauro", "💳 Como reservar?"],
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-start md:justify-end p-0 md:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" onClick={onClose} />
      <div className="relative z-10 w-full md:w-[420px] h-[92vh] md:h-[85vh] md:max-h-[780px] chat-slide-up">
        <div className="rania-chat-glass h-full rounded-t-[2rem] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/8">

          {/* HEADER */}
          <div className="flex-shrink-0 chat-header-premium">
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-2.5 pb-1 md:hidden">
              <div className="w-9 h-[3px] rounded-full bg-white/25" />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl p-[2px] bg-gradient-to-tr from-cyan-400 to-purple-600 shadow-lg shadow-cyan-500/20">
                    <img src={`${GH}/image/rania_avatar.png.webp`} alt="RANIA"
                      className="w-full h-full rounded-[12px] object-cover bg-black"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#040814]" style={{ animation: "blink 2s infinite" }} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white tracking-wide leading-tight">RANIA AI</h4>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ animation: "blink 2s infinite" }} />
                    Online · Travel AI Assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Language switcher inside chat */}
                <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-full px-1 py-0.5">
                  {(["tet", "id", "en", "pt"] as Language[]).map((l) => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all ${lang === l ? "rania-gradient-btn text-white" : "text-gray-500 hover:text-white"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm haptic-btn">✕</button>
              </div>
            </div>
            {/* Status bar — premium stats matching screenshot */}
            <div className="chat-status-bar">
              <span><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse mr-1" />✈ 200+ MASKAPAI</span>
              <span>🗺 50K+ RUTE</span>
              <span>🌍 100+ NEGARA</span>
              <span>🎧 24/7 SUPPORT</span>
            </div>
          </div>

          {/* DYNAMIC ISLAND */}
          <DynamicIsland mode={dynamicMode} flightCount={dynamicFlightCount} lang={lang} />

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 chat-scroll px-3 md:px-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} msg-in`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 p-[1.5px] mr-2 flex-shrink-0 mt-1 overflow-hidden">
                    <img src={`${GH}/image/rania_avatar.png.webp`} alt="R"
                      className="w-full h-full rounded-[9px] object-cover bg-black"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${msg.role === "user" ? "chat-bubble-user rounded-[20px] rounded-tr-[5px]" : "chat-bubble-ai rounded-[20px] rounded-tl-[5px]"}`}>
                    {msg.text}
                  </div>
                  {/* Flight cards — P1: Zero Wrong Flight Card guard */}
                  {msg.flights && msg.flights.filter(fl => {
                    const reqFrom = msg.searchParams?.from?.toUpperCase();
                    const reqTo = msg.searchParams?.to?.toUpperCase();
                    if (!reqFrom || !reqTo) return true;
                    const cf = (fl.from || "").toUpperCase();
                    const ct = (fl.to || "").toUpperCase();
                    return (cf === reqFrom && ct === reqTo) || (cf === reqTo && ct === reqFrom);
                  }).length > 0 && (
                    <FlightCards
                      flights={msg.flights.filter(fl => {
                        const reqFrom = msg.searchParams?.from?.toUpperCase();
                        const reqTo = msg.searchParams?.to?.toUpperCase();
                        if (!reqFrom || !reqTo) return true;
                        const cf = (fl.from || "").toUpperCase();
                        const ct = (fl.to || "").toUpperCase();
                        return (cf === reqFrom && ct === reqTo) || (cf === reqTo && ct === reqFrom);
                      })}
                      lang={lang} date={msg.searchParams?.date}
                      onBook={(fl) => {
                        bookingModeRef.current = true;
                        setBookingMode(true);
                        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const bookMsg = { role: "user" as const, text: `✈ ${fl.airline} ${fl.flightNum} · ${fl.from}→${fl.to}`, time: now };
                        const formMsg = { role: "assistant" as const, text: lang === "id" ? "Lengkapi form booking di bawah ini 📋" : lang === "en" ? "Please fill in the booking form below 📋" : lang === "pt" ? "Preencha o formulário abaixo 📋" : "Preenxe formuláriu booking iha okos 📋", time: now, bookingForm: fl };
                        setMessages(prev => [...prev, bookMsg, formMsg]);
                      }}
                      onGroupBook={(fl) => {
                        bookingModeRef.current = true;
                        setBookingMode(true);
                        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const bookMsg = { role: "user" as const, text: `👥 ${lang === "id" ? "Booking Grup" : lang === "en" ? "Group Booking" : "Grupo Booking"} — ${fl.airline} ${fl.flightNum} · ${fl.from}→${fl.to}`, time: now };
                        const formMsg = { role: "assistant" as const, text: lang === "id" ? "Isi form booking grup di bawah ini 👥📋" : lang === "en" ? "Fill in the group booking form below 👥📋" : lang === "pt" ? "Preencha o formulário de grupo abaixo 👥📋" : "Preenxe formuláriu grupu iha okos 👥📋", time: now, groupBookingForm: fl };
                        setMessages(prev => [...prev, bookMsg, formMsg]);
                      }}
                    />
                  )}
                  {/* Booking form in chat */}
                  {msg.bookingForm && (
                    <BookingFormInChat flight={msg.bookingForm} lang={lang}
                      onSuccess={(bookingId, name) => {
                        bookingModeRef.current = false;
                        setBookingMode(false);
                        setMessages(prev => prev.map((m, idx) =>
                          idx === messages.indexOf(msg)
                            ? { ...m, bookingForm: undefined, bookingSuccess: { bookingId, passengerName: name, from: msg.bookingForm!.from, to: msg.bookingForm!.to } }
                            : m
                        ));
                        if (onBookingSuccess) onBookingSuccess(bookingId);
                        // 🎙 Tier 2 — Premium voice for booking confirmation (branding moment)
                        const confirmText = lang === "id"
                          ? `Selamat! Tiket berhasil diterbitkan untuk ${name}. Booking ID ${bookingId}. Cek email untuk e-tiket Anda!`
                          : lang === "pt"
                          ? `Parabéns! Bilhete emitido com sucesso para ${name}. ID ${bookingId}. Verifique o email!`
                          : lang === "tet"
                          ? `Parabéns! Bilhete emitidu ba ${name}. Booking ID ${bookingId}. Haree email ba e-ticket!`
                          : `Congratulations! Ticket confirmed for ${name}. Booking ID ${bookingId}. Check your email!`;
                        hybridSpeak(confirmText, lang, { forcePremium: true, volume: voiceVolumeRef.current });
                      }}
                      onCancel={() => {
                        bookingModeRef.current = false;
                        setBookingMode(false);
                        setMessages(prev => prev.map((m, idx) =>
                          idx === messages.indexOf(msg) ? { ...m, bookingForm: undefined } : m
                        ));
                      }}
                    />
                  )}
                  {/* Group Booking form in chat */}
                  {msg.groupBookingForm && (
                    <GroupBookingForm flight={msg.groupBookingForm} lang={lang}
                      onSuccess={(groupData) => {
                        bookingModeRef.current = false;
                        setBookingMode(false);
                        setMessages(prev => prev.map((m, idx) =>
                          idx === messages.indexOf(msg)
                            ? { ...m, groupBookingForm: undefined, groupBookingSuccess: groupData }
                            : m
                        ));
                        if (onBookingSuccess) onBookingSuccess(groupData.bookingId);
                        // 🎙 Tier 2 — Premium voice for group booking confirmation
                        const grpText = lang === "id"
                          ? `Booking grup berhasil dikonfirmasi! ${groupData.groupSize} tiket diterbitkan. ID ${groupData.bookingId}. Link pembayaran sudah siap.`
                          : lang === "tet"
                          ? `Booking grupu konfirmadu! Tiket ${groupData.groupSize} emitidu. ID ${groupData.bookingId}.`
                          : `Group booking confirmed! ${groupData.groupSize} tickets issued. ID ${groupData.bookingId}.`;
                        hybridSpeak(grpText, lang, { forcePremium: true, volume: voiceVolumeRef.current });
                      }}
                      onCancel={() => {
                        bookingModeRef.current = false;
                        setBookingMode(false);
                        setMessages(prev => prev.map((m, idx) =>
                          idx === messages.indexOf(msg) ? { ...m, groupBookingForm: undefined } : m
                        ));
                      }}
                    />
                  )}
                  {/* Booking success */}
                  {msg.bookingSuccess && <BookingSuccessCard data={msg.bookingSuccess} lang={lang} />}
                  {msg.bookingSuccess && <TripTimeline dest={msg.bookingSuccess.to} from={msg.bookingSuccess.from} lang={lang} />}
                  {/* Group booking success */}
                  {msg.groupBookingSuccess && <GroupBookingSuccessCard data={msg.groupBookingSuccess} lang={lang} />}
                  {msg.groupBookingSuccess && <TripTimeline dest={msg.groupBookingSuccess.to} from={msg.groupBookingSuccess.from} lang={lang} />}
                  {/* Weather card */}
                  {msg.weather && <WeatherCard weather={msg.weather} />}
                  {/* Visa card */}
                  {msg.visa && <VisaCard visa={msg.visa} lang={lang} />}
                  {/* Travel Brain Budget Analysis Card */}
                  {msg.budgetAnalysis && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-[#0a1628] to-[#06101e]">
                      <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border-b border-white/5 flex items-center gap-2">
                        <span className="text-base">🧠</span>
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Travel Brain — Budget Analysis</span>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[
                            { label: "✈️ Flight", value: `~$${msg.budgetAnalysis.flightCost}` },
                            { label: "🏨 Hotel/night", value: `~$${msg.budgetAnalysis.hotelPerNight} (${msg.budgetAnalysis.hotelTier})` },
                            { label: "🍽️ Food", value: `~$${msg.budgetAnalysis.foodTotal}` },
                            { label: "🚌 Transport", value: `~$${msg.budgetAnalysis.transportTotal}` },
                            { label: "🛂 Visa", value: msg.budgetAnalysis.visaFee > 0 ? `~$${msg.budgetAnalysis.visaFee}` : "Free ✅" },
                            { label: "📅 Duration", value: `${msg.budgetAnalysis.duration} days` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-white/5 rounded-lg px-2.5 py-2">
                              <div className="text-[10px] text-gray-500">{label}</div>
                              <div className="text-xs font-semibold text-gray-200">{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className={`rounded-xl px-3 py-2 flex items-center justify-between mb-2 ${msg.budgetAnalysis.feasible ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                          <span className="text-xs text-gray-300">Total Estimate</span>
                          <span className={`text-sm font-bold ${msg.budgetAnalysis.feasible ? "text-emerald-400" : "text-red-400"}`}>
                            ~${msg.budgetAnalysis.total} / ${msg.budgetAnalysis.budget} budget
                          </span>
                        </div>
                        {msg.budgetAnalysis.suggestion && (
                          <p className="text-[11px] text-gray-400 leading-relaxed">{msg.budgetAnalysis.suggestion}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Smart Travel Advisor — Country Comparison */}
                  {msg.countryComparison && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-[#0a1628] to-[#06101e]">
                      <div className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-blue-600/10 border-b border-white/5 flex items-center gap-2">
                        <span className="text-base">🌍</span>
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Smart Travel Advisor</span>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">{msg.countryComparison}</div>
                      </div>
                    </div>
                  )}
                  {/* WhatsApp Autopilot Continuity */}
                  {msg.waHandoff && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-green-500/20 bg-gradient-to-br from-[#052010] to-[#06101e] p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl flex-shrink-0">💬</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-green-400 mb-0.5">WhatsApp Autopilot</div>
                          <div className="text-[11px] text-gray-400">Lanjutkan percakapan ini di WhatsApp — riwayat pencarian tetap tersimpan</div>
                        </div>
                        <a href={msg.waHandoff} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0">
                          Buka WA ↗
                        </a>
                      </div>
                    </div>
                  )}
                  {/* WhatsApp handoff — ONLY shown after confirmed booking, not general chat */}
                  {msg.role === "assistant" && msg.bookingSuccess && (
                    <div className="mt-1.5">
                      <WhatsAppHandoff
                        lang={lang}
                        variant="inline"
                        context={{ bookingId: msg.bookingSuccess.bookingId, flightFrom: msg.bookingSuccess.from, flightTo: msg.bookingSuccess.to }}
                      />
                    </div>
                  )}
                  <span className={`text-[9px] text-gray-600 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start msg-in">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 p-[1.5px] mr-2 flex-shrink-0 mt-1">
                  <div className="w-full h-full rounded-[9px] bg-black" />
                </div>
                <div className="chat-bubble-ai rounded-[20px] rounded-tl-[5px] px-5 py-4">
                  <div className="flex gap-1.5 items-center">
                    {[0, 200, 400].map((d) => (
                      <div key={d} className="w-2 h-2 rounded-full bg-cyan-400/70 typing-dot" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* QUICK REPLIES */}
          <div className="flex-shrink-0 px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide pt-1">
            {quickReplies[lang].map((qr, i) => (
              <button key={i} onClick={() => send(qr)} className="quick-reply-premium">
                {qr}
              </button>
            ))}
          </div>

          {/* PREMIUM UPGRADE BANNER — appears near 300-msg limit, hidden during booking */}
          {userMsgCountRef.current >= 250 && !bookingMode && (
            <div className="flex-shrink-0 mx-3 mb-2 rounded-xl overflow-hidden border border-amber-400/30"
              style={{ background: "linear-gradient(135deg,rgba(251,191,36,0.1),rgba(168,85,247,0.1))" }}>
              <div className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#a855f7)" }}>⚡</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-amber-300 leading-tight">
                    {lang === "id" ? `Hampir batas ${userMsgCountRef.current}/300 pesan!` :
                     lang === "pt" ? `Quase no limite ${userMsgCountRef.current}/300!` :
                     lang === "tet" ? `Besik limite ${userMsgCountRef.current}/300!` :
                     `Near limit: ${userMsgCountRef.current}/300 messages!`}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {lang === "id" ? "Upgrade Premium $10/bln — chat unlimited" :
                     lang === "pt" ? "Upgrade Premium $10/mês — chat ilimitado" :
                     lang === "tet" ? "Upgrade Premium $10/fulan — chat unlimited" :
                     "Upgrade Premium $10/mo — unlimited chat"}
                  </div>
                </div>
                <a href="mailto:info.lusanimar@gmail.com?subject=RANIA%20Premium%20Upgrade"
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black text-black whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#a855f7)" }}>
                  Upgrade →
                </a>
              </div>
              <div className="bg-black/20 h-1.5 mx-3 mb-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min((userMsgCountRef.current / 300) * 100, 100)}%`, background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} />
              </div>
            </div>
          )}

          {/* INPUT */}
          <div className="flex-shrink-0 px-3 pb-4 pt-1">

            {/* 🔊 RANIA speaking indicator */}
            {isSpeaking && !isListening && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.18)" }}>
                <div className="flex gap-[2px] items-end h-3.5">
                  {[1,2,3,4,5,4,3].map((h, i) => (
                    <div key={i} className="w-[3px] rounded-full"
                      style={{ height: `${h * 14}%`, background: "#00e5ff", animation: `voiceBar 0.4s ease-in-out ${i * 0.07}s infinite alternate`, minHeight: 3 }} />
                  ))}
                </div>
                <span className="text-[10px] font-semibold" style={{ color: "#00e5ff" }}>
                  {lang === "id" ? "RANIA sedang bicara..." : lang === "en" ? "RANIA is speaking..." : lang === "pt" ? "RANIA está falando..." : "RANIA koalia..."}
                </span>
                <button onClick={stopSpeech}
                  className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105 active:scale-95"
                  style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.25)", color: "#00e5ff" }}>
                  ⏹ Stop
                </button>
              </div>
            )}

            {/* 🎤 Listening indicator */}
            {isListening && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/25 rounded-xl">
                <div className="flex gap-0.5 items-end h-4">
                  {[1,2,3,4,5].map((_, i) => (
                    <div key={i} className="w-0.5 bg-red-400 rounded-full"
                      style={{ height: `${35 + i * 13}%`, animation: `voiceBar 0.45s ease-in-out ${i * 0.09}s infinite alternate` }} />
                  ))}
                </div>
                <span className="text-[11px] text-red-300 font-semibold">
                  {lang === "id" ? "Sedang mendengarkan..." : lang === "en" ? "Listening..." : lang === "pt" ? "Ouvindo..." : "Hau rona..."}
                </span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              </div>
            )}

            {/* 🔊 Voice controls bar */}
            <div className="flex items-center gap-2 mb-2 px-1">
              {/* Voice toggle */}
              <button
                onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) stopSpeech(); }}
                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full transition-all flex-shrink-0"
                style={voiceEnabled
                  ? { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.28)", color: "#67e8f9" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
                {voiceEnabled ? "🔊 ON" : "🔇 OFF"}
              </button>

              {/* Volume slider */}
              {voiceEnabled && !isPremium && voiceRepliesUsed < FREE_VOICE_LIMIT && (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[11px] flex-shrink-0">
                    {voiceVolume < 0.05 ? "🔇" : voiceVolume < 0.45 ? "🔉" : "🔊"}
                  </span>
                  <input
                    type="range" min="0" max="1" step="0.05" value={voiceVolume}
                    onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 cursor-pointer"
                    style={{ accentColor: "#00e5ff" }}
                  />
                  <span className="text-[9px] text-gray-600 flex-shrink-0 w-6 text-right">
                    {Math.round(voiceVolume * 100)}%
                  </span>
                </div>
              )}

              {/* Volume slider for premium */}
              {voiceEnabled && isPremium && (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[11px] flex-shrink-0">
                    {voiceVolume < 0.05 ? "🔇" : voiceVolume < 0.45 ? "🔉" : "🔊"}
                  </span>
                  <input
                    type="range" min="0" max="1" step="0.05" value={voiceVolume}
                    onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 cursor-pointer"
                    style={{ accentColor: "#a855f7" }}
                  />
                  <span className="text-[9px] flex-shrink-0 font-bold" style={{ color: "#a855f7" }}>
                    ∞ PRO
                  </span>
                </div>
              )}

              {/* Voice usage counter — free users */}
              {voiceEnabled && !isPremium && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {voiceRepliesUsed >= FREE_VOICE_LIMIT ? (
                    <a href="mailto:info.lusanimar@gmail.com?subject=RANIA%20Premium%20Voice%20Upgrade"
                      className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full animate-pulse"
                      style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(168,85,247,0.2))", border: "1px solid rgba(245,158,11,0.4)", color: "#fbbf24" }}>
                      🔒 Upgrade → Unlimited
                    </a>
                  ) : (
                    <div className="text-[9px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        background: voiceRepliesUsed >= FREE_VOICE_LIMIT - 1 ? "rgba(251,146,60,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${voiceRepliesUsed >= FREE_VOICE_LIMIT - 1 ? "rgba(251,146,60,0.3)" : "rgba(255,255,255,0.08)"}`,
                        color: voiceRepliesUsed >= FREE_VOICE_LIMIT - 1 ? "#fb923c" : "#6b7280",
                      }}>
                      🎙 {FREE_VOICE_LIMIT - voiceRepliesUsed}/{FREE_VOICE_LIMIT}
                    </div>
                  )}
                </div>
              )}
              {/* Premium TTS budget indicator — shows when ElevenLabs is active */}
              {voiceEnabled && (() => {
                const vs = getVoiceStats();
                const pct = vs.monthlyBudgetPct;
                if (pct === 0) return null;
                return (
                  <div className="flex items-center gap-1 flex-shrink-0"
                    title={`ElevenLabs TTS: ${vs.monthlyCharsUsed.toLocaleString()}/${vs.monthlyCharsLimit.toLocaleString()} chars · ~$${vs.estimatedCostUsd}`}>
                    <div className="text-[9px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                      style={{
                        background: pct >= 80 ? "rgba(239,68,68,0.1)" : "rgba(167,139,250,0.1)",
                        border: `1px solid ${pct >= 80 ? "rgba(239,68,68,0.4)" : "rgba(167,139,250,0.3)"}`,
                        color: pct >= 80 ? "#f87171" : "#a78bfa",
                      }}>
                      ✨ {pct >= 80 ? "⚠ " : ""}{pct}%
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Voice limit reached — upgrade banner */}
            {voiceEnabled && !isPremium && voiceRepliesUsed >= FREE_VOICE_LIMIT && (
              <div className="mb-2 px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(168,85,247,0.1))", border: "1px solid rgba(245,158,11,0.25)" }}>
                <span className="text-[11px]">🔒</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-amber-400">
                    {lang === "id" ? `Suara gratis habis (${FREE_VOICE_LIMIT}/${FREE_VOICE_LIMIT})` : lang === "tet" ? `Lian free kompletu (${FREE_VOICE_LIMIT}/${FREE_VOICE_LIMIT})` : `Free voice used (${FREE_VOICE_LIMIT}/${FREE_VOICE_LIMIT})`}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    {lang === "id" ? "Upgrade Premium biar RANIA terus ngobrol sama kamu 🎙" : lang === "tet" ? "Upgrade Premium atu RANIA kontinua koalia ho ó 🎙" : "Upgrade to keep chatting with RANIA's voice 🎙"}
                  </div>
                </div>
                <a href="mailto:info.lusanimar@gmail.com?subject=RANIA%20Premium%20Voice%20Upgrade"
                  className="flex-shrink-0 text-[9px] font-black px-2.5 py-1.5 rounded-lg text-black"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#a855f7)" }}>
                  Upgrade →
                </a>
              </div>
            )}

            {/* Main input row */}
            <div className="chat-input-glass flex items-center gap-2 px-3 py-2">
              <input ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                onFocus={() => stopSpeech()}
                placeholder={isListening
                  ? (lang === "id" ? "Bicara sekarang..." : lang === "en" ? "Speak now..." : lang === "pt" ? "Fale agora..." : "Koalia agora...")
                  : t.chatPlaceholder}
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 min-w-0" />

              {/* 🎤 Mic button */}
              <button onClick={startVoice} title={isListening ? "Tap to stop" : "Speak to RANIA"}
                className={`relative w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-all border overflow-hidden ${
                  isListening
                    ? "mic-btn-active border-red-500/60 text-red-300"
                    : "border-cyan-400/20 bg-white/5 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-300 hover:bg-cyan-400/8"
                }`}>
                {isListening && <>
                  <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/15" />
                  <span className="absolute inset-0 rounded-xl animate-pulse bg-red-500/10" />
                </>}
                <svg className="w-4 h-4 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H9v2h6v-2h-2v-1.06A9 9 0 0 0 21 12v-2h-2z"/>
                </svg>
              </button>

              {/* ➤ Send button */}
              <button onClick={() => send()}
                disabled={!input.trim() || isTyping}
                className={`w-9 h-9 rounded-xl flex-shrink-0 rania-gradient-btn flex items-center justify-center transition-all active:scale-90 disabled:opacity-35 haptic-btn ${input.trim() && !isTyping ? "send-btn-active hover:scale-105" : ""}`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Destinations ──────────────────────────────────────────────────────────────
const DESTINATIONS = [
  { city: "Bali", country: "Indonesia · DPS", badge: "🔥 HOT", iata: "DPS", image: "https://bankraya.co.id/uploads/insights/jO3TRUmMuBAuyilKHgu9Ovjfs3nFoubWiSSjB3Pn.jpg" },
  { city: "Singapore", country: "Singapore · SIN", badge: "✨ DIRECT", iata: "SIN", image: "https://cdn.sejutacita.id/dealls-blog-cms/5_ezgif_com_jpg_to_webp_converter_8f85442167.webp" },
  { city: "Tokyo", country: "Japan · NRT", badge: "💥 -15%", iata: "NRT", image: "https://cdn.prod.website-files.com/60a267ddf8769efc052be8bf/6719dc54690283674918b131_Rainbow-Bridge.jpeg" },
  { city: "Marobo", country: "Timor-Leste", badge: "♨️ HOT SPRING", iata: null, image: "https://thumbs.dreamstime.com/b/eau-de-source-chaude-naturelle-marobo-vue-sur-les-bains-thermaux-naturels-bobonaro-timor-leste-162487685.jpg?w=992" },
  { city: "Cristo Rei", country: "Timor-Leste · DIL", badge: "⛪ ICONIC", iata: null, image: "https://www.visitsoutheastasia.travel/wp-content/uploads/2025/11/Landmarks-Sights1_Cristo-Rei-Statue_TL-690x400.jpg" },
  { city: "Jaco Island", country: "Timor-Leste", badge: "🏝️ PARADISE", iata: null, image: `${GH}/images/destinations/jaco.jpg` },
  { city: "Atauro", country: "Timor-Leste", badge: "🤿 DIVE SPOT", iata: null, image: `${GH}/images/destinations/atauro.jpg` },
  { city: "Darwin", country: "Australia · DRW", badge: "🦘 GATEWAY", iata: "DRW", image: "https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?q=80&w=800" },
  { city: "Kupang", country: "Indonesia · KOE", badge: "🌺 NTT", iata: "KOE", image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800" },
  { city: "Labuan Bajo", country: "Indonesia · LBJ", badge: "🐉 KOMODO", iata: "LBJ", image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=800" },
  { city: "Sydney", country: "Australia · SYD", badge: "🌊 BEACH", iata: "SYD", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800" },
  { city: "Oecusse", country: "Timor-Leste", badge: "🌿 ENIGMATIC", iata: null, image: `${GH}/images/destinations/oecusse.jpg` },
];

const SERVICES = [
  { id: "flights", icon: `${GH}/images/Flights.webp`, title: "Flights", desc: "Global routes · 1,400+ airports" },
  { id: "hotels", icon: `${GH}/images/Hotels.webp`, title: "Hotels", desc: "Best prices guaranteed", badge: "HOT" },
  { id: "car-rental", icon: `${GH}/images/Car%20Rental.webp`, title: "Car Rental", desc: "Airport → Hotel · WhatsApp ready", badge: "INSTANT" },
  { id: "deals", icon: `${GH}/images/Deals.webp`, title: "Deals", desc: "Exclusive limited offers" },
  { id: "insurance", icon: `${GH}/images/Travel-Insurance.webp`, title: "Insurance", desc: "Full travel protection", badge: "SAFE" },
  { id: "weather", icon: `${GH}/images/Weather.webp`, title: "Weather", desc: "Real-time destination weather" },
];

// ── Live Weather Widget (replaces static) ────────────────────────────────────
function LiveWeatherWidget() {
  const [city, setCity] = useState("dili");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/rania/weather?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d) => { setWeather(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [city]);

  const cities = ["dili", "bali", "singapore", "jakarta", "sydney", "tokyo", "dubai"];

  return (
    <div className="rania-glass-card rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/4">
        <div className="text-xs font-bold text-gray-400">🌤️ Real-Time Weather</div>
        <select value={city} onChange={(e) => setCity(e.target.value)}
          className="bg-white/4 border border-white/7 rounded-lg px-2 py-1 text-[10px] text-white/78 outline-none cursor-pointer capitalize">
          {cities.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-8 h-8 border-2 border-t-cyan-400/80 border-cyan-400/18 rounded-full animate-spin" />
          </div>
        ) : weather ? (
          <>
            <div className="mb-2"><div className="text-[9px] text-gray-500 mb-0.5">📍 Lokasaun</div><div className="text-base font-semibold text-white">{weather.city}</div></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{weather.emoji}</div>
              <div><div className="font-orbitron text-4xl font-bold text-white">{weather.temp}<sup className="text-xl text-gray-500">°C</sup></div><div className="text-xs text-gray-400 mt-0.5">{weather.description}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ icon: "💧", l: "Humidity", v: `${weather.humidity}%` }, { icon: "🌧️", l: "Udan", v: `${weather.rainChance}%` }, { icon: "💨", l: "Anin", v: `${weather.wind} km/h` }, { icon: "🌡️", l: "Sente", v: `${weather.feelsLike}°C` }].map((w, i) => (
                <div key={i} className="bg-white/3 border border-white/4 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-base">{w.icon}</span>
                  <div><div className="text-[8px] text-gray-500">{w.l}</div><div className="text-xs font-semibold text-white/88">{w.v}</div></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 text-xs py-8">Weather unavailable</div>
        )}
      </div>
    </div>
  );
}

// ── YouTube lazy ──────────────────────────────────────────────────────────────
function YouTubeVideo() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsLoaded(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-cyan-400/12 rania-video-frame">
      {isLoaded ? (
        <div className="relative aspect-video bg-black">
          {!isPlaying ? (
            <div className="w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
              <img src="https://img.youtube.com/vi/bnNDG2J8tVA/maxresdefault.jpg" alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-all flex items-center justify-center">
                <div className="w-20 h-20 rounded-full rania-gradient-btn flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:shadow-[0_0_48px_rgba(0,229,255,0.7)] transition-all">
                  <svg className="w-10 h-10 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </div>
          ) : (
            <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/bnNDG2J8tVA?autoplay=1&rel=0" title="RANIA" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          )}
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-r from-cyan-900/15 to-purple-900/15 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-t-cyan-400/80 border-cyan-400/18 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ── Trip Mode — Boarding Pass Countdown Card ──────────────────────────────────
function TripModeCard({ bookingId, lang, onClose }: { bookingId: string; lang: Language; onClose: () => void }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [booking, setBooking] = useState<{ from: string; to: string; airline: string; depart: string; passengerName: string; flightNum: string } | null>(null);

  // Fetch booking from API
  useEffect(() => {
    if (!bookingId) return;
    fetch(`${API}/rania/booking/${bookingId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBooking(d); })
      .catch(() => {});
  }, [bookingId]);

  // Countdown to departure (48h from now as demo if no real date)
  useEffect(() => {
    const target = Date.now() + 48 * 3600 * 1000;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const from = booking?.from || "DIL";
  const to = booking?.to || "DPS";
  const airline = booking?.airline || "Aero Dili";
  const depart = booking?.depart || "--:--";
  const name = booking?.passengerName || "Passenger";
  const flNum = booking?.flightNum || bookingId;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm">
        {/* BOARDING PASS card */}
        <div className="rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,200,255,0.3)]"
          style={{ background: "linear-gradient(145deg,#040c1e,#071428)" }}>
          {/* Top strip */}
          <div className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] font-black text-white/70 tracking-[0.25em]">BOARDING PASS</div>
              <div className="text-[9px] font-black text-white/70 tracking-wider">{airline}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-4xl font-black text-white tracking-wider">{from}</div>
                <div className="text-[9px] text-white/60 font-semibold mt-0.5">ORIGIN</div>
              </div>
              <div className="flex-1 flex items-center justify-center gap-1 px-3">
                <div className="flex-1 h-px bg-white/25" />
                <span className="text-white text-lg">✈</span>
                <div className="flex-1 h-px bg-white/25" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white tracking-wider">{to}</div>
                <div className="text-[9px] text-white/60 font-semibold mt-0.5">DESTINATION</div>
              </div>
            </div>
          </div>

          {/* Ticket perforation */}
          <div className="flex items-center -my-px">
            <div className="w-5 h-5 rounded-full bg-[#040c1e] flex-shrink-0 -ml-2.5" />
            <div className="flex-1 border-t-2 border-dashed border-white/10" />
            <div className="w-5 h-5 rounded-full bg-[#040c1e] flex-shrink-0 -mr-2.5" />
          </div>

          {/* Details section */}
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "PASSENGER", value: name.split(" ")[0].toUpperCase() },
                { label: "FLIGHT", value: flNum.substring(0, 8) },
                { label: "DEPART", value: depart },
              ].map((f, i) => (
                <div key={i}>
                  <div className="text-[8px] text-gray-500 tracking-widest mb-0.5">{f.label}</div>
                  <div className="text-[11px] font-black text-white truncate">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Countdown timer */}
            <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)" }}>
              <div className="text-[9px] text-cyan-400/70 font-bold tracking-widest mb-2">
                {lang === "id" ? "KEBERANGKATAN DALAM" : lang === "pt" ? "PARTIDA EM" : lang === "tet" ? "SAIDA IHA" : "DEPARTURE IN"}
              </div>
              <div className="flex items-center justify-center gap-2">
                {[
                  { v: pad(countdown.days), l: lang === "id" ? "HARI" : "DAYS" },
                  { v: pad(countdown.hours), l: lang === "id" ? "JAM" : "HRS" },
                  { v: pad(countdown.mins), l: lang === "id" ? "MENIT" : "MIN" },
                  { v: pad(countdown.secs), l: lang === "id" ? "DETIK" : "SEC" },
                ].map((c, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="font-orbitron text-2xl font-black text-cyan-300 tabular-nums">{c.v}</div>
                    <div className="text-[8px] text-gray-500 tracking-widest">{c.l}</div>
                    {i < 3 && <div className="absolute text-cyan-400 text-lg font-black" style={{ marginLeft: "calc(100% + 4px)" }}>:</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              {[
                { icon: "🛂", label: lang === "id" ? "Paspor valid 6+ bulan" : "Valid passport 6+ months", done: true },
                { icon: "🧳", label: lang === "id" ? "Bagasi checked in" : "Baggage checked in", done: false },
                { icon: "📱", label: lang === "id" ? "Check-in online (24h sebelum)" : "Online check-in (24h before)", done: false },
                { icon: "🍱", label: lang === "id" ? "Meal preference saved" : "Meal preference saved", done: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-colors ${item.done ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300" : "border-white/6 bg-white/3 text-gray-400"}`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <span>{item.done ? "✅" : "○"}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <a href="mailto:info.lusanimar@gmail.com?subject=SANIMAR%20Travel%20Inquiry"
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }}>
                ✉️ {lang === "id" ? "Email Sanimar" : "Email Sanimar"}
              </a>
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:text-white transition-colors">
                {lang === "id" ? "Tutup" : "Close"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [lang, setLang] = useState<Language>("tet");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRadarMobile, setShowRadarMobile] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeNav, setActiveNav] = useState("search");
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; delay: number; dur: number }[]>([]);
  // Search widget results
  const [searchResults, setSearchResults] = useState<{ flights: FlightCard[]; from: string; to: string; date: string } | null>(null);
  const [bookingFlight, setBookingFlight] = useState<FlightCard | null>(null);
  // Booking status tracker
  const [statusBookingId, setStatusBookingId] = useState<string | null>(null);
  const [tripModeBookingId, setTripModeBookingId] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const t = T[lang];

  // Gate chat behind one-time registration
  const openChat = useCallback(() => {
    const registered = localStorage.getItem("rania_registered");
    if (registered) {
      setIsChatOpen(true);
    } else {
      setShowRegister(true);
    }
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    setParticles([...Array(18)].map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * 100, delay: Math.random() * 10, dur: 15 + Math.random() * 10 })));
  }, []);

  // ─── Welcome Voice — fires once per session on first page load ───────────
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerWelcomeVoice(lang);
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = [
    { icon: "🌐", value: "1,400+", label: t.airportsStat },
    { icon: "✈️", value: "500+", label: t.airlinesStat },
    { icon: "🕐", value: "Live", label: t.realtimeStat },
    { icon: "🎧", value: "24/7", label: t.supportStat },
  ];

  const routes = [
    { thumb: "🏝️", route: "Dili (DIL) → Bali (DPS)", meta: "Direct · 2h · Daily", price: "from $180", tag: "DIRECT" },
    { thumb: "🌴", route: "Dili (DIL) → Singapore (SIN)", meta: "1 Stop · 4h", price: "from $150", tag: "HOT" },
    { thumb: "🏙️", route: "Dili (DIL) → Darwin (DRW)", meta: "Direct · 1h 30m", price: "from $95", tag: "DIRECT" },
    { thumb: "🗼", route: "Dili (DIL) → Tokyo (NRT)", meta: "1 Stop · 8h 20m", price: "from $420", tag: "" },
  ];

  const bottomNavItems = [
    { id: "search", icon: "🔍", label: t.navSearch },
    { id: "explore", icon: "🌍", label: "Explore" },
    { id: "history", icon: "🕐", label: t.navHistory },
    { id: "profile", icon: "👤", label: t.navProfile },
  ];

  return (
    <div className="min-h-screen bg-[#050812] text-white overflow-x-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Cursor */}
      <div className="custom-cursor hidden lg:block" style={{ left: mousePos.x - 6, top: mousePos.y - 6 }} />
      <div className="custom-cursor-ring hidden lg:block" style={{ left: mousePos.x - 18, top: mousePos.y - 18 }} />

      {/* Aurora */}
      <div className="aurora-bg">
        <div className="aurora-blob" style={{ width: "700px", height: "500px", background: "radial-gradient(#00e5ff,transparent)", top: "-100px", left: "-100px" }} />
        <div className="aurora-blob" style={{ width: "600px", height: "600px", background: "radial-gradient(#a855f7,transparent)", top: "20%", right: "-150px", animationDuration: "28s" }} />
        <div className="aurora-blob" style={{ width: "500px", height: "400px", background: "radial-gradient(#0ea5e9,transparent)", bottom: "-50px", left: "30%", animationDuration: "18s" }} />
      </div>
      <div className="grid-overlay" />
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div key={p.id} className="absolute w-1 h-1 bg-cyan-400/15 rounded-full animate-float"
            style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
        ))}
      </div>

      {/* TOP NAV */}
      <nav className="fixed top-0 w-full z-[200] rania-topnav">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between" style={{ height: "60px" }}>
          <div className="flex items-center gap-2.5">
            <img src={`${GH}/image/logo-sanimar-3d.png.webp`} alt="LU SANIMAR Travel"
              className="h-10 w-auto rounded-xl border border-white/20 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div>
              <div className="font-orbitron text-base font-black tracking-tight text-white leading-none">LU SANIMAR</div>
              <div className="text-[9px] text-cyan-400 font-bold tracking-[0.2em] uppercase">Travel Intelligence</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTripModeBookingId("")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/6 text-cyan-300 hover:bg-cyan-400/15 transition-all text-[10px] font-bold tracking-wide">
              🛫 Trip Mode
            </button>
            <a href="/explore"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/12 transition-all text-[10px] font-bold tracking-wide">
              🌍 Explore
            </a>
            <a href="/flight-routes"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-400/25 bg-orange-400/6 text-orange-300 hover:bg-orange-400/15 transition-all text-[10px] font-bold tracking-wide">
              🗺 Route Map
            </a>
            <a href="/admin"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/12 bg-white/4 text-white/60 hover:text-white hover:border-cyan-400/40 hover:bg-cyan-400/6 transition-all text-[10px] font-bold tracking-wide">
              🔐 Admin
            </a>
            <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-full px-1 py-1">
              {(["tet", "id", "en", "pt"] as Language[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-200 ${lang === l ? "rania-gradient-btn text-black" : "text-gray-500 hover:text-white"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex flex-col px-5 md:px-10 pt-20 pb-8 overflow-hidden">
        {/* Hero background */}
        <div className="absolute inset-0 z-0">
          <img src={`${GH}/image/rania.png.webp`} alt="RANIA AI"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 25%", filter: "brightness(1.2) contrast(1.1) saturate(1.1)" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(5,8,18,0.97) 0%,rgba(5,8,18,0.90) 45%,rgba(5,8,18,0.6) 70%,rgba(5,8,18,0.2) 90%,transparent 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg,rgba(5,8,18,1) 0%,rgba(5,8,18,0.6) 30%,transparent 60%)" }} />
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-lg mt-2 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-cyan-400/20 rounded-full text-[10px] tracking-wider bg-cyan-400/4 mb-5">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">{t.heroBadge}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-3 leading-[1.05] tracking-tight">
            <span className="text-white">{t.heroHello}</span>{" "}
            <span className="rania-name-glow" style={{ textShadow: "0 0 12px rgba(79,209,255,1), 0 0 32px rgba(79,209,255,0.7), 0 0 60px rgba(79,209,255,0.35)" }}>{t.rania}</span>
          </h1>
          <p className="text-white/90 text-[15px] font-medium leading-[1.7] max-w-md mb-4"
             style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8), 0 2px 20px rgba(0,0,0,0.6)" }}>
            {t.heroDesc}
          </p>
          <div className="flex gap-5 mb-2">
            {stats.map((s, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="font-orbitron text-xl font-black bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-[9px] text-gray-300 font-semibold mt-0.5 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FLIGHT SEARCH WIDGET ── */}
        <div id="hero-flight-search" className="relative z-10 mb-4">
          <FlightSearchWidget lang={lang} onResults={(flights, from, to, date) => {
            setSearchResults({ flights, from, to, date });
            setTimeout(() => searchResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          }} />
        </div>

        {/* Quick: Ask RANIA AI bar */}
        <div className="relative z-10 max-w-4xl mx-auto w-full px-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 hover:border-cyan-400/25 transition-all cursor-pointer" onClick={() => openChat()}>
              <div className="w-7 h-7 rounded-lg rania-gradient-btn flex items-center justify-center flex-shrink-0">
                <img src={`${GH}/image/rania_avatar.png.webp`} alt="R" className="w-5 h-5 rounded-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.parentElement as HTMLElement).innerHTML = "🤖"; }} />
              </div>
              <span className="text-sm text-gray-500 flex-1">
                {lang === "tet" ? "Husu RANIA AI — voo, hotel, visa, tour..." : lang === "id" ? "Tanya RANIA AI — penerbangan, hotel, visa, tour..." : lang === "pt" ? "Pergunte à RANIA AI — voos, hotel, visto, tour..." : "Ask RANIA AI — flights, hotels, visa, tours..."}
              </span>
              <span className="text-xs font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-lg">AI</span>
            </div>
            <button onClick={() => setStatusBookingId("")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/8 text-orange-400 text-xs font-bold hover:bg-orange-500/15 transition-all whitespace-nowrap">
              📋 {lang === "id" ? "Cek Status" : lang === "tet" ? "Verifika Status" : lang === "pt" ? "Verificar Status" : "Track Booking"}
            </button>
          </div>
        </div>
      </section>

      {/* PROMO CAROUSEL */}
      <PromoCarousel lang={lang} onOpenChat={openChat} />

      {/* SEARCH RESULTS (from Flight Widget) */}
      {searchResults && (
        <div ref={searchResultsRef} className="relative z-20 px-4 md:px-10 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-orbitron text-sm font-black text-white">
                {searchResults.from} → {searchResults.to}
                <span className="ml-2 text-orange-400 text-[10px] font-bold">{new Date(searchResults.date).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {searchResults.flights.length > 0
                  ? `${searchResults.flights.length} ${lang === "id" ? "penerbangan ditemukan" : "flights found"}`
                  : (lang === "id" ? "Tidak ada penerbangan langsung — RANIA dapat bantu cari alternatif" : "No direct flights found — RANIA can help find alternatives")}
              </div>
            </div>
            <button onClick={() => setSearchResults(null)} className="text-gray-600 hover:text-white text-lg">✕</button>
          </div>
          {searchResults.flights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.flights.map((fl, i) => (
                <div key={i} className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-orange-500/30 hover:bg-orange-500/4 transition-all cursor-pointer group"
                  onClick={() => { setBookingFlight(fl); openChat(); }}>
                  <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-5 rounded bg-white/10 flex items-center justify-center text-[8px] font-black text-orange-400">{fl.airlineCode}</div>
                      <span className="text-xs font-bold text-white">{fl.airline}</span>
                    </div>
                    <span className="font-mono text-[9px] text-gray-500">{fl.flightNum}</span>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-orbitron text-xl font-black text-white">{fl.depart}</div>
                        <div className="text-[9px] text-gray-500">{fl.from}</div>
                      </div>
                      <div className="text-center text-gray-600">
                        <div className="text-[9px]">{fl.duration}</div>
                        <div className="border-t border-gray-700 w-12 my-1" />
                        <div className="text-[9px]">{Number(fl.stops) === 0 ? "Direct" : `${fl.stops} stop`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron text-xl font-black text-white">{fl.arrive}</div>
                        <div className="text-[9px] text-gray-500">{fl.to}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-gray-600">from</div>
                        <div className="font-orbitron text-lg font-black text-emerald-400">${fl.price}</div>
                      </div>
                      <button className="px-3 py-1.5 rounded-xl text-xs font-black text-white group-hover:scale-105 transition-all"
                        style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                        {lang === "id" ? "Pesan" : lang === "tet" ? "Hasai" : "Book"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/2 border border-white/6 rounded-2xl">
              <div className="text-4xl mb-3">✈️</div>
              <div className="text-sm text-white font-bold mb-2">
                {lang === "id" ? "Tidak ada rute langsung" : "No direct route found"}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                {lang === "id" ? "RANIA bisa carikan penerbangan terbaik dengan koneksi" : "RANIA can find the best connecting flights for you"}
              </div>
              <button onClick={() => openChat()}
                className="px-5 py-2.5 rounded-xl font-black text-white text-sm"
                style={{ background: "linear-gradient(135deg,#00e5ff,#9b59ff)" }}>
                {lang === "id" ? "Tanya RANIA AI →" : "Ask RANIA AI →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* MARQUEE */}
      <div className="relative z-10 py-3 overflow-hidden border-y border-white/4 bg-black/20 mt-6">
        <div className="flex gap-10 animate-marquee whitespace-nowrap">
          {[1, 2, 3].map((n) => (
            <div key={`asean-${n}`} className="flex items-center gap-2.5 px-8">
              <img src={`${GH}/images/asean%20png.webp`} alt="ASEAN" className="h-6 w-auto rounded-sm border border-white/20" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <span className="font-orbitron text-sm text-cyan-400 ml-2">ASEAN</span>
              <span className="text-xs text-gray-500 ml-2">11 Countries</span>
            </div>
          ))}
          {[...stats, ...stats, ...stats].map((s, i) => (
            <div key={`stat-${i}`} className="flex items-center gap-2.5 px-8">
              <span className="text-base">{s.icon}</span>
              <span className="font-orbitron text-sm text-cyan-400">{s.value}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="relative z-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4 md:px-10 py-10">
        {SERVICES.map((svc) => (
          <div key={svc.id} onClick={() => {
            if (svc.id === "flights") {
              document.getElementById("hero-flight-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
            } else if (svc.id === "deals") {
              document.getElementById("deals-section")?.scrollIntoView({ behavior: "smooth" });
            } else if (svc.id === "weather") {
              document.getElementById("weather-section")?.scrollIntoView({ behavior: "smooth" });
            } else {
              openChat();
            }
          }}
            className="relative bg-gradient-to-b from-[#0F172A] to-[#0B1220] border border-[#1E293B] rounded-3xl p-5 h-[260px] flex flex-col justify-between hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
            {svc.badge && (
              <div className="absolute -top-3 -right-3 z-30 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-[0_4px_16px_rgba(34,211,238,0.4)]">
                {svc.badge}
              </div>
            )}
            <div className="w-full h-28 bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:from-cyan-500/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <img src={svc.icon} alt={svc.title} className="w-20 h-20 object-contain drop-shadow-[0_2px_8px_rgba(34,211,238,0.3)]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1 group-hover:text-cyan-300 transition-colors">{svc.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{svc.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AIRPORT DEPARTURE BOARD */}
      <AirportDepartureBoard onOpenChat={openChat} />

      {/* POPULAR ROUTES + LIVE WEATHER + DEALS */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 md:px-10 pb-7">
        {/* Routes */}
        <div className="rania-glass-card rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/4">
            <div className="text-xs font-bold text-gray-400">🗺️ Popular Routes</div>
            <div className="text-[9px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Live</div>
          </div>
          {routes.map((r, i) => (
            <div key={i} onClick={() => openChat()} className="flex items-center gap-3 px-4 py-3 border-b border-white/3 hover:bg-cyan-400/3 cursor-pointer transition-colors group">
              <div className="relative w-14 h-10 rounded-lg bg-gradient-to-br from-blue-900/45 to-purple-900/45 flex items-center justify-center text-2xl flex-shrink-0">
                {r.thumb}
                {r.tag && <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white text-[7px] px-1 rounded font-bold">{r.tag}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/85 truncate group-hover:text-white transition-colors">{r.route}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{r.meta}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[8px] text-gray-600">from</div>
                <div className="text-sm font-bold text-emerald-400 font-orbitron">{r.price}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Weather */}
        <div id="weather-section">
          <LiveWeatherWidget />
        </div>

        {/* Deals */}
        <div id="deals-section" className="rania-glass-card rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/4">
            <div className="text-xs font-bold text-gray-400">🔥 Travel Deals</div>
          </div>
          <div className="p-4 space-y-3">
            <div className="rounded-xl overflow-hidden border border-white/5 hover:border-cyan-400/20 transition-colors group">
              <div className="relative h-32 overflow-hidden">
                <img src="https://static0.simpleflyingimages.com/wordpress/wp-content/uploads/2023/09/aerodili-4w-aal-dreamcatcher-68-2.jpg?q=50&fit=crop&w=1456&h=819" alt="Aero Dili" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 rania-gradient-btn text-black text-[8px] font-black px-2 py-0.5 rounded-lg">🇹🇱 RANIA GLOBAL</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-900/12 to-blue-900/12">
                <div className="text-sm font-black text-white mb-1">Bondia Mundo!</div>
                <div className="text-xs text-gray-300 mb-2">From Dili to Anywhere 🌍</div>
                <button onClick={() => openChat()} className="px-3 py-1.5 rounded-lg rania-gradient-btn text-black text-[10px] font-bold hover:scale-105 transition-all">Explore →</button>
              </div>
            </div>
            {[{ r: "DIL→DPS", t: "Bali Special", p: "from $180", d: "-25%" }, { r: "DIL→SIN", t: "Singapore Direct", p: "from $150", d: "-20%" }].map((d, i) => (
              <div key={i} onClick={() => openChat()} className="flex justify-between items-center p-2.5 bg-white/3 border border-white/4 rounded-xl cursor-pointer hover:bg-cyan-400/4 hover:border-cyan-400/16 transition-all">
                <div>
                  <div className="text-xs font-semibold text-white/86">{d.t}</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{d.r}</div>
                </div>
                <div className="text-right">
                  <div className="font-orbitron text-sm font-bold text-emerald-400">{d.p}</div>
                  <div className="text-[9px] bg-orange-400/15 text-orange-400 px-1.5 py-0.5 rounded-full border border-orange-400/20">{d.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DESTINATIONS */}
      <div className="relative z-10 px-4 md:px-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/7 border border-purple-500/20 flex items-center justify-center text-sm">🌍</div>
          <h3 className="font-orbitron text-xs font-bold tracking-wider text-white/78">FEATURED DESTINATIONS</h3>
        </div>
        <a href="/explore" className="text-[10px] text-cyan-400/65 hover:text-cyan-300 transition-colors">Explore All →</a>
      </div>
      <div className="relative z-10 px-4 md:px-10 pb-8">
        <div className="md:hidden flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
          {DESTINATIONS.map((dest, i) => (
            <div key={i} onClick={() => dest.iata ? (window.location.href = `/destination/${dest.iata}`) : openChat()} className="min-w-[220px] h-[260px] rounded-2xl overflow-hidden cursor-pointer group flex-shrink-0 snap-center border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="w-full h-full relative">
                <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${dest.image})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                {dest.badge && <div className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-sm ${dest.badge.includes("🔥") ? "bg-red-500/85" : dest.badge.includes("✨") ? "bg-emerald-500/85" : "bg-purple-500/85"}`}>{dest.badge}</div>}
                {dest.iata && <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white/90 bg-black/40 backdrop-blur-sm border border-white/15">View →</div>}
                <div className="absolute bottom-3 left-3">
                  <div className="text-sm font-bold text-white drop-shadow-md">{dest.city}</div>
                  <div className="text-[9px] text-gray-300/78">{dest.country}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {DESTINATIONS.map((dest, i) => (
            <div key={i} onClick={() => dest.iata ? (window.location.href = `/destination/${dest.iata}`) : openChat()} className="relative h-[200px] rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-white/16 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
              <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${dest.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/5 to-transparent" />
              {dest.badge && <div className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-sm ${dest.badge.includes("🔥") ? "bg-red-500/85" : dest.badge.includes("✨") ? "bg-emerald-500/85" : "bg-purple-500/85"}`}>{dest.badge}</div>}
              {dest.iata && <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white/90 bg-black/40 backdrop-blur-sm border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity">View Details →</div>}
              <div className="absolute bottom-3 left-3">
                <div className="text-sm font-bold text-white drop-shadow-md">{dest.city}</div>
                <div className="text-[9px] text-gray-300/78">{dest.country}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIDEO */}
      <div className="relative z-10 px-4 md:px-10 py-10">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-cyan-400/20 rounded-full text-[10px] tracking-wider bg-cyan-400/4 mb-3">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />🎬 Travel Inspiration
          </div>
          <h2 className="text-2xl md:text-3xl font-light text-white/86">Experience the World Through <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">RANIA</span></h2>
        </div>
        <YouTubeVideo />
      </div>

      {/* LIVE FLIGHT RADAR */}
      <div className="relative z-10 px-4 md:px-10 py-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-400/7 border border-cyan-400/20 flex items-center justify-center text-sm">🛰️</div>
          <h3 className="font-orbitron text-xs font-bold tracking-wider text-white/78">LIVE FLIGHT RADAR</h3>
          <span className="text-[9px] text-emerald-400 flex items-center gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />REAL-TIME
          </span>
          {/* Toggle button — only visible on mobile */}
          <button
            className="md:hidden ml-auto flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all"
            style={showRadarMobile
              ? { borderColor: "rgba(34,211,238,0.5)", color: "#22d3ee", background: "rgba(34,211,238,0.08)" }
              : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)" }}
            onClick={() => setShowRadarMobile(p => !p)}
          >
            🛰️ {showRadarMobile ? "Taka Radar ▲" : "Haree Radar ▼"}
          </button>
        </div>
        {/* Desktop: always show. Mobile: only show when toggled */}
        <div className={`${showRadarMobile ? "block" : "hidden md:block"}`}>
          <LiveFlightRadar />
        </div>

        {/* ── Price History Chart ─────────────────────────────────────── */}
        <div className="mt-3">
          <PriceHistoryChart />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[rgba(2,5,14,0.98)] border-t border-white/4 px-4 md:px-10 py-8 pb-28 md:pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl rania-gradient-btn flex items-center justify-center text-lg">✈️</div>
            <div><div className="font-orbitron text-base font-bold text-white">SANIMAR</div><div className="text-[10px] text-gray-500 tracking-wider mt-0.5">Travel Hub Timor-Leste</div></div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Kontaktu Ami</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm"><span>✉️</span><span>info.lusanimar@gmail.com</span></div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <h4 className="text-sm font-semibold text-white mb-3">Layanan Kami</h4>
            <div className="flex gap-2 justify-center md:justify-end flex-wrap">
              {["✈️ Tiket Penerbangan", "🏨 Hotel", "🗺️ Tour & Visa", "📧 E-Ticket Otomatis"].map((p, i) => (
                <span key={i} className="text-[10px] text-cyan-400/80 bg-cyan-500/8 border border-cyan-500/20 px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex gap-4 text-xs text-gray-600">{["Privacy Policy", "Terms", "Cookie Policy"].map((l, i) => (<a key={i} href="#" className="hover:text-cyan-400 transition-colors">{l}</a>))}</div>
          <div className="text-xs text-gray-600 text-center">© 2026 LU SANIMAR Travel · Hotu direitu proteje<br /><span className="text-cyan-400/58">Powered by RANIA AI — Smart Travel Assistant 24/7</span></div>
          <a href="/admin" className="text-[10px] text-white/15 hover:text-white/40 transition-colors font-mono">Staff Portal</a>
        </div>
      </footer>

      {/* SMART WELCOME CARD — first visitor / returning user greeting */}
      <WelcomeCard
        lang={lang}
        voiceEnabled={false}
        onAction={(action) => {
          if (action === "chat") openChat();
          else if (action === "search") openChat();
          else if (action === "explore") { window.location.href = "/explore"; }
          else if (action === "status") {
            const id = prompt("Masukkan Booking ID:");
            if (id?.trim()) setStatusBookingId(id.trim());
          }
        }}
      />

      {/* FLOATING CHAT BUTTON — pill with "Chat with RANIA" label */}
      {!isChatOpen && (
        <button onClick={() => openChat()}
          className="fixed bottom-24 md:bottom-8 right-5 z-[300] rounded-2xl rania-gradient-btn hover:scale-105 hover:shadow-[0_0_40px_rgba(0,229,255,0.65)] transition-all duration-300 active:scale-95 flex items-center gap-2.5 px-3 overflow-hidden"
          style={{ height: "56px", boxShadow: "0 0 28px rgba(0,229,255,0.45)" }}>
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-black/20">
            <img src={`${GH}/image/rania_avatar.png.webp`} alt="RANIA" className="w-full h-full object-cover rounded-xl"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">💬</span>'; }} />
          </div>
          <div className="flex flex-col items-start text-left pr-1">
            <span className="text-[11px] font-black text-white leading-tight whitespace-nowrap">Chat with RANIA</span>
            <span className="text-[9px] text-white/65 leading-tight whitespace-nowrap">AI Travel · 24/7</span>
          </div>
          <span className="absolute inset-0 rounded-2xl border-2 border-white/25 pointer-events-none" style={{ animation: "chatPulse 2.5s ease-in-out infinite" }} />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#050812] text-[7px] text-black font-black flex items-center justify-center">AI</div>
        </button>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 z-[250] md:hidden rania-bottom-nav">
        <div className="flex items-end justify-around px-2 pt-2 pb-4">
          {bottomNavItems.map((item) => {
            const isExplore = item.id === "explore";
            const isActive = activeNav === item.id;
            if (isExplore) {
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveNav(item.id); window.location.href = "/explore"; }}
                  style={{
                    background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
                    boxShadow: "0 0 28px rgba(6,182,212,0.55), 0 0 60px rgba(99,102,241,0.25), 0 -4px 20px rgba(6,182,212,0.2)",
                    transform: "translateY(-10px)",
                  }}
                  className="flex flex-col items-center gap-1 py-3 px-5 rounded-2xl transition-all duration-200 active:scale-95 relative"
                >
                  {/* Glow ring */}
                  <span
                    className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
                    style={{ boxShadow: "0 0 0 2px rgba(6,182,212,0.4)", animationDuration: "2s" }}
                  />
                  <span className="text-2xl leading-none">🌍</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                    Market
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); if (item.id === "search") openChat(); }}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 ${isActive ? "rania-gradient-btn text-black scale-105" : "text-gray-500 hover:text-gray-300"}`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* REGISTRATION GATE MODAL */}
      {showRegister && (
        <RegisterModal
          lang={lang}
          onDone={() => {
            setShowRegister(false);
            setIsChatOpen(true);
          }}
        />
      )}

      {/* RANIA CHAT */}
      <RaniaChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        lang={lang}
        setLang={setLang}
        onBookingSuccess={(bookingId) => {
          setIsChatOpen(false);
          setTimeout(() => setStatusBookingId(bookingId), 300);
        }}
      />

      {/* BOOKING STATUS TRACKER OVERLAY */}
      {statusBookingId !== null && (
        <BookingStatusTracker
          bookingId={statusBookingId}
          lang={lang}
          onClose={() => setStatusBookingId(null)}
        />
      )}

      {/* TRIP MODE — BOARDING PASS OVERLAY */}
      {tripModeBookingId !== null && (
        <TripModeCard
          bookingId={tripModeBookingId}
          lang={lang}
          onClose={() => setTripModeBookingId(null)}
        />
      )}
    </div>
  );
}
