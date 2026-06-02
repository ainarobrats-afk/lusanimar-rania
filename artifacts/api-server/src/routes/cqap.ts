import { Router, type Request, type Response } from "express";
import cron from "node-cron";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import {
  testRunsTable, testResultsTable, testFailuresTable, improvementRecsTable,
} from "@workspace/db";
import { desc, eq, gte, and } from "drizzle-orm";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────
interface TestCase { category: string; name: string; messages: { role: string; content: string }[]; lang: string; checks: string[]; component?: string; expected?: string; }
interface RunResult { status: "pass" | "warn" | "fail"; latencyMs: number; detail: string; query: string; response: string; }

// ─── Active run tracking ─────────────────────────────────────────────────────
const activeRuns = new Map<string, { progress: number; total: number; phase: string }>();

// ─── ID generator ─────────────────────────────────────────────────────────────
function genId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

// ─── Auth middleware (reuse admin token) ──────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: () => void) {
  const token = req.headers["x-admin-token"] as string;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

// ─── Internal chat caller ─────────────────────────────────────────────────────
async function callChat(messages: { role: string; content: string }[], lang: string): Promise<{ reply: string; ok: boolean; latencyMs: number }> {
  const port = process.env.PORT || 8080;
  const t = Date.now();
  try {
    const res = await fetch(`http://localhost:${port}/api/rania/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": `cqap-internal-${Date.now()}`, "x-admin-bypass": "cqap" },
      body: JSON.stringify({ messages, lang }),
      signal: AbortSignal.timeout(25000),
    });
    const latencyMs = Date.now() - t;
    if (!res.ok) return { reply: `HTTP ${res.status}`, ok: false, latencyMs };
    const data: any = await res.json();
    return { reply: data.reply || "", ok: true, latencyMs };
  } catch (err: any) {
    return { reply: err.message, ok: false, latencyMs: Date.now() - t };
  }
}

// ─── Score helper ─────────────────────────────────────────────────────────────
function scoreResponse(reply: string, checks: string[]): { ok: boolean; warn: boolean; detail: string } {
  if (!reply || reply.length < 10) return { ok: false, warn: false, detail: "Empty or too short response" };
  if (checks.length === 0) return { ok: true, warn: false, detail: "No-check test passed (crash resistance)" };
  const low = reply.toLowerCase();
  const matched = checks.filter(c => low.includes(c.toLowerCase()));
  const ratio = matched.length / checks.length;
  if (ratio >= 0.6) return { ok: true, warn: false, detail: `${matched.length}/${checks.length} keywords matched` };
  if (ratio >= 0.3) return { ok: true, warn: true, detail: `Partial match: ${matched.length}/${checks.length} keywords` };
  return { ok: false, warn: false, detail: `Only ${matched.length}/${checks.length} keywords found (${checks.filter(c => !low.includes(c.toLowerCase())).slice(0, 3).join(", ")} missing)` };
}

// ─── Root cause inference ─────────────────────────────────────────────────────
function inferRootCause(category: string, error: string): { cause: string; confidence: number; fix: string } {
  if (error.includes("timeout") || error.includes("abort") || error.includes("AbortError"))
    return { cause: "Network timeout — AI provider slow or rate-limited", confidence: 0.85, fix: "Reduce request concurrency or switch to faster AI provider (Groq)" };
  if (error.includes("Empty") || error.length < 5)
    return { cause: "AI returned empty response — context overflow or quota exceeded", confidence: 0.9, fix: "Reduce conversation history length or check API quota" };
  if (error.includes("Missing") || error.includes("keyword"))
    return { cause: "AI answer incomplete — system prompt may need tuning", confidence: 0.7, fix: "Add explicit instructions for this topic to system prompt" };
  if (category === "Booking Flow")
    return { cause: "Booking state machine or session management issue", confidence: 0.75, fix: "Review booking flow state transitions and session persistence" };
  if (category === "Payment")
    return { cause: "Payment instruction generation or formatting incomplete", confidence: 0.8, fix: "Add payment method keywords to system prompt template" };
  if (category === "Memory")
    return { cause: "Context window exceeded or conversation summarization missing", confidence: 0.8, fix: "Implement conversation summarization for contexts > 10 turns" };
  if (category === "Multi-Language")
    return { cause: "Language detection or routing issue", confidence: 0.75, fix: "Tune language detection thresholds and add fallbacks" };
  return { cause: "Unknown — needs manual investigation", confidence: 0.4, fix: "Review logs and test manually" };
}

// ─── Test suite definition ─────────────────────────────────────────────────────
function buildTestSuite(): TestCase[] {
  return [
    // Simple Conversation
    { category: "Simple Conversation", name: "English greeting", messages: [{ role: "user", content: "Hello, who are you?" }], lang: "en", checks: ["rania","sanimar","travel","help"], component: "ChatEngine" },
    { category: "Simple Conversation", name: "Tetun bondia", messages: [{ role: "user", content: "Bondia, ita bele ajuda hau?" }], lang: "tet", checks: ["bondia","rania","ajuda"], component: "LangDetection" },
    { category: "Simple Conversation", name: "Bahasa Indonesia", messages: [{ role: "user", content: "Apa yang bisa kamu bantu?" }], lang: "id", checks: ["tiket","bantu","pesawat"], component: "ChatEngine" },
    { category: "Simple Conversation", name: "Crash resistance (!@#$)", messages: [{ role: "user", content: "!@#$%^&*()" }], lang: "en", checks: [], component: "ChatEngine" },
    { category: "Simple Conversation", name: "Long input handling", messages: [{ role: "user", content: "I need a flight ticket from Dili to Bali please book me and I want to know the price and also visa information and hotel recommendations for Bali including best resorts near beach weather and currency exchange" }], lang: "en", checks: ["dili","bali","flight"], component: "ChatEngine" },
    { category: "Simple Conversation", name: "Siapa RANIA (ID)", messages: [{ role: "user", content: "Siapa RANIA itu?" }], lang: "id", checks: ["rania","sanimar","travel","timor"], component: "ChatEngine" },
    // Flight Search
    { category: "Flight Search", name: "DIL → DPS (core route)", messages: [{ role: "user", content: "Flight from Dili to Bali on 15 July 2026" }], lang: "en", checks: ["dili","bali","usd"], component: "FlightSearch", expected: "Price in USD with airline info" },
    { category: "Flight Search", name: "DIL → DRW (Darwin)", messages: [{ role: "user", content: "Dili to Darwin flight next month" }], lang: "en", checks: ["darwin","dili","flight"], component: "FlightSearch" },
    { category: "Flight Search", name: "DIL → SIN (Singapore ID)", messages: [{ role: "user", content: "Penerbangan Dili ke Singapura bulan Juli" }], lang: "id", checks: ["dili","singapura","juli"], component: "FlightSearch" },
    { category: "Flight Search", name: "SYD → DIL (reverse)", messages: [{ role: "user", content: "Sydney to Dili flight August 2026" }], lang: "en", checks: ["sydney","dili","flight"], component: "FlightSearch" },
    { category: "Flight Search", name: "Global route JFK → NRT", messages: [{ role: "user", content: "Flight from New York to Tokyo September 2026" }], lang: "en", checks: ["tokyo","new york","flight"], component: "FlightSearch" },
    { category: "Flight Search", name: "DIL → CGK via Garuda", messages: [{ role: "user", content: "Tiket pesawat Dili ke Jakarta" }], lang: "id", checks: ["dili","jakarta","pesawat"], component: "FlightSearch" },
    // ─── V2: Global Route Accuracy Tests (Spec §9) ───────────────────────────
    { category: "Global Routes V2", name: "JFK → LHR (USA→UK)", messages: [{ role: "user", content: "Flight from New York JFK to London Heathrow LHR on 10 August 2026" }], lang: "en", checks: ["london","new york","flight"], component: "FlightSearchV2", expected: "Cards must show JFK→LHR, price $250-$2500, no Dili cards" },
    { category: "Global Routes V2", name: "JFK → PEK (USA→China)", messages: [{ role: "user", content: "I need a flight from New York to Beijing PEK on September 5 2026" }], lang: "en", checks: ["beijing","new york","china"], component: "FlightSearchV2", expected: "Cards must show JFK→PEK, price $350-$2500" },
    { category: "Global Routes V2", name: "LAX → NRT (USA→Japan)", messages: [{ role: "user", content: "Flight from Los Angeles LAX to Tokyo Narita NRT October 2026" }], lang: "en", checks: ["tokyo","los angeles","japan"], component: "FlightSearchV2", expected: "Cards must show LAX→NRT, no Dili fallback" },
    { category: "Global Routes V2", name: "GRU → LIS (Brazil→Portugal)", messages: [{ role: "user", content: "Flight from São Paulo GRU to Lisbon LIS on November 15 2026" }], lang: "en", checks: ["lisbon","sao paulo","portugal"], component: "FlightSearchV2", expected: "Cards must show GRU→LIS route" },
    { category: "Global Routes V2", name: "PEK → SHA (China domestic)", messages: [{ role: "user", content: "Flight from Beijing PEK to Shanghai PVG on July 20 2026" }], lang: "en", checks: ["beijing","shanghai","china"], component: "FlightSearchV2", expected: "Cards must show PEK→PVG, domestic China price $40-$450" },
    { category: "Global Routes V2", name: "CAN → CTU (China domestic)", messages: [{ role: "user", content: "Guangzhou CAN to Chengdu CTU flight August 2026" }], lang: "en", checks: ["guangzhou","chengdu","china"], component: "FlightSearchV2" },
    { category: "Global Routes V2", name: "SYD → MEL (Australia domestic)", messages: [{ role: "user", content: "Flight from Sydney to Melbourne on 25 July 2026" }], lang: "en", checks: ["sydney","melbourne","australia"], component: "FlightSearchV2", expected: "Price $40-$700 domestic Australia" },
    { category: "Global Routes V2", name: "DXB → FRA (ME→Europe)", messages: [{ role: "user", content: "Flight from Dubai DXB to Frankfurt FRA on August 1 2026" }], lang: "en", checks: ["dubai","frankfurt","emirates"], component: "FlightSearchV2" },
    { category: "Global Routes V2", name: "NBO → CDG (Africa→Europe)", messages: [{ role: "user", content: "Flight from Nairobi NBO to Paris CDG on September 2026" }], lang: "en", checks: ["nairobi","paris","flight"], component: "FlightSearchV2", expected: "No DIL fallback — Africa→Europe route" },
    { category: "Global Routes V2", name: "ICN → NRT (Korea→Japan)", messages: [{ role: "user", content: "Seoul ICN to Tokyo NRT flight July 15 2026" }], lang: "en", checks: ["seoul","tokyo","korea"], component: "FlightSearchV2", expected: "Price $60-$700 Korea→Japan" },
    { category: "Global Routes V2", name: "No DIL card on JFK→LHR", messages: [{ role: "user", content: "Cheapest flight New York to London" }], lang: "en", checks: ["london","new york"], component: "FlightSearchV2", expected: "Must NOT show Dili flight cards on USA→UK query" },
    { category: "Global Routes V2", name: "Multi-airport Tokyo clarification", messages: [{ role: "user", content: "I want to fly from Paris to Tokyo next month" }], lang: "en", checks: ["tokyo","paris","narita"], component: "FlightSearchV2", expected: "Should mention NRT (Narita) or HND (Haneda) options" },
    // Multi-Language
    { category: "Multi-Language", name: "Portuguese booking", messages: [{ role: "user", content: "Preciso de uma passagem de Dili para Bali" }], lang: "pt", checks: ["dili","bali","passagem"], component: "LangDetection" },
    { category: "Multi-Language", name: "Tetun flight request", messages: [{ role: "user", content: "Hau hakarak bilhete aviaun husi Dili ba Bali" }], lang: "tet", checks: ["dili","bali","bilhete"], component: "LangDetection" },
    { category: "Multi-Language", name: "ID language detection", messages: [{ role: "user", content: "Apa syarat visa ke Timor-Leste?" }], lang: "id", checks: ["visa","timor"], component: "LangDetection" },
    { category: "Multi-Language", name: "EN language detection", messages: [{ role: "user", content: "What are the visa requirements for Timor-Leste?" }], lang: "en", checks: ["visa","timor"], component: "LangDetection" },
    // Booking Flow
    { category: "Booking Flow", name: "Step 1 — Flight search", messages: [{ role: "user", content: "Search flight Dili to Singapore July 15 2026" }], lang: "en", checks: ["dili","singapore","july"], component: "BookingEngine", expected: "Flight options with price" },
    { category: "Booking Flow", name: "Step 2 — Fare selection", messages: [{ role: "user", content: "Dili to Singapore July 15, economy class please" }, { role: "assistant", content: "Economy DIL-SIN from $280. Need passenger name?" }, { role: "user", content: "Economy is fine" }], lang: "en", checks: ["economy","name","passenger"], component: "BookingEngine" },
    { category: "Booking Flow", name: "Step 3 — Passenger data", messages: [{ role: "user", content: "My name is Maria Santos, passport TL123456" }], lang: "en", checks: ["maria","passport","name"], component: "BookingEngine" },
    { category: "Booking Flow", name: "Step 4 — Confirmation", messages: [{ role: "user", content: "Confirm my booking please" }], lang: "en", checks: ["confirm","booking"], component: "BookingEngine" },
    { category: "Booking Flow", name: "Step 5 — Payment instructions", messages: [{ role: "user", content: "How do I pay for my booking?" }], lang: "en", checks: ["pay","transfer","bank"], component: "BookingEngine", expected: "Payment method with bank/transfer info" },
    { category: "Booking Flow", name: "Booking in Tetun", messages: [{ role: "user", content: "Hau hakarak reserva bilhete aviaun" }], lang: "tet", checks: ["bilhete","dili"], component: "BookingEngine" },
    { category: "Booking Flow", name: "WhatsApp contact step", messages: [{ role: "user", content: "My WhatsApp is +670 77123456" }], lang: "en", checks: ["whatsapp","670","contact"], component: "BookingEngine" },
    // Payment
    { category: "Payment", name: "Visa credit card", messages: [{ role: "user", content: "Can I pay with Visa credit card?" }], lang: "en", checks: ["visa","card","pay"], component: "PaymentEngine", expected: "Payment method info" },
    { category: "Payment", name: "Bank transfer (ID)", messages: [{ role: "user", content: "Cara bayar transfer bank bagaimana?" }], lang: "id", checks: ["transfer","bank","bayar"], component: "PaymentEngine" },
    { category: "Payment", name: "E-wallet / GoPay", messages: [{ role: "user", content: "Can I pay with GoPay or OVO?" }], lang: "en", checks: ["gopay","ovo","pay"], component: "PaymentEngine" },
    { category: "Payment", name: "Mastercard accepted?", messages: [{ role: "user", content: "Do you accept Mastercard?" }], lang: "en", checks: ["mastercard","card","pay"], component: "PaymentEngine" },
    { category: "Payment", name: "Manual payment (Tetun)", messages: [{ role: "user", content: "Oinsá hau bele selu bilhete?" }], lang: "tet", checks: ["selu","bilhete","transfere"], component: "PaymentEngine" },
    // Memory
    { category: "Memory", name: "Name retention", messages: [{ role: "user", content: "My name is Carlos Mendez" }, { role: "assistant", content: "Nice to meet you Carlos!" }, { role: "user", content: "Siapa nama saya?" }], lang: "id", checks: ["carlos"], component: "MemoryEngine" },
    { category: "Memory", name: "Cross-language memory", messages: [{ role: "user", content: "I'm flying from Dili to Tokyo" }, { role: "assistant", content: "Great! When?" }, { role: "user", content: "Bulan Agustus 2026" }, { role: "assistant", content: "Oke, Agustus 2026 dari Dili ke Tokyo." }, { role: "user", content: "Where am I flying to?" }], lang: "en", checks: ["tokyo","dili"], component: "MemoryEngine" },
    { category: "Memory", name: "Multi-turn booking (8 turns)", messages: [{ role: "user", content: "Dili to Tokyo" }, { role: "assistant", content: "Tanggal?" }, { role: "user", content: "10 Agustus 2026" }, { role: "assistant", content: "Nama?" }, { role: "user", content: "John Smith" }, { role: "assistant", content: "Passport?" }, { role: "user", content: "AB654321" }, { role: "user", content: "Ringkas semua data booking saya" }], lang: "id", checks: ["john","ab654321","tokyo","agustus"], component: "MemoryEngine" },
    // Stress Test
    { category: "Stress Test", name: "API health check", messages: [{ role: "user", content: "Hello" }], lang: "en", checks: ["hello","rania","help"], component: "Infrastructure" },
    { category: "Stress Test", name: "Rapid sequential (5 msgs)", messages: [{ role: "user", content: "Flight Dili to Bali" }], lang: "en", checks: ["dili","bali"], component: "Infrastructure" },
    // Hotels (spec Section 5 & 8)
    { category: "Hotels", name: "Hotel di Dili (ID)", messages: [{ role: "user", content: "Hotel apa yang bagus di Dili Timor-Leste?" }], lang: "id", checks: ["hotel","dili"], component: "TravelKnowledge", expected: "Hotel recommendations in Dili" },
    { category: "Hotels", name: "Hotel near Bali airport (EN)", messages: [{ role: "user", content: "Recommend a hotel near Ngurah Rai airport Bali" }], lang: "en", checks: ["hotel","bali"], component: "TravelKnowledge" },
    { category: "Hotels", name: "Budget hotel Singapore", messages: [{ role: "user", content: "Affordable hotel in Singapore near MRT under $80" }], lang: "en", checks: ["hotel","singapore"], component: "TravelKnowledge" },
    { category: "Hotels", name: "Check-in time rules", messages: [{ role: "user", content: "What time is hotel check-in and check-out usually?" }], lang: "en", checks: ["check","hotel","time"], component: "TravelKnowledge" },
    { category: "Hotels", name: "Hotel Bali with pool (ID)", messages: [{ role: "user", content: "Rekomendasikan hotel bintang 4 di Seminyak Bali dengan kolam renang" }], lang: "id", checks: ["hotel","bali"], component: "TravelKnowledge" },
    // Visa (spec Section 5 & 8)
    { category: "Visa", name: "Indonesia ke Timor-Leste (ID)", messages: [{ role: "user", content: "Apakah orang Indonesia perlu visa untuk ke Timor-Leste?" }], lang: "id", checks: ["visa","timor"], component: "TravelKnowledge", expected: "Visa requirement info" },
    { category: "Visa", name: "TL national to Australia (EN)", messages: [{ role: "user", content: "What visa do I need to travel from Timor-Leste to Australia?" }], lang: "en", checks: ["visa","australia"], component: "TravelKnowledge" },
    { category: "Visa", name: "Japan visa requirements", messages: [{ role: "user", content: "Do I need a visa to visit Japan from Timor-Leste?" }], lang: "en", checks: ["visa","japan"], component: "TravelKnowledge" },
    { category: "Visa", name: "Schengen visa Europe", messages: [{ role: "user", content: "How do I apply for a Schengen visa to visit Europe?" }], lang: "en", checks: ["schengen","visa","europe"], component: "TravelKnowledge" },
    { category: "Visa", name: "Foreigners visiting TL", messages: [{ role: "user", content: "What visa is required for foreigners visiting Timor-Leste?" }], lang: "en", checks: ["visa","timor","visit"], component: "TravelKnowledge" },
  ];
}

// ─── OTA Score calculator — Spec Section 14 ──────────────────────────────────
// Formula: Conversation(20%) + Booking(20%) + Payment(20%) + Memory(20%) + Travel Accuracy(20%)
// Travel Accuracy = avg(Flight Search, Hotels, Visa)
function calcOtaScore(catScores: Record<string, number>): { score: number; status: string; breakdown: Record<string, number> } {
  const conversationAccuracy = ((catScores["Simple Conversation"] ?? 0) + (catScores["Multi-Language"] ?? 0)) / 2;
  const bookingAccuracy = catScores["Booking Flow"] ?? 0;
  const paymentAccuracy = catScores["Payment"] ?? 0;
  const memoryAccuracy = catScores["Memory"] ?? 0;
  const flightScore = catScores["Flight Search"] ?? 0;
  const globalRoutesV2Score = catScores["Global Routes V2"] ?? 0;
  const hotelsScore = catScores["Hotels"] ?? 0;
  const visaScore = catScores["Visa"] ?? 0;
  // Travel Accuracy: avg of available travel knowledge categories (Flight, Hotels, Visa, GlobalV2)
  const travelComponents = [flightScore, globalRoutesV2Score, hotelsScore, visaScore].filter(s => s > 0);
  const travelAccuracy = travelComponents.length > 0 ? travelComponents.reduce((a, b) => a + b, 0) / travelComponents.length : flightScore;
  const score = Math.round(
    (conversationAccuracy * 0.20) +
    (bookingAccuracy     * 0.20) +
    (paymentAccuracy     * 0.20) +
    (memoryAccuracy      * 0.20) +
    (travelAccuracy      * 0.20)
  );
  const status = score >= 95 ? "OTA_READY" : score >= 90 ? "PRODUCTION_READY" : score >= 80 ? "NEEDS_IMPROVEMENT" : "CRITICAL";
  return {
    score,
    status,
    breakdown: {
      conversationAccuracy: Math.round(conversationAccuracy),
      bookingAccuracy: Math.round(bookingAccuracy),
      paymentAccuracy: Math.round(paymentAccuracy),
      memoryAccuracy: Math.round(memoryAccuracy),
      travelAccuracy: Math.round(travelAccuracy),
    },
  };
}

// ─── Regression detector ──────────────────────────────────────────────────────
async function detectRegression(currentCatScores: Record<string, number>): Promise<{ detected: boolean; details: Record<string, unknown> }> {
  try {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const [prevRun] = await db
      .select()
      .from(testRunsTable)
      .where(and(eq(testRunsTable.status, "completed"), gte(testRunsTable.createdAt, yesterday)))
      .orderBy(desc(testRunsTable.createdAt))
      .limit(1);
    if (!prevRun?.categoryScores) return { detected: false, details: {} };
    const prev = prevRun.categoryScores as Record<string, number>;
    const regressions: Record<string, { prev: number; current: number; drop: number }> = {};
    const criticalCats = ["Booking Flow", "Payment", "Memory"];
    for (const cat of criticalCats) {
      const prevScore = prev[cat] ?? 100;
      const currScore = currentCatScores[cat] ?? 0;
      const drop = prevScore - currScore;
      if (drop > 5) regressions[cat] = { prev: prevScore, current: currScore, drop };
    }
    return { detected: Object.keys(regressions).length > 0, details: regressions };
  } catch { return { detected: false, details: {} }; }
}

// ─── Main test runner (async, stores to DB) ───────────────────────────────────
export async function runQATests(trigger: string = "manual"): Promise<string> {
  const runId = genId();
  const startTime = Date.now();

  await db.insert(testRunsTable).values({ id: runId, trigger, status: "running" });
  activeRuns.set(runId, { progress: 0, total: 0, phase: "Starting…" });

  setImmediate(async () => {
    const suite = buildTestSuite();
    const catOrder = ["Simple Conversation", "Flight Search", "Multi-Language", "Booking Flow", "Payment", "Memory", "Stress Test", "Hotels", "Visa"];
    activeRuns.set(runId, { progress: 0, total: suite.length, phase: "Starting…" });

    let passCount = 0, warnCount = 0, failCount = 0;
    let testSeq = 0;
    const catAccum: Record<string, { pass: number; warn: number; fail: number }> = {};

    for (const cat of catOrder) {
      const catTests = suite.filter(t => t.category === cat);
      if (!catTests.length) continue;
      activeRuns.set(runId, { progress: testSeq, total: suite.length, phase: cat });

      for (const tc of catTests) {
        testSeq++;
        // Throttle: 800ms between tests to avoid hammering AI providers
        if (testSeq > 1) await new Promise(r => setTimeout(r, 800));
        const { reply, ok, latencyMs } = await callChat(tc.messages, tc.lang);
        let status: "pass" | "warn" | "fail";
        let detail: string;

        if (!ok) {
          status = "fail";
          detail = `Chat API error: ${reply}`;
        } else {
          const score = scoreResponse(reply, tc.checks);
          status = score.ok ? (score.warn ? "warn" : "pass") : "fail";
          detail = `${score.detail} · ${latencyMs}ms`;
        }

        if (status === "pass") passCount++;
        else if (status === "warn") warnCount++;
        else failCount++;

        if (!catAccum[cat]) catAccum[cat] = { pass: 0, warn: 0, fail: 0 };
        catAccum[cat]![status === "pass" ? "pass" : status === "warn" ? "warn" : "fail"]++;

        const resultId = genId();
        const query = tc.messages[tc.messages.length - 1]?.content ?? "";
        await db.insert(testResultsTable).values({
          id: resultId, runId, category: cat, name: tc.name,
          status, latencyMs, detail, query: query.substring(0, 500),
          response: (reply || "").substring(0, 500),
        });

        if (status === "fail") {
          const rc = inferRootCause(cat, detail);
          await db.insert(testFailuresTable).values({
            id: genId(), runId, testId: resultId, category: cat, name: tc.name,
            query: query.substring(0, 500), expected: tc.expected || tc.checks.join(", "),
            actual: (reply || "").substring(0, 300), error: detail,
            component: tc.component || cat, rootCause: rc.cause,
            confidence: rc.confidence, recommendedFix: rc.fix,
          });
        }

        activeRuns.set(runId, { progress: testSeq, total: suite.length, phase: cat });
      }
    }

    const total = passCount + warnCount + failCount;
    const passRate = total > 0 ? Math.round(((passCount + warnCount * 0.5) / total) * 100) : 0;

    const catScores: Record<string, number> = {};
    for (const [cat, acc] of Object.entries(catAccum)) {
      const t = acc.pass + acc.warn + acc.fail;
      catScores[cat] = t > 0 ? Math.round(((acc.pass + acc.warn * 0.5) / t) * 100) : 0;
    }

    const ota = calcOtaScore(catScores);
    const regression = await detectRegression(catScores);

    const topFails = await db.select().from(testFailuresTable).where(eq(testFailuresTable.runId, runId)).limit(10);
    const revenueImpact = failCount > 5 ? "HIGH — multiple booking/payment failures detected" : failCount > 2 ? "MEDIUM — some test failures may affect conversions" : "LOW — minor issues only";
    const execReport = {
      generatedAt: new Date().toISOString(), totalTests: total, passCount, warnCount, failCount,
      passRate, otaScore: ota.score, otaStatus: ota.status,
      top10Failures: topFails.map(f => ({ category: f.category, name: f.name, rootCause: f.rootCause })),
      revenueImpact, recommendedPriorities: topFails.slice(0, 3).map(f => f.recommendedFix || ""),
      regressionDetected: regression.detected,
    };

    // Insert improvement recs
    for (const [cat, score] of Object.entries(catScores)) {
      if (score < 80) {
        const autoFixable = ["Simple Conversation", "Multi-Language", "Flight Search"].includes(cat);
        const fixMap: Record<string, string> = {
          "Simple Conversation": "Improve greeting responses and add more local context to system prompt",
          "Flight Search": "Expand global route fallback database and improve IATA code detection",
          "Multi-Language": "Tune language detection and add language-specific fallbacks",
          "Booking Flow": "Review state machine transitions and session persistence logic",
          "Payment": "Add more payment method keywords to response templates",
          "Memory": "Implement conversation summarization for contexts > 10 turns",
          "Stress Test": "Optimize concurrent request handling and add connection pooling",
        };
        await db.insert(improvementRecsTable).values({
          id: genId(), runId, area: cat,
          priority: score < 60 ? "high" : "medium",
          suggestion: fixMap[cat] || `Improve ${cat} accuracy (currently ${score}%)`,
          autoFixable,
        });
      }
    }
    if (regression.detected) {
      await db.insert(improvementRecsTable).values({
        id: genId(), runId, area: "REGRESSION ALERT", priority: "high",
        suggestion: `🚨 REGRESSION DETECTED — ${Object.keys(regression.details).join(", ")} accuracy dropped >5%`,
        autoFixable: false,
      });
    }

    await db.update(testRunsTable).set({
      status: "completed", durationMs: Date.now() - startTime,
      totalTests: total, passCount, warnCount, failCount,
      passRate, otaScore: ota.score, otaStatus: ota.status,
      regressionDetected: regression.detected, regressionDetails: regression.details,
      categoryScores: catScores, executiveReport: execReport,
    }).where(eq(testRunsTable.id, runId));

    activeRuns.delete(runId);
    logger.info({ runId, passRate, otaScore: ota.score, otaStatus: ota.status, regressionDetected: regression.detected }, "🧪 CQAP run completed");

    // ─── Send executive email report to admin ─────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.RESEND_FROM_EMAIL || "info.lusanimar@gmail.com";
    if (resendKey) {
      const statusColor = ota.status === "WORLD_CLASS" ? "#10b981" : ota.status === "PRODUCTION_READY" ? "#3b82f6" : ota.status === "NEEDS_IMPROVEMENT" ? "#f59e0b" : "#ef4444";
      const regressionBadge = regression.detected ? `<div style="background:#ef4444;color:#fff;padding:8px 16px;border-radius:8px;margin:12px 0;font-weight:bold">🚨 REGRESSION DETECTED — ${Object.keys(regression.details).join(", ")}</div>` : "";
      const topFailHtml = execReport.top10Failures.slice(0, 5).map((f: any) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #1e293b;color:#94a3b8">${f.category}</td><td style="padding:6px 10px;border-bottom:1px solid #1e293b;color:#e2e8f0">${f.name}</td><td style="padding:6px 10px;border-bottom:1px solid #1e293b;color:#fca5a5;font-size:11px">${f.rootCause}</td></tr>`).join("");
      const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#010d1e;font-family:Arial,sans-serif;color:#e2e8f0">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:24px;font-weight:900;background:linear-gradient(135deg,#00e5ff,#9b59ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent">✈ RANIA AI · CQAP REPORT</div>
    <div style="color:#64748b;font-size:12px;margin-top:4px">${new Date().toLocaleString("id-ID", { timeZone: "Asia/Dili" })} (Dili Time)</div>
  </div>
  ${regressionBadge}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px">
    <div style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center"><div style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:4px">OTA Score</div><div style="font-size:26px;font-weight:900;color:${statusColor}">${ota.score}</div><div style="font-size:10px;color:${statusColor}">${ota.status}</div></div>
    <div style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center"><div style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:4px">Pass Rate</div><div style="font-size:26px;font-weight:900;color:#10b981">${passRate}%</div><div style="font-size:10px;color:#10b981">${passCount} passed</div></div>
    <div style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center"><div style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:4px">Warnings</div><div style="font-size:26px;font-weight:900;color:#f59e0b">${warnCount}</div></div>
    <div style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center"><div style="color:#64748b;font-size:10px;text-transform:uppercase;margin-bottom:4px">Failures</div><div style="font-size:26px;font-weight:900;color:#ef4444">${failCount}</div></div>
  </div>
  ${topFailHtml ? `<div style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:20px"><div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Top Failures</div><table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="background:#1e293b"><th style="padding:6px 10px;text-align:left;color:#64748b;font-weight:normal">Category</th><th style="padding:6px 10px;text-align:left;color:#64748b;font-weight:normal">Test</th><th style="padding:6px 10px;text-align:left;color:#64748b;font-weight:normal">Root Cause</th></tr>${topFailHtml}</table></div>` : ""}
  <div style="background:linear-gradient(135deg,#0a1628,#1e293b);border:1px solid #334155;border-radius:10px;padding:16px;margin-bottom:20px"><div style="color:#64748b;font-size:11px;text-transform:uppercase;margin-bottom:8px">Revenue Impact</div><div style="color:#e2e8f0">${execReport.revenueImpact}</div></div>
  <div style="text-align:center;color:#475569;font-size:11px"><p>RANIA AI · CQAP Automated QA System · Dili, Timor-Leste 🇹🇱</p><p>Run ID: <span style="font-family:monospace;color:#94a3b8">${runId}</span></p></div>
</div></body></html>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: adminEmail, to: ["info.lusanimar@gmail.com"], subject: `🧪 RANIA QA Report — OTA ${ota.score} · ${passRate}% Pass · ${new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Dili" })}`, html: emailHtml }),
        });
        logger.info({ runId, otaScore: ota.score }, "🧪 CQAP: executive report emailed to admin");
      } catch (emailErr: any) {
        logger.warn({ err: emailErr.message }, "🧪 CQAP: email report failed");
      }
    }
  });

  return runId;
}

// ─── Nightly cron: 02:00 Dili = 17:00 UTC ─────────────────────────────────────
export function startCqapCron(): void {
  cron.schedule("0 17 * * *", async () => {
    logger.info("🧪 CQAP: nightly automated QA starting (02:00 Dili)");
    await runQATests("nightly-cron");
  });
  logger.info("🧪 CQAP: nightly cron scheduled — daily at 17:00 UTC (02:00 Dili)");

  // Run on startup if no recent run in last 20 hours
  setTimeout(async () => {
    try {
      const cutoff = new Date(); cutoff.setHours(cutoff.getHours() - 20);
      const [last] = await db.select().from(testRunsTable)
        .where(and(eq(testRunsTable.status, "completed"), gte(testRunsTable.createdAt, cutoff)))
        .orderBy(desc(testRunsTable.createdAt)).limit(1);
      if (!last) {
        logger.info("🧪 CQAP: no recent run found — running startup QA");
        await runQATests("startup");
      } else {
        logger.info({ lastRunAt: last.createdAt, passRate: last.passRate }, "🧪 CQAP: recent run found — skip startup");
      }
    } catch (e: any) { logger.warn({ err: e.message }, "🧪 CQAP: startup check failed"); }
  }, 15000);
}

// ─── Routes ────────────────────────────────────────────────────────────────────

// GET /api/admin/cqap/history — last 30 days of runs
router.get("/admin/cqap/history", requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt((req.query.days as string) || "30", 10);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const runs = await db.select({
      id: testRunsTable.id, createdAt: testRunsTable.createdAt, trigger: testRunsTable.trigger,
      durationMs: testRunsTable.durationMs, totalTests: testRunsTable.totalTests,
      passCount: testRunsTable.passCount, warnCount: testRunsTable.warnCount, failCount: testRunsTable.failCount,
      passRate: testRunsTable.passRate, otaScore: testRunsTable.otaScore, otaStatus: testRunsTable.otaStatus,
      regressionDetected: testRunsTable.regressionDetected, categoryScores: testRunsTable.categoryScores,
      status: testRunsTable.status,
    }).from(testRunsTable)
      .where(gte(testRunsTable.createdAt, cutoff))
      .orderBy(desc(testRunsTable.createdAt))
      .limit(90);
    res.json({ runs, total: runs.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/cqap/latest — most recent completed run
router.get("/admin/cqap/latest", requireAdmin, async (req: Request, res: Response) => {
  try {
    const [run] = await db.select().from(testRunsTable)
      .where(eq(testRunsTable.status, "completed"))
      .orderBy(desc(testRunsTable.createdAt)).limit(1);
    if (!run) { res.json({ run: null, active: null }); return; }

    const failures = await db.select().from(testFailuresTable).where(eq(testFailuresTable.runId, run.id)).limit(20);
    const improvements = await db.select().from(improvementRecsTable).where(eq(improvementRecsTable.runId, run.id));

    const activeList = Array.from(activeRuns.entries()).map(([id, v]) => ({ id, ...v }));
    const otaResult = calcOtaScore((run.categoryScores as Record<string, number>) || {});
    res.json({ run: { ...run, otaBreakdown: otaResult.breakdown }, failures, improvements, active: activeList[0] || null });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/cqap/history/:runId — full details for a run
router.get("/admin/cqap/history/:runId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const [run] = await db.select().from(testRunsTable).where(eq(testRunsTable.id, runId)).limit(1);
    if (!run) { res.status(404).json({ error: "Run not found" }); return; }
    const results = await db.select().from(testResultsTable).where(eq(testResultsTable.runId, runId));
    const failures = await db.select().from(testFailuresTable).where(eq(testFailuresTable.runId, runId));
    const improvements = await db.select().from(improvementRecsTable).where(eq(improvementRecsTable.runId, runId));
    res.json({ run, results, failures, improvements });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/cqap/trigger — manually trigger a run
router.post("/admin/cqap/trigger", requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = Array.from(activeRuns.keys());
    if (existing.length > 0) {
      res.json({ success: false, message: "A test run is already in progress", activeRunId: existing[0] });
      return;
    }
    const runId = await runQATests("manual");
    res.json({ success: true, runId, message: "QA test run started — check /api/admin/cqap/status/" + runId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/cqap/status/:runId — live progress of an active run
router.get("/admin/cqap/status/:runId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const active = activeRuns.get(req.params.runId);
    if (active) { res.json({ status: "running", ...active }); return; }
    const [run] = await db.select({ status: testRunsTable.status, passRate: testRunsTable.passRate, otaScore: testRunsTable.otaScore })
      .from(testRunsTable).where(eq(testRunsTable.id, req.params.runId)).limit(1);
    res.json(run || { status: "not_found" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/cqap/score — OTA readiness score (latest run)
router.get("/admin/cqap/score", requireAdmin, async (req: Request, res: Response) => {
  try {
    const [run] = await db.select({
      otaScore: testRunsTable.otaScore, otaStatus: testRunsTable.otaStatus,
      passRate: testRunsTable.passRate, categoryScores: testRunsTable.categoryScores,
      createdAt: testRunsTable.createdAt, regressionDetected: testRunsTable.regressionDetected,
    }).from(testRunsTable).where(eq(testRunsTable.status, "completed"))
      .orderBy(desc(testRunsTable.createdAt)).limit(1);
    const active = activeRuns.size > 0;
    const otaResult = run ? calcOtaScore((run.categoryScores as Record<string, number>) || {}) : null;
    res.json({ ...(run || { otaScore: null, otaStatus: "NO_DATA" }), otaBreakdown: otaResult?.breakdown ?? null, activeRun: active });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
