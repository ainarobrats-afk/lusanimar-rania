/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product } from "../types";
import { X, Tag, ListPlus, MapPin, AlignLeft, Calendar, HelpCircle, Video } from "lucide-react";

interface SellModalProps {
  onClose: () => void;
  onSubmitProduct: (product: Product) => void;
  onEmitCoin: (x: number, y: number) => void;
}

export default function SellModal({ onClose, onSubmitProduct, onEmitCoin }: SellModalProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<any>("local");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("Dili, Comoro");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState<number>(30); // Default 30 Days listing duration
  const [showMaps, setShowMaps] = useState(false);
  const [mapSearch, setMapSearch] = useState("");

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !price || !description.trim()) {
      alert("Harap lengkapi semua baris kolom!");
      return;
    }

    // Modern compliance filter for prohibited goods (Drugs, Weapons, Explicit, Scams, Gambling)
    const bannedKeywords = [
      "sabu", "ganja", "narkoba", "obat terlarang", "drugs", "weed", "marijuana", "heroin", "cocaine",
      "pistol", "senjata", "bom", "peluru", "ak47", "weapons", "explosives", "rifle", "gun", "ammo",
      "porno", "porn", "dewasa", "adult", "sex", "hentai", "gambling", "judi", "slot gacor", "hack", "virus",
      "scam", "penipuan", "phishing", "investasi bodong", "piracy"
    ];
    
    const combinedContent = (title + " " + description + " " + (category === "other" ? customCategory : "")).toLowerCase();
    const foundBanned = bannedKeywords.filter(keyword => combinedContent.includes(keyword));
    
    if (foundBanned.length > 0) {
      alert(`⚠️ POSTING AD DITOLAK OLEH KEAMANAN RANIA AI!\n\nIklan Anda terdeteksi melanggar standar keselamatan (Ditemukan: "${foundBanned.join(", ")}").\n\nSanimar secara ketat melarang promosi narkoba dan zat terlarang, senjata api, perjudian liar, pornografi, dsb sesuai regulasi BCTL & Kepolisian Timor Plaza!`);
      return;
    }

    if (category === "other" && !customCategory.trim()) {
      alert("Harap tulis nama kategori produk kustom Anda!");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Harga barang harus berupa angka positif!");
      return;
    }

    const finalCategory = category === "other" ? customCategory.trim() : category;

    // Default beautiful fallback images depending on chosen categories
    let image = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"; // Default marketplace image
    if (finalCategory === "property") {
      image = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80";
    } else if (finalCategory === "vehicle") {
      image = "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=500&q=80";
    } else if (finalCategory === "local") {
      image = "https://images.unsplash.com/photo-1617631493876-d37f44a867b8?auto=format&fit=crop&w=500&q=80";
    } else if (finalCategory === "job") {
      image = "https://images.unsplash.com/photo-1521791136368-1a46827d0adb?auto=format&fit=crop&w=500&q=80";
    } else if (finalCategory === "tech") {
      image = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80";
    } else if (finalCategory === "food") {
      image = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80";
    }

    const newProduct: Product = {
      id: `p_added_${Date.now()}`,
      title: title.trim(),
      price: priceNum,
      category: finalCategory,
      location: location.trim() || "Dili, Timor-Leste",
      badges: ["pending", "verified"], // Displays approval tag!
      sellerName: "Lee Soares (Kamu)",
      rating: 5.0,
      description: description.trim(),
      image: image,
      expiryDays: duration,
      videoUrl: videoUrl.trim() || undefined
    };

    onSubmitProduct(newProduct);
    onClose();

    // Spawn 10 flying coins celebrations!
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        onEmitCoin(window.innerWidth / 2, window.innerHeight / 2 - 100);
      }, i * 150);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[180] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      
      <form 
        onSubmit={handlePublish}
        className="w-full max-w-lg bg-[#0F1420] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 relative max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top visual divider representing signature tales colorful pattern */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F5A623] via-[#E63946] to-[#3B82F6]" />

        {/* Close button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-1.5">
            <ListPlus className="text-[#3B82F6]" size={18} /> Pasang Iklan Baru ("Jual")
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs font-normal">
          {/* Pendings information warning */}
          <div className="bg-[#F5A623]/10 border border-[#F5A623]/35 rounded-xl p-3 text-slate-300">
            🔒 <b>Sistem Kurasi Otomatis:</b> Setiap iklan baru yang diterbitkan akan langsung terpasang sebagai status <b>Pending Approval</b> (Tayang terbatas) selama 5-10 menit sebelum divalidasi oleh Tim kurator Sanimar di Dili. 
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block flex items-center gap-1">Judul Dagangan</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Contoh: "Sepeda Motor Scoopy 2019 Dili Murah"' 
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Price */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block flex items-center gap-1">Harga (USD $)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Harga dalam Dolar" 
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-600 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block flex items-center gap-1">Kategori</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="property">🏠 Rumah & Tanah</option>
                <option value="vehicle">🏍️ Otomotif (Motor/Mobil)</option>
                <option value="local">🇹🇱 Produk Lokal Timor</option>
                <option value="job">💼 Lowongan Kerja</option>
                <option value="tech">📱 Elektronik & HP</option>
                <option value="food">🍲 Bahan Pangan / Kopi</option>
                <option value="other">⚙️ Lain-Lain (Kustom)</option>
              </select>
            </div>
          </div>

          {/* Conditional Custom Category Input */}
          {category === "other" && (
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-3 space-y-1.5 animate-fade-in">
              <label className="text-amber-400 font-bold block flex items-center gap-1">
                ✏️ Tulis Nama Produk / Kategori Kustom:
              </label>
              <input 
                type="text" 
                value={customCategory} 
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Contoh: Sepatu Kulit, Alat Musik, Kursi rotan..." 
                className="w-full bg-[#111827] border border-amber-600/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 outline-none focus:border-amber-500 text-xs"
                required
              />
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-semibold block flex items-center gap-1">
                📍 Lokasi Pengiriman / COD (Tulis Bebas)
              </label>
              <button 
                type="button"
                onClick={() => setShowMaps(!showMaps)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline active:scale-95 transition-all"
              >
                🗺️ {showMaps ? "Sembunyikan Peta" : "Pilih via Google Maps"}
              </button>
            </div>
            
            {/* Manual text input - people can write whatever they want! */}
            <div className="space-y-2">
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Dili (Fatuhada), Ermera, atau Baucau..." 
                className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] text-slate-400 font-mono block">Latitude Google Maps (GPS)</label>
                  <input 
                    type="text" 
                    placeholder="-8.5568" 
                    className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-350 outline-none focus:border-blue-500 font-mono"
                    onChange={(e) => {
                      if (e.target.value) {
                        const baseLoc = location.split(" (GPS:")[0];
                        setLocation(`${baseLoc} (GPS: ${e.target.value}, 125.57)`);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-slate-400 font-mono block">Longitude Google Maps (GPS)</label>
                  <input 
                    type="text" 
                    placeholder="125.5739" 
                    className="w-full bg-[#111827] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-350 outline-none focus:border-blue-500 font-mono"
                    onChange={(e) => {
                      if (e.target.value) {
                        const baseLoc = location.split(" (GPS:")[0];
                        setLocation(`${baseLoc} (GPS: -8.55, ${e.target.value})`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Google Maps Interactive Selector */}
            {showMaps && (
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/60 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-blue-400 flex items-center gap-1">🌐 Google Maps Timor-Leste</span>
                  <span>Klik pada pin/wilayah untuk memilih</span>
                </div>

                {/* Simulated Map Container */}
                <div className="relative w-full h-44 bg-[#0a0f1d] border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-end">
                  {/* Grid lines to simulate map coordinates */}
                  <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                  
                  {/* Styled bay/sea background */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-blue-950/40 border-b border-blue-900/30 flex items-center justify-center">
                    <span className="text-[10px] tracking-wider text-blue-700/60 font-semibold font-mono">SELAT WETAR</span>
                  </div>

                  {/* Timor Island Contour illustration */}
                  <div className="absolute inset-x-2 bottom-2 top-10 bg-slate-800/25 border border-slate-700/30 rounded-t-3xl flex items-center justify-center">
                    <span className="absolute bottom-2 right-4 text-[9px] tracking-widest text-slate-600 font-semibold font-mono">TIMOR ISLAND</span>
                  </div>

                  {/* Interactive Map Nodes/Pins */}
                  {[
                    { name: "Dili, Comoro (Airport Area)", x: "12%", y: "42%", color: "bg-red-500" },
                    { name: "Dili, Colmera Central", x: "32%", y: "38%", color: "bg-blue-500" },
                    { name: "Dili, Cristo Rei Beach", x: "48%", y: "24%", color: "bg-emerald-500" },
                    { name: "Dili, Becora District", x: "55%", y: "52%", color: "bg-amber-500" },
                    { name: "Baucau Villa (Old Town)", x: "82%", y: "45%", color: "bg-violet-500" },
                    { name: "Ermera, Gleno (Kopi Zone)", x: "22%", y: "75%", color: "bg-orange-500" },
                    { name: "Liquica Coast", x: "5%", y: "58%", color: "bg-cyan-500" }
                  ].map((pin) => (
                    <button
                      key={pin.name}
                      type="button"
                      onClick={() => setLocation(pin.name)}
                      className="absolute group cursor-pointer text-white p-1 hover:scale-110 active:scale-95 transition-all text-left"
                      style={{ left: pin.x, top: pin.y }}
                      title={`Klik untuk memilih ${pin.name}`}
                    >
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pin.color} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pin.color}`}></span>
                      </span>
                      {/* Tooltip name */}
                      <span className="absolute left-1/2 -translate-x-1/2 -top-6 scale-0 group-hover:scale-100 transition-all bg-slate-900 border border-slate-700 text-[10px] py-0.5 px-2 rounded whitespace-nowrap pointer-events-none z-10 font-bold shadow-md">
                        {pin.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}

                  {/* Map Pin Selector feedback */}
                  <div className="absolute top-1 right-2 bg-slate-950/80 border border-slate-800 rounded px-2 py-0.5 pointer-events-none font-mono text-[9px] text-[#2BD366]">
                    ● GPS ACTIVE
                  </div>

                  <div className="p-2 bg-slate-950/90 border-t border-slate-800/80 text-[10px] text-slate-300 flex justify-between items-center z-10">
                    <span className="truncate">🎯 Terpilih: <strong className="text-green-400">{location}</strong></span>
                    <button 
                      type="button"
                      onClick={() => setLocation("Dili, Timor-Leste")}
                      className="text-[9px] text-blue-400 hover:underline shrink-0 font-medium"
                    >
                      Reset Pusat
                    </button>
                  </div>
                </div>

                {/* Helper suggestion buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 self-center">Rekomendasi:</span>
                  {["Dili (Colmera)", "Oecusse", "Ermera", "Kupang - Lintas Batas"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setLocation(tag)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-2 py-0.5 rounded-lg border border-slate-700/50"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block flex items-center gap-1">Penjelasan Kondisi Produk</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Jelaskan kondisi barang secara jujur. Contoh: kilometer motor, ketahanan tenun, rasa kopi, syarat administrasi..." 
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Video URL Link Submission */}
          <div className="space-y-1 bg-blue-950/20 border border-blue-900/40 p-3 rounded-2xl">
            <label className="text-blue-400 font-semibold block flex items-center gap-1.5">
              <Video size={13} className="text-[#3B82F6]" /> YouTube, Facebook, or TikTok Video URL (Opsional)
            </label>
            <input 
              type="url" 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste link video promosi/promotional video Anda..." 
              className="w-full bg-[#111827] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-blue-500 text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500 block leading-tight">
              Biarkan kosong jika tidak ada video. Menyertakan video meningkatkan interaksi penjualan hingga 400% di seluruh dunia!
            </span>
          </div>

          {/* Duration packages list selection */}
          <div className="space-y-2">
            <label className="text-slate-400 font-semibold block">Paket Masa Tayang Iklan</label>
            <div className="grid grid-cols-3 gap-2">
              <div 
                onClick={() => setDuration(7)}
                className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${
                  duration === 7 
                    ? "border-blue-500 bg-blue-550/10 text-white" 
                    : "border-slate-800 bg-[#111827] hover:border-slate-700 text-slate-400"
                }`}
              >
                <b className="block text-sm">7 Hari</b>
                <span className="text-[9px] block text-[#2BD366]">GRATIS</span>
              </div>

              <div 
                onClick={() => setDuration(30)}
                className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${
                  duration === 30 
                    ? "border-blue-500 bg-blue-550/10 text-white" 
                    : "border-slate-800 bg-[#111827] hover:border-slate-700 text-slate-400"
                }`}
              >
                <b className="block text-sm">30 Hari</b>
                <span className="text-[9px] block text-[#F5A623]">Premium $0.10</span>
              </div>

              <div 
                onClick={() => setDuration(90)}
                className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${
                  duration === 90 
                    ? "border-blue-500 bg-blue-550/10 text-white" 
                    : "border-slate-800 bg-[#111827] hover:border-slate-700 text-slate-400"
                }`}
              >
                <b className="block text-sm">90 Hari</b>
                <span className="text-[9px] block text-[#F5A623]">Pro Ads $0.18</span>
              </div>
            </div>
          </div>

          {/* Publish action */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-white py-3.5 mt-2 rounded-xl font-bold font-body text-xs shadow-lg transition-all"
          >
            🚀 Terbitkan Ad Sekarang
          </button>
        </div>

      </form>

    </div>
  );
}
