// ============================================================================
// RANIA V2.1 — Worker Webhook (Xendit Webhook Handler)
// POST /api/webhook/xendit — Receive and process Xendit payment webhooks
//
// IRON RULE: Only 1 PNR per webhook (idempotency)
// IRON RULE #3: On error → status='VERIFY' (never auto-refund)
// ============================================================================

interface Env {
  XENDIT_WEBHOOK_VERIFICATION_TOKEN: string;
  WORKER_PILOT_URL: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-callback-token",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// In-memory webhook deduplication (for production, use KV or Supabase)
const processedWebhooks = new Set<string>();

// ─── Webhook Verification ────────────────────────────────────────────────────

function verifyWebhookToken(request: Request, expectedToken: string): boolean {
  const token = request.headers.get("x-callback-token");
  if (!token || !expectedToken) return false;
  return token === expectedToken;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

async function handleXenditWebhook(request: Request, env: Env): Promise<Response> {
  // Verify webhook token
  if (env.XENDIT_WEBHOOK_VERIFICATION_TOKEN) {
    if (!verifyWebhookToken(request, env.XENDIT_WEBHOOK_VERIFICATION_TOKEN)) {
      console.warn("Webhook verification failed — invalid token");
      return json({ error: "Invalid webhook token" }, 401);
    }
  }

  let payload: {
    id?: string;
    external_id?: string;
    status?: string;
    paid_amount?: number;
    paid_at?: string;
    payment_method?: string;
    currency?: string;
  };

  try {
    payload = await request.json() as typeof payload;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const webhookId = payload.id;
  if (!webhookId) {
    return json({ error: "Missing webhook ID" }, 400);
  }

  // IDEMPOTENCY CHECK: Only process each webhook once
  if (processedWebhooks.has(webhookId)) {
    console.log(`Webhook ${webhookId} already processed — skipping`);
    return json({
      success: true,
      message: "Webhook already processed (idempotent)",
      webhookId,
    });
  }

  // Only process PAID and SETTLED status
  const status = payload.status?.toUpperCase();
  if (status !== "PAID" && status !== "SETTLED") {
    console.log(`Webhook ${webhookId} status=${status} — not processing`);
    return json({ success: true, message: `Status ${status} — no action needed` });
  }

  // Mark webhook as processed BEFORE triggering booking (prevent race condition)
  processedWebhooks.add(webhookId);

  // Extract booking ID from external_id (format: rania-{flightId}-{timestamp})
  const externalId = payload.external_id || "";

  // Trigger booking via worker-pilot
  if (env.WORKER_PILOT_URL) {
    try {
      const bookResponse = await fetch(`${env.WORKER_PILOT_URL}/api/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId,
          webhookId,
          paymentId: payload.id,
          paidAmount: payload.paid_amount,
          paidAt: payload.paid_at,
          paymentMethod: payload.payment_method,
          currency: payload.currency || "IDR",
        }),
      });

      if (!bookResponse.ok) {
        // Iron Rule #3: Booking error → VERIFY status (never auto-refund)
        console.error(`Booking trigger failed: ${bookResponse.status}`);
        return json({
          success: false,
          status: "VERIFY",
          message: "Payment received but booking failed. Admin review required.",
          webhookId,
        });
      }

      const bookResult = await bookResponse.json() as { bookingId?: string; pnr?: string };

      return json({
        success: true,
        bookingId: bookResult.bookingId,
        pnr: bookResult.pnr,
        webhookId,
        message: "Payment confirmed, booking initiated.",
      });
    } catch (error) {
      // Iron Rule #3: Error → VERIFY (never auto-refund)
      console.error("Failed to trigger booking:", error);
      return json({
        success: false,
        status: "VERIFY",
        message: "Payment received but booking failed. Admin review required.",
        webhookId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return json({
    success: true,
    webhookId,
    message: "Payment webhook received. Worker-pilot URL not configured.",
  });
}

// ─── Worker Export ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        status: "ok",
        worker: "rania-webhook",
        version: "2.1.0",
        processedCount: processedWebhooks.size,
        timestamp: new Date().toISOString(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/webhook/xendit") {
      try {
        return await handleXenditWebhook(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Webhook error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return json({ error: "Not Found" }, 404);
  },
};
