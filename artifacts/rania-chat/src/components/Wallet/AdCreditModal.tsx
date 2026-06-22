import React, { useState } from "react";
import { X, Wallet, ShieldAlert } from "lucide-react";
import { User, AdCreditPackage } from "../types";

interface AdCreditModalProps {
  onClose: () => void;
  onPurchase: (packages: AdCreditPackage) => void;
  user: User;
}

const PACKAGES: AdCreditPackage[] = [
  { id: "pkg_1", name: "Hemat", priceUSD: 1, baseCredits: 20, bonusCredits: 0 },
  { id: "pkg_2", name: "Ekstra", priceUSD: 5, baseCredits: 120, bonusCredits: 20 },
  { id: "pkg_3", name: "Pro", priceUSD: 10, baseCredits: 260, bonusCredits: 60 },
  { id: "pkg_4", name: "Agen", priceUSD: 25, baseCredits: 700, bonusCredits: 300 },
];

export default function AdCreditModal({
  onClose,
  onPurchase,
  user,
}: AdCreditModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<AdCreditPackage>(PACKAGES[1]); // Default Ekstra
  const [paymentMethod, setPaymentMethod] = useState<string>("mosan");

  const handleBuy = () => {
     onPurchase(selectedPkg);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#0F1420] border border-slate-800 rounded-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-800 sticky top-0 bg-[#0F1420]/95 backdrop-blur z-10 flex items-center justify-between">
          <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
            <Wallet className="text-[#F5A623]" size={20} /> BELI PAKET KREDIT IKLAN
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
             <span className="text-slate-400 font-bold">Kredit Saat Ini:</span>
             <span className="text-blue-400 font-black text-base">{user.adCredits} Kredit <span className="text-slate-500 font-normal">(${(user.adCredits * 0.05).toFixed(2)})</span></span>
          </div>

          <div className="space-y-2">
             <label className="text-slate-400 font-bold">PILIH PAKET KREDIT IKLAN:</label>
             <div className="grid grid-cols-1 gap-2">
               {PACKAGES.map(pkg => {
                  const isSelected = selectedPkg.id === pkg.id;
                  const total = pkg.baseCredits + pkg.bonusCredits;
                  const unitPrice = (pkg.priceUSD / total).toFixed(3);
                  const isRecommended = pkg.id === "pkg_2" || (user.accountType === "agent" && pkg.id === "pkg_4");

                  return (
                    <div 
                      key={pkg.id} 
                      onClick={() => setSelectedPkg(pkg)}
                      className={`relative cursor-pointer p-3 border rounded-xl flex items-center justify-between transition-all ${isSelected ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-[#111827] hover:border-slate-700"}`}
                    >
                       <div>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{pkg.name}</span>
                            {isRecommended && <span className="bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded font-black">★ REKOMENDASI</span>}
                         </div>
                         <div className="text-slate-400 mt-0.5">
                            {pkg.baseCredits} Kredit {pkg.bonusCredits > 0 && <span className="text-[#2BD366]">+ {pkg.bonusCredits} Bonus</span>}
                         </div>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-white text-base">${pkg.priceUSD}</div>
                          <div className="text-slate-500 text-[9px]">~${unitPrice}/kredit</div>
                       </div>
                    </div>
                  )
               })}
             </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="space-y-2">
            <label className="text-slate-400 font-bold">METODE PEMBAYARAN:</label>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
               {[
                 { id: "mosan", label: "MOSAN Wallet (Otomatis)" },
                 { id: "tpay", label: "T-Pay Wallet (Otomatis)" },
                 { id: "xendit", label: "Xendit (Kartu Kredit/Debit)" },
                 { id: "ib", label: "Internet Banking" },
                 { id: "transfer", label: "Transfer Bank BNU" },
                 { id: "agen", label: "Bayar di Agen Sanimar" },
               ].map(method => (
                 <label key={method.id} className={`flex items-start gap-2 p-2 border rounded-lg cursor-pointer ${paymentMethod === method.id ? "border-blue-500 bg-blue-900/20 text-white" : "border-slate-800 bg-[#111827] text-slate-400"}`}>
                   <input type="radio" className="mt-0.5" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                   <span className="leading-tight">{method.label}</span>
                 </label>
               ))}
            </div>
          </div>

          <button
            onClick={handleBuy}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:scale-[1.02] text-sm"
          >
            Beli {selectedPkg.baseCredits + selectedPkg.bonusCredits} Kredit — ${selectedPkg.priceUSD}
          </button>

          {/* Edukasi Kredit Iklan */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
             <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1.5 border-b border-slate-800 pb-2">
               <ShieldAlert size={14} className="text-[#F5A623]"/> KENAPA SANIMAR PAKAI KREDIT IKLAN?
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed">
               Rania: "Maun/Mana, kenapa SANIMAR minta 1 Kredit ($0.05) untuk posting iklan list baru?"
             </p>
             <ul className="text-[10px] text-slate-400 mt-1.5 space-y-1 list-disc pl-4 marker:text-slate-600">
               <li>Biar iklan bebas dari spam.</li>
               <li>Biar pembeli tau ini penjual serius, bukan scammer.</li>
               <li>Biaya dipakai untuk server biar app tidak lemot.</li>
             </ul>
          </div>

          {/* Disclaimer BCTL */}
          <div className="text-[9px] text-slate-500 text-justify leading-relaxed">
            <b>CATATAN PENTING:</b> Kredit Iklan HANYA berlaku untuk mempromosikan produk di dalam aplikasi Sanimar Market. Kredit TIDAK BISA digunakan untuk pembelian produk, tidak bisa ditarik/dicairkan menjadi uang tunai, dan BUKAN merupakan mata uang digital. Segala pembelian tiket atau barang menggunakan uang asli, bukan Kredit Iklan. Saldo wallet Anda tersimpan aman dan privat.
          </div>
        </div>
      </div>
    </div>
  );
}
