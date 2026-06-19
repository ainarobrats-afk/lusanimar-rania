// ============================================================================
// RANIA V2.1 — Worker Cashier (Xendit Payment)
// POST /api/checkout — Create Xendit payment invoice
//
// IRON RULE #1: NEVER store credit card numbers or CVV
// Use Xendit hosted payment page ONLY
// ============================================================================

interface Env {
  XENDIT_API_KEY: string;
  XENDIT_WEBHOOK_VERIFICATION_TOKEN: string;
  XENDIT_MODE: string; // "sandbox" | "production"
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

// ─── Xendit API ──────────────────────────────────────────────────────────────

const XENDIT_BASE = "https://api.xendit.co";

interface CheckoutRequest {
  flightId: string;
  passengerName: string;
  passportNumber: string;
  email: string;
  phone: string;
  paymentMethod: "QRIS" | "VA" | "CC";
  amount: number;
  currency: string;
}

/**
 * Create Xendit Invoice — the hosted payment page.
 * Supports QRIS, Virtual Account, and Credit Card.
 * IRON RULE #1: We NEVER see the card details — Xendit handles it.
 */
async function createXenditInvoice(
  params: CheckoutRequest,
  apiKey: string,
  mode: string
): Promise<{
  id: string;
  invoiceUrl: string;
  qrCodeUrl?: string;
  status: string;
} | null> {
  const isSandbox = mode === "sandbox" || !apiKey;

  if (isSandbox) {
    // Mock invoice for development
    const mockId = `xnd-mock-${Date.now().toString(36)}`;
    return {
      id: mockId,
      invoiceUrl: `https://checkout-staging.xendit.co/web/${mockId}`,
      qrCodeUrl: `https://sandbox.xendit.co/qr/${mockId}`,
      status: "PENDING",
    };
  }

  // Real Xendit API call
  try {
    const response = await fetch(`${XENDIT_BASE}/v2/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(apiKey + ":")}`,
      },
      body: JSON.stringify({
        external_id: `rania-${params.flightId}-${Date.now()}`,
        amount: params.amount,
        payer_email: params.email,
        description: `Pembayaran tiket pesawat — ${params.passengerName}`,
        currency: params.currency || "IDR",
        invoice_duration: 86400, // 24 hours
        success_redirect_url: "https://rania-lusanimar.pages.dev/booking/success",
        failure_redirect_url: "https://rania-lusanimar.pages.dev/booking/failed",
        payment_methods: getPaymentMethods(params.paymentMethod),
        customer: {
          given_names: params.passengerName,
          email: params.email,
          mobile_number: params.phone,
        },
        items: [{
          name: `Tiket Pesawat (${params.flightId})`,
          quantity: 1,
          price: params.amount,
          category: "travel",
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Xendit error: ${response.status} — ${err}`);
      return null;
    }

    const data = await response.json() as {
      id: string;
      invoice_url: string;
      qr_code?: string;
      status: string;
    };

    return {
      id: data.id,
      invoiceUrl: data.invoice_url,
      qrCodeUrl: data.qr_code,
      status: data.status,
    };
  } catch (error) {
    console.error("Xendit create invoice error:", error);
    return null;
  }
}

function getPaymentMethods(method: string): string[] {
  switch (method) {
    case "QRIS": return ["QRIS"];
    case "VA": return ["BCA", "BNI", "BRI", "MANDIRI", "PERMATA"];
    case "CC": return ["CREDIT_CARD"];
    default: return ["QRIS", "BCA", "BNI", "BRI"];
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

async function handleCheckout(request: Request, env: Env): Promise<Response> {
  let body: CheckoutRequest;
  try {
    body = await request.json() as CheckoutRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.flightId || !body.passengerName || !body.email || !body.paymentMethod) {
    return json({ error: "Missing required fields: flightId, passengerName, email, paymentMethod" }, 400);
  }

  // IRON RULE #1: Block any attempt to send card data
  const bodyStr = JSON.stringify(body);
  if (/\b(?:\d[ -]*?){13,19}\b/.test(bodyStr) && body.paymentMethod === "CC") {
    return json({
      error: "BLOCKED: Card numbers must NEVER be sent to our API. Use Xendit hosted payment page.",
      ironRule: "NO_CREDIT_CARD_STORAGE",
    }, 403);
  }

  // Default amount for mock (will come from real flight data in production)
  const amount = body.amount || 2500000; // IDR 2.500.000
  const currency = body.currency || "IDR";

  const invoice = await createXenditInvoice(
    { ...body, amount, currency },
    env.XENDIT_API_KEY || "",
    env.XENDIT_MODE || "sandbox"
  );

  if (!invoice) {
    return json({
      error: "Failed to create payment invoice. Please try again.",
    }, 500);
  }

  return json({
    success: true,
    bookingId: `bk-${Date.now().toString(36)}`,
    paymentId: invoice.id,
    invoiceUrl: invoice.invoiceUrl,
    qrCodeUrl: invoice.qrCodeUrl,
    amount,
    currency,
    method: body.paymentMethod,
    status: "PAYMENT_PENDING",
    message: `Silakan lakukan pembayaran ${body.paymentMethod} sebesar ${currency} ${amount.toLocaleString()}. Link pembayaran: ${invoice.invoiceUrl}`,
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
        worker: "rania-cashier",
        version: "2.1.0",
        mode: env.XENDIT_MODE || "sandbox",
        xenditConfigured: !!env.XENDIT_API_KEY,
        timestamp: new Date().toISOString(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/checkout") {
      try {
        return await handleCheckout(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Checkout error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return json({ error: "Not Found" }, 404);
  },
};
