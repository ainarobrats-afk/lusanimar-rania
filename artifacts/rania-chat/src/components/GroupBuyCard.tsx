/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Users, ShoppingBag, ArrowRight, CheckCircle, ExternalLink } from "lucide-react";
import { LanguageCode } from "../i18n";

interface GroupBuy {
  id: string;
  itemId: string;
  title: string;
  image: string;
  originalPrice: number;
  promoPrice: number;
  targetMembers: number;
  currentMembers: number;
  members: string[];
}

interface GroupBuyCardProps {
  lang: LanguageCode;
  onEmitCoin: (x: number, y: number) => void;
  onUpdateBalance: (newBalance: any) => void;
  onSuccessOrder: (itemTitle: string) => void;
}

const DICT = {
  tet: {
    badge: "🏷️ BELI BARENG (GROUP BUY)",
    saveTitle: "Konserva 20% (Ajak Belun nain 4)",
    membersTitle: "Membru Rejistu:",
    spotsRemaining: "Sura ema {sisa} tan!",
    groupFull: "Membru foun nakonu!",
    yourGroup: "Ó-nia Grupu:",
    successMsg: "Benvindu! Ó dulas hamutuk ona no selu",
    descSuccessFull: "Susesu tebes! Membru 5/5 hotu ona. Beras 20kg sei haruka ba ó-nia uma ohin loron kedas!",
    descSuccessWait: "Hein {sisa} belun tan hodi sistema bele haruka kargo hamutuk. Bagikan link ne'e hodi konvida belun:",
    xenditBtn: "Xendit Invoice Kmanek",
    joinBtn: "Hamutuk & Selu $",
    loadingXendit: "Konekta ho Xendit...",
    joinedLabel: "Lee Soares (Ó)",
    packetLabel: "PAKETE GRUPU"
  },
  id: {
    badge: "🏷️ BELI BARENG (GROUP BUY)",
    saveTitle: "Hemat 20% (Ajak 4 Teman)",
    membersTitle: "Anggota Terkumpul:",
    spotsRemaining: "Sisa {sisa} orang lagi!",
    groupFull: "Kuota Grup Penuh!",
    yourGroup: "Grup Anda:",
    successMsg: "Berhasil bergabung & mendebet $",
    descSuccessFull: "Selamat! Kuota Group Buy 5/5 sudah tercapai penuh. Beras 20kg akan dikirim ke rumah Anda dan teman-teman hari ini!",
    descSuccessWait: "Menunggu {sisa} teman lagi agar pesanan diproses bersama. Bagikan tautan pembayaran ini untuk mengajak kawan:",
    xenditBtn: "Link Invoice Xendit",
    joinBtn: "Gabung & Bayar $",
    loadingXendit: "Menghubungkan Xendit...",
    joinedLabel: "Lee Soares (Kamu)",
    packetLabel: "PAKET GRUP"
  },
  en: {
    badge: "🏷️ GROUP BUY WHOLESALE",
    saveTitle: "Save 20% (Invite 4 Friends)",
    membersTitle: "Joined Members:",
    spotsRemaining: "Only {sisa} spots left!",
    groupFull: "Group quota full!",
    yourGroup: "Your Group Members:",
    successMsg: "Successfully joined and debited $",
    descSuccessFull: "Congratulations! Cooperative 5/5 milestone achieved. Your 20kg premium rice will be dispatched today!",
    descSuccessWait: "Waiting for {sisa} more partners to complete the circle. Share this direct payment checkout link:",
    xenditBtn: "Xendit Direct Invoice",
    joinBtn: "Join & Pay $",
    loadingXendit: "Connecting Xendit...",
    joinedLabel: "Lee Soares (You)",
    packetLabel: "GROUP BID"
  },
  pt: {
    badge: "🏷️ COMPRA COLETIVA (PREÇO GROSSO)",
    saveTitle: "Poupe 20% (Convide 4 Amigos)",
    membersTitle: "Membros Registados:",
    spotsRemaining: "Restam apenas {sisa} pessoas!",
    groupFull: "Vagas preenchidas!",
    yourGroup: "Membros do Grupo:",
    successMsg: "Adesão efetuada com sucesso. Débito de $",
    descSuccessFull: "Parabéns! O limite de Compra Coletiva 5/5 foi atingido. O saco de Arroz de 20kg será enviado para as vossas moradas hoje!",
    descSuccessWait: "Aguardando mais {sisa} amigos para prosseguir. Partilhe este link seguro de pagamento para convidar parceiros:",
    xenditBtn: "Fatura Xendit Direta",
    joinBtn: "Aderir & Pagar $",
    loadingXendit: "A ligar à Xendit...",
    joinedLabel: "Lee Soares (Tu)",
    packetLabel: "LOTE GRUPO"
  }
};

export default function GroupBuyCard({ lang, onEmitCoin, onUpdateBalance, onSuccessOrder }: GroupBuyCardProps) {
  const [group, setGroup] = useState<GroupBuy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await fetch("/api/groupbuy");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      if (data && data.length > 0) {
        setGroup(data[0]); // Take Beras 20kg
      }
    } catch (err) {
      console.error(err);
      // Fallback local state if API fails
      setGroup({
        id: "gb_beras",
        itemId: "p14",
        title: "Beras Premium Timor 20kg",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
        originalPrice: 50,
        promoPrice: 40,
        targetMembers: 5,
        currentMembers: 3,
        members: ["Anacleto De Jesus", "Domingos da Silva", "Jacinta Soares"]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.MouseEvent) => {
    if (!group || joining || success) return;
    setJoining(true);
    setCheckoutUrl(null);

    onEmitCoin(e.clientX, e.clientY);

    try {
      const res = await fetch("/api/groupbuy/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupBuyId: group.id,
          userName: DICT[lang].joinedLabel
        })
      });

      if (!res.ok) throw new Error("Gagal bergabung");
      const data = await res.json();
      
      if (data.success) {
        setGroup(data.group);
        setCheckoutUrl(data.checkoutUrl);
        setSuccess(true);
        onUpdateBalance((prev: number) => prev - group.promoPrice);
        
        if (data.isFull) {
          onSuccessOrder(group.title);
        }

        // Celebrate visual particles
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
          }, i * 150);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback increase local member count
      const updated = { ...group };
      updated.members.push(DICT[lang].joinedLabel);
      updated.currentMembers += 1;
      setGroup(updated);
      setSuccess(true);
      onUpdateBalance((prev: number) => prev - group.promoPrice);
      if (updated.currentMembers >= updated.targetMembers) {
        onSuccessOrder(group.title);
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 animate-pulse h-32" />
    );
  }

  if (!group) return null;

  const sisa = group.targetMembers - group.currentMembers;
  const progressPercent = (group.currentMembers / group.targetMembers) * 100;
  const cDict = DICT[lang];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
      
      {/* Visual motif accent border top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#3B82F6]" />

      <div className="flex flex-col sm:flex-row gap-5 items-center">
        
        {/* Product image block */}
        <div className="w-full sm:w-1/3 aspect-square rounded-xl overflow-hidden bg-slate-950 relative border border-slate-850 shrink-0">
          <img src={group.image} alt={group.title} className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded font-mono">
            {cDict.packetLabel}
          </span>
        </div>

        {/* Details & Interactive panel */}
        <div className="w-full sm:w-2/3 space-y-3.5">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">
                {cDict.badge}
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {group.itemId}</span>
            </div>
            <h4 className="font-display font-extrabold text-base text-white tracking-tight mt-1 leading-snug">{group.title}</h4>
          </div>

          <div className="flex items-baseline gap-2 pb-1">
            <span className="text-2xl font-display font-black text-[#5CBAFF]">${group.promoPrice}</span>
            <span className="text-xs text-slate-500 line-through font-mono">${group.originalPrice}</span>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-1 rounded font-mono">
              {cDict.saveTitle}
            </span>
          </div>

          {/* Core progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Users size={12} className="text-[#3B82F6]" /> {cDict.membersTitle} <b className="text-white">{group.currentMembers}/{group.targetMembers}</b>
              </span>
              <span className="text-[#F5A623] font-semibold text-[11px] font-mono animate-pulse">
                {sisa > 0 ? cDict.spotsRemaining.replace("{sisa}", String(sisa)) : cDict.groupFull}
              </span>
            </div>
            
            <div className="w-full h-3.5 bg-[#0B0F1A] border border-slate-850 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {/* List active members */}
            <div className="text-[9.5px] text-slate-500 font-sans mt-1">
              {cDict.yourGroup} <span className="font-mono text-slate-400">{group.members.join(", ")}</span>
            </div>
          </div>

          {/* Interactive button trigger block */}
          {success ? (
            <div className="bg-[#0c1c11] border border-[#22A951]/20 rounded-xl p-3 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                <CheckCircle size={14} /> {cDict.successMsg} ${group.promoPrice}!
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                {sisa === 0 
                  ? cDict.descSuccessFull
                  : cDict.descSuccessWait.replace("{sisa}", String(sisa))
                }
              </p>
              {checkoutUrl && (
                <a 
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 text-[#7CADFF] px-2.5 py-1.5 rounded text-[10px] font-mono transition-all font-bold group"
                >
                  <ExternalLink size={10} /> {cDict.xenditBtn} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handleJoinGroup}
              disabled={joining}
              className="w-full bg-blue-650 hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3 text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center px-4"
            >
              <ShoppingBag size={13} />
              <span>{joining ? cDict.loadingXendit : `${cDict.joinBtn}${group.promoPrice}`}</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
