// ============================================================================
// RANIA V2.1 — Function Calling Definitions for AI Parser
// These are the "tools" the AI can invoke during chat
// ============================================================================

import type { FunctionDef } from "@workspace/rania-shared/types";

/**
 * All available functions the AI parser can call.
 * Each function maps to a specific worker endpoint.
 */
export const FUNCTION_DEFINITIONS: FunctionDef[] = [
  {
    name: "search_flights",
    description: "Search for real-time flight prices between two airports. Returns actual prices from airline APIs. NEVER use estimated or indication prices.",
    parameters: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "Origin airport IATA code (e.g. 'DIL' for Dili)",
        },
        destination: {
          type: "string",
          description: "Destination airport IATA code (e.g. 'DPS' for Bali/Denpasar)",
        },
        departure_date: {
          type: "string",
          description: "Departure date in YYYY-MM-DD format",
        },
        return_date: {
          type: "string",
          description: "Return date in YYYY-MM-DD format (optional, omit for one-way)",
        },
        passengers: {
          type: "number",
          description: "Number of passengers (default: 1)",
        },
      },
      required: ["origin", "destination", "departure_date"],
    },
  },
  {
    name: "validate_passport",
    description: "Validate a passport image using OCR. Checks name format, passport number, expiry date (must be >6 months from travel), and nationality.",
    parameters: {
      type: "object",
      properties: {
        image_url: {
          type: "string",
          description: "URL or base64 of the passport image",
        },
        travel_date: {
          type: "string",
          description: "Intended travel date in YYYY-MM-DD format (to check 6-month expiry rule)",
        },
      },
      required: ["image_url", "travel_date"],
    },
  },
  {
    name: "start_booking",
    description: "Start the booking process for a selected flight. Creates a Xendit payment invoice (QRIS/VA/CC) and returns the payment URL.",
    parameters: {
      type: "object",
      properties: {
        flight_id: {
          type: "string",
          description: "The flight result ID from search_flights",
        },
        passenger_name: {
          type: "string",
          description: "Full name of the passenger as on passport",
        },
        passport_number: {
          type: "string",
          description: "Passport number",
        },
        email: {
          type: "string",
          description: "Contact email for booking confirmation",
        },
        phone: {
          type: "string",
          description: "WhatsApp number for notifications (with country code, e.g. +670...)",
        },
        payment_method: {
          type: "string",
          enum: ["QRIS", "VA", "CC"],
          description: "Payment method: QRIS (recommended for Indonesia/Timor-Leste), VA (Virtual Account), or CC (Credit Card via Xendit hosted page)",
        },
      },
      required: ["flight_id", "passenger_name", "passport_number", "email", "phone", "payment_method"],
    },
  },
  {
    name: "check_booking_status",
    description: "Check the current status of a booking using the booking ID or PNR.",
    parameters: {
      type: "object",
      properties: {
        booking_id: {
          type: "string",
          description: "The booking ID (e.g. 'bk-xxxx')",
        },
      },
      required: ["booking_id"],
    },
  },
  {
    name: "get_weather",
    description: "Get current weather information for a destination city.",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name or IATA airport code",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "get_visa_info",
    description: "Get visa requirements for a destination country. Detects visa type automatically: if user mentions 'kerja/work/employment' → work visa; 'studi/belajar/kuliah/study' → study visa; 'turis/liburan/wisata/tourist/holiday' → tourist visa; otherwise shows all 3 types. NEVER use this for flight ticket questions.",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "Destination country name (e.g. 'Australia', 'Japan', 'United States', 'Portugal'). Normalize aliases: Jepang→Japan, Inggris→United Kingdom, AS/Amerika→United States, Korsel→South Korea, Belanda→Netherlands, Jerman→Germany, Arab Saudi→Saudi Arabia, Singapura→Singapore",
        },
        nationality: {
          type: "string",
          description: "Traveler's nationality (default: Timor-Leste)",
        },
        visa_type: {
          type: "string",
          enum: ["tourist", "work", "study", "all"],
          description: "Visa type: 'tourist' for wisata/liburan, 'work' for kerja/employment, 'study' for pelajar/kuliah, 'all' if not specified",
        },
      },
      required: ["destination"],
    },
  },
  // ─── Global Tools (both Travel & Market) ──────────────────────────────────
  {
    name: "web_search",
    description: "Search the web for real-time information about tourism, destinations, culture, climate, travel tips, events, recommendations. USE THIS when: user asks about tourist attractions, local food, travel tips, weather details, visa for countries NOT in KB, travel news. NEVER use for flight tickets/prices — those MUST use search_flights API only.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query. Be specific: include country/city name and topic. Examples: 'best time to visit Bali weather', 'tourist attractions in Dili Timor-Leste', 'visa requirements for Timor-Leste passport to Mexico 2024'",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "simpan_memory_user",
    description: "Save user preference or info to memory for cross-chat personalization. Call this when user mentions preferences like liking Bali, wanting hotels, budget, name, etc.",
    parameters: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "User session ID",
        },
        suka_bali: {
          type: "boolean",
          description: "Whether user is interested in Bali",
        },
        jual_tour: {
          type: "boolean",
          description: "Whether user is interested in tour packages",
        },
        cari_hotel: {
          type: "boolean",
          description: "Whether user is looking for hotels",
        },
        budget: {
          type: "number",
          description: "User budget in IDR",
        },
        nama: {
          type: "string",
          description: "User's name",
        },
      },
      required: ["user_id"],
    },
  },
  // ─── Market Tools ────────────────────────────────────────────────────────
  {
    name: "bikin_iklan",
    description: "Create a market listing/advertisement ONLY when user explicitly wants to SELL an item. NEVER call this when user asks about buying, how to buy, payment methods, or product info. Only call when user says: 'mau jual', 'fa'an', 'jual motor', 'pasang iklan', 'bikin iklan', 'create listing', 'post ad'.",
    parameters: {
      type: "object",
      properties: {
        nama_barang: {
          type: "string",
          description: "Name of the item to sell",
        },
        kondisi: {
          type: "string",
          enum: ["baru", "bekas", "refurbished"],
          description: "Item condition: baru (new), bekas (used), refurbished",
        },
        harga: {
          type: "number",
          description: "Asking price in IDR (optional)",
        },
        deskripsi: {
          type: "string",
          description: "Short description of the item",
        },
        kategori: {
          type: "string",
          description: "Item category (e.g. elektronik, kendaraan, fashion)",
        },
      },
      required: ["nama_barang"],
    },
  },
  {
    name: "cari_harga_pasaran",
    description: "Get estimated market price range for an item. Call ONLY when user asks about price of a specific item to sell or to compare. NEVER call for general questions about buying, payments, or how to buy online.",
    parameters: {
      type: "object",
      properties: {
        nama_barang: {
          type: "string",
          description: "Name of the item to check price for",
        },
        kategori: {
          type: "string",
          description: "Item category",
        },
        lokasi: {
          type: "string",
          description: "Location for price reference",
        },
      },
      required: ["nama_barang"],
    },
  },
];

/**
 * Get function definitions filtered by chat type.
 * Travel = travel tools + global; Market = market tools + global.
 */
export function getDefinitionsForChatType(tipeChat: "travel" | "market"): FunctionDef[] {
  const travelOnly = ["search_flights", "validate_passport", "start_booking", "check_booking_status", "get_weather", "get_visa_info"];
  const marketOnly = ["bikin_iklan", "cari_harga_pasaran"];
  const global = ["simpan_memory_user"];

  const allowedNames = new Set(
    tipeChat === "travel"
      ? [...travelOnly, ...global]
      : [...marketOnly, ...global]
  );

  return FUNCTION_DEFINITIONS.filter(f => allowedNames.has(f.name));
}
