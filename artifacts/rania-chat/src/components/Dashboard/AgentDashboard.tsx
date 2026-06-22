import React, { useState } from "react";
import { User } from "../types";
import { ArrowLeft, Wallet, TrendingUp, Search } from "lucide-react";

interface AgentDashboardProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (user: User) => void;
  onBuyPackage: () => void;
}

export default function AgentDashboard({ user, onClose, onUpdateUser, onBuyPackage }: AgentDashboardProps) {
  const [buyerPhone, setBuyerPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  
  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferAmount);
    
    if (!buyerPhone || isNaN(amount) || amount <= 0 || !sellPrice) {
      alert("Harap lengkapi form penjualan kredit!");
      return;
    }
    
    if (amount > user.adCredits) {
      alert("Saldo Kredit Iklan Anda tidak cukup!");
      return;
    }
    
    alert(`Transaksi Berhasil!\n\nAnda telah mentransfer ${amount} Kredit Iklan ke nomor ${buyerPhone}.\nTotal tagihan pembeli: $${sellPrice} (${paymentType.toUpperCase()})\n\nKeuntungan Anda langsung masuk ke kantong Anda.`);
    
    // Deduct credits
    onUpdateUser({
      ...user,
      adCredits: user.adCredits - amount
    });
    
    setBuyerPhone("");
    setTransferAmount("");
    setSellPrice("");
  };

  return (
    <div className="space-y-6 animate-fade-in py-4 pb-20">
      <div className="flex items-center justify-between bg-[#111827] border border-slate-805/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏪</span>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white uppercase font-mono tracking-wider">
              MODE AGEN
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400">
              Mitra Agen Sanimar Market
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> KEMBALI
        </button>
      </div>
      
      {user.agentStatus === "pending" && (
         <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <h3 className="text-amber-500 font-bold mb-1">Status Verifikasi Agen: PENDING</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tim Sanimar sedang meninjau KTP dan Foto Toko Anda. Proses ini biasanya memakan waktu 1-24 jam. Fitur penjualan kredit akan otomatis terbuka setelah Anda disetujui.
            </p>
         </div>
      )}

      {user.agentStatus === "approved" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] pointer-events-none">
                  <Wallet size={80} className="text-blue-500" />
                </div>
                
                <h3 className="text-xs text-slate-400 font-bold mb-1 font-mono uppercase tracking-widest relative z-10">Stok Kredit Anda</h3>
                <div className="text-4xl font-black text-white relative z-10 font-mono tracking-tighter">
                  {user.adCredits} <span className="text-sm text-slate-400 font-sans tracking-normal">Kredit</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex gap-2 relative z-10">
                  <button onClick={onBuyPackage} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all">
                    + BELI PAKET AGEN
                  </button>
                </div>
             </div>

             <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
                <h3 className="text-xs text-white font-bold mb-4 font-mono uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" /> STATISTIK AGEN
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400">Total Penjualan Kredit:</span>
                    <span className="font-bold text-white text-sm">45 Transaksi</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400">Total Komisi (Estimasi):</span>
                    <span className="font-bold text-[#F5A623] text-sm">~$4.50</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-xs text-slate-400">Rating & Kepercayaan:</span>
                    <span className="font-bold text-white text-sm">★★★★☆ (4.5)</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-[#0B0F1A] border border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
               <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
               <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-1.5">
                 Transfer & Jual Kredit 
               </h3>
               <p className="text-[10px] text-slate-400 mb-4">
                 Transfer kredit kepada user lain dan terima uang tunai. Harga jual ditentukan sendiri.
               </p>

               <form onSubmit={handleSell} className="space-y-3">
                 <div>
                   <label className="text-[10px] text-slate-400 font-bold mb-1 block">Nomor HP/WhatsApp Pembeli *</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Search size={14}/></span>
                     <input type="text" value={buyerPhone} onChange={(e)=>setBuyerPhone(e.target.value)} placeholder="+670 77..." className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" required/>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] text-slate-400 font-bold mb-1 block">Jml Kredit Ditransfer *</label>
                     <input type="number" value={transferAmount} onChange={(e)=>setTransferAmount(e.target.value)} placeholder="0" className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono" required/>
                   </div>
                   <div>
                     <label className="text-[10px] text-slate-400 font-bold mb-1 block">Tagihan ke Pembeli ($) *</label>
                     <input type="number" step="0.01" value={sellPrice} onChange={(e)=>setSellPrice(e.target.value)} placeholder="0.00" className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono" required/>
                   </div>
                 </div>

                 <div>
                   <label className="text-[10px] text-slate-400 font-bold mb-1 block">Metode Pembayaran *</label>
                   <select value={paymentType} onChange={(e)=>setPaymentType(e.target.value)} className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500">
                     <option value="cash">Tunai (Cash)</option>
                     <option value="transfer">Transfer Bank Pihak ke 3</option>
                     <option value="mosan">MOSAN (P2P)</option>
                   </select>
                 </div>

                 <button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] text-xs">
                   ✅ PROSES PENJUALAN
                 </button>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
