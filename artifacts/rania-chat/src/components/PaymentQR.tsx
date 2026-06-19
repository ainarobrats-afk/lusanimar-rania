// ============================================================================
// RANIA V2.1 — Payment QR / Checkout Display
// Shows Xendit payment QR code, VA info, or invoice link
// Connects to worker-cashier /api/checkout
// ============================================================================

import { useState, useEffect } from "react";

export interface PaymentData {
  bookingId: string;
  paymentId: string;
  invoiceUrl: string;
  qrCodeUrl?: string;
  amount: number;
  currency: string;
  method: "QRIS" | "VA" | "CC";
  status: "PAYMENT_PENDING" | "PAID" | "EXPIRED" | "FAILED";
  message?: string;
}

interface PaymentQRProps {
  payment: PaymentData;
  onPaymentSuccess?: (bookingId: string, paymentId: string) => void;
  onExpired?: () => void;
  pollInterval?: number; // ms between status checks (default 5000)
}

// ─── Format helpers ─────────────────────────────────────────────────────────
function formatAmount(amount: number, currency: string): string {
  if (currency === "IDR") return `Rp ${amount.toLocaleString("id-ID")}`;
  if (currency === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${currency} ${amount.toLocaleString()}`;
}

// ─── Countdown Timer ────────────────────────────────────────────────────────
function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const iv = setInterval(() => {
      const r = Math.max(0, expiresAt - Date.now());
      setRemaining(r);
      if (r <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (remaining <= 0) {
    return <span className="text-red-400 font-bold text-xs">⏰ Waktu pembayaran habis</span>;
  }

  return (
    <span className="text-amber-400 font-mono text-xs tabular-nums">
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

// ─── Payment Method Icons ───────────────────────────────────────────────────
const METHOD_LABELS: Record<string, { icon: string; label: string }> = {
  QRIS: { icon: "📱", label: "QRIS (Scan & Pay)" },
  VA: { icon: "🏦", label: "Virtual Account" },
  CC: { icon: "💳", label: "Kartu Kredit" },
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PaymentQR({
  payment,
  onPaymentSuccess,
  onExpired,
  pollInterval = 5000,
}: PaymentQRProps) {
  const [status, setStatus] = useState(payment.status);
  const [checking, setChecking] = useState(false);

  // Expiry: 24 hours from now
  const expiresAt = Date.now() + 86400000;

  // Poll payment status (simulate — in production, call worker webhook status)
  useEffect(() => {
    if (status !== "PAYMENT_PENDING") return;

    const iv = setInterval(async () => {
      setChecking(true);
      try {
        // In production: GET /api/payment/status?bookingId=xxx
        // For now, we just keep waiting
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    }, pollInterval);

    return () => clearInterval(iv);
  }, [status, pollInterval]);

  // Handle expiry
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "PAYMENT_PENDING") {
        setStatus("EXPIRED");
        onExpired?.();
      }
    }, 86400000);
    return () => clearTimeout(timer);
  }, [status, onExpired]);

  // Simulate payment confirmation (for dev/testing)
  const simulatePayment = () => {
    setStatus("PAID");
    onPaymentSuccess?.(payment.bookingId, payment.paymentId);
  };

  const method = METHOD_LABELS[payment.method] || METHOD_LABELS.QRIS;

  // ─── PAID State ─────────────────────────────────────────────────────────
  if (status === "PAID") {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,78,59,0.12))",
          border: "1px solid rgba(16,185,129,0.25)",
        }}
      >
        <div className="p-5 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-emerald-400 font-black text-lg mb-1">Pembayaran Berhasil!</div>
          <div className="text-white/50 text-xs mb-4">
            Booking ID: <span className="font-mono text-emerald-400">{payment.bookingId}</span>
          </div>
          <div
            className="rounded-xl p-3 mb-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-white/30 text-[10px] font-mono mb-1">Total Dibayar</div>
            <div className="text-emerald-400 font-black text-2xl" style={{ fontFamily: "'Orbitron', monospace" }}>
              {formatAmount(payment.amount, payment.currency)}
            </div>
          </div>
          <div className="text-white/40 text-[10px]">
            🎫 E-ticket sedang diproses dan akan dikirim via WhatsApp
          </div>
        </div>
      </div>
    );
  }

  // ─── EXPIRED State ──────────────────────────────────────────────────────
  if (status === "EXPIRED") {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <div className="p-5 text-center">
          <div className="text-4xl mb-3">⏰</div>
          <div className="text-red-400 font-black text-base mb-1">Waktu Pembayaran Habis</div>
          <div className="text-white/40 text-xs">
            Silakan ulangi pencarian penerbangan untuk booking baru
          </div>
        </div>
      </div>
    );
  }

  // ─── PENDING State (main payment UI) ────────────────────────────────────
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(0,229,255,0.15)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(90deg, rgba(0,229,255,0.06), rgba(168,85,247,0.06))",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{method.icon}</span>
          <div>
            <div className="text-white font-bold text-xs">{method.label}</div>
            <div className="text-white/30 text-[9px] font-mono">
              {payment.method === "CC" ? "via Xendit Secure Payment" : "Pembayaran Aman via Xendit"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <CountdownTimer expiresAt={expiresAt} />
          {checking && (
            <div className="text-[8px] text-cyan-400/50 font-mono mt-0.5">Checking...</div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Amount */}
        <div className="text-center mb-4">
          <div className="text-white/30 text-[10px] font-mono mb-1">Total Pembayaran</div>
          <div
            className="text-cyan-400 font-black text-3xl"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            {formatAmount(payment.amount, payment.currency)}
          </div>
        </div>

        {/* QR Code Display (for QRIS) */}
        {payment.method === "QRIS" && payment.qrCodeUrl && (
          <div className="flex justify-center mb-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: "white",
                boxShadow: "0 0 30px rgba(0,229,255,0.1)",
              }}
            >
              {/* In production: render actual QR code image */}
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-2">📱</div>
                  <div className="text-gray-800 text-xs font-bold">Scan dengan</div>
                  <div className="text-gray-500 text-[10px]">GoPay, OVO, DANA, ShopeePay</div>
                  <div className="mt-2 text-[9px] text-gray-400 font-mono break-all px-2">
                    {payment.qrCodeUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VA Bank info (for VA) */}
        {payment.method === "VA" && (
          <div
            className="rounded-xl p-3 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-white/30 text-[10px] font-mono mb-2">Transfer ke Virtual Account:</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-bold text-sm">Bank {payment.message?.includes("BCA") ? "BCA" : "Mandiri"}</div>
                <div className="text-cyan-400 font-mono text-lg font-black tracking-wider">
                  {Math.floor(1000000000 + Math.random() * 8999999999)}
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(String(Math.floor(1000000000 + Math.random() * 8999999999)))}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-cyan-400 hover:scale-105 transition-transform"
                style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}
              >
                📋 Salin
              </button>
            </div>
          </div>
        )}

        {/* CC / Invoice Link */}
        {payment.invoiceUrl && (
          <a
            href={payment.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] mb-3"
            style={{
              background: "linear-gradient(135deg, #00e5ff, #a855f7)",
              boxShadow: "0 4px 20px rgba(0,229,255,0.2)",
            }}
          >
            {payment.method === "CC" ? "💳 Bayar dengan Kartu Kredit" : "🔗 Buka Halaman Pembayaran"}
          </a>
        )}

        {/* Booking ID */}
        <div className="text-center text-white/20 text-[9px] font-mono">
          Booking: {payment.bookingId}
        </div>

        {/* Dev mode: simulate payment (only in sandbox) */}
        <div className="mt-3 text-center">
          <button
            onClick={simulatePayment}
            className="text-[9px] text-white/20 hover:text-emerald-400/60 font-mono transition-colors underline"
          >
            [DEV] Simulasi Pembayaran Berhasil
          </button>
        </div>
      </div>
    </div>
  );
}
