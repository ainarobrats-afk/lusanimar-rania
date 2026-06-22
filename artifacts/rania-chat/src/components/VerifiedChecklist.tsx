/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, ShieldCheck, CreditCard, User, Check, Camera, Sparkles, TrendingUp } from "lucide-react";

export default function VerifiedChecklist({
  lang,
  onVerifySuccess,
  onEmitCoin
}: {
  lang: "tet" | "id" | "en" | "pt";
  onVerifySuccess: () => void;
  onEmitCoin: (x: number, y: number) => void;
}) {
  const [ktpNumber, setKtpNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("BNU Timor");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Transaction-based badge tier states
  const [transactionCount, setTransactionCount] = useState(150); // Default 150 (Silver)

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpNumber.trim() || !bankAccount.trim()) {
      alert("Lengkapi info KTP dan No. Rekening dahulu ya!");
      return;
    }

    setIsSubmitted(true);
    onVerifySuccess();
    
    // Celebration effects
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        onEmitCoin(
          window.innerWidth / 2 + (Math.random() * 120 - 60), 
          window.innerHeight / 3 + (Math.random() * 120 - 60)
        );
      }, i * 90);
    }
  };

  const getTierAndBadge = (txs: number) => {
    if (txs >= 10000) {
      return { tier: "Platinum Seller", color: "from-purple-500 to-indigo-600 bg-indigo-900/40 text-indigo-300 border-indigo-500/50", emoji: "💎" };
    } else if (txs >= 1000) {
      return { tier: "Gold Seller", color: "from-amber-400 to-yellow-600 bg-amber-950/40 text-amber-300 border-amber-500/50", emoji: "👑" };
    } else if (txs >= 100) {
      return { tier: "Silver Seller", color: "from-slate-400 to-slate-350 bg-slate-900/50 text-slate-300 border-slate-500/40", emoji: "⭐" };
    } else {
      return { tier: "Bronze Seller", color: "from-amber-800 to-amber-700 bg-orange-950/30 text-amber-500 border-amber-800/30", emoji: "🌱" };
    }
  };

  const currentBadgeInfo = getTierAndBadge(transactionCount);

  // Drag & drop handlers for selfie with national ID
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelfieFile(e.dataTransfer.files[0]);
    }
  };

  const dict = {
    tet: {
      hdr: "🏆 VERIFIKASAUN SELLER (BADGE VERIFIED)",
      sub: "Hasa'e konfiansa kliente ba 100%! Públika tais, motor, no uma ho badge prioritáriu 'Verified'.",
      ktp: "No. KTP / BI (Identidade Timor-Leste)",
      bank: "Naran Banku & No. Konta Rekening",
      submit: "Submete Verifikasaun Agora",
      success: "Konta Verifikadu Susesu! Badge 'Verified' ativu ona iha ita-nia anúnsiu hotu. Parabéns! 🎉",
      uploadSelfie: "Karga Foto Selfie holding KTP",
      insightText: "💡 Insight Inteligente: Verified Seller bele hamosu fa'an sasán dalarua hosi dalarua (3x more sales) no rona fali lalais hosi kliente sira!",
      tierTitle: "Nivel Transaksaun Ita Nian",
      tierSubtitle: "Muda Ita nia reputasaun bazeia ba total fa'an:"
    },
    id: {
      hdr: "🏆 VERIFIKASI PENJUAL (DAPAT BADGE VERIFIED)",
      sub: "Meningkatkan kepercayaan pembeli hingga 100%. Listing motor, rumah, dan tais Anda otomatis mendapat badge biru 'Verified'. Wajib verifikasi KTP + Rekening bank.",
      ktp: "No. KTP / Paspor Elektronik",
      bank: "Nomor Rekening & Nama Bank",
      submit: "Kirim Data Verifikasi Resmi",
      success: "Akun Anda Sukses Terverifikasi! Badge biru 'Verified' aktif di semua iklan Anda sekarang. Selamat transaksi lancar! 🎉",
      uploadSelfie: "Upload Selfie memegang KTP / ID",
      insightText: "💡 Insight Ekstra: Verified Seller terbukti 3x lebih laku dibanding penjual biasa karena dipercaya sistem Layaway Escrow!",
      tierTitle: "Level Reputasi Penjual Anda",
      tierSubtitle: "Tingkatan badge otomatis berdasarkan volume transaksi sukses:"
    },
    en: {
      hdr: "🏆 SELLER IDENTITY VERIFICATION (VERIFIED BADGE)",
      sub: "Boost buyer trust by 100%! All your home, car, and handicraft listings automatically earn a prominent blue 'Verified' badge. Identity KTP & bank account validation required.",
      ktp: "National ID (KTP) / Passport Number",
      bank: "Bank Name & Account Number",
      submit: "Submit Verification Details",
      success: "Account Successfully Verified! Your blue badge is fully active across all current and future listings. Trade safely! 🎉",
      uploadSelfie: "Upload Selfie holding National ID Card",
      insightText: "💡 Business Insight: Verified Sellers sell up to 3x faster and attract high-value Escrow layaway buyers instantly!",
      tierTitle: "Transaction Tier Medal",
      tierSubtitle: "Upgrade your rank automatically based on completed order transaction volume:"
    },
    pt: {
      hdr: "🏆 VERIFICAÇÃO DO VENDEDOR (BADGE VERIFIED)",
      sub: "Aumente a confiança dos compradores para 100%. Todos os anúncios de casas, motos e kmanek recebem o selo azul de verificação. Requer BI/ID e conta bancária.",
      ktp: "Número do BI (Bilhete de Identidade) / Passaporte",
      bank: "Nome do Banco e Número de Conta",
      submit: "Enviar Dados para Validação",
      success: "Conta Verificada com Sucesso! O selo azul 'Verified' está ativo em todos os seus anúncios. Bons negócios! 🎉",
      uploadSelfie: "Carregar Foto Selfie segurando o BI",
      insightText: "💡 Estatísticas de Vendas: Vendedores verificados vendem 3x mais rápido por inspirarem total confiança no sistema de garantia!",
      tierTitle: "Nivel de Medalha de Transação",
      tierSubtitle: "Upgrade o seu nível baseado nas suas vendas e transações financeiras:"
    }
  }[lang] || {
    hdr: "🏆 VERIFIKASI PENJUAL (DAPAT BADGE VERIFIED)",
    sub: "Wajib verifikasi KTP + Rekening bank.",
    ktp: "No. KTP / Paspor",
    bank: "Nomor Rekening & Nama Bank",
    submit: "Kirim Data Verifikasi",
    success: "Akun Anda Sukses Terverifikasi! Badge biru 'Verified' aktif di semua iklan Anda sekarang.",
    uploadSelfie: "Upload Foto Selfie",
    insightText: "💡 Verified Seller 3x lebih laku!",
    tierTitle: "Level Reputasi",
    tierSubtitle: "Tingkatan badge berdasarkan transaksi:"
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      
      {/* 2x3 Insight Banner */}
      <div className="bg-gradient-to-r from-blue-900/35 to-teal-900/35 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3 animate-pulse select-none">
        <TrendingUp className="text-teal-400 shrink-0" size={20} />
        <div>
          <h5 className="text-[11.5px] font-black text-teal-300 font-mono uppercase tracking-wide">
            💡 VERIFIED SELLER 3X LEBIH LAKU!
          </h5>
          <p className="text-[10px] text-slate-350 leading-relaxed mt-0.5">
            Pembeli lokal & jastip luar negeri memprioritaskan toko berkredensial KTP. Transaksi Anda dijamin naik berkali lipat.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
          <Award size={18} className="animate-spin [animation-duration:15s]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            {dict.hdr}
          </h4>
          <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
            {dict.sub}
          </p>
        </div>
      </div>

      {/* REPUTATION TIER MANAGEMENT SYSTEM */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2.5">
        <div className="flex justify-between items-start">
          <div>
            <h5 className="text-[10.5px] font-bold text-white font-mono uppercase">{dict.tierTitle}</h5>
            <p className="text-[9.5px] text-slate-500 mt-0.5">{dict.tierSubtitle}</p>
          </div>
          <span className={`text-[10px] px-2.5 py-0.8 rounded-full font-bold uppercase tracking-wider font-mono bg-gradient-to-r ${currentBadgeInfo.color}`}>
            {currentBadgeInfo.emoji} {currentBadgeInfo.tier}
          </span>
        </div>

        {/* Dynamic transaction slider simulating active rank change */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>Transaksi: <b>{transactionCount}</b></span>
            <span>Tingkatan Badge: Silver (100+) &bull; Gold (1k+) &bull; Plat (10k+)</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="12000" 
            step="50"
            value={transactionCount}
            onChange={(e) => {
              setTransactionCount(parseInt(e.target.value));
              onEmitCoin(window.innerWidth / 2, window.innerHeight * 0.7);
            }}
            className="w-full accent-blue-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
          />
        </div>
      </div>

      {/* 2-STEP IDENTITY VERIFICATION FORM */}
      {!isSubmitted ? (
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="space-y-2.5 text-[11px]">
            {/* Step 1: Input Details */}
            <div className="space-y-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-mono tracking-wider block border-b border-slate-850 pb-1">
                Langkah 1: Profil & Rekening Bank
              </span>
              <div>
                <label className="text-slate-550 text-[9px] block mb-1 uppercase font-mono">{dict.ktp}</label>
                <div className="relative">
                  <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text"
                    value={ktpNumber}
                    onChange={(e) => setKtpNumber(e.target.value)}
                    placeholder="e.g. 177203180295"
                    className="w-full bg-[#0B0F1A] border border-slate-800 focus:border-blue-500 pl-8 pr-3 py-1.8 rounded-lg text-white font-mono placeholder-slate-705 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-slate-550 text-[9px] block mb-1 uppercase font-mono">Bank</label>
                  <select 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#0B0F1A] border border-slate-800 focus:border-blue-500 px-1.5 py-1.8 rounded-lg text-white outline-none cursor-pointer text-xs font-semibold"
                  >
                    <option value="BNU Timor">BNU</option>
                    <option value="Mandiri Dili">Mandiri</option>
                    <option value="BNI Timor">BNI</option>
                    <option value="BCTL Central">BCTL</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-550 text-[9px] block mb-1 uppercase font-mono">{dict.bank}</label>
                  <div className="relative">
                    <CreditCard size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="e.g. 8812-09411-9255"
                      className="w-full bg-[#0B0F1A] border border-slate-800 focus:border-blue-500 pl-8 pr-3 py-1.8 rounded-lg text-white font-mono placeholder-slate-705 outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Selfie Attachment (MANDATORY drag & drop file upload) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9.5px] text-slate-400 uppercase font-mono tracking-wider block border-b border-slate-850 pb-1">
                Langkah 2: Verifikasi Wajah (Selfie)
              </span>
              <label className="text-slate-550 text-[9px] block uppercase font-mono">{dict.uploadSelfie}</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelfieFile(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
                className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-1 ${
                  dragActive 
                    ? "border-blue-500 bg-blue-950/20" 
                    : selfieFile
                    ? "border-emerald-500 bg-emerald-950/15"
                    : "border-slate-800 bg-slate-950/60 hover:bg-slate-900"
                }`}
              >
                {selfieFile ? (
                  <>
                    <Check className="text-emerald-400 animate-bounce" size={20} />
                    <span className="text-[10.5px] font-bold text-emerald-300 font-mono truncate max-w-[220px]">
                      {selfieFile.name} (Attached)
                    </span>
                    <span className="text-[9px] text-slate-450 uppercase font-mono">Seret file baru untuk mengganti</span>
                  </>
                ) : (
                  <>
                    <Camera className="text-slate-500 animate-pulse text-center" size={18} />
                    <span className="text-[10.5px] font-semibold text-slate-300 font-sans">
                      Klik / Seret foto selfie dengan memegang KTP di sini
                    </span>
                    <span className="text-[9px] text-slate-550 font-mono uppercase">Maksimal 5MB (Format JPG, PNG)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer text-center flex items-center justify-center gap-1.5 mt-2"
          >
            <ShieldCheck size={14} /> {dict.submit}
          </button>
        </form>
      ) : (
        <div className="p-3 bg-emerald-950/20 border border-emerald-600/30 rounded-xl space-y-2 animate-scale-in">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
            <Check size={15} /> VERIFIED IDENTITY BADGE ACTIVE!
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
            {dict.success}
          </p>
          <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg flex items-center justify-between text-[10px] font-mono select-none">
            <span className="text-slate-450 uppercase">Verified ID:</span>
            <span className="text-emerald-400 font-semibold">{ktpNumber.replace(/.(?=.{4})/g, "*")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
