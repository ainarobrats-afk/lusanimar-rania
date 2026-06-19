import { useState } from "react";

// ============================================================================
// RANIA V2.1 — Hotel Map Component (Google Maps Embed API - FREE)
//
// Uses ONLY the Maps Embed API (free tier):
// - Place mode: Show hotel location on map
// - Directions mode: Show route from airport to hotel
//
// NEVER uses Places API or Distance Matrix API (paid).
// ============================================================================

// API key will be set via environment variable
// For now, use placeholder - swap when Maun Luis provides key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

interface HotelMapProps {
  hotelName: string;
  city: string;
  country?: string;
  airportIata?: string;
  airportName?: string;
  compact?: boolean; // compact mode for cards
}

/**
 * Google Maps Embed component — shows hotel location and airport route.
 * Uses ONLY the free Maps Embed API (iframe).
 */
export default function HotelMap({
  hotelName,
  city,
  country = "",
  airportIata,
  airportName,
  compact = false,
}: HotelMapProps) {
  const [mode, setMode] = useState<"place" | "directions">("place");
  const [expanded, setExpanded] = useState(!compact);

  // Build the embed URL
  const query = encodeURIComponent(`${hotelName}, ${city}${country ? ", " + country : ""}`);
  const origin = airportIata
    ? encodeURIComponent(`${airportIata} Airport`)
    : airportName
      ? encodeURIComponent(airportName)
      : "";

  const embedUrl =
    mode === "place"
      ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${query}&zoom=15`
      : `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${query}&mode=driving`;

  const hasApiKey = !!GOOGLE_MAPS_API_KEY;
  const canShowRoute = !!(airportIata || airportName);

  // No API key — show styled placeholder
  if (!hasApiKey) {
    return (
      <div
        className={`rounded-xl overflow-hidden border border-white/8 ${compact ? "h-24" : "h-40"}`}
        style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.04), rgba(168,85,247,0.04))" }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-1.5 px-3 text-center">
          <span className="text-lg opacity-40">🗺️</span>
          <span className="text-[10px] text-white/30 font-mono">
            {hotelName}, {city}
          </span>
          <span className="text-[9px] text-white/15 font-mono">Map coming soon</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 transition-all">
      {/* Map toggle header */}
      {compact && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "rgba(0,229,255,0.04)" }}
        >
          <span className="flex items-center gap-1.5">
            📍 {mode === "place" ? "Hotel Location" : "Airport Route"}
          </span>
          <span className="text-white/30 text-[9px]">{expanded ? "▲" : "▼"}</span>
        </button>
      )}

      {expanded && (
        <>
          {/* Mode tabs (only show directions tab if airport info available) */}
          {canShowRoute && (
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setMode("place")}
                className={`flex-1 py-1.5 text-[10px] font-mono font-bold transition-colors ${
                  mode === "place"
                    ? "text-cyan-400 bg-cyan-500/8 border-b-2 border-cyan-400"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                📍 Location
              </button>
              <button
                onClick={() => setMode("directions")}
                className={`flex-1 py-1.5 text-[10px] font-mono font-bold transition-colors ${
                  mode === "directions"
                    ? "text-cyan-400 bg-cyan-500/8 border-b-2 border-cyan-400"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                🚗 From Airport
              </button>
            </div>
          )}

          {/* Google Maps iframe */}
          <iframe
            title={`${mode === "place" ? "Location" : "Route"} — ${hotelName}`}
            width="100%"
            height={compact ? "160" : "220"}
            style={{ border: 0, display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
          />

          {/* Footer info */}
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "rgba(0,0,0,0.3)" }}>
            <span className="text-[9px] text-white/25 font-mono">
              {mode === "place"
                ? `📍 ${hotelName}, ${city}`
                : `🚗 ${airportIata || "Airport"} → ${hotelName}`
              }
            </span>
            <a
              href={`https://www.google.com/maps/search/${query}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-cyan-400/60 hover:text-cyan-400 font-mono transition-colors"
            >
              Open in Maps ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}
