import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";

const API = "/api";

interface MemberPayment {
  paxIndex: number;
  name: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

interface GroupBookingData {
  bookingId: string;
  status: "confirmed" | "payment_pending";
  groupSize: number;
  splitPayment: boolean;
  perPersonAmount: number;
  totalPrice: number;
  currency: string;
  paidCount: number;
  allPaid: boolean;
  memberPayments: MemberPayment[];
  booking: {
    from: string;
    to: string;
    fromName: string;
    toName: string;
    date: string;
    airline: string;
    flightNum: string;
    flightClass: string;
    leaderName: string;
    leaderWhatsapp: string;
  };
}

export default function GroupPaymentTracker() {
  const [, params] = useRoute("/group-payment/:bookingId");
  const bookingId = params?.bookingId || "";

  const searchParams = new URLSearchParams(window.location.search);
  const paxParam = searchParams.get("pax");
  const tokenParam = searchParams.get("token");
  const isLeader = paxParam === null;
  const paxIdx = paxParam !== null ? Number(paxParam) : -1;

  const [data, setData] = useState<GroupBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [memberVerified, setMemberVerified] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [copyStates, setCopyStates] = useState<Record<number, boolean>>({});
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`${API}/rania/group-booking/${bookingId}`);
      if (!res.ok) throw new Error("Booking not found");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyMemberToken = async () => {
    if (!bookingId || paxIdx < 0 || !tokenParam) return;
    try {
      const res = await fetch(`${API}/rania/group-booking/${bookingId}/verify-token/${paxIdx}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenParam }),
      });
      if (!res.ok) {
        setError("Link pembayaran tidak valid atau sudah kadaluarsa.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setMemberVerified(true);
      setMemberData(json);
      if (json.member?.paid) setConfirmed(true);
    } catch {
      setError("Gagal memverifikasi link.");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!bookingId || paxIdx < 0) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API}/rania/group-booking/${bookingId}/confirm-payment/${paxIdx}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Konfirmasi gagal");
      setConfirmed(true);
      fetchBooking();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConfirming(false);
    }
  };

  const copyPaymentLink = async (idx: number, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStates(prev => ({ ...prev, [idx]: true }));
      setTimeout(() => setCopyStates(prev => ({ ...prev, [idx]: false })), 2000);
    } catch {}
  };

  const shareViaWhatsApp = async (idx: number) => {
    if (!bookingId) return;
    try {
      const res = await fetch(`${API}/rania/group-booking/${bookingId}/payment-link/${idx}`);
      if (!res.ok) return;
      const json = await res.json();
      window.open(json.waLink, "_blank");
    } catch {}
  };

  useEffect(() => {
    if (!isLeader && tokenParam) {
      verifyMemberToken();
    } else {
      fetchBooking();
    }
    const interval = setInterval(fetchBooking, 10000);
    setPollingInterval(interval);
    return () => clearInterval(interval);
  }, [bookingId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#010d1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
          <div style={{ color: "#00e5ff", fontSize: 18, fontWeight: 600 }}>Loading...</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>Memuat data booking grup</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#010d1e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <div style={{ color: "#ef4444", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Booking Tidak Ditemukan</div>
          <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>{error}</div>
          <a href="/" style={{ color: "#00e5ff", textDecoration: "none", fontSize: 14 }}>← Kembali ke RANIA</a>
        </div>
      </div>
    );
  }

  const booking = data?.booking;
  const paidCount = data?.paidCount || 0;
  const groupSize = data?.groupSize || 0;
  const progress = groupSize > 0 ? (paidCount / groupSize) * 100 : 0;

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: "100vh", background: "#010d1e", color: "#e2e8f0", fontFamily: "Arial, sans-serif" },
    header: { background: "linear-gradient(135deg, #0a1628, #0d1f3c)", borderBottom: "1px solid #1a2540", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 },
    logo: { fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg, #00e5ff, #9b59ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    page: { maxWidth: 680, margin: "0 auto", padding: "24px 16px" },
    card: { background: "#0a1628", border: "1px solid #1a2540", borderRadius: 16, padding: 20, marginBottom: 16 },
    label: { color: "#64748b", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 },
    value: { color: "#ffffff", fontWeight: 700, fontSize: 16 },
    progressBar: { background: "#1a2540", borderRadius: 100, height: 10, overflow: "hidden", marginTop: 8 },
    progressFill: { height: "100%", borderRadius: 100, background: "linear-gradient(90deg, #10b981, #00e5ff)", transition: "width 0.6s ease", width: `${progress}%` },
  };

  const badge = (paid: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: paid ? "#064e3b" : "#1a1a2e",
    color: paid ? "#10b981" : "#f59e0b",
    border: `1px solid ${paid ? "#065f46" : "#374151"}`,
  });

  const btn = (variant: "primary" | "success" | "outline"): React.CSSProperties => ({
    padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14,
    cursor: "pointer", transition: "all 0.2s",
    background: variant === "primary" ? "linear-gradient(135deg, #00e5ff, #0099dd)"
      : variant === "success" ? "linear-gradient(135deg, #10b981, #059669)"
      : "transparent",
    color: variant === "outline" ? "#64748b" : "#000",
    border: variant === "outline" ? "1px solid #1a2540" : "none",
  });

  // ── MEMBER VIEW (payment confirmation page) ─────────────────────────────────
  if (!isLeader && memberVerified && memberData) {
    const member = memberData.member;
    const bk = memberData.booking;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.logo}>✈ SANIMAR TRAVEL</div>
            <div style={{ color: "#64748b", fontSize: 11 }}>RANIA GROUP PAYMENT</div>
          </div>
        </div>
        <div style={styles.page}>
          {confirmed || member.paid ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981", marginBottom: 8 }}>Pembayaran Dikonfirmasi!</div>
              <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Terima kasih {member.name}, pembayaranmu sudah tercatat.</div>
              <div style={{ ...styles.card, textAlign: "left" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><div style={styles.label}>Rute</div><div style={{ ...styles.value, fontSize: 20 }}>{bk.from} → {bk.to}</div></div>
                  <div><div style={styles.label}>Tanggal</div><div style={styles.value}>{bk.date}</div></div>
                  <div><div style={styles.label}>Maskapai</div><div style={styles.value}>{bk.airline}</div></div>
                  <div><div style={styles.label}>Jumlah</div><div style={{ ...styles.value, color: "#10b981" }}>${member.amount}</div></div>
                </div>
              </div>
              <a href="/" style={{ color: "#00e5ff", textDecoration: "none", fontSize: 14 }}>✈ Kembali ke RANIA</a>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Halo, {member.name}!</div>
                <div style={{ color: "#94a3b8", fontSize: 14 }}>Konfirmasi pembayaran tiket grup kamu</div>
              </div>
              <div style={styles.card}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={styles.label}>Rute Penerbangan</div>
                    <div style={{ color: "#00e5ff", fontSize: 22, fontWeight: 900 }}>{bk.from} → {bk.to}</div>
                  </div>
                  <div>
                    <div style={styles.label}>Tanggal</div>
                    <div style={styles.value}>{bk.date}</div>
                  </div>
                  <div>
                    <div style={styles.label}>Maskapai</div>
                    <div style={styles.value}>{bk.airline} {bk.flightNum}</div>
                  </div>
                  <div>
                    <div style={styles.label}>Pemimpin Grup</div>
                    <div style={styles.value}>{bk.leaderName}</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #1a2540", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={styles.label}>Tagihan Kamu</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#00e5ff" }}>${member.amount}</div>
                  </div>
                  <div style={badge(false)}>⏳ Menunggu Konfirmasi</div>
                </div>
              </div>
              <div style={{ ...styles.card, textAlign: "center", background: "linear-gradient(135deg, #064e3b22, #01200f33)", borderColor: "#065f46" }}>
                <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
                  Klik tombol di bawah setelah kamu sudah membayar ke pemimpin grup.<br />
                  Ini hanya konfirmasi — bukan pembayaran online.
                </div>
                <button
                  onClick={confirmPayment}
                  disabled={confirming}
                  style={{ ...btn("success"), width: "100%", fontSize: 16, padding: "14px 24px" }}
                >
                  {confirming ? "⏳ Mengkonfirmasi..." : "✅ Saya Sudah Bayar!"}
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <div style={{ color: "#475569", fontSize: 12 }}>Ada pertanyaan? Hubungi pemimpin grup via WhatsApp</div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── LEADER / PUBLIC VIEW (full dashboard) ──────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          <div style={styles.logo}>✈ SANIMAR TRAVEL</div>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 2 }}>GRUP PAYMENT DASHBOARD</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#64748b", fontSize: 11 }}>Booking ID</div>
          <div style={{ color: "#00e5ff", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{bookingId}</div>
        </div>
      </div>

      <div style={styles.page}>
        {/* Status Banner */}
        {data?.allPaid ? (
          <div style={{ background: "#064e3b", border: "1px solid #065f46", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <div style={{ color: "#10b981", fontWeight: 800, fontSize: 16 }}>Semua Pembayaran Lunas!</div>
              <div style={{ color: "#6ee7b7", fontSize: 13 }}>Booking grup siap berangkat. E-ticket akan dikirim ke email ketua.</div>
            </div>
          </div>
        ) : (
          <div style={{ background: "#1a1a2e", border: "1px solid #374151", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⏳</span>
            <div>
              <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16 }}>Menunggu Konfirmasi Pembayaran</div>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>{paidCount} dari {groupSize} anggota sudah konfirmasi · Halaman ini auto-refresh setiap 10 detik</div>
            </div>
          </div>
        )}

        {/* Flight Info Card */}
        <div style={styles.card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={styles.label}>Rute</div>
              <div style={{ color: "#00e5ff", fontSize: 24, fontWeight: 900 }}>{booking?.from} → {booking?.to}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{booking?.fromName} → {booking?.toName}</div>
            </div>
            <div>
              <div style={styles.label}>Tanggal</div>
              <div style={styles.value}>{booking?.date}</div>
            </div>
            <div>
              <div style={styles.label}>Maskapai</div>
              <div style={styles.value}>{booking?.airline} {booking?.flightNum}</div>
            </div>
            <div>
              <div style={styles.label}>Kelas</div>
              <div style={styles.value}>{booking?.flightClass}</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1a2540", paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={styles.label}>Total Grup</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>${data?.totalPrice} {data?.currency}</div>
            </div>
            <div>
              <div style={styles.label}>Per Orang</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#00e5ff" }}>${data?.perPersonAmount}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>Status Pembayaran</div>
            <div style={{ color: "#00e5ff", fontWeight: 800 }}>{paidCount}/{groupSize} Lunas</div>
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#64748b" }}>
            <span>0%</span>
            <span>{Math.round(progress)}% terbayar</span>
            <span>100%</span>
          </div>
        </div>

        {/* Member List */}
        <div style={styles.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>👥 Daftar Anggota Grup</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data?.memberPayments.map((member, i) => (
              <div key={i} style={{ background: "#071022", border: `1px solid ${member.paid ? "#065f46" : "#1a2540"}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: member.paid ? 0 : 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{i + 1}. {member.name}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      ${member.amount} {data.currency}
                      {member.paid && member.paidAt && ` · Konfirmasi: ${new Date(member.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                    </div>
                  </div>
                  <div style={badge(member.paid)}>
                    {member.paid ? "✓ Lunas" : "⏳ Pending"}
                  </div>
                </div>
                {!member.paid && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => shareViaWhatsApp(i)}
                      style={{ ...btn("primary"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, padding: "8px 12px" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      Kirim via WA
                    </button>
                    <button
                      onClick={async () => {
                        const res = await fetch(`${API}/rania/group-booking/${bookingId}/payment-link/${i}`);
                        const json = await res.json();
                        copyPaymentLink(i, json.paymentUrl);
                      }}
                      style={{ ...btn("outline"), flex: 1, fontSize: 13, padding: "8px 12px", color: "#94a3b8", border: "1px solid #1a2540" }}
                    >
                      {copyStates[i] ? "✓ Tersalin!" : "📋 Salin Link"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={fetchBooking}
            style={{ ...btn("outline"), flex: 1, color: "#00e5ff", border: "1px solid #00e5ff33" }}
          >
            🔄 Refresh Status
          </button>
          <a
            href="/"
            style={{ ...btn("outline"), flex: 1, textAlign: "center", textDecoration: "none", color: "#94a3b8", border: "1px solid #1a2540", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✈ Kembali ke RANIA
          </a>
        </div>

        <div style={{ textAlign: "center", color: "#475569", fontSize: 12 }}>
          <div>SANIMAR TRAVEL · Powered by RANIA AI · Dili, Timor-Leste 🇹🇱</div>
          <div style={{ marginTop: 4 }}>WhatsApp: <a href={`https://wa.me/${booking?.leaderWhatsapp?.replace(/[^0-9]/g, "")}`} style={{ color: "#00e5ff" }}>{booking?.leaderWhatsapp}</a></div>
        </div>
      </div>
    </div>
  );
}
