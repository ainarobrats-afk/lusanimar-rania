import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Star,
  Home,
  Globe,
  Plane,
  Building2,
  Car,
  ShieldCheck,
  CheckCircle2,
  Plus,
  CreditCard,
  MapPin,
  ChevronRight,
  Sparkles,
  Filter,
  SlidersHorizontal,
  Heart,
  Bookmark,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/Layout/LanguageSwitcher";
import Footer from "@/components/Layout/Footer";
import ChatMarket from "@/components/Chat/ChatMarket";
import PromoteModal from "@/components/Market/PromoteModal";

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: "all" | "tour" | "flight" | "hotel" | "transport" | "insurance" | "visa";
  images: string[];
  rating: number;
  reviews: number;
  badge?: string;
  seller: {
    name: string;
    verified: boolean;
    location: string;
    waNumber: string;
  };
  sponsored: boolean;
  status: "active" | "expired" | "sold_out";
  views: number;
  postedAt: string;
  likes: number;
  saves: number;
  tanggalExpired: string;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Paket Wisata Pulau Komodo 4D3N",
    description: "Nikmati keindahan Pulau Komodo dengan guide lokal profesional.",
    price: 350,
    originalPrice: 450,
    currency: "USD",
    category: "tour",
    images: [
      "https://picsum.photos/400/300?random=1",
      "https://picsum.photos/400/300?random=101",
    ],
    rating: 4.8,
    reviews: 450,
    badge: "Best Seller",
    seller: {
      name: "Komodo Tour Agency",
      verified: true,
      location: "Dili",
      waNumber: "+6707812345",
    },
    sponsored: true,
    status: "active",
    views: 1243,
    postedAt: "3 hari lalu",
    likes: 2340,
    saves: 890,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "Tiket Pesawat Dili - Jakarta",
    description: "Penerbangan langsung dengan maskapai ternama.",
    price: 180,
    originalPrice: undefined,
    currency: "USD",
    category: "flight",
    images: ["https://picsum.photos/400/300?random=2"],
    rating: 4.7,
    reviews: 156,
    badge: "Popular",
    seller: {
      name: "Timor Travel",
      verified: true,
      location: "Dili",
      waNumber: "+6707812346",
    },
    sponsored: true,
    status: "active",
    views: 2345,
    postedAt: "1 hari lalu",
    likes: 1230,
    saves: 456,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Hotel Bintang 5 Dili - Seaside Resort",
    description: "Penginapan mewah dengan fasilitas lengkap.",
    price: 150,
    originalPrice: 200,
    currency: "USD",
    category: "hotel",
    images: ["https://picsum.photos/400/300?random=3"],
    rating: 4.9,
    reviews: 312,
    badge: "Luxury",
    seller: {
      name: "Dili Seaside Resort",
      verified: true,
      location: "Dili",
      waNumber: "+6707812347",
    },
    sponsored: false,
    status: "active",
    views: 897,
    postedAt: "5 hari lalu",
    likes: 980,
    saves: 567,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Sewa Mobil Harian - Avanza",
    description: "Sewa mobil murah dengan sopir.",
    price: 45,
    originalPrice: undefined,
    currency: "USD",
    category: "transport",
    images: ["https://picsum.photos/400/300?random=4"],
    rating: 4.5,
    reviews: 89,
    badge: undefined,
    seller: {
      name: "Dili Car Rental",
      verified: false,
      location: "Dili",
      waNumber: "+6707812348",
    },
    sponsored: false,
    status: "active",
    views: 567,
    postedAt: "2 hari lalu",
    likes: 450,
    saves: 234,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "Asuransi Perjalanan Lengkap",
    description: "Asuransi lengkap untuk melindungi perjalanan Anda.",
    price: 25,
    originalPrice: undefined,
    currency: "USD",
    category: "insurance",
    images: ["https://picsum.photos/400/300?random=5"],
    rating: 4.8,
    reviews: 167,
    badge: "Recommended",
    seller: {
      name: "Timor Insurance",
      verified: true,
      location: "Dili",
      waNumber: "+6707812349",
    },
    sponsored: false,
    status: "active",
    views: 432,
    postedAt: "7 hari lalu",
    likes: 320,
    saves: 189,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    name: "Paket Honeymoon Atauro",
    description: "Pengalaman honeymoon romantis di Pulau Atauro.",
    price: 500,
    originalPrice: 650,
    currency: "USD",
    category: "tour",
    images: ["https://picsum.photos/400/300?random=6"],
    rating: 4.9,
    reviews: 78,
    badge: "Limited",
    seller: {
      name: "Atauro Romance",
      verified: true,
      location: "Atauro",
      waNumber: "+6707812350",
    },
    sponsored: true,
    status: "active",
    views: 876,
    postedAt: "4 hari lalu",
    likes: 1540,
    saves: 678,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "7",
    name: "Visa Australia - Tourist",
    description: "Jasa urus visa Australia tourist.",
    price: 150,
    originalPrice: undefined,
    currency: "USD",
    category: "visa",
    images: ["https://picsum.photos/400/300?random=7"],
    rating: 4.6,
    reviews: 123,
    badge: undefined,
    seller: {
      name: "Visa Center Timor",
      verified: true,
      location: "Dili",
      waNumber: "+6707812351",
    },
    sponsored: true,
    status: "active",
    views: 654,
    postedAt: "1 hari lalu",
    likes: 890,
    saves: 432,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "8",
    name: "Tiket Pesawat Dili - Bali",
    description: "Penerbangan langsung ke Denpasar.",
    price: 120,
    originalPrice: undefined,
    currency: "USD",
    category: "flight",
    images: ["https://picsum.photos/400/300?random=8"],
    rating: 4.6,
    reviews: 98,
    badge: undefined,
    seller: {
      name: "Bali Travel",
      verified: true,
      location: "Dili",
      waNumber: "+6707812352",
    },
    sponsored: false,
    status: "active",
    views: 987,
    postedAt: "3 hari lalu",
    likes: 567,
    saves: 289,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "9",
    name: "Homestay Baucau - Budget",
    description: "Penginapan murah di Baucau.",
    price: 25,
    originalPrice: undefined,
    currency: "USD",
    category: "hotel",
    images: ["https://picsum.photos/400/300?random=9"],
    rating: 4.4,
    reviews: 67,
    badge: undefined,
    seller: {
      name: "Baucau Homestay",
      verified: false,
      location: "Baucau",
      waNumber: "+6707812353",
    },
    sponsored: false,
    status: "active",
    views: 345,
    postedAt: "6 hari lalu",
    likes: 234,
    saves: 123,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "10",
    name: "Paket Tour Ramelau 2D1N",
    description: "Trekking Gunung Ramelau.",
    price: 80,
    originalPrice: undefined,
    currency: "USD",
    category: "tour",
    images: ["https://picsum.photos/400/300?random=10"],
    rating: 4.8,
    reviews: 112,
    badge: undefined,
    seller: {
      name: "Ramelau Adventure",
      verified: true,
      location: "Ermera",
      waNumber: "+6707812354",
    },
    sponsored: false,
    status: "active",
    views: 678,
    postedAt: "5 hari lalu",
    likes: 678,
    saves: 345,
    tanggalExpired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 25, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 13
    }
  }
};

const heroVariants = {
  hidden: { y: -40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
      duration: 0.6
    }
  }
};

export default function SanimarMarket() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Product["category"]>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("terbaru");
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [location, navigate] = useLocation();
  const [promoteModal, setPromoteModal] = useState<{ open: boolean; listingId: string; listingTitle: string }>({
    open: false, listingId: "", listingTitle: "",
  });
  const userId = localStorage.getItem("rania_user_id") || "demo-vendor";

  const CATEGORIES = [
    { value: "all", label: t("all"), icon: <Home size={20} /> },
    { value: "tour", label: t("tours"), icon: <Globe size={20} /> },
    { value: "flight", label: t("flights"), icon: <Plane size={20} /> },
    { value: "hotel", label: t("hotels"), icon: <Building2 size={20} /> },
    { value: "transport", label: t("transport"), icon: <Car size={20} /> },
    { value: "insurance", label: t("insurance"), icon: <ShieldCheck size={20} /> },
    { value: "visa", label: t("visa"), icon: <CreditCard size={20} /> },
  ];

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = product.status === "active";
    return matchesCategory && matchesSearch && isActive;
  })
    .sort((a, b) => {
      switch (sortBy) {
        case "termurah":
          return a.price - b.price;
        case "termahal":
          return b.price - a.price;
        case "terlaris":
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    })
    .sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));

  const handleCategoryClick = (value: string) => {
    setSelectedCategory(value as Product["category"]);
  };

  const toggleLike = (productId: string) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(productId)) {
      newLiked.delete(productId);
    } else {
      newLiked.add(productId);
    }
    setLikedProducts(newLiked);
  };

  const toggleSave = (productId: string) => {
    const newSaved = new Set(savedProducts);
    if (newSaved.has(productId)) {
      newSaved.delete(productId);
    } else {
      newSaved.add(productId);
    }
    setSavedProducts(newSaved);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100 relative overflow-x-hidden">
      {/* Premium Background Glows */}
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -120 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10 shadow-2xl shadow-blue-900/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-xl font-black text-white">S</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h1>
                <p className="text-[11px] text-blue-300/90 font-bold tracking-[0.25em] uppercase">MARKETPLACE</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {[
                { href: "/", label: "Beranda" },
                { href: "/explore", label: "Jelajahi" },
                { href: "/sanimar-market", label: "Market" },
                { href: "/flight-routes", label: "Rute" },
                { href: "/admin", label: "Admin" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={item.href === "/sanimar-market" ? "default" : "ghost"} 
                    className={`text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all duration-300 ${
                      item.href === "/sanimar-market" 
                        ? "bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white shadow-xl shadow-blue-500/30" 
                        : "text-slate-200 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Pasang Iklan Button */}
              <Link href="/sanimar-market/jual">
                <Button className="hidden sm:flex bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:via-amber-400 hover:to-orange-500 text-black font-black px-6 py-2.5 rounded-2xl shadow-xl shadow-orange-500/40 hover:scale-105 transition-all duration-300">
                  <Plus size={20} className="mr-2" />
                  {t("pasang_iklan_gratis")}
                </Button>
              </Link>
              {/* My Ads Dashboard Button */}
              <Link href="/sanimar-market/ads/dashboard">
                <Button variant="ghost" className="hidden sm:flex text-slate-200 hover:text-white hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 font-semibold text-sm">
                  <Sparkles size={16} className="mr-2 text-amber-400" />
                  My Ads
                </Button>
              </Link>
              <LanguageSwitcher />

              {/* Mobile Menu */}
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
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                          <span className="text-xl font-black text-white">S</span>
                        </div>
                        <div>
                          <h2 className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h2>
                          <p className="text-[10px] text-blue-300/90 font-bold tracking-[0.25em]">MARKETPLACE</p>
                        </div>
                      </Link>
                    </div>
                    <nav className="flex-1 space-y-3 pt-6">
                      {[
                        { href: "/", label: "Beranda", icon: <Home className="text-blue-300" /> },
                        { href: "/explore", label: "Jelajahi", icon: <Globe className="text-blue-300" /> },
                        { href: "/sanimar-market", label: "Market", icon: <Building2 className="text-blue-300" /> },
                        { href: "/flight-routes", label: "Rute", icon: <Plane className="text-blue-300" /> },
                        { href: "/admin", label: "Admin", icon: <Building2 className="text-blue-300" /> },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-4 px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5">
                            {item.icon}
                            <span className="font-semibold text-lg">{item.label}</span>
                          </Button>
                        </Link>
                      ))}
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <Link href="/sanimar-market/jual" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black font-black py-4 rounded-2xl shadow-xl shadow-orange-500/30">
                            <Plus size={22} className="mr-2" />
                            {t("pasang_iklan_gratis")}
                          </Button>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Hero Section */}
        <motion.section 
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="mb-14 text-center"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 350 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-amber-500/20 border border-blue-400/30 text-blue-100 text-sm font-bold mb-7 shadow-2xl shadow-blue-900/15"
          >
            <Sparkles size={18} className="text-amber-300" />
            {t("best_offers")}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 bg-gradient-to-r from-white via-blue-200 to-amber-200 bg-clip-text text-transparent leading-tight"
          >
            {t("shop_travel")}
            <br className="hidden sm:block" />
            {t("complete_cheapest")}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Dari tiket pesawat, hotel, paket wisata, hingga asuransi — semua ada di sini dengan harga terbaik!
          </motion.p>

          {/* Search Bar & Filters */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
            className="max-w-3xl mx-auto space-y-4"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search size={24} className="text-slate-400 group-focus-within:text-blue-300 transition-all duration-300" />
              </div>
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-20 py-6 h-16 sm:h-20 text-lg sm:text-xl rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/15 text-slate-100 placeholder-slate-400 shadow-2xl shadow-blue-900/10 focus-visible:ring-blue-500/40 focus-visible:border-blue-400/50 focus-visible:bg-white/8 transition-all duration-300"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-2.5"
              >
                <Filter size={20} className="text-slate-300" />
              </Button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center justify-between gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/10 rounded-2xl">
                  <SlidersHorizontal size={18} className="mr-2 text-slate-300" />
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="terbaru">{t("terbaru")}</SelectItem>
                  <SelectItem value="termurah">{t("termurah")}</SelectItem>
                  <SelectItem value="termahal">{t("termahal")}</SelectItem>
                  <SelectItem value="terlaris">{t("terlaris")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </motion.section>

        {/* Categories */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-14"
        >
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {CATEGORIES.map((category) => (
              <motion.button
                key={category.value}
                variants={itemVariants}
                onClick={() => handleCategoryClick(category.value)}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-5 sm:px-7 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 ${
                  selectedCategory === category.value
                    ? "bg-gradient-to-r from-blue-600 to-amber-600 text-white shadow-2xl shadow-blue-500/40"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 text-slate-200 hover:border-blue-500/40 hover:bg-white/10"
                }`}
              >
                {category.icon}
                {category.label}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Products Grid */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                  <Skeleton className="h-64 w-full bg-white/10" />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-28 bg-white/10" />
                      <div className="ml-auto flex gap-1">
                        <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
                        <Skeleton className="h-5 w-12 bg-white/10" />
                      </div>
                    </div>
                    <Skeleton className="h-7 w-3/4 bg-white/10" />
                    <Skeleton className="h-5 w-full bg-white/10" />
                    <div className="flex items-center justify-between pt-3">
                      <Skeleton className="h-10 w-28 bg-white/10" />
                      <div className="flex gap-2">
                        <Skeleton className="h-12 w-32 rounded-2xl bg-white/10" />
                        <Skeleton className="h-12 w-24 rounded-2xl bg-white/10" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-24"
            >
              <div className="text-7xl mb-6 text-slate-500">🔍</div>
              <h3 className="text-3xl font-black text-slate-200 mb-3">Produk tidak ditemukan</h3>
              <p className="text-lg text-slate-400">Coba kata kunci lain</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 320 }}
                >
                  <Card className="overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-blue-900/15 hover:shadow-3xl hover:shadow-blue-900/25 transition-all duration-400 group">
                    <div className="relative overflow-hidden">
                      <motion.img
                        whileHover={{ scale: 1.12 }}
                        transition={{ duration: 0.6 }}
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-60 sm:h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {product.badge && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-black border-0 px-3.5 py-1.5 text-xs font-black shadow-lg shadow-orange-500/20">
                            {product.badge}
                          </Badge>
                        )}
                        {product.sponsored && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3.5 py-1.5 text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-1">
                            <Sparkles size={12} />
                            Sponsored
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons (❤️ 🔖) */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(product.id);
                          }}
                          className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"
                        >
                          <Heart
                            size={20}
                            className={likedProducts.has(product.id) ? "fill-red-500 text-red-500" : ""}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSave(product.id);
                          }}
                          className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"
                        >
                          <Bookmark
                            size={20}
                            className={savedProducts.has(product.id) ? "fill-blue-400 text-blue-400" : ""}
                          />
                        </Button>
                      </div>

                      {/* Stats: Likes/Rating */}
                      <div className="absolute bottom-4 left-4 flex gap-3">
                        <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20">
                          <Heart size={14} className="text-red-400" />
                          <span className="text-xs font-bold text-white">{formatNumber(product.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20">
                          <Star size={14} className="text-amber-400" />
                          <span className="text-xs font-bold text-white">{product.rating} ({product.reviews})</span>
                        </div>
                      </div>
                    </div>

                    <CardHeader className="pb-3 px-6 pt-6">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge variant="outline" className="bg-white/5 text-slate-200 border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                          {product.category}
                        </Badge>
                        {product.seller.verified && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30 px-3 py-1 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {t("verified_seller")}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl sm:text-2xl mt-2 text-white font-bold line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="text-base line-clamp-2 text-slate-400 mt-2 leading-relaxed">{product.description}</CardDescription>
                      <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                        <MapPin size={14} />
                        Oleh {product.seller.name} • {product.seller.location}
                      </div>
                    </CardHeader>

                    <CardFooter className="flex items-end justify-between pt-2 px-6 pb-6 gap-3">
                      <div>
                        {product.originalPrice && (
                          <span className="text-sm text-slate-500 line-through mr-2">${product.originalPrice}</span>
                        )}
                        <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-300 via-white to-amber-300 bg-clip-text text-transparent">
                          ${product.price}
                        </span>
                        <span className="text-sm text-slate-400 ml-1">{product.currency}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 rounded-2xl"
                        >
                          <a href={`https://wa.me/${product.seller.waNumber}?text=Halo, saya lihat iklan ${product.name} di Sanimar Market`} target="_blank" rel="noopener noreferrer">
                            <MessageSquare size={18} className="mr-1.5" />
                            Chat WA
                          </a>
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/sanimar-market/product/${product.id}`)}
                          className="bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 font-semibold hover:scale-105 transition-all duration-300 rounded-2xl"
                        >
                          Detail <ChevronRight size={16} className="ml-1" />
                        </Button>
                      </div>
                      {/* Promote Button — Sanimar Market ONLY, never in Travel */}
                      <Button
                        onClick={() => setPromoteModal({ open: true, listingId: product.id, listingTitle: product.name })}
                        variant="ghost"
                        className="w-full mt-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-400 border border-amber-500/20 font-bold text-sm rounded-xl py-2"
                      >
                        💰 Promote $5
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
      <Footer />
      {/* Chat Market Component — always rendered, floating button inside */}
      <ChatMarket 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        onClose={() => setIsChatOpen(false)} 
      />
      {/* Promote Modal — Sanimar Market ONLY, never in Travel */}
      <PromoteModal
        isOpen={promoteModal.open}
        onClose={() => setPromoteModal({ open: false, listingId: "", listingTitle: "" })}
        listingId={promoteModal.listingId}
        listingTitle={promoteModal.listingTitle}
        userId={userId}
      />
    </div>
  );
}
