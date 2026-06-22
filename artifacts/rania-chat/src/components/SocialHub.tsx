/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Users, UserPlus, UserCheck, MessageSquare, Heart, Video, Share2, Award, Sparkles, Send, Bell } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  location: string;
  avatar: string;
  role: string;
  bio: string;
  isFriend: boolean;
  isPending: boolean;
  score: number;
  banner: string;
}

interface SharedVideo {
  id: string;
  title: string;
  author: string;
  url: string;
  category: string;
  likes: number;
}

interface SocialHubProps {
  lang: "tet" | "id" | "en" | "pt";
  walletBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onEmitCoin: (x: number, y: number) => void;
}

export default function SocialHub({ lang, walletBalance, onUpdateBalance, onEmitCoin }: SocialHubProps) {
  // Translate system
  const t = {
    title: {
      tet: "Koneksaun Família Sanimar & Maluk Komunidade",
      id: "Hub Pertemanan Rakyat & Jaringan Mitra Bisnis",
      en: "Sanimar Community friendship & Merchant Network",
      pt: "Rede de Amizade e Parceiros do Sanimar"
    },
    subTitle: {
      tet: "Hari'i relasaun di'ak ho maluk negosiante hodi simu pontu konfiansa sosíal nian.",
      id: "Jalin hubungan bisnis & pertemanan erat untuk meningkatkan skor reputasi dagang Anda di seluruh dunia.",
      en: "Build mutual trust, follow global merchants, request partnerships and share helpful promo clips.",
      pt: "Crie confiança cooperativa e faça parcerias com comerciantes locais e internacionais."
    },
    searchPlaceholder: {
      tet: "Buka maluk ka negosiante...",
      id: "Cari nama sahabat atau agen pedagang...",
      en: "Search friends, global agents...",
      pt: "Procurar amigos ou agentes..."
    },
    inviteFriend: {
      tet: "Konvida Maluk foun",
      id: "Undang Teman Baru",
      en: "Invite New Friend",
      pt: "Convidar Amigo"
    },
    friendRequests: {
      tet: "Pedidu Pertemanan",
      id: "Permintaan Pertemanan Aktif",
      en: "Pending Friend Requests",
      pt: "Pedidos do Amizade"
    },
    yourFriends: {
      tet: "Ita-nia Belun",
      id: "Sahabat & Jaringan Anda",
      en: "Your Woven Circle of Friends",
      pt: "Círculo de Amigos"
    },
    addFriend: {
      tet: "Halo Belun",
      id: "Tambah Teman",
      en: "Add Friend",
      pt: "Adicionar Amigo"
    },
    pending: {
      tet: "Hein hela...",
      id: "Menunggu...",
      en: "Pending...",
      pt: "Pendente..."
    },
    connected: {
      tet: "Belun Ona ✓",
      id: "Bersahabat ✓",
      en: "Connected ✓",
      pt: "Conectado ✓"
    },
    trustScore: {
      tet: "Kredibilidade",
      id: "Kredibilitas Mitra",
      en: "Merchant Credibility",
      pt: "Credibilidade"
    },
    giftDesc: {
      tet: "Haruka Tip $1 USD",
      id: "Tip $1 USD",
      en: "Tip $1 USD",
      pt: "Enviar Tip $1 USD"
    },
    videoTitle: {
      tet: "Partilla Vídeo Promosaun & Review",
      id: "Kompilasi & Share Link Video Toko Bisnis",
      en: "Shared Promotion Clips & Community Vlogs",
      pt: "Partilhar Vídeos de Promoção e Testemunhos"
    },
    videoUrlPH: {
      tet: "Kopia link video (Youtube, TikTok, FB)...",
      id: "Tempel/Paste link video Youtube, Facebook, atau TikTok Anda di sini...",
      en: "Paste YouTube, Facebook or TikTok clip URL here...",
      pt: "Cole o link do seu vídeo do YouTube, TikTok ou FB..."
    },
    submitVideo: {
      tet: "Partilla Vídeo",
      id: "Publikasikan Video Promosi",
      en: "Publish Shared Video",
      pt: "Publicar Vídeo de Negócio"
    },
    videoTitleLabel: {
      tet: "Títulu Vídeo",
      id: "Judul Konten Video",
      en: "Video Clip Caption",
      pt: "Título do Vídeo"
    }
  }[lang] || {
    title: "Hub Pertemanan & Jaringan Mitra Bisnis",
    subTitle: "Jalin hubungan bisnis & pertemanan erat untuk meningkatkan skor reputasi dagang Anda di seluruh dunia.",
    searchPlaceholder: "Cari nama sahabat atau agen pedagang...",
    inviteFriend: "Undang Teman Baru",
    friendRequests: "Permintaan Pertemanan Aktif",
    yourFriends: "Sahabat & Jaringan Anda",
    addFriend: "Tambah Teman",
    pending: "Menunggu...",
    connected: "Bersahabat ✓",
    trustScore: "Skor Reputasi",
    giftDesc: "Kirim Koin Hadiah ($0.50)",
    videoTitle: "Kompilasi & Share Link Video Toko Bisnis",
    videoUrlPH: "Tempel/Paste link video Youtube, Facebook, atau TikTok Anda di sini...",
    submitVideo: "Publikasikan Video Promosi",
    videoTitleLabel: "Judul Konten Video"
  };

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: "f1",
      name: "Manuel De Jesus",
      location: "Dili, Pantai Kelapa",
      avatar: "☕",
      role: "Eksportir Kopi & Kelapa Raw",
      bio: "Menyediakan biji kopi arabika robusta pilihan dan kelapa segar dari Timor-Leste. Mari jalin silaturahmi perdagangan!",
      isFriend: true,
      isPending: false,
      score: 980,
      banner: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "f2",
      name: "Lidia Soares",
      location: "Dili, Comoro",
      avatar: "🧣",
      role: "Pengrajin Tenun Tais Tradisional",
      bio: "Pecinta pelestarian budaya Timor-Leste. Menenun Tais adat berkualitas tinggi langsung di pondok tenun kami.",
      isFriend: false,
      isPending: false,
      score: 850,
      banner: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "f3",
      name: "Roberta Pinto",
      location: "Baucau Cantonement",
      avatar: "🍯",
      role: "Peternak Madu Tebing Liar",
      bio: "Pemburu madu hutan tebing tinggi Baucau asli tanpa campuran air. Menghubungkan kesehatan untuk seluruh dunia.",
      isFriend: false,
      isPending: true,
      score: 720,
      banner: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "f4",
      name: "Carlos Alkatiri",
      location: "Liquica Coast",
      avatar: "🐟",
      role: "Koordinator Koperasi Nelayan",
      bio: "Mendistribusikan ikan laut segar harian dan produk olahan nian nusantara ke super-seller Dili.",
      isFriend: true,
      isPending: false,
      score: 910,
      banner: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "f5",
      name: "Budi Santoso",
      location: "Surabaya, ID (Global Mitra)",
      avatar: "⚙️",
      role: "Eksportir Elektronik & Alat Tani",
      bio: "Menghubungkan rantai pasok teknologi murah Surabaya-Dili untuk mekanisasi perkebunan kopi Timor.",
      isFriend: false,
      isPending: false,
      score: 950,
      banner: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "f6",
      name: "Ana Isabel Guterres",
      location: "Oecusse Enclave",
      avatar: "🌾",
      role: "Wirausaha Pangan Organik",
      bio: "Pertanian beras ubi organik lokal untuk kestabilan gizi dan ketahanan hayati masyarakat.",
      isFriend: false,
      isPending: false,
      score: 640,
      banner: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=400&q=80"
    }
  ]);

  // Video links submission block
  const [sharedVideos, setSharedVideos] = useState<SharedVideo[]>([
    {
      id: "v1",
      title: "Ulasan Panen Kopi Ermera Gleno 2026 - Istimewa!",
      author: "Manuel De Jesus",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Kopi Timor",
      likes: 42
    },
    {
      id: "v2",
      title: "Tutorial Menenun Selendang Tais Adat Motif Baucau",
      author: "Lidia Soares",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Tenun Adat",
      likes: 88
    },
    {
      id: "v3",
      title: "Video Promosi Layaway & Belanja Cicil Sanimar",
      author: "Sanimar Broadcast",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Edukasi Finansial",
      likes: 124
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoCat, setNewVideoCat] = useState("Kriya Lokal");

  const handleAddFriendAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEmitCoin(e.clientX, e.clientY);
    setFriends(prev => prev.map(f => {
      if (f.id === id) {
        if (!f.isFriend && !f.isPending) {
          return { ...f, isPending: true };
        } else if (f.isPending) {
          return { ...f, isFriend: true, isPending: false, score: f.score + 50 };
        }
        return f;
      }
      return f;
    }));
  };

  const handleGiftCoin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (walletBalance < 1.00) {
      alert("Saldo wallet Anda tidak mencukupi untuk mengirim Tip $1 USD!");
      return;
    }
    onUpdateBalance(walletBalance - 1.00);
    onEmitCoin(e.clientX, e.clientY);
    alert(`Sukses mengirim Tip $1 USD secara instan kepada merchant partner!`);
  };

  const handlePublishVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      alert("Harap isi semua kolom judul dan url video!");
      return;
    }

    // Direct url check YouTube/TikTok/Facebook
    const lowerUrl = newVideoUrl.toLowerCase();
    if (!lowerUrl.includes("youtube.com") && !lowerUrl.includes("youtu.be") && !lowerUrl.includes("tiktok.com") && !lowerUrl.includes("facebook.com")) {
      alert("Pemberitahuan: Demi kenyamanan, pastikan URL video yang dimasukkan berasal dari YouTube, TikTok, atau Facebook agar ribuan orang dapat menonton dengan stabil!");
    }

    const newVideo: SharedVideo = {
      id: `v_user_${Date.now()}`,
      title: newVideoTitle.trim(),
      author: "Kamu (Sanimar Patriot)",
      url: newVideoUrl.trim(),
      category: newVideoCat,
      likes: 1
    };

    setSharedVideos(prev => [newVideo, ...prev]);
    setNewVideoTitle("");
    setNewVideoUrl("");
    alert("Video promosi/vlog Anda berhasil dibagikan! Rekan global kini dapat menonton link video ini.");
  };

  const handleLikeVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEmitCoin(e.clientX, e.clientY);
    setSharedVideos(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, likes: v.likes + 1 };
      }
      return v;
    }));
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in py-1">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#0F1420] to-indigo-950/30 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none blur-xl" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9.5px] bg-[#3B82F6] text-white font-mono font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
              🌐 GLOBAL SOCIAL
            </span>
            <span className="text-[9.5px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
              100% Bebas Blokir
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-display font-extrabold text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 font-light leading-relaxed max-w-xl">
            {t.subTitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl">
          <Award className="text-[#F5A623] animate-pulse shrink-0" size={18} />
          <div>
            <span className="text-[10px] text-slate-400 block font-light leading-none">Status Kredibilitas</span>
            <span className="text-xs font-semibold text-white">Mitra Terverifikasi <b className="text-[#2BD366] text-[9.5px] font-normal font-mono">Aktif</b></span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Friend Network */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-blue-400" /> {t.yourFriends} ({friends.length})
            </h3>
            
            {/* Live Search bar */}
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full sm:w-64 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFriends.map(friend => (
              <div 
                key={friend.id} 
                className="bg-[#111827] border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-700/85 transition-all group flex flex-col justify-between"
              >
                {/* Banner & Avatar background */}
                <div className="h-16 relative bg-slate-950">
                  <img src={friend.banner} alt="User store cover" className="w-full h-full object-cover opacity-35" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
                  
                  {/* Floating Avatar symbol */}
                  <div className="absolute -bottom-3 left-4 w-9 h-9 rounded-full bg-slate-900 border border-slate-750 flex items-center justify-center text-lg shadow-md">
                    {friend.avatar}
                  </div>
                </div>

                {/* Info block */}
                <div className="px-4 pt-5 pb-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{friend.name}</h4>
                      <span className="text-[9.5px] text-slate-500 font-mono flex items-center gap-0.5">
                        📍 {friend.location.split(",")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-yellow-400 block font-medium font-mono uppercase tracking-wide">
                      {friend.role}
                    </span>
                    <p className="text-[10px] text-slate-400 font-light leading-relaxed pt-1">
                      {friend.bio}
                    </p>
                  </div>

                  {/* Reputation / Friend State */}
                  <div className="border-t border-slate-850/80 pt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[9.5px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Seller
                    </div>

                    <div className="flex items-center gap-1.5 matches-pertemanan">
                      {/* Send Tip $1 USD button */}
                      {friend.isFriend && (
                        <button
                          onClick={(e) => handleGiftCoin(friend.id, e)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-[#2BD366] border border-emerald-500/20 py-1 px-2.5 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Kirim Tip $1 USD kepada merchant"
                        >
                          💵 Tip $1 USD
                        </button>
                      )}

                      {/* Add Friend Toggle */}
                      <button
                        onClick={(e) => handleAddFriendAction(friend.id, e)}
                        className={`py-1 px-2.5 rounded-lg text-[9.5px] font-bold font-mono tracking-tighter transition-all flex items-center gap-1 cursor-pointer ${
                          friend.isFriend 
                            ? "bg-slate-800 text-slate-400 border border-slate-700/50" 
                            : friend.isPending
                            ? "bg-blue-650/15 text-blue-400 border border-blue-500/30 animate-pulse" 
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                        }`}
                      >
                        {friend.isFriend ? (
                          <>
                            <UserCheck size={10} /> <span>{t.connected}</span>
                          </>
                        ) : friend.isPending ? (
                          <>
                            <Sparkles size={10} className="animate-spin" /> <span>{t.pending}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={10} /> <span>{t.addFriend}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Shared Video Links Box */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Video size={14} className="text-[#3B82F6]" /> {t.videoTitle}
          </h3>

          {/* Quick Submit Video Link Form */}
          <form 
            onSubmit={handlePublishVideo}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
          >
            <div className="text-[10.5px] font-semibold text-slate-200">
              📤 Posting Link Video Produk Anda
            </div>

            {/* Video Title */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 block">{t.videoTitleLabel}</label>
              <input 
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder='E.g. "Kerajinan Kain Adat dari Liquica"'
                className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            {/* Video Link */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 block">YouTube, Facebook, or TikTok URL</label>
              <input 
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block">Kategori</label>
                <select
                  value={newVideoCat}
                  onChange={(e) => setNewVideoCat(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded-lg p-1.5 text-[10.5px] text-slate-300 focus:border-blue-500 outline-none"
                >
                  <option value="Kopi Timor-Leste">☕ Kopi Timor</option>
                  <option value="Tenun Tais">🧣 Tenun Tais</option>
                  <option value="Kriya Lokal">⚙️ Kriya Lokal</option>
                  <option value="Jastip Kuliner">🍲 Kuliner</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send size={11} /> <span>Share</span>
                </button>
              </div>
            </div>
          </form>

          {/* List of Published Links */}
          <div className="space-y-3">
            {sharedVideos.map(video => {
              const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
              const match = video.url.match(ytReg);
              const ytEmbed = match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : null;

              return (
                <div key={video.id} className="bg-[#111827] border border-slate-850 rounded-2xl p-3.5 space-y-3 shadow-md hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <span className="text-[8.5px] bg-[#3B82F6]/10 text-[#3B82F6] border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        {video.category}
                      </span>
                      <h4 className="text-[11px] font-bold text-slate-100 leading-snug mt-1.5">{video.title}</h4>
                      <p className="text-[9.5px] text-slate-500 pt-0.5">Diberbagikan oleh <b className="text-slate-400">{video.author}</b></p>
                    </div>
                  </div>

                  {/* Render Visual Iframe Player if YouTube URL, else render neat social linking button */}
                  {ytEmbed ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-900 shadow-inner">
                      <iframe 
                        src={ytEmbed}
                        title={video.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="bg-[#0B0F1A] border border-slate-850 rounded-xl p-2.5 text-center space-y-2">
                      <p className="text-[10px] text-slate-400 font-light">Link eksternal (TikTok / Facebook video)</p>
                      <a 
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600/10 hover:bg-blue-650/25 border border-blue-500/25 text-blue-400 font-bold font-mono text-[9px] px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-all"
                      >
                        Tonton di Media Asal 🎬
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-850 pt-2.5">
                    <button 
                      onClick={(e) => handleLikeVideo(video.id, e)}
                      className="text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 text-[10px] font-medium flex items-center gap-1 transition-all"
                    >
                      <Heart size={11} className="text-red-500 fill-red-500 shrink-0" /> Suka ({video.likes})
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(video.url);
                        alert("Link video disalin ke papan klip!");
                      }}
                      className="text-slate-400 hover:text-blue-400 text-[10px] flex items-center gap-1 transition-all"
                    >
                      <Share2 size={11} /> Bagikan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
