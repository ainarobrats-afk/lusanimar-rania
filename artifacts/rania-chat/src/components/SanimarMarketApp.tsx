/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Product, Story, User, AdCreditPackage } from "./types";
import { MOCK_PRODUCTS, CATEGORIES, MOCK_STORIES, MOCK_REELS } from "./data";

// Sub-components
import AskRania from "./components/AskRania";
import StoryViewer from "./components/StoryViewer";
import ProductDetailModal from "./components/ProductDetailModal";
import SellModal from "./components/SellModal";
import WalletDashboard from "./components/WalletDashboard";
import JobMatcherCard from "./components/JobMatcherCard";
import GroupBuyCard from "./components/GroupBuyCard";
import LayawayModal from "./components/LayawayModal";
import SocialHub from "./components/SocialHub";
import JastipTracker from "./components/JastipTracker";
import AdvertiserDashboard from "./components/AdvertiserDashboard";
import VerifiedChecklist from "./components/VerifiedChecklist";
import ReelsViewerModal from "./components/ReelsViewerModal";
import AdminDashboard from "./components/AdminDashboard";

// NEW KREDIT IKLAN & AGEN COMPONENTS
import RegistrationModal from "./components/RegistrationModal";
import AdCreditModal from "./components/AdCreditModal";
import AgentDashboard from "./components/AgentDashboard";

import { TRANSLATIONS, LanguageCode } from "./i18n";

// Lucide icons
import {
  Search,
  Flame,
  MapPin,
  Star,
  Sparkles,
  TrendingUp,
  Compass,
  Play,
  Smartphone,
  Plus,
  Gift,
  Award,
  Trophy,
  Info,
  DollarSign,
  Heart,
  MessageSquare,
  Share2,
  ClipboardList,
  Wallet,
  Bell,
  Bus,
  User as UserIcon
} from "lucide-react";

interface FlyingCoin {
  id: number;
  x: number;
  y: number;
  symbol: string;
}

export default function App() {
  // Localization State
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("sanimar_market_locale");
    return saved === "tet" || saved === "id" || saved === "en" || saved === "pt"
      ? saved
      : "tet";
  });

  const t = TRANSLATIONS[lang];

  const handleSetLang = (newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem("sanimar_market_locale", newLang);
  };

  // Products list database (local reactive state)
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // User & Ad Credit State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdCreditModal, setShowAdCreditModal] = useState(false);
  const [viewMode, setViewMode] = useState<"home" | "jobs" | "social" | "agent">("home");

  // Flying Coins Gamification Engine
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([]);
  const [coinsCounter, setCoinsCounter] = useState(0);

  // User cash wallet states
  const [walletBalance, setWalletBalance] = useState<number>(125.5); // Friendly sandbox layout starting balance

  // Kebun Sanimar Gamification (Sprint 1)
  const [userPoints, setUserPoints] = useState<number>(0);
  const [missionProgress, setMissionProgress] = useState(0);

  // Active Modals & Overlays state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLayawayProduct, setSelectedLayawayProduct] =
    useState<Product | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"vania" | "kargo" | "mitra">(
    "vania",
  );

  // Client simulated audio status for broadcast
  const [isMuted, setIsMuted] = useState(true);

  // Social feed likes state
  const [socialLikes, setSocialLikes] = useState<
    Record<string, { count: number; liked: boolean }>
  >({
    p1: { count: 18, liked: false },
    p2: { count: 4, liked: false },
    p3: { count: 32, liked: true },
    p4: { count: 15, liked: false },
  });

  // Spawn Coins Animation triggers helper
  const handleEmitCoin = (x: number, y: number) => {
    const newCoin: FlyingCoin = {
      id: coinsCounter,
      x: x || window.innerWidth / 2,
      y: y || window.innerHeight - 100,
      symbol: Math.random() > 0.4 ? "🪙" : "💵",
    };
    setCoinsCounter((prev) => prev + 1);
    setFlyingCoins((prev) => [...prev, newCoin]);

    // Cleanup after animation completes (1.2s flight)
    setTimeout(() => {
      setFlyingCoins((prev) => prev.filter((c) => c.id !== newCoin.id));
    }, 1200);
  };

  const handleSelectStory = (idx: number) => {
    const updated = [...stories];
    updated[idx].seen = true;
    setStories(updated);
    setActiveStoryIndex(idx);
    handleEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  // Filter listings based on categories & query
  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === "all" || p.category === selectedCategory;
    const matchQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);

  const handleAddSponsoredAd = (
    title: string,
    price: number,
    image: string,
    location: string,
  ) => {
    const newProduct: Product = {
      id: `p_sponsor_${Date.now()}`,
      title,
      price,
      category: "local",
      location: `${location} (Sponsor)`,
      badges: ["verified", "local"],
      sellerName: "Sanimar PPC Advertiser",
      rating: 5.0,
      description:
        "Iklan Produk Bersponsor yang didebit per klik (Pay-Per-Click) dari dashboard pengiklan Sanimar.",
      image,
      expiryDays: 30,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleAddProduct = (newProduct: Product) => {
    // If the seller has passed verification, ensure the newly created product is automatically VERIFIED!
    if (isVerifiedSeller && !newProduct.badges.includes("verified")) {
      newProduct.badges.push("verified");
    }
    setProducts((prev) => [newProduct, ...prev]);

    const message = {
      tet: "Iklan kapurtan Ó-nian susesu kria! Hein kurador konfirmed foin.",
      id: "Iklan Dagangan Anda Sukses Dibuat! Silakan tunggu konfirmasi kurator.",
      en: "Merchant Ad successfully created! Awaiting quick Admin curator approval.",
      pt: "Anúncio publicado com sucesso! Aguardando moderação administrativa breve.",
    };
    alert(message[lang]);
  };

  const toggleSocialLike = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEmitCoin(e.clientX, e.clientY);

    setSocialLikes((prev) => {
      const current = prev[productId] || { count: 12, liked: false };
      return {
        ...prev,
        [productId]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#E5E7EB] font-sans selection:bg-[#3B82F6]/30">
      {/* Decorative Tais Timor Top Border (Aesthetic Heritage Band) */}
      <div
        className="w-full h-3 bg-cover bg-center relative z-50 border-b border-[#F5A623]/25 shadow-sm"
        style={{
          backgroundImage:
            "url('/src/assets/images/tais_timor_pattern_1782061810744.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      </div>

      {/* ============================================================
           FLOATING COINS CANVAS (GAME REWARD LAYER)
      ============================================================ */}
      <div className="fixed inset-0 pointer-events-none z-[250] overflow-hidden">
        {flyingCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute font-display font-black text-xl animate-float-up pointer-events-none"
            style={{
              left: coin.x - 10,
              top: coin.y - 12,
              animation:
                "coinFly 1.2s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
            }}
          >
            {coin.symbol}
            <span className="text-[10px] text-green-400 font-mono font-bold block">
              +$0.05
            </span>
          </div>
        ))}
      </div>

      {/* ============================================================
           HEADER
      ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setSelectedCategory("all");
              setViewMode("home");
              setSearchQuery("");
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-md animate-pulse">
              🛍️
            </div>
            <h1 className="font-display font-extrabold text-sm sm:text-base tracking-tight leading-none text-white whitespace-nowrap">
              {t.appName.split(" ")[0]}{" "}
              <span className="text-[#F5A623]">
                {t.appName.split(" ")[1] || "MARKET"}
              </span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-[#111827] border border-slate-800 focus:border-blue-500 px-10 py-2.5 rounded-full text-xs text-slate-100 placeholder-slate-600 outline-none transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Header Action menu */}
          <div className="flex items-center gap-3">
            {/* Real-time elegant dropdown selector */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => handleSetLang(e.target.value as LanguageCode)}
                className="bg-[#111827] hover:bg-slate-800 hover:text-white text-xs border border-slate-800 rounded-xl px-2.5 py-1.8 outline-none font-bold text-slate-300 font-sans cursor-pointer transition-all duration-200"
              >
                <option value="tet">🇹🇱 Tetun</option>
                <option value="id">🇮🇩 Indo</option>
                <option value="en">🇬🇧 English</option>
                <option value="pt">🇵🇹 Português</option>
              </select>
            </div>

            {currentUser ? (
              <>
                <button
                  onClick={() => setShowAdCreditModal(true)}
                  className="bg-blue-900/40 border border-blue-500/30 hover:border-blue-400 text-blue-400 font-bold text-xs px-3 py-2 rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Balance"
                >
                  <Wallet size={14} /> <span>{currentUser.adCredits}</span>
                </button>
                <button
                  onClick={() => setShowSellModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:scale-[1.01] cursor-pointer"
                >
                  <Plus size={14} /> <span>{t.sellBtn}</span>
                </button>
                <button
                  onClick={() => alert(t.alertLocker)}
                  className="relative w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl hover:text-white transition-all hover:bg-slate-850 cursor-pointer"
                  title={t.notificationTitle}
                >
                  <Bell size={15} />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                </button>
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md cursor-pointer group"
                  onClick={() => {
                    const confirmLogout = window.confirm("Ingin keluar (Log out)?");
                    if (confirmLogout) setCurrentUser(null);
                  }}
                  title="Klik untuk Logout"
                >
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-blue-600/10 border border-blue-500 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserIcon size={14} /> <span>Masuk / Daftar</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowAdminDashboard(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#E63946] flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md select-none cursor-pointer hover:opacity-90 transition-opacity relative group"
              title="Admin Dashboard"
            >
              LS
              {/* Optional tooltip */}
              <span className="absolute -bottom-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Admin Panel
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
           LIVE STATS TICKER LINE (SIGNATURE ELEMENT)
      ============================================================ */}
      <div className="bg-[#0F1420] border-b border-slate-850 overflow-hidden py-2 text-[11px] text-slate-400 select-none">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 items-center overflow-x-auto scrollbar-none whitespace-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block" />
            <span className="font-semibold text-slate-300">12,450+</span>{" "}
            {t.activeListings}
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            👥 <span className="font-semibold text-slate-300">2,145</span>{" "}
            {t.verifiedSellers}
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            🏠 <span className="font-semibold text-slate-300">87</span>{" "}
            {t.newProperties}
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            💼 <span className="font-semibold text-slate-300">31</span>{" "}
            {t.newJobs}
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            🗺️{" "}
            <span className="font-semibold text-[#3B82F6]">
              {t.smoothDelivery}
            </span>
          </div>
        </div>
      </div>

      {/* Timor Motif Divider (Visual Craft Identity with Authentic Tais Fabric) */}
      <div
        className="w-full h-3 bg-cover bg-center border-y border-[#F5A623]/20 shadow-md relative"
        style={{
          backgroundImage:
            "url('/src/assets/images/tais_timor_pattern_1782061810744.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/15" />
      </div>

      {/* ============================================================
           MAIN BODY CONTAINERS
      ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Global Hub Navigation Tabs */}
        <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-1 flex gap-1 animate-fade-in select-none">
          <button
            onClick={() => {
              setViewMode("home");
              handleEmitCoin(0, 0);
            }}
            className={`flex-1 py-3 px-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === "home"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            🛍️ <span>Pasar Rakyat</span>
          </button>
          <button
            onClick={() => {
              setViewMode("jobs");
              handleEmitCoin(0, 0);
            }}
            className={`flex-1 py-3 px-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === "jobs"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            💼 <span>Karir Rania</span>
          </button>
          <button
            onClick={() => {
              setViewMode("social");
              handleEmitCoin(0, 0);
            }}
            className={`flex-1 py-3 px-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 relative ${
              viewMode === "social"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            👥 <span>Sahabat Hub</span>
            <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
              Mitra
            </span>
          </button>
          <button
            onClick={() => {
              if (currentUser?.accountType === "agent") {
                setViewMode("agent");
                handleEmitCoin(0, 0);
              } else {
                alert("Hanya Mitra Agen yang dapat mengakses tab ini.");
              }
            }}
            className={`flex-1 py-3 px-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 relative ${
              viewMode === "agent"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            🏪 <span>Mitra Agen</span>
          </button>
        </div>

        {/* 1. Ask RANIA floating assistant (Fixed position on viewport) */}
        <AskRania
          lang={lang}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onEmitCoin={(x, y) => handleEmitCoin(x, y)}
        />

        {viewMode === "jobs" ? (
          <div className="space-y-6 animate-fade-in py-4">
            <div className="flex items-center justify-between bg-[#111827] border border-slate-805/80 p-4 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">💼</span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white uppercase font-mono tracking-wider">
                    {t.careerPageTitle}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {t.careerPageDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMode("home")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
              >
                &larr; {t.backHome}
              </button>
            </div>

            <JobMatcherCard
              lang={lang}
              onEmitCoin={(x, y) => handleEmitCoin(x, y)}
              onApplySuccess={(jobTitle) => {
                alert(
                  `Sukses Melamar / Sucesso candidatura! '${jobTitle}' - Rania AI.`,
                );
              }}
            />
          </div>
        ) : viewMode === "social" ? (
          <SocialHub
            lang={lang}
            walletBalance={walletBalance}
            onUpdateBalance={(newBal) => setWalletBalance(newBal)}
            onEmitCoin={(x, y) => handleEmitCoin(x, y)}
          />
        ) : viewMode === "agent" && currentUser ? (
          <AgentDashboard 
            user={currentUser} 
            onClose={() => setViewMode("home")} 
            onUpdateUser={setCurrentUser}
            onBuyPackage={() => setShowAdCreditModal(true)}
          />
        ) : (
          <>
            {/* GAMIFICATION SPRINT 1: "Misi Harian / Kebun Sanimar" Widget */}
            <div className="mb-6 bg-[#0B0F1A] border border-blue-500/20 rounded-2xl p-4 sm:p-5 shadow-[0_0_15px_rgba(59,130,246,0.05)] relative overflow-hidden animate-slide-up group">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Award
                  size={80}
                  className="text-blue-500 group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-amber-400 to-[#F5A623] text-slate-950 text-[10px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded shadow-sm">
                      Misi Harian - Kebun Sanimar
                    </span>
                    <span className="text-[10px] text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                      +100 Poin Menunggu
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Selesaikan Misi & Bangun Ekosistemmu
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-light max-w-md leading-relaxed">
                    Setiap hari adalah petualangan baru di Sanimar! Selesaikan
                    check-in dan berinteraksi dengan komunitas untuk membesarkan
                    "Kebun" profilmu dan klaim voucher gratis.
                  </p>
                </div>

                <div className="w-full sm:w-auto bg-[#111827] border border-slate-800 rounded-xl p-3 flex items-center justify-between sm:justify-start gap-4 shadow-inner min-w-[200px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-light font-mono mb-1">
                      Total Poin Kamu
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={16} className="text-emerald-400" />
                      <span className="text-xl font-black text-white font-mono leading-none tracking-tight">
                        {userPoints}
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-slate-800 hidden sm:block"></div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-300 font-bold font-mono">
                      <span>Progres Hari Ini</span>
                      <span className="text-[#F5A623]">
                        {missionProgress}/3
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#2BD366] transition-all duration-700 ease-out"
                        style={{ width: `${(missionProgress / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Missions */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
                <button
                  onClick={(e) => {
                    handleEmitCoin(e.clientX, e.clientY);
                    setMissionProgress((p) => Math.min(3, p + 1));
                    setUserPoints((p) => p + 10);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg py-2 px-3 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group/btn"
                >
                  <span className="text-lg group-hover/btn:scale-110 transition-transform">
                    📅
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-300 mt-0.5">
                    Daily Check-in
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    handleEmitCoin(e.clientX, e.clientY);
                    setMissionProgress((p) => Math.min(3, p + 1));
                    setUserPoints((p) => p + 25);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg py-2 px-3 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group/btn"
                >
                  <span className="text-lg group-hover/btn:scale-110 transition-transform">
                    💬
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-300 mt-0.5">
                    Chat 2 Penjual
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    handleEmitCoin(e.clientX, e.clientY);
                    setMissionProgress((p) => Math.min(3, p + 1));
                    setUserPoints((p) => p + 50);
                    setViewMode("social");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg py-2 px-3 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group/btn"
                >
                  <span className="text-lg group-hover/btn:scale-110 transition-transform">
                    👥
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-300 mt-0.5">
                    Buka Sahabat Hub
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    if (missionProgress < 3) {
                      alert(
                        "Kamu harus menyelesaikan minimal 3 misi harian sebelum bisa panen!",
                      );
                      return;
                    }
                    for (let i = 0; i < 15; i++) {
                      setTimeout(
                        () =>
                          handleEmitCoin(
                            e.clientX + (Math.random() * 40 - 20),
                            e.clientY,
                          ),
                        i * 100,
                      );
                    }
                    setUserPoints((p) => p + 150);
                    setMissionProgress(0);
                    alert(
                      "YAY! Kamu memanen Kebun Sanimar dan mendapat 150 Poin Ekstra!",
                    );
                  }}
                  className="bg-blue-600/10 hover:bg-emerald-500/15 border border-blue-500/20 hover:border-emerald-500/30 rounded-lg py-2 px-3 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group/btn"
                >
                  <span className="text-lg group-hover/btn:rotate-12 transition-transform">
                    🎁
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-400 mt-0.5">
                    Panen Poin!
                  </span>
                </button>
              </div>
            </div>

            {/* 1. LISTING BARU HARI INI */}
            <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-none pb-2 select-none">
              <div className="bg-[#111827] border border-blue-500/30 p-3 rounded-xl min-w-[140px] shrink-0 shadow-sm cursor-pointer border-l-4 border-l-blue-500 flex flex-col justify-between">
                <div className="text-[10px] text-slate-400 font-mono font-bold">
                  {lang === "tet" ? "Listing Foun Ohin Loron" : lang === "en" ? "New Listings Today" : lang === "pt" ? "Novos Anuncios Hoje" : "Total Listing Baru Hari Ini"}
                </div>
                <div className="text-2xl font-black text-white mt-2 leading-none">
                  125
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    Items
                  </span>
                </div>
              </div>
              <div className="bg-[#111827] border border-slate-800 hover:border-slate-700 hover:bg-slate-800 p-3 rounded-xl min-w-[120px] shrink-0 cursor-pointer transition-colors flex flex-col justify-between">
                <div className="text-[11px] text-slate-400 font-mono font-semibold">
                  {lang === "tet" ? "Karreta Foun" : lang === "en" ? "New Cars" : lang === "pt" ? "Carros Novos" : "Mobil Baru"}
                </div>
                <div className="text-xl font-bold text-slate-200 mt-2">8</div>
              </div>
              <div className="bg-[#111827] border border-slate-800 hover:border-slate-700 hover:bg-slate-800 p-3 rounded-xl min-w-[120px] shrink-0 cursor-pointer transition-colors flex flex-col justify-between">
                <div className="text-[11px] text-slate-400 font-mono font-semibold">
                  {lang === "tet" ? "Uma Foun" : lang === "en" ? "New Houses" : lang === "pt" ? "Casas Novas" : "Rumah Baru"}
                </div>
                <div className="text-xl font-bold text-slate-200 mt-2">12</div>
              </div>
              <div className="bg-[#111827] border border-slate-800 hover:border-slate-700 hover:bg-slate-800 p-3 rounded-xl min-w-[120px] shrink-0 cursor-pointer transition-colors flex flex-col justify-between">
                <div className="text-[11px] text-slate-400 font-mono font-semibold">
                  {lang === "tet" ? "Vaga Foun" : lang === "en" ? "New Jobs" : lang === "pt" ? "Novas Vagas" : "Lowongan Baru"}
                </div>
                <div className="text-xl font-bold text-slate-200 mt-2">20</div>
              </div>
              <div className="bg-[#111827] border border-slate-800 hover:border-slate-700 hover:bg-slate-800 p-3 rounded-xl min-w-[120px] shrink-0 cursor-pointer transition-colors flex flex-col justify-between">
                <div className="text-[11px] text-slate-400 font-mono font-semibold">
                   {lang === "tet" ? "Produtu Lokál" : lang === "en" ? "Local Products" : lang === "pt" ? "Produtos Locais" : "Produk Lokal Baru"}
                </div>
                <div className="text-xl font-bold text-slate-200 mt-2">7</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 p-3 rounded-xl min-w-[120px] shrink-0 cursor-pointer transition-colors flex items-center justify-center">
                <div className="text-xs font-bold text-blue-400 text-center">
                   {lang === "tet" ? "HAREE HOTU \u2192" : lang === "en" ? "SEE ALL \u2192" : lang === "pt" ? "VER TUDO \u2192" : "LIHAT SEMUA \u2192"}
                </div>
              </div>
            </div>

            {/* 2. DEKAT SAYA (Peta Interaktif) */}
            <div
              className="mb-8 rounded-2xl overflow-hidden border border-slate-800 bg-[#111827] select-none relative h-36 flex items-center justify-center cursor-pointer group hover:border-[#3B82F6]/50 transition-colors"
              onClick={() => alert(lang === "tet" ? "Loke Mapa Interativu Sanimar..." : lang === "en" ? "Opening Sanimar Interactive Map..." : lang === "pt" ? "Abrindo Mapa Interativo Sanimar..." : "Membuka Peta Interaktif Sanimar...")}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80')",
                }}
              ></div>
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mb-2 shadow-[0_0_15px_rgba(37,99,235,0.6)] animate-bounce text-lg">
                  📍
                </div>
                <h3 className="font-bold text-white tracking-wide flex items-center gap-2">
                  {lang === "tet" ? "Buka Produtu Iha Dili Laran" : lang === "en" ? "Find Products Around Dili" : lang === "pt" ? "Encontre Produtos em Díli" : "Temukan Produk Di Sekitar Dili"}
                </h3>
                <span className="text-[10px] bg-blue-500 text-white font-bold px-3 py-1 rounded mt-1.5 shadow-md">
                  {lang === "tet" ? "Loke Mapa Interativu" : lang === "en" ? "Open Interactive Map" : lang === "pt" ? "Abrir Mapa Interativo" : "Buka Peta Interaktif"}
                </span>
              </div>
            </div>

            {/* 1.5. Cultural Tais Timor Welcome Banner (Visual Identity & Authentic Heritage) */}
            <div
              className="mb-8 rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl relative min-h-[140px] sm:min-h-[160px] flex flex-col justify-end p-5 sm:p-7 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('/src/assets/images/tais_timor_pattern_1782061810744.jpg')",
              }}
            >
              {/* Radial gradient mask to make sure high contrast white and amber text remains perfectly readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/35" />

              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9.5px] bg-[#F5A623] text-slate-950 font-mono font-extrabold px-2 py-0.5 rounded tracking-widest uppercase shadow-sm">
                    Kultura Timor nian
                  </span>
                  <span className="text-[9.5px] bg-blue-500/25 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold tracking-wider shadow-sm">
                    Sanimar Heritage
                  </span>
                </div>
                <h2 className="text-base sm:text-2xl font-display font-black text-white tracking-tight leading-tight">
                  {lang === "tet"
                    ? "Sustenta Lokál, Haburas Ita-nia Rain ho Tais Timor"
                    : lang === "id"
                      ? "Dukung Karya Lokal, Lestarikan Budaya dengan Tais Timor"
                      : "Support Local Artisans, Celebrate Culture with Tais Timor"}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-300 font-light leading-relaxed max-w-lg">
                  {lang === "tet"
                    ? "Sanimar sadere ba produtu kmanek no heritage no foti aas Tais originál hosi Ermera, Manufahi, no Oecusse."
                    : lang === "id"
                      ? "Sanimar berkomitmen penuh mendukung ekonomi kreatif, produk kriya, kopi Arabika, dan kain Tais tenun asli Timor-Leste."
                      : "Sanimar fully fosters the local creative economy, premium coffee beans, arts, and authentic handwoven Tais heritage."}
                </p>
              </div>
            </div>

            {/* 2. Interactive Stories Row (Daily Habits widget) */}
            <div className="mb-8 overflow-hidden select-none">
              <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-3 px-1 flex items-center gap-1.5">
                <Flame size={12} className="text-[#F5A623] animate-pulse" />{" "}
                {t.storyTitle}
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    onClick={() => handleSelectStory(index)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
                  >
                    <div
                      className={`p-0.5 rounded-full ${
                        story.seen
                          ? "bg-slate-800"
                          : "bg-gradient-to-tr from-[#F5A623] via-[#E63946] to-[#3B82F6]"
                      } transition-all duration-300 group-hover:scale-105`}
                    >
                      <div className="w-14 h-14 bg-[#0B0F1A] rounded-full p-0.5 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xl shadow-inner font-bold">
                          {story.avatar}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium group-hover:text-white transition-colors">
                      {story.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sanimar Sponsored Videos (Video Promo) */}
            <div className="mb-8 overflow-hidden select-none bg-[#111827] border border-blue-900/40 rounded-2xl p-4">
              <div className="flex justify-between items-baseline mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider px-1 flex items-center gap-1.5">
                  <Play
                    size={12}
                    className="text-blue-500 animate-pulse fill-blue-500"
                  />{" "}
                  {lang === "tet" ? "🎬 PROMOSAUN VIDEO — SPONSORED" : lang === "en" ? "🎬 SPONSORED PROMO VIDEO" : lang === "pt" ? "🎬 VÍDEO PROMO — PATROCINADO" : "🎬 VIDEO PROMO — SPONSORED"}
                </h3>
                <span className="text-[9.5px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                  ADS
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {MOCK_REELS.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => setSelectedReel(reel)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
                  >
                    <div className="w-28 h-40 rounded-2xl bg-slate-950 border border-slate-850 p-0.5 relative overflow-hidden group-hover:border-blue-500/80 transition-all group-hover:scale-105">
                      <img
                        src={reel.image}
                        alt={reel.title}
                        className="w-full h-full object-cover rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/60 to-transparent space-y-1">
                        <span className="text-[9px] font-mono font-bold text-[#2BD366] leading-none flex items-center gap-1 mt-1">
                          {reel.price}{" "}
                          <span className="bg-blue-600 px-1 py-0.5 rounded text-[8px] text-white">
                            {lang === "tet" ? "Promo" : lang === "en" ? "Promo" : "Promo"}
                          </span>
                        </span>
                        <span className="text-[8px] text-slate-300 line-clamp-2 block font-medium leading-none mt-1">
                          {reel.title}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white scale-90 opacity-90 group-hover:scale-100 transition-all shadow-md">
                        <Play size={10} className="fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-slate-500 text-center font-medium italic">
                {lang === "tet" ? "* Video husi UMKM, Turizmu no Ajénsia." : lang === "en" ? "* Videos sponsored by businesses and agencies." : lang === "pt" ? "* Vídeos patrocinados por empresas." : "* Video disponsori oleh UMKM, Dinas Pariwisata, dan Mitra Sanimar."}
              </div>
            </div>

            {/* 🔥 PROMO HARI INI */}
            <div className="mb-6 bg-gradient-to-r from-[#F5A623]/20 to-red-500/10 border border-[#F5A623]/30 rounded-2xl p-4 overflow-hidden select-none relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] text-6xl">
                🔥
              </div>
              <div className="flex justify-between items-baseline mb-3 relative z-10">
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider px-1 flex items-center gap-1.5">
                  <Flame size={14} className="text-[#F5A623] animate-pulse" />
                  {lang === "tet" ? "PROMOSAUN OHIN LORON" : lang === "en" ? "TODAY'S PROMO" : lang === "pt" ? "PROMOÇÃO DE HOJE" : "PROMO HARI INI"}
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none relative z-10">
                {products.slice(0, 3).map((p) => (
                  <div
                    key={`promo-${p.id}`}
                    onClick={() => setSelectedProduct(p)}
                    className="bg-[#111827] border border-red-500/30 rounded-xl p-2.5 flex items-center gap-3 min-w-[240px] shrink-0 cursor-pointer hover:bg-slate-800 transition-all shadow-md"
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-800"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          DISCOUNT 20%
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1">
                        {p.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-[#F5A623]">
                          ${(p.price * 0.8).toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-500 line-through">
                          ${p.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split screen content layout with dynamic sidebars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* LEFT 2 COLS: Product catalogs, live categories, flash sales */}
              <div className="lg:col-span-2 space-y-6">
                {/* 3. Local Categories Selector */}
                <div className="bg-[#111827] border border-slate-805/80 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-3">
                    {t.categoriesTitle}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                    {CATEGORIES.map((cat) => {
                      const labelMap: Record<string, string> = {
                        all: t.all,
                        property: t.property,
                        vehicle: t.vehicle,
                        job: t.job,
                        local: t.local,
                        tech: t.tech,
                        food: t.food,
                        jastip: t.jastip,
                        other: t.other,
                      };
                      const finalLabel = labelMap[cat.id] || cat.label;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (cat.id === "job") {
                              setViewMode("jobs");
                            } else {
                              setViewMode("home");
                              setSelectedCategory(cat.id);
                            }
                            handleEmitCoin(0, 0); // Trigger coin
                          }}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                            (selectedCategory === cat.id &&
                              viewMode === "home") ||
                            (cat.id === "job" && viewMode === "jobs")
                              ? "border-[#3B82F6] bg-blue-650/10 text-white animate-pulse"
                              : "border-slate-800/80 bg-[#0B0F1A] text-slate-400 hover:border-slate-700 hover:text-white"
                          }`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-[10px] font-semibold text-center leading-tight whitespace-nowrap">
                            {finalLabel.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* A. RANIA KERJA - AI JOB MATCHER (Ticked highly at Top below Rania) */}
                <JobMatcherCard
                  lang={lang}
                  onEmitCoin={(x, y) => handleEmitCoin(x, y)}
                  onApplySuccess={(jobTitle) => {
                    alert(
                      `Applied! Candidatura com sucesso! '${jobTitle}' - Rania AI.`,
                    );
                  }}
                />

                {/* B. BELI BARENG - GROUP BUY (Locked below Job Matcher as request 4) */}
                <GroupBuyCard
                  lang={lang}
                  onEmitCoin={(x, y) => handleEmitCoin(x, y)}
                  onUpdateBalance={(newBal) => setWalletBalance(newBal)}
                  onSuccessOrder={(title) => {
                    alert(`Sucesuu! Group buy '${title}' 5/5 complete.`);
                  }}
                />

                {/* 6. Horizontally scrolling items showcase */}
                <div className="space-y-6">
                  {/* SECTION: MADE IN TIMOR-LESTE */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline select-none">
                      <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                        🇹🇱 {t.madeInTimor}
                      </h3>
                      <span
                        className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        onClick={() => setSelectedCategory("local")}
                      >
                        {t.learnMore} &rarr;
                      </span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                      {filteredProducts
                        .filter((p) => p.badges.includes("local"))
                        .map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="w-48 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shrink-0 cursor-pointer group transition-all hover:scale-[1.02]"
                          >
                            <div className="h-28 w-full bg-slate-950 relative">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 text-[9px] bg-[#F5A623] text-slate-900 font-extrabold font-mono px-1.5 py-0.5 rounded uppercase">
                                Timor
                              </span>
                              {product.price > 100 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLayawayProduct(product);
                                  }}
                                  className="absolute top-2 right-2 text-[8px] bg-blue-600 hover:bg-blue-500 text-white font-black px-1.5 py-0.5 rounded font-mono uppercase cursor-pointer z-10 shadow-md animate-pulse"
                                >
                                  {t.dpOk}
                                </span>
                              )}
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-[#F5A623] transition-colors">
                                {product.title}
                              </h4>
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                <MapPin size={10} className="text-blue-500" />{" "}
                                {product.location.split(" ")[0]}
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-850">
                                <span className="text-sm font-display font-black text-white">
                                  $ {product.price.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-[#2BD366] font-semibold">
                                  {t.ready}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* TIMOR SOCIAL POSTS FEED: Instagram-style */}
                  <div className="space-y-4 pt-2">
                    <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                      📱 {t.communityTitle}
                    </h3>

                    <div className="space-y-4">
                      {filteredProducts.slice(0, 3).map((p) => {
                        const likesState = socialLikes[p.id] || {
                          count: 12,
                          liked: false,
                        };
                        return (
                          <div
                            key={p.id}
                            className="bg-[#111827] border border-slate-850 rounded-2xl overflow-hidden shadow-md"
                          >
                            {/* Feed post writer info */}
                            <div className="p-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                                  {p.sellerName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <b className="text-xs text-white block">
                                    {p.sellerName}
                                  </b>
                                  <span className="text-[9.5px] text-slate-500 font-mono">
                                    Baru saja di {p.location}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-sans text-[#F5A623] bg-amber-500/10 px-2 py-1 rounded font-semibold border border-amber-500/20">
                                {t.sponsoredTag}
                              </span>
                            </div>

                            {/* Image body */}
                            <div
                              onClick={() => setSelectedProduct(p)}
                              className="aspect-video w-full bg-slate-950 relative cursor-pointer group"
                            >
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-[#000]/10 group-hover:bg-[#000]/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="bg-[#3B82F6] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                                  {t.viewDetails} &rarr;
                                </span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="p-3.5 space-y-3">
                              <div className="flex justify-between items-baseline">
                                <h4
                                  onClick={() => setSelectedProduct(p)}
                                  className="text-xs sm:text-sm font-semibold text-slate-100 hover:text-blue-400 cursor-pointer line-clamp-1"
                                >
                                  {p.title}
                                </h4>
                                <span className="text-sm font-display font-black text-[#2BD366] font-mono shrink-0">
                                  ${p.price.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex gap-2.5 items-center border-t border-slate-850 pt-2.5">
                                <button
                                  onClick={(e) => toggleSocialLike(p.id, e)}
                                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                                    likesState.liked
                                      ? "border-red-500/40 bg-red-500/5 text-red-500"
                                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  <Heart
                                    size={14}
                                    className={
                                      likesState.liked
                                        ? "fill-red-500 animate-pulse"
                                        : ""
                                    }
                                  />{" "}
                                  Suka ({likesState.count})
                                </button>

                                <button
                                  onClick={() => setSelectedProduct(p)}
                                  className="flex-1 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800"
                                >
                                  <MessageSquare size={14} /> {t.askPrice}
                                </button>

                                <button
                                  onClick={(e) => {
                                    handleEmitCoin(e.clientX, e.clientY);
                                    alert(
                                      "Copy referral bonus link! Bagikan link ini untuk mendapatkan koin.",
                                    );
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800"
                                >
                                  <Share2 size={13} /> {t.promote}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* JASTIP BUS TRAVEL COMPONENT: Signature Kupang routes */}
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between items-baseline select-none">
                      <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                        🚌 {t.jastipTitle}
                      </h3>
                      <span
                        className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        onClick={() => setSelectedCategory("jastip")}
                      >
                        {t.learnMore} &rarr;
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal mb-1">
                      Titipan kargo cepat yang dikelola oleh armada bus rute
                      Kupang-Dili. Aman, murah, langsung jemput di loket
                      terminal!
                    </p>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                      {filteredProducts
                        .filter((p) => p.badges.includes("jastip"))
                        .map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="w-48 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shrink-0 cursor-pointer group transition-all hover:scale-[1.02]"
                          >
                            <div className="h-28 w-full bg-slate-950 relative">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 text-[9px] bg-[#1877F2] text-white font-extrabold font-mono px-1.5 py-0.5 rounded uppercase">
                                BUS KPG
                              </span>
                              {product.price > 100 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLayawayProduct(product);
                                  }}
                                  className="absolute top-2 right-2 text-[8px] bg-blue-600 hover:bg-blue-500 text-white font-black px-1.5 py-0.5 rounded font-mono uppercase cursor-pointer z-10 shadow-md"
                                >
                                  {t.dpOk}
                                </span>
                              )}
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-450 transition-colors">
                                {product.title}
                              </h4>
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                <Bus
                                  size={10}
                                  className="text-blue-500 shrink-0"
                                />{" "}
                                Est. 2 Hari Sampai Terminal
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-850">
                                <span className="text-sm font-display font-black text-white">
                                  $ {product.price.toLocaleString()}
                                </span>
                                <span className="text-[9.5px] text-[#F5A623] bg-orange-500/10 px-1 py-0.5 rounded">
                                  Jastip
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* SECTION: IMPORTED FROM INDONESIA & CHINA */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-baseline justify-between select-none">
                      <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                        🌐 {t.crossBorderTitle}
                      </h3>
                      <span
                        className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        onClick={() => setSelectedCategory("tech")}
                      >
                        {t.learnMore} &rarr;
                      </span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                      {filteredProducts
                        .filter(
                          (p) =>
                            !p.badges.includes("local") &&
                            !p.badges.includes("jastip"),
                        )
                        .map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="w-48 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shrink-0 cursor-pointer group transition-all hover:scale-[1.02]"
                          >
                            <div className="h-28 w-full bg-slate-950 relative">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 text-[9px] bg-sky-600 text-white font-extrabold font-mono px-1.5 py-0.5 rounded uppercase">
                                Kargo
                              </span>
                              {product.price > 100 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLayawayProduct(product);
                                  }}
                                  className="absolute top-2 right-2 text-[8px] bg-blue-600 hover:bg-blue-500 text-white font-black px-1.5 py-0.5 rounded font-mono uppercase cursor-pointer z-10 shadow-md"
                                >
                                  {t.dpOk}
                                </span>
                              )}
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-450 transition-colors">
                                {product.title}
                              </h4>
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                <MapPin size={10} className="text-blue-500" />{" "}
                                {product.location.substring(0, 15)}...
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-850">
                                <span className="text-sm font-display font-black text-white">
                                  $ {product.price.toLocaleString()}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-mono">
                                  Logistik
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COL (1 COL WIDTH): Gamified wallet panel, referral, top merchants leaderboard */}
              <div className="space-y-6">
                {/* Wallet Integration Dashboard Panel */}
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wide mb-3 flex items-center gap-1.5 select-none">
                    💼 {t.walletTitle}
                  </h3>
                  <WalletDashboard
                    lang={lang}
                    t={t}
                    walletBalance={walletBalance}
                    onUpdateBalance={(newBal) => setWalletBalance(newBal)}
                    onEmitCoin={(x, y) => handleEmitCoin(x, y)}
                  />
                </div>

                {/* Tab selector for Sanimar Sidebar Utility Systems */}
                <div className="flex bg-[#111827] border border-slate-800 rounded-md p-1 gap-1 select-none text-[11px] font-mono">
                  <button
                    onClick={() => setSidebarTab("vania")}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      sidebarTab === "vania"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-slate-400 hover:text-slate-350 hover:bg-slate-900"
                    }`}
                  >
                    📺 Rania Live
                  </button>
                  <button
                    onClick={() => setSidebarTab("kargo")}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      sidebarTab === "kargo"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-slate-400 hover:text-slate-350 hover:bg-slate-900"
                    }`}
                  >
                    📦 Kargo Jastip
                  </button>
                  <button
                    onClick={() => setSidebarTab("mitra")}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      sidebarTab === "mitra"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-slate-400 hover:text-slate-350 hover:bg-slate-900"
                    }`}
                  >
                    📢 Mitra PPC
                  </button>
                </div>

                {/* CONDITIONAL RENDER PANELS */}
                {sidebarTab === "vania" && (
                  <div className="space-y-6">
                    {/* Simulated Rania Live TV Stream - Signature Element */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4.5 space-y-3.5">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                            {t.viewLiveShopping}
                          </h4>
                        </div>
                        <div className="text-[10px] bg-red-600 font-extrabold text-white px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                          LIVE
                        </div>
                      </div>

                      {/* Simulated streamer screen */}
                      <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-850 group select-none">
                        {/* Dark gradient mapping overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/80 via-transparent to-black/30 pointer-events-none z-10" />

                        {/* Simulated hostess screen view */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-[#0F1420]">
                          <div className="space-y-3.5 flex flex-col items-center">
                            <div className="w-18 h-18 rounded-full border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden animate-bounce shrink-0 bg-slate-950">
                              <img
                                src="/src/assets/images/rania_avatar_1782061622582.jpg"
                                alt="Rania Live Host"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-xs text-slate-350 font-medium font-sans leading-relaxed block px-4 animate-pulse [animation-duration:3s]">
                              "{t.liveHostText}"
                            </span>
                            <span className="text-[9.5px] bg-blue-600/25 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono uppercase inline-block font-bold tracking-wider">
                              Host: RANIA AI Broadcaster
                            </span>
                          </div>
                        </div>

                        {/* Sound status controls button */}
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-[10px] text-white px-2 py-1 rounded transition-colors font-mono cursor-pointer"
                        >
                          {isMuted ? "🔈 Muted" : "🔊 Live Audio"}
                        </button>

                        {/* Stream statistics overlay */}
                        <div className="absolute bottom-3 left-3 z-20 space-y-1 text-white">
                          <span className="text-[9.5px] bg-black/55 px-2 py-0.8 rounded font-mono font-bold flex items-center gap-1 shrink-0">
                            👥 1,847 views
                          </span>
                        </div>

                        {/* Send coin reaction interaction */}
                        <button
                          onClick={(e) => handleEmitCoin(e.clientX, e.clientY)}
                          className="absolute bottom-3 right-3 z-20 p-1 px-2.5 bg-[#F5A623] hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                        >
                          💖 Send Coin
                        </button>
                      </div>

                      {/* Live community messages chat list */}
                      <div className="text-[11px] space-y-2 pt-1.5">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">
                          {t.listenLiveComment}
                        </span>
                        <div className="bg-slate-950/75 border border-slate-900 rounded-xl p-3 space-y-2 h-26 overflow-y-auto leading-relaxed scrollbar-none font-sans">
                          <div>
                            <span className="text-blue-400 font-bold font-mono">
                              @eduardo_jesus:{" "}
                            </span>
                            <span className="text-slate-350">
                              {lang === "tet"
                                ? "Tais ne'e furak tebes! Hau bele sosa agora? 😍"
                                : "Tais tenun itu megah sekali! Sangat bernilai seni."}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#F5A623] font-bold font-mono">
                              @manuel_dili:{" "}
                            </span>
                            <span className="text-slate-350">
                              {lang === "tet"
                                ? "Kopi Gleno furak tebes, rekomenda ba kolega hotu!"
                                : "Biji kopi Ermera paling mantap aromanya kak."}
                            </span>
                          </div>
                          <div>
                            <span className="text-pink-400 font-bold font-mono">
                              @jacinta_soares:{" "}
                            </span>
                            <span className="text-slate-355">
                              B CTL compliance gives genuine confidence. Awesome
                              applet!
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Streaks Habit Checkin box */}
                    <div className="bg-gradient-to-tr from-[#1B1F32] to-[#111827] border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl animate-bounce">🔥</span>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                            {t.dailyStreakTitle}
                          </h4>
                          <b className="text-sm text-[#F5A623] block mt-0.5">
                            {t.streakDays}
                          </b>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans leading-normal">
                            {t.streakDesc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Top Local Sellers Leaderboard Grid */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 select-none">
                      <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider mb-2.5 flex items-center gap-1.5">
                        🏆 {t.topMerchantsTitle}
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-amber-500/20 text-[#F5A623] font-bold font-mono text-[10px] flex items-center justify-center">
                              1
                            </span>
                            <span className="font-semibold text-slate-200">
                              Koperativa Kafé Timor
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            1.2k {t.soldCount || "sold"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-slate-500/25 text-slate-300 font-bold font-mono text-[10px] flex items-center justify-center">
                              2
                            </span>
                            <span className="font-semibold text-slate-200">
                              Tais Weaving Coop
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            812 {t.soldCount || "sold"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-yellow-700/20 text-orange-400 font-bold font-mono text-[10px] flex items-center justify-center">
                              3
                            </span>
                            <span className="font-semibold text-slate-200">
                              Manuel De Jesus
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            420 {t.soldCount || "sold"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BCTL Microfinance & Layaway Safety Information */}
                    <div className="w-full rounded-2xl bg-gradient-to-br from-green-950/20 to-slate-950 border border-slate-850 p-4 text-center select-none">
                      <span className="text-2xl mb-1 block">🛡️</span>
                      <h5 className="text-xs font-semibold text-slate-200">
                        {t.bctlTitle}
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                        {t.bctlDesc}
                      </p>
                      <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full mt-3 font-semibold font-mono uppercase inline-block">
                        {t.complianceBadge}
                      </span>
                    </div>
                  </div>
                )}

                {sidebarTab === "kargo" && (
                  <div className="space-y-4">
                    <JastipTracker lang={lang} onEmitCoin={handleEmitCoin} />
                  </div>
                )}

                {sidebarTab === "mitra" && (
                  <div className="space-y-6">
                    <VerifiedChecklist
                      lang={lang}
                      onVerifySuccess={() => setIsVerifiedSeller(true)}
                      onEmitCoin={handleEmitCoin}
                    />
                    <AdvertiserDashboard
                      lang={lang}
                      walletBalance={walletBalance}
                      onUpdateBalance={(b) => setWalletBalance(b)}
                      onEmitCoin={handleEmitCoin}
                      onAddSponsoredAd={handleAddSponsoredAd}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ============================================================
           FOOTER GENERAL MARGINS
      ============================================================ */}
      <footer className="bg-[#0F1420] border-t border-slate-805/80 py-8 text-xs text-slate-500 mt-16 pb-24 md:pb-8 select-none">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h4 className="font-display font-semibold text-slate-300">
              {t.footerAbout}
            </h4>
            <p className="text-[11px] text-slate-550 leading-normal">
              {t.footerAboutText}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">
              {t.footerHelp}
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="hover:text-slate-300 cursor-pointer">
                {t.footerHelp1}
              </li>
              <li className="hover:text-slate-300 cursor-pointer">
                {t.footerHelp2}
              </li>
              <li className="hover:text-slate-300 cursor-pointer">
                {t.footerHelp3}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">
              {t.footerRania}
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="hover:text-slate-300 cursor-pointer">
                {t.footerRania1}
              </li>
              <li className="hover:text-slate-300 cursor-pointer">
                {t.footerRania2}
              </li>
              <li className="hover:text-slate-300 cursor-pointer">
                {t.footerRania3}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">
              {t.footerSupport}
            </h4>
            <p className="text-[11px] leading-normal">{t.footerSupportText}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-6 pt-4 border-t border-slate-900 text-center text-[10px]">
          &copy; {new Date().getFullYear()} {t.footerCopyright}
        </div>
      </footer>

      {/* ============================================================
           MOBILE LOWER TAB BAR NAVIGATION (Esthetic visual guidelines)
      ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-[150] bg-[#0F1420]/95 backdrop-blur-xl border-t border-slate-800 md:hidden flex justify-around py-2.5 pb-4 text-[10.5px] select-none text-slate-500">
        <button
          onClick={() => {
            setSelectedCategory("all");
            setViewMode("home");
            setSearchQuery("");
            handleEmitCoin(0, 0);
          }}
          className={`flex flex-col items-center gap-1 font-bold cursor-pointer ${selectedCategory === "all" && viewMode === "home" ? "text-[#3B82F6]" : "text-slate-400"}`}
        >
          <span className="text-xl leading-none">🏠</span>
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            const searchInput = document.querySelector(
              'input[type="text"]',
            ) as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }}
          className="flex flex-col items-center gap-1 font-bold text-slate-400 cursor-pointer hover:text-white"
        >
          <span className="text-xl leading-none">🔍</span>
          <span>Cari</span>
        </button>

        <button
          onClick={() => {
            alert(lang === "tet" ? "Loke Pájina Pustulasaun (Order) Sanimar..." : lang === "en" ? "Opening Sanimar Orders page..." : lang === "pt" ? "Abrindo página de Pedidos Sanimar..." : "Membuka halaman Pesanan (Order) Sanimar...");
          }}
          className="flex flex-col items-center gap-1 font-bold text-slate-400 cursor-pointer hover:text-white"
        >
          <span className="text-xl leading-none">📦</span>
          <span>{lang === "tet" ? "Order" : lang === "en" ? "Order" : lang === "pt" ? "Pedidos" : "Order"}</span>
        </button>

        <button
          onClick={() => {
            setViewMode("social");
          }}
          className={`flex flex-col items-center gap-1 font-bold cursor-pointer relative ${viewMode === "social" ? "text-[#3B82F6]" : "text-slate-400 hover:text-white"}`}
        >
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="text-xl leading-none">💬</span>
          <span>{lang === "tet" ? "Chat" : lang === "en" ? "Chat" : lang === "pt" ? "Chat" : "Chat"}</span>
        </button>

        <button
          onClick={() => {
            alert(lang === "tet" ? "Loke Profil Uza-na'in nian..." : lang === "en" ? "Opening User Profile..." : lang === "pt" ? "Abrindo Perfil do Usuário..." : "Membuka Profil Pengguna...");
          }}
          className="flex flex-col items-center gap-1 font-bold text-slate-400 cursor-pointer hover:text-white"
        >
          <span className="text-xl leading-none">👤</span>
          <span>{lang === "tet" ? "Profil" : lang === "en" ? "Profile" : lang === "pt" ? "Perfil" : "Profile"}</span>
        </button>
      </nav>

      {/* ============================================================
           ACTIVE MODALS INJECTIONS
      ============================================================ */}

      {/* 1. Immersive Story Viewer Overlay */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      )}

      {/* Admin Dashboard */}
      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {/* 2. Layaway Contract Creation Modal */}
      {selectedLayawayProduct && (
        <LayawayModal
          product={selectedLayawayProduct}
          walletBalance={walletBalance}
          onClose={() => setSelectedLayawayProduct(null)}
          onEmitCoin={(x, y) => handleEmitCoin(x, y)}
          onUpdateBalance={(newBal) => setWalletBalance(newBal)}
        />
      )}

      {/* 3. High-fidelity Listing Details & Bidding & Checkouts Overlay */}
      {selectedProduct && (
        <ProductDetailModal
          lang={lang}
          product={selectedProduct}
          walletBalance={walletBalance}
          onClose={() => setSelectedProduct(null)}
          onUpdateBalance={(newBal) => setWalletBalance(newBal)}
          onEmitCoin={(x, y) => handleEmitCoin(x, y)}
        />
      )}

      {/* 4. Real-time Ad Publishing Overlay */}
      {showSellModal && (
        <SellModal
          user={currentUser}
          onRequireCredit={() => setShowAdCreditModal(true)}
          onClose={() => setShowSellModal(false)}
          onSubmitProduct={(p, cost) => {
             handleAddProduct(p);
             if (cost > 0 && currentUser) {
               setCurrentUser({
                 ...currentUser,
                 adCredits: currentUser.adCredits - cost
               });
             } else if (cost === 0 && currentUser && currentUser.freeListings > 0 && !p.videoUrl) {
               setCurrentUser({
                 ...currentUser,
                 freeListings: currentUser.freeListings - 1
               });
             }
          }}
          onEmitCoin={(x, y) => handleEmitCoin(x, y)}
        />
      )}

      {/* NEW KREDIT IKLAN & AGEN COMPONENTS */}
      {showRegisterModal && (
         <RegistrationModal 
           onClose={() => setShowRegisterModal(false)} 
           onRegister={(user) => {
             setCurrentUser(user);
             alert("Pendaftaran berhasil! Anda mendapatkan 3 listing gratis.");
           }} 
         />
      )}

      {showAdCreditModal && currentUser && (
         <AdCreditModal 
           user={currentUser}
           onClose={() => setShowAdCreditModal(false)} 
           onPurchase={(pkg) => {
             const added = pkg.baseCredits + pkg.bonusCredits;
             setCurrentUser({
               ...currentUser,
               adCredits: currentUser.adCredits + added
             });
             setShowAdCreditModal(false);
             alert(`Pembelian Sukses!\n\n${added} Kredit Iklan telah ditambahkan ke akun Anda.\nTagihan Anda: $${pkg.priceUSD}`);
           }} 
         />
      )}

      {/* 5. Short Video Reels Immersive Player (Priority #8) */}
      {selectedReel && (
        <ReelsViewerModal
          reel={selectedReel}
          products={products}
          onClose={() => setSelectedReel(null)}
          onSelectProduct={(p) => {
            setSelectedReel(null);
            setSelectedProduct(p);
          }}
          onEmitCoin={handleEmitCoin}
        />
      )}
    </div>
  );
}
