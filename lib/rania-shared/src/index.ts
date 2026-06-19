// ============================================================================
// RANIA V2.1 — Shared Library Entry Point
// The Safe Ghost Engine
// ============================================================================

export * from "./types";
export * from "./cors";
export * from "./errors";
export * from "./iron-rules";

// Environment types are opt-in (import from "@workspace/rania-shared/env")
// because each worker has different env requirements.

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Generate a unique ID for bookings, payments, etc.
 * Format: {prefix}-{timestamp}-{random}
 */
export function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Parse JSON safely, returning null on error.
 */
export function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Detect language from user input (Tetun, Indonesian, Portuguese, English).
 * Used by worker-parser for AI responses.
 */
export function detectLanguage(text: string): "id" | "tet" | "pt" | "en" {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = { tet: 0, id: 0, pt: 0, en: 0 };

  const tetunKeys = ["bondia", "botarde", "bonoite", "kaka", "ha'u", "ita", "mau", "buka", "tiket", "voo", "aviaun", "dili", "timor", "deskulpa", "bele", "oin", "obrigadu", "obrigada"];
  const idKeys = ["halo", "selamat pagi", "selamat siang", "selamat malam", "kaka", "saya", "anda", "mau", "cari", "tiket", "pesawat", "harga", "dari", "ke", "bali", "dili", "apa kabar", "terima kasih", "tolong", "bagaimana"];
  const ptKeys = ["bom dia", "boa tarde", "boa noite", "você", "eu", "quer", "procurar", "bilhete", "voo", "de", "para", "obrigado", "por favor"];
  const enKeys = ["hello", "good morning", "good afternoon", "good evening", "you", "i want", "search", "ticket", "flight", "from", "to", "price", "thank you", "please"];

  tetunKeys.forEach(w => { if (lower.includes(w)) scores.tet += 2; });
  idKeys.forEach(w => { if (lower.includes(w)) scores.id += 3; });
  ptKeys.forEach(w => { if (lower.includes(w)) scores.pt += 2; });
  enKeys.forEach(w => { if (lower.includes(w)) scores.en += 1; });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] > 0) {
    return sorted[0][0] as "id" | "tet" | "pt" | "en";
  }
  return "id"; // default to Indonesian
}

/**
 * Format currency for display (IDR, USD, etc.).
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    IDR: "Rp",
    AUD: "A$",
    EUR: "€",
    SGD: "S$",
  };
  const symbol = symbols[currency] || currency + " ";
  if (currency === "IDR") {
    return `${symbol}${amount.toLocaleString("id-ID")}`;
  }
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/**
 * Sleep helper for async delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a date is valid and in the future.
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date > new Date();
}

/**
 * Check if passport expiry is at least 6 months from travel date.
 */
export function isPassportValid6Months(passportExpiry: string, travelDate: string): boolean {
  const expiry = new Date(passportExpiry);
  const travel = new Date(travelDate);
  if (isNaN(expiry.getTime()) || isNaN(travel.getTime())) return false;

  const sixMonthsLater = new Date(travel);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  return expiry >= sixMonthsLater;
}
