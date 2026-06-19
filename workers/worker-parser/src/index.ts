// ============================================================================
// RANIA V2.1 — Worker Parser (AI Chat with Function Calling)
// The Safe Ghost Engine
//
// POST /api/chat — Main chat endpoint with function calling
// GET  /api/health — Health check
// ============================================================================

import { callGroq } from "./providers/groq";
import { callGemini } from "./providers/gemini";
import { callCerebras } from "./providers/cerebras";
import { executeFunction } from "./functions/handler";
import { getDefinitionsForChatType } from "./functions/definitions";
import { getTravelPrompt, getMarketPrompt, injectMemoryIntoPrompt } from "./prompts";
import { loadUserMemory, extractMemoryFromText, saveUserMemory, detectTravelIntentInMarket, detectMarketIntentInTravel, handleAdsTopup, handleXenditWebhook, handleAdsCreateCampaign, handleAdsClick, handleGetSponsoredListings, handleAdsDashboard, handleAcceptTerms, detectBannedContent, handleAdsCron, handleHotelBooking } from "./tools";
import type { FunctionDef } from "@workspace/rania-shared/types";

// ─── Environment ─────────────────────────────────────────────────────────────

interface Env {
  GROQ_API_KEY_1: string;
  GROQ_API_KEY_2: string;
  GEMINI_API_KEY: string;
  CEREBRAS_KEY: string;
  WORKER_HUNTER_URL: string;
  WORKER_VALIDATOR_URL: string;
  WORKER_CASHIER_URL: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  XENDIT_API_KEY?: string;
  XENDIT_CALLBACK_TOKEN?: string;
  CRON_SECRET?: string;  // Secret token for cron endpoint
  FUNDENG_WA_NUMBER?: string;  // WhatsApp Business API number
  HUNTER?: { fetch: (req: Request) => Promise<Response> };
  VALIDATOR?: { fetch: (req: Request) => Promise<Response> };
  CASHIER?: { fetch: (req: Request) => Promise<Response> };
}

// ─── System Prompts per bahasa ───────────────────────────────────────────────

// TETUN PRASA — Gaya natural Dili (Labadain corpus, Gabriel de Jesus 2024)
// Referensi: labadain.com, labadain-30k+, tetun-lid
const TETUN_SYSTEM_PROMPT = `Ha'u mak RANIA, asistente viajen profesonál husi LU SANIMAR TRAVEL iha Dili, Timor-Leste.

GIDAUN PRINCIPAL:
- Koalia Tetun natura, profesonál, no respeitu.
- Labele uza bahasa Indonesia ka mistura lian sira.
- Labele koalia hanesan robô; uza fraze simples, ramah, no diretu.
- Hodi evita repetisaun: labele sobra uza ita nia naran fali-fali.

KONTEXT & GREETING:
- Jika user hamutuk greet (bondia, botarde, obrigadu), responde hatán mós, hanesan: "Bondia! 😊\nHa'u mak RANIA, asistente viajen husi LU SANIMAR Travel." Jangan langsung koloka search_flights.
- Balun resposta tenke kurtu (1-3 lina) no klaru.

PRINSÍPIU FLIGHT SEARCH (WAJAN):
1) SELUK HAKARAK: Jika user klaru husu tiket/jadwal/harga → METER search_flights.
2) TANYA DATA: **HANYA** pidi data partida — frasa rekomendada: "Favor fo data partida".
   - Jangan tanya: "Sa loron?", "Loron hira?", "Viajen hira loron?", "One way ka return?".
3) JANGAN nyaran durasaun, one-way/return, ka passenger count — Flight Card nangin sumber informasi.

FLIGHT CARD RULES (UI-INTEGRITY):
- Jika \`flights[]\` presente, FRONTEND wajib render Flight Card.
- RANIA mung sira fo pengantar singkat, contu: "Diak! Ha'u hetan opsaun voo disponivel ba data ne'e." lalu berhenti; jangan list harga teks.
- Jika user tanya "Aviaun seluk sei iha ka lae?" → Gunakan \`flights[]\` resultados yang ada; JANGAN panggil search baru.

AERO DILI PRIORITY RULE:
- Jika user menyebut "Aero Dili", "Timor Airline", "Aviaun Timor" → Prioritiza Aero Dili (kode preferida: 8G) pada hasil yang sudah ada dari API.
- Jika Aero Dili iha result → Tampilkan Flight Card Aero Dili terlebih dahulu.
- Jika la iha Aero Dili → Jawaba: "Deskulpa, Aero Dili la disponivel ba data ne'e. Maibé iha opsaun seluk disponivel."

SAFETY & DATA RULES:
- Nunca inventa harga, jadwal, ka availability. Todo prezus/horarios mai husi \`search_flights\` API.
- Nunca sebut supplier tekniku (Kiwi, Travelpayouts) ka link eksternal selain yang direquest (labadain.com link boleh dipakai jika releván).

LINGUA & TONA:
- Tetun natural, profesonál, ramah. Maksimu 4-6 lina kanggo jawaban normal.
- Hindara ulang-ulang naran user. Gunaka naran seluk sakali mun ne'be apropriad.

EZEMPLU KASU:
User: "Hi Rania"
RANIA: "Bondia! 😊\nHa'u mak RANIA, asistente viajen LU SANIMAR Travel.\nBele ajuda ita buka:\n✈️ Tiket aviaun\n🏨 Hotel\n📋 Informasaun Visa\n🗺️ Paket Tour\n🌤️ Informasaun destinasaun\n\nAntes komesa, favor hatete ita nia naran?"

User: "Hau nia naran Mario"
RANIA: "Diak, Maun Mario! 😊\nKlaru, ha'u bele ajuda. Saida mak ita presiza ohin?"

PENUTUP:
- Ikus ida-ne'e no aplikasaun rules sira husi prompt mai nian durante conversasaun nian.
`;

const INDONESIA_SYSTEM_PROMPT = `Kamu adalah RANIA, asisten perjalanan profesional dari LU SANIMAR TRAVEL, Timor-Leste.

ATURAN BAHASA: Jawab 100% BAHASA INDONESIA. JANGAN campur bahasa lain.

ATURAN TIKET:
1. Jika user HANYA menyapa → jawab ramah, JANGAN panggil search_flights
2. Jika user minta tiket/harga/jadwal pesawat → LANGSUNG panggil search_flights
3. Jika rute ada tapi tanggal belum ada → tanya tanggal 1 kalimat singkat
4. JANGAN sebut nama supplier (Kiwi, Travelpayouts, dll)
5. Setelah hasil search → sampaikan singkat dan ramah

LARANGAN: Jangan tebak harga. Jangan sebut link/WA. Maksimal 8 baris.`;

const ENGLISH_SYSTEM_PROMPT = `You are RANIA, a professional travel assistant from LU SANIMAR TRAVEL, Timor-Leste.

LANGUAGE: Reply 100% in English only. Never mix languages.

RULES:
1. If user only greets → reply warmly, do NOT call search_flights
2. If user asks for tickets/prices/flights → IMMEDIATELY call search_flights
3. If route present but no date → ask for date in 1 short sentence
4. NEVER mention supplier names (Kiwi, Travelpayouts, etc.)

FORBIDDEN: Never guess prices. Max 8 lines.`;

const PORTUGUES_SYSTEM_PROMPT = `Você é RANIA, assistente de viagens da LU SANIMAR TRAVEL, Timor-Leste.

IDIOMA: Responda 100% em Português. Nunca misture idiomas.

REGRAS:
1. Se apenas cumprimenta → responda com simpatia, NÃO chame search_flights
2. Se pede passagem/preço/voo → chame search_flights IMEDIATAMENTE
3. Se tem rota mas sem data → pergunte a data em 1 frase curta
4. NUNCA mencione nomes de fornecedores (Kiwi, Travelpayouts, etc.)

PROIBIDO: Nunca invente preços. Máximo 8 linhas.`;

function getSystemPrompt(lang: string): string {
  switch (lang) {
    case "tet": return TETUN_SYSTEM_PROMPT;
    case "pt":  return PORTUGUES_SYSTEM_PROMPT;
    case "en":  return ENGLISH_SYSTEM_PROMPT;
    default:    return INDONESIA_SYSTEM_PROMPT;
  }
}

const SYSTEM_PROMPT = INDONESIA_SYSTEM_PROMPT;

// ─── Fallback Responses ──────────────────────────────────────────────────────
// Dual-core: fallback berbeda untuk travel vs market

const FALLBACKS_TRAVEL: Record<string, string> = {
  id: "Halo! Saya Rania dari LU SANIMAR TRAVEL. Ada yang bisa saya bantu untuk penerbangan atau perjalanan?",
  tet: "Bondia! Ha'u mak RANIA husi LU SANIMAR TRAVEL. Bele ajuda ita ho tiket aviaun, hotel, ka visa. Saida mak ita hakarak?",
  pt: "Olá! Sou a Rania, da LU SANIMAR TRAVEL. Como posso ajudar com a sua viagem?",
  en: "Hello! I'm Rania from LU SANIMAR TRAVEL. How can I help with your travel plans?",
};

const FALLBACKS_MARKET: Record<string, string> = {
  id: "Halo Bos! Saya RANIA, Asisten Sales & Marketing Sanimar Market. Mau jual, beli, atau tanya harga? Saya siap bantu! 😊",
  tet: "Ola Maun/Mana! Ha'u mak RANIA husi Sanimar Market. Bele ajuda ita ho fa'an barang, sosa barang, ka informasaun harga. Saida mak ita hakarak?",
  pt: "Olá! Sou a RANIA do Sanimar Market. Posso ajudar a comprar, vender ou verificar preços. Como posso ajudar?",
  en: "Hello! I'm RANIA from Sanimar Market. I can help you buy, sell, or check prices. What do you need?",
};

// Helper: get context-aware fallback
function getFallback(lang: string, tipeChat: "travel" | "market" = "travel"): string {
  const map = tipeChat === "market" ? FALLBACKS_MARKET : FALLBACKS_TRAVEL;
  return map[lang] || map.id;
}

// Keep FALLBACKS for legacy code compatibility
const FALLBACKS: Record<string, string> = FALLBACKS_TRAVEL;

// ─── Language Detection ──────────────────────────────────────────────────────

function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = { tet: 0, id: 0, pt: 0, en: 0 };

  // Tetun Prasa (Dili) — expanded kata natural + "hare", "hau"
  const tetunWords = [
    "bondia","botarde","boanoite","bonoite","ha'u","hau","hakarak","aviaun","bele","viajen",
    "loron","hira","maun","mana","iha","husi","folin","tiket","hare",
    "aeroportu","oinsá","oinsa","nia","sira","hatene","buka","presiza",
    "obrigadu","obrigada","diak","hotu","la bele","atu","sei","ona",
    "ne'ebé","saida","hanesan","bainhira","karik","liu","nafatin",
    "dadeer","di'ak","reserve","voo","partida","chegada","paxporte",
    "rezerva","pagamentu","baratu","lais","diak liu","baratu liu",
  ];
  const tetunBoostWords = [
    "bondia","botarde","boanoite","ha'u","hau","hakarak","aviaun","oinsá","oinsa",
    "maun","mana","diak","ne'ebé","bainhira","dadeer","di'ak","hare",
  ];

  tetunWords.forEach(w => { if (lower.includes(w)) scores.tet += 3; });
  tetunBoostWords.forEach(w => { if (lower.includes(w)) scores.tet += 5; });

  const idWords = [
    "halo","selamat","saya","anda","mau","cari","tiket","pesawat","harga","dari",
    "ke","apa kabar","terima kasih","tolong","bagaimana","tidak","bisa","minta",
    "pergi","terbang","penerbangan","bang","kak","berapa","kapan","tanggal",
    "bulan","januari","februari","maret","april","mei","juni","juli",
    "agustus","september","oktober","november","desember",
  ];
  idWords.forEach(w => { if (lower.includes(w)) scores.id += 4; });

  const ptWords = [
    "bom dia","boa tarde","boa noite","você","quer","bilhete","voo",
    "obrigado","por favor","passagem","passaporte",
  ];
  ptWords.forEach(w => { if (lower.includes(w)) scores.pt += 3; });

  const enWords = [
    "hello","good morning","good afternoon","want","search","ticket",
    "flight","price","thank you","please","book","when","where","how much",
  ];
  enWords.forEach(w => { if (lower.includes(w)) scores.en += 2; });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : "id";
}

/**
 * Detect language from conversation history when last message is ambiguous.
 * Used when user sends a date/number reply like "22/06/2026".
 */
function detectLangFromHistory(messages: Array<{ role: string; content: string }>): string {
  const scores: Record<string, number> = { tet: 0, id: 0, pt: 0, en: 0 };
  for (const m of messages.slice(-6)) {
    const detected = detectLanguage(m.content || "");
    scores[detected] = (scores[detected] || 0) + 1;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// ─── CORS Helpers ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-request-id, x-session-id",
};

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ─── Greeting Intent Guard + Context-Aware Detection ─────────────────────────

// Travel intent keywords — Tetun expanded + Indonesian + English
const TRAVEL_INTENT_KEYWORDS_TS: string[] = [
  // Tetun
  "tiket","folin","voo","aviaun","buka tiket","buka voo","hare tiket","hare folin",
  "hare voo","reserva","aeroportu","partida","chegada","paxporte",
  "hakarak ba","atu ba","hau hakarak ba","ita hakarak ba",
  "husi dili","husi bali","husi darwin","husi singapore","husi sydney","husi melbourne",
  "ba dili","ba bali","ba darwin","ba singapore","ba sydney","ba melbourne",
  "ba jakarta","ba kupang","ba surabaya","ba perth",
  "dili ba","bali ba","darwin ba","singapore ba","sydney ba",
  // Indonesian
  "pesawat","penerbangan","terbang","harga tiket","cari tiket","beli tiket","pesan tiket",
  "mau ke","mau pergi","mau terbang","booking",
  // English
  "ticket","flight","book","fly to","travel to","price of","how much","search",
];

// Date patterns — user answering "loron hira?" question
const DATE_PATTERNS_TS: RegExp[] = [
  /\d{1,2}[\/\-\.]\d{1,2}([\/\-\.](\d{2}|\d{4}))?/,
  /\d{4}-\d{2}-\d{2}/,
  /loron\s+\d+/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i,
  /\b(jullu|junhu|maiu|agostu|setembru|outubru|novembru|dezembru)\b/i,
];

const GREETING_ONLY_PATTERNS_TS: RegExp[] = [
  /^(bondia|botarde|boanoite|bom\s+dia|boa\s+tarde|boa\s+noite)\s*(maun|mana|rania|!)?\s*[!?]*$/i,
  /^(halo|hai|hi|hello|hey|hei|oi)\s*(rania|!)?\s*[!?]*$/i,
  /^(selamat\s*(pagi|siang|sore|malam))\s*[!?]*$/i,
  /^(good\s*(morning|afternoon|evening|night))\s*[!?]*$/i,
  /^(obrigadu|obrigada|obrigado|terima\s+kasih|makasih|thank\s+you|thanks)\s*[!.,]*$/i,
  /^(ola|olá)\s*[!?]*$/i,
  /^(oinsa\s*ita|oinsá\s*ita|how\s+are\s+you|apa\s+kabar|como\s+vai)\s*[?!]*$/i,
  /^(ita\s+diak\s+ka\s+lae|diak\s+ka\s+lae)\s*[?!]*$/i,
  /^(botarde|bondia|boanoite)\s+ita\s+diak\s+ka\s+lae\s*[?!]*$/i,
  /^(sama.?sama|de\s+nada|you.?re\s+welcome)\s*[!.,]*$/i,
];

/**
 * Check if RANIA previously asked for a date and conversation had a destination.
 * Prevents treating a date answer (e.g. "22/06/2026") as a greeting/reset.
 */
function hasPendingTravelContext(msgs: Array<{ role: string; content: string }>): boolean {
  if (!msgs || msgs.length < 2) return false;
  const recent = msgs.slice(-4);

  const dateRequestPhrases = [
    "loron hira","viajen loron","fo data","tanggal berapa",
    "mau berangkat tanggal","what date","which date","departure date",
    "bainhira","when do you","when would you",
  ];
  const assistantAskedDate = recent.some(m =>
    m.role === "assistant" &&
    dateRequestPhrases.some(p => (m.content || "").toLowerCase().includes(p))
  );
  if (!assistantAskedDate) return false;

  const destinations = [
    "dili","bali","darwin","singapore","sydney","melbourne","perth","brisbane",
    "jakarta","kupang","surabaya","bangkok","kuala lumpur","hong kong","tokyo",
    "dil","dps","drw","sin","syd","mel","cgk","koe","sub","bkk","kul","hkg","nrt","icn",
  ];
  return recent.some(m =>
    destinations.some(d => (m.content || "").toLowerCase().includes(d))
  );
}

function isGreetingMessage(text: string, messages?: Array<{ role: string; content: string }>): boolean {
  const lower = text.trim().toLowerCase();

  // Context check: user answering a date question → never a greeting
  if (messages && hasPendingTravelContext(messages)) return false;

  // Explicit travel intent → not a greeting
  if (TRAVEL_INTENT_KEYWORDS_TS.some(w => lower.includes(w))) return false;

  // Date answer → not a greeting
  if (DATE_PATTERNS_TS.some(p => p.test(lower))) return false;

  // Match greeting-only patterns
  for (const p of GREETING_ONLY_PATTERNS_TS) {
    if (p.test(lower)) return true;
  }

  // "obrigadu/a" alone = Tetun thank you
  if (/^obrigad[uo]a?\s*$/.test(lower)) return true;

  // Very short (1-2 words) with no travel keywords → treat as greeting
  if (lower.split(/\s+/).length <= 2 && !TRAVEL_INTENT_KEYWORDS_TS.some(w => lower.includes(w))) return true;

  return false;
}

// ─── Dual-Core Chat Handler ─────────────────────────────────────────────────
// Supports new format: { pesan, tipe_chat, session_id }
// AND legacy format: { messages: [{role, content}] }

async function handleDualCoreChat(
  body: { pesan?: string; tipe_chat?: string; session_id?: string; messages?: Array<{ role: string; content: string }> },
  env: Env
): Promise<Response> {
  const tipeChat = (body.tipe_chat === "market" ? "market" : "travel") as "travel" | "market";
  const sessionId = body.session_id || body.pesan ? `sess-${Date.now().toString(36)}` : "anon";
  const pesan = body.pesan || "";

  // If legacy messages format provided, fall through to old handler
  if (body.messages && body.messages.length > 0 && !body.pesan) {
    return handleChatLegacy(body.messages, env);
  }

  if (!pesan.trim()) {
    return jsonResp({ error: "pesan required" }, 400);
  }

  // Build messages array from single pesan
  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: pesan },
  ];

  // 1) Load memory
  const memory = await loadUserMemory(sessionId, env);

  // 2) Auto-extract memory from text and save
  const memHints = extractMemoryFromText(pesan, sessionId);
  if (memHints) {
    saveUserMemory(memHints as Parameters<typeof saveUserMemory>[0], env); // fire & forget
  }

  // 3) Detect language
  const lang = detectLanguage(pesan);

  // 4) Cross-router: detect if message should switch to other chat
  if (tipeChat === "market") {
    const travelKeyword = detectTravelIntentInMarket(pesan);
    if (travelKeyword) {
      const switchReplies: Record<string, string> = {
        tet: `Hmm, pertanyaan ne'e kona-ba viajen/voo. RANIA Travel mak diak liu ba ne'e! Klik botaun iha kraik atu muda ba Travel. ✈️`,
        id: `Wah, urusan tiket pesawat/visa itu keahlian RANIA Travel! Klik tombol di bawah untuk pindah ke sana ya bos ✈️`,
        en: `That sounds like a travel question! RANIA Travel handles flights & visas best. Click the button below to switch ✈️`,
        pt: `Isso parece questão de viagem! RANIA Travel cuida de voos e vistos. Clique no botão abaixo ✈️`,
      };
      return jsonResp({
        jawaban: switchReplies[lang] || switchReplies.id,
        reply: switchReplies[lang] || switchReplies.id,
        action: "SWITCH_TO_TRAVEL",
        teks_otomatis: pesan,
        detectedLang: lang,
        provider: "dual-core-router",
        matched_keyword: travelKeyword,
      });
    }
  }

  if (tipeChat === "travel") {
    const marketKeyword = detectMarketIntentInTravel(pesan);
    if (marketKeyword) {
      const switchReplies: Record<string, string> = {
        tet: `Hmm, ne'e kona-ba fa'an/sosa barang. RANIA Market mak diak liu ba ne'e! Klik botaun atu muda ba Market. 🛒`,
        id: `Wah, urusan jual-beli barang itu keahlian RANIA Market! Klik tombol di bawah untuk pindah ke sana ya bos 🛒`,
        en: `That sounds like a marketplace question! RANIA Market handles buying & selling. Click below to switch 🛒`,
        pt: `Isso parece questão de marketplace! RANIA Market cuida de compra e venda. Clique abaixo 🛒`,
      };
      return jsonResp({
        jawaban: switchReplies[lang] || switchReplies.id,
        reply: switchReplies[lang] || switchReplies.id,
        action: "SWITCH_TO_MARKET",
        teks_otomatis: pesan,
        detectedLang: lang,
        provider: "dual-core-router",
        matched_keyword: marketKeyword,
      });
    }
  }

  // 5) Select prompt + tools based on tipe_chat
  const basePrompt = tipeChat === "travel"
    ? getTravelPrompt(lang)
    : getMarketPrompt(lang);
  const systemPrompt = injectMemoryIntoPrompt(basePrompt, memory);
  const functionDefs = getDefinitionsForChatType(tipeChat);

  // 6) Greeting check
  const greetingOnly = isGreetingMessage(pesan);
  const enableFunctions = !greetingOnly;

  // 7) Call AI providers with the right definitions
  let result: { reply?: string; functionCall?: { name: string; arguments: string }; provider: string } | undefined;

  if (env.GROQ_API_KEY_1) {
    result = await callGroq(messages, systemPrompt, env.GROQ_API_KEY_1, enableFunctions, functionDefs);
  }
  if (!result?.reply && !result?.functionCall && env.GROQ_API_KEY_2) {
    result = await callGroq(messages, systemPrompt, env.GROQ_API_KEY_2, enableFunctions, functionDefs);
  }
  if (!result?.reply && !result?.functionCall && env.GEMINI_API_KEY) {
    result = await callGemini(messages, systemPrompt, env.GEMINI_API_KEY, enableFunctions, functionDefs);
  }
  if (!result?.reply && !result?.functionCall && env.CEREBRAS_KEY) {
    result = await callCerebras(messages, systemPrompt, env.CEREBRAS_KEY);
  }

  // Block function calls for greetings
  if (greetingOnly && result?.functionCall) {
    result = { reply: result.reply, provider: result.provider };
  }

  // 8) Handle function call
  if (result?.functionCall) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(result.functionCall.arguments);
    } catch {
      return jsonResp({
        jawaban: getFallback(lang, tipeChat),
        reply: getFallback(lang, tipeChat),
        detectedLang: lang,
        provider: result.provider,
        tipe_chat: tipeChat,
      });
    }

    // Inject user_id for memory tool if missing
    if (result.functionCall.name === "simpan_memory_user" && !args.user_id) {
      args.user_id = sessionId;
    }

    const funcResult = await executeFunction(result.functionCall.name, args, env);

    if (funcResult.success) {
      const langInstructions: Record<string, string> = {
        tet: `ABSOLUTU: Koalia TETUN deit. Labele uza liafuan Indonesia.`,
        id: "WAJIB 100% BAHASA INDONESIA. Jangan campur Tetun, Inggris, atau Portugis.",
        pt: "OBRIGATÓRIO: 100% Português. Não misture idiomas.",
        en: "REQUIRED: 100% English only. Do not mix any other language.",
      };
      const funcContent = `${langInstructions[lang] || langInstructions.id}\n\n${JSON.stringify(funcResult.data)}`;

      const followUpMessages = [
        ...messages,
        { role: "assistant" as const, content: null as unknown as string, function_call: result.functionCall },
        { role: "function" as const, content: funcContent, name: result.functionCall.name },
      ];

      let finalResult: { reply?: string; provider: string } | undefined;
      if (env.GROQ_API_KEY_1) {
        finalResult = await callGroq(followUpMessages, systemPrompt, env.GROQ_API_KEY_1);
      }
      if (!finalResult?.reply && env.GROQ_API_KEY_2) {
        finalResult = await callGroq(followUpMessages, systemPrompt, env.GROQ_API_KEY_2);
      }
      if (!finalResult?.reply && env.GEMINI_API_KEY) {
        finalResult = await callGemini(followUpMessages, systemPrompt, env.GEMINI_API_KEY);
      }

      const finalReply = finalResult?.reply || formatFunctionResult(result.functionCall.name, funcResult.data, lang);
      return jsonResp({
        jawaban: finalReply,
        reply: finalReply,
        detectedLang: lang,
        provider: finalResult?.provider || result.provider,
        functionCalled: result.functionCall.name,
        functionResult: funcResult.data,
        tipe_chat: tipeChat,
      });
    } else {
      const errorMsgs: Record<string, string> = {
        tet: "Deskulpa, iha problema. Tenta fali.",
        id: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        pt: "Desculpe, erro ao processar. Tente novamente.",
        en: "Sorry, an error occurred. Please try again.",
      };
      return jsonResp({
        jawaban: errorMsgs[lang] || errorMsgs.id,
        reply: errorMsgs[lang] || errorMsgs.id,
        detectedLang: lang,
        provider: result.provider,
        functionCalled: result.functionCall.name,
        functionError: funcResult.error,
        tipe_chat: tipeChat,
      });
    }
  }

  // 9) Final reply
  const reply = result?.reply || getFallback(lang, tipeChat);
  return jsonResp({
    jawaban: reply,
    reply,
    detectedLang: lang,
    provider: result?.provider || "fallback",
    tipe_chat: tipeChat,
  });
}

/**
 * Legacy chat handler — backward compatible with messages array format.
 */
async function handleChatLegacy(messages: Array<{ role: string; content: string }>, env: Env): Promise<Response> {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return jsonResp({ error: "messages required" }, 400);
  }

  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";

  // Detect lang from last message, inherit from history if ambiguous
  let lang = detectLanguage(lastUserMsg);
  const isAmbiguous =
    /^\d/.test(lastUserMsg.trim()) ||
    lastUserMsg.trim().split(/\s+/).length <= 2 ||
    (lang === "id" && !lastUserMsg.match(/[a-zA-Z]{3,}/));

  if (isAmbiguous && messages.length > 1) {
    const historyLang = detectLangFromHistory(messages.slice(0, -1));
    if (historyLang && historyLang !== "id") lang = historyLang;
  }

  const systemPrompt = getSystemPrompt(lang);

  // Context-aware greeting detection — pass full messages
  const greetingOnly = isGreetingMessage(lastUserMsg, messages);
  const enableFunctions = !greetingOnly;

  // Try AI providers in order: Groq1 → Groq2 → Gemini → Cerebras
  let result: { reply?: string; functionCall?: { name: string; arguments: string }; provider: string } | undefined;

  if (env.GROQ_API_KEY_1) {
    result = await callGroq(messages, systemPrompt, env.GROQ_API_KEY_1, enableFunctions);
  }
  if (!result?.reply && !result?.functionCall && env.GROQ_API_KEY_2) {
    result = await callGroq(messages, systemPrompt, env.GROQ_API_KEY_2, enableFunctions);
  }
  if (!result?.reply && !result?.functionCall && env.GEMINI_API_KEY) {
    result = await callGemini(messages, systemPrompt, env.GEMINI_API_KEY, enableFunctions);
  }
  if (!result?.reply && !result?.functionCall && env.CEREBRAS_KEY) {
    result = await callCerebras(messages, systemPrompt, env.CEREBRAS_KEY);
  }

  // Extra safety: block any function call that slips through for greetings
  if (greetingOnly && result?.functionCall) {
    result = { reply: result.reply, provider: result.provider } as typeof result;
  }

  // If AI returned a function call, execute it
  if (result?.functionCall) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(result.functionCall.arguments);
    } catch {
      return jsonResp({
        reply: FALLBACKS[lang] || FALLBACKS.id,
        lang,
        detectedLang: lang,
        provider: result.provider,
      });
    }

    const funcResult = await executeFunction(result.functionCall.name, args, env);

    if (funcResult.success) {
      // Lang-specific instruction — strict, pure language, no mixing
      const langInstructions: Record<string, string> = {
        tet: `ABSOLUTU: Koalia TETUN deit. Labele uza liafuan Indonesia (penerbangan, pesawat, harga, kosta, Oke, Ada, Mau).
Uza: folin, voo, aviaun, partida, Maun/Mana, hetan, reserva, loron, husi, ba.
Ezemplu LOOS: "Hau hetan voo 2 husi DIL ba SIN:\n1. Scoot — USD 380, partida 09:00\nIta hakarak reserva ida ne'ebe?"`,
        id: "WAJIB 100% BAHASA INDONESIA. Jangan campur Tetun, Inggris, atau Portugis.",
        pt: "OBRIGATÓRIO: 100% Português. Não misture idiomas.",
        en: "REQUIRED: 100% English only. Do not mix any other language.",
      };
      const funcContent = `${langInstructions[lang] || langInstructions.id}\n\n${JSON.stringify(funcResult.data)}`;

      const followUpMessages = [
        ...messages,
        { role: "assistant" as const, content: null as unknown as string, function_call: result.functionCall },
        { role: "function" as const, content: funcContent, name: result.functionCall.name },
      ];

      let finalResult: { reply?: string; provider: string } | undefined;
      if (env.GROQ_API_KEY_1) {
        finalResult = await callGroq(followUpMessages, systemPrompt, env.GROQ_API_KEY_1);
      }
      if (!finalResult?.reply && env.GROQ_API_KEY_2) {
        finalResult = await callGroq(followUpMessages, systemPrompt, env.GROQ_API_KEY_2);
      }
      if (!finalResult?.reply && env.GEMINI_API_KEY) {
        finalResult = await callGemini(followUpMessages, systemPrompt, env.GEMINI_API_KEY);
      }

      return jsonResp({
        reply: finalResult?.reply || formatFunctionResult(result.functionCall.name, funcResult.data, lang),
        lang,
        detectedLang: lang,
        provider: finalResult?.provider || result.provider,
        functionCalled: result.functionCall.name,
        functionResult: funcResult.data,
      });
    } else {
      const errorMsgs: Record<string, string> = {
        tet: `Deskulpa, iha problema. Tenta fali.`,
        id: `Maaf, terjadi kesalahan. Silakan coba lagi.`,
        pt: `Desculpe, erro ao processar. Tente novamente.`,
        en: `Sorry, an error occurred. Please try again.`,
      };
      return jsonResp({
        reply: errorMsgs[lang] || errorMsgs.id,
        lang,
        detectedLang: lang,
        provider: result.provider,
        functionCalled: result.functionCall.name,
        functionError: funcResult.error,
      });
    }
  }

  // Final fallback
  const reply = result?.reply || FALLBACKS[lang] || FALLBACKS.id;
  return jsonResp({
    reply,
    lang,
    detectedLang: lang,
    provider: result?.provider || "fallback",
  });
}

/**
 * Format function result per language when AI fails to summarize.
 */
function formatFunctionResult(funcName: string, data: unknown, lang = "id"): string {
  if (funcName === "search_flights" && data && typeof data === "object") {
    const d = data as { results?: Array<{ airline: string; totalPrice: number; currency: string; departureTime: string; arrivalTime: string }> };
    if (d.results && d.results.length > 0) {
      const top3 = d.results.slice(0, 3);
      const fmt = (f: typeof top3[0], i: number) => {
        const dep = f.departureTime ? new Date(f.departureTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
        const price = `${f.currency} ${f.totalPrice.toLocaleString()}`;
        return `${i + 1}. ${f.airline} — ${price} | partida ${dep}`;
      };
      const list = top3.map(fmt).join("\n");
      if (lang === "tet") return `Hau hetan voo ${top3.length}:\n${list}\nIta hakarak reserva ida ne'ebe?`;
      if (lang === "en")  return `Found ${top3.length} flights:\n${list}`;
      if (lang === "pt")  return `Voos disponíveis:\n${list}`;
      return `Berikut ${top3.length} penerbangan:\n${list}`;
    }
    const noData: Record<string, string> = {
      tet: "Deskulpa maun, la iha voo disponivel ba rota ne'e.",
      id: "Data penerbangan tidak tersedia untuk rute dan tanggal tersebut.",
      pt: "Não há voos disponíveis para este trajeto.",
      en: "No flights available for this route and date.",
    };
    return noData[lang] || noData.id;
  }
  return JSON.stringify(data);
}

// ─── Worker Export ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return jsonResp({
        status: "ok",
        worker: "rania-parser",
        version: "3.0.0-dual-core",
        modes: ["travel", "market"],
        timestamp: new Date().toISOString(),
      });
    }

    // ─── Chat Routes (multiple aliases for frontend compatibility) ──────────
    // POST /chat, /api/chat, /rania/chat, /api/rania/chat → same handler
    const chatPaths = ["/api/chat", "/chat", "/rania/chat", "/api/rania/chat"];
    if (request.method === "POST" && chatPaths.includes(url.pathname)) {
      try {
        const body = await request.json() as {
          pesan?: string;
          tipe_chat?: string;
          session_id?: string;
          messages?: Array<{ role: string; content: string }>;
        };
        return await handleDualCoreChat(body, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Chat handler error:", msg);
        return jsonResp({ error: "Internal server error" }, 500);
      }
    }

    // ─── SANIMAR ADS V1 — Monetization API Routes ───────────────────────────

    // POST /api/ads/topup — Create Xendit QRIS invoice for wallet top-up
    if (request.method === "POST" && url.pathname === "/api/ads/topup") {
      try {
        const body = await request.json() as { user_id: string; amount_cents: number };
        if (!body.user_id || !body.amount_cents) {
          return jsonResp({ error: "user_id and amount_cents required" }, 400);
        }
        const result = await handleAdsTopup(body, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Ads topup error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // POST /api/ads/webhook — Xendit payment success callback
    if (request.method === "POST" && url.pathname === "/api/ads/webhook") {
      try {
        // Verify Xendit callback token
        const callbackToken = request.headers.get("x-callback-token");
        if (env.XENDIT_CALLBACK_TOKEN && callbackToken !== env.XENDIT_CALLBACK_TOKEN) {
          return jsonResp({ error: "Invalid callback token" }, 401);
        }
        const body = await request.json() as Record<string, unknown>;
        const result = await handleXenditWebhook(body, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Ads webhook error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // POST /api/ads/create_campaign — Create new ad campaign (prepaid)
    if (request.method === "POST" && url.pathname === "/api/ads/create_campaign") {
      try {
        const body = await request.json() as {
          user_id: string; listing_id: string; campaign_type: string;
          budget_cents: number; duration_days?: number;
          auto_renew?: boolean; auto_renew_amount_cents?: number;
        };
        if (!body.user_id || !body.listing_id || !body.campaign_type || !body.budget_cents) {
          return jsonResp({ error: "user_id, listing_id, campaign_type, budget_cents required" }, 400);
        }
        const result = await handleAdsCreateCampaign(body, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Ads create_campaign error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // POST /api/ads/click — Record ad click (THIS IS MONEY PRINTING)
    if (request.method === "POST" && url.pathname === "/api/ads/click") {
      try {
        const body = await request.json() as { campaign_id: string; clicker_user_id?: string };
        if (!body.campaign_id) {
          return jsonResp({ error: "campaign_id required" }, 400);
        }
        const result = await handleAdsClick(body, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Ads click error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // GET /api/ads/sponsored — Get active sponsored listings (for market page)
    if (request.method === "GET" && url.pathname === "/api/ads/sponsored") {
      try {
        const result = await handleGetSponsoredListings(env);
        return jsonResp(result, 200);
      } catch (error) {
        console.error("Ads sponsored error:", error);
        return jsonResp({ sponsored: [] }, 200);
      }
    }

    // GET /api/ads/dashboard?user_id=xxx — Vendor campaign dashboard
    if (request.method === "GET" && url.pathname === "/api/ads/dashboard") {
      try {
        const userId = url.searchParams.get("user_id");
        if (!userId) {
          return jsonResp({ error: "user_id required" }, 400);
        }
        const result = await handleAdsDashboard(userId, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Ads dashboard error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // POST /api/ads/accept_terms — Vendor accepts Terms & Conditions
    if (request.method === "POST" && url.pathname === "/api/ads/accept_terms") {
      try {
        const body = await request.json() as { user_id: string };
        if (!body.user_id) {
          return jsonResp({ error: "user_id required" }, 400);
        }
        const result = await handleAcceptTerms(body.user_id, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Ads accept_terms error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // ─── FITUR 2: Cron Job — Daily auto-renewal + low-budget nagging ────────
    // GET /api/ads/cron?token=CRON_SECRET
    // Set up Cloudflare Cron Trigger: 0 6 * * * (daily at 6am UTC)
    if (request.method === "GET" && url.pathname === "/api/ads/cron") {
      try {
        const token = url.searchParams.get("token");
        if (env.CRON_SECRET && token !== env.CRON_SECRET) {
          return jsonResp({ error: "Invalid cron token" }, 401);
        }
        const result = await handleAdsCron(env);
        return jsonResp(result, result.success ? 200 : 500);
      } catch (error) {
        console.error("Ads cron error:", error);
        return jsonResp({ error: "Cron failed" }, 500);
      }
    }

    // ─── FITUR 3: Hotel Booking with 10% Commission Split ──────────────────
    // POST /api/ads/hotel_booking
    if (request.method === "POST" && url.pathname === "/api/ads/hotel_booking") {
      try {
        const body = await request.json() as {
          listing_id: string; buyer_name: string; buyer_email: string;
          booking_amount_cents: number; check_in: string; check_out: string; nights: number;
        };
        if (!body.listing_id || !body.booking_amount_cents || !body.check_in || !body.check_out) {
          return jsonResp({ error: "listing_id, booking_amount_cents, check_in, check_out required" }, 400);
        }
        const result = await handleHotelBooking(body, env);
        return jsonResp(result, result.success ? 200 : 400);
      } catch (error) {
        console.error("Hotel booking error:", error);
        return jsonResp({ error: "Internal error" }, 500);
      }
    }

    // ─── Legacy /rania/* stub routes (frontend compatibility) ─────────────

    // GET /rania/flights — Widget flight search (proxies to worker-hunter)
    if (request.method === "GET" && url.pathname === "/rania/flights") {
      try {
        const from = url.searchParams.get("from") || "";
        const to = url.searchParams.get("to") || "";
        const date = url.searchParams.get("date") || "";
        const hunterUrl = `${env.WORKER_HUNTER_URL}/api/search`;
        const resp = await fetch(hunterUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: from, destination: to, departureDate: date, passengers: 1 }),
        });
        const data = await resp.json();
        return jsonResp(data);
      } catch (error) {
        return jsonResp({ results: [], error: "Flight search unavailable" });
      }
    }

    // GET /rania/status/:id — Booking status stub
    if (request.method === "GET" && url.pathname.startsWith("/rania/status/")) {
      const bookingId = url.pathname.replace("/rania/status/", "");
      return jsonResp({ bookingId, status: "SEARCH", message: "Booking status — connect to Supabase in production" });
    }

    // GET /rania/currency — Currency rates stub
    if (request.method === "GET" && url.pathname === "/rania/currency") {
      return jsonResp({ rates: { USD_IDR: 15800, USD_TL: 1.0, EUR_USD: 1.08, AUD_USD: 0.65 }, source: "stub" });
    }

    // GET /rania/weather — Weather info stub
    if (request.method === "GET" && url.pathname === "/rania/weather") {
      const city = url.searchParams.get("city") || "Dili";
      return jsonResp({ city, temp: 28, condition: "Tropis, hangat", humidity: 78, source: "stub" });
    }

    // GET /rania/visa — Visa info stub
    if (request.method === "GET" && url.pathname === "/rania/visa") {
      const from = url.searchParams.get("from") || "";
      const to = url.searchParams.get("to") || "";
      return jsonResp({ from, to, visaInfo: "Visa information — connect to knowledge base in production", source: "stub" });
    }

    // POST /rania/register-user — Email capture stub
    if (request.method === "POST" && url.pathname === "/rania/register-user") {
      return jsonResp({ success: true, message: "User registered" });
    }

    // POST /rania/booking — Booking stub
    if (request.method === "POST" && url.pathname === "/rania/booking") {
      return jsonResp({ success: true, bookingId: `BK-${Date.now()}`, message: "Booking recorded — connect to payment in production" });
    }

    // POST /rania/group-booking — Group booking stub
    if (request.method === "POST" && url.pathname === "/rania/group-booking") {
      return jsonResp({ success: true, bookingId: `GRP-${Date.now()}`, message: "Group booking recorded" });
    }

    // POST /rania/price-track — Price tracking stub
    if (request.method === "POST" && url.pathname === "/rania/price-track") {
      return jsonResp({ success: true, alertId: `PT-${Date.now()}`, message: "Price alert created" });
    }

    // DELETE /rania/price-track/:id
    if (request.method === "DELETE" && url.pathname.startsWith("/rania/price-track/")) {
      return jsonResp({ success: true, message: "Price alert removed" });
    }

    // GET /rania/price-alerts/check — Price alert check stub
    if (request.method === "GET" && url.pathname === "/rania/price-alerts/check") {
      return jsonResp({ alerts: [], triggered: false });
    }

    // POST /api/rania/tts — TTS stub
    if (request.method === "POST" && (url.pathname === "/api/rania/tts" || url.pathname === "/rania/tts")) {
      return jsonResp({ success: false, message: "TTS not available in local dev" });
    }

    // GET /api/rania/radar — Flight radar stub
    if (request.method === "GET" && (url.pathname === "/api/rania/radar" || url.pathname === "/rania/radar")) {
      return jsonResp({ flights: [], source: "stub", message: "Radar not available in local dev" });
    }

    // GET /api/rania/dil-flights — Dili flights stub
    if (request.method === "GET" && (url.pathname === "/api/rania/dil-flights" || url.pathname === "/rania/dil-flights")) {
      return jsonResp({ flights: [], source: "stub" });
    }

    // GET /api/rania/price-chart — Price chart stub
    if (request.method === "GET" && (url.pathname === "/api/rania/price-chart" || url.pathname === "/rania/price-chart")) {
      return jsonResp({ data: [], source: "stub" });
    }

    // GET /api/rania/flight-network — Flight network stub
    if (request.method === "GET" && (url.pathname === "/api/rania/flight-network" || url.pathname === "/rania/flight-network")) {
      return jsonResp({ routes: [], source: "stub" });
    }

    // GET /api/rania/ota-live-score — Admin live score stub
    if (request.method === "GET" && (url.pathname === "/api/rania/ota-live-score" || url.pathname === "/rania/ota-live-score")) {
      return jsonResp({ score: {}, source: "stub" });
    }

    // GET /api/rania/test/lab — Test lab SSE stub
    if (request.method === "GET" && (url.pathname === "/api/rania/test/lab" || url.pathname === "/rania/test/lab")) {
      return jsonResp({ tests: [], source: "stub" });
    }

    // GET /api/rania/flight-accuracy-test — Flight accuracy test stub
    if (request.method === "GET" && (url.pathname === "/api/rania/flight-accuracy-test" || url.pathname === "/rania/flight-accuracy-test")) {
      return jsonResp({ results: [], source: "stub" });
    }

    return jsonResp({ error: "Not Found", path: url.pathname }, 404);
  },

  // Cloudflare Cron Trigger — runs daily at 6am UTC
  async scheduled(event: { cron: string }, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }): Promise<void> {
    console.log(`[cron] Triggered: ${event.cron}`);
    ctx.waitUntil(
      handleAdsCron(env).then((result) => {
        console.log("[cron] Result:", JSON.stringify(result.data || result.error));
      }).catch((err) => {
        console.error("[cron] Failed:", err);
      })
    );
  },
};
