// ============================================================================
// RANIA V2.1 — Worker Admin (Emergency Verify)
// POST /api/admin/verify — Admin verification for failed bookings
//
// When any worker sets status='VERIFY', admin gets 5 minutes to review.
// Actions: APPROVE (continue), REJECT (cancel), REFUND (manual refund)
//
// IRON RULE #3: Refund ONLY triggered by admin, never automatically.
// ============================================================================

interface Env {
  XENDIT_API_KEY: string;
  WORKER_PILOT_URL: string;
  WORKER_CASHIER_URL: string;
  WABLAS_API_KEY: string;
  WABLAS_SECRET: string;
  ADMIN_WHATSAPP: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ─── Verify Handler ──────────────────────────────────────────────────────────

interface VerifyRequest {
  bookingId: string;
  action: "APPROVE" | "REJECT" | "REFUND";
  adminId: string;
  reason?: string;
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  let body: VerifyRequest;
  try {
    body = await request.json() as VerifyRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { bookingId, action, adminId, reason } = body;

  if (!bookingId || !action || !adminId) {
    return json({ error: "Missing required fields: bookingId, action, adminId" }, 400);
  }

  if (!["APPROVE", "REJECT", "REFUND"].includes(action)) {
    return json({ error: "Invalid action. Must be: APPROVE, REJECT, or REFUND" }, 400);
  }

  // IRON RULE #3: REFUND can ONLY be triggered by admin
  if (action === "REFUND" && adminId !== "admin") {
    return json({
      error: "BLOCKED: Only admin can trigger refunds. Iron Rule #3.",
      ironRule: "NO_AUTO_REFUND",
    }, 403);
  }

  const timestamp = new Date().toISOString();

  switch (action) {
    case "APPROVE": {
      // Continue booking — re-trigger pilot
      if (env.WORKER_PILOT_URL) {
        try {
          await fetch(`${env.WORKER_PILOT_URL}/api/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              externalId: `retry-${bookingId}`,
              webhookId: `admin-approve-${bookingId}`,
              paymentId: bookingId,
              paidAmount: 0, // Will be fetched from database in production
              paymentMethod: "QRIS",
              currency: "IDR",
            }),
          });
        } catch (error) {
          console.error("Re-trigger booking failed:", error);
        }
      }

      // Send WhatsApp notification
      await sendWhatsApp(env, `✅ Booking ${bookingId} di-APPROVE oleh admin ${adminId}. Booking dilanjutkan.`);

      return json({
        success: true,
        bookingId,
        previousStatus: "VERIFY",
        newStatus: "BOOKING",
        action: "APPROVE",
        timestamp,
      });
    }

    case "REJECT": {
      await sendWhatsApp(env, `❌ Booking ${bookingId} di-REJECT oleh admin ${adminId}. Alasan: ${reason || "Tidak diberikan"}`);

      return json({
        success: true,
        bookingId,
        previousStatus: "VERIFY",
        newStatus: "CANCELLED",
        action: "REJECT",
        reason: reason || "Rejected by admin",
        timestamp,
      });
    }

    case "REFUND": {
      // Manual refund via Xendit
      if (env.XENDIT_API_KEY) {
        try {
          // In production: call Xendit refund API
          console.log(`[XENDIT REFUND] Initiated for booking ${bookingId} by admin ${adminId}`);
        } catch (error) {
          console.error("Refund failed:", error);
        }
      }

      await sendWhatsApp(env, `💰 REFUND initiated untuk booking ${bookingId} oleh admin ${adminId}. Alasan: ${reason || "Tidak diberikan"}`);

      return json({
        success: true,
        bookingId,
        previousStatus: "VERIFY",
        newStatus: "REFUNDED",
        action: "REFUND",
        reason: reason || "Refunded by admin",
        timestamp,
      });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
}

// ─── WhatsApp Notification (Wablas) ──────────────────────────────────────────

async function sendWhatsApp(env: Env, message: string): Promise<void> {
  if (!env.WABLAS_API_KEY || !env.ADMIN_WHATSAPP) {
    console.log(`[WABLAS SKIP] ${message}`);
    return;
  }

  try {
    await fetch("https://solo.wablas.com/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": env.WABLAS_API_KEY,
      },
      body: JSON.stringify({
        phone: env.ADMIN_WHATSAPP,
        message: `[RANIA ADMIN] ${message}`,
      }),
    });
  } catch (error) {
    console.error("WhatsApp send failed:", error);
  }
}

// ─── Incoming VERIFY Alert (from other workers) ─────────────────────────────

async function handleVerifyAlert(request: Request, env: Env): Promise<Response> {
  let body: { bookingId?: string; reason?: string; status?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.status === "VERIFY" || body.bookingId) {
    // Send admin alert via WhatsApp
    await sendWhatsApp(env, `⚠️ VERIFY ALERT: Booking ${body.bookingId} — ${body.reason || "Unknown error"}. Admin perlu review dalam 5 menit.`);
  }

  return json({
    success: true,
    message: "Verify alert received. Admin notified.",
    bookingId: body.bookingId,
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
        worker: "rania-admin",
        version: "2.1.0",
        wablasConfigured: !!env.WABLAS_API_KEY,
        adminPhone: env.ADMIN_WHATSAPP ? env.ADMIN_WHATSAPP.substring(0, 5) + "..." : "not set",
        timestamp: new Date().toISOString(),
      });
    }

    // Admin action endpoint
    if (request.method === "POST" && url.pathname === "/api/admin/verify") {
      try {
        return await handleVerify(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Verify error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    // Incoming verify alert from other workers
    if (request.method === "POST" && url.pathname === "/api/admin/alert") {
      try {
        return await handleVerifyAlert(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Alert error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return json({ error: "Not Found" }, 404);
  },
};
