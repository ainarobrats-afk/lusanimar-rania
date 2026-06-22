/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Wallet, Plus, ArrowUpRight, Share2, DollarSign, Gift, Star, RefreshCw, Sparkles, Megaphone, CheckCircle, Pause } from "lucide-react";
import { LanguageCode } from "../i18n";

interface CommissionItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  amount: number;
}

interface AdCampaign {
  id: string;
  listingId: string;
  listingTitle: string;
  budget: number;
  spent: number;
  cpc: number;
  status: "ACTIVE" | "PENDING" | "PAUSED";
  expiresAt: string;
}

interface WalletDashboardProps {
  lang: LanguageCode;
  t: any; // Translation dictionary object
  walletBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onEmitCoin: (x: number, y: number) => void;
}

const DICT = {
  tet: {
    wBalance: "SALDU SANIMAR WALLET",
    topUpLabel: "Aumenta Saldu Virtual (Top Up)",
    customA: "Kustom Saldu (Ex: $15)",
    topUpBtn: "Karga Saldu",
    referralTitle: "Bia Kode Referral (Kuna bónus)",
    referralText: "Konvida belun iha Facebook/WhatsApp rona Dili, hetan +$0.50 saldu gratuitidade hodi uza kmana.",
    copiado: "Kopia ona!",
    copyBtn: "Kopia Link",
    ledgerTitle: "Históriu Arus Kas",
    topUpSuccess: "Aumenta hosi Saldu Susesu!",
    topUpSuccessAlert: "Susesu aumenta saldu virtual ba karteira. Obrigado barak!",
    errorN: "Favór hakerek valor ne'ebé loos!",
    boostTitle: "Sanimar AdBoost &bull; Promove Negósiu",
    boostDesc: "Promove ó-nia produtu: hili kampaun ads foun. Prontu hamosu organikamente no hetan kliente foun lalais!",
    boostFormSelect: "Hili produtu atu Promove:",
    boostFormBudget: "Orsamentu Ads ($):",
    boostFormSubmit: "Lansa Promosaun Ads",
    boostFormSlo: "Estilu: Gasta uitoan liu, hetan ema foun ho lalais!",
    tableListing: "Anúnsiu",
    tableBudget: "Orsamentu",
    tableSpent: "Gasta",
    tableStatus: "Estatus",
    adCampaignCreated: "Ads Kampaun foun komesa ho estatus PENDING hodi kurator ativu sira verifika!"
  },
  id: {
    wBalance: "SALDO SANIMAR WALLET",
    topUpLabel: "Isi Uang Saldo Virtual (Top Up)",
    customA: "Jumlah kustom (e.g. $15)",
    topUpBtn: "Isi Saldo",
    referralTitle: "Bagi Kode Referral Undangan Teman",
    referralText: "Ajak teman di Grup Facebook atau WhatsApp Dili bertransaksi di Sanimar dan dapatkan bonus saldo $0.50 setiap referral terdaftar!",
    copiado: "Disalin!",
    copyBtn: "Salin Link",
    ledgerTitle: "Histori Arus Kas Wallet",
    topUpSuccess: "Top Up Saldo Berhasil",
    topUpSuccessAlert: "Berhasil melakukan topup sebesar ${amount} ke Sanimar Wallet Anda!",
    errorN: "Harap masukkan nominal Top Up yang valid!",
    boostTitle: "Sanimar AdBoost &bull; Kelola Iklan Mandiri",
    boostDesc: "Promosikan dagangan Anda ke feed utama. Fitur freemium to paid modern, tingkatkan branding tanpa perantara.",
    boostFormSelect: "Pilih produk Anda untuk di-PROMO:",
    boostFormBudget: "Budget Iklan ($):",
    boostFormSubmit: "Mulai AdBoost Kampanye",
    boostFormSlo: "Hemat, bayar setelah ramai pengunjung!",
    tableListing: "Listing",
    tableBudget: "Budget",
    tableSpent: "Spent",
    tableStatus: "Status",
    adCampaignCreated: "Kampanye Iklan Berhasil Dibuat! Status PENDING menunggu persetujuan Kurator Admin Sanimar."
  },
  en: {
    wBalance: "SANIMAR DIGITAL KEY WALLET",
    topUpLabel: "Load Virtual Demo Balance (Top Up)",
    customA: "Custom amount (e.g. $15)",
    topUpBtn: "Top Up Now",
    referralTitle: "Invite Partners via Referral",
    referralText: "Share with social groups in Dili, earn immediate bonus rewards once registered successfully.",
    copiado: "Copied!",
    copyBtn: "Copy Link",
    ledgerTitle: "Wallet Cash Flow Ledger",
    topUpSuccess: "Wallet Fund Deposit Completed",
    topUpSuccessAlert: "Successfully deposited demo funds of ${amount} to your wallet ledger!",
    errorN: "Please enter a valid top up numerical value!",
    boostTitle: "Sanimar AdBoost &bull; Self-Serve Ad Engine",
    boostDesc: "Empower your listings with tailored, pay-after-success organic reach campaign algorithms.",
    boostFormSelect: "Select Listing to Promoted:",
    boostFormBudget: "Budget Limit ($):",
    boostFormSubmit: "Deploy Selected AdBoost",
    boostFormSlo: "High yield, pay as you grow!",
    tableListing: "Listing",
    tableBudget: "Budget",
    tableSpent: "Spent",
    tableStatus: "Status",
    adCampaignCreated: "Ad campaign established! Awaiting quick Admin curator activation review."
  },
  pt: {
    wBalance: "MERCADO KEY CARTEIRA",
    topUpLabel: "Carregar Saldo de Demonstração (Top Up)",
    customA: "Valor personalizado (Ex: $15)",
    topUpBtn: "Efetuar Recarga",
    referralTitle: "Partilhar Link de Recomendação",
    referralText: "Partilhe nas redes sociais de Dili e ganhe comissões imediatas diretamente na sua carteira digital.",
    copiado: "Copiado!",
    copyBtn: "Copiar Link",
    ledgerTitle: "Histórico de Transações e Caixa",
    topUpSuccess: "Depósito de Recursos Concluído",
    topUpSuccessAlert: "Mais de ${amount} adicionado com sucesso à sua carteira digital!",
    errorN: "Por favor insira um montante numérico válido!",
    boostTitle: "Sanimar AdBoost &bull; Gestão de Campanhas",
    boostDesc: "Impulsione os seus anúncios no feed principal com o nosso avançado sistema de publicidade autónoma.",
    boostFormSelect: "Escolha o anúncio a promover:",
    boostFormBudget: "Orçamento Limite ($):",
    boostFormSubmit: "Ativar Campanha de AdBoost",
    boostFormSlo: "Pague apenas depois de obter resultados reais!",
    tableListing: "Anúncios",
    tableBudget: "Orçamento",
    tableSpent: "Gasto",
    tableStatus: "Estado",
    adCampaignCreated: "Campanha criada com sucesso! Aguarda validação breve do curador administrativo."
  }
};

export default function WalletDashboard({ 
  lang,
  t,
  walletBalance, 
  onUpdateBalance, 
  onEmitCoin 
}: WalletDashboardProps) {
  
  const [commissions, setCommissions] = useState<CommissionItem[]>([
    { id: "c1", icon: "💸", title: lang === "tet" ? "Komisun Kopi Ermera" : "Afiliasi Kopi Ermera (Ouvidio J.)", time: "Baru saja", amount: 1.20 },
    { id: "c3", icon: "👥", title: lang === "tet" ? "Referral Rejistu Foun" : "Referral Berhasil: @isabel_dili", time: "1 jam lalu", amount: 0.50 },
    { id: "c4", icon: "💸", title: lang === "tet" ? "Komisun Madu Kos" : "Komisi Penjualan Madu Baucau", time: "5 jam lalu", amount: 1.80 }
  ]);

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([
    { id: "adc_1", listingId: "p4", listingTitle: "Kopi Arabika Ermera - Organic Beans", budget: 30, spent: 12.45, cpc: 0.15, status: "ACTIVE", expiresAt: "2026-07-20" },
    { id: "adc_2", listingId: "p2", listingTitle: "Honda Scoopy 2022 Mulus", budget: 50, spent: 0.00, cpc: 0.20, status: "PENDING", expiresAt: "2026-07-15" }
  ]);

  const [topUpAmount, setTopUpAmount] = useState<number>(10);
  const [customTopUp, setCustomTopUp] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  // Boost form states
  const [selectedListingToBoost, setSelectedListingToBoost] = useState("p3");
  const [adsBudget, setAdsBudget] = useState("15");

  const referLink = "https://sanimar.tl/ref?code=TL_LEE_882";
  const cDict = DICT[lang];

  const handleTopUp = () => {
    let finalAmount = topUpAmount;
    if (customTopUp) {
      const parsed = parseFloat(customTopUp);
      if (!isNaN(parsed) && parsed > 0) {
        finalAmount = parsed;
      } else {
        alert(cDict.errorN);
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      onUpdateBalance(walletBalance + finalAmount);
      
      const newComm: CommissionItem = {
        id: `c_${Date.now()}`,
        icon: "💳",
        title: cDict.topUpSuccess,
        time: "Baru saja",
        amount: finalAmount
      };
      setCommissions(prev => [newComm, ...prev]);

      setLoading(false);
      setCustomTopUp("");
      
      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
        }, i * 100);
      }
      alert(cDict.topUpSuccessAlert.replace("${amount}", finalAmount.toLocaleString()));
    }, 1200);
  };

  const handleCreateAdCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(adsBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert("Invalid budget");
      return;
    }

    const titlesMap: Record<string, string> = {
      p1: "Rumah Minimalis Modern Kelapa",
      p2: "Honda Scoopy 2022 Mulus Dili",
      p3: "Tais Original Premium Ermera",
      p4: "Kopi Arabika Organik",
      p5: "Staff Administrasi Lowongan"
    };

    const targetTitle = titlesMap[selectedListingToBoost] || "Barang Lokál Sanimar";

    const newAd: AdCampaign = {
      id: `adc_${Date.now()}`,
      listingId: selectedListingToBoost,
      listingTitle: targetTitle,
      budget: budgetNum,
      spent: 0.00,
      cpc: 0.10,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10)
    };

    setCampaigns(prev => [newAd, ...prev]);

    // Emit coin feedback
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
    alert(cDict.adCampaignCreated);
  };

  const copyReferralUrl = () => {
    navigator.clipboard.writeText(referLink);
    setReferralCopied(true);
    
    setTimeout(() => {
      setReferralCopied(false);
    }, 2000);
  };

  const handleToggleAdStatus = (id: string) => {
    setCampaigns(prev => prev.map(camp => {
      if (camp.id === id) {
        const nextStatus = camp.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        return { ...camp, status: nextStatus };
      }
      return camp;
    }));
  };

  return (
    <div className="space-y-4">
      
      {/* Wallet Balance Display Box */}
      <div className="bg-gradient-to-br from-[rgba(59,130,246,0.18)] to-[rgba(139,92,246,0.1)] border border-[rgba(59,130,246,0.35)] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-15%] w-48 h-48 rounded-full bg-radial from-[rgba(139,92,246,0.25)] to-transparent pointer-events-none" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] text-slate-400 font-mono tracking-wide flex items-center gap-1">
              <Wallet size={12} className="text-[#3B82F6]" /> {cDict.wBalance}
            </span>
            <h2 className="text-3xl font-display font-black text-white mt-1 tabular-nums">
              ${walletBalance.toLocaleString()}
              <span className="text-xs text-slate-400 font-body font-normal ml-1">USD</span>
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-400 font-mono tracking-wide block uppercase font-bold">● ONLINE PAY</span>
            <span className="text-xs font-mono text-slate-300 font-bold">Sanimar Verified Ledger</span>
          </div>
        </div>

        {/* Action Panel for Top-Up */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono block">{cDict.topUpLabel}</span>
          
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setTopUpAmount(amt);
                  setCustomTopUp("");
                }}
                className={`py-2 text-xs font-bold font-mono rounded-lg border transition-all cursor-pointer ${
                  topUpAmount === amt && !customTopUp
                    ? "border-blue-500 bg-blue-650/10 text-white"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white"
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="number"
              value={customTopUp}
              onChange={(e) => {
                setCustomTopUp(e.target.value);
                setTopUpAmount(0);
              }}
              placeholder={cDict.customA}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none placeholder-slate-600 focus:border-blue-400 font-mono"
            />
            <button
              onClick={handleTopUp}
              disabled={loading}
              className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-40 text-slate-950 font-semibold hover:text-white text-xs px-4 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={13} /> : <Plus size={14} />} {cDict.topUpBtn}
            </button>
          </div>
        </div>
      </div>

      {/* COMPLIANT AdBoost Kampanye Center */}
      <div className="bg-[#111827] border border-slate-850 rounded-2xl p-4.5 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="text-[#F5A623] animate-pulse" size={16} />
          <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
            {cDict.boostTitle}
          </h4>
        </div>
        <p className="text-[10.5px] text-slate-500 leading-relaxed">
          {cDict.boostDesc}
        </p>

        {/* Ad Setup Form */}
        <form onSubmit={handleCreateAdCampaign} className="space-y-2.5 bg-slate-950/75 p-3 rounded-xl border border-slate-900">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">{cDict.boostFormSelect}</label>
            <select
              value={selectedListingToBoost}
              onChange={(e) => setSelectedListingToBoost(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 font-sans"
            >
              <option value="p3">Tais Original Handwoven Premium - Ermera ($75)</option>
              <option value="p4">Kopi Arabika Organik Ermera ($12)</option>
              <option value="p1">Rumah Minimalis Modern Kelapa ($49,500)</option>
              <option value="p2">Honda Scoopy 2022 Mulus ($1,350)</option>
            </select>
          </div>

          <div className="flex gap-2 items-end justify-between">
            <div className="flex-1">
              <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">{cDict.boostFormBudget}</label>
              <input 
                type="number"
                value={adsBudget}
                onChange={(e) => setAdsBudget(e.target.value)}
                placeholder="15"
                className="w-full bg-[#0B0F1A] border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-[#2BD366]/10 border border-[#22A951]/30 hover:bg-[#22A951]/20 text-green-400 font-bold px-3 py-1.5 rounded-lg text-[10px] tracking-wide uppercase transition-all shrink-0 cursor-pointer"
            >
              {cDict.boostFormSubmit}
            </button>
          </div>
          <span className="text-[9px] text-slate-500 italic block font-mono text-center">
            💡 {cDict.boostFormSlo}
          </span>
        </form>

        {/* Campaigns Listing Tracker (Model Conformity) */}
        <div className="space-y-2 pt-1 border-t border-slate-850/60">
          {campaigns.map((camp) => (
            <div 
              key={camp.id} 
              className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 block space-y-1.5 text-[10.5px]"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">{camp.listingTitle}</span>
                <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                  camp.status === "ACTIVE" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : camp.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-slate-800 text-slate-400"
                }`}>
                  {camp.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-[9.5px] font-mono text-slate-500 pt-1 border-t border-slate-950">
                <div>
                  <span className="block text-[8px] text-slate-600 uppercase">{cDict.tableBudget}</span>
                  <span className="text-slate-300 font-semibold">${camp.budget}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-600 uppercase">{cDict.tableSpent}</span>
                  <span className="text-slate-300 font-semibold">${camp.spent}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-600 uppercase">CPC</span>
                  <span className="text-slate-300 font-semibold">${camp.cpc}</span>
                </div>
                <div className="text-right">
                  <button 
                    onClick={() => handleToggleAdStatus(camp.id)}
                    className="text-blue-400 hover:text-white underline cursor-pointer text-[9px] block ml-auto font-sans"
                  >
                    {camp.status === "ACTIVE" ? "Pause" : "Start"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Referral Link Box */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
          <Gift size={13} className="text-blue-400" /> {cDict.referralTitle}
        </h4>
        <p className="text-[10.5px] text-slate-500 leading-relaxed mb-3">
          {cDict.referralText}
        </p>
        
        <div className="flex gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-900 items-center">
          <input 
            type="text" 
            readOnly 
            value={referLink}
            className="flex-1 bg-transparent text-[11px] text-slate-450 outline-none font-mono"
          />
          <button
            onClick={copyReferralUrl}
            className="bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded text-[10px] font-bold font-body transition-colors shrink-0 cursor-pointer"
          >
            {referralCopied ? cDict.copiado : cDict.copyBtn}
          </button>
        </div>
      </div>

      {/* Historical Cash Flow Ledger */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-3">
          {cDict.ledgerTitle}
        </h4>
        <div className="space-y-1 divide-y divide-slate-850 max-h-48 overflow-y-auto pr-1">
          {commissions.map((comm) => (
            <div key={comm.id} className="flex justify-between items-center py-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{comm.icon}</span>
                <div>
                  <h5 className="font-semibold text-slate-300">{comm.title}</h5>
                  <span className="text-[10px] text-slate-500 font-mono">{comm.time}</span>
                </div>
              </div>
              <span className="font-display font-semibold font-mono text-[#2BD366]">
                +${comm.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
