/**
 * RANIA SessionManager
 * ────────────────────
 * • Auto-saves chat messages (debounced 500ms)
 * • Persists booking draft per field (on blur / pause)
 * • Anti-reset: restores session on remount / reconnect
 * • In-memory + localStorage sync
 * • Cleanup: keeps only last 200 messages + sessions < 24h
 */

export interface SessionData {
  sessionId: string;
  messages: unknown[];
  bookingDraft: Record<string, unknown>;
  currentStep: number;
  lastActivity: number;
  language: string;
  voiceSettings: { enabled: boolean; volume: number };
}

const LS_SESSION_KEY = "rania_session_v2";
const MAX_MESSAGES = 200;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

// ─── Generate / load session ID ─────────────────────────────────────────────
function makeSessionId(): string {
  return `rania_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadRaw(): Partial<SessionData> {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<SessionData>;
    // Expire sessions older than 24 h
    if (parsed.lastActivity && Date.now() - parsed.lastActivity > SESSION_TTL_MS) {
      localStorage.removeItem(LS_SESSION_KEY);
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export const SessionManager = {
  /** Load (or create) the current session */
  load(): SessionData {
    const raw = loadRaw();
    return {
      sessionId:     raw.sessionId     ?? makeSessionId(),
      messages:      raw.messages      ?? [],
      bookingDraft:  raw.bookingDraft  ?? {},
      currentStep:   raw.currentStep   ?? 1,
      lastActivity:  raw.lastActivity  ?? Date.now(),
      language:      raw.language      ?? detectBrowserLang(),
      voiceSettings: raw.voiceSettings ?? { enabled: true, volume: 0.7 },
    };
  },

  /** Save the full session (debounced externally) */
  save(data: Partial<SessionData>): void {
    try {
      const existing = loadRaw();
      const merged: SessionData = {
        sessionId:     existing.sessionId     ?? makeSessionId(),
        messages:      [],
        bookingDraft:  {},
        currentStep:   1,
        language:      "id",
        voiceSettings: { enabled: true, volume: 0.7 },
        ...existing,
        ...data,
        lastActivity:  Date.now(),
      };
      // Limit message history
      if (merged.messages.length > MAX_MESSAGES) {
        merged.messages = merged.messages.slice(-MAX_MESSAGES);
      }
      localStorage.setItem(LS_SESSION_KEY, JSON.stringify(merged));
    } catch {
      // Storage full — silently ignore
    }
  },

  /** Append a single message without overwriting existing ones */
  appendMessage(msg: unknown): void {
    const s = loadRaw();
    const msgs = s.messages ?? [];
    msgs.push(msg);
    if (msgs.length > MAX_MESSAGES) msgs.splice(0, msgs.length - MAX_MESSAGES);
    SessionManager.save({ messages: msgs });
  },

  /** Save one booking draft field */
  saveDraftField(field: string, value: unknown): void {
    const s = loadRaw();
    const draft = { ...(s.bookingDraft ?? {}), [field]: value };
    SessionManager.save({ bookingDraft: draft });
  },

  /** Clear booking draft after successful booking */
  clearDraft(): void {
    SessionManager.save({ bookingDraft: {}, currentStep: 1 });
  },

  /** Update language */
  saveLanguage(lang: string): void {
    SessionManager.save({ language: lang });
  },

  /** Update voice settings */
  saveVoiceSettings(settings: { enabled: boolean; volume: number }): void {
    SessionManager.save({ voiceSettings: settings });
  },

  /** Get the stored session ID */
  getSessionId(): string {
    return loadRaw().sessionId ?? makeSessionId();
  },

  /** Clear everything (logout / hard reset) */
  clear(): void {
    localStorage.removeItem(LS_SESSION_KEY);
  },
};

// ─── Debounce helper ─────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// ─── Browser language detection ─────────────────────────────────────────────
export function detectBrowserLang(): string {
  const nav = navigator.language || "";
  if (nav.startsWith("id") || nav.startsWith("ms")) return "id";
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("en")) return "en";
  return "id"; // default Bahasa Indonesia for Timor-Leste
}

// ─── Request dedup store ─────────────────────────────────────────────────────
const _usedIds = new Set<string>();
const _usedIdTimestamps = new Map<string, number>();
const DEDUP_TTL_MS = 30_000; // 30s

export const RequestDedup = {
  /** Generate a new unique request ID */
  newId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  },

  /** Mark a request ID as used (returns false if already used = duplicate) */
  markUsed(id: string): boolean {
    // Cleanup old IDs
    const now = Date.now();
    for (const [k, ts] of _usedIdTimestamps) {
      if (now - ts > DEDUP_TTL_MS) {
        _usedIds.delete(k);
        _usedIdTimestamps.delete(k);
      }
    }
    if (_usedIds.has(id)) return false;
    _usedIds.add(id);
    _usedIdTimestamps.set(id, now);
    return true;
  },
};
