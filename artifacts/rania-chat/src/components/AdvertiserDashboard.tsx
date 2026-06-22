/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DollarSign, Shield, Percent, Sparkles, TrendingUp, Compass, Plus, BarChart2, Radio, Globe } from "lucide-react";

interface AdCampaign {
  id: string;
  name: string;
  type: "Display Banner" | "Promosi Prioritas" | "Google Ads Network" | "Facebook Ads Network";
  cpc: number;
  clicks: number;
  impressions: number;
  conversionRate: number; // CTR/conversion %
  spent: number;
  dailyBudget: number;
  totalBudget: number;
  targetLocation: "Dili" | "Ermera" | "Baucau" | "Semua";
  targetCategory: string;
  status: "Aktif" | "Tertunda" | "Habis Saldo";
}

export default function AdvertiserDashboard({
  lang,
  walletBalance,
  onUpdateBalance,
  onEmitCoin,
  onAddSponsoredAd
}: {
  lang: "tet" | "id" | "en" | "pt";
  walletBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onEmitCoin: (x: number, y: number) => void;
  onAddSponsoredAd?: (title: string, price: number, image: string, location: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([
    { 
      id: "c-1", 
      name: "Kafé Timor Gleno Promo", 
      type: "Display Banner", 
      cpc: 0.15, 
      clicks: 124, 
      impressions: 4320,
      conversionRate: 2.8,
      spent: 18.60, 
      dailyBudget: 5.00,
      totalBudget: 50.00, 
      targetLocation: "Ermera",
      targetCategory: "Kopi Timor",
      status: "Aktif" 
    },
    { 
      id: "c-2", 
      name: "Dili Real Estate Hub Ad", 
      type: "Promosi Prioritas", 
      cpc: 0.50, 
      clicks: 42, 
      impressions: 1105,
      conversionRate: 3.8,
      spent: 21.00, 
      dailyBudget: 10.00,
      totalBudget: 100.00, 
      targetLocation: "Dili",
      targetCategory: "Rumah & Kos",
      status: "Aktif" 
    },
    { 
      id: "c-3", 
      name: "Tais Weaving Premium Coop", 
      type: "Google Ads Network", 
      cpc: 0.08, 
      clicks: 310, 
      impressions: 15400,
      conversionRate: 2.0,
      spent: 24.80, 
      dailyBudget: 3.00,
      totalBudget: 30.00, 
      targetLocation: "Baucau",
      targetCategory: "Handcraft",
      status: "Habis Saldo" 
    }
  ]);

  // Campaign create form states
  const [adName, setAdName] = useState("");
  const [adType, setAdType] = useState<"Display Banner" | "Promosi Prioritas">("Display Banner");
  const [dailyBudget, setDailyBudget] = useState("5");
  const [totalBudget, setTotalBudget] = useState("30");
  const [adPrice, setAdPrice] = useState("");
  const [adImage, setAdImage] = useState("");
  const [targetLocation, setTargetLocation] = useState<"Dili" | "Ermera" | "Baucau" | "Semua">("Dili");
  const [targetCategory, setTargetCategory] = useState("Kopi Timor");

  const [totalClientRevenue, setTotalClientRevenue] = useState(64.40);

  const calculateCPC = (type: string) => {
    return type === "Promosi Prioritas" ? 0.50 : 0.15;
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName.trim()) return;

    const bVal = parseFloat(totalBudget) || 15;
    const dbVal = parseFloat(dailyBudget) || 5;

    if (walletBalance < bVal) {
      alert("Saldo Sanimar Wallet Anda tidak mencukupi untuk mendanai total anggaran iklan sebesar $" + bVal + "! Silakan tambah saldo Anda.");
      return;
    }

    const cpcRate = calculateCPC(adType);
    const newCamp: AdCampaign = {
      id: `c_user_${Date.now()}`,
      name: adName.trim(),
      type: adType,
      cpc: cpcRate,
      clicks: 0,
      impressions: 0,
      conversionRate: 0.0,
      spent: 0,
      dailyBudget: dbVal,
      totalBudget: bVal,
      targetLocation: targetLocation,
      targetCategory: targetCategory,
      status: "Aktif"
    };

    // Deduct user wallet balance to fund the ad campaign
    onUpdateBalance(walletBalance - bVal);
    setCampaigns(prev => [newCamp, ...prev]);

    // Add sponsored item in home feed
    if (onAddSponsoredAd) {
      const parsedPrice = parseFloat(adPrice) || 25;
      const finalImg = adImage.trim() || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80";
      onAddSponsoredAd(adName.trim(), parsedPrice, finalImg, targetLocation === "Semua" ? "Dili" : targetLocation);
    }

    // Reset fields
    setAdName("");
    setAdPrice("");
    setAdImage("");
    
    alert(`Sukses menerbitkan Kampanye Iklan Bersponsor! Sanimar Wallet Anda telah mendanai total kampanye iklan sebesar $${bVal} ($${dbVal}/hari). Iklan terdistribusi optimal ke target ${targetLocation} untuk kategori ${targetCategory}.`);
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  // Simulation updating impressions and clicks
  const triggerSimulateClicks = () => {
    let clickCount = 0;
    setCampaigns(prev => {
      return prev.map(camp => {
        if (camp.status !== "Aktif") return camp;
        
        const addedImpressions = Math.floor(Math.random() * 250) + 50;
        const randomClicks = Math.floor(Math.random() * 12) + 1;
        const totalAddedClicks = camp.clicks + randomClicks;
        const totalAddedImpressions = camp.impressions + addedImpressions;
        const rawCtr = totalAddedImpressions > 0 ? (totalAddedClicks / totalAddedImpressions) * 100 : 0;
        const totalAddedSpent = Math.round((camp.spent + (randomClicks * camp.cpc)) * 100) / 100;
        
        let status = camp.status;
        let finalSpent = totalAddedSpent;
        let finalClicks = totalAddedClicks;
        
        if (totalAddedSpent >= camp.totalBudget) {
          status = "Habis Saldo";
          finalSpent = camp.totalBudget;
          finalClicks = Math.floor(camp.totalBudget / camp.cpc);
        }
        
        clickCount += (finalClicks - camp.clicks);
        return {
          ...camp,
          clicks: finalClicks,
          impressions: totalAddedImpressions,
          conversionRate: parseFloat(rawCtr.toFixed(1)),
          spent: finalSpent,
          status
        };
      });
    });

    if (clickCount > 0) {
      setTotalClientRevenue(prev => prev + (clickCount * 0.15));
      onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
      alert("Simulasi Berhasil! Tráfiku iklan PPC diperbarui berdasarkan targeting lokasi & kategori.");
    }
  };

  const dict = {
    tet: {
      hdr: "📈 DASBOR PARTNER IKLAN PPC (MONETISASI)",
      sub: "Sanimar la iha stok rasik. Produtividade sira servisu hosi komisaun (0-5%) no Iklan Pay Per Click (70% rev share advertiser).",
      revenue: "Totál Entrada Iklan",
      clicks: "Kliente Klik",
      payout: "Iklan Facebook & Google (Rev Share 70/30)",
      campaignTitle: "Ita-nia Kampanye Iklan",
      createBtn: "Públika Iklan Sponsor Foun",
      nameInput: "Naran Iklan / Produtu",
      typeInput: "Kategoria Iklan",
      budgetInput: "Total Orsamentu Kampanye ($)",
      submit: "Kria Kampanye & Publika Iklan",
      simulate: "Simula Klik Tráfiku (PPC Test)",
    },
    id: {
      hdr: "📈 DASHBOARD BISNIS & IKLAN PPC (PAY PER CLICK)",
      sub: "Sanimar murni jembatan digital, tidak memiliki stok barang. Pendapatan murni dari komisi transaksi + iklan mandiri / Google / Facebook Ads (Sistem Bagi Hasil 70/30).",
      revenue: "Total Omzet Iklan Plt.",
      clicks: "Total Klik Pengiklan",
      payout: "Mitra Ad Network (Google & FB Revenue Share)",
      campaignTitle: "Kampanye Iklan Anda Saat Ini",
      createBtn: "Pasang Kampanye Sponsor Baru",
      nameInput: "Judul Produk Sponsor",
      typeInput: "Metode Tayang Iklan",
      budgetInput: "Total Alokasi Budget ($)",
      submit: "Kurasi & Aktifkan Iklan PPC",
      simulate: "Simulasikan Klik Pengguna & Terima Hasil Click",
    },
    en: {
      hdr: "📈 SPONSORED PPC ADVERTISING CONSOLE",
      sub: "Sanimar holds zero stock. Platform earnings are purely driven by transaction fees and Pay-Per-Click ads (70% revenue share for merchants, 30% platform margin).",
      revenue: "Sanimar Ad Gross Margin",
      clicks: "Total Conversion Clicks",
      payout: "Partner Networks (Google & FB 70/30 Share)",
      campaignTitle: "Your Live Active Campaigns",
      createBtn: "Launch New Promotion Campaign",
      nameInput: "Product Sponsorship Title",
      typeInput: "Ad Slot Placement",
      budgetInput: "Total Campaign Budget ($)",
      submit: "Deduct Wallet & Boot Campaign",
      simulate: "Simulate Live Traffic Clicks",
    },
    pt: {
      hdr: "📈 CONSOLE DE PUBLICIDADE PPC / CPC CERTIFICADO",
      sub: "O Sanimar não possui stock. Modelo de negócio baseado em comissão de transação e publicidade Pay-Per-Click direta ou integrada com Google Ads.",
      revenue: "Faturação Bruta de Anúncios",
      clicks: "Cliques Registados",
      payout: "Redes Parceiras (Google ADS Share 70/30)",
      campaignTitle: "As Suas Campanhas Ativas",
      createBtn: "Iniciar Nova Campanha Promocional",
      nameInput: "Nome do Anúncio",
      typeInput: "Método de Exibição",
      budgetInput: "Orçamento Total ($)",
      submit: "Criar Campanha & Faturar",
      simulate: "Simular Cliques de Tráfego",
    }
  }[lang] || {
    hdr: "📈 DASHBOARD BISNIS & IKLAN PPC",
    sub: "Sanimar murni jembatan digital, pendapatan dari komisi transaksi + iklan mandiri.",
    revenue: "Total Omzet Iklan",
    clicks: "Total Klik",
    payout: "Google Ads Revenue Share 70/30",
    campaignTitle: "Kampanye Iklan Anda",
    createBtn: "Pasang Kampanye Sponsor Baru",
    nameInput: "Judul Produk Sponsor",
    typeInput: "Metode Tayang Iklan",
    budgetInput: "Dana Kampanye ($)",
    submit: "Kurasi & Aktifkan Iklan PPC",
    simulate: "Simulasikan Klik",
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
      <div className="flex items-start gap-2.5 border-b border-slate-800/80 pb-3 justify-between items-center">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl">
            <BarChart2 size={18} />
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
      </div>

      {/* Google Ads API integration system indicator */}
      <div className="w-full flex items-center justify-between bg-gradient-to-r from-blue-950/20 to-slate-950 border border-blue-500/15 rounded-xl px-3 py-2 text-[10.5px] text-slate-350 select-none font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-blue-300">
          <Globe size={13} className="animate-spin [animation-duration:12s] text-blue-400" />
          Google Ads API Sync Node:
        </span>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" /> Verified / Connected
        </span>
      </div>

      {/* KPI METRICS SHELF */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
          <span className="text-[9.5px] text-slate-500 font-mono uppercase block">{dict.revenue}</span>
          <b className="text-base sm:text-lg font-display text-emerald-400 font-black tracking-tight leading-none block mt-1">
            ${totalClientRevenue.toFixed(2)}
          </b>
          <span className="text-[8px] text-slate-500 mt-1 block">Timor CPC Revenue Share: 70%</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
          <span className="text-[9.5px] text-slate-500 font-mono uppercase block">{dict.clicks}</span>
          <b className="text-base sm:text-lg font-display text-white font-black tracking-tight leading-none block mt-1">
            {campaigns.reduce((acc, c) => acc + c.clicks, 0)} <span className="text-[10px] text-slate-400">clicks</span>
          </b>
          <button 
            onClick={triggerSimulateClicks}
            className="text-[9px] text-[#F5A623] hover:underline font-bold mt-1 font-mono tracking-wider block"
          >
            ⚡ {dict.simulate}
          </button>
        </div>
      </div>

      {/* CAMPAIGNS LISTING TABLE with extra analytics (impressions, conversion CTR) */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-bold text-slate-450 uppercase font-mono tracking-wider">
          {dict.campaignTitle}
        </h5>
        
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
          {campaigns.map(c => (
            <div key={c.id} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <div className="space-y-0.5">
                  <b className="text-slate-200 text-xs block truncate max-w-[170px]">{c.name}</b>
                  <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-550 font-mono">
                    <span className="bg-blue-600/10 px-1 rounded text-blue-400 font-semibold">{c.targetLocation}</span>
                    <span className="bg-purple-600/10 px-1 rounded text-purple-400 font-semibold">{c.targetCategory}</span>
                    <span>&bull;</span>
                    <span>CPC: ${c.cpc}</span>
                  </div>
                </div>
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                  c.status === "Aktif" ? "bg-emerald-600/15 text-emerald-400" : "bg-red-600/15 text-[#E63946]"
                }`}>{c.status}</span>
              </div>

              {/* Analytics row */}
              <div className="grid grid-cols-3 gap-1.5 text-[9.5px] font-mono text-slate-400 leading-none">
                <div className="bg-slate-900/60 p-1.5 rounded text-center">
                  <span className="text-slate-500 block text-[8px] mb-0.5 uppercase">Tayang</span>
                  <b>{c.impressions.toLocaleString()}</b>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded text-center">
                  <span className="text-slate-500 block text-[8px] mb-0.5 uppercase">Klik</span>
                  <b>{c.clicks}</b>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded text-center col-span-1">
                  <span className="text-slate-500 block text-[8px] mb-0.5 uppercase">CTR (Konversi)</span>
                  <b className="text-emerald-400">{(c.conversionRate || 0).toFixed(1)}%</b>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-slate-550 font-mono">Batas Harian: ${c.dailyBudget.toFixed(2)}</span>
                <span className="font-mono font-bold text-slate-300">
                  Total Spent: ${c.spent.toFixed(2)} / <span className="text-slate-500">${c.totalBudget.toFixed(0)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW AD CAMPAIGN FORM (WITH TARGETING AND MULTI BUDGETS) */}
      <form onSubmit={handleCreateCampaign} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
        <h5 className="text-[10px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1 text-[#F5A623] border-b border-slate-900 pb-1.5">
          <Plus size={11} /> Pasang Promosi Ads & Pasang Target Khusus
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div>
            <label className="text-slate-500 text-[9.5px] block mb-1 uppercase font-mono">{dict.nameInput}:</label>
            <input 
              type="text"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              placeholder="e.g. Kain Tais Adat premium"
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2.5 py-1.5 focus:border-yellow-500 outline-none placeholder-slate-700 font-medium text-xs"
              required
            />
          </div>

          <div>
            <label className="text-slate-500 text-[9.5px] block mb-1 uppercase font-mono">{dict.typeInput}:</label>
            <select
              value={adType}
              onChange={(e) => setAdType(e.target.value as any)}
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2 py-1.5 outline-none font-medium text-xs cursor-pointer focus:border-yellow-500"
            >
              <option value="Display Banner">Display Banner (Est: $0.15 CPC)</option>
              <option value="Promosi Prioritas">Featured / Prioritas (Est: $0.50 CPC)</option>
            </select>
          </div>

          {/* TARGETING PARAMETERS */}
          <div>
            <label className="text-slate-550 text-[9.5px] block mb-1 uppercase font-mono">Target Lokasi Audien:</label>
            <select
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value as any)}
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2 py-1.5 outline-none font-semibold text-xs cursor-pointer focus:border-yellow-500"
            >
              <option value="Dili">Dili (Capital Area)</option>
              <option value="Ermera">Ermera (Coffee Fields Area)</option>
              <option value="Baucau">Baucau (Second Big Area)</option>
              <option value="Semua">Semua Wilayah Timor-Leste</option>
            </select>
          </div>

          <div>
            <label className="text-slate-550 text-[9.5px] block mb-1 uppercase font-mono">Target Kategori Produk:</label>
            <select
              value={targetCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2 py-1.5 outline-none font-semibold text-xs cursor-pointer focus:border-yellow-500"
            >
              <option value="Kopi Timor">Kopi Timor (Raw/Roasted)</option>
              <option value="Tais Tenun">Tais Kain Tenun & Kerajinan</option>
              <option value="Handcraft">Kerajinan Tangan Tradisional</option>
              <option value="Suku Cadang">Suku Cadang Motor & Otomotif</option>
              <option value="Semua Kategori">Semua Kategori Listing</option>
            </select>
          </div>

          {/* BUDGETS: DAILY AND TOTAL BUDGET */}
          <div>
            <label className="text-slate-505 text-[9.5px] block mb-1 uppercase font-mono">Budget Harian ($/hari):</label>
            <input 
              type="number"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              min="1"
              placeholder="e.g. 5"
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2.5 py-1.5 focus:border-yellow-500 outline-none font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="text-slate-505 text-[9.5px] block mb-1 uppercase font-mono">Total Budget Kampanye ($):</label>
            <input 
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              min="5"
              placeholder="e.g. 30"
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2.5 py-1.5 focus:border-yellow-500 outline-none font-mono text-xs"
              required
            />
          </div>

          {/* Optional fields for listing preview */}
          <div>
            <label className="text-slate-550 text-[9.5px] block mb-1 uppercase font-mono">Harga Jual Item ($):</label>
            <input 
              type="number"
              value={adPrice}
              onChange={(e) => setAdPrice(e.target.value)}
              placeholder="e.g. 150"
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2.5 py-1.5 focus:border-yellow-500 outline-none placeholder-slate-705 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-slate-555 text-[9.5px] block mb-1 uppercase font-mono">Tautan Gambar (Opsional):</label>
            <input 
              type="text"
              value={adImage}
              onChange={(e) => setAdImage(e.target.value)}
              placeholder="Saran: tempel link gambar unsplash"
              className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg text-white px-2.5 py-1.5 focus:border-yellow-500 outline-none placeholder-slate-705 text-xs font-sans"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#F5A623] hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all shadow-md shadow-amber-500/5 cursor-pointer mt-1"
        >
          {dict.submit}
        </button>
      </form>
    </div>
  );
}
