// ============================================================================
// RANIA V2.1 — Worker Pilot (Travelport Booking)
// POST /api/book — Book flight via Travelport API
//
// IRON RULE #2: NEVER edit airline PDF. Send 2 files: original + invoice
// IRON RULE #3: On error → status='VERIFY' (never auto-refund)
// ============================================================================

interface Env {
  TRAVELPORT_API_KEY: string;
  TRAVELPORT_SECRET: string;
  WORKER_ADMIN_URL: string;
  TICKETS: {
    put(key: string, value: ArrayBuffer | string, opts?: Record<string, unknown>): Promise<{ key: string }>;
    get(key: string): Promise<{ body: ReadableStream } | null>;
    delete(key: string): Promise<void>;
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ─── Booking Handler ─────────────────────────────────────────────────────────

interface BookRequest {
  externalId: string;
  webhookId: string;
  paymentId: string;
  paidAmount: number;
  paidAt: string;
  paymentMethod: string;
  currency: string;
}

async function handleBook(request: Request, env: Env): Promise<Response> {
  let body: BookRequest;
  try {
    body = await request.json() as BookRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.paymentId || !body.paidAmount) {
    return json({ error: "Missing required fields: paymentId, paidAmount" }, 400);
  }

  const bookingId = `bk-${Date.now().toString(36)}`;

  try {
    // MOCK booking — in production, call Travelport uAPI
    const pnr = `RANIA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create mock e-ticket PDF (from "airline" — never edited by RANIA)
    const eticketContent = `MOCK E-TICKET\nBooking: ${bookingId}\nPNR: ${pnr}\nAmount: ${body.currency} ${body.paidAmount}\nDate: ${new Date().toISOString()}\n\nIRON RULE #2: This is the original airline e-ticket. RANIA NEVER edits this PDF.`;

    // Create mock RANIA invoice (separate document)
    const invoiceContent = `RANIA INVOICE\nBooking ID: ${bookingId}\nPNR: ${pnr}\nAmount: ${body.currency} ${body.paidAmount}\nDate: ${new Date().toISOString()}\n\nIRON RULE #2: Separate RANIA invoice. Never merged with airline e-ticket.`;

    // Store in R2
    try {
      await env.TICKETS.put(`tickets/${bookingId}/e-ticket.pdf`, eticketContent, {
        httpMetadata: { contentType: "application/pdf" },
      });
      await env.TICKETS.put(`tickets/${bookingId}/invoice.pdf`, invoiceContent, {
        httpMetadata: { contentType: "application/pdf" },
      });
    } catch (r2Err) {
      console.warn("R2 upload skipped (bucket may not exist yet):", r2Err);
    }

    // Send WhatsApp notification via Wablas (mock)
    console.log(`[WABLAS] Booking confirmed: ${bookingId}, PNR: ${pnr}`);

    return json({
      success: true,
      bookingId,
      pnr,
      eTicketUrl: `tickets/${bookingId}/e-ticket.pdf`,
      invoiceUrl: `tickets/${bookingId}/invoice.pdf`,
      status: "BOOKED",
      message: `Booking berhasil! PNR: ${pnr}. E-ticket dan invoice telah dikirim.`,
    });
  } catch (error) {
    // IRON RULE #3: On error → VERIFY (never auto-refund)
    const msg = error instanceof Error ? error.message : "Booking failed";
    console.error("Booking error:", msg);

    // Alert admin
    if (env.WORKER_ADMIN_URL) {
      try {
        await fetch(`${env.WORKER_ADMIN_URL}/api/admin/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            action: "VERIFY",
            reason: `Booking failed: ${msg}`,
            status: "VERIFY",
          }),
        });
      } catch (alertErr) {
        console.error("Failed to alert admin:", alertErr);
      }
    }

    return json({
      success: false,
      bookingId,
      status: "VERIFY",
      error: msg,
      message: "Pembayaran diterima tapi booking gagal. Tim admin akan memeriksa dalam 5 menit.",
    }, 500);
  }
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
        worker: "rania-pilot",
        version: "2.1.0",
        travelportConfigured: !!env.TRAVELPORT_API_KEY,
        r2Configured: !!env.TICKETS,
        timestamp: new Date().toISOString(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/book") {
      try {
        return await handleBook(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Book handler error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return json({ error: "Not Found" }, 404);
  },
};
