"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  ArrowRight, 
  Check, 
  ExternalLink, 
  Sparkles, 
  DollarSign, 
  Eye, 
  TrendingUp, 
  MessageSquare, 
  Share2, 
  Heart, 
  Clock, 
  Smartphone, 
  Radio, 
  MapPin, 
  PlusCircle, 
  Tag, 
  ChevronRight, 
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldAlert,
  ArrowRightLeft,
  Search,
  Sliders,
  Send,
  Building,
  Briefcase
} from "lucide-react";

// ============================================================================
// TYPE DECLARATIONS & INTERFACES (Full Compliance)
// ============================================================================
export interface AdCampaign {
  id: string;
  listingId: string;
  budget: number;
  spent: number;
  cpc: number;
  status: "active" | "completed" | "paused";
  expiresAt: string;
  viewsLimit: number;
  viewsCount: number;
  clicksCount: number;
  chatsCount: number;
  tier: "gratis" | "boost_2" | "boost_5" | "boost_20";
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: "property" | "vehicles" | "jobs" | "products" | "services" | "hotel" | "events" | "jastip";
  location: string;
  imageUrls: string[];
  videoUrl?: string;
  whatsapp: string;
  sellerName: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  moderationReason?: string;
  isSponsored?: boolean;
  boostTier?: "gratis" | "boost_2" | "boost_5" | "boost_20";
}

// Default Seed Listings matching Timor-Leste & Jastip market context
const INITIAL_LISTINGS: Listing[] = [
  {
    id: "lst_1",
    title: "Toyota Hilux Double Cabin 4x4 2019",
    price: 18500,
    description: "Kondisi istimewa, sangat tangguh untuk medan berat Timor-Leste (Dili-Ermera). Pajak lunas, kilometer rendah, terawat berkala di bengkel resmi.",
    category: "vehicles",
    location: "Dili, Comoro",
    imageUrls: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    whatsapp: "+67077301234",
    sellerName: "Manuel De Jesus",
    status: "ACTIVE",
    isSponsored: true,
    boostTier: "boost_20"
  },
  {
    id: "lst_2",
    title: "Tanah Kavling Premium Samping Timor Plaza",
    price: 45000,
    description: "Sertifikat hak milik SHM lengkap. Sangat strategis untuk ruko komersial atau indekos eksklusif karyawan swasta asing. Akses jalan 8 meter.",
    category: "property",
    location: "Dili, Kampung Alor",
    imageUrls: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=500&q=80"],
    whatsapp: "+67077423321",
    sellerName: "Zelia Fernandes",
    status: "ACTIVE",
    isSponsored: false
  },
  {
    id: "lst_3",
    title: "Jastip Rutin Kupang - Atambua - Dili (Mingguan)",
    price: 15,
    description: "Menerima titipan beras premium, suku cadang motor orisinil, pakaian, kosmetik BPOM, dan makanan beku terjamin suhu dinginnya. Berangkat tiap Kamis pagi.",
    category: "jastip",
    location: "Kupang / Atambua",
    imageUrls: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80"],
    whatsapp: "+6281234567890",
    sellerName: "Budi Santoso",
    status: "ACTIVE",
    isSponsored: true,
    boostTier: "boost_5"
  },
  {
    id: "lst_4",
    title: "Sopir Truk Logistik Antar Kabupaten",
    price: 380,
    description: "Dibutuhkan supir handal yang hafal jalan daerah Baucau, Lautem, dan Viqueque. Harus memiliki SIM B-TL aktif dan rekam kerja bersih.",
    category: "jobs",
    location: "Dili & Kabupaten",
    imageUrls: ["https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=500&q=80"],
    whatsapp: "+67077229988",
    sellerName: "Trans-Timor Logistics",
    status: "ACTIVE",
    isSponsored: false
  }
];

// Barter node simulation entries for solver
interface BarterNode {
  id: string;
  name: string;
  hasItem: string;
  wantsItem: string;
  whatsapp: string;
}

const DEFAULT_BARTER_NODES: BarterNode[] = [
  { id: "b_1", name: "Anacleto", hasItem: "Ayam Kampung Jantan", wantsItem: "Handphone Android Bekas", whatsapp: "67077123999" },
  { id: "b_2", name: "Domingos", hasItem: "Handphone Android Bekas", wantsItem: "Beras Premium 20kg", whatsapp: "67077223888" },
  { id: "b_3", name: "Xavier", hasItem: "Beras Premium 20kg", wantsItem: "Ayam Kampung Jantan", whatsapp: "67077323777" },
  { id: "b_4", name: "Maria", hasItem: "Sapi Timor Dewasa", wantsItem: "Traktor Tangan", whatsapp: "67077423666" }
];

export default function SanimarMarketV3() {
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"market" | "jual" | "ads_dashboard" | "barter_chain" | "live_shopping">("market");
  
  // Rania Live Shopping variables
  const [chatMessages, setChatMessages] = useState<{ sender: string; message: string; timestamp: string }[]>([
    { sender: "SanimarBot", message: "Selamat Datang di Live streaming Rania! AI Host siap mempromosikan barang terbaik Anda.", timestamp: "09:00" },
    { sender: "Filomeno", message: "Apakah Toyota Hilux merah bisa kredit DP 20% ya?", timestamp: "09:12" },
  ]);
  const [userComment, setUserComment] = useState("");
  const [isPlayingLiveAudio, setIsPlayingLiveAudio] = useState(false);
  const [liveScriptIndex, setLiveScriptIndex] = useState(0);

  // Simulation script loops for Rania's TTS live sales
  const raniaLiveScripts = [
    "Halo para pembeli setia Sanimar Timor-Leste! Di depan saya ada Toyota Hilux Double Cabin 2019 seharga $18,500. Ingat, produk premium di atas $100 sudah didukung DP 20% melalui program Layaway BCTL yang resmi!",
    "Bagi para pedagang jastip dari Kupang ke Atambua dan Dili, silakan cek slot jastip mingguan di feed market kami. Tanpa biaya perantara siluman!",
    "Rania juga menyarankan Anda bergabung dengan Beli Bareng Beras Premium 20kg. Coret dari $50 jadi $40, beli bareng 5 rekan Anda untuk perlindungan inflasi.",
  ];

  // Self-Serve Advert Campaign Data States
  const [advertCampaigns, setAdvertCampaigns] = useState<AdCampaign[]>([
    {
      id: "amp_1",
      listingId: "lst_1",
      budget: 20,
      spent: 4.85,
      cpc: 0.05,
      status: "active",
      expiresAt: "2026-06-25",
      viewsLimit: 5000,
      viewsCount: 2420,
      clicksCount: 97,
      chatsCount: 34,
      tier: "boost_20"
    },
    {
      id: "amp_2",
      listingId: "lst_3",
      budget: 5,
      spent: 1.20,
      cpc: 0.05,
      status: "active",
      expiresAt: "2026-06-28",
      viewsLimit: 1000,
      viewsCount: 618,
      clicksCount: 24,
      chatsCount: 5,
      tier: "boost_5"
    }
  ]);

  // Form Posting Listings gratis
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "products",
    location: "",
    whatsapp: "",
    sellerName: "",
    imageLink: "",
    videoLink: "",
    complianceChecked: false
  });
  const [imageFilesCount, setImageFilesCount] = useState(1);
  const [moderationMessage, setModerationMessage] = useState<string | null>(null);
  const [uploadedSuccess, setUploadedSuccess] = useState(false);

  // Interactive Video Player Modal
  const [activeEmbedVideo, setActiveEmbedVideo] = useState<string | null>(null);

  // Micro Affiliate Interstitial Advertising & Timer popup
  const [interstitialAdListing, setInterstitialAdListing] = useState<Listing | null>(null);
  const [interstitialCountdown, setInterstitialCountdown] = useState(3);
  const [activeRedirecting, setActiveRedirecting] = useState(false);

  // Barter Chain graph inputs/solver state
  const [barterNodes, setBarterNodes] = useState<BarterNode[]>(DEFAULT_BARTER_NODES);
  const [newBarter, setNewBarter] = useState({ name: "", hasItem: "", wantsItem: "", whatsapp: "" });
  const [solvedBarterPath, setSolvedBarterPath] = useState<string[]>([]);
  const [barterStatusText, setBarterStatusText] = useState("");

  // CHRONO EFFECTS & CYCLES
  // ============================================================================
  // Interstitial countdown ticker
  useEffect(() => {
    let timer: any;
    if (interstitialAdListing && interstitialCountdown > 0) {
      timer = setTimeout(() => {
        setInterstitialCountdown(prev => prev - 1);
      }, 1000);
    } else if (interstitialCountdown === 0 && interstitialAdListing && activeRedirecting) {
      triggerWaRedirect(interstitialAdListing);
    }
    return () => clearTimeout(timer);
  }, [interstitialAdListing, interstitialCountdown, activeRedirecting]);

  // Rania Live audio commentator automated switching
  useEffect(() => {
    const liveSec = setInterval(() => {
      setLiveScriptIndex(prev => (prev + 1) % raniaLiveScripts.length);
      // Automatically add mock user commentary in live stream
      const names = ["Xavier", "Atina", "Lee", "Carlos", "Gracia", "Jose"];
      const messages = [
        "Aplikasi market paling keren di Dili!",
        "Bagaimana cara mempromosikan produk gratis saya?",
        "Rania sangat pintar bicaranya, suaranya jernih.",
        "Jastip ke Atambua lewat PLBN Motaain lancar?",
        "Sudah top up layaway lewat Bank Mandiri Timor.",
        "Admin tolong approve listing sewa apartemen saya."
      ];
      const randomIdx = Math.floor(Math.random() * messages.length);
      const newMsg = {
        sender: names[Math.floor(Math.random() * names.length)],
        message: messages[randomIdx],
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev.slice(-30), newMsg]);
    }, 12000);
    return () => clearInterval(liveSec);
  }, []);

  // ============================================================================
  // UTILITY HELPER METHODS
  // ============================================================================
  // Video Embed URL Parser
  const extractVideoEmbedUrl = (url: string): string => {
    if (!url) return "";
    try {
      // YouTube Check
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          return `https://www.youtube.com/embed/${match[2]}`;
        }
      }
      // Facebook Video Check
      if (url.includes("facebook.com")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
      }
      // TikTok Embed Fallback
      if (url.includes("tiktok.com")) {
        return `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80`; // Mock placeholder due to frame restraints
      }
    } catch (e) {
      console.warn("Embed conversion error", e);
    }
    return `https://www.youtube.com/embed/dQw4w9WgXcQ`; // Generic demo fallback fallback
  };

  // Barter Chain Solver Engine (Directed Graph Loop Finder)
  const runBarterSolver = () => {
    setSolvedBarterPath([]);
    setBarterStatusText("🤖 Memindai kecocokan barter sirkular lokal...");

    // Build Adjacency connections
    // Find cycles of size > 1 where items matches transitive requirements
    // A wants B's item, B wants C's item, C wants A's item etc.
    setTimeout(() => {
      let pathsFound: string[] = [];
      let found = false;

      // Simple traversal solver
      for (let i = 0; i < barterNodes.length; i++) {
        const first = barterNodes[i];
        // Look for second step
        const matchesSecond = barterNodes.filter(n => n.hasItem.toLowerCase().trim() === first.wantsItem.toLowerCase().trim());
        
        for (let j = 0; j < matchesSecond.length; j++) {
          const second = matchesSecond[j];
          if (second.id === first.id) continue;

          // Look for third step to loop back to first
          const matchesThird = barterNodes.filter(n => n.hasItem.toLowerCase().trim() === second.wantsItem.toLowerCase().trim());
          for (let k = 0; k < matchesThird.length; k++) {
            const third = matchesThird[k];
            if (third.wantsItem.toLowerCase().trim() === first.hasItem.toLowerCase().trim()) {
              // Found a perfect 3-Way Barter Loop!
              pathsFound = [
                `${first.name} memberikan (${first.hasItem}) ke ${second.name}`,
                `${second.name} memberikan (${second.hasItem}) ke ${third.name}`,
                `${third.name} memberikan (${third.hasItem}) ke ${first.name}`
              ];
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      if (found) {
        setSolvedBarterPath(pathsFound);
        setBarterStatusText("🎉 Sanimar Barter Chain AI Menemukan 1 Kecocokan Sirkular!");
      } else {
        setBarterStatusText("❌ Belum ada siklus barter sempurna yang menutup penuh. Tambahkan produk barter baru!");
      }
    }, 1205);
  };

  // Add custom barter node
  const handleAddBarterNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarter.name || !newBarter.hasItem || !newBarter.wantsItem) {
      alert("Harap lengkapi isian data barter!");
      return;
    }
    const node: BarterNode = {
      id: `b_user_${Date.now()}`,
      name: newBarter.name,
      hasItem: newBarter.hasItem,
      wantsItem: newBarter.wantsItem,
      whatsapp: newBarter.whatsapp || "6707700000"
    };

    setBarterNodes(prev => [...prev, node]);
    setNewBarter({ name: "", hasItem: "", wantsItem: "", whatsapp: "" });
    alert("Berhasil memasukkan keinginan barter Anda ke database Sanimar!");
  };

  // Chat/WhatsApp Interstitial Trigger
  const triggerWaRedirectionConsent = (item: Listing) => {
    setInterstitialAdListing(item);
    setInterstitialCountdown(3);
    setActiveRedirecting(true); // Auto redirect enabled
  };

  const triggerWaRedirect = (item: Listing) => {
    setActiveRedirecting(false);
    setInterstitialAdListing(null);

    // Track ad metrics conversion count
    setAdvertCampaigns(prev => prev.map(c => {
      if (c.listingId === item.id) {
        return { ...c, chatsCount: c.chatsCount + 1, spent: parseFloat((c.spent + 0.05).toFixed(2)) };
      }
      return c;
    }));

    // Generate formatted text
    const cleanNum = item.whatsapp.replace(/[^0-9+]/g, "");
    const waText = encodeURIComponent(`Halo ${item.sellerName}, saya melihat barang Anda di Sanimar Market V5: "${item.title}". Apakah barang ini masih tersedia?`);
    window.open(`https://wa.me/${cleanNum}?text=${waText}`, "_blank");
  };

  // AI Moderation engine simulation check
  const handlePriceListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModerationMessage(null);

    const checkText = `${formData.title} ${formData.description}`.toLowerCase();
    const bannedWords = ["ganja", "sabu", "bokep", "porno", "judi", "senjata"];
    const foundBanned = bannedWords.filter(word => checkText.includes(word));

    if (foundBanned.length > 0) {
      setModerationMessage(`⚠️ AI MODERATION DETECTED: Iklan Anda mengandung istilah terlarang yang dilarang BCTL: "${foundBanned.join(", ")}". Harap gunakan bahasa yang legal.`);
      return;
    }

    if (!formData.complianceChecked) {
      setModerationMessage(`⚠️ HARAP SETUJUI: Anda wajib menyetujui fakta bahwa produk bukan obat terlarang/pornografi/senjata tajam untuk meloloskan moderasi.`);
      return;
    }

    // Creating new active item
    const newItem: Listing = {
      id: `lst_custom_${Date.now()}`,
      title: formData.title,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
      category: formData.category as any,
      location: formData.location || "Dili, Timor-Leste",
      imageUrls: [formData.imageLink || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"],
      videoUrl: formData.videoLink,
      whatsapp: formData.whatsapp || "+67077001111",
      sellerName: formData.sellerName || "Penjual Anonim",
      status: "PENDING", // Demands moderator approving
    };

    setListings(prev => [newItem, ...prev]);
    setUploadedSuccess(true);
    setFormData({
      title: "",
      price: "",
      description: "",
      category: "products",
      location: "",
      whatsapp: "",
      sellerName: "",
      imageLink: "",
      videoLink: "",
      complianceChecked: false
    });
  };

  // Approve newly added item as admin
  const handleApproveListing = (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: "ACTIVE" } : l));
  };

  // Sponsor / Boost Campaign creator simulation
  const handleApplyBoost = (listingId: string, tier: "gratis" | "boost_2" | "boost_5" | "boost_20") => {
    const costMap = {
      gratis: 0,
      boost_2: 2,
      boost_5: 5,
      boost_20: 20
    };

    alert(`Mengalihkan Anda ke Xendit Virtual Account Pembayaran senilai $${costMap[tier]} untuk menaikkan peringkat iklan Anda.`);

    // Simulate database insertion for campaign
    const newCamp: AdCampaign = {
      id: `amp_user_${Date.now()}`,
      listingId,
      budget: costMap[tier],
      spent: 0,
      cpc: 0.05,
      status: "active",
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      viewsLimit: tier === "boost_20" ? 15000 : tier === "boost_5" ? 5000 : tier === "boost_2" ? 1000 : 100,
      viewsCount: 0,
      clicksCount: 0,
      chatsCount: 0,
      tier
    };

    setAdvertCampaigns(prev => [newCamp, ...prev]);
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, isSponsored: true, boostTier: tier } : l));
    setActiveTab("ads_dashboard");
  };

  // Live host commentator user message trigger
  const handleSendMessage = () => {
    if (!userComment.trim()) return;
    const newChat = {
      sender: "Kamu (Lee)",
      message: userComment,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages(prev => [...prev, newChat]);
    setUserComment("");

    // Simulate Rania AI Voice answering back instantly
    setTimeout(() => {
      const answers = [
        "Terima kasih atas dukungannya! Semua produk berlisensi BCTL dan terintegrasi aman di basis legal kami.",
        "Pertanyaan menarik! Silakan klik tombol 'Chat Penjual' Anda untuk bernegosiasi secara langsung.",
        "Pastikan saldo dompet digital Anda terhubung ke platform pembayaran Xendit kami demi proteksi total!"
      ];
      const botChat = {
        sender: "Rania (AI Host)",
        message: answers[Math.floor(Math.random() * answers.length)],
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, botChat]);
    }, 1500);
  };

  // Filter & Search Engine Combination
  const displayedListings = listings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "all" ? true : item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans antialiased pb-20 md:pb-6">
      
      {/* ============================================================================
          TOP SCRIPT: GOOGLE ADSENSE INTEGRATION SIMULATION BANNER
          ============================================================================ */}
      <div className="bg-slate-950 border-b border-slate-850 py-1.5 px-4 text-center select-none text-[10.5px]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <span className="text-slate-500 font-mono text-[9px] tracking-wider uppercase bg-slate-900 border border-slate-800 px-1 py-0.5 rounded">
            Google AdSense Auto Multi-Platform
          </span>
          <span className="text-[#A2C7FF] hover:underline cursor-pointer font-medium">
            Spanduk Bersponsor: Klik Untuk Diskon Tiket Kupang-Dili s/d 50%!
          </span>
          <span className="text-slate-600">ID Komisi: SNM-AD-773</span>
        </div>
      </div>

      {/* ============================================================================
          MAIN HEADER STICKY BAR
          ============================================================================ */}
      <header className="sticky top-0 bg-[#0A0E1A]/90 backdrop-blur-md border-b border-slate-850 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black tracking-tight text-xl animate-pulse">
              S
            </div>
            <div>
              <h1 className="font-mono font-black text-xs text-white leading-none tracking-widest uppercase">
                Sanimar Market <span className="text-[#3B82F6]">V5</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-medium">Timor-Leste Microfinance Super-App</span>
            </div>
          </div>

          {/* Core App Main Tab Navigation Panels (Mobile Scalable) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#040810] p-1 rounded-xl border border-slate-850">
            <button 
              onClick={() => setActiveTab("market")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${activeTab === "market" ? "bg-slate-900 border border-slate-850 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              🌐 Pasar Utama
            </button>
            <button 
              onClick={() => setActiveTab("jual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${activeTab === "jual" ? "bg-slate-900 border border-slate-850 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              ➕ Jual Gratis
            </button>
            <button 
              onClick={() => setActiveTab("ads_dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${activeTab === "ads_dashboard" ? "bg-slate-900 border border-slate-850 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              📈 Dashboard AdBoost
            </button>
            <button 
              onClick={() => setActiveTab("barter_chain")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${activeTab === "barter_chain" ? "bg-slate-900 border border-slate-850 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              🔄 AI Barter Chain
            </button>
            <button 
              onClick={() => setActiveTab("live_shopping")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${activeTab === "live_shopping" ? "bg-gradient-to-r from-red-650/40 via-red-950/20 to-transparent border border-red-500/20 text-red-402 hover:text-red-300" : "text-slate-400 hover:text-white"}`}
            >
              🔴 Rania Live Host
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Currency layout wallet display certified for BCTL */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl px-2.5 py-1 text-right max-w-sm hidden sm:block">
              <span className="text-[8px] text-slate-500 font-bold block uppercase font-mono tracking-wider">SALDO UTAMA</span>
              <span className="text-xs font-display font-black text-green-400">$2,450.75</span>
            </div>
          </div>

        </div>
      </header>

      {/* ============================================================================
          MAIN BODY LAYOUT WRAPPER (Mobile First layout optimization SE size compliant)
          ============================================================================ */}
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-6">

        {/* 1. VIEW TAB: GLOBAL MARKETPLACE OVERVIEW */}
        {activeTab === "market" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Multi-platform Slider / Banner Promo carousel */}
            <div className="bg-gradient-to-r from-blue-950/45 via-[#0F1420] to-[#0A0D16] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#3B82F6]/10 to-transparent pointer-events-none blur-3xl" />
              <div className="max-w-lg space-y-2.5 relative z-10">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  🎉 PROMOSI FREE TO PAID
                </span>
                <h2 className="text-base sm:text-xl font-display font-extrabold text-white tracking-tight leading-tighter">
                  Unggah Gratis Iklan Anda & Dapatkan 1,000 Tayangan Bergaransi BCTL!
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Sanimar Market memfasilitasi bisnis retail lokal Timor-Leste agar sanggup bertumbuh organik tanpa menderita potongan komisi tinggi. Mulai dorong penjualan Anda harian menggunakan dasbor mandiri kami.
                </p>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => setActiveTab("jual")}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    Mulai Berdagang Gratis <ArrowRight size={12} />
                  </button>
                  <button 
                    onClick={() => setActiveTab("live_shopping")}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold border border-slate-800 text-xs px-3.5 py-2 rounded-xl transition-colors"
                  >
                    Tonton Demo Rania Live
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Category Filters bar Layout */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                  🗂️ PILIH KATEGORI PASAR
                </span>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Hapus Pencarian
                  </button>
                )}
              </div>

              {/* Responsive Category Selector */}
              <div className="grid grid-cols-4 sm:grid-cols-9 gap-1.5">
                {[
                  { id: "all", label: "Semua", icon: "🌐" },
                  { id: "property", label: "Properti", icon: "🏠" },
                  { id: "vehicles", label: "Kendaraan", icon: "🚗" },
                  { id: "jobs", label: "Kerja/Jobs", icon: "💼" },
                  { id: "products", label: "Ritel", icon: "🛍️" },
                  { id: "services", label: "Jasa", icon: "🛠️" },
                  { id: "hotel", label: "Hotel", icon: "🏨" },
                  { id: "events", label: "Event", icon: "🎟️" },
                  { id: "jastip", label: "Jastip Kupang", icon: "📦" }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${activeCategory === cat.id ? "bg-blue-600/10 border-blue-500 text-white shadow" : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800"}`}
                  >
                    <span className="text-sm mb-1">{cat.icon}</span>
                    <span className="text-[9.5px] font-mono leading-none truncate w-full">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Responsive Search Bar panel */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari hilux, kavling tanah, jastip kupang, baju dsb..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0E1322] border border-slate-800 rounded-xl px-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Core Listing Feed view with In-feed AdSense slot insertion */}
            <div className="space-y-6">
              
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  MENAMPILKAN {displayedListings.length} BARANG TERATAS TIMOR LESTE
                </span>
                <span className="text-[10px] text-green-400 font-mono uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 font-bold">
                  Kepatuhan BCTL Ok ✓
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayedListings.map((item, idx) => {
                  const hasVideo = !!item.videoUrl;
                  const isSP = item.isSponsored;

                  return (
                    <div 
                      key={item.id}
                      className={`bg-[#0F1420] border rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all hover:scale-[1.01] hover:border-slate-700 relative group ${isSP ? "border-amber-500/30 ring-1 ring-amber-500/20" : "border-slate-850"}`}
                    >
                      {/* Flag Boost Badge indicators */}
                      {isSP && (
                        <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black text-[8px] font-mono uppercase px-2 py-0.5 rounded-md z-10 tracking-widest shadow-lg animate-pulse">
                          🔥 {item.boostTier === "boost_20" ? "HOMEPAGE HERO" : "RECOMMENDED BOOST"}
                        </div>
                      )}

                      {/* Video Embed Play Button Indicator */}
                      {hasVideo && (
                        <button
                          onClick={() => setActiveEmbedVideo(item.videoUrl || null)}
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-red-650 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-lg z-10 transition-transform hover:scale-110"
                          title="Tonton Video"
                        >
                          <Play size={11} className="fill-current ml-0.5" />
                        </button>
                      )}

                      {/* Display image content */}
                      <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
                        <img 
                          src={item.imageUrls[0]} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" 
                        />
                        {/* Downpayment 20% Layer Compliance for BCTL */}
                        {item.price > 100 && (
                          <div className="absolute bottom-2 left-2 bg-[#040D1E]/90 border border-blue-500/40 text-blue-400 font-mono font-bold text-[8.5px] px-2 py-0.5 rounded">
                            DP 20% OK LAYAWAY
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-slate-950/75 text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded">
                          📍 {item.location}
                        </div>
                      </div>

                      {/* Product copy details */}
                      <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                        
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                            Kategori: {item.category.toUpperCase()}
                          </span>
                          <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-[10.5px] text-slate-400 line-clamp-3 leading-normal">
                            {item.description}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-850/60">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-[#5CBAFF]">
                              ${item.price.toLocaleString()}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono uppercase">TUNAI</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => triggerWaRedirectionConsent(item)}
                              className="flex-1 bg-blue-650 hover:bg-blue-600 font-bold text-[10.5px] py-2 px-2.5 rounded-lg text-white transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                            >
                              💬 Chat Penjual
                            </button>
                            {item.price > 100 && (
                              <button
                                onClick={() => {
                                  alert(`Membuka Simulasi Layaway BCTL untuk: ${item.title}. Silakan bayar DP sebesar $${Math.round(item.price * 0.2)} untuk menyegel.`);
                                }}
                                className="bg-[#111827] hover:bg-slate-850 border border-slate-800 text-[#F5A623] hover:text-white font-mono font-bold text-[9px] px-1.5 py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                DP & Cicil
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Horizontal Native In-feed Ad Banner Mock */}
              <div className="bg-[#111827] border border-dashed border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/10 text-[#F5A623] flex items-center justify-center text-xl font-bold">
                    💡
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#F5A623] uppercase font-mono tracking-wider">
                      BERSUAKA RESMI & PEKERJAAN JASTIP (NATIVE BRAND SPONSOR)
                    </h5>
                    <p className="text-[10px] text-slate-400 max-w-lg leading-normal mt-0.5">
                      Ingin jualan Anda mejeng sebagai Native Ad Card yang ramah pengguna di Dili dan Baucau? Dapatkan 50,000 tayangan eksklusif hanya senilai $10. Tanpa komisi pihak ketiga!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleApplyBoost("lst_1", "boost_5")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                >
                  Pasang Sekarang
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 2. VIEW TAB: POST BARANG BARU DENGAN AI MODERASI */}
        {activeTab === "jual" && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-850 pb-3">
                <h3 className="font-display font-extrabold text-white text-base leading-none">
                  Sanimar Market - Posting Iklan Baru Gratis
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Posting jualan properti, kendaraan, ritel, atau jasa jastip Anda secara lokal tanpa menderita biaya manipulasi.
                </p>
              </div>

              {uploadedSuccess && (
                <div className="bg-green-950/20 border border-green-500/30 rounded-xl p-3 text-xs text-green-400 flex flex-col gap-2">
                  <span className="font-bold">✓ Pendaftaran Iklan Anda Berhasil Masuk Antrean Moderasi!</span>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    AI Sanimar sedang melakukan moderasi auto-flagging. Jika tidak ada kata terlarang, iklan Anda otomatis berstatus ACTIVE dan dapat diaktifkan menggunakan dasbor AdBoost.
                  </p>
                  <button 
                    onClick={() => setUploadedSuccess(false)}
                    className="bg-slate-900 border border-slate-850 text-slate-300 text-[10px] py-1 px-3.5 rounded-lg flex self-start mt-1"
                  >
                    Pasang Produk Lainnya
                  </button>
                </div>
              )}

              {moderationMessage && (
                <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 text-[10px] text-red-400">
                  {moderationMessage}
                </div>
              )}

              <form onSubmit={handlePriceListingSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">1. JUDUL IKLAN DAGANGAN</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Honda Beat Esp 2018 Terawat"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">2. HARGA UTAMA (USD DOLAR CAIR)</label>
                    <input
                      required
                      type="number"
                      placeholder="Dilarang memasukkan format angka tidak wajar"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono font-bold block">3. DESKRIPSI SPESIFIKASI DAN KONDISI BARANG</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Min 20 kata. Terangkan garansi, orisinalitas, dan cara pengambilan barang. Gunakan bahasa yang sopan."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">4. KATEGORI UTAMA</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="property">Property / Sewa Ruko</option>
                      <option value="vehicles">Kendaraan Bermotor</option>
                      <option value="jobs">Pekerjaan & Lowongan Karir</option>
                      <option value="products">Ritel / Sembako</option>
                      <option value="services">Jasa Konstruksi / Reparasi</option>
                      <option value="hotel">Varian Hotel / Villa Bed</option>
                      <option value="events">Tiket Konser / Event Lokal</option>
                      <option value="jastip">Jastip Kupang-Dili</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">5. LOKASI PENJUALAN</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Timor Plaza / Kampung Alor Dili"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-550"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">6. NOMOR WHATSAPP AKTIF SELLER</label>
                    <input
                      required
                      type="text"
                      placeholder="Format: 67077xxxx / 6281xxxx"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">7. NAMA ASLI PENJUAL</label>
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nama KTP Anda"
                      value={formData.sellerName}
                      onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">8. TAUTAN GAMBAR / DESAIN UTAMA (FOTO UNPLASH LING)</label>
                    <input
                      type="text"
                      placeholder="Masukkan url gambar atau kosongkan untuk default"
                      value={formData.imageLink}
                      onChange={(e) => setFormData({ ...formData, imageLink: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono font-bold block">9. TAUTAN VIDEO EMBED (YouTube/TikTok/FB)</label>
                    <input
                      type="text"
                      placeholder="Paste link video YouTube / Facebook/ Instagram Reels harian Anda"
                      value={formData.videoLink}
                      onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-2.5">
                  <div className="flex gap-2 items-start">
                    <input
                      id="compliance"
                      type="checkbox"
                      checked={formData.complianceChecked}
                      onChange={(e) => setFormData({ ...formData, complianceChecked: e.target.checked })}
                      className="mt-0.5 rounded border-slate-800 text-blue-600 focus:ring-0 bg-slate-950 cursor-pointer"
                    />
                    <label htmlFor="compliance" className="text-[10px] text-slate-400 leading-normal font-sans cursor-pointer">
                      <b>Sertifikasi Kepatuhan Pasang Produk:</b> Saya menjamin di bawah hukum Timor Plaza dan BCTL bahwa dagangan di atas tidak melanggar ketentuan pidana penipuan, bukan sejenis zat adiktif (ganja/sabu/miras ilegal), pornografi, maupun jasa judi. Pelanggaran siap berakibat suspend IP selamanya.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold tracking-wider uppercase py-3.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Ajukan Pasang Iklan Sekarang (Gratis & Aman)
                </button>
              </form>
            </div>

            {/* Quick Admin Simulator Panel for convenience testing */}
            <div className="bg-[#111827] border border-dashed border-slate-800 rounded-2xl p-4">
              <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded font-black uppercase">
                ADMIN PANEL SIMULATOR MODERASI (Klik Approve Testing)
              </span>
              <div className="mt-3 space-y-2">
                {listings.filter(l => l.status === "PENDING").map(p => (
                  <div key={p.id} className="p-3 bg-[#0B0F1A] border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                    <div className="truncate">
                      <b className="text-white text-xs block truncate">{p.title}</b>
                      <span className="text-[10px] text-yellow-500">Menunggu AI Moderasi: Tidak Ditemukan Kata Ilegal</span>
                    </div>
                    <button 
                      onClick={() => handleApproveListing(p.id)}
                      className="bg-green-650 hover:bg-green-500 text-white font-bold font-mono text-[10px] px-3.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
                    >
                      Setujui (Approve)
                    </button>
                  </div>
                ))}
                {listings.filter(l => l.status === "PENDING").length === 0 && (
                  <p className="text-[10px] text-slate-500 italic">Tidak ada listing peninjauan aktif saat ini. Coba buat iklan Baru!</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 3. VIEW TAB: SELF-SERVE ADS BOOST DASHBOARD */}
        {activeTab === "ads_dashboard" && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-850 pb-4 mb-5 gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Dasbor Pengiklan Mandiri (AdBoost Self-Serve)</h3>
                  <p className="text-xs text-slate-400">Investasi iklan otomatis tanpa komisi pihak ketiga, termonitor real-time oleh BCTL</p>
                </div>
                <div className="bg-slate-950 px-3.5 py-1 rounded-xl border border-slate-850 text-right">
                  <span className="text-[8px] text-slate-500 font-mono block">MOCK WALLET SALDO ADS</span>
                  <b className="text-sm font-mono text-green-400">$340.00</b>
                </div>
              </div>

              {/* Grid of Analytical Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0B0F1A] border border-slate-850 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-500 font-mono block">TOTAL TAYANGAN KMANEK</span>
                  <b className="text-lg font-display text-white mt-1 block">3,038</b>
                  <span className="text-[9px] text-green-400 font-mono">+12% vs Kemarin</span>
                </div>
                <div className="bg-[#0B0F1A] border border-slate-850 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-505 font-mono block">TOTAL KLIK IKLAN</span>
                  <b className="text-lg font-display text-[#3B82F6] mt-1 block">121</b>
                  <span className="text-[9px] text-slate-500 font-mono">CTR Rata-rata 4.0%</span>
                </div>
                <div className="bg-[#0B0F1A] border border-slate-850 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-500 font-mono block">NEGOSIASI WA MASUK</span>
                  <b className="text-lg font-display text-green-400 mt-1 block">39</b>
                  <span className="text-[9px] text-green-400 font-mono">Terkonversi Sukses</span>
                </div>
                <div className="bg-[#0B0F1A] border border-slate-850 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-500 font-mono block">RATA CPC AKTIF</span>
                  <b className="text-lg font-display text-[#F5A623] mt-1 block">$0.05</b>
                  <span className="text-[9px] text-slate-500 font-mono">Cost-per-WhatsApp Chat</span>
                </div>
              </div>

              {/* Active list Campaigns detailed stats */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                  🛡️ Kampanye AdBoost Anda yang Sedang Mengudara
                </h4>

                <div className="space-y-2.5">
                  {advertCampaigns.map((camp) => {
                    const matchedListing = listings.find(l => l.id === camp.listingId);
                    if (!matchedListing) return null;

                    const percent = Math.min(((camp.viewsCount / camp.viewsLimit) * 100), 100);

                    return (
                      <div 
                        key={camp.id}
                        className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between gap-4 items-stretch"
                      >
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white leading-none">{matchedListing.title}</span>
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                              {camp.tier.replace("_", " ").toUpperCase()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10.5px] text-slate-500">
                              <span>Tayangan Organik Terkirim: <b className="text-slate-300 font-mono">{camp.viewsCount}/{camp.viewsLimit}</b></span>
                              <span>Pencapaian: {Math.round(percent)}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#0B0F1A] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1 text-slate-400">
                            <div className="bg-[#0B0F1A] p-1.5 rounded">
                              Klik: <b className="text-white">{camp.clicksCount}</b>
                            </div>
                            <div className="bg-[#0B0F1A] p-1.5 rounded">
                              Chat WA: <b className="text-[#3B82F6]">{camp.chatsCount}</b>
                            </div>
                            <div className="bg-[#0B0F1A] p-1.5 rounded">
                              Anggaran Habis: <b className="text-green-400">${camp.spent}</b>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col justify-between items-center border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-4 shrink-0 text-right">
                          <div className="text-left md:text-right">
                            <span className="text-[9px] text-slate-500 block font-mono">TENGGAT EXPIRES</span>
                            <span className="text-xs text-white font-mono font-bold">{camp.expiresAt}</span>
                          </div>
                          <div>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse mr-1" />
                            <span className="text-xs font-mono font-bold text-green-400 uppercase">AKTIF</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Premium Package Options to Boost and promote (Upstream pricing) */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-2 mb-4">
                🚀 PILIH & AKTIFKAN PROGRAM BOOSTING INSTAN (BAYAR VIA XENDIT)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    tier: "gratis" as const,
                    title: "Gratis Lokal",
                    price: "$0",
                    reach: "100 Tayangan Organik",
                    features: ["Status standard", "Pemasangan gratis selamanya", "Tampil di sub-feed standard", "Penyaringan robot/AI dasar"],
                    tag: "BEGINNER"
                  },
                  {
                    tier: "boost_2" as const,
                    title: "Boost Menengah",
                    price: "$2",
                    reach: "1,000 Tayangan Bergaransi",
                    features: ["Badge 'Dipromosikan' 3 Hari", "Penempatan prioritas", "Tracking CPC dasbor aktif", "Dukungan CS 24 Jam"],
                    tag: "POPULER"
                  },
                  {
                    tier: "boost_5" as const,
                    title: "Boost Super",
                    price: "$5",
                    reach: "5,000 Tayangan + Top Search",
                    features: ["Top Pencarian 7 Hari", "Badge 'Dipromosikan' Emas", "Metrik Klik & Chat lengkap", "Auto-Integrasi Rania Live"],
                    tag: "REKOMENDASI"
                  },
                  {
                    tier: "boost_20" as const,
                    title: "Homepage Hero Banner",
                    price: "$20",
                    reach: "15,000 Tayangan Homepage",
                    features: ["Spanduk Utama Atas 24 Jam", "Maksimal konversi WA", "Sertifikat prioritas utama", "Afiliasi Intersisi prioritas"],
                    tag: "ENTERPRISE"
                  }
                ].map((pack) => (
                  <div 
                    key={pack.tier}
                    className="p-4 bg-slate-900 border border-slate-855 rounded-xl text-center flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all"
                  >
                    <div className="space-y-2">
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded-full font-bold uppercase inline-block">
                        {pack.tag}
                      </span>
                      <h4 className="font-display font-extrabold text-white text-sm">{pack.title}</h4>
                      <b className="text-xl font-display text-green-400 block">{pack.price}</b>
                      <span className="text-[10px] text-slate-400 font-mono block">{pack.reach}</span>
                      
                      <ul className="text-left text-[10px] text-slate-500 space-y-1.5 pt-3 border-t border-slate-850/60">
                        {pack.features.map((f, fi) => (
                          <li key={fi} className="flex gap-1 items-start">
                            <span className="text-green-500">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[8px] text-slate-500 font-mono block uppercase">Pilih produk Anda</label>
                      <select 
                        className="w-full bg-[#0E1322] border border-slate-800 rounded p-1.5 text-[10px] text-white focus:outline-none"
                        id={`select_boost_${pack.tier}`}
                      >
                        {listings.map(l => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const el = document.getElementById(`select_boost_${pack.tier}`) as HTMLSelectElement;
                          if (el) {
                            handleApplyBoost(el.value, pack.tier);
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10px] py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Aktifkan Iklan via Xendit
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* 4. VIEW TAB: INTERACTIVE BARTER CHAIN LOOP FINDER */}
        {activeTab === "barter_chain" && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                    🔄 Sanimar Barter Chain AI <span className="text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">SOLVER AKTIF</span>
                  </h3>
                  <p className="text-xs text-slate-400">Pertukaran 3-pihak sirkular: Tukar apa yang Anda miliki dengan impian Anda!</p>
                </div>
                <button
                  onClick={runBarterSolver}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <Sparkles size={13} />
                  <span>Pecahkan Logika Barter AI</span>
                </button>
              </div>

              {/* Solved cycle pathways display */}
              {barterStatusText && (
                <div className="bg-[#0B0F1A] border border-slate-850 rounded-xl p-4 mb-6 space-y-3">
                  <div className="text-xs font-bold text-slate-300">{barterStatusText}</div>
                  
                  {solvedBarterPath.length > 0 ? (
                    <div className="space-y-2 bg-gradient-to-br from-green-950/20 to-slate-900 border border-green-500/20 p-3 rounded-lg">
                      <h4 className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider font-mono">ROADMAP PERTUKARAN MULTI-PARTY:</h4>
                      <div className="space-y-2 pt-1 font-mono text-[11px] text-slate-200">
                        {solvedBarterPath.map((path, pIdx) => (
                          <div key={pIdx} className="flex gap-2 items-center">
                            <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-450 flex items-center justify-center font-bold text-[10px] shrink-0">{pIdx + 1}</span>
                            <span>{path}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850 mt-3 text-[10px] text-slate-500 leading-normal">
                        💡 <b>Langkah Selanjutnya:</b> Tombol persetujuan kontrak digital akan dikirim lewat notifikasi WA terdaftar. Sukses tertukar saat ketiga pihak sepakat sirkular!
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Visual node grid showing what society has & wants */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {barterNodes.map((b) => (
                  <div 
                    key={b.id}
                    className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">🙋‍♂️ {b.name}</span>
                        <span className="text-slate-600">ID: {b.id.substring(0, 5)}</span>
                      </div>

                      <div className="space-y-2 pt-2 text-[11.5px]">
                        <div>
                          <span className="text-[9px] text-slate-402 uppercase font-mono block">MELEPAS:</span>
                          <b className="text-white">{b.hasItem}</b>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-402 uppercase font-mono block">MENCARI:</span>
                          <b className="text-[#F5A623]">{b.wantsItem}</b>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={`https://wa.me/${b.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-1.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-all text-[10px] font-bold block"
                    >
                      Hubungi Wa: +{b.whatsapp.substring(0, 5)}...
                    </a>
                  </div>
                ))}
              </div>

              {/* Multi-party Form for user inputs */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
                <h4 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-2 mb-4">
                  ➕ AJUKAN PRODUK BARTER ANDA SEKARANG
                </h4>

                <form onSubmit={handleAddBarterNode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs font-sans">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono">Nama Anda</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Carlos"
                      value={newBarter.name}
                      onChange={(e) => setNewBarter({ ...newBarter, name: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono">Barang yang Anda Miliki</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Traktor Tangan"
                      value={newBarter.hasItem}
                      onChange={(e) => setNewBarter({ ...newBarter, hasItem: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-mono">Barang yang Anda Cari</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Sapi Timor Dewasa"
                      value={newBarter.wantsItem}
                      onChange={(e) => setNewBarter({ ...newBarter, wantsItem: e.target.value })}
                      className="w-full bg-[#0E1322] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-650 hover:bg-blue-600 text-white font-mono font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Daftarkan Barter Baru
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* 5. VIEW TAB: AI RANIA LIVE COMMENTARY STREAMING */}
        {activeTab === "live_shopping" && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Simulated Livestream Visual Container */}
                <div className="lg:col-span-2 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden min-h-[350px] relative flex flex-col justify-between">
                  
                  {/* Streaming Overlays Status */}
                  <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 select-none">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-widest animate-pulse">
                        LIVE SHOPPING
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">
                        👀 14,240 Pemirsa Lokal Dili
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlayingLiveAudio(!isPlayingLiveAudio)}
                        className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
                        title={isPlayingLiveAudio ? "Mute audio" : "Aktifkan TTS"}
                      >
                        {isPlayingLiveAudio ? <Volume2 size={13} /> : <VolumeX size={13} />}
                      </button>
                      <span className="text-slate-400 text-[10px] font-mono uppercase bg-[#0F1420] px-2 py-0.5 rounded border border-slate-800 font-bold">
                        AI HOST RANIA v5
                      </span>
                    </div>
                  </div>

                  {/* Render Visual Background Center for Rania Live host */}
                  <div className="flex-grow flex items-center justify-center p-8 relative">
                    <div className="absolute inset-0 opacity-15">
                      <div className="w-full h-full bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
                    </div>

                    <div className="text-center space-y-4 relative z-10 max-w-md">
                      <div className="w-24 h-24 rounded-full border-2 border-blue-500 overflow-hidden shadow-2xl mx-auto animate-[pulse_3s_infinite] bg-slate-950">
                        <img 
                          src="/src/assets/images/rania_avatar_1782061622582.jpg" 
                          alt="Rania Live" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-display font-extrabold text-white">AI Host Rania Timor-Leste</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-normal">
                          Mengoptimalkan penjualan properti & barang retail lokal 24 Jam nonstop memakai alur komparasi BCTL cerdas.
                        </p>
                      </div>

                      {/* Rania's Speak bubble script updated dynamically */}
                      <div className="bg-[#0A0D16] border border-blue-500/35 p-3.5 rounded-2xl relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#0A0D16] border-t border-l border-blue-500/35 rotate-45" />
                        <p className="text-[11px] font-medium text-slate-200 italic leading-relaxed">
                          &ldquo;{raniaLiveScripts[liveScriptIndex]}&rdquo;
                        </p>
                        {isPlayingLiveAudio && (
                          <span className="text-[8px] text-[#A2C7FF] font-mono block mt-2 animate-pulse uppercase font-semibold">
                            🔊 TEXT TO SPEECH SEDANG MENYIKTIRS...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-platform quick action card overlay bottom */}
                  <div className="p-4 bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0 z-10 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-2 items-center text-left">
                      <img src="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80" alt="Beras" className="w-9 h-9 object-cover rounded-md border border-slate-800" />
                      <div>
                        <span className="text-[8px] text-[#F5A623] font-mono block">PRODUK PINNED AKTIF</span>
                        <b className="text-xs text-white block">Beras Premium Timor 20kg</b>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        alert("Membuka detail pembelian group buy via Xendit.");
                      }}
                      className="bg-[#5CBAFF] hover:bg-blue-400 text-slate-950 font-mono font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg shadow-md transition-colors cursor-pointer"
                    >
                      Beli Bareng $40
                    </button>
                  </div>

                </div>

                {/* Live stream comments section */}
                <div className="bg-[#0B0F1A] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between max-h-[350px] lg:max-h-none">
                  
                  <div className="space-y-3">
                    <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                        💬 KOMENTAR PEMIRSA (REALTIME)
                      </span>
                      <span className="p-1 rounded bg-[#111827] text-slate-500 text-[9px] font-mono">
                        Online
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[220px] lg:max-h-[320px] overflow-y-auto pr-1">
                      {chatMessages.map((msg, mIdx) => (
                        <div key={mIdx} className="text-xs space-y-0.5">
                          <div className="flex justify-between items-center">
                            <b className={`${msg.sender.includes("Rania") ? "text-blue-400" : msg.sender.includes("Bot") ? "text-purple-400" : "text-slate-300"}`}>
                              {msg.sender}
                            </b>
                            <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp}</span>
                          </div>
                          <p className="text-slate-400 leading-normal text-[10.5px]">
                            {msg.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-850/60">
                    <input
                      type="text"
                      placeholder="Ketik komentar ke AI Host..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-colors cursor-pointer"
                    >
                      <Send size={13} />
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* ============================================================================
          INTERACTIVE POPUP MODALS & AFFILIATE ADVERT INTERSISIS OVERLAYS
          ============================================================================ */}
      
      {/* A. Lazy Loader embedded video player (No Redirect popup) */}
      {activeEmbedVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0F1420] border border-slate-800 rounded-2xl overflow-hidden relative">
            <button
              onClick={() => setActiveEmbedVideo(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-950 border border-slate-850 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer hover:border-slate-700 z-10 transition-colors"
            >
              <X size={15} />
            </button>
            
            <div className="aspect-video w-full">
              <iframe
                src={extractVideoEmbedUrl(activeEmbedVideo)}
                title="Sanimar Video Embed Player"
                className="w-full h-full border-none"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-between items-center text-xs text-slate-400">
              <span className="font-mono">Sistem Embed Multi-Platform Sanimar Layer</span>
              <span>Proteksi Enkripsi BCTL Aman ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* B. 3-Second Interstitial Affiliate advertising popup before WA */}
      {interstitialAdListing && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1420] border border-amber-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl relative">
            
            <span className="text-[10px] bg-amber-500/10 text-[#F5A623] border border-yellow-500/30 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider inline-block">
              ⚡ PENAWARAN AFILIASI BERSPEED (3 DETIK AMAN)
            </span>

            <div className="space-y-2">
              <h4 className="font-display font-extrabold text-sm text-white">REKOMENDASI BELANJA TERAKREDITASI:</h4>
              <p className="text-xs text-slate-450 leading-relaxed font-sans">
                Sebelum mengalihkan ke WhatsApp penjual, lihat rekomendasi dari Shopee & Aliexpress:
              </p>
            </div>

            {/* Simulated Hot Affiliate Item */}
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl text-left flex gap-3 items-center">
              <img src="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=150&q=80" alt="Affiliate" className="w-12 h-12 object-cover rounded-lg border border-slate-800" />
              <div>
                <b className="text-xs text-white block">Powerbank Anker 20,000mAh Ultra Fast</b>
                <span className="text-[#F5A623] font-mono text-xs font-bold block pt-0.5">$15.00 <span className="text-[9px] text-slate-500 line-through font-normal">$35</span></span>
                <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">KOMISI 5% SANIMAR</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {interstitialCountdown > 0 ? (
                <p className="text-[10.5px] text-slate-500 font-mono animate-pulse">
                  Mengalihkan ke WhatsApp otomatis dalam {interstitialCountdown} detik...
                </p>
              ) : (
                <p className="text-[10.5px] text-green-400 font-mono font-bold">
                  Sistem Redireksi Siap!
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => triggerWaRedirect(interstitialAdListing)}
                  className="flex-1 bg-green-650 hover:bg-green-600 text-white font-mono font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
                >
                  Lewati Iklan & Chat WA Sekarang
                </button>
                <button
                  onClick={() => {
                    window.open(`https://shopee.co.id`, "_blank");
                    triggerWaRedirect(interstitialAdListing);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10.5px] px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Beli Powerbank $15
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================================
          FOOTER LEGAL COMPLIANCE
          ============================================================================ */}
      <footer className="bg-[#0A0D16] border-t border-slate-850 py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6 select-none font-sans">
          
          <div className="space-y-2">
            <h4 className="font-mono font-semibold text-slate-300">SANIMAR MARKET</h4>
            <p className="text-[11px] leading-normal font-light">
              Grup andalan BCTL dengan kepatuhan hukum 100% dari Bank Sentral Timor Plaza demi kelangsungan ekonomi mikro Dili.
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <h4 className="font-semibold text-slate-300">PETA KONEKTIFITAS</h4>
            <li className="list-none hover:text-slate-300 cursor-pointer">Syarat & Ketentuan Layaway</li>
            <li className="list-none hover:text-slate-300 cursor-pointer">Sertifikasi Legalitas Dili</li>
            <li className="list-none hover:text-slate-300 cursor-pointer">Program Beli Bareng</li>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <h4 className="font-semibold text-slate-300">RANIA KARIR & AI</h4>
            <li className="list-none hover:text-slate-300 cursor-pointer">Automasi OCR CV Timor</li>
            <li className="list-none hover:text-slate-300 cursor-pointer">Speech Recognition Tetun</li>
            <li className="list-none hover:text-slate-300 cursor-pointer">AdSense Revenue Share</li>
          </div>

          <div className="space-y-2 text-[11px]">
            <h4 className="font-semibold text-slate-300">ENTITAS RESMI</h4>
            <p className="leading-relaxed font-light">
              Dikelola secara resmi oleh <b>PT Sanimar Solusi Teknologi Dili</b>, Timor-Leste. Untuk dukungan lekas, hubungi nomor WhatsApp Asli Kami: <b>+670 7700 1234</b>.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 text-center mt-6 pt-6 border-t border-slate-850/60 font-mono text-[10px]">
          &copy; {new Date().getFullYear()} PT Sanimar Solusi Teknologi. Hak Cipta Dilindungi Undang-Undang BCTL.
        </div>
      </footer>

      {/* ============================================================================
          MOBILE-ONLY FOOTER NAVIGATION STICKY BAR
          ============================================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1420]/95 backdrop-blur-xl border-t border-slate-800 md:hidden flex justify-around py-3 text-[10px] select-none text-slate-500">
        <button 
          onClick={() => { setActiveTab("market"); }}
          className={`flex flex-col items-center gap-0.5 font-bold ${activeTab === "market" ? "text-[#3B82F6]" : "text-slate-400"}`}
        >
          <span className="text-base">🌐</span>
          <span>Pasar</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab("jual"); }}
          className={`flex flex-col items-center gap-0.5 font-bold ${activeTab === "jual" ? "text-[#3B82F6]" : "text-slate-400"}`}
        >
          <span className="text-base">➕</span>
          <span>Jual</span>
        </button>

        <button 
          onClick={() => { setActiveTab("ads_dashboard"); }}
          className={`flex flex-col items-center gap-0.5 font-bold ${activeTab === "ads_dashboard" ? "text-[#3B82F6]" : "text-slate-400"}`}
        >
          <span className="text-base">📈</span>
          <span>AdBoost</span>
        </button>

        <button 
          onClick={() => { setActiveTab("barter_chain"); }}
          className={`flex flex-col items-center gap-0.5 font-bold ${activeTab === "barter_chain" ? "text-[#3B82F6]" : "text-slate-400"}`}
        >
          <span className="text-base">🔄</span>
          <span>Barter</span>
        </button>

        <button 
          onClick={() => { setActiveTab("live_shopping"); }}
          className={`flex flex-col items-center gap-0.5 font-bold ${activeTab === "live_shopping" ? "text-[#3B82F6]" : "text-slate-400"}`}
        >
          <span className="text-base">🔴</span>
          <span>Live</span>
        </button>
      </nav>

    </div>
  );
}
