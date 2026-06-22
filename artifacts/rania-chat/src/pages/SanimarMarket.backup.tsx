import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, X, Star, Home, Globe, Plane, Building2, Car,
  ShieldCheck, CheckCircle2, Plus, CreditCard, MapPin, ChevronRight,
  Sparkles, Filter, SlidersHorizontal, Heart, Bookmark, MessageSquare,
  Bot, Wifi, WifiOff, Mic, Navigation, ShoppingBag, Briefcase, Video,
  Users, TrendingUp, Award, Crown, Gem, Flame, Zap, ThumbsUp, Camera, User,
  Settings, BarChart3, Eye, MessageCircle, DollarSign, Package, LayoutDashboard,
  ChevronDown, Send, Image as ImageIcon, Map, Phone, Clock, Store,
  Hotel, CarFront, PlaneTakeoff, Shield, FileText, Utensils, Coffee,
  Beer, TreePine, Mountain, Waves, Anchor, Pill, Stethoscope, PartyPopper, Dog,
  GraduationCap, Wrench, Hammer, ShoppingCart, Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/Layout/LanguageSwitcher";
import Footer from "@/components/Layout/Footer";
import ChatMarket from "@/components/Chat/ChatMarket";
import PromoteModal from "@/components/Market/PromoteModal";

const API_BASE = import.meta.env.VITE_API_URL || "";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  images: string[];
  rating: number;
  reviews: number;
  badge?: string;
  seller: { name: string; verified: boolean; location: string; waNumber: string };
  sponsored: boolean;
  status: string;
  views: number;
  postedAt: string;
  likes: number;
  saves: number;
  type?: string;
  km?: number;
  salary?: number;
  period?: string;
}

const CATEGORIES = [
  { value: "all", label: "Semua", label_en: "All", icon: <Home size={22} />, color: "from-slate-500 to-slate-600" },
  { value: "property", label: "Property", label_en: "Property", icon: <Home size={22} />, color: "from-teal-500 to-emerald-600" },
  { value: "vehicles", label: "Vehicles", label_en: "Vehicles", icon: <CarFront size={22} />, color: "from-sky-500 to-blue-600" },
  { value: "jobs", label: "Jobs", label_en: "Jobs", icon: <Briefcase size={22} />, color: "from-orange-500 to-red-600" },
  { value: "products", label: "Products", label_en: "Products", icon: <ShoppingBag size={22} />, color: "from-pink-500 to-rose-600" },
  { value: "services", label: "Services", label_en: "Services", icon: <Wrench size={22} />, color: "from-lime-500 to-green-600" },
  { value: "businesses", label: "Business", label_en: "Business", icon: <Store size={22} />, color: "from-cyan-500 to-teal-600" },
  { value: "events", label: "Events", label_en: "Events", icon: <PartyPopper size={22} />, color: "from-fuchsia-500 to-purple-600" },
  { value: "education", label: "Education", label_en: "Education", icon: <GraduationCap size={22} />, color: "from-yellow-500 to-amber-600" },
  { value: "health", label: "Health", label_en: "Health", icon: <Stethoscope size={22} />, color: "from-red-500 to-rose-600" },
  { value: "pets", label: "Pets", label_en: "Pets", icon: <Dog size={22} />, color: "from-teal-500 to-green-600" },
];

const TRAVEL_REDIRECTS: Record<string, string> = {
  tour: "/travel/tours",
  flight: "/travel/flights",
  hotel: "/travel/hotels",
  transport: "/travel/rental",
  insurance: "/travel/insurance",
  visa: "/travel/visa",
};

const BADGE_STYLES: Record<string, string> = {
  hot: "bg-gradient-to-r from-red-500 to-orange-600 text-white",
  "flash sale": "bg-gradient-to-r from-amber-500 to-yellow-600 text-black",
  featured: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white",
  vip: "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white",
  premium: "bg-gradient-to-r from-amber-500 to-yellow-600 text-black",
  verified: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
  "top seller": "bg-gradient-to-r from-orange-500 to-red-600 text-white",
  new: "bg-gradient-to-r from-lime-500 to-green-600 text-white",
  "best seller": "bg-gradient-to-r from-indigo-500 to-purple-600 text-white",
};

export default function SanimarMarket() {
  const { t, language } = useLanguage();
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("terbaru");
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [promoteModal, setPromoteModal] = useState({ open: false, listingId: "", listingTitle: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const userId = localStorage.getItem("rania_user_id") || "demo-vendor";

  // Load market data from backend
  useEffect(() => {
    const token = localStorage.getItem("rania_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/api/market/stats`, { headers: headers as Record<string, string> })
      .then(r => r.json())
      .then(d => d.ok && setStats(d.stats))
      .catch(() => {});

    fetch(`${API_BASE}/api/market/banners`, { headers: headers as Record<string, string> })
      .then(r => r.json())
      .then(d => d.ok && setBanners(d.banners))
      .catch(() => {});

    fetch(`${API_BASE}/api/market/products?limit=30`, { headers: headers as Record<string, string> })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const mapped: Product[] = d.results.map((it: any) => ({
            id: it.id,
            name: it.title,
            description: it.description || "No description",
            price: it.price || 0,
            currency: it.currency || "USD",
            category: it.category || "products",
            images: [it.image || "📦"],
            rating: it.rating || 4.5,
            reviews: it.reviews || it.sales || 0,
            badge: it.badge || undefined,
            seller: { name: it.seller || "Unknown", verified: !!it.verified, location: it.location || "Dili", waNumber: it.waNumber || "+6701234567" },
            sponsored: !!it.sponsored,
            status: it.status || "active",
            views: it.views || 0,
            postedAt: it.postedAt || "baru",
            likes: it.likes || 0,
            saves: it.saves || 0,
          }));
          setProducts(mapped);
        }
      })
      .catch(() => setProducts([]));
  }, [API_BASE]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = product.status === "active";
    return matchesCategory && matchesSearch && isActive;
  }).sort((a, b) => {
    switch (sortBy) {
      case "termurah": return a.price - b.price;
      case "termahal": return b.price - a.price;
      case "terlaris": return b.reviews - a.reviews;
      default: return 0;
    }
  }).sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const toggleLike = (productId: string) => {
    const newLiked = new Set(likedProducts);
    newLiked.has(productId) ? newLiked.delete(productId) : newLiked.add(productId);
    setLikedProducts(newLiked);
  };

  const toggleSave = (productId: string) => {
    const newSaved = new Set(savedProducts);
    newSaved.has(productId) ? newSaved.delete(productId) : newSaved.add(productId);
    setSavedProducts(newSaved);
  };

  const handleAiAsk = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const token = localStorage.getItem("rania_token");
      const res = await fetch(`${API_BASE}/api/intelligence/agent/intent-classifier/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: aiQuery }),
      });
      const data = await res.json();
      if (data.ok) {
        setAiResult(`🤖 RANIA detected intent: ${data.result.intent}\nEntities: ${JSON.stringify(data.result.entities)}`);
        if (data.result.destination) {
          navigate(`/sanimar-market?q=${encodeURIComponent(data.result.destination)}`);
        }
      } else {
        setAiResult("I'll search the marketplace for you...");
      }
    } catch {
      setAiResult("I'll search the marketplace for you...");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100 relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <motion.header initial={{ y: -120 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10 shadow-2xl shadow-blue-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-xl font-black text-white">S</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h1>
                <p className="text-[11px] text-blue-300/90 font-bold tracking-[0.25em] uppercase">MARKETPLACE</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {[
                { href: "/", label: "Beranda" },
                { href: "/explore", label: "Jelajahi" },
                { href: "/sanimar-market", label: "Market" },
                { href: "/flight-routes", label: "Rute" },
                { href: "/admin", label: "Admin" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant={item.href === "/sanimar-market" ? "default" : "ghost"} className={`text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all duration-300 ${item.href === "/sanimar-market" ? "bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white shadow-xl shadow-blue-500/30" : "text-slate-200 hover:text-white hover:bg-white/10 backdrop-blur-sm"}`}>
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Link href="/sanimar-market/jual">
                <Button className="hidden sm:flex bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:via-amber-400 hover:to-orange-500 text-black font-black px-6 py-2.5 rounded-2xl shadow-xl shadow-orange-500/40 hover:scale-105 transition-all duration-300">
                  <Plus size={20} className="mr-2" /> Jual
                </Button>
              </Link>
              <Link href="/sanimar-market/ads/dashboard">
                <Button variant="ghost" className="hidden sm:flex text-slate-200 hover:text-white hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 font-semibold text-sm">
                  <Sparkles size={16} className="mr-2 text-amber-400" /> My Ads
                </Button>
              </Link>
              <LanguageSwitcher />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5">
                    <Menu size={28} className="text-blue-200" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85%] sm:w-80 bg-slate-950/95 backdrop-blur-3xl border-r border-white/10">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between py-6 border-b border-white/10">
                      <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30"><span className="text-xl font-black text-white">S</span></div>
                        <div><h2 className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h2><p className="text-[10px] text-blue-300/90 font-bold tracking-[0.25em]">MARKETPLACE</p></div>
                      </Link>
                    </div>
                    <nav className="flex-1 space-y-3 pt-6">
                      {[
                        { href: "/", label: "Beranda", icon: <Home className="text-blue-300" /> },
                        { href: "/explore", label: "Jelajahi", icon: <Globe className="text-blue-300" /> },
                        { href: "/sanimar-market", label: "Market", icon: <ShoppingBag className="text-blue-300" /> },
                        { href: "/flight-routes", label: "Rute", icon: <Plane className="text-blue-300" /> },
                        { href: "/admin", label: "Admin", icon: <Settings className="text-blue-300" /> },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-4 px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5">{item.icon}<span className="font-semibold text-lg">{item.label}</span></Button>
                        </Link>
                      ))}
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <Link href="/sanimar-market/jual" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black font-black py-4 rounded-2xl shadow-xl shadow-orange-500/30"><Plus size={22} className="mr-2" /> Jual Items</Button>
                        </Link>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero / Stats Bar */}
        <motion.section initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          {banners.length > 0 && (
            <div className="mb-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-amber-900/80 p-8 sm:p-12 text-center">
                <div className="text-6xl mb-4">{banners[0]?.image}</div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">{banners[0]?.title}</h2>
                <p className="text-xl text-blue-100 mb-6">{banners[0]?.subtitle}</p>
                <Link href={banners[0]?.link || "/sanimar-market"}>
                  <Button className="bg-white text-slate-900 hover:bg-blue-50 font-black px-8 py-3 rounded-2xl">Lihat Promo</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Stats Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {[
              { label: "Listings", value: stats?.totalListingsDisplay ?? 12450, suffix: "+" },
              { label: "Active Today", value: stats?.activeToday ?? 847, suffix: "" },
              { label: "Sold This Week", value: stats?.soldThisWeek ?? 123, suffix: "" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">{formatNumber(stat.value)}{stat.suffix}</div>
                <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* AI Ask RANIA */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 rounded-3xl border border-blue-400/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"><Bot size={24} className="text-white" /></div>
              <div>
                <h3 className="font-black text-xl text-white">Ask RANIA</h3>
                <p className="text-xs text-blue-200">AI akan mencari seluruh marketplace untuk Anda</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiAsk()} placeholder='Contoh: "Cari hotel murah di Bali" atau "Rumah dijual di Dili bawah $50k"' className="pl-12 pr-4 py-4 h-14 rounded-2xl bg-white/5 border-white/15 text-slate-100 placeholder-slate-500" />
              </div>
              <Button onClick={handleAiAsk} disabled={aiLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black px-6 rounded-2xl">
                {aiLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
              </Button>
            </div>
            {aiResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200">
                {aiResult}
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Categories Grid */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="mb-12">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <ShoppingBag size={28} className="text-blue-400" />
            Kategori {language === "id" ? "Utama" : "Main"}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <motion.button key={cat.value} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedCategory(cat.value)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${selectedCategory === cat.value ? `bg-gradient-to-br ${cat.color} border-white/30 shadow-xl` : "bg-white/5 border-white/10 hover:border-white/30"}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg`}>{cat.icon}</div>
                <span className="text-xs font-bold text-slate-200 text-center leading-tight">{language === "id" ? cat.label : cat.label_en}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Search & Sort */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input type="text" placeholder={language === "id" ? "Cari apa saja..." : "Search anything..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-4 py-4 h-12 rounded-2xl bg-white/5 border-white/15 text-slate-100 placeholder-slate-500" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12">
                <SlidersHorizontal size={18} className="mr-2 text-slate-300" />
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="terbaru">{language === "id" ? "Terbaru" : "Newest"}</SelectItem>
                <SelectItem value="termurah">{language === "id" ? "Termurah" : "Cheapest"}</SelectItem>
                <SelectItem value="termahal">{language === "id" ? "Termahal" : "Most Expensive"}</SelectItem>
                <SelectItem value="terlaris">{language === "id" ? "Terlaris" : "Best Seller"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.section>

        {/* Feed */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              {language === "id" ? " marketplace" : "Marketplace"}
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{filteredProducts.length}</Badge>
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                  <Skeleton className="h-64 w-full bg-white/10" />
                  <div className="p-6 space-y-4"><Skeleton className="h-7 w-28 bg-white/10" /><Skeleton className="h-7 w-3/4 bg-white/10" /><Skeleton className="h-10 w-28 bg-white/10" /></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div variants={itemVariants} className="text-center py-24">
              <div className="text-7xl mb-6 text-slate-500">🔍</div>
              <h3 className="text-3xl font-black text-slate-200 mb-3">{language === "id" ? "Produk tidak ditemukan" : "No products found"}</h3>
              <p className="text-lg text-slate-400">{language === "id" ? "Coba kata kunci lain" : "Try another keyword"}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div key={product.id} variants={itemVariants} layout>
                    <Card className="overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-blue-900/15 hover:shadow-3xl hover:shadow-blue-900/25 transition-all duration-400 group">
                      <div className="relative overflow-hidden">
                        <motion.img whileHover={{ scale: 1.12 }} transition={{ duration: 0.6 }} src={product.images[0]} alt={product.name} className="w-full h-60 sm:h-64 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          {product.badge && <Badge className={`${BADGE_STYLES[product.badge.toLowerCase()] || "bg-white/20 text-white"} border-0 px-3.5 py-1.5 text-xs font-black shadow-lg`}>{product.badge}</Badge>}
                          {product.sponsored && <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3.5 py-1.5 text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-1"><Sparkles size={12} /> Sponsored</Badge>}
                        </div>
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }} className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"><Heart size={20} className={likedProducts.has(product.id) ? "fill-red-500 text-red-500" : ""} /></Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleSave(product.id); }} className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"><Bookmark size={20} className={savedProducts.has(product.id) ? "fill-blue-400 text-blue-400" : ""} /></Button>
                        </div>
                        <div className="absolute bottom-4 left-4 flex gap-3">
                          <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20"><Heart size={14} className="text-red-400" /><span className="text-xs font-bold text-white">{formatNumber(product.likes)}</span></div>
                          <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20"><Star size={14} className="text-amber-400" /><span className="text-xs font-bold text-white">{product.rating} ({product.reviews})</span></div>
                        </div>
                      </div>

                      <CardHeader className="pb-3 px-6 pt-6">
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <Badge variant="outline" className="bg-white/5 text-slate-200 border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">{product.category}</Badge>
                          {product.seller.verified && <Badge variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30 px-3 py-1 text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={12} />{language === "id" ? "Terverifikasi" : "Verified"}</Badge>}
                        </div>
                        <CardTitle className="text-xl sm:text-2xl mt-2 text-white font-bold line-clamp-2">{product.name}</CardTitle>
                        <CardDescription className="text-base line-clamp-2 text-slate-400 mt-2 leading-relaxed">{product.description}</CardDescription>
                        <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5"><MapPin size={14} />{language === "id" ? "Oleh" : "By"} <span className="text-slate-300 font-semibold">{product.seller.name}</span> • {product.seller.location}</div>
                      </CardHeader>

                      <CardFooter className="flex items-end justify-between pt-2 px-6 pb-6 gap-3">
                        <div>
                          {product.originalPrice && <span className="text-sm text-slate-500 line-through mr-2">${product.originalPrice}</span>}
                          <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-300 via-white to-amber-300 bg-clip-text text-transparent">${product.price}</span>
                          <span className="text-sm text-slate-400 ml-1">{product.currency}{product.period ? `/${product.period}` : ""}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button asChild className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 rounded-2xl">
                            <a href={`https://wa.me/${product.seller.waNumber}?text=Halo, saya lihat iklan ${product.name} di Sanimar Market`} target="_blank" rel="noopener noreferrer"><MessageSquare size={18} className="mr-1.5" />Chat</a>
                          </Button>
                          <Button variant="secondary" onClick={() => navigate(`/sanimar-market/product/${product.id}`)} className="bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 font-semibold hover:scale-105 transition-all duration-300 rounded-2xl">Detail <ChevronRight size={16} className="ml-1" /></Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

      </main>

      {/* Floating CTA + Bottom Nav (mobile) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        <Button onClick={() => setIsChatOpen(true)} className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center"><Bot size={28} /></Button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          {[
            { href: "/", icon: <Home size={22} />, label: "Home" },
            { href: "/explore", icon: <Globe size={22} />, label: "Explore" },
            { href: "/sanimar-market/jual", icon: <Plus size={26} />, label: "Sell", highlight: true },
            { href: "/sanimar-market/chat", icon: <MessageCircle size={22} />, label: "Chat" },
            { href: "/profile", icon: <User size={22} />, label: "Profile" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 ${item.highlight ? "bg-gradient-to-t from-orange-500 to-amber-500 text-black -mt-4 shadow-xl shadow-orange-500/40 w-16 h-16 justify-center" : "text-slate-300 hover:text-white"}`}>
                {item.icon}
                <span className={`text-[10px] font-bold ${item.highlight ? "text-black" : ""}`}>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
      <ChatMarket isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} onClose={() => setIsChatOpen(false)} />
      <PromoteModal isOpen={promoteModal.open} onClose={() => setPromoteModal({ open: false, listingId: "", listingTitle: "" })} listingId={promoteModal.listingId} listingTitle={promoteModal.listingTitle} userId={userId} />
    </div>
  );
}