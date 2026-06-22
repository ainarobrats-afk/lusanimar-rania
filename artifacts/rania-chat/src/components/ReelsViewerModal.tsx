/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Heart, MessageSquare, Share2, Play, Pause, ShoppingCart, VolumeX, Volume2, Upload, MessageCircle, Send } from "lucide-react";
import { Product } from "../types";

interface ReelItem {
  id: string;
  title: string;
  image: string;
  price: string;
  productId: string;
  views?: string | number;
  likesCount?: number;
}

interface ReelsViewerProps {
  reel: ReelItem;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
  onEmitCoin: (x: number, y: number) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
}

interface UserComment {
  username: string;
  text: string;
  time: string;
}

export default function ReelsViewerModal({
  reel,
  products,
  onClose,
  onSelectProduct,
  onEmitCoin
}: ReelsViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 142);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [heartCounter, setHeartCounter] = useState(0);

  // Comments Tray States
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<UserComment[]>([
    { username: "filipe_tete", text: "Tenun tradisionál furak tebes! Hau hakarak sosa.", time: "2m lalu" },
    { username: "clara_dili", text: "B CTL standard compliance? Sangat aman beli di Sanimar.", time: "5m lalu" },
    { username: "agus_kpg", text: "Kopinya harum aromanya sampai NTT kak. Mantap!", time: "11m lalu" }
  ]);
  const [newCommentText, setNewCommentText] = useState("");

  // Upload simulasi states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReels, setUploadedReels] = useState<ReelItem[]>([]);

  // Realtime Views state
  const [viewCount, setViewCount] = useState<number>(() => {
    if (typeof reel.views === "string") {
      const parsed = parseFloat(reel.views.replace(/[^\d.]/g, ""));
      return isNaN(parsed) ? 1240 : Math.round(parsed * 1000);
    }
    return reel.views || 1845;
  });

  // Increment views slowly during review loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setViewCount(prev => prev + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Find the exact product associated with this reel
  const associatedProduct = products.find(p => p.id === reel.productId);

  // Spawn floating hearts
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const newHeart: FloatingHeart = {
        id: heartCounter,
        x: Math.floor(Math.random() * 80) + 10 // Random horizontal offset
      };
      setHeartCounter(prev => prev + 1);
      setHearts(prev => [...prev, newHeart]);

      // Remove after animation completes
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 1500);

    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, heartCounter]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEmitCoin(e.clientX, e.clientY);
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: UserComment = {
      username: "pembeli_sanimar",
      text: newCommentText.trim(),
      time: "Sekarang"
    };

    setCommentsList(prev => [...prev, newComment]);
    setNewCommentText("");
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  const handleDirectBuy = () => {
    if (associatedProduct) {
      onSelectProduct(associatedProduct);
    } else {
      alert("Produk tidak ditemukan di database!");
    }
  };

  // Video File Upload handler (simulates <30s check & publishing)
  const handleFileUploadAndPublish = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate 30 seconds constraints and uploading
    setIsUploading(true);
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            alert(`Sucesuu! File '${file.name}' berdurasi <30 detik sukses diunggah langsung dari gadget Anda. Video Anda kini terpasang langsung di reels feed jualan Sanimar! 🎬`);
            onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Social share integrations
  const triggerWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Halo teman-teman! Lihat video reels produk bagus "${reel.title}" seharga ${reel.price} ini di Sanimar! Bagus sekali untuk Layaway/Escrow: ${window.location.href}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    alert("Membagikan link ke WhatsApp!");
  };

  const triggerFacebookShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
    alert("Membagikan link ke Facebook!");
  };

  return (
    <div className="fixed inset-0 bg-black/92 backdrop-blur-md z-[200] flex items-center justify-center p-0 sm:p-4 select-none">
      
      {/* Container simulating a mobile phone body */}
      <div 
        className="w-full max-w-[390px] aspect-[9/16] sm:max-h-[85vh] bg-[#0F1420] sm:rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-2xl animate-scale-in"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        
        {/* Top Header info */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="text-[9.5px] font-mono font-bold text-[#F5A623] tracking-widest bg-black/40 px-2 py-0.5 rounded uppercase">Sanimar Video 20s Loop</span>
          </div>
          
          <div className="flex items-center gap-1.5 z-50">
            {/* Seller direct upload video button */}
            <label className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-blue-500/20" title="Upload Video Jualan (max 30s)">
              <Upload size={13} />
              <input 
                type="file" 
                accept="video/*,image/*" 
                onChange={handleFileUploadAndPublish} 
                className="hidden" 
              />
            </label>

            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Upload simulated progress notification */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 text-center text-white" onClick={(e) => e.stopPropagation()}>
            <Upload size={32} className="animate-bounce text-blue-400 mb-2" />
            <h5 className="text-xs font-bold font-mono">Memeriksa Durasi & Mengompres Video (&lt;30s)...</h5>
            <div className="w-48 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden mt-3 p-0.5">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-mono">{uploadProgress}% uploaded</span>
          </div>
        )}

        {/* Floating Hearts Reaction Canvas Overlay */}
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {hearts.map(h => (
            <div
              key={h.id}
              className="absolute bottom-28 text-xl text-red-500 font-bold opacity-0"
              style={{
                left: `${h.x}%`,
                animation: "heartFloat 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards"
              }}
            >
              ❤️
            </div>
          ))}
        </div>

        {/* Video simulation screen body */}
        <div className="absolute inset-0 w-full h-full bg-slate-950 z-10 flex items-center justify-center">
          <img 
            src={reel.image} 
            alt={reel.title} 
            className={`w-full h-full object-cover transition-all ${isPlaying ? "scale-100 duration-[12s] [transform:scale(1.1)]" : "scale-100"}`} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/30 pointer-events-none" />

          {/* Pause overlay Indicator */}
          {!isPlaying && (
            <div className="absolute w-14 h-14 bg-black/65 rounded-full flex items-center justify-center text-white p-1 animate-pulse z-20 pointer-events-none">
              <Play size={24} className="ml-1" />
            </div>
          )}
        </div>

        {/* Right Action buttons sidebar overlay */}
        <div className="absolute right-3.5 bottom-32 z-40 flex flex-col items-center gap-4">
          {/* Like button */}
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-1 cursor-pointer group scale-100 active:scale-95 transition-transform"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              liked 
                ? "bg-red-550 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] text-white" 
                : "bg-black/60 border-white/20 text-white"
            }`}>
              <Heart size={18} className={liked ? "fill-red-500 scale-110" : ""} />
            </div>
            <span className="text-[10px] text-white font-mono font-bold shadow-sm">{likesCount}</span>
          </button>

          {/* Comment button toggling Comment tray */}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowComments(prev => !prev); }}
            className="flex flex-col items-center gap-1 cursor-pointer scale-100 active:scale-95 transition-transform"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              showComments ? "bg-blue-600 border-blue-500 text-white" : "bg-black/60 border-white/20 text-white"
            }`}>
              <MessageSquare size={16} />
            </div>
            <span className="text-[10px] text-white font-mono font-semibold">{commentsList.length}</span>
          </button>

          {/* WhatsApp / FB Sharing buttons */}
          <div className="flex flex-col gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10">
            <button 
              onClick={triggerWhatsAppShare}
              className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Bagikan ke WhatsApp"
            >
              <font className="text-[11px] font-bold">WA</font>
            </button>
            <button 
              onClick={triggerFacebookShare}
              className="w-8 h-8 rounded-full bg-[#1877F2] hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Bagikan ke Facebook"
            >
              <font className="text-[11px] font-bold">FB</font>
            </button>
          </div>
        </div>

        {/* COMMENTS TRAY DRAWER SLIDE-UP */}
        {showComments && (
          <div 
            className="absolute bottom-0 inset-x-0 h-[60%] bg-[#0B0F1A] border-t border-slate-800 rounded-t-2xl z-50 flex flex-col justify-between p-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono">Komentar Pembeli ({commentsList.length})</span>
              <button 
                onClick={() => setShowComments(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-3 scrollbar-none">
              {commentsList.map((c, i) => (
                <div key={i} className="text-[11px] space-y-0.5 leading-normal">
                  <div className="flex justify-between items-baseline">
                    <span className="text-blue-400 font-bold font-mono">@{c.username}</span>
                    <span className="text-[8.5px] text-slate-650 font-mono">{c.time}</span>
                  </div>
                  <p className="text-slate-300 font-sans">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendComment} className="flex gap-1.5 border-t border-slate-900 pt-2 bg-[#0B0F1A]">
              <input 
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Tulis opini Anda..."
                className="flex-1 bg-[#05070B] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-705 outline-none font-sans"
              />
              <button 
                type="submit"
                className="bg-blue-650 hover:bg-blue-600 text-white p-1.5 rounded-lg shrink-0 cursor-pointer"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

        {/* Bottom player product information card */}
        <div className="absolute bottom-5 inset-x-4 z-40 space-y-3">
          <div>
            <span className="text-[9.5px] bg-[#2BD366]/20 text-[#2BD366] border border-[#2BD366]/25 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
              Sponsor Terpasang
            </span>
            <h4 className="text-xs font-bold text-white tracking-tight leading-snug font-sans mt-1">
              {reel.title}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-350 mt-1">
              <span>👤 @{associatedProduct?.sellerName || "Verified Seller"}</span>
              <span>&bull;</span>
              <span className="font-mono text-amber-400 font-semibold">👁️ {viewCount.toLocaleString()} views</span>
            </div>
          </div>

          {/* Direct Buy integrated banner */}
          <div className="bg-black/80 border border-slate-800 rounded-2xl p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                <img src={reel.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="text-left text-[11px]">
                <span className="text-[10px] text-slate-350 block line-clamp-1 truncate max-w-[120px]">
                  {associatedProduct?.title || reel.title}
                </span>
                <span className="text-xs font-mono font-extrabold text-[#2BD366]">{reel.price}</span>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleDirectBuy(); }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.8 rounded-xl flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
            >
              <ShoppingCart size={10} /> Sosa Agora
            </button>
          </div>

          {/* Fake looping progress bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[60%] rounded-full animate-[progressLoop_20s_linear_infinite]" />
          </div>
        </div>

      </div>

    </div>
  );
}
