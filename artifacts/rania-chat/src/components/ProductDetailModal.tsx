/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, Comment } from "../types";
import { DEFAULT_COMMENTS } from "../data";
import { 
  X, MessageSquare, Compass, Send, CheckCircle, Smartphone, 
  HelpCircle, CreditCard, ShieldCheck, Star, Users, MapPin, 
  Clock, Share2, CornerDownRight, ThumbsUp
} from "lucide-react";

interface ProductDetailModalProps {
  product: Product;
  walletBalance: number;
  onClose: () => void;
  onUpdateBalance: (newBalance: number) => void;
  onEmitCoin: (x: number, y: number) => void;
}

export default function ProductDetailModal({ 
  product, 
  walletBalance, 
  onClose, 
  onUpdateBalance, 
  onEmitCoin 
}: ProductDetailModalProps) {
  
  // Comment Thread State
  const [comments, setComments] = useState<Comment[]>(DEFAULT_COMMENTS);
  const [newCommentText, setNewCommentText] = useState("");

  // Nego (Bargain) screen state
  const [showNego, setShowNego] = useState(false);
  const [negoOffer, setNegoOffer] = useState("");
  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(product.price);
  const [bargainChat, setBargainChat] = useState<{ sender: "me" | "seller", text: string }[]>([
    { sender: "seller", text: "Halo! Ada yang bisa dibantu untuk barang ini? Terima kasih sudah mampir." }
  ]);

  // Checkout payment state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<"wallet" | "telemor" | "tt" | "va">("wallet");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedVa, setGeneratedVa] = useState<string | null>(null);

  // General helpers
  const shippingCost = product.badges.includes("local") ? 2 : product.badges.includes("jastip") ? 5 : product.badges.includes("ship") ? 8 : product.badges.includes("china") ? 12 : 3;
  const tax = Math.round(product.price * 0.025 * 100) / 100; // 2.5% local tax
  const finalTotalCost = negotiatedPrice + shippingCost + tax;

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const added: Comment = {
      id: `c_added_${Date.now()}`,
      name: "Lee Soares (Kamu)",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
      text: newCommentText.trim(),
      time: "Baru saja",
      likes: 0
    };

    setComments(prev => [...prev, added]);
    setNewCommentText("");
    
    // Reward comments
    onEmitCoin(window.innerWidth / 2, window.innerHeight - 150);
  };

  const handleSendNego = () => {
    const offerValue = parseFloat(negoOffer);
    if (isNaN(offerValue) || offerValue <= 0) {
      alert("Masukkan nilai penawaran yang valid dalam Dolar ($) ya!");
      return;
    }

    setBargainChat(prev => [...prev, { sender: "me", text: `Saya ingin menawar barang ini seharga $${offerValue}. Apakah bisa?` }]);
    setNegoOffer("");

    setTimeout(() => {
      // Bargain negotiation AI algorithm
      const originalPrice = product.price;
      const percentOfOriginal = (offerValue / originalPrice) * 100;

      let reply = "";
      if (percentOfOriginal >= 95) {
        reply = `Wah, Anda baik sekali! Deal, saya setuju dengan harga $${offerValue}. Langsung klik tombol beli ya, kupon hargamu sudah aktif!`;
        setNegotiatedPrice(offerValue);
      } else if (percentOfOriginal >= 80) {
        const counterOffer = Math.round((offerValue + originalPrice) / 2);
        reply = `Harga awal saya $${originalPrice}. Gimana kalau jalan tengah di $${counterOffer}? Itu sudah rugi tipis untuk saya.`;
        setNegotiatedPrice(counterOffer);
      } else if (percentOfOriginal >= 60) {
        const minOffer = Math.round(originalPrice * 0.9);
        reply = `Waduh, itu terlalu murah sekali! Maaf, paling mentok saya bisa lepas di harga $${minOffer}. Mau ka lae?`;
        setNegotiatedPrice(minOffer);
      } else {
        reply = "Maaf sekali, harga itu belum bisa. Silakan naikkan lagi penawarannya agar kita bisa deal!";
      }

      setBargainChat(prev => [...prev, { sender: "seller", text: reply }]);
      
      // Emit coin on bargaining action!
      onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);

    }, 1200);
  };

  const handleExecutePayment = () => {
    if (selectedPayMethod === "wallet") {
      if (walletBalance < finalTotalCost) {
        alert("Saldo Sanimar Wallet Anda tidak mencukupi! Silakan gunakan metode transfer atau Top Up saldo terlebih dahulu.");
        return;
      }
      
      // Deduct balance
      onUpdateBalance(walletBalance - finalTotalCost);
      setPaymentSuccess(true);

      // Flying coins celebratory loops
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          onEmitCoin(window.innerWidth / 2 + (Math.random() * 80 - 40), window.innerHeight / 2 + (Math.random() * 80 - 40));
        }, i * 80);
      }
    } else {
      // Simulate virtual account generation
      const code = `8891823${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedVa(code);
      setPaymentSuccess(true);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Halo, saya melihat produk Anda "${product.title}" di Sanimar Market seharga $${product.price}. Apakah barang ini masih tersedia?`);
    window.open(`https://wa.me/67077000000?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[150] flex flex-col justify-end sm:justify-center p-0 sm:p-4 selection:bg-slate-800">
      
      <div 
        className="w-full max-w-4xl bg-[#0F1420] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky top-up/close bar */}
        <div className="sticky top-0 right-0 z-40 bg-[#0F1420]/95 backdrop-blur px-4 pt-3 pb-3 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-[#F5A623]/20 text-[#F5A623] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              Sanimar Listing
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {product.id}</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Image & Badges */}
          <div>
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-900">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {product.badges.map((b, i) => (
                  <span 
                    key={i} 
                    className={`text-[9px] font-extrabold px-2 py-1 rounded shadow-md uppercase font-mono ${
                      b === "verified" ? "bg-blue-600 text-white" :
                      b === "local" ? "bg-[#F5A623] text-slate-950" :
                      b === "ship" ? "bg-green-600 text-white" :
                      b === "jastip" ? "bg-amber-700 text-white" :
                      "bg-indigo-600 text-white"
                    }`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Promotional Business Video Player */}
            {product.videoUrl && (() => {
              const getEmbedUrl = (url?: string) => {
                if (!url) return null;
                try {
                  const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                  const match = url.match(ytReg);
                  if (match && match[1]) {
                    return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
                  }
                } catch {
                  // Ignore
                }
                return null;
              };
              const embedUrl = getEmbedUrl(product.videoUrl);
              return (
                <div className="mt-4 bg-slate-900/80 border border-blue-500/35 rounded-xl p-3.5 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span className="flex items-center gap-1.5 font-sans tracking-wide">
                      <span className="animate-pulse w-2 h-2 rounded-full bg-red-500" />
                      🎥 PROMOSI VIDEO BISNIS / ADS
                    </span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      Live Stream
                    </span>
                  </div>
                  
                  {embedUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                      <iframe
                        src={embedUrl}
                        title="Sanimar Product Video Promo"
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-3.5 flex flex-col items-center text-center space-y-2.5">
                      <p className="text-[11px] text-slate-350 leading-relaxed font-light">
                        Merchant membagikan tautan video eksternal (TikTok, Facebook, atau Lainnya) untuk produk atau komoditas miliknya. Silakan kunjungi tautan untuk menonton:
                      </p>
                      <a
                        href={product.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#3B82F6] hover:bg-blue-600 text-white font-mono font-bold text-[10px] px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-md hover:scale-[1.01] active:scale-95"
                      >
                        <span>Kunjungi Video Promosi</span> 🔗
                      </a>
                      <span className="text-[9.5px] text-slate-500 truncate max-w-xs block font-mono">{product.videoUrl}</span>
                    </div>
                  )}
                  
                  <p className="text-[9.5px] text-slate-400 font-light leading-snug">
                    Tautan video di atas diverifikasi aman untuk ditonton dan diunggah secara bebas oleh semua user Sanimar Market di seluruh dunia demi meningkatkan eksposur usaha ekologi mikro!
                  </p>
                </div>
              );
            })()}

            {/* Seller profile box */}
            <div className="mt-4 bg-[#111827] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center font-bold text-[#fff] shrink-0">
                  {product.sellerName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1">{product.sellerName}</h4>
                  <p className="text-[10.5px] text-slate-400 flex items-center gap-1">
                    <Star size={11} className="text-[#F5A623] fill-[#F5A623]" /> Rating {product.rating} &bull; Verified Merchant
                  </p>
                </div>
              </div>
              <button 
                onClick={handleWhatsAppShare}
                className="bg-[#2BD366]/10 hover:bg-[#2BD366]/20 text-[#2BD366] border border-[#2BD366]/30 px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-colors flex items-center gap-1"
              >
                📱 WhatsApp
              </button>
            </div>

            {/* Expiry / Remaining duration details */}
            <div className="mt-3 text-[11px] text-slate-500 bg-slate-900/60 p-2 text-center rounded-lg border border-slate-800 flex items-center justify-center gap-1.5">
              <Clock size={12} className="text-[#F5A623]" /> Durasi Iklan Aktif: <b className="text-slate-300 font-mono">{product.expiryDays} Hari Lagi</b> (Akan Kedaluwarsa)
            </div>

            {/* Comments block */}
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-blue-400" /> Komentar Komunitas ({comments.length})
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-3 pr-1">
                {comments.map((comm) => (
                  <div key={comm.id} className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <img 
                      src={comm.avatar} 
                      alt={comm.name} 
                      className="w-7 h-7 rounded-full object-cover mt-0.5"
                    />
                    <div className="min-width-0 flex-1">
                      <div className="flex items-center justify-between">
                        <b className="text-xs text-slate-200">{comm.name}</b>
                        <span className="text-[9.5px] text-slate-500 font-mono">{comm.time}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">{comm.text}</p>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                        <button className="hover:text-[#E63946] flex items-center gap-1 transition-colors">
                          <ThumbsUp size={10} /> Suka ({comm.likes})
                        </button>
                        <span>Balas</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Write comment */}
              <form onSubmit={handlePostComment} className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-900">
                <input 
                  type="text" 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Tulis pendapat atau pertanyaanmu di sini..." 
                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none px-2 font-light"
                />
                <button 
                  type="submit" 
                  disabled={!newCommentText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg p-2 flex items-center justify-center transition-all cursor-pointer"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Pricing & Transactions */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-snug">{product.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <MapPin size={12} className="text-blue-400" /> {product.location}
                </span>
                <span className="text-slate-700">&bull;</span>
                <span className="text-[11px] bg-slate-900 px-2 py-0.5 text-slate-400 rounded-full font-sans uppercase font-semibold">
                  Kategori: {product.category}
                </span>
              </div>
            </div>

            {/* Big price display */}
            <div className="bg-[#111827] border border-slate-850 p-4 rounded-xl flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-mono block">Harga Penawaran</span>
                <span className="text-3xl font-display font-black text-white">$</span>
                <span className="text-3xl font-display font-black text-white tabular-nums">
                  {negotiatedPrice.toLocaleString()}
                </span>
                {negotiatedPrice !== product.price && (
                  <span className="text-[11px] ml-2 text-slate-400 line-through font-mono">
                    ${product.price}
                  </span>
                )}
              </div>
              
              {!showNego && !isCheckingOut && (
                <button 
                  onClick={() => setShowNego(true)}
                  className="bg-[#F5A623]/10 hover:bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  🤝 Tawar Harga ("Nego")
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-normal bg-slate-900/40 border border-slate-900/60 p-3 rounded-xl">
              {product.description}
            </p>

            {/* NEGO PANEL (BARGAINING IF OPENED) */}
            {showNego && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3 relative">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1 text-[#F5A623]">
                    🤝 Negosiasi Berlangsung
                  </span>
                  <button 
                    onClick={() => setShowNego(false)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Tutup
                  </button>
                </div>
                
                {/* Chat window between Buyer and Merchant */}
                <div className="max-h-32 overflow-y-auto space-y-2.5 p-2 bg-slate-900 rounded-lg text-[11px] scrollbar-none flex flex-col">
                  {bargainChat.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`max-w-[85%] rounded-xl px-2.5 py-1.5 leading-snug ${
                        m.sender === "me" 
                          ? "bg-blue-600 text-white self-end rounded-tr-none" 
                          : "bg-slate-850 text-slate-200 border border-slate-800 self-start rounded-tl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Input block */}
                <div className="flex gap-1.5 items-center">
                  <span className="text-sm text-slate-400 font-mono font-bold">$</span>
                  <input 
                    type="number" 
                    value={negoOffer}
                    onChange={(e) => setNegoOffer(e.target.value)}
                    placeholder={`Contoh: ${Math.round(product.price * 0.85)}`} 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-white placeholder-slate-600 outline-none focus:border-[#F5A623]"
                  />
                  <button 
                    onClick={handleSendNego}
                    className="bg-[#F5A623] hover:bg-[#D98204] text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center transition-colors shrink-0"
                  >
                    Minta Deal
                  </button>
                </div>
              </div>
            )}

            {/* BILLING / CHECKOUT CARD FRAME */}
            {!isCheckingOut ? (
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-blue-650 hover:bg-blue-600 hover:scale-[1.01] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-[0_4px_16px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
              >
                🛒 Lanjutkan ke Pembayaran
              </button>
            ) : !paymentSuccess ? (
              <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-4 space-y-4 animate-slide-up">
                <div className="flex justify-between items-baseline border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Perincian Tagihan</h4>
                  <button 
                    onClick={() => setIsCheckingOut(false)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Batal
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Harga Barang:</span>
                    <b className="text-slate-200 font-mono">${negotiatedPrice.toLocaleString()}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ongkos Kirim ({product.location}):</span>
                    <b className="text-slate-200 font-mono">${shippingCost}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pajak Negara Timor-Leste (2.5%):</span>
                    <b className="text-slate-200 font-mono">${tax.toLocaleString()}</b>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-800 pt-2 text-sm text-white">
                    <span>Total Keseluruhan:</span>
                    <b className="text-[#2BD366] font-display font-black leading-none">${finalTotalCost.toLocaleString()}</b>
                  </div>
                </div>

                {/* Method selector */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Pilih Metode Transaksi:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div 
                      onClick={() => setSelectedPayMethod("wallet")}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        selectedPayMethod === "wallet" 
                          ? "border-blue-500 bg-blue-650/10 text-blue-300" 
                          : "border-slate-800 bg-[#0B0F1A] hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      <CreditCard size={14} className="mb-0.5" />
                      <span>Sanimar Wallet</span>
                      <span className="text-[8.5px] mt-0.5 opacity-70">Saldo: ${walletBalance.toLocaleString()}</span>
                    </div>

                    <div 
                      onClick={() => setSelectedPayMethod("va")}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        selectedPayMethod === "va" 
                          ? "border-blue-500 bg-blue-650/10 text-blue-300" 
                          : "border-slate-800 bg-[#0B0F1A] hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      <Smartphone size={14} className="mb-0.5" />
                      <span>Transfer Bank VA</span>
                      <span className="text-[8.5px] mt-0.5 opacity-70">BNU / Mandiri Dili</span>
                    </div>
                  </div>
                </div>

                {/* Action purchase */}
                <button
                  onClick={handleExecutePayment}
                  className="w-full bg-[#2BD366] hover:bg-[#22A951] text-[#06210F] font-bold py-3 text-xs tracking-wide rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} /> Konfirmasi Pembayaran Aman
                </button>
              </div>
            ) : (
              // Payment Successful Confirmation Screen
              <div className="bg-[#111827] border border-green-600/30 p-4 rounded-xl space-y-4 text-center animate-scale-in">
                <div className="w-11 h-11 bg-green-950 text-[#2BD366] rounded-full flex items-center justify-center mx-auto mb-2 font-black text-lg">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Transaksi Berhasil!</h4>
                  {selectedPayMethod === "wallet" ? (
                    <div className="space-y-4 mt-2 text-xs text-left">
                      <p className="text-slate-400 text-center font-medium font-sans">
                        Saldo Wallet berhasil didebet. Notifikasi terdistribusi otomatis kepada penjual <b>{product.sellerName}</b> untuk memproses pengiriman produk ke <b>{product.location}</b>.
                      </p>
                      
                      {/* INTERACTIVE ESCROW STATE CONTROLLER CARD */}
                      <EscrowInteractionConsole 
                        finalTotalCost={finalTotalCost} 
                        product={product} 
                      />

                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Silakan selesaikan pembayaran ke nomor rekening Virtual Account berekor di bawah ini:
                      </p>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-dashed border-blue-500 font-mono text-base font-bold text-[#7CADFF] tracking-widest">
                        {generatedVa}
                      </div>
                      <span className="text-[9.5px] text-[#F5A623] block animate-pulse">
                        Sisa Waktu Pembayaran: 23 jam 59 menit
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-1.5">
                  <button 
                    onClick={() => {
                      setIsCheckingOut(false);
                      setPaymentSuccess(false);
                      setGeneratedVa(null);
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 py-2 text-xs rounded-lg transition-colors"
                  >
                    Beli Lagi
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 text-xs rounded-lg transition-colors font-bold"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            )}

            {/* Quick security trust policy */}
            <div className="text-[10px] text-slate-500 text-center leading-normal flex items-center justify-center gap-1 bg-[#111827]/30 py-2 rounded-lg pr-1">
              🔐 Rekening Bersama Sanimar &bull; Jaminan uang kembali 100% jika barang tidak sampai.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
