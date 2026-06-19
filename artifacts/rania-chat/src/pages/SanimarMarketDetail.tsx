import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Plus,
  Upload,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Globe,
  Plane,
  Building2,
  Car,
  ShieldCheck,
  CreditCard,
  MapPin,
  DollarSign,
  MessageSquare,
  Camera,
  CheckCircle2,
  Heart,
  Share2,
  Flag,
  ChevronLeft,
  Star,
  Clock,
  Users,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/Layout/LanguageSwitcher";
import ChatMarket from "@/components/Chat/ChatMarket";

const PRODUCTS_DATA = [
  {
    id: "1",
    name: "Paket Wisata Pulau Komodo 4D3N",
    description: "Nikmati keindahan Pulau Komodo dengan guide lokal profesional. Paket termasuk: akomodasi 3 malam, transportasi antar jemput bandara, makan 3x sehari, tour ke Pulau Komodo, Pulau Padar, dan snorkeling di spot terbaik!",
    price: 350,
    originalPrice: 450,
    currency: "USD",
    category: "tour",
    images: [
      "https://picsum.photos/400/300?random=1",
      "https://picsum.photos/400/300?random=101",
      "https://picsum.photos/400/300?random=102",
      "https://picsum.photos/400/300?random=103",
      "https://picsum.photos/400/300?random=104"
    ],
    rating: 4.9,
    reviews: 234,
    badge: "Best Seller",
    seller: {
      name: "Komodo Tour Agency",
      verified: true,
      location: "Dili, Timor Leste",
      waNumber: "+6707812345",
      memberSince: "Januari 2024",
      totalAds: 12
    },
    sponsored: true,
    status: "active",
    views: 1243,
    postedAt: "3 hari lalu"
  },
  {
    id: "2",
    name: "Tiket Pesawat Dili - Jakarta",
    description: "Penerbangan langsung dengan maskapai ternama untuk perjalanan nyaman, termasuk bagasi 20kg dan snack di pesawat.",
    price: 180,
    originalPrice: null,
    currency: "USD",
    category: "flight",
    images: [
      "https://picsum.photos/400/300?random=2",
      "https://picsum.photos/400/300?random=201"
    ],
    rating: 4.7,
    reviews: 156,
    badge: "Popular",
    seller: {
      name: "Timor Travel",
      verified: true,
      location: "Dili, Timor Leste",
      waNumber: "+6707812346",
      memberSince: "Februari 2024",
      totalAds: 45
    },
    sponsored: true,
    status: "active",
    views: 2345,
    postedAt: "1 hari lalu"
  },
  {
    id: "3",
    name: "Hotel Bintang 5 Dili - Seaside Resort",
    description: "Penginapan mewah dengan fasilitas lengkap: kolam renang infinity, restoran laut, spa, dan pemandangan laut yang memukau.",
    price: 150,
    originalPrice: 200,
    currency: "USD",
    category: "hotel",
    images: [
      "https://picsum.photos/400/300?random=3",
      "https://picsum.photos/400/300?random=301",
      "https://picsum.photos/400/300?random=302"
    ],
    rating: 4.9,
    reviews: 312,
    badge: "Luxury",
    seller: {
      name: "Dili Seaside Resort",
      verified: true,
      location: "Dili, Timor Leste",
      waNumber: "+6707812347",
      memberSince: "Maret 2024",
      totalAds: 8
    },
    sponsored: false,
    status: "active",
    views: 897,
    postedAt: "5 hari lalu"
  },
  {
    id: "4",
    name: "Sewa Mobil Harian - Avanza",
    description: "Sewa mobil murah dengan sopir untuk menjelajahi Timor Leste, termasuk BBM dan asuransi.",
    price: 45,
    originalPrice: null,
    currency: "USD",
    category: "transport",
    images: [
      "https://picsum.photos/400/300?random=4"
    ],
    rating: 4.5,
    reviews: 89,
    badge: null,
    seller: {
      name: "Dili Car Rental",
      verified: false,
      location: "Dili, Timor Leste",
      waNumber: "+6707812348",
      memberSince: "April 2024",
      totalAds: 15
    },
    sponsored: false,
    status: "active",
    views: 567,
    postedAt: "2 hari lalu"
  }
];

interface Comment {
  id: string;
  user: { name: string; avatar: string };
  text: string;
  time: string;
  likes: number;
  replies: Comment[];
}

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "1",
    user: { name: "Maria dos Santos", avatar: "M" },
    text: "Wow produknya bagus banget! Sudah saya beli dan kirim cepat! 👍",
    time: "2 jam lalu",
    likes: 12,
    replies: [
      {
        id: "1-1",
        user: { name: "Komodo Tour Agency", avatar: "K" },
        text: "Terima kasih Maria! Selamat menikmati paket tournya! 🎉",
        time: "1 jam lalu",
        likes: 3,
        replies: []
      }
    ]
  },
  {
    id: "2",
    user: { name: "Joao da Costa", avatar: "J" },
    text: "Harga bisa nego ga bos?",
    time: "4 jam lalu",
    likes: 5,
    replies: []
  }
];

const SanimarMarketDetail = () => {
  const { t, language } = useLanguage();
  const [location, navigate] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [negotiatePrice, setNegotiatePrice] = useState("");
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("sanimarUserName") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("sanimarUserEmail") || "");
  const [showUserForm, setShowUserForm] = useState(!localStorage.getItem("sanimarUserName"));
  
  const productId = location.split("/").pop() || "1";
  const product = PRODUCTS_DATA.find(p => p.id === productId) || PRODUCTS_DATA[0];

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "tour": return <Globe size={18} />;
      case "flight": return <Plane size={18} />;
      case "hotel": return <Building2 size={18} />;
      case "transport": return <Car size={18} />;
      case "insurance": return <ShieldCheck size={18} />;
      case "visa": return <CreditCard size={18} />;
      default: return <Globe size={18} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case "tour": return t("tours");
      case "flight": return t("flights");
      case "hotel": return t("hotels");
      case "transport": return t("transport");
      case "insurance": return t("insurance");
      case "visa": return t("visa");
      default: return t("tours");
    }
  };

  const saveUserInfo = () => {
    if (!userName.trim() || !userEmail.trim()) return;
    localStorage.setItem("sanimarUserName", userName.trim());
    localStorage.setItem("sanimarUserEmail", userEmail.trim());
    setShowUserForm(false);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    if (showUserForm) {
      return;
    }
    const comment: Comment = {
      id: Date.now().toString(),
      user: { name: userName, avatar: userName.charAt(0).toUpperCase() },
      text: newComment,
      time: "Baru saja",
      likes: 0,
      replies: []
    };
    setComments([comment, ...comments]);
    setNewComment("");
  };

  const addReply = (commentId: string) => {
    if (!replyText.trim()) return;
    if (showUserForm) {
      return;
    }
    const reply: Comment = {
      id: `${commentId}-${Date.now()}`,
      user: { name: userName, avatar: userName.charAt(0).toUpperCase() },
      text: replyText,
      time: "Baru saja",
      likes: 0,
      replies: []
    };
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
    setReplyTo(null);
    setReplyText("");
  };

  const toggleLike = (commentId: string, isReply = false, parentId?: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, likes: comment.likes + 1 };
      }
      if (parentId && comment.id === parentId) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply
          )
        };
      }
      return comment;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100 relative overflow-x-hidden">
      {/* Premium Background Glows */}
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -120 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10 shadow-2xl shadow-blue-900/10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/sanimar-market" className="flex items-center gap-3 group">
              <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5">
                <ArrowLeft size={24} className="text-blue-200" />
              </Button>
              <div className="hidden sm:flex flex-col">
                <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h1>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left - Images & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-3xl overflow-hidden aspect-video bg-white/5 border border-white/10"
              >
                <img
                  src={product.images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center hover:bg-slate-950/90 transition-all duration-300"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % product.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center hover:bg-slate-950/90 transition-all duration-300"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
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
                {/* Wishlist & Share */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"
                  >
                    <Heart size={22} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"
                  >
                    <Share2 size={22} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-slate-950/70 backdrop-blur-xl rounded-full border border-white/20 hover:bg-slate-950/90 transition-all duration-300 p-2.5"
                  >
                    <Flag size={22} />
                  </Button>
                </div>
              </motion.div>
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                        activeImageIndex === idx
                          ? "border-blue-500 shadow-lg shadow-blue-500/30"
                          : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                      }`}
                    >
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Title & Price */}
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-white/5 text-slate-200 border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                    {getCategoryIcon(product.category)}
                    {getCategoryLabel(product.category)}
                  </Badge>
                  <div className="flex items-center gap-1 text-amber-300 ml-auto">
                    <Clock size={14} />
                    <span className="text-xs text-slate-400">{product.postedAt}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-300">
                    <Users size={14} />
                    <span className="text-xs text-slate-400">{product.views} dilihat</span>
                  </div>
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-baseline gap-3 mb-6">
                  {product.originalPrice && (
                    <span className="text-xl text-slate-500 line-through">${product.originalPrice}</span>
                  )}
                  <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-amber-200 bg-clip-text text-transparent">
                    ${product.price}
                  </span>
                  <span className="text-lg text-slate-400">{product.currency}</span>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-3">Deskripsi</h3>
                    <p className="text-slate-300 leading-relaxed text-base">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={20} className="text-blue-300" />
                    <h3 className="text-lg font-semibold text-white">Lokasi</h3>
                  </div>
                  <p className="text-slate-300">{product.seller.location}</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} className="text-amber-300" />
                    <h3 className="text-lg font-semibold text-white">Rating & Ulasan</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-amber-300">{product.rating}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className="text-amber-400" />
                        ))}
                      </div>
                      <span className="text-sm text-slate-400">{product.reviews} ulasan</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right - Seller & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seller Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Penjual</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <span className="text-xl font-black text-white">{product.seller.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-100 truncate">{product.seller.name}</h4>
                    {product.seller.verified && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30 px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    Bergabung {product.seller.memberSince}
                  </p>
                  <p className="text-xs text-slate-400">{product.seller.totalAds} iklan aktif</p>
                </div>
              </div>

              <div className="space-y-3">
                <Sheet open={negotiateOpen} onOpenChange={setNegotiateOpen}>
                  <SheetTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:via-amber-500 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 rounded-2xl h-12">
                      <Sparkles size={18} className="mr-2" />
                      Tawar Harga Ala Timor 🎯
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-slate-950/95 backdrop-blur-3xl border-l border-white/10">
                    <SheetHeader>
                      <SheetTitle className="text-2xl font-black bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">
                        Tawar Harga! 🎉
                      </SheetTitle>
                      <SheetDescription className="text-slate-400">
                        Masukan harga yang kamu inginkan. Kita kirim ke penjual via WhatsApp!
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Harga Awal:</span>
                          <span className="text-xl font-black text-white">${product.price}</span>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="negotiatePrice" className="text-lg font-semibold text-slate-200">
                            Harga Tawaran Kamu (USD):
                          </Label>
                          <Input
                            id="negotiatePrice"
                            type="number"
                            value={negotiatePrice}
                            onChange={(e) => setNegotiatePrice(e.target.value)}
                            placeholder="Contoh: 280"
                            className="h-14 text-xl font-bold bg-white/5 border-white/10 text-slate-100 placeholder-slate-500 focus:border-blue-500/50"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-sm text-slate-400 mb-2">Pilih gaya tawar kamu:</p>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Sirih Pinang Button */}
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:via-orange-500 hover:to-red-500 text-white font-bold shadow-xl shadow-orange-500/40 rounded-2xl h-14 text-lg"
                          disabled={!negotiatePrice}
                        >
                          <a 
                            href={`https://wa.me/${product.seller.waNumber}?text=${encodeURIComponent(
                              `Halo Pak/Bu ${product.seller.name},\n\nSaya lihat iklan ${product.name} di SANIMAR MARKET yang harganya $${product.price}.\n\nSaya mau tawar jadi $${negotiatePrice} ya Pak/Bu. Boleh?\n\nSebagai tanda serius, saya kirim sirih pinang virtual 🎯\n\nTerima kasih! 🙏`
                            )}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Sparkles size={20} className="mr-2" />
                            Tawar Pake Sirih Pinang! 🎯
                          </a>
                        </Button>
                        
                        {/* Normal Tawar Button */}
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 rounded-2xl h-14 text-lg"
                          disabled={!negotiatePrice}
                        >
                          <a 
                            href={`https://wa.me/${product.seller.waNumber}?text=${encodeURIComponent(
                              `Halo Pak/Bu ${product.seller.name},\n\nSaya lihat iklan ${product.name} di SANIMAR MARKET yang harganya $${product.price}.\n\nSaya mau tawar jadi $${negotiatePrice} ya. Boleh?\n\nTerima kasih!`
                            )}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <MessageSquare size={20} className="mr-2" />
                            Tawar Biasa
                          </a>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 rounded-2xl h-14 text-lg"
                >
                  <a href={`https://wa.me/${product.seller.waNumber}?text=Halo, saya lihat iklan ${product.name} di Sanimar Market`} target="_blank" rel="noopener noreferrer">
                    <MessageSquare size={20} className="mr-2" />
                    {t("chat_wa_penjual")}
                  </a>
                </Button>

                <Button
                  variant="secondary"
                  className="w-full bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 font-semibold rounded-2xl h-12"
                >
                  <Building2 size={18} className="mr-2" />
                  Lihat Toko
                </Button>

                <Button
                  variant="ghost"
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-2xl"
                >
                  <Flag size={18} className="mr-2" />
                  Laporkan Iklan
                </Button>
              </div>
            </motion.div>

            {/* Harga Tetangga! */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-300" />
                🔍 Harga Tetangga!
              </h3>
              <p className="text-sm text-slate-300 mb-4">Bandingkan dengan produk sejenis di sekitar:</p>
              <div className="space-y-3">
                {PRODUCTS_DATA.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3).map((p) => {
                  const difference = p.price - product.price;
                  const isCheaper = difference < 0;
                  return (
                    <Link
                      key={p.id}
                      href={`/sanimar-market/product/${p.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-12 h-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-100 truncate">{p.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Star size={10} className="text-amber-400" />
                            {p.rating} ({p.reviews})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-white">${p.price}</p>
                        <p className={`text-xs font-semibold ${isCheaper ? 'text-green-400' : 'text-red-400'}`}>
                          {isCheaper ? `🟢 $${Math.abs(difference)} lebih murah` : `🔴 $${difference} lebih mahal`}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* Similar Ads */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Iklan Serupa</h3>
              <div className="space-y-4">
                {PRODUCTS_DATA.filter(p => p.id !== product.id).slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    href={`/sanimar-market/product/${p.id}`}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/20 transition-all duration-300"
                  >
                    <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-100 truncate text-sm">{p.name}</h4>
                      <p className="text-sm font-black text-white">${p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-12"
        >
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare size={24} className="text-blue-300" />
              Komentar ({comments.length})
            </h3>

            {/* User Info Form */}
            {showUserForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-900/20 to-amber-900/20 border border-blue-500/20 rounded-2xl p-6 mb-6"
              >
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-300" />
                  Masukkan Informasi Anda
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Nama Anda</label>
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="bg-white/5 border-white/10 focus-visible:ring-blue-500/40 text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Email Anda</label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Masukkan email Anda"
                      className="bg-white/5 border-white/10 focus-visible:ring-blue-500/40 text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <Button
                    onClick={saveUserInfo}
                    disabled={!userName.trim() || !userEmail.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500"
                  >
                    Simpan Informasi
                  </Button>
                </div>
              </motion.div>
            )}

            {/* User Info Display */}
            {!showUserForm && (
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="font-bold text-white">{userName ? userName.charAt(0).toUpperCase() : "A"}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{userName}</p>
                    <p className="text-xs text-slate-400">{userEmail}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserForm(true)}
                  className="text-slate-400 hover:text-blue-300"
                >
                  Ubah
                </Button>
              </div>
            )}

            {/* Add Comment */}
            <div className="flex gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-white">{!showUserForm && userName ? userName.charAt(0).toUpperCase() : "A"}</span>
              </div>
              <div className="flex-1 flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Tulis komentar..."
                  className="bg-white/5 border-white/10 focus-visible:ring-blue-500/40 text-slate-100 placeholder-slate-500"
                />
                <Button onClick={addComment} disabled={!newComment.trim()} className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500">
                  Kirim
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-white">{comment.user.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-white">{comment.user.name}</h4>
                          <span className="text-xs text-slate-400">{comment.time}</span>
                        </div>
                        <p className="text-slate-300">{comment.text}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleLike(comment.id)} className="text-slate-400 hover:text-blue-300 p-1 h-auto">
                          <Heart size={16} />
                          <span className="ml-1 text-xs">{comment.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="text-slate-400 hover:text-blue-300 p-1 h-auto">
                          Balas
                        </Button>
                      </div>

                      {/* Reply Input */}
                      {replyTo === comment.id && (
                        <div className="flex gap-3 mt-3 ml-13">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-white text-xs">A</span>
                          </div>
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addReply(comment.id)}
                              placeholder="Tulis balasan..."
                              className="bg-white/5 border-white/10 focus-visible:ring-blue-500/40 text-slate-100 placeholder-slate-500 h-9"
                            />
                            <Button onClick={() => addReply(comment.id)} disabled={!replyText.trim()} size="sm" className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500">
                              Kirim
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-13 mt-4 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="font-bold text-white text-xs">{reply.user.avatar}</span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-semibold text-white text-sm">{reply.user.name}</h5>
                                    <span className="text-xs text-slate-400">{reply.time}</span>
                                  </div>
                                  <p className="text-slate-300 text-sm">{reply.text}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                  <Button variant="ghost" size="sm" onClick={() => toggleLike(reply.id, true, comment.id)} className="text-slate-400 hover:text-blue-300 p-1 h-auto">
                                    <Heart size={14} />
                                    <span className="ml-1 text-xs">{reply.likes}</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
      {/* Chat Market Component */}
      <ChatMarket 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
};

export default SanimarMarketDetail;
