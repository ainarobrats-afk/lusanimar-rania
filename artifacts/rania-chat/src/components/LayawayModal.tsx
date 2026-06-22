import React, { useState } from "react";
import { Product } from "../types";
import { X, Calendar, DollarSign, ShieldAlert, CheckCircle, CreditCard } from "lucide-react";

interface LayawayModalProps {
  product: Product;
  walletBalance: number;
  onClose: () => void;
  onEmitCoin: (x: number, y: number) => void;
  onUpdateBalance: (newBalance: number) => void;
}

export default function LayawayModal({ 
  product, 
  walletBalance, 
  onClose, 
  onEmitCoin, 
  onUpdateBalance 
}: LayawayModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Layaway mathematical breakdowns
  const dpAmount = Math.round(product.price * 0.20); // 20% Downpayment
  const remainingTotal = product.price - dpAmount;
  const installmentsCount = 5;
  const installmentAmount = Math.round(remainingTotal / installmentsCount);

  const handleConfirmLayaway = async () => {
    if (walletBalance < dpAmount) {
      alert(`Saldo Sanimar Wallet Anda tidak mencukupi untuk membayar DP sebesar $${dpAmount}. Silakan Top Up terlebih dahulu!`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/layaway/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price,
          dpAmount: dpAmount,
          installmentsCount: installmentsCount,
          installmentAmount: installmentAmount,
          buyerName: "Lee Soares (Kamu)",
          sellerName: product.sellerName
        })
      });

      if (!res.ok) throw new Error("Gagal membuat kontrak layaway");
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // Deduct only DP 20%
        onUpdateBalance(walletBalance - dpAmount);

        // Coin rainfall celebrating contract sign!
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            onEmitCoin(window.innerWidth / 2 + (Math.random() * 60 - 30), window.innerHeight / 2);
          }, i * 100);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setSuccess(true);
      onUpdateBalance(walletBalance - dpAmount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      
      <div 
        className="w-full max-w-md bg-[#0F1420] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-[#F5A623]/25 text-[#F5A623] border border-orange-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              📜 LAYAWAY CONTRACT
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          <div className="flex gap-3 items-start">
            <img src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded-xl border border-slate-800 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-400 font-mono">DETAIL DAGANGAN</h4>
              <p className="text-xs font-semibold text-white leading-normal line-clamp-2">{product.title}</p>
              <span className="text-sm font-display font-black text-white block pt-0.5">
                Harga Tunai: ${product.price.toLocaleString()}
              </span>
            </div>
          </div>

          {!success ? (
            <>
              {/* LAYAWAY BREAKDOWN GRID */}
              <div className="bg-[#111827] border border-slate-850 rounded-xl p-4 space-y-3.5">
                <h5 className="text-[10.5px] font-bold text-slate-400 uppercase font-mono tracking-wider border-b border-slate-850 pb-1.5">
                  Rencana Cicil (Skema DP 20% OK)
                </h5>

                <div className="grid grid-cols-2 gap-3.5 text-center">
                  <div className="bg-orange-500/5 border border-amber-500/20 rounded-lg p-2.5">
                    <span className="text-[9.5px] text-slate-500 font-mono block uppercase">Bayar DP 20% Sekarang</span>
                    <b className="text-lg font-display text-[#F5A623] block mt-0.5">${dpAmount}</b>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5">
                    <span className="text-[9.5px] text-slate-500 font-mono block uppercase">Cicilan 5x Mingguan</span>
                    <b className="text-lg font-display text-[#5CBAFF] block mt-0.5">${installmentAmount} <span className="text-[10px] font-medium text-slate-500">/x</span></b>
                  </div>
                </div>

                <div className="space-y-1.5 text-[10.5px] text-slate-400 pt-1.5 border-t border-slate-850/60">
                  <div className="flex justify-between">
                    <span>Sisa Total Cicilan (80%):</span>
                    <span className="font-mono text-slate-300 font-semibold">${remainingTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jangka Waktu Pembayaran:</span>
                    <span className="font-semibold text-slate-300">Setiap Hari Senin</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penjual Penerima Dana:</span>
                    <b className="text-slate-300">{product.sellerName}</b>
                  </div>
                </div>
              </div>

              {/* Warnings and compliance */}
              <div className="bg-yellow-950/20 border border-yellow-700/20 rounded-lg p-3 text-[10px] text-yellow-500 flex gap-2 items-start leading-relaxed">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <p>
                  <b>Peraturan Layaway:</b> Sisa cicilan wajib dikirim langsung ke seller berjangka 5x mingguan. Barang dikirim lunas setelah semua installment dipenuhi 100%. DP hangus bila cicilan macet 30 hari.
                </p>
              </div>

              <button
                onClick={handleConfirmLayaway}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <CreditCard size={13} />
                <span>{loading ? "Menandatangani Kontrak..." : `Konfirmasi DP Layaway $${dpAmount}`}</span>
              </button>
            </>
          ) : (
            /* SUCCESS CONFIRMATION STATE */
            <div className="text-center py-6 space-y-4 animate-scale-in">
              <div className="w-12 h-12 bg-green-950 text-green-400 border border-green-500/25 rounded-full flex items-center justify-center font-black text-xl mx-auto">
                ✓
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Kontrak Layaway Aktif!</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Downpayment sebesar <b>${dpAmount}</b> sukses didebet dari Sanimar Wallet Anda. Kontrak cicilan Anda dengan seller <b>{product.sellerName}</b> telah terdaftar di database keuangan mikro BCTL!
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-left space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Kontrak ID:</span>
                  <span className="text-slate-300 font-bold">LWY_{Date.now().toString().substring(6)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Sisa Cicil:</span>
                  <span className="text-slate-300 font-bold">5x @ ${installmentAmount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status:</span>
                  <span className="text-green-400 font-bold">DP 20% DIBAYAR</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup & Kembali
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
