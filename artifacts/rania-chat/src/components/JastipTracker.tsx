/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Bus, Search, Calculator, History, Radio } from "lucide-react";

interface TrackStep {
  title: string;
  location: string;
  time: string;
  status: "completed" | "active" | "incoming";
}

interface JastipRoute {
  id: string;
  sender: string;
  recipient: string;
  type: "Jastip" | "Ekspor";
  origin: string;
  destination: string;
  item: string;
  weight: string;
  status: string;
  progress: number;
  steps: TrackStep[];
}

export default function JastipTracker({ lang, onEmitCoin }: { lang: "tet" | "id" | "en" | "pt", onEmitCoin: (x: number, y: number) => void }) {
  const [trackNumber, setTrackNumber] = useState("SNM-KPG-7798");
  const [activeRoute, setActiveRoute] = useState<JastipRoute | null>(null);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>(["SNM-KPG-7798"]);

  // Calculator states
  const [calcWeight, setCalcWeight] = useState("5");
  const [calcRoute, setCalcRoute] = useState("Kupang - Dili");
  const [calcResult, setCalcResult] = useState<number | null>(15);

  // MOCK TRACKING DATA COUPLING EXCLUSIVE ROUTES (Indonesia to Timor & Timor to Global)
  const [mockRoutes, setMockRoutes] = useState<Record<string, JastipRoute>>({
    "SNM-KPG-7798": {
      id: "SNM-KPG-7798",
      sender: "Budi Santoso (Kupang, NTT)",
      recipient: "Lee Soares (Dili, Comoro)",
      type: "Jastip",
      origin: "Kupang (Terminal Bimoku)",
      destination: "Dili (Terminal Comoro via Bus)",
      item: "Suku Cadang Motor Honda & Laptop Asus",
      weight: "12 Kg",
      status: "Dalam Perjalanan Bus (Perbatasan Wini)",
      progress: 65,
      steps: [
        { title: "Paket Diterima di Loket Agen", location: "Kupang Hub", time: "20 Juni 2026, 09:00", status: "completed" },
        { title: "Kargo Dipisahkan & Dimuat ke Bagasi Bus", location: "Kupang Terminal Bimoku", time: "20 Juni 2026, 14:00", status: "completed" },
        { title: "Pemeriksaan Bea Cukai PLBN Wini", location: "Perbatasan Indonesia - TL", time: "21 Juni 2026, 11:30", status: "active" },
        { title: "Tiba di Loket Sanimar Terminal Comoro", location: "Dili, Timor-Leste", time: "Estimasi Sore Ini", status: "incoming" }
      ]
    },
    "SNM-EXP-4112": {
      id: "SNM-EXP-4112",
      sender: "Koperativa Kafé Timor (Dili)",
      recipient: "Silva Pereira (Lisbon, Portugal)",
      type: "Ekspor",
      origin: "Dili Port (Timor-Leste)",
      destination: "Port of Lisbon (Portugal)",
      item: "Kopi Arabika Organik Ermera - Raw Green Beans",
      weight: "250 Kg (5 Karung)",
      status: "Kapal Kontainer Transit Singapore",
      progress: 45,
      steps: [
        { title: "Barang Masuk Gudang Ekspor", location: "Kawasan Industri Dili", time: "12 Juni 2026, 08:00", status: "completed" },
        { title: "Pabean & Sertifikasi Kopi Madu OK", location: "Dili Customs, Timor-Leste", time: "14 Juni 2026, 10:30", status: "completed" },
        { title: "Muat Kontainer Transit Internasional", location: "Singapura Port Terminal 3", time: "18 Juni 2026, 16:45", status: "active" },
        { title: "Tiba di Port of Lisbon & Kurir Darat", location: "Portugal", time: "Estimasi 28 Juni 2026", status: "incoming" }
      ]
    },
    "SNM-DLI-9055": {
      id: "SNM-DLI-9055",
      sender: "Tais Weaving Coop (Ermera)",
      recipient: "Gillian Smith (Darwin, Australia)",
      type: "Ekspor",
      origin: "Aero-Dili Cargo Hub",
      destination: "Darwin International Airport",
      item: "Syal Tenun Tais Adat Premium Handwoven",
      weight: "1.5 Kg",
      status: "Selesai Dikirim",
      progress: 100,
      steps: [
        { title: "Serah Terima Kurir Lokal Sanimar", location: "Ermera, Timor-Leste", time: "19 Juni 2026, 13:00", status: "completed" },
        { title: "Inspeksi Karantina & Clearance", location: "Bandara Internasional Nicolau Lobato", time: "19 Juni 2026, 16:00", status: "completed" },
        { title: "Cargo Flight Aero-Dili", location: "Selat Wetar Transit Space", time: "20 Juni 2026, 08:00", status: "completed" },
        { title: "Paket Sukses Diterima Pembeli", location: "Darwin CBD, Australia", time: "20 Juni 2026, 11:30", status: "completed" }
      ]
    }
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackNumber.trim()) return;
    
    setSearched(true);
    const code = trackNumber.trim().toUpperCase();
    const found = mockRoutes[code];
    if (found) {
      setActiveRoute(found);
      if (!history.includes(code)) {
        setHistory(prev => [code, ...prev]);
      }
      onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      setActiveRoute(null);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(calcWeight) || 0;
    let rate = 3; // default Kupang - Dili $3/kg via Bus
    if (calcRoute === "Dili - Darwin (Air)") rate = 15;
    else if (calcRoute === "Dili - Lisbon (Sea)") rate = 8;
    else if (calcRoute === "Dili - Singapore (Sea)") rate = 5;

    const total = w * rate;
    setCalcResult(total);
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  // Simulate updating step real-time
  const handleSimulateRealtimeUpdate = () => {
    if (!activeRoute) return;
    const code = activeRoute.id;
    
    setMockRoutes(prev => {
      const current = prev[code];
      if (!current) return prev;
      
      const nextProgress = Math.min(100, current.progress + 15);
      let nextStatus = current.status;
      const nextSteps = [...current.steps];

      if (nextProgress >= 100) {
        nextStatus = "Selesai Dikirim & Diterima";
        for (let i = 0; i < nextSteps.length; i++) {
          nextSteps[i] = { ...nextSteps[i], status: "completed" as const };
        }
      } else if (nextProgress >= 80) {
        nextStatus = "Kurir Lokal Menuju Alamat Penerima";
        if (nextSteps[3]) nextSteps[3].status = "active";
        for (let i = 0; i < 3; i++) {
          if (nextSteps[i]) nextSteps[i].status = "completed" as const;
        }
      } else if (nextProgress >= 50) {
        nextStatus = "Pabean Berhasil Dilewati; Masuk Transit Hub Utama";
        if (nextSteps[2]) nextSteps[2].status = "active";
        for (let i = 0; i < 2; i++) {
          if (nextSteps[i]) nextSteps[i].status = "completed" as const;
        }
      }

      const updatedRoute: JastipRoute = {
        ...current,
        progress: nextProgress,
        status: nextStatus,
        steps: nextSteps
      };

      // Set state to trigger UI update
      setTimeout(() => {
        setActiveRoute(updatedRoute);
      }, 50);

      return {
        ...prev,
        [code]: updatedRoute
      };
    });

    alert("Simulasi real-time Terkirim! Status transit terbaru disimulasikan melalui API terintegrasi.");
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  const dict = {
    tet: {
      hdr: "🔒 JASTIP & EKSPOR LOGISTIK INTERNASIONAL",
      desc: "Koneksyon karga hosi Kupang (Indonesia) ba Dili (Timor) ho via Bus mós Ekspor lokal ba tasi-klotok (Australia, Portugal).",
      btn: "Buka Reis",
      placeholder: "Kopia / ketik no. Jastip (ex: SNM-KPG-7798)...",
      routeDetails: "Detallu Viajen Paket",
      item: "Sasán titip",
      type: "Kategoria",
      weight: "Peso total",
      shipper: "Penerbit",
      recipient: "Kliente simu",
      status: "Pozisaun Agora",
      notFound: "Kodigu Paket la hetan! Purfavor koko ho: SNM-KPG-7798, SNM-EXP-4112 ka SNM-DLI-9055.",
      calcTitle: "Kalkulador Ongkos Kirim Internasional (Automatic Calc)",
      calcBtn: "Kalkula Ongkir",
      hist: "Uluk Hetan Reis (Sanimar Tracker History)"
    },
    id: {
      hdr: "🔒 PELACAKAN JASTIP & EKSPOR KARGO",
      desc: "Menghubungkan perdagangan logistik Kupang ke Dili via Bus pariwisata serta ekspor komoditas lokal (Kopi, Tais) ke pasar dunia.",
      btn: "Lacak Paket",
      placeholder: "Masukkan No. resi (Contoh: SNM-KPG-7798)...",
      routeDetails: "Rincian Transit & Logistik",
      item: "Barang Kiriman",
      type: "Jenis Kiriman",
      weight: "Berat",
      shipper: "Pengirim",
      recipient: "Penerima",
      status: "Status Terkini",
      notFound: "Nomor resi tidak ditemukan di sistem kargo. Silakan coba: SNM-KPG-7798, SNM-EXP-4112, atau SNM-DLI-9055.",
      calcTitle: "Kalkulator Ongkos Kirim Otomatis",
      calcBtn: "Hitung Ongkir",
      hist: "Riwayat Pelacakan Anda"
    },
    en: {
      hdr: "🔒 CROSS-BORDER JASTIP & EXPORT TRACKER",
      desc: "Track fast transit cargo from Kupang to Dili via Bus partners, alongside direct global exports (Tais, Coffee) to Europe & Australia.",
      btn: "Track Cargo",
      placeholder: "Enter waybill number (Try: SNM-KPG-7798)...",
      routeDetails: "Cargo Waybill Specification",
      item: "Declared Item",
      type: "Service Type",
      weight: "Net Weight",
      shipper: "Shipper",
      recipient: "Consignee",
      status: "Live Progress Status",
      notFound: "Waybill code not found. Please try simulating with: SNM-KPG-7798, SNM-EXP-4112 or SNM-DLI-9055.",
      calcTitle: "International Shipping Rate Estimator",
      calcBtn: "Calculate Shipping Cost",
      hist: "Your Waybill History Logs"
    },
    pt: {
      hdr: "🔒 SEGUIMENTO DE LOGÍSTICA JASTIP & EXPORTAÇÃO",
      desc: "Rastreio rápido de encomendas de Kupang para Díli através das rotas de autocarros, bem como exportação internacional para o exterior.",
      btn: "Rastrear",
      placeholder: "Introduza nº de seguimento (Ex: SNM-KPG-7798)...",
      routeDetails: "Especificação da Carga Transitada",
      item: "Artigo Declarado",
      type: "Tipo de Serviço",
      weight: "Peso Líquido",
      shipper: "Expedidor",
      recipient: "Destinatário",
      status: "Localização Atual",
      notFound: "Nenhum código encontrado. Experimente: SNM-KPG-7798 ou SNM-EXP-4112.",
      calcTitle: "Calculadora de Preços de Encomendas",
      calcBtn: "Calcular Custos",
      hist: "Histórico de Encomendas Rastiadas"
    }
  }[lang] || {
    hdr: "🔒 PELACAKAN JASTIP & EKSPOR KARGO",
    desc: "Menghubungkan perdagangan logistik Kupang ke Dili via Bus pariwisata serta ekspor komoditas lokal.",
    btn: "Lacak Paket",
    placeholder: "Masukkan No. resi...",
    routeDetails: "Rincian Transit",
    item: "Barang Kiriman",
    type: "Jenis Kiriman",
    weight: "Berat",
    shipper: "Pengirim",
    recipient: "Penerima",
    status: "Status Terkini",
    notFound: "Nomor resi tidak ditemukan. Coba: SNM-KPG-7798 atau SNM-EXP-4112.",
    calcTitle: "Kalkulator Ongkos Kirim",
    calcBtn: "Kalkulasi",
    hist: "Riwayat Lacak"
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <Bus size={18} className="animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            {dict.hdr}
          </h4>
          <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
            {dict.desc}
          </p>
        </div>
      </div>

      {/* CALCULATOR PANEL */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-3">
        <div className="space-y-2">
          <h5 className="text-[10.5px] font-bold text-slate-350 uppercase font-mono flex items-center gap-1.5">
            <Calculator size={13} className="text-blue-400" /> {dict.calcTitle}
          </h5>
          
          <form onSubmit={handleCalculate} className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-slate-500 text-[9px] block mb-1 uppercase font-mono">Berat Paket (kg)</label>
              <input 
                type="number"
                step="0.1"
                min="0.1"
                value={calcWeight}
                onChange={(e) => setCalcWeight(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-white outline-none focus:border-blue-500/80"
                required
              />
            </div>
            <div>
              <label className="text-slate-500 text-[9px] block mb-1 uppercase font-mono">Rute Pengiriman</label>
              <select 
                value={calcRoute}
                onChange={(e) => setCalcRoute(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-slate-800 rounded-lg px-1.5 py-1.5 font-medium text-white outline-none cursor-pointer focus:border-blue-500/80"
              >
                <option value="Kupang - Dili">Kupang - Dili (Bus: $3/kg)</option>
                <option value="Dili - Darwin (Air)">Dili - Darwin (Kargo Udara: $15/kg)</option>
                <option value="Dili - Singapore (Sea)">Dili - Singapore (Kapal Laut: $5/kg)</option>
                <option value="Dili - Lisbon (Sea)">Dili - Lisbon (Kargo Laut: $8/kg)</option>
              </select>
            </div>
            <div className="col-span-2">
              <button 
                type="submit"
                className="w-full bg-blue-650 hover:bg-blue-650 text-white font-bold text-[10px] py-1.8 rounded-lg cursor-pointer transition-colors"
              >
                {dict.calcBtn}
              </button>
            </div>
          </form>

          {calcResult !== null && (
            <div className="p-2 bg-blue-950/25 border border-blue-500/20 rounded-lg text-center flex items-center justify-between text-xs">
              <span className="text-slate-400">Estimasi Biaya Ongkir ({calcWeight} kg):</span>
              <strong className="text-emerald-400 font-mono text-xs">${calcResult.toFixed(2)} USD</strong>
            </div>
          )}
        </div>
      </div>

      {/* TRACKING SYSTEM SEARCH */}
      <div className="space-y-2">
        <span className="text-[9.5px] text-slate-550 block font-mono uppercase">Cari & Lacak Status Pengiriman</span>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder={dict.placeholder}
              className="w-full bg-[#0B0F1A] border border-slate-800 focus:border-blue-500 pl-8.5 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-650 outline-none font-mono"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-colors shrink-0"
          >
            {dict.btn}
          </button>
        </form>
      </div>

      {/* Suggested Quick Presets */}
      <div className="flex flex-wrap gap-1.5 pt-0.5 select-none text-[10px]">
        <span className="text-[9.5px] text-slate-500 font-mono flex items-center">Presets cepat:</span>
        {["SNM-KPG-7798", "SNM-EXP-4112", "SNM-DLI-9055"].map(code => (
          <button
            key={code}
            type="button"
            onClick={() => { setTrackNumber(code); setSearched(true); setActiveRoute(mockRoutes[code]); }}
            className={`text-[9.5px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
              trackNumber === code 
                ? "border-blue-500 bg-blue-950/40 text-blue-300 font-semibold" 
                : "border-slate-850 bg-slate-900 text-slate-400 hover:text-slate-350"
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      {searched && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 animate-fade-in text-[11px]">
          {activeRoute ? (
            <div className="space-y-4">
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 space-y-2">
                <div className="flex justify-between items-baseline border-b border-slate-900 pb-1.5">
                  <span className="font-bold text-white uppercase font-mono tracking-wider">{dict.routeDetails}</span>
                  <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded ${
                    activeRoute.type === "Jastip" ? "bg-orange-600/15 text-orange-400" : "bg-purple-600/15 text-purple-400"
                  }`}>{activeRoute.type}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div>
                    <span className="text-slate-550 block">Barang:</span>
                    <span className="font-medium text-slate-200">{activeRoute.item}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Berat:</span>
                    <span className="font-medium text-slate-200 font-mono">{activeRoute.weight}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Pengirim:</span>
                    <span className="font-medium text-slate-300">{activeRoute.sender}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Penerima:</span>
                    <span className="font-medium text-slate-300">{activeRoute.recipient}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="text-slate-550 block text-[9.5px] uppercase font-mono">{dict.status}:</span>
                    <span className="text-xs font-bold text-[#F5A623] inline-flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                      {activeRoute.status}
                    </span>
                  </div>
                  {activeRoute.progress < 100 && (
                    <button
                      type="button"
                      onClick={handleSimulateRealtimeUpdate}
                      className="bg-orange-600 hover:bg-orange-500 text-slate-950 font-black text-[9px] px-2 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Radio size={9} className="animate-pulse" /> Simulasikan Update Real-time
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 px-1">
                <div className="flex justify-between text-[9px] text-slate-550 uppercase font-mono">
                  <span>{activeRoute.origin}</span>
                  <span>{activeRoute.destination}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${activeRoute.progress}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block text-right font-mono font-bold">{activeRoute.progress}% Selesai Sesuai Peta Transit</span>
              </div>

              {/* Stepper details */}
              <div className="space-y-3 pl-3.5 relative border-l border-slate-800 ml-1.5 pt-1">
                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    {/* Circle marker */}
                    <span className={`absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                      step.status === "completed" 
                        ? "bg-emerald-500 border-emerald-500" 
                        : step.status === "active"
                        ? "bg-blue-600 border-blue-400 animate-pulse"
                        : "bg-slate-950 border-slate-800"
                    }`} />
                    
                    <h5 className={`font-semibold text-[11px] leading-tight ${
                      step.status === "completed" 
                        ? "text-slate-300 animate-pulse" 
                        : step.status === "active"
                        ? "text-blue-400 font-bold"
                        : "text-slate-550"
                    }`}>
                      {step.title}
                    </h5>
                    <div className="flex justify-between items-baseline text-[9.5px] text-slate-500 font-mono">
                      <span>📍 {step.location}</span>
                      <span>{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-950/15 border border-red-900/30 text-rose-400 text-center rounded-xl font-medium leading-relaxed font-mono">
              ⚠️ {dict.notFound}
            </div>
          )}
        </div>
      )}

      {/* TRACKING HISTORY BOX */}
      {history.length > 0 && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 font-mono text-[10px]">
          <span className="text-slate-500 font-bold flex items-center gap-1 uppercase">
            <History size={12} className="text-slate-400" /> {dict.hist}
          </span>
          <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto">
            {history.map(code => (
              <button
                key={code}
                onClick={() => { setTrackNumber(code); setSearched(true); setActiveRoute(mockRoutes[code]); }}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-850 hover:bg-slate-850 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{code}</span>
                  <span className="text-slate-650">&bull;</span>
                  <span className="text-slate-400 truncate max-w-[150px]">{mockRoutes[code]?.item || "Cargo"}</span>
                </div>
                <span className="text-blue-400 text-[9px] font-bold">{mockRoutes[code]?.progress || 0}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
