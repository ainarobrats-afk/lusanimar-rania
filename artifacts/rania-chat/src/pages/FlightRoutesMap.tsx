import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: undefined, shadowUrl: undefined });

interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  region: string;
}

interface Route {
  from: string;
  to: string;
  airlines: string[];
  priceFrom?: number;
  priceTo?: number;
  currency?: string;
  duration?: string;
  frequency?: string;
  via?: string[];
}

interface NetworkData {
  airports: Airport[];
  routes: Route[];
  stats: { airportCount: number; routeCount: number; countryCount: number; regionCount: number };
}

const REGION_COLORS: Record<string, string> = {
  "Timor-Leste":   "#ff4444",
  "Southeast Asia":"#ff8833",
  "East Asia":     "#ffdd00",
  "South Asia":    "#ff66bb",
  "Oceania":       "#00dd88",
  "Middle East":   "#aa66ff",
  "Africa":        "#ff9966",
  "Europe":        "#4488ff",
  "Americas":      "#00ccff",
  "Other":         "#aabbcc",
};

const REGIONS = ["All", "Timor-Leste", "Southeast Asia", "East Asia", "South Asia", "Oceania", "Middle East", "Africa", "Europe", "Americas"];

function priceColor(price?: number): string {
  if (!price) return "#555577";
  if (price < 100)  return "#00ff88";
  if (price < 300)  return "#ffdd00";
  if (price < 700)  return "#ff8800";
  return "#ff4444";
}

// Great-circle arc between two lat/lon points
function gcArc(a: [number, number], b: [number, number], n = 32): [number, number][] {
  const toR = (d: number) => d * Math.PI / 180;
  const toD = (r: number) => r * 180 / Math.PI;
  const φ1 = toR(a[0]), λ1 = toR(a[1]);
  const φ2 = toR(b[0]), λ2 = toR(b[1]);
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
  ));
  if (d < 0.001) return [a, b];
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    pts.push([toD(Math.atan2(z, Math.sqrt(x * x + y * y))), toD(Math.atan2(y, x))]);
  }
  return pts;
}

function makeAirportIcon(region: string, isSelected: boolean, isTL: boolean) {
  const color = REGION_COLORS[region] || "#aabbcc";
  const r = isTL ? 9 : isSelected ? 8 : 5;
  const glow = isTL
    ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}88)`
    : isSelected
    ? `drop-shadow(0 0 5px ${color})`
    : "none";
  const ring = isTL || isSelected ? `<circle cx="12" cy="12" r="${r + 4}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>` : "";
  return L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<svg width="24" height="24" viewBox="0 0 24 24" style="filter:${glow}">
      ${ring}
      <circle cx="12" cy="12" r="${r}" fill="${color}" opacity="${isSelected ? 1 : 0.85}"/>
      <circle cx="12" cy="12" r="${r - 2}" fill="${color}" opacity="0.4"/>
    </svg>`,
  });
}

export default function FlightRoutesMap() {
  const [, navigate] = useLocation();
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLinesRef = useRef<L.Polyline[]>([]);
  const highlightLinesRef = useRef<L.Polyline[]>([]);

  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState("");
  const [showRoutes, setShowRoutes] = useState(true);
  const [showDilOnly, setShowDilOnly] = useState(false);

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  useEffect(() => {
    fetch(`${BASE}/api/rania/flight-network`)
      .then(r => r.json())
      .then((d: NetworkData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load network data"); setLoading(false); });
  }, [BASE]);

  const clearHighlights = useCallback(() => {
    highlightLinesRef.current.forEach(l => l.remove());
    highlightLinesRef.current = [];
  }, []);

  const highlightAirport = useCallback((airport: Airport, allData: NetworkData) => {
    clearHighlights();
    const routes = allData.routes.filter(r => r.from === airport.iata || r.to === airport.iata);
    setSelectedAirport(airport);
    setSelectedRoutes(routes);

    routes.forEach(route => {
      const fromAp = allData.airports.find(a => a.iata === route.from);
      const toAp = allData.airports.find(a => a.iata === route.to);
      if (!fromAp || !toAp) return;
      const pts = gcArc([fromAp.lat, fromAp.lon], [toAp.lat, toAp.lon]);
      const line = L.polyline(pts as L.LatLngExpression[], {
        color: "#00ffd1",
        weight: 2.5,
        opacity: 0.9,
        dashArray: "6 3",
      }).addTo(mapRef.current!);
      highlightLinesRef.current.push(line);
    });
  }, [clearHighlights]);

  useEffect(() => {
    if (!data || !mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [10, 115],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      subdomains: "abcd",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Draw all route arcs
    data.routes.forEach(route => {
      const fromAp = data.airports.find(a => a.iata === route.from);
      const toAp = data.airports.find(a => a.iata === route.to);
      if (!fromAp || !toAp) return;
      const pts = gcArc([fromAp.lat, fromAp.lon], [toAp.lat, toAp.lon]);
      const line = L.polyline(pts as L.LatLngExpression[], {
        color: priceColor(route.priceFrom),
        weight: 1.2,
        opacity: 0.35,
      }).addTo(map);
      routeLinesRef.current.push(line);
    });

    // Draw airport markers
    data.airports.forEach(ap => {
      const isTL = ap.region === "Timor-Leste";
      const marker = L.marker([ap.lat, ap.lon], {
        icon: makeAirportIcon(ap.region, false, isTL),
        zIndexOffset: isTL ? 1000 : 0,
      }).addTo(map);
      marker.on("click", () => highlightAirport(ap, data));
      marker.bindTooltip(
        `<div style="background:#0d1b2a;border:1px solid #1a3a5c;border-radius:6px;padding:6px 10px;color:#e0f0ff;font-family:monospace;font-size:12px;white-space:nowrap">
          <b style="color:#00ffd1;font-size:13px">${ap.iata}</b> &nbsp;${ap.city}<br>
          <span style="color:#88aacc;font-size:11px">${ap.name}</span>
        </div>`,
        { className: "rania-tooltip", opacity: 1 }
      );
      markersRef.current.set(ap.iata, marker);
    });
  }, [data, highlightAirport]);

  // Filter markers/routes by selected region or DIL-only
  useEffect(() => {
    if (!data || !mapRef.current) return;

    data.airports.forEach(ap => {
      const marker = markersRef.current.get(ap.iata);
      if (!marker) return;
      const visible =
        (selectedRegion === "All" || ap.region === selectedRegion) &&
        (!showDilOnly || ap.iata === "DIL" || data.routes.some(r =>
          (r.from === "DIL" && r.to === ap.iata) || (r.to === "DIL" && r.from === ap.iata)
        ));
      if (visible) marker.addTo(mapRef.current!);
      else marker.remove();
    });

    routeLinesRef.current.forEach((line, i) => {
      const route = data.routes[i];
      if (!route) return;
      const fromAp = data.airports.find(a => a.iata === route.from);
      const toAp = data.airports.find(a => a.iata === route.to);
      if (!fromAp || !toAp) return;
      const visible =
        showRoutes &&
        (selectedRegion === "All" || fromAp.region === selectedRegion || toAp.region === selectedRegion) &&
        (!showDilOnly || route.from === "DIL" || route.to === "DIL");
      if (visible) line.addTo(mapRef.current!);
      else line.remove();
    });
  }, [data, selectedRegion, showRoutes, showDilOnly]);

  const filteredAirports = data?.airports.filter(ap => {
    const q = search.toLowerCase();
    if (!q) return false;
    return ap.iata.toLowerCase().includes(q) || ap.city.toLowerCase().includes(q) || ap.country.toLowerCase().includes(q) || ap.name.toLowerCase().includes(q);
  }).slice(0, 8) ?? [];

  const flyTo = (ap: Airport) => {
    mapRef.current?.flyTo([ap.lat, ap.lon], 5, { duration: 1.2 });
    if (data) highlightAirport(ap, data);
    setSearch("");
  };

  if (loading) return (
    <div className="h-screen w-screen bg-[#050e1a] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-pulse">✈</div>
        <div className="text-[#00ffd1] font-mono text-sm tracking-widest">LOADING ROUTE NETWORK...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen w-screen bg-[#050e1a] flex items-center justify-center text-red-400 font-mono">{error}</div>
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050e1a]" style={{ fontFamily: "'JetBrains Mono','Fira Mono',monospace" }}>
      {/* Map */}
      <div ref={mapDivRef} className="absolute inset-0 z-0" />

      {/* Leaflet tooltip dark style */}
      <style>{`.leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-tooltip-top:before, .leaflet-tooltip-bottom:before, .leaflet-tooltip-left:before, .leaflet-tooltip-right:before { display: none !important; }
      `}</style>

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5" style={{ background: "linear-gradient(to bottom, rgba(5,14,26,0.97), rgba(5,14,26,0))" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-[#00ffd1] hover:text-white transition-colors text-lg" title="Back to RANIA">←</button>
          <div>
            <div className="text-[#00ffd1] font-black text-sm tracking-widest uppercase">RANIA GLOBAL ROUTE NETWORK</div>
            <div className="text-[#4a7aaa] text-[10px] tracking-wider">Sanimar Travel · Dili, Timor-Leste</div>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="flex items-center gap-4">
            {[
              { label: "AIRPORTS", val: data.stats.airportCount, color: "#00ffd1" },
              { label: "ROUTES",   val: data.stats.routeCount,   color: "#ff8833" },
              { label: "COUNTRIES",val: data.stats.countryCount, color: "#4488ff" },
              { label: "REGIONS",  val: data.stats.regionCount,  color: "#aa66ff" },
            ].map(s => (
              <div key={s.label} className="text-center hidden sm:block">
                <div style={{ color: s.color }} className="text-lg font-black leading-none">{s.val.toLocaleString()}</div>
                <div className="text-[#4a7aaa] text-[9px] tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search airport or city..."
            className="bg-[#0a1a2e]/90 border border-[#1a3a5c] text-[#e0f0ff] text-xs px-3 py-1.5 rounded-lg w-44 focus:outline-none focus:border-[#00ffd1] placeholder-[#3a5a7a]"
          />
          {filteredAirports.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a1a2e] border border-[#1a3a5c] rounded-lg overflow-hidden z-50">
              {filteredAirports.map(ap => (
                <button key={ap.iata} onClick={() => flyTo(ap)}
                  className="w-full text-left px-3 py-2 hover:bg-[#1a3a5c] transition-colors border-b border-[#1a3a5c]/50 last:border-0">
                  <span className="text-[#00ffd1] font-black text-xs">{ap.iata}</span>
                  <span className="text-[#e0f0ff] text-xs ml-2">{ap.city}</span>
                  <span className="text-[#4a7aaa] text-[10px] ml-1">{ap.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Region Filter Pills */}
      <div className="absolute top-16 left-0 right-0 z-20 flex items-center gap-1.5 px-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setSelectedRegion(r)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all border"
            style={{
              background: selectedRegion === r ? (REGION_COLORS[r] || "#00ffd1") + "33" : "rgba(5,14,26,0.85)",
              borderColor: selectedRegion === r ? (REGION_COLORS[r] || "#00ffd1") : "#1a3a5c",
              color: selectedRegion === r ? (REGION_COLORS[r] || "#00ffd1") : "#4a7aaa",
            }}>
            {r}
          </button>
        ))}

        <div className="w-px h-4 bg-[#1a3a5c] mx-1 flex-shrink-0" />

        {/* Toggle: Routes */}
        <button onClick={() => setShowRoutes(v => !v)}
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all border"
          style={{ background: showRoutes ? "#ff883322" : "rgba(5,14,26,0.85)", borderColor: showRoutes ? "#ff8833" : "#1a3a5c", color: showRoutes ? "#ff8833" : "#4a7aaa" }}>
          ROUTES {showRoutes ? "ON" : "OFF"}
        </button>

        {/* Toggle: DIL only */}
        <button onClick={() => setShowDilOnly(v => !v)}
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all border"
          style={{ background: showDilOnly ? "#ff444422" : "rgba(5,14,26,0.85)", borderColor: showDilOnly ? "#ff4444" : "#1a3a5c", color: showDilOnly ? "#ff4444" : "#4a7aaa" }}>
          DIL ROUTES ONLY
        </button>
      </div>

      {/* Selected Airport Panel */}
      {selectedAirport && (
        <div className="absolute bottom-8 left-4 z-20 w-72 rounded-xl border border-[#1a3a5c] overflow-hidden" style={{ background: "rgba(5,14,26,0.96)", backdropFilter: "blur(12px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a3a5c]" style={{ background: `${REGION_COLORS[selectedAirport.region] || "#00ffd1"}18` }}>
            <div>
              <div className="flex items-center gap-2">
                <span style={{ color: REGION_COLORS[selectedAirport.region] || "#00ffd1" }} className="text-2xl font-black">{selectedAirport.iata}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={{ background: (REGION_COLORS[selectedAirport.region] || "#00ffd1") + "22", color: REGION_COLORS[selectedAirport.region] || "#00ffd1" }}>{selectedAirport.region}</span>
              </div>
              <div className="text-[#e0f0ff] text-sm font-bold">{selectedAirport.city}</div>
              <div className="text-[#4a7aaa] text-[10px]">{selectedAirport.name}</div>
              <div className="text-[#4a7aaa] text-[10px]">{selectedAirport.country} · {selectedAirport.lat.toFixed(3)}°, {selectedAirport.lon.toFixed(3)}°</div>
            </div>
            <button onClick={() => { setSelectedAirport(null); setSelectedRoutes([]); clearHighlights(); }}
              className="text-[#4a7aaa] hover:text-white text-xl leading-none">×</button>
          </div>

          {/* Routes */}
          <div className="px-4 py-2">
            <div className="text-[#4a7aaa] text-[9px] tracking-widest mb-2 uppercase font-bold">{selectedRoutes.length} routes from/to {selectedAirport.iata}</div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {selectedRoutes.length === 0 && <div className="text-[#3a5a7a] text-xs italic">No direct routes in database</div>}
              {selectedRoutes.map((r, i) => {
                const other = r.from === selectedAirport.iata ? r.to : r.from;
                const dir = r.from === selectedAirport.iata ? "→" : "←";
                return (
                  <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border border-[#1a3a5c]/60" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <span className="text-[#00ffd1] font-black text-xs">{selectedAirport.iata}</span>
                      <span className="text-[#4a7aaa] text-xs mx-1">{dir}</span>
                      <span className="text-[#e0f0ff] font-black text-xs">{other}</span>
                      {r.via && r.via.length > 0 && <span className="text-[#3a5a7a] text-[9px] ml-1">via {r.via.join(",")}</span>}
                    </div>
                    <div className="text-right">
                      {r.priceFrom ? (
                        <div style={{ color: priceColor(r.priceFrom) }} className="text-[11px] font-black">${r.priceFrom}</div>
                      ) : <div className="text-[#3a5a7a] text-[10px]">—</div>}
                      <div className="text-[#3a5a7a] text-[9px]">{r.duration}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ask RANIA button */}
          <div className="px-4 pb-3">
            <button onClick={() => navigate(`/?q=flights+from+${selectedAirport.iata}`)}
              className="w-full py-2 rounded-lg text-xs font-black tracking-wider transition-colors"
              style={{ background: "rgba(0,255,209,0.1)", border: "1px solid #00ffd1", color: "#00ffd1" }}>
              ✈ Ask RANIA about {selectedAirport.iata} flights
            </button>
          </div>
        </div>
      )}

      {/* Price Legend */}
      <div className="absolute bottom-8 right-4 z-20 rounded-xl border border-[#1a3a5c] px-4 py-3" style={{ background: "rgba(5,14,26,0.92)", backdropFilter: "blur(8px)" }}>
        <div className="text-[#4a7aaa] text-[9px] tracking-widest mb-2 font-bold uppercase">Route Price</div>
        {[
          { label: "< $100",    color: "#00ff88" },
          { label: "$100–300",  color: "#ffdd00" },
          { label: "$300–700",  color: "#ff8800" },
          { label: "> $700",    color: "#ff4444" },
          { label: "Unknown",   color: "#555577" },
        ].map(p => (
          <div key={p.label} className="flex items-center gap-2 mb-1">
            <div className="w-8 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[#88aacc] text-[10px]">{p.label}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-[#1a3a5c]">
          <div className="text-[#4a7aaa] text-[9px] tracking-widest mb-1.5 font-bold uppercase">Airports</div>
          {Object.entries(REGION_COLORS).slice(0, 5).map(([r, c]) => (
            <div key={r} className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-[#88aacc] text-[9px]">{r}</span>
            </div>
          ))}
          <div className="text-[#3a5a7a] text-[9px] italic mt-0.5">+{Object.keys(REGION_COLORS).length - 5} more</div>
        </div>
      </div>

      {/* Click hint */}
      {!selectedAirport && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-[#3a5a7a] text-[10px] tracking-wider pointer-events-none">
          Click any airport dot to see routes
        </div>
      )}
    </div>
  );
}
