import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: undefined, shadowUrl: undefined });

interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  altitude: number;
  onGround: boolean;
  velocity: number;
  heading: number;
  verticalRate: number;
}

interface DilFlight {
  flightIata: string;
  airline: string;
  airlineIata: string;
  status: string;
  scheduled: string;
  estimated?: string;
  actual?: string;
  gate?: string;
  destIata: string;
  destName: string;
  delay: number;
}

interface DilFlightsData {
  departures: DilFlight[];
  arrivals: DilFlight[];
  source: string;
  cached: boolean;
  ts?: string;
}

// ── IDE 8: Regional airports — Timor-Leste & NTT ────────────────────────────
const AIRPORTS_REGIONAL = [
  { iata: "DIL", name: "Dili — Presidente Nicolau Lobato", lat: -8.5577,  lon: 125.5235, country: "Timor-Leste",    active: true  },
  { iata: "BCH", name: "Baucau Airport",                   lat: -8.4890,  lon: 126.3990, country: "Timor-Leste",    active: true  },
  { iata: "OEC", name: "Oecusse Airport",                  lat: -9.1940,  lon: 124.3840, country: "Timor-Leste",    active: true  },
  { iata: "VIQ", name: "Viqueque Airport",                 lat: -8.8630,  lon: 126.3640, country: "Timor-Leste",    active: false },
  { iata: "KOE", name: "Kupang — El Tari International",   lat: -10.1716, lon: 123.6706, country: "NTT · Indonesia", active: true  },
  { iata: "ENE", name: "Ende — H. Hasan Aroeboesman",      lat: -8.8493,  lon: 121.6611, country: "NTT · Indonesia", active: true  },
  { iata: "MOF", name: "Maumere — Frans Sales Lega",       lat: -8.6407,  lon: 122.2369, country: "NTT · Indonesia", active: true  },
  { iata: "LBJ", name: "Labuan Bajo — Komodo Intl",        lat: -8.4867,  lon: 119.8889, country: "NTT · Indonesia", active: true  },
  { iata: "RTG", name: "Ruteng Airport",                   lat: -8.5970,  lon: 120.4772, country: "NTT · Indonesia", active: true  },
  { iata: "ARD", name: "Alor — Mali Airport",              lat: -8.1324,  lon: 124.5970, country: "NTT · Indonesia", active: true  },
  { iata: "DRW", name: "Darwin International",             lat: -12.4084, lon: 130.8767, country: "Australia",       active: true  },
];

// ── IDE 1: Plane icon — ✈ emoji with rotation + color coding ────────────────
function makePlaneIcon(heading: number, nearDil: boolean, live: boolean, onGround: boolean) {
  const color = onGround
    ? "#555"
    : nearDil ? "#00ffd1"
    : live    ? "#00ff88"
    :           "#88aacc";
  const glow = onGround ? "none"
    : nearDil
      ? "drop-shadow(0 0 6px #00ffd1) drop-shadow(0 0 12px rgba(0,255,209,0.35))"
      : live
      ? "drop-shadow(0 0 5px #00ff88)"
      : "none";
  const sz = nearDil ? 24 : 18;
  return L.divIcon({
    html: `<div class="rania-plane" style="font-size:${sz}px;color:${color};filter:${glow};transform:rotate(${heading - 90}deg)">✈</div>`,
    className: "",
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
    popupAnchor: [0, -(sz / 2 + 5)],
  });
}

// ── IDE 4: Great-circle projection ──────────────────────────────────────────
function projectPoint(lat: number, lon: number, hdg: number, distKm: number): [number, number] {
  const R = 6371;
  const d = distKm / R;
  const b = (hdg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(b));
  const λ2 = λ1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
  return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
}

function fmtTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dili" });
  } catch { return iso.substring(11, 16) || "—"; }
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "en-route") return "#00ff88";
  if (s === "landed" || s === "arrived")  return "#00ffd1";
  if (s === "cancelled")                  return "#ff5555";
  if (s === "delayed")                    return "#ffb830";
  return "#88aacc";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    "scheduled": "🕐 Sched", "active": "✈ En Route", "en-route": "✈ En Route",
    "landed": "✅ Landed", "arrived": "✅ Arrived", "cancelled": "❌ Cancelled",
    "delayed": "⚠ Delayed", "diverted": "↪ Diverted",
  };
  return map[status.toLowerCase()] || status;
}

// ── Airline logo via logo.clearbit.com / fallback ─────────────────────────
function airlineLogo(iata: string): string {
  const logos: Record<string, string> = {
    "4W": "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Aero_Dili_logo.png/200px-Aero_Dili_logo.png",
    "GA": "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Garuda_Indonesia_logo.svg/200px-Garuda_Indonesia_logo.svg.png",
    "JQ": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Jetstar_Airways_logo.svg/200px-Jetstar_Airways_logo.svg.png",
    "QF": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Qantas_Airways_logo_2016.svg/200px-Qantas_Airways_logo_2016.svg.png",
  };
  return logos[iata] || "";
}

// ── Flight row component ─────────────────────────────────────────────────
function FlightRow({ f, type }: { f: DilFlight; type: "dep" | "arr" }) {
  const time = f.actual || f.estimated || f.scheduled;
  const sc = statusColor(f.status);
  const isDelayed = f.delay && f.delay > 0;
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 hover:bg-white/[0.03] transition-colors">
      <div className="font-mono text-[11px] font-bold text-white/90 w-16 shrink-0">{f.flightIata || "—"}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-white/80 truncate">{f.airline}</div>
        <div className="text-[10px] text-white/40 truncate">
          {type === "dep" ? "✈ To" : "✈ From"}: <span className="text-cyan-400/80">{f.destIata}</span>
          {f.destName ? ` · ${f.destName.replace(/ International.*$/i, "").replace(/ Airport.*$/i, "")}` : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[11px] font-mono text-white/80">{fmtTime(time)}</div>
        {isDelayed ? (
          <div className="text-[9px] text-yellow-400">+{f.delay}m</div>
        ) : (
          <div className="text-[9px]" style={{ color: sc }}>{statusLabel(f.status)}</div>
        )}
      </div>
      {f.gate && (
        <div className="shrink-0 text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40">G{f.gate}</div>
      )}
    </div>
  );
}

export default function LiveFlightRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const markersRef    = useRef<Map<string, L.Marker>>(new Map());
  const acDataRef     = useRef<Map<string, Aircraft>>(new Map());
  const pathRef       = useRef<L.Polyline | null>(null);
  const airportMkRef  = useRef<L.CircleMarker[]>([]);

  const [stats,      setStats]      = useState({ total: 0, airborne: 0, dil: 0 });
  const [status,     setStatus]     = useState<"loading" | "live" | "simulated">("loading");
  const [lastUpdate, setLastUpdate] = useState("");
  const [search,     setSearch]     = useState("");
  const [altFilter,  setAltFilter]  = useState<"all" | "low" | "mid" | "high">("all");
  const [selCallsign, setSelCallsign] = useState<string | null>(null);
  const [showAirports, setShowAirports] = useState(true);

  // ── DIL flights state ────────────────────────────────────────────────────
  const [dilFlights,    setDilFlights]    = useState<DilFlightsData | null>(null);
  const [dilTab,        setDilTab]        = useState<"dep" | "arr">("dep");
  const [dilStatus,     setDilStatus]     = useState<"loading" | "ok" | "error">("loading");

  // ── HUD draggable position ────────────────────────────────────────────────
  const [hudPos, setHudPos] = useState({ bottom: 20, left: 12 });
  const hudDrag = useRef({ active: false, startX: 0, startY: 0, startL: 12, startB: 20 });

  function onHudDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    hudDrag.current = { active: true, startX: e.clientX, startY: e.clientY, startL: hudPos.left, startB: hudPos.bottom };
  }
  function onHudMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!hudDrag.current.active) return;
    const dx = e.clientX - hudDrag.current.startX;
    const dy = e.clientY - hudDrag.current.startY;
    setHudPos({
      left:   Math.max(4, hudDrag.current.startL + dx),
      bottom: Math.max(4, hudDrag.current.startB - dy),
    });
  }
  function onHudUp() { hudDrag.current.active = false; }

  // ── IDE 5: Filter markers ────────────────────────────────────────────────
  const applyFilters = useCallback((s: string, af: string) => {
    markersRef.current.forEach((marker, key) => {
      const ac = acDataRef.current.get(key);
      if (!ac) return;
      const okSearch = !s ||
        ac.callsign?.trim().toLowerCase().includes(s.toLowerCase()) ||
        ac.icao24.toLowerCase().includes(s.toLowerCase());
      const altM = ac.altitude || 0;
      const okAlt =
        af === "all"  ? true :
        af === "low"  ? altM < 5000 :
        af === "mid"  ? altM >= 5000 && altM < 10000 :
        /* high */      altM >= 10000;
      const show = okSearch && okAlt;
      marker.setOpacity(show ? 1 : 0);
      const el = marker.getElement();
      if (el) el.style.pointerEvents = show ? "auto" : "none";
    });
  }, []);

  // ── IDE 4: Draw projected path ───────────────────────────────────────────
  const drawPath = useCallback((ac: Aircraft | null) => {
    if (pathRef.current) { pathRef.current.remove(); pathRef.current = null; }
    if (!ac || !mapRef.current || !(ac.heading > 0)) return;
    const end = projectPoint(ac.lat, ac.lon, ac.heading, 280);
    pathRef.current = L.polyline([[ac.lat, ac.lon], end], {
      color: "#00e5ff", weight: 1.5, opacity: 0.5, dashArray: "6 9",
    }).addTo(mapRef.current);
  }, []);

  // ── Init map (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-5, 120], zoom: 5,
      zoomControl: true, preferCanvas: true, attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 18,
    }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: "© CARTO · OSM" }).addTo(map);

    // IDE 8: Airport markers
    AIRPORTS_REGIONAL.forEach((ap) => {
      const color = ap.active ? "#00e5ff" : "#ff5555";
      const popup = `
        <div class="rania-popup">
          <div class="rania-popup-title">🏛 ${ap.iata} · ${ap.name}</div>
          <div class="rania-popup-row">🌍 ${ap.country}</div>
          <div class="rania-popup-row">Status: <b style="color:${color}">${ap.active ? "✅ Active" : "🔴 Closed"}</b></div>
          <div class="rania-popup-row">📍 ${ap.lat.toFixed(3)}°, ${ap.lon.toFixed(3)}°</div>
        </div>`;
      const cm = L.circleMarker([ap.lat, ap.lon], {
        radius: ap.iata === "DIL" ? 8 : 5,
        color, fillColor: color, fillOpacity: 0.2,
        weight: ap.iata === "DIL" ? 2.5 : 1.5,
      })
        .bindPopup(popup, { maxWidth: 240, className: "rania-leaflet-popup" })
        .bindTooltip(`✈ ${ap.iata}`, { direction: "top", offset: [0, -3] })
        .addTo(map);
      airportMkRef.current.push(cm);
    });

    // Deselect on map click
    map.on("click", () => {
      setSelCallsign(null);
      if (pathRef.current) { pathRef.current.remove(); pathRef.current = null; }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      acDataRef.current.clear();
      airportMkRef.current = [];
    };
  }, []);

  // ── Toggle airport visibility ────────────────────────────────────────────
  useEffect(() => {
    airportMkRef.current.forEach((cm) => {
      cm.setStyle({ opacity: showAirports ? 1 : 0, fillOpacity: showAirports ? 0.2 : 0 });
      const el = cm.getElement() as HTMLElement | undefined;
      if (el) el.style.pointerEvents = showAirports ? "auto" : "none";
    });
  }, [showAirports]);

  // ── Fetch OpenSky data ───────────────────────────────────────────────────
  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch("/api/rania/radar", { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error("non-ok");
      const data = await res.json();
      if (!mapRef.current) return;

      const states: Aircraft[] = data.states || [];
      const live = !data.simulated && states.length > 0;
      setStatus(live ? "live" : "simulated");
      setLastUpdate(new Date().toUTCString().slice(17, 25));

      const seen = new Set<string>();
      let dilCount = 0, airborne = 0;

      states.forEach((ac) => {
        if (!ac.lat || !ac.lon) return;
        const key = ac.icao24;
        seen.add(key);
        acDataRef.current.set(key, ac);

        const nearDil = Math.hypot(ac.lat - (-8.5577), ac.lon - 125.5235) < 6;
        if (nearDil) dilCount++;
        if (!ac.onGround) airborne++;

        const icon = makePlaneIcon(ac.heading || 0, nearDil, live, ac.onGround);
        const altM   = ac.altitude ? `${Math.round(ac.altitude)} m` : "N/A";
        const spdKmh = ac.velocity ? `${Math.round(ac.velocity * 3.6)} km/h` : "N/A";
        const vRate  = ac.verticalRate;
        const vLabel = vRate > 1 ? "⬆ Climbing" : vRate < -1 ? "⬇ Descending" : "➡ Cruising";
        const popup = `
          <div class="rania-popup">
            <div class="rania-popup-title">✈ ${(ac.callsign?.trim() || ac.icao24).toUpperCase()}</div>
            <div class="rania-popup-row">🌍 ${ac.originCountry || "Unknown"}</div>
            <div class="rania-popup-row">⬆ Alt: <b>${altM}</b></div>
            <div class="rania-popup-row">💨 Speed: <b>${spdKmh}</b></div>
            <div class="rania-popup-row">🧭 Heading: <b>${ac.heading ? Math.round(ac.heading) + "°" : "N/A"}</b></div>
            <div class="rania-popup-row">${vLabel}</div>
            ${nearDil ? '<div class="rania-popup-dil">📍 Near Dili!</div>' : ""}
          </div>`;

        const existing = markersRef.current.get(key);
        if (existing) {
          existing.setLatLng([ac.lat, ac.lon]);
          existing.setIcon(icon);
          existing.setPopupContent(popup);
        } else {
          const m = L.marker([ac.lat, ac.lon], { icon })
            .bindPopup(popup, { maxWidth: 220, className: "rania-leaflet-popup" })
            .on("click", () => {
              setSelCallsign(ac.callsign?.trim() || ac.icao24);
              drawPath(acDataRef.current.get(key) || ac);
            })
            .addTo(mapRef.current!);
          markersRef.current.set(key, m);
        }
      });

      // Remove stale markers
      markersRef.current.forEach((m, key) => {
        if (!seen.has(key)) {
          m.remove();
          markersRef.current.delete(key);
          acDataRef.current.delete(key);
        }
      });

      setStats({ total: states.length, airborne, dil: dilCount });
      applyFilters(search, altFilter);
    } catch {
      setStatus("simulated");
    }
  }, [search, altFilter, applyFilters, drawPath]);

  useEffect(() => {
    fetchRadar();
    const id = setInterval(fetchRadar, 15_000);
    return () => clearInterval(id);
  }, [fetchRadar]);

  // ── Fetch DIL live flights (AviationStack) ───────────────────────────────
  const fetchDilFlights = useCallback(async () => {
    try {
      const res = await fetch("/api/rania/dil-flights", { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error("non-ok");
      const data: DilFlightsData = await res.json();
      setDilFlights(data);
      setDilStatus("ok");
    } catch {
      setDilStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchDilFlights();
    const id = setInterval(fetchDilFlights, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(id);
  }, [fetchDilFlights]);

  // Re-apply filters when search or altFilter changes
  useEffect(() => { applyFilters(search, altFilter); }, [search, altFilter, applyFilters]);

  const ALT_LABELS: Record<string, string> = { all: "All Alt", low: "<5 km", mid: "5–10km", high: ">10km" };

  const depList = dilFlights?.departures ?? [];
  const arrList = dilFlights?.arrivals ?? [];
  const isLiveSource = dilFlights?.source === "aviationstack";

  return (
    <div className="flex flex-col gap-0">
      {/* ── Main Radar Map ─────────────────────────────────────────────────── */}
      <div className="rounded-t-2xl overflow-hidden border border-cyan-500/20 border-b-0 shadow-2xl shadow-cyan-500/10 flex flex-col"
        style={{ height: "clamp(300px, 55vh, 620px)" }}>

        {/* ── IDE 5: Search & Filter Bar ──────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#060b18] border-b border-cyan-500/15 flex-shrink-0 overflow-x-auto">
          <div className="relative shrink-0">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30 text-[10px] pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Callsign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-[10px] font-mono pl-6 pr-2 py-1 rounded-lg w-28 sm:w-36 focus:outline-none focus:border-cyan-500/50 placeholder-white/20"
            />
          </div>
          <div className="flex gap-1 shrink-0">
            {(["all", "low", "mid", "high"] as const).map((f) => (
              <button key={f} onClick={() => setAltFilter(f)}
                className={`text-[8px] font-mono px-1.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                  altFilter === f
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/10"
                    : "border-white/12 text-white/30 hover:border-white/30 hover:text-white/60"
                }`}>
                {ALT_LABELS[f]}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAirports((p) => !p)}
            className={`ml-auto shrink-0 text-[8px] font-mono px-1.5 py-1 rounded-lg border transition-colors ${
              showAirports
                ? "border-cyan-400/50 text-cyan-400 bg-cyan-500/10"
                : "border-white/12 text-white/30"
            }`}>
            🏛
          </button>
        </div>

        {/* ── Map container ───────────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0">
          <div ref={containerRef} className="w-full h-full" />

          {/* Status */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            {status === "loading" && (
              <span className="bg-black/80 border border-cyan-500/30 text-cyan-400/70 text-[9px] font-mono px-2 py-0.5 rounded-full">⏳ Connecting...</span>
            )}
            {status === "live" && (
              <span className="bg-emerald-900/80 border border-emerald-500/40 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded-full animate-pulse">🛰 LIVE · OpenSky Network</span>
            )}
            {status === "simulated" && (
              <span className="bg-yellow-900/60 border border-yellow-500/30 text-yellow-400/70 text-[9px] font-mono px-2 py-0.5 rounded-full">🟡 Simulated · OpenSky offline</span>
            )}
          </div>

          {/* IDE 4: Selected flight indicator */}
          {selCallsign && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] bg-cyan-900/80 border border-cyan-500/40 rounded-lg px-3 py-1 text-[9px] font-mono text-cyan-300 pointer-events-none">
              ✈ {selCallsign} · showing projected path →
            </div>
          )}

          {/* HUD Stats — draggable on all devices */}
          <div
            className="absolute z-[1000] bg-black/80 border border-cyan-500/30 rounded-xl p-2.5 text-xs font-mono cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ bottom: hudPos.bottom, left: hudPos.left }}
            onPointerDown={onHudDown}
            onPointerMove={onHudMove}
            onPointerUp={onHudUp}
            onPointerCancel={onHudUp}
          >
            <div className="text-cyan-400 font-bold mb-1.5 flex items-center gap-1">
              ✈ RANIA LIVE RADAR
              <span className="text-white/20 text-[8px] ml-1">⠿</span>
            </div>
            <div className="text-white/60">Flights <span className="text-white font-bold ml-1">{stats.total}</span></div>
            <div className="text-white/60">Airborne <span className="text-white font-bold ml-1">{stats.airborne}</span></div>
            <div className="text-white/60">Near DIL <span className="text-cyan-400 font-bold ml-1">{stats.dil}</span></div>
            {lastUpdate && <div className="text-white/25 text-[9px] mt-1.5 border-t border-white/10 pt-1">{lastUpdate} UTC · 15s</div>}
          </div>

          {/* Legend */}
          <div className="absolute top-8 right-3 z-[1000] bg-black/75 border border-white/10 rounded-xl p-2.5 text-[9px] font-mono pointer-events-none hidden md:block">
            <div className="text-white/40 mb-1.5 uppercase tracking-wider text-[8px]">Legend</div>
            <div className="flex items-center gap-1.5 mb-1"><span className="text-[#00ffd1]">✈</span><span className="text-white/60">Near Dili</span></div>
            <div className="flex items-center gap-1.5 mb-1"><span className="text-[#00ff88]">✈</span><span className="text-white/60">Live flight</span></div>
            <div className="flex items-center gap-1.5 mb-1"><span className="text-[#88aacc]">✈</span><span className="text-white/60">Simulated</span></div>
            <div className="flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full border border-cyan-400 inline-block" /></div>
            <div className="flex items-center gap-1.5"><span className="text-white/40 text-[8px] ml-3">🏛 Airport</span></div>
            <div className="text-white/20 mt-1.5 text-[8px]">Click ✈ → path</div>
          </div>
        </div>
      </div>

      {/* ── DIL Departures & Arrivals Panel ─────────────────────────────────── */}
      <div className="rounded-b-2xl overflow-hidden border border-cyan-500/20 border-t-0 bg-[#060b18]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-[11px] font-bold font-mono">🛫 DIL · Presidente Nicolau Lobato</span>
            {isLiveSource ? (
              <span className="bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 text-[8px] font-mono px-1.5 py-0.5 rounded-full animate-pulse">
                ● LIVE AviationStack
              </span>
            ) : dilFlights?.source === "fallback" ? (
              <span className="bg-yellow-900/40 border border-yellow-500/20 text-yellow-400/70 text-[8px] font-mono px-1.5 py-0.5 rounded-full">
                ○ Schedule (offline)
              </span>
            ) : dilStatus === "loading" ? (
              <span className="text-white/30 text-[8px] font-mono">⏳ Loading...</span>
            ) : null}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setDilTab("dep")}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                dilTab === "dep"
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                  : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"
              }`}>
              🛫 Departures {depList.length > 0 && <span className="ml-0.5 text-[8px]">({depList.length})</span>}
            </button>
            <button
              onClick={() => setDilTab("arr")}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                dilTab === "arr"
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                  : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"
              }`}>
              🛬 Arrivals {arrList.length > 0 && <span className="ml-0.5 text-[8px]">({arrList.length})</span>}
            </button>
          </div>
        </div>

        {/* Flight list */}
        <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {dilStatus === "loading" && (
            <div className="flex items-center justify-center py-8 text-white/30 text-[11px] font-mono gap-2">
              <span className="animate-spin">⏳</span> Fetching DIL flights...
            </div>
          )}
          {dilStatus === "error" && (
            <div className="flex items-center justify-center py-6 text-white/30 text-[10px] font-mono">
              ⚠ Unable to load flight data
            </div>
          )}
          {dilStatus === "ok" && (
            <>
              {dilTab === "dep" && (
                depList.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-white/25 text-[10px] font-mono">No departures found for today</div>
                ) : (
                  depList.map((f, i) => <FlightRow key={`dep-${i}`} f={f} type="dep" />)
                )
              )}
              {dilTab === "arr" && (
                arrList.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-white/25 text-[10px] font-mono">No arrivals found for today</div>
                ) : (
                  arrList.map((f, i) => <FlightRow key={`arr-${i}`} f={f} type="arr" />)
                )
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {dilFlights && (
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 text-[8px] font-mono text-white/20">
            <span>Data: {dilFlights.source === "aviationstack" ? "AviationStack Real-Time" : dilFlights.source === "fallback" ? "Static Schedule" : dilFlights.source}</span>
            <span>{dilFlights.cached ? "cached" : "fresh"} · refreshes every 5 min</span>
          </div>
        )}
      </div>
    </div>
  );
}
