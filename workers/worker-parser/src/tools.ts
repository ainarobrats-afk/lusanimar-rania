// ============================================================================
// RANIA V3.0 Dual-Core — Global Tools (Memory + Switch + Market + Ads)
// Handles simpan_memory_user, pindah_chat, bikin_iklan, cari_harga_pasaran
// SANIMAR ADS V1: topup, create_campaign, click, sponsored search
// ============================================================================

interface SupabaseEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  XENDIT_API_KEY?: string;
  XENDIT_CALLBACK_TOKEN?: string;
}

// ─── Memory: Save ───────────────────────────────────────────────────────────

interface MemoryFields {
  user_id: string;
  suka_bali?: boolean;
  jual_tour?: boolean;
  cari_hotel?: boolean;
  budget?: number;
  nama?: string;
  bahasa?: string;
  nasionalitas?: string;
  [key: string]: unknown;
}

/**
 * Save user memory to Supabase (upsert).
 * Falls back to no-op if Supabase is not configured.
 */
export async function saveUserMemory(
  fields: MemoryFields,
  env: SupabaseEnv
): Promise<{ success: boolean; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn("[memory] Supabase not configured — skipping save");
    return { success: true }; // graceful no-op
  }

  const { user_id, ...data } = fields;
  if (!user_id) return { success: false, error: "user_id required" };

  // Build upsert payload — only include non-undefined fields
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) updateFields[k] = v;
  }

  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/user_memory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ user_id, ...updateFields }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn(`[memory] Supabase upsert failed (${response.status}):`, err.substring(0, 200));
      return { success: true }; // graceful — don't break chat for memory issues
    }

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    console.warn("[memory] Save error:", msg);
    return { success: true }; // graceful — don't break chat for memory issues
  }
}

// ─── Memory: Load ───────────────────────────────────────────────────────────

/**
 * Load user memory from Supabase.
 * Returns empty object if not configured or not found.
 */
export async function loadUserMemory(
  userId: string,
  env: SupabaseEnv
): Promise<Record<string, unknown>> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !userId) {
    return {};
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/user_memory?user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      {
        headers: {
          "apikey": env.SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`[memory] Load failed (${response.status})`);
      return {};
    }

    const rows = (await response.json()) as Array<Record<string, unknown>>;
    if (!rows.length) return {};

    const row = rows[0];
    // Strip internal fields
    delete row.created_at;
    delete row.updated_at;
    delete row.user_id;
    return row;
  } catch (error) {
    console.warn("[memory] Load error:", error instanceof Error ? error.message : "unknown");
    return {};
  }
}

// ─── Auto-detect memory from user text ──────────────────────────────────────

/**
 * Extract memory hints from user message text.
 * Returns partial MemoryFields or null.
 */
export function extractMemoryFromText(
  text: string,
  userId: string
): Partial<MemoryFields> | null {
  const lower = text.toLowerCase();
  const hints: Partial<MemoryFields> = {};
  let found = false;

  // Travel preferences
  if (/\bbali\b|\bdenpasar\b/.test(lower)) { hints.suka_bali = true; found = true; }
  if (/\bhotel\b|\bpenginapan\b|\bresort\b/.test(lower)) { hints.cari_hotel = true; found = true; }
  if (/\btour\b|\bpaket\s*wisata\b|\bjalan.jalan\b/.test(lower)) { hints.jual_tour = true; found = true; }

  // Budget detection
  const budgetMatch = lower.match(/(?:budget|anggaran|dana)\s*(?:rp|usd|\$)?\s*([\d.,]+)\s*(?:rb|ribu|jt|juta|k)?/i);
  if (budgetMatch) {
    let val = parseInt(budgetMatch[1].replace(/[.,]/g, ""), 10);
    if (/rb|ribu|k/i.test(budgetMatch[0])) val *= 1000;
    if (/jt|juta/i.test(budgetMatch[0])) val *= 1000000;
    if (val > 0) { hints.budget = val; found = true; }
  }

  // Name detection (simple)
  const nameMatch = text.match(/(?:nama(?:ku)?|saya|hau|my name (?:is|))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) { hints.nama = nameMatch[1].trim(); found = true; }

  return found ? { user_id: userId, ...hints } : null;
}

// ─── Cross-Router: Detect Switch Intent ─────────────────────────────────────

/**
 * Check if a Market message should be routed to Travel.
 * Returns the matched keyword or null.
 */
export function detectTravelIntentInMarket(text: string): string | null {
  const lower = text.toLowerCase();
  const keywords = [
    "tiket", "voo", "aviaun", "pesawat", "penerbangan", "flight", "ticket",
    "visa", "paspor", "pasaporte", "imigrasi",
    "cuaca", "weather", "iklim",
    "hotel", "penginapan", "resort",
    "hakarak ba", "atu ba", "mau ke", "mau pergi", "fly to",
    "harga tiket", "harga terbang", "airfare", "book flight",
    "husi dili", "ba bali", "ba darwin", "ba singapore",
    "dari dili", "ke bali", "ke jakarta", "ke singapore",
  ];
  for (const kw of keywords) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

/**
 * Check if a Travel message should be routed to Market.
 * Returns the matched keyword or null.
 */
export function detectMarketIntentInTravel(text: string): string | null {
  const lower = text.toLowerCase();
  const keywords = [
    "bikinin iklan", "buat iklan", "posting iklan", "create listing", "post ad",
    "jual barang", "mau jual", "sell my", "jual motor", "jual mobil", "jual hp",
    "harga pasaran", "harga pasar", "market price",
    "fa'an", "sosa", "kria anúnsiu", "presu merkadu",
    "marketplace", "pasar online", "toko online",
    "barang bekas", "secondhand", "used item",
  ];
  for (const kw of keywords) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

// ─── Market Tool: bikin_iklan ───────────────────────────────────────────────

interface BikinIklanArgs {
  nama_barang: string;
  kondisi?: string;
  harga?: number;
  deskripsi?: string;
  kategori?: string;
}

/**
 * Generate a market listing/ad draft.
 * Returns structured listing data for the AI to present.
 */
export function handleBikinIklan(args: BikinIklanArgs): {
  success: boolean;
  data: Record<string, unknown>;
} {
  const listing = {
    listingId: `lst-${Date.now().toString(36)}`,
    namaBarang: args.nama_barang,
    kondisi: args.kondisi || "bekas",
    harga: args.harga || null,
    hargaLabel: args.harga ? `Rp ${args.harga.toLocaleString("id-ID")}` : "Hubungi penjual",
    deskripsi: args.deskripsi || `${args.nama_barang} — kondisi ${args.kondisi || "bekas"}`,
    kategori: args.kategori || "umum",
    status: "DRAFT",
    tips: [
      "Tambahkan foto jelas (min 3 foto: depan, belakang, detail)",
      "Tulis deskripsi jujur termasuk kekurangan",
      "Harga nego lebih cepat laku daripada harga pas",
      "Respon cepat = peluang jual lebih tinggi",
    ],
  };

  return { success: true, data: listing };
}

// ─── Market Tool: cari_harga_pasaran ────────────────────────────────────────

interface CariHargaArgs {
  nama_barang: string;
  kategori?: string;
  lokasi?: string;
}

/**
 * Get estimated market price range for an item.
 * Returns mock/general ranges — will connect to real data later.
 */
export function handleCariHargaPasaran(args: CariHargaArgs): {
  success: boolean;
  data: Record<string, unknown>;
} {
  const item = args.nama_barang.toLowerCase();

  // General price ranges based on common items in Timor-Leste market
  const priceRanges: Record<string, { min: number; max: number; note: string }> = {
    "motor": { min: 5000000, max: 25000000, note: "Tergantung merek & tahun" },
    "mobil": { min: 50000000, max: 300000000, note: "Tergantung merek, tahun & kondisi" },
    "hp": { min: 500000, max: 15000000, note: "Tergantung merek & spesifikasi" },
    "laptop": { min: 3000000, max: 25000000, note: "Tergantung spesifikasi" },
    "baju": { min: 25000, max: 500000, note: "Tergantung bahan & merek" },
    "sepeda": { min: 1000000, max: 8000000, note: "Tergantung jenis & kondisi" },
    "tv": { min: 1500000, max: 15000000, note: "Tergantung ukuran & merek" },
    "kulkas": { min: 2000000, max: 12000000, note: "Tergantung kapasitas" },
  };

  // Try to match
  let matched: { min: number; max: number; note: string } | null = null;
  for (const [key, range] of Object.entries(priceRanges)) {
    if (item.includes(key)) { matched = range; break; }
  }

  if (matched) {
    return {
      success: true,
      data: {
        item: args.nama_barang,
        hargaMin: matched.min,
        hargaMax: matched.max,
        hargaMinLabel: `Rp ${matched.min.toLocaleString("id-ID")}`,
        hargaMaxLabel: `Rp ${matched.max.toLocaleString("id-ID")}`,
        catatan: matched.note,
        lokasi: args.lokasi || "Timor-Leste",
        sumber: "estimasi umum — harga aktual bervariasi",
      },
    };
  }

  return {
    success: true,
    data: {
      item: args.nama_barang,
      hargaMin: null,
      hargaMax: null,
      catatan: "Harga belum tersedia di database. Silakan cek langsung di pasar atau tanya penjual lain.",
      lokasi: args.lokasi || "Timor-Leste",
      sumber: "tidak ditemukan",
    },
  };
}

// ─── ADS ENGINE: Banned Words Moderation ────────────────────────────────────

const BANNED_WORDS = [
  'judi', 'slot', 'gacor', 'pinjol', 'togel', 'casino',
  'bandar', 'betting', 'taruhan', 'bokep', 'xxx',
  'narkoba', 'ganja', 'sabung',
];

/**
 * Check if listing title/description contains banned words.
 * Returns null if clean, or the matched banned word.
 */
export function detectBannedContent(title: string, description?: string): string | null {
  const text = `${title} ${description || ''}`.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (text.includes(word)) return word;
  }
  return null;
}

// ─── ADS ENGINE: Supabase helper ────────────────────────────────────────────

function supabaseHeaders(env: SupabaseEnv) {
  return {
    "Content-Type": "application/json",
    "apikey": env.SUPABASE_SERVICE_KEY!,
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY!}`,
  };
}

// ─── ADS: Top-up via Xendit QRIS ────────────────────────────────────────────

export async function handleAdsTopup(
  args: { user_id: string; amount_cents: number },
  env: SupabaseEnv
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }
  if (!env.XENDIT_API_KEY) {
    return { success: false, error: "Xendit not configured" };
  }
  if (args.amount_cents < 500) {
    return { success: false, error: "Minimum top-up is $5.00 (500 cents)" };
  }

  try {
    // 1) Create Xendit QRIS invoice
    const invoiceResp = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(env.XENDIT_API_KEY + ':')}`,
      },
      body: JSON.stringify({
        external_id: `topup-${args.user_id}-${Date.now()}`,
        amount: args.amount_cents / 100, // Xendit uses dollars, not cents
        description: `Sanmar Ads Top-up $${(args.amount_cents / 100).toFixed(2)}`,
        currency: "USD",
        payment_methods: ["QRIS"],
        success_redirect_url: "/sanimar-market/ads/dashboard?topup=success",
        failure_redirect_url: "/sanimar-market/ads/dashboard?topup=failed",
      }),
    });

    if (!invoiceResp.ok) {
      const err = await invoiceResp.text();
      return { success: false, error: `Xendit error: ${invoiceResp.status} ${err}` };
    }

    const invoice = await invoiceResp.json() as Record<string, unknown>;

    // 2) Ensure wallet exists (upsert)
    await fetch(`${env.SUPABASE_URL}/rest/v1/vendor_wallet`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        "Prefer": "resolution=ignore-duplicates",
      },
      body: JSON.stringify({ user_id: args.user_id, saldo_cents: 0 }),
    });

    return {
      success: true,
      data: {
        invoice_id: invoice.id,
        invoice_url: invoice.invoice_url,
        amount_cents: args.amount_cents,
        status: "PENDING_PAYMENT",
        qr_code_url: invoice.qr_code_url || null,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

// ─── ADS: Xendit Webhook (called when payment succeeds) ─────────────────────

export async function handleXenditWebhook(
  payload: Record<string, unknown>,
  env: SupabaseEnv
): Promise<{ success: boolean; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }

  // Extract user_id from external_id format: topup-{user_id}-{timestamp}
  const externalId = payload.external_id as string;
  if (!externalId?.startsWith("topup-")) {
    return { success: false, error: "Invalid external_id format" };
  }

  const parts = externalId.split("-");
  // Format: topup-{uuid-parts}-{timestamp} — UUID is parts[1..5]
  const userId = parts.slice(1, 6).join("-");
  const amountCents = Math.round((payload.amount as number) * 100);

  if (!userId || !amountCents) {
    return { success: false, error: "Cannot parse user_id or amount" };
  }

  try {
    // Increment wallet
    const currentResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${userId}&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const rows = await currentResp.json() as Array<{ saldo_cents: number; total_topped_up_cents: number }>;
    const current = rows[0] || { saldo_cents: 0, total_topped_up_cents: 0 };

    await fetch(`${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${userId}`, {
      method: "PATCH",
      headers: supabaseHeaders(env),
      body: JSON.stringify({
        saldo_cents: current.saldo_cents + amountCents,
        total_topped_up_cents: current.total_topped_up_cents + amountCents,
      }),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

// ─── ADS: Create Campaign ───────────────────────────────────────────────────

export async function handleAdsCreateCampaign(
  args: {
    user_id: string;
    listing_id: string;
    campaign_type: string;
    budget_cents: number;
    duration_days?: number;
    auto_renew?: boolean;
    auto_renew_amount_cents?: number;
  },
  env: SupabaseEnv
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // 1) Check terms acceptance
    const termsResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/ads_terms_log?user_id=eq.${args.user_id}&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const termsRows = await termsResp.json() as Array<{ id: number }>;
    if (termsRows.length === 0) {
      return { success: false, error: "Must accept Terms & Conditions first" };
    }

    // 2) Check wallet balance
    const walletResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${args.user_id}&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const walletRows = await walletResp.json() as Array<{ saldo_cents: number }>;
    const wallet = walletRows[0];
    if (!wallet || wallet.saldo_cents < args.budget_cents) {
      return {
        success: false,
        error: `Insufficient balance. Need $${(args.budget_cents / 100).toFixed(2)}, have $${((wallet?.saldo_cents || 0) / 100).toFixed(2)}. Top-up first!`,
      };
    }

    // 3) Check listing for banned content
    const listingResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/market_listings?id=eq.${args.listing_id}&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const listings = await listingResp.json() as Array<{ title: string; description?: string }>;
    if (listings.length === 0) {
      return { success: false, error: "Listing not found" };
    }

    const listing = listings[0];
    const bannedWord = detectBannedContent(listing.title, listing.description);
    if (bannedWord) {
      // Create campaign as rejected (no refund since we haven't deducted)
      await fetch(`${env.SUPABASE_URL}/rest/v1/ads_campaign`, {
        method: "POST",
        headers: supabaseHeaders(env),
        body: JSON.stringify({
          user_id: args.user_id,
          listing_id: args.listing_id,
          campaign_type: args.campaign_type,
          budget_cents: args.budget_cents,
          status: "rejected",
          metadata: { rejection_reason: `Banned word: ${bannedWord}` },
        }),
      });
      return { success: false, error: `Banned content detected ('${bannedWord}'). Ad rejected. No refund.` };
    }

    // 4) Deduct wallet balance
    await fetch(`${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${args.user_id}`, {
      method: "PATCH",
      headers: supabaseHeaders(env),
      body: JSON.stringify({
        saldo_cents: wallet.saldo_cents - args.budget_cents,
      }),
    });

    // 5) Create campaign
    const endDate = args.duration_days
      ? new Date(Date.now() + args.duration_days * 86400000).toISOString()
      : null;

    // FITUR 1: Auto-renewal setup
    const autoRenew = args.auto_renew === true;
    const autoRenewAmount = autoRenew ? (args.auto_renew_amount_cents || args.budget_cents) : 0;

    // Create Xendit recurring payment if auto-renew enabled
    let xenditRecurringId: string | null = null;
    if (autoRenew && env.XENDIT_API_KEY) {
      try {
        const recurringResp = await fetch("https://api.xendit.co/recurring_payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(env.XENDIT_API_KEY + ':')}`,
          },
          body: JSON.stringify({
            external_id: `recurring-${args.user_id}-${Date.now()}`,
            payer_email: `vendor-${args.user_id}@sanimar.market`, // placeholder
            description: `Sanimar Ads Auto-Renewal $${(autoRenewAmount / 100).toFixed(2)}/month`,
            amount: autoRenewAmount / 100,
            currency: "USD",
            should_send_email: false,
            interval: 1,
            interval_unit: "MONTH",
            total_recurrence: 12, // max 12 months
            success_redirect_url: "/sanimar-market/ads/dashboard?renew=success",
          }),
        });
        if (recurringResp.ok) {
          const recurring = await recurringResp.json() as Record<string, unknown>;
          xenditRecurringId = recurring.id as string;
        }
      } catch (err) {
        console.warn("[auto-renew] Xendit recurring creation failed:", err);
        // Non-blocking: campaign still created, recurring can be set up later
      }
    }

    const campaignResp = await fetch(`${env.SUPABASE_URL}/rest/v1/ads_campaign`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        user_id: args.user_id,
        listing_id: args.listing_id,
        campaign_type: args.campaign_type,
        budget_cents: args.budget_cents,
        cpc_cents: 10,
        status: "active",
        end_date: endDate,
        auto_renew: autoRenew,
        auto_renew_amount_cents: autoRenewAmount,
        auto_renew_interval_days: 30,
        xendit_recurring_id: xenditRecurringId,
      }),
    });

    if (!campaignResp.ok) {
      // Refund on failure
      await fetch(`${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${args.user_id}`, {
        method: "PATCH",
        headers: supabaseHeaders(env),
        body: JSON.stringify({ saldo_cents: wallet.saldo_cents }),
      });
      const err = await campaignResp.text();
      return { success: false, error: `Campaign creation failed: ${err}` };
    }

    const campaigns = await campaignResp.json() as Array<Record<string, unknown>>;

    // 6) Mark listing as sponsored
    await fetch(`${env.SUPABASE_URL}/rest/v1/market_listings?id=eq.${args.listing_id}`, {
      method: "PATCH",
      headers: supabaseHeaders(env),
      body: JSON.stringify({ is_sponsored: true }),
    });

    return {
      success: true,
      data: {
        campaign: campaigns[0],
        wallet_remaining_cents: wallet.saldo_cents - args.budget_cents,
        auto_renew: autoRenew,
        xendit_recurring_id: xenditRecurringId,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

// ─── ADS: Record Click (Money Printing) ─────────────────────────────────────

export async function handleAdsClick(
  args: { campaign_id: string; clicker_user_id?: string },
  env: SupabaseEnv
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // 1) Get active campaign with remaining budget
    const campResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/ads_campaign?id=eq.${args.campaign_id}&status=eq.active&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const campaigns = await campResp.json() as Array<{
      id: string; spent_cents: number; budget_cents: number; cpc_cents: number;
    }>;
    const campaign = campaigns[0];

    if (!campaign) {
      return { success: false, error: "No active campaign found" };
    }
    if (campaign.spent_cents >= campaign.budget_cents) {
      return { success: false, error: "Budget exhausted" };
    }

    const costCents = campaign.cpc_cents;
    const newSpent = campaign.spent_cents + costCents;
    const newStatus = newSpent >= campaign.budget_cents ? "budget_exhausted" : "active";

    // 2) Update campaign: spent + clicks + status
    await fetch(`${env.SUPABASE_URL}/rest/v1/ads_campaign?id=eq.${campaign.id}`, {
      method: "PATCH",
      headers: supabaseHeaders(env),
      body: JSON.stringify({
        spent_cents: newSpent,
        clicks: campaign.spent_cents / costCents + 1, // approximate click count
        status: newStatus,
      }),
    });

    // 3) Log the click
    await fetch(`${env.SUPABASE_URL}/rest/v1/ads_click_log`, {
      method: "POST",
      headers: supabaseHeaders(env),
      body: JSON.stringify({
        campaign_id: campaign.id,
        clicker_user_id: args.clicker_user_id || null,
        cost_cents: costCents,
      }),
    });

    // 4) If budget exhausted, unmark listing as sponsored
    if (newStatus === "budget_exhausted") {
      // Get listing_id from campaign
      const campDetail = await fetch(
        `${env.SUPABASE_URL}/rest/v1/ads_campaign?id=eq.${campaign.id}&limit=1`,
        { headers: supabaseHeaders(env) }
      );
      const campDetails = await campDetail.json() as Array<{ listing_id: string }>;
      if (campDetails[0]?.listing_id) {
        await fetch(
          `${env.SUPABASE_URL}/rest/v1/market_listings?id=eq.${campDetails[0].listing_id}`,
          {
            method: "PATCH",
            headers: supabaseHeaders(env),
            body: JSON.stringify({ is_sponsored: false }),
          }
        );
      }
    }

    return {
      success: true,
      data: {
        campaign_id: campaign.id,
        cost_cents: costCents,
        spent_cents: newSpent,
        budget_remaining_cents: Math.max(0, campaign.budget_cents - newSpent),
        status: newStatus,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

// ─── ADS: Get Sponsored Listings ────────────────────────────────────────────

export async function handleGetSponsoredListings(
  env: SupabaseEnv
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: true, data: { sponsored: [] } };
  }

  try {
    const resp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/market_listings?is_sponsored=eq.true&status=eq.active&order=created_at.desc&limit=3`,
      { headers: supabaseHeaders(env) }
    );

    if (!resp.ok) {
      return { success: true, data: { sponsored: [] } };
    }

    const listings = await resp.json();
    return { success: true, data: { sponsored: listings } };
  } catch {
    return { success: true, data: { sponsored: [] } };
  }
}

// ─── ADS: Get Vendor Dashboard ──────────────────────────────────────────────

export async function handleAdsDashboard(
  userId: string,
  env: SupabaseEnv
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const [walletResp, campaignsResp] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${userId}&limit=1`, {
        headers: supabaseHeaders(env),
      }),
      fetch(`${env.SUPABASE_URL}/rest/v1/ads_campaign?user_id=eq.${userId}&order=created_at.desc`, {
        headers: supabaseHeaders(env),
      }),
    ]);

    const wallets = await walletResp.json() as Array<Record<string, unknown>>;
    const campaigns = await campaignsResp.json() as Array<Record<string, unknown>>;

    return {
      success: true,
      data: {
        wallet: wallets[0] || { saldo_cents: 0, total_spent_cents: 0, total_topped_up_cents: 0 },
        campaigns,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

// ─── ADS: Accept Terms ──────────────────────────────────────────────────────

export async function handleAcceptTerms(
  userId: string,
  env: SupabaseEnv
): Promise<{ success: boolean; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/ads_terms_log`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ user_id: userId, terms_version: "v1.0" }),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

// ─── FITUR 2: CRON — Low Budget Notification + Auto-Renewal ────────────────

/**
 * Daily cron: find campaigns with <20% budget remaining, send WA nag.
 * Also: find exhausted campaigns with auto_renew=true, auto-topup from wallet.
 * Called via GET /api/ads/cron?token=CRON_SECRET
 */
export async function handleAdsCron(
  env: SupabaseEnv & { FUNDENG_WA_NUMBER?: string }
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }

  const results = { auto_renewed: 0, nags_sent: 0, auto_renew_failed: 0 };

  try {
    // ─── PART A: Auto-renewal for exhausted campaigns ──────────────────
    const exhaustedResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/ads_campaign?status=eq.budget_exhausted&auto_renew=eq.true&limit=50`,
      { headers: supabaseHeaders(env) }
    );
    const exhaustedCampaigns = await exhaustedResp.json() as Array<{
      id: string; user_id: string; auto_renew_amount_cents: number; listing_id: string;
    }>;

    for (const camp of exhaustedCampaigns) {
      try {
        // Check wallet balance
        const walletResp = await fetch(
          `${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${camp.user_id}&limit=1`,
          { headers: supabaseHeaders(env) }
        );
        const wallets = await walletResp.json() as Array<{ saldo_cents: number }>;
        const wallet = wallets[0];

        if (wallet && wallet.saldo_cents >= camp.auto_renew_amount_cents) {
          // Deduct wallet
          await fetch(`${env.SUPABASE_URL}/rest/v1/vendor_wallet?user_id=eq.${camp.user_id}`, {
            method: "PATCH",
            headers: supabaseHeaders(env),
            body: JSON.stringify({
              saldo_cents: wallet.saldo_cents - camp.auto_renew_amount_cents,
            }),
          });

          // Reset campaign
          await fetch(`${env.SUPABASE_URL}/rest/v1/ads_campaign?id=eq.${camp.id}`, {
            method: "PATCH",
            headers: supabaseHeaders(env),
            body: JSON.stringify({
              status: "active",
              spent_cents: 0,
              clicks: 0,
              budget_cents: camp.auto_renew_amount_cents,
              last_renewed_at: new Date().toISOString(),
            }),
          });

          // Re-mark listing as sponsored
          await fetch(`${env.SUPABASE_URL}/rest/v1/market_listings?id=eq.${camp.listing_id}`, {
            method: "PATCH",
            headers: supabaseHeaders(env),
            body: JSON.stringify({ is_sponsored: true }),
          });

          results.auto_renewed++;
        } else {
          // Wallet insufficient — log failure + notify
          await logNotification(env, camp.id, camp.user_id, "auto_renew_failed", "wa",
            "Auto-renewal gagal — saldo tidak cukup");
          results.auto_renew_failed++;
        }
      } catch (err) {
        console.error(`[cron] Auto-renew failed for campaign ${camp.id}:`, err);
      }
    }

    // ─── PART B: Low budget nagging (<20% remaining) ──────────────────
    const activeResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/ads_campaign?status=eq.active&limit=100`,
      { headers: supabaseHeaders(env) }
    );
    const activeCampaigns = await activeResp.json() as Array<{
      id: string; user_id: string; budget_cents: number; spent_cents: number; clicks: number;
    }>;

    for (const camp of activeCampaigns) {
      const remaining = camp.budget_cents - camp.spent_cents;
      const remainingPercent = camp.budget_cents > 0 ? (remaining / camp.budget_cents) * 100 : 100;

      if (remainingPercent <= 20 && remaining > 0) {
        // Check if we already nagged today
        const nagCheck = await fetch(
          `${env.SUPABASE_URL}/rest/v1/ads_notification_log?campaign_id=eq.${camp.id}&notification_type=eq.low_budget&sent_at=gte.${new Date(Date.now() - 86400000).toISOString()}&limit=1`,
          { headers: supabaseHeaders(env) }
        );
        const existingNags = await nagCheck.json() as Array<{ id: number }>;
        if (existingNags.length > 0) continue; // Already nagged today

        const remainingClicks = Math.floor(remaining / 10); // cpc_cents=10

        // Get vendor WA number
        let waNumber = "";
        const listingResp = await fetch(
          `${env.SUPABASE_URL}/rest/v1/market_listings?user_id=eq.${camp.user_id}&limit=1`,
          { headers: supabaseHeaders(env) }
        );
        const listings = await listingResp.json() as Array<{ seller_wa: string }>;
        if (listings[0]?.seller_wa) waNumber = listings[0].seller_wa;

        // Build WA message
        const waMessage = `🔥 Bos! Iklan kamu tinggal ${remainingClicks} klik lagi (sisa $${(remaining / 100).toFixed(2)}).\n\nTop-up sekarang biar iklan ga mati!\n\n👉 https://your-domain.com/sanimar-market/ads/dashboard`;

        // Send WA via wa.me link (or log if no number)
        if (waNumber) {
          const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;
          console.log(`[cron-nag] WA to ${waNumber}: ${waUrl}`);
          // In production: use FundEng WA Business API or 3rd party WA sender
          // For now: log the notification
        }

        // Log notification
        await logNotification(env, camp.id, camp.user_id, "low_budget", "wa",
          `Budget tinggal ${remainingPercent.toFixed(0)}% (${remainingClicks} klik)`);

        results.nags_sent++;
      }
    }

    return {
      success: true,
      data: {
        ...results,
        scanned_campaigns: activeCampaigns.length + exhaustedCampaigns.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

/**
 * Helper: log a notification to ads_notification_log.
 */
async function logNotification(
  env: SupabaseEnv,
  campaignId: string,
  userId: string,
  type: string,
  channel: string,
  message: string
): Promise<void> {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/ads_notification_log`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(env),
        "Prefer": "resolution=ignore-duplicates",
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        user_id: userId,
        notification_type: type,
        channel,
        message_sent: message,
      }),
    });
  } catch {
    // Non-critical — don't fail the cron for notification logging
  }
}

// ─── FITUR 3: Hotel 10% Commission Split Payment ──────────────────────────

/**
 * Process a hotel booking with 90/10 split via Xendit.
 * Called when a buyer books a hotel listing through Sanimar Market.
 */
export async function handleHotelBooking(
  args: {
    listing_id: string;
    buyer_name: string;
    buyer_email: string;
    booking_amount_cents: number;
    check_in: string;
    check_out: string;
    nights: number;
  },
  env: SupabaseEnv
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { success: false, error: "Supabase not configured" };
  }
  if (!env.XENDIT_API_KEY) {
    return { success: false, error: "Xendit not configured" };
  }

  try {
    // 1) Get listing + verify it's a hotel
    const listingResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/market_listings?id=eq.${args.listing_id}&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const listings = await listingResp.json() as Array<{
      id: string; user_id: string; category: string; title: string; seller_wa: string;
    }>;
    const listing = listings[0];

    if (!listing) {
      return { success: false, error: "Listing not found" };
    }
    if (listing.category !== "hotel") {
      return { success: false, error: "Split payment only for hotel category" };
    }

    // 2) Calculate split
    const platformCommissionCents = Math.round(args.booking_amount_cents * 0.10); // 10% to Maun
    const vendorShareCents = args.booking_amount_cents - platformCommissionCents; // 90% to hotel

    // 3) Get vendor payout info
    const payoutResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/vendor_payout_info?user_id=eq.${listing.user_id}&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const payouts = await payoutResp.json() as Array<{
      bank_account: string; bank_name: string; bank_holder: string; dana_number: string;
    }>;
    const payoutInfo = payouts[0];

    // 4) Create Xendit invoice for full amount (buyer pays 100%)
    const invoiceResp = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(env.XENDIT_API_KEY + ':')}`,
      },
      body: JSON.stringify({
        external_id: `hotel-${args.listing_id}-${Date.now()}`,
        amount: args.booking_amount_cents / 100,
        description: `Booking: ${listing.title} (${args.check_in} - ${args.check_out})`,
        currency: "USD",
        payment_methods: ["QRIS", "BCA", "BNI", "BRI", "MANDIRI"],
        success_redirect_url: `/sanimar-market/booking/success?listing=${args.listing_id}`,
      }),
    });

    if (!invoiceResp.ok) {
      const err = await invoiceResp.text();
      return { success: false, error: `Xendit invoice failed: ${err}` };
    }

    const invoice = await invoiceResp.json() as Record<string, unknown>;

    // 5) Log the commission split
    await fetch(`${env.SUPABASE_URL}/rest/v1/ads_commission_log`, {
      method: "POST",
      headers: supabaseHeaders(env),
      body: JSON.stringify({
        listing_id: listing.id,
        booking_amount_cents: args.booking_amount_cents,
        vendor_share_cents: vendorShareCents,
        platform_share_cents: platformCommissionCents,
        vendor_user_id: listing.user_id,
        status: "pending",
      }),
    });

    // 6) If vendor has bank info, create Xendit disbursement for vendor share
    let disbursementId: string | null = null;
    if (payoutInfo?.bank_account && payoutInfo?.bank_name) {
      try {
        const disbResp = await fetch("https://api.xendit.co/disbursements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(env.XENDIT_API_KEY + ':')}`,
            "Idempotency-Key": `disb-${listing.user_id}-${Date.now()}`,
          },
          body: JSON.stringify({
            external_id: `payout-${listing.user_id}-${Date.now()}`,
            bank_code: payoutInfo.bank_name.toUpperCase(),
            account_holder_name: payoutInfo.bank_holder || listing.user_id,
            account_number: payoutInfo.bank_account,
            description: `Sanimar Market: ${listing.title} booking (${args.check_in}-${args.check_out})`,
            amount: vendorShareCents / 100,
            email_to: [], // vendor notified via WA
          }),
        });
        if (disbResp.ok) {
          const disb = await disbResp.json() as Record<string, unknown>;
          disbursementId = disb.id as string;
        }
      } catch (err) {
        console.warn("[hotel-split] Disbursement failed:", err);
        // Non-blocking: commission logged, payout can be retried
      }
    }

    return {
      success: true,
      data: {
        invoice_id: invoice.id,
        invoice_url: invoice.invoice_url,
        booking_total_cents: args.booking_amount_cents,
        vendor_share_cents: vendorShareCents,
        platform_commission_cents: platformCommissionCents,
        platform_commission_label: `10% = $${(platformCommissionCents / 100).toFixed(2)} to platform`,
        vendor_payout_status: disbursementId ? "DISBURSED" : "PENDING_BANK_SETUP",
        listing_title: listing.title,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "unknown" };
  }
}
