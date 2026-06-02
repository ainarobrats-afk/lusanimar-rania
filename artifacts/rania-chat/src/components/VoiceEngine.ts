/**
 * RANIA Voice Engine — ElevenLabs Primary
 * ─────────────────────────────────────────
 * Tier 1 (Primary) → ElevenLabs TTS  · RANIA New Custom Voice (Natural Tetum Dili)
 * Tier 2 (Fallback) → Web Speech API · jika ElevenLabs tidak tersedia
 *
 * Voice ID: EXAVITQu4vr4xnSDxMaL  ← Bella (ElevenLabs Premium Default)
 * Base URL: https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL
 * Model: eleven_multilingual_v2 — optimized for Tetum Dili + Indonesia natural speech
 */

const API = "/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_MONTHLY_CHARS   = 10_000; // ElevenLabs free tier
const BUDGET_WARN_PCT      = 0.8;

const LS_MONTHLY_CHARS = "rania_voice_monthly_chars";
const LS_MONTHLY_MONTH = "rania_voice_monthly_month";
const LS_CACHE_PREFIX  = "rania_voice_cache_";

// ─── Critical event detection ─────────────────────────────────────────────────
const CRITICAL_KEYWORDS = [
  "BERHASIL", "DIKONFIRMASI", "DITERBITKAN", "SELAMAT", "PEMBAYARAN SUKSES",
  "E-TIKET", "TIKET SUDAH",
  "CONFIRMED", "TICKET ISSUED", "PAYMENT SUCCESS", "BOOKING CONFIRMED",
  "CONGRATULATIONS", "E-TICKET",
  "KONFIRMADU", "BILHETE EMITIDU", "PARABÉNS",
  "CONFIRMADO", "EMITIDO",
];

export function isCriticalEvent(text: string): boolean {
  const upper = text.toUpperCase();
  return CRITICAL_KEYWORDS.some((kw) => upper.includes(kw));
}

// ─── Monthly character budget ────────────────────────────────────────────────
function getThisMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function getMonthlyChars(): number {
  const thisMonth = getThisMonthKey();
  if (localStorage.getItem(LS_MONTHLY_MONTH) !== thisMonth) return 0;
  return Number(localStorage.getItem(LS_MONTHLY_CHARS) || 0);
}

function addMonthlyChars(n: number): void {
  const thisMonth = getThisMonthKey();
  if (localStorage.getItem(LS_MONTHLY_MONTH) !== thisMonth) {
    localStorage.setItem(LS_MONTHLY_MONTH, thisMonth);
    localStorage.setItem(LS_MONTHLY_CHARS, String(n));
  } else {
    const prev = Number(localStorage.getItem(LS_MONTHLY_CHARS) || 0);
    localStorage.setItem(LS_MONTHLY_CHARS, String(prev + n));
  }
}

function isOverBudget(): boolean {
  return getMonthlyChars() >= FREE_MONTHLY_CHARS * BUDGET_WARN_PCT;
}

// ─── Smart cache ──────────────────────────────────────────────────────────────
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function cacheKey(text: string): string {
  return LS_CACHE_PREFIX + btoa(encodeURIComponent(text.slice(0, 40))).slice(0, 20) + text.length;
}

function isCachedToday(text: string): boolean {
  return localStorage.getItem(cacheKey(text)) === getTodayKey();
}

function markCachedToday(text: string): void {
  localStorage.setItem(cacheKey(text), getTodayKey());
  const cacheKeys = Object.keys(localStorage).filter((k) => k.startsWith(LS_CACHE_PREFIX));
  if (cacheKeys.length > 30) {
    cacheKeys.slice(0, cacheKeys.length - 30).forEach((k) => localStorage.removeItem(k));
  }
}

// ─── Text cleaner for TTS ─────────────────────────────────────────────────────
function cleanForTts(text: string): string {
  return text
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
}

function truncateForTts(text: string, maxChars = 300): string {
  if (text.length <= maxChars) return text;
  const idx = text.lastIndexOf(" ", maxChars);
  return text.slice(0, idx > 100 ? idx : maxChars);
}

// ─── Stop any active TTS ──────────────────────────────────────────────────────
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  const existing = document.getElementById("rania-voice-player") as HTMLAudioElement | null;
  if (existing) {
    existing.pause();
    existing.remove();
  }
}

// ─── Tier 1: ElevenLabs via backend proxy (primary) ──────────────────────────
async function playElevenLabs(
  text: string,
  lang: string,
  volume = 0.85,
  voiceSettings?: { stability: number; similarity_boost: number; style?: number },
): Promise<boolean> {
  const clean = truncateForTts(cleanForTts(text));
  if (!clean) return false;

  // Skip if monthly budget exceeded
  if (isOverBudget()) return false;

  try {
    const body: Record<string, unknown> = { text: clean, lang };
    if (voiceSettings) body.voiceSettings = voiceSettings;

    const res = await fetch(`${API}/rania/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (!data.audioUrl && !data.audioBase64) return false;

    const audioSrc = data.audioUrl
      ? data.audioUrl
      : `data:audio/mpeg;base64,${data.audioBase64}`;

    // Stop any previous audio
    stopSpeaking();

    const audio = new Audio(audioSrc);
    audio.id = "rania-voice-player";
    audio.volume = volume;
    await audio.play();

    addMonthlyChars(clean.length);
    markCachedToday(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Tier 2: Web Speech API fallback ─────────────────────────────────────────
// Voice priority: prefer local device TTS (Siri/Samsung) > Microsoft > Google (robotic)
const VOICE_PREF_ID = [
  // Premium device voices (Apple, Samsung — sound natural)
  "Siri", "Damayanti", "Kyoko", "Yuna",
  // Microsoft voices (good quality)
  "Microsoft Gadis",  "Microsoft Andika", "Microsoft Zira", "Microsoft Aria",
  // Last resort: Google (still robotic but functional)
  "Google Bahasa Indonesia", "Google Indonesian",
];
const VOICE_PREF_EN = [
  "Siri", "Samantha", "Karen", "Tessa",
  "Microsoft Aria", "Microsoft Zira", "Microsoft David",
  "Google US English", "Google UK English Female",
];

function pickVoice(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | undefined {
  const prefs = locale.startsWith("en") ? VOICE_PREF_EN : VOICE_PREF_ID;
  for (const name of prefs) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  // Fallback: any voice matching locale
  return voices.find(v => v.lang === locale || v.lang.startsWith(locale.slice(0, 2)));
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length > 0) return voices;
  return new Promise((resolve) => {
    const handler = () => { resolve(synth.getVoices()); synth.onvoiceschanged = null; };
    synth.onvoiceschanged = handler;
    setTimeout(() => { synth.onvoiceschanged = null; resolve(synth.getVoices()); }, 300);
  });
}

function speakWebSpeechFallback(
  text: string,
  lang: string,
  volume = 0.85,
  onEnd?: () => void,
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  synth.cancel();

  const locale =
    lang === "id"  ? "id-ID" :
    lang === "pt"  ? "pt-PT" :
    lang === "tet" ? "id-ID" :
    lang === "en"  ? "en-US" : "id-ID";

  const speak = (voice?: SpeechSynthesisVoice) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = locale;
    utterance.rate   = 0.82;   // slightly slower = more natural cadence
    utterance.pitch  = 0.94;   // slightly lower = less robot-like
    utterance.volume = volume;
    if (voice) utterance.voice = voice;
    utterance.onend   = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    try { synth.speak(utterance); } catch { onEnd?.(); }
  };

  // Load voices async (browser loads them lazily on first call)
  loadVoices().then(voices => speak(pickVoice(voices, locale)));
}

// ─── Tier 1 (legacy export) — now delegates to ElevenLabs primary ─────────────
export async function speakTier1(
  text: string,
  lang: string,
  volume = 0.85,
  onEnd?: () => void,
): Promise<void> {
  const clean = cleanForTts(text);
  if (!clean) { onEnd?.(); return; }
  const played = await playElevenLabs(clean, lang, volume);
  if (!played) {
    speakWebSpeechFallback(clean, lang, volume, onEnd);
  } else {
    onEnd?.();
  }
}

// ─── Welcome Voice System ────────────────────────────────────────────────────
const LS_WELCOME_SESSION = "rania_welcome_voiced";

// Sapaan berdasarkan waktu lokal user (Tetum Dili)
function getTimeGreeting(lang: "tetum" | "indonesia" | "english"): string {
  const hour = new Date().getHours();
  const greetings = {
    tetum: hour < 12 ? "Bondia" : hour < 17 ? "Botarde" : "Bonoite",
    indonesia: hour < 12 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam",
    english: hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
  };
  return greetings[lang];
}

// Pesan sambutan natural Tetum Dili — disesuaikan dengan waktu
function buildWelcomeMessage(lang: "tetum" | "indonesia" | "english"): string {
  const greeting = getTimeGreeting(lang);
  const messages: Record<"tetum" | "indonesia" | "english", string> = {
    tetum: `${greeting}! Hau nia naran RANIA, asistente viajen ita nian iha Lu Sanimar. Hau bele ajuda ita buka tiket, hotel, no informasaun viajen. Ita hakarak ba ne'ebé ohin?`,
    indonesia: `${greeting}! Nama saya RANIA, asisten perjalanan Anda di Lu Sanimar. Saya bisa bantu cari tiket, hotel, dan informasi wisata. Mau kemana hari ini?`,
    english: `${greeting}! I'm RANIA, your travel assistant at Lu Sanimar. I can help you find flights, hotels, and travel tips. Where would you like to go today?`,
  };
  return messages[lang];
}

const WELCOME_VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.80,
  style: 0.2,
};

function langToWelcomeKey(lang: string): "tetum" | "indonesia" | "english" {
  if (lang === "tet") return "tetum";
  if (lang === "id") return "indonesia";
  if (lang === "en") return "english";
  return "tetum";
}

export async function triggerWelcomeVoice(lang: string): Promise<void> {
  if (sessionStorage.getItem(LS_WELCOME_SESSION)) return;
  sessionStorage.setItem(LS_WELCOME_SESSION, "1");

  const key = langToWelcomeKey(lang);
  const text = buildWelcomeMessage(key);

  // ElevenLabs primary — RANIA New Custom Voice (Natural Tetum Dili)
  const played = await playElevenLabs(text, lang, 0.9, WELCOME_VOICE_SETTINGS);

  // Fallback: Web Speech API
  if (!played) {
    speakWebSpeechFallback(text, lang, 0.9);
  }
}

// ─── Main hybrid entry point ─────────────────────────────────────────────────
export async function hybridSpeak(
  text: string,
  lang: string,
  opts: {
    forcePremium?: boolean;
    volume?: number;
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
  } = {},
): Promise<void> {
  const { volume = 0.85, onSpeakStart, onSpeakEnd } = opts;

  onSpeakStart?.();

  const clean = cleanForTts(text);
  if (!clean) { onSpeakEnd?.(); return; }

  // Skip cached text (already spoken today) to save ElevenLabs quota
  if (isCachedToday(text)) {
    // Still speak via Web Speech API for user feedback
    speakWebSpeechFallback(clean, lang, volume, onSpeakEnd);
    return;
  }

  // ElevenLabs primary (natural Indonesian & Tetum)
  const played = await playElevenLabs(clean, lang, volume);
  if (played) {
    onSpeakEnd?.();
    return;
  }

  // Web Speech API fallback
  speakWebSpeechFallback(clean, lang, volume, onSpeakEnd);
}

// ─── Public stats for Admin Dashboard ────────────────────────────────────────
export interface VoiceStats {
  monthlyCharsUsed: number;
  monthlyCharsLimit: number;
  monthlyBudgetPct: number;
  isOverBudget: boolean;
  estimatedCostUsd: number;
  voiceEngine: "ElevenLabs";
  voiceId: string;
}

export function getVoiceStats(): VoiceStats {
  const monthlyCharsUsed = getMonthlyChars();
  const monthlyBudgetPct = Math.round((monthlyCharsUsed / FREE_MONTHLY_CHARS) * 100);
  return {
    monthlyCharsUsed,
    monthlyCharsLimit: FREE_MONTHLY_CHARS,
    monthlyBudgetPct,
    isOverBudget: isOverBudget(),
    estimatedCostUsd: parseFloat(((monthlyCharsUsed / 1000) * 0.3).toFixed(3)),
    voiceEngine: "ElevenLabs",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella — ElevenLabs Premium Default
  };
}
