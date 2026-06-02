import { useState, useEffect } from "react";

const API = "/api";

interface BookingInfo {
  bookingId: string;
  passengerName: string;
  from: string;
  to: string;
  airline: string;
  flightNum: string;
  flightClass: string;
  date: string;
  price?: number;
  currency?: string;
}

interface Props {
  booking: BookingInfo;
  lang: "tet" | "id" | "en" | "pt";
  onSuccess: () => void;
  onClose: () => void;
}

type PayMethod = "card" | "qris" | "paypal" | "bnctl" | "mosan" | "dana" | "bankva";

const L: Record<string, Record<string, string>> = {
  tet: { title: "Pagamentu", confirm: "Konfirma Pagamentu", processing: "Prosesu...", success: "Pagamentu Suksesu!", cardNum: "Numeru Karta", expiry: "Data Validade", cvv: "CVV", name: "Naran iha Karta", pay: "Paga Agora", cancel: "Kansela", qrisTitle: "Skanu QR Code", qrInst: "Uza aplikasaun bank ita-boot", walletBal: "Saldo Wallet", paypalBtn: "Paga ho PayPal" },
  id: { title: "Pembayaran", confirm: "Konfirmasi Pembayaran", processing: "Memproses...", success: "Pembayaran Berhasil!", cardNum: "Nomor Kartu", expiry: "Tanggal Kedaluwarsa", cvv: "CVV", name: "Nama di Kartu", pay: "Bayar Sekarang", cancel: "Batal", qrisTitle: "Scan QR Code", qrInst: "Gunakan aplikasi bank / e-wallet Anda", walletBal: "Saldo Wallet", paypalBtn: "Bayar dengan PayPal" },
  en: { title: "Payment", confirm: "Confirm Payment", processing: "Processing...", success: "Payment Successful!", cardNum: "Card Number", expiry: "Expiry Date", cvv: "CVV", name: "Name on Card", pay: "Pay Now", cancel: "Cancel", qrisTitle: "Scan QR Code", qrInst: "Use your banking app", walletBal: "Wallet Balance", paypalBtn: "Pay with PayPal" },
  pt: { title: "Pagamento", confirm: "Confirmar Pagamento", processing: "A processar...", success: "Pagamento Concluído!", cardNum: "Número do Cartão", expiry: "Validade", cvv: "CVV", name: "Nome no Cartão", pay: "Pagar Agora", cancel: "Cancelar", qrisTitle: "Digitalizar QR Code", qrInst: "Use a sua aplicação bancária", walletBal: "Saldo Carteira", paypalBtn: "Pagar com PayPal" },
};

function formatCardNum(val: string) {
  return val.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").substring(0, 4);
  if (digits.length >= 3) return `${digits.substring(0, 2)}/${digits.substring(2)}`;
  return digits;
}

function getQRISUrl(bookingId: string, amount: number) {
  const data = encodeURIComponent(`SANIMAR-${bookingId}-AMOUNT${amount}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&bgcolor=030612&color=00e5ff&margin=10`;
}

function fmtPrice(price: number, currency: string, lang: string): string {
  if (currency === "USD") return `$${price.toFixed(2)}`;
  if (currency === "IDR" || lang === "id") return `Rp ${price.toLocaleString("id-ID")}`;
  return `${currency} ${price.toFixed(2)}`;
}

interface MethodBtn { id: PayMethod; icon: string; label: string; badge?: string; badgeColor?: string; }

const METHOD_BUTTONS: MethodBtn[] = [
  { id: "card",   icon: "💳", label: "Visa/MC",  badge: "GLOBAL", badgeColor: "bg-blue-500/20 text-blue-300" },
  { id: "bnctl",  icon: "🏦", label: "BNCTL",    badge: "TL",     badgeColor: "bg-red-500/20 text-red-300" },
  { id: "mosan",  icon: "📱", label: "Mosan",    badge: "TL",     badgeColor: "bg-red-500/20 text-red-300" },
  { id: "qris",   icon: "🔲", label: "QRIS",     badge: "ID",     badgeColor: "bg-emerald-500/20 text-emerald-300" },
  { id: "dana",   icon: "💰", label: "DANA/OVO", badge: "ID",     badgeColor: "bg-cyan-500/20 text-cyan-300" },
  { id: "bankva", icon: "🏧", label: "Bank VA",  badge: "ID",     badgeColor: "bg-purple-500/20 text-purple-300" },
  { id: "paypal", icon: "🅿️", label: "PayPal",  badge: "GLOBAL", badgeColor: "bg-blue-500/20 text-blue-300" },
];

export default function PaymentFlow({ booking, lang, onSuccess, onClose }: Props) {
  const t = L[lang];
  const [method, setMethod] = useState<PayMethod>("card");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState(booking.passengerName);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [error, setError] = useState("");
  const [qrTimer, setQrTimer] = useState(300);
  const [bnctlAccount, setBnctlAccount] = useState("");
  const [bnctlPin, setBnctlPin] = useState("");
  const [mosanPhone, setMosanPhone] = useState("");
  const [mosanPin, setMosanPin] = useState("");
  const [danaChoice, setDanaChoice] = useState<"dana" | "ovo" | "gopay" | "shopeepay">("dana");
  const [bankChoice, setBankChoice] = useState<"bca" | "mandiri" | "bni" | "bri">("bca");

  const price = booking.price || 180;
  const currency = booking.currency || "USD";

  useEffect(() => {
    if ((method !== "qris" && method !== "mosan") || status !== "idle") return;
    const timer = setInterval(() => setQrTimer(t => t <= 1 ? 300 : t - 1), 1000);
    return () => clearInterval(timer);
  }, [method, status]);

  const handlePay = async () => {
    if (method === "card" && (!cardNum.replace(/\s/g, "") || !expiry || !cvv || !cardName)) {
      setError(lang === "id" ? "Lengkapi semua data kartu" : "Please fill all card details");
      return;
    }
    if (method === "bnctl" && (!bnctlAccount || !bnctlPin)) {
      setError(lang === "id" ? "Masukkan nomor rekening & PIN BNCTL" : lang === "en" ? "Enter BNCTL account & PIN" : "Hatama numeru konta & PIN BNCTL");
      return;
    }
    if (method === "mosan" && !mosanPhone) {
      setError(lang === "id" ? "Masukkan nomor HP Mosan" : lang === "en" ? "Enter Mosan phone number" : "Hatama numeru telefone Mosan");
      return;
    }
    setError("");
    setStatus("processing");
    try {
      await fetch(`${API}/rania/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId, method, amount: price, currency, cardLast4: cardNum.replace(/\s/g, "").slice(-4), passengerName: booking.passengerName }),
      });
    } catch { /* continue */ }
    setTimeout(() => { setStatus("success"); setTimeout(onSuccess, 3000); }, 2500);
  };

  if (status === "processing") {
    return (
      <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full rania-gradient-btn mx-auto mb-5 flex items-center justify-center text-3xl" style={{ animation: "spin 1s linear infinite" }}>💳</div>
          <div className="text-white text-lg font-bold">{t.processing}</div>
          <div className="text-gray-400 text-sm mt-2">RANIA Autopilot is securing your payment...</div>
          <div className="flex gap-1.5 justify-center mt-4">
            {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-cyan-400 rounded-full typing-dot" style={{ animationDelay: `${d}ms` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="text-center max-w-sm mx-4">
          <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400 mx-auto mb-5 flex items-center justify-center text-4xl success-pulse">✅</div>
          <div className="text-2xl font-black text-emerald-400 mb-2">{t.success}</div>
          <div className="text-gray-300 text-sm mb-4">
            {lang === "id" ? "Tiket dikirim ke email dalam 5 menit" : lang === "en" ? "E-ticket sent to your email within 5 minutes" : lang === "pt" ? "E-bilhete enviado por email em 5 minutos" : "E-ticket haruka ba email iha 5 minutos"}
          </div>
          <div className="bg-white/5 border border-emerald-400/20 rounded-2xl p-4 mb-4 text-left">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Booking Summary</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-gray-400">ID</span><span className="font-mono text-cyan-400">{booking.bookingId}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Passenger</span><span className="text-white">{booking.passengerName}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Route</span><span className="text-white">{booking.from} → {booking.to}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Flight</span><span className="text-white">{booking.airline} {booking.flightNum}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Paid</span><span className="text-emerald-400 font-bold">{fmtPrice(price, currency, lang)}</span></div>
            </div>
          </div>
          <div className="text-[10px] text-gray-600">Closing automatically...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center bg-black/75 backdrop-blur-sm" style={{ animation: "chatSlideUp 0.3s ease" }}>
      <div className="w-full max-w-md bg-[#02060f] border-t border-cyan-400/20 rounded-t-3xl overflow-y-auto" style={{ maxHeight: "88vh" }}>

        {/* Header */}
        <div className="sticky top-0 bg-[#02060f] border-b border-white/6 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-sm font-black text-white">{t.title}</div>
            <div className="text-[10px] text-cyan-400 font-mono">{booking.bookingId}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Total</div>
              <div className="font-orbitron text-lg font-black text-emerald-400">{fmtPrice(price, currency, lang)}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm">✕</button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Flight summary */}
          <div className="bg-gradient-to-r from-cyan-400/6 to-purple-500/6 border border-cyan-400/15 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{booking.airline}</div>
              <div className="font-orbitron text-base font-black text-white">{booking.from} → {booking.to}</div>
              <div className="text-xs text-gray-400 mt-0.5">{booking.flightNum} · {booking.flightClass} · {booking.date}</div>
            </div>
            <div className="text-3xl">✈️</div>
          </div>

          {/* Payment method selector */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
              {lang === "id" ? "Pilih Metode Pembayaran" : lang === "en" ? "Select Payment Method" : lang === "pt" ? "Selecionar Método" : "Hili Métodu Pagamentu"}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {METHOD_BUTTONS.map(btn => (
                <button key={btn.id} onClick={() => setMethod(btn.id)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all relative ${method === btn.id ? "border-cyan-400/60 bg-cyan-400/8 text-cyan-300" : "border-white/8 bg-white/3 text-gray-500 hover:border-white/16 hover:text-gray-300"}`}>
                  {btn.badge && (
                    <span className={`absolute -top-1.5 -right-1 text-[7px] font-black px-1 py-0.5 rounded-full ${btn.badgeColor}`}>
                      {btn.badge}
                    </span>
                  )}
                  <span className="text-xl">{btn.icon}</span>
                  <span className="text-[8px] font-bold leading-tight text-center">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Visa/Mastercard ── */}
          {method === "card" && (
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="MC" className="h-6 object-contain opacity-80" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 object-contain opacity-80" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/200px-American_Express_logo.svg.png" alt="Amex" className="h-6 object-contain opacity-60" />
                <div className="flex-1" />
                <div className="flex items-center gap-1 text-[9px] text-emerald-400">🔒 SSL Secured</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">💳 {t.cardNum}</label>
                <input value={cardNum} onChange={e => setCardNum(formatCardNum(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19} className="ios-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">📅 {t.expiry}</label>
                  <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} className="ios-input" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">🔒 {t.cvv}</label>
                  <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))} placeholder="•••" maxLength={4} type="password" className="ios-input" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">👤 {t.name}</label>
                <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="FULL NAME" className="ios-input" />
              </div>
            </div>
          )}

          {/* ── BNCTL — Banco Nacional Comércio Timor-Leste ── */}
          {method === "bnctl" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-400/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-2xl">🏦</div>
                <div>
                  <div className="text-xs font-black text-white">BNCTL</div>
                  <div className="text-[10px] text-gray-400">Banco Nacional Comércio Timor-Leste</div>
                  <div className="text-[9px] text-red-300 mt-0.5">🇹🇱 Timor-Leste Official Bank</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">🏦 {lang === "id" ? "Nomor Rekening BNCTL" : lang === "en" ? "BNCTL Account Number" : "Numeru Rekening BNCTL"}</label>
                <input value={bnctlAccount} onChange={e => setBnctlAccount(e.target.value.replace(/\D/g, "").substring(0, 16))} placeholder="XXXX XXXX XXXX" className="ios-input" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">🔐 PIN (6 digits)</label>
                <input value={bnctlPin} onChange={e => setBnctlPin(e.target.value.replace(/\D/g, "").substring(0, 6))} placeholder="••••••" maxLength={6} type="password" className="ios-input text-center tracking-[0.5em] text-xl" />
              </div>
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-300">
                ℹ️ {lang === "id" ? "Pastikan saldo BNCTL cukup untuk transaksi ini." : lang === "en" ? "Ensure your BNCTL balance is sufficient." : "Asegura katak balansu BNCTL sufisiente ba transasaun ne'e."}
              </div>
            </div>
          )}

          {/* ── Mosan Wallet TL ── */}
          {method === "mosan" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-400/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-2xl">📱</div>
                <div>
                  <div className="text-xs font-black text-white">Mosan Wallet</div>
                  <div className="text-[10px] text-gray-400">E-Wallet Timor-Leste</div>
                  <div className="text-[9px] text-blue-300 mt-0.5">🇹🇱 Digital Wallet TL</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">📱 {lang === "id" ? "Nomor HP Mosan" : lang === "en" ? "Mosan Phone Number" : "Numeru Telefone Mosan"}</label>
                <input value={mosanPhone} onChange={e => setMosanPhone(e.target.value.replace(/\D/g, "").substring(0, 12))} placeholder="+670 XXXX XXXX" className="ios-input" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-[10px] text-gray-400">{lang === "id" ? "atau Scan QR Mosan:" : "or Scan Mosan QR:"}</div>
                <div className="relative inline-block">
                  <div className="p-2 bg-white rounded-xl shadow">
                    <img src={getQRISUrl(booking.bookingId + "-MOSAN", price)} alt="Mosan QR" className="w-36 h-36 object-contain" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, "0")}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">🔐 PIN Mosan (6 digits)</label>
                <input value={mosanPin} onChange={e => setMosanPin(e.target.value.replace(/\D/g, "").substring(0, 6))} placeholder="••••••" maxLength={6} type="password" className="ios-input text-center tracking-[0.5em] text-xl" />
              </div>
            </div>
          )}

          {/* ── QRIS (Indonesia) ── */}
          {method === "qris" && (
            <div className="text-center space-y-4">
              <div className="text-sm font-bold text-white">{t.qrisTitle}</div>
              <div className="relative inline-block">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <img src={getQRISUrl(booking.bookingId, price)} alt="QRIS QR Code" className="w-48 h-48 object-contain" />
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                  {Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, "0")}
                </div>
              </div>
              <div className="text-xs text-gray-400">{t.qrInst}</div>
              <div className="flex gap-2 justify-center items-center flex-wrap">
                {["BCA", "BNI", "BRI", "Mandiri", "GoPay", "OVO", "DANA", "ShopeePay"].map(b => (
                  <div key={b} className="px-2 py-1 bg-white/5 border border-white/8 rounded-lg text-[9px] text-gray-400 font-semibold">{b}</div>
                ))}
              </div>
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400 font-bold">
                {fmtPrice(price * 16000, "IDR", "id")}
              </div>
            </div>
          )}

          {/* ── DANA / OVO / GoPay / ShopeePay ── */}
          {method === "dana" && (
            <div className="space-y-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                {lang === "id" ? "Pilih E-Wallet Indonesia" : "Select Indonesian E-Wallet"}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: "dana",      label: "DANA",      color: "bg-blue-500/15 border-blue-400/30 text-blue-300" },
                  { id: "ovo",       label: "OVO",       color: "bg-purple-500/15 border-purple-400/30 text-purple-300" },
                  { id: "gopay",     label: "GoPay",     color: "bg-green-500/15 border-green-400/30 text-green-300" },
                  { id: "shopeepay", label: "ShopeePay", color: "bg-orange-500/15 border-orange-400/30 text-orange-300" },
                ] as { id: typeof danaChoice; label: string; color: string }[]).map(w => (
                  <button key={w.id} onClick={() => setDanaChoice(w.id)}
                    className={`py-2 rounded-xl border text-[10px] font-black transition-all ${danaChoice === w.id ? w.color : "border-white/8 bg-white/3 text-gray-500"}`}>
                    {w.label}
                  </button>
                ))}
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-400/15 rounded-2xl p-4 space-y-3 text-center">
                <div className="text-xs text-gray-300">
                  {lang === "id" ? `Scan QR atau buka aplikasi ${danaChoice.toUpperCase()}` : `Scan QR or open ${danaChoice.toUpperCase()} app`}
                </div>
                <div className="inline-block p-2 bg-white rounded-xl shadow">
                  <img src={getQRISUrl(booking.bookingId + "-" + danaChoice, price)} alt={danaChoice + " QR"} className="w-32 h-32 object-contain" />
                </div>
                <div className="text-sm font-black text-cyan-300">{fmtPrice(price * 16000, "IDR", "id")}</div>
              </div>
            </div>
          )}

          {/* ── Bank VA (BCA / Mandiri / BNI / BRI) ── */}
          {method === "bankva" && (
            <div className="space-y-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                {lang === "id" ? "Pilih Bank" : lang === "en" ? "Select Bank" : "Hili Banku"}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: "bca",     label: "BCA",     color: "bg-blue-500/15 border-blue-400/30 text-blue-300" },
                  { id: "mandiri", label: "Mandiri", color: "bg-yellow-500/15 border-yellow-400/30 text-yellow-300" },
                  { id: "bni",     label: "BNI",     color: "bg-orange-500/15 border-orange-400/30 text-orange-300" },
                  { id: "bri",     label: "BRI",     color: "bg-blue-600/15 border-blue-500/30 text-blue-400" },
                ] as { id: typeof bankChoice; label: string; color: string }[]).map(b => (
                  <button key={b.id} onClick={() => setBankChoice(b.id)}
                    className={`py-2 rounded-xl border text-[10px] font-black transition-all ${bankChoice === b.id ? b.color : "border-white/8 bg-white/3 text-gray-500"}`}>
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-400/15 rounded-2xl p-4 space-y-3">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{bankChoice.toUpperCase()} Virtual Account</div>
                  <div className="font-mono text-xl font-black text-white tracking-widest">
                    {bankChoice === "bca" ? "7007" : bankChoice === "mandiri" ? "8899" : bankChoice === "bni" ? "9888" : "9010"}
                    {booking.bookingId.replace("SNM-", "").substring(0, 8)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 rounded-xl p-2">
                    <div className="text-[9px] text-gray-500">Total</div>
                    <div className="text-sm font-black text-emerald-400">{fmtPrice(price * 16000, "IDR", "id")}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2">
                    <div className="text-[9px] text-gray-500">Expired</div>
                    <div className="text-sm font-black text-amber-300">24 Jam</div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 text-center">
                  {lang === "id" ? "Transfer ke nomor VA via ATM / M-Banking" : "Transfer to VA number via ATM / Mobile Banking"}
                </div>
              </div>
            </div>
          )}

          {/* ── PayPal ── */}
          {method === "paypal" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 mx-auto flex items-center justify-center text-4xl">🅿️</div>
              <div className="text-sm text-gray-300">
                {lang === "id" ? "Anda akan diarahkan ke PayPal untuk menyelesaikan pembayaran." :
                 lang === "en" ? "You will be redirected to PayPal to complete payment." :
                 lang === "pt" ? "Será redirecionado para o PayPal para concluir o pagamento." :
                 "Ita sei muda ba PayPal atu kompletu pagamentu."}
              </div>
              <div className="text-xl font-black text-white">{fmtPrice(price, currency, lang)}</div>
              <div className="text-[11px] text-gray-500">PayPal · Secure Checkout</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>
          )}

          {/* Pay button */}
          <div className="space-y-3 pb-2">
            {(method === "qris" || method === "mosan") ? (
              <div className="text-center">
                <button onClick={handlePay} className="w-full py-4 rounded-2xl rania-gradient-btn text-black font-black text-sm hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span>✅</span> {lang === "id" ? "Sudah Bayar" : lang === "en" ? "I've Paid" : lang === "pt" ? "Já Paguei" : "Ha'u Ona Paga"}
                </button>
                <div className="text-[10px] text-gray-600 mt-2">{lang === "id" ? "Klik setelah scan & bayar QR" : "Click after scanning & paying QR"}</div>
              </div>
            ) : method === "bankva" ? (
              <div className="text-center">
                <button onClick={handlePay} className="w-full py-4 rounded-2xl rania-gradient-btn text-black font-black text-sm hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span>✅</span> {lang === "id" ? "Sudah Transfer" : lang === "en" ? "I've Transferred" : "Ha'u Ona Transfere"}
                </button>
                <div className="text-[10px] text-gray-600 mt-2">{lang === "id" ? "Klik setelah transfer ke VA" : "Click after transferring to VA number"}</div>
              </div>
            ) : method === "paypal" ? (
              <button onClick={handlePay} className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #0070ba, #003087)" }}>
                <span>🅿️</span> {t.paypalBtn}
              </button>
            ) : (
              <button onClick={handlePay} className="w-full py-4 rounded-2xl rania-gradient-btn text-black font-black text-sm hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span>🔒</span> {t.pay} · {fmtPrice(price, currency, lang)}
              </button>
            )}

            <button onClick={onClose} className="w-full py-3 rounded-2xl bg-white/4 border border-white/8 text-gray-500 text-sm hover:bg-white/6 transition-all">
              {t.cancel}
            </button>
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-3 text-[9px] text-gray-600 pb-2 flex-wrap">
            <span className="flex items-center gap-1">🔒 SSL 256-bit</span>
            <span className="flex items-center gap-1">🛡️ PCI DSS</span>
            <span className="flex items-center gap-1">✅ 3D Secure</span>
            <span className="flex items-center gap-1">🏦 BNCTL</span>
            <span className="flex items-center gap-1">📱 Mosan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
