// ============================================================================
// RANIA V2.1 — Passenger Form + Passport Upload
// Collects passenger data and validates passport via OCR
// ============================================================================

import { useState, useRef } from "react";

interface PassengerData {
  fullName: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  passportImage?: string; // base64
}

interface PassengerFormProps {
  onSubmit: (data: PassengerData) => void;
  onPassportUpload?: (imageBase64: string) => Promise<{
    success: boolean;
    data?: {
      fullName?: string;
      passportNumber?: string;
      passportExpiry?: string;
      nationality?: string;
      dateOfBirth?: string;
    };
    error?: string;
  }>;
  loading?: boolean;
}

export default function PassengerForm({
  onSubmit,
  onPassportUpload,
  loading = false,
}: PassengerFormProps) {
  const [form, setForm] = useState<PassengerData>({
    fullName: "",
    passportNumber: "",
    passportExpiry: "",
    nationality: "Timor-Leste",
    dateOfBirth: "",
    email: "",
    phone: "",
  });
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [ocrResult, setOcrResult] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof PassengerData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Passport photo upload + OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setForm(prev => ({ ...prev, passportImage: base64 }));
      setOcrStatus("scanning");
      setOcrResult("");

      if (onPassportUpload) {
        try {
          const result = await onPassportUpload(base64);
          if (result.success && result.data) {
            // Auto-fill from OCR
            setForm(prev => ({
              ...prev,
              fullName: result.data!.fullName || prev.fullName,
              passportNumber: result.data!.passportNumber || prev.passportNumber,
              passportExpiry: result.data!.passportExpiry || prev.passportExpiry,
              nationality: result.data!.nationality || prev.nationality,
              dateOfBirth: result.data!.dateOfBirth || prev.dateOfBirth,
            }));
            setOcrStatus("done");
            setOcrResult("✅ Paspor berhasil dibaca! Data terisi otomatis.");
          } else {
            setOcrStatus("error");
            setOcrResult(result.error || "Gagal membaca paspor. Silakan isi manual.");
          }
        } catch {
          setOcrStatus("error");
          setOcrResult("Gagal memproses gambar. Silakan isi manual.");
        }
      } else {
        setOcrStatus("done");
        setOcrResult("Foto paspor ter-upload. Data bisa diisi manual.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.fullName.trim()) errs.fullName = "Nama wajib diisi";
    else if (form.fullName.trim().split(" ").length < 2) errs.fullName = "Nama lengkap harus minimal 2 kata";

    if (!form.passportNumber.trim()) errs.passportNumber = "Nomor paspor wajib diisi";
    else if (!/^[A-Z0-9]{6,9}$/i.test(form.passportNumber.trim())) errs.passportNumber = "Format nomor paspor tidak valid (6-9 karakter alphanumeric)";

    if (!form.passportExpiry) errs.passportExpiry = "Tanggal kadaluarsa wajib diisi";
    else {
      const expiry = new Date(form.passportExpiry);
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      if (expiry < sixMonths) errs.passportExpiry = "Paspor harus berlaku minimal 6 bulan dari sekarang";
    }

    if (!form.dateOfBirth) errs.dateOfBirth = "Tanggal lahir wajib diisi";
    if (!form.email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Format email tidak valid";
    if (!form.phone.trim()) errs.phone = "Nomor WhatsApp wajib diisi";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 placeholder-white/20 transition-colors";
  const labelCls = "block text-[11px] text-white/50 font-mono mb-1.5";
  const errorCls = "text-[10px] text-red-400 mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyan-400 text-sm">👤</span>
        <span className="text-white font-bold text-sm">Data Penumpang</span>
      </div>

      {/* Passport Upload */}
      <div
        className="rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-400/30 transition-colors p-4 cursor-pointer text-center"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        {ocrStatus === "idle" && (
          <>
            <div className="text-2xl mb-1">📸</div>
            <div className="text-white/50 text-xs font-bold">Upload Foto Paspor</div>
            <div className="text-white/25 text-[10px] mt-0.5">AI akan baca data otomatis (OCR)</div>
          </>
        )}
        {ocrStatus === "scanning" && (
          <>
            <div className="text-2xl mb-1 animate-pulse">🔍</div>
            <div className="text-cyan-400 text-xs font-bold animate-pulse">Memindai paspor...</div>
          </>
        )}
        {ocrStatus === "done" && (
          <>
            <div className="text-2xl mb-1">✅</div>
            <div className="text-emerald-400 text-xs font-bold">{ocrResult}</div>
            <div className="text-white/25 text-[10px] mt-0.5">Klik untuk ganti foto</div>
          </>
        )}
        {ocrStatus === "error" && (
          <>
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-yellow-400 text-xs font-bold">{ocrResult}</div>
            <div className="text-white/25 text-[10px] mt-0.5">Klik untuk coba lagi</div>
          </>
        )}
      </div>

      {/* Name */}
      <div>
        <label className={labelCls}>Nama Lengkap (sesuai paspor) *</label>
        <input value={form.fullName} onChange={set("fullName")} placeholder="e.g. JOAO MANUEL DA SILVA" className={inputCls} />
        {errors.fullName && <div className={errorCls}>{errors.fullName}</div>}
      </div>

      {/* Passport Number + Expiry */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nomor Paspor *</label>
          <input value={form.passportNumber} onChange={set("passportNumber")} placeholder="e.g. A12345678" className={inputCls} />
          {errors.passportNumber && <div className={errorCls}>{errors.passportNumber}</div>}
        </div>
        <div>
          <label className={labelCls}>Berlaku Sampai *</label>
          <input type="date" value={form.passportExpiry} onChange={set("passportExpiry")} className={inputCls} />
          {errors.passportExpiry && <div className={errorCls}>{errors.passportExpiry}</div>}
        </div>
      </div>

      {/* DOB + Nationality */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tanggal Lahir *</label>
          <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} />
          {errors.dateOfBirth && <div className={errorCls}>{errors.dateOfBirth}</div>}
        </div>
        <div>
          <label className={labelCls}>Kewarganegaraan</label>
          <select value={form.nationality} onChange={set("nationality")} className={inputCls} style={{ appearance: "none" }}>
            <option value="Timor-Leste" style={{ background: "#111" }}>🇹🇱 Timor-Leste</option>
            <option value="Indonesia" style={{ background: "#111" }}>🇮🇩 Indonesia</option>
            <option value="Australia" style={{ background: "#111" }}>🇦🇺 Australia</option>
            <option value="Portugal" style={{ background: "#111" }}>🇵🇹 Portugal</option>
          </select>
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Email *</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" className={inputCls} />
          {errors.email && <div className={errorCls}>{errors.email}</div>}
        </div>
        <div>
          <label className={labelCls}>WhatsApp *</label>
          <input value={form.phone} onChange={set("phone")} placeholder="+670 7xxx xxxx" className={inputCls} />
          {errors.phone && <div className={errorCls}>{errors.phone}</div>}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #00e5ff, #a855f7)",
          boxShadow: "0 4px 20px rgba(0,229,255,0.2)",
        }}
      >
        {loading ? "⏳ Memproses..." : "Lanjut ke Pembayaran →"}
      </button>
    </form>
  );
}
