/**
 * RANIA Client Cache Layer
 * ─────────────────────────
 * Lightweight in-memory + localStorage TTL cache
 * Prevents redundant API calls on slow / expensive connections
 *
 * TTLs:
 *   flights  → 5 min
 *   weather  → 15 min
 *   currency → 30 min
 *   visa     → 60 min
 *   airports → 12 h
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const TTL = {
  flights:  5  * 60_000,
  weather:  15 * 60_000,
  currency: 30 * 60_000,
  visa:     60 * 60_000,
  airports: 12 * 60 * 60_000,
} as const;

type CacheNS = keyof typeof TTL;

// In-memory store (cleared on page reload — that's fine for most data)
const _store = new Map<string, CacheEntry<unknown>>();

// Optional localStorage persistence for currency / airports
const LS_PERSIST: CacheNS[] = ["currency", "airports"];
const LS_PREFIX = "rania_cache_";

function lsKey(ns: CacheNS, key: string) {
  return `${LS_PREFIX}${ns}_${key}`;
}

function readLs<T>(ns: CacheNS, key: string): T | null {
  if (!LS_PERSIST.includes(ns)) return null;
  try {
    const raw = localStorage.getItem(lsKey(ns, key));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(lsKey(ns, key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeLs<T>(ns: CacheNS, key: string, entry: CacheEntry<T>): void {
  if (!LS_PERSIST.includes(ns)) return;
  try {
    localStorage.setItem(lsKey(ns, key), JSON.stringify(entry));
  } catch { /* quota exceeded — ignore */ }
}

export const ClientCache = {
  get<T>(ns: CacheNS, key: string): T | null {
    const memKey = `${ns}:${key}`;
    const mem = _store.get(memKey) as CacheEntry<T> | undefined;
    if (mem && Date.now() < mem.expiresAt) return mem.data;
    // Fallback to localStorage for persistent namespaces
    return readLs<T>(ns, key);
  },

  set<T>(ns: CacheNS, key: string, data: T): void {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + TTL[ns] };
    _store.set(`${ns}:${key}`, entry as CacheEntry<unknown>);
    writeLs(ns, key, entry);
  },

  invalidate(ns: CacheNS, key: string): void {
    _store.delete(`${ns}:${key}`);
    try { localStorage.removeItem(lsKey(ns, key)); } catch { /* ignore */ }
  },

  /** Fetch helper: returns cache if fresh, otherwise fetches + caches */
  async fetch<T>(
    ns: CacheNS,
    key: string,
    url: string,
    opts?: RequestInit,
  ): Promise<T | null> {
    const cached = ClientCache.get<T>(ns, key);
    if (cached !== null) return cached;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(url, {
        ...opts,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json() as T;
      ClientCache.set(ns, key, data);
      return data;
    } catch {
      return null;
    }
  },

  /** Clear all in-memory cache (on manual refresh) */
  clearAll(): void {
    _store.clear();
  },
};

/** Convenience typed wrappers */
const API = "/api";

export async function cachedFlights(
  from: string, to: string, date?: string,
): Promise<unknown | null> {
  const key = `${from}-${to}-${date ?? "any"}`;
  return ClientCache.fetch(
    "flights", key,
    `${API}/rania/flights?from=${from}&to=${to}${date ? `&date=${date}` : ""}`,
  );
}

export async function cachedWeather(city: string): Promise<unknown | null> {
  return ClientCache.fetch(
    "weather", city.toLowerCase(),
    `${API}/rania/weather?city=${encodeURIComponent(city)}`,
  );
}

export async function cachedCurrency(): Promise<unknown | null> {
  return ClientCache.fetch("currency", "current", `${API}/rania/currency`);
}

export async function cachedVisa(from: string, to: string): Promise<unknown | null> {
  return ClientCache.fetch("visa", `${from}-${to}`, `${API}/rania/visa?from=${from}&to=${to}`);
}

export async function cachedAirports(): Promise<unknown | null> {
  return ClientCache.fetch("airports", "all", `${API}/rania/airports`);
}
