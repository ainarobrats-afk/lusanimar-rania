import React, { useState } from "react";
import { X, UserPlus, FileText, Image as ImageIcon, Briefcase } from "lucide-react";
import { User } from "../types";

interface RegistrationModalProps {
  onClose: () => void;
  onRegister: (user: User) => void;
}

export default function RegistrationModal({
  onClose,
  onRegister,
}: RegistrationModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [accountType, setAccountType] = useState<"personal" | "agent">("personal");
  
  // Agent specific
  const [ktpUrl, setKtpUrl] = useState("");
  const [storePhotoUrl, setStorePhotoUrl] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !whatsapp || !dob || !password) {
      alert("Harap isi semua field wajib!");
      return;
    }
    
    if (password.length < 6) {
      alert("Password minimal 6 karakter!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Konfirmasi password tidak cocok!");
      return;
    }

    if (accountType === "agent") {
       if (!ktpUrl || !storePhotoUrl || !bankAccount) {
         alert("Mitra Agen wajib mengunggah KTP, Foto Toko, dan Rekening Bank!");
         return;
       }
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      dob: dob.trim(),
      accountType,
      adCredits: 0,
      freeListings: 3,
      isVerified: false,
      agentStatus: accountType === "agent" ? "pending" : undefined
    };

    onRegister(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#0F1420] border border-slate-800 rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
            <UserPlus className="text-blue-500" size={20} /> DAFTAR AKUN SANIMAR
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Tipe Akun Selector */}
          <div className="space-y-2">
             <label className="text-slate-400 block font-bold">PILIH TIPE AKUN</label>
             <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("personal")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${accountType === "personal" ? "bg-blue-600/20 border-blue-500 text-white" : "bg-[#111827] border-slate-800 text-slate-400"}`}
                >
                  <span className="text-xl">👤</span>
                  <span className="font-bold">Akun Pribadi</span>
                  <span className="text-[9px] font-normal">Gratis (Pembeli/Browsing)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("agent")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${accountType === "agent" ? "bg-amber-600/20 border-amber-500 text-white" : "bg-[#111827] border-slate-800 text-slate-400"}`}
                >
                  <span className="text-xl">🏪</span>
                  <span className="font-bold">Mitra Agen</span>
                  <span className="text-[9px] font-normal">Toko/Kios (Perlu Verifikasi)</span>
                </button>
             </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nama Lengkap *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
            <input
              type="tel"
              placeholder="Nomor WhatsApp *"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
            
            <div>
              <label className="text-slate-400 text-[10px] mb-1 block">Tanggal Lahir *</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <input
              type="password"
              placeholder="Password (Min. 6 Karakter) *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Konfirmasi Password *"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {accountType === "agent" && (
             <div className="space-y-3 border-t border-slate-800 pt-3 mt-3 animate-fade-in">
               <div className="text-amber-500 font-bold mb-2 flex items-center gap-1.5">
                  <Briefcase size={14} /> SYARAT MITRA AGEN (AGEN RESELLER)
               </div>
               
               <div className="flex gap-2">
                 <button type="button" className="flex-1 bg-slate-800 rounded-xl border border-dotted border-slate-600 hover:border-slate-400 p-3 text-slate-400 flex flex-col items-center gap-1" onClick={() => setKtpUrl("ktp.jpg")}>
                   <FileText size={16} />
                   <span className="text-[10px]">{ktpUrl ? "KTP ✔" : "Upload KTP *"}</span>
                 </button>
                 <button type="button" className="flex-1 bg-slate-800 rounded-xl border border-dotted border-slate-600 hover:border-slate-400 p-3 text-slate-400 flex flex-col items-center gap-1" onClick={() => setStorePhotoUrl("store.jpg")}>
                   <ImageIcon size={16} />
                   <span className="text-[10px]">{storePhotoUrl ? "Foto ✔" : "Foto Toko (1-3) *"}</span>
                 </button>
               </div>

               <input
                 type="text"
                 placeholder="Nomor Rekening Bank & Nama Bank (Untuk Komisi) *"
                 value={bankAccount}
                 onChange={(e) => setBankAccount(e.target.value)}
                 className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
               />
               
               <div className="text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded">
                 * Status agen akan ditinjau oleh tim Sanimar dalam 1-24 jam. Jika disetujui, Anda dapat menjual Kredit Iklan ke user lain dan menerima komisi.
               </div>
             </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:scale-[1.02]"
          >
            {accountType === "agent" ? "DAFTAR SEBAGAI AGEN" : "DAFTAR SEKARANG"}
          </button>
        </form>
      </div>
    </div>
  );
}
