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
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/Layout/LanguageSwitcher";
import ChatMarket from "@/components/Chat/ChatMarket";

const SanimarMarketJual = () => {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("tour");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [isNegotiable, setIsNegotiable] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("free");
  const [aiHelpOpen, setAiHelpOpen] = useState(false);

  const CATEGORIES = [
    { value: "tour", label: t("tours"), icon: <Globe size={20} /> },
    { value: "flight", label: t("flights"), icon: <Plane size={20} /> },
    { value: "hotel", label: t("hotels"), icon: <Building2 size={20} /> },
    { value: "transport", label: t("transport"), icon: <Car size={20} /> },
    { value: "insurance", label: t("insurance"), icon: <ShieldCheck size={20} /> },
    { value: "visa", label: t("visa"), icon: <CreditCard size={20} /> },
  ];

  const PACKAGES = [
    {
      id: "free",
      name: "Basic Gratis",
      price: "$0",
      duration: "7 hari tayang",
      photos: "1 foto",
      features: ["Tayang di kategori"],
      color: "slate",
      badge: null
    },
    {
      id: "pro",
      name: "Pro",
      price: "$5",
      duration: "30 hari tayang",
      photos: "5 foto",
      features: ["Tayang di kategori", "Badge Sponsored", "Tampil paling atas"],
      color: "blue",
      badge: "Populer"
    },
    {
      id: "premium",
      name: "Premium",
      price: "$15",
      duration: "30 hari tayang",
      photos: "5 foto",
      features: ["Tayang di kategori", "Badge Sponsored", "Tampil paling atas", "Diposting ke WA & IG"],
      color: "amber",
      badge: "Terbaik"
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Iklan berhasil diajukan! Silakan tunggu verifikasi admin.");
    navigate("/sanimar-market");
  };

  const generateAIDescription = () => {
    const categoryTemplates: Record<string, string[]> = {
      tour: [
        "Nikmati pengalaman wisata yang tak terlupakan! Paket kami sudah termasuk transportasi, akomodasi, makan, dan guide profesional. Cocok untuk keluarga, grup, atau backpacker!",
        "Jelajahi keindahan alam bersama kami! Paket tour kami dirancang khusus untuk memberikan pengalaman terbaik dengan harga terjangkau.",
        "Tour eksklusif dengan fasilitas premium! Kami menjamin kenyamanan dan keamanan Anda selama perjalanan."
      ],
      flight: [
        "Terbang nyaman dengan maskapai ternama! Tiket kami sudah termasuk bagasi dan makan di pesawat. Cepat dan aman!",
        "Promo tiket pesawat murah! Hanya hari ini, dapatkan diskon besar untuk rute favorit Anda.",
        "Penerbangan langsung tanpa transit! Hemat waktu dan nikmati perjalanan yang tenang."
      ],
      hotel: [
        "Menginap nyaman di hotel bintang 5! Fasilitas lengkap: kolam renang, spa, restoran, dan pemandangan indah.",
        "Hotel budget tapi bukan murahan! Kamar bersih, nyaman, dan lokasi strategis di pusat kota.",
        "Homestay lokal untuk merasakan budaya asli! Dikelola oleh keluarga lokal, Anda akan merasa seperti di rumah sendiri."
      ],
      transport: [
        "Sewa mobil murah dengan sopir! Harga terjangkau, kendaraan bersih, dan sopir ramah berpengalaman.",
        "Sewa motor/harga harian! Mudah dan fleksibel untuk menjelajahi kota.",
        "Travel antar kota! Aman, nyaman, dan tepat waktu."
      ],
      insurance: [
        "Asuransi perjalanan lengkap! Lindungi diri Anda dari risiko sakit, kecelakaan, atau kehilangan barang.",
        "Asuransi murah tapi bukan murahan! Cakupan luas dengan proses klaim yang mudah.",
        "Asuransi perjalanan internasional! Aman bepergian ke luar negeri."
      ],
      visa: [
        "Jasa urus visa cepat dan mudah! Kami bantu proses visa ke berbagai negara dengan biaya terjangkau.",
        "Visa tourist dengan proses cepat! Tidak perlu repot, kami yang tangani semua.",
        "Konsultasi visa gratis! Tanya-tanya dulu sebelum memutuskan."
      ]
    };

    const templates = categoryTemplates[selectedCategory] || categoryTemplates.tour;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const generated = `${randomTemplate}\n\nHubungi kami sekarang untuk pemesanan dan informasi lebih lanjut!`;
    setDescription(generated);
    setAiHelpOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100 relative overflow-x-hidden pb-20">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/sanimar-market" className="flex items-center gap-3 group">
              <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5">
                <ArrowLeft size={24} className="text-blue-200" />
              </Button>
              <div className="hidden sm:flex flex-col">
                <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h1>
                <p className="text-[10px] text-blue-300/90 font-bold tracking-[0.25em] uppercase">PASANG IKLAN</p>
              </div>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={24} className="text-amber-300" />
            <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-blue-200 to-amber-200 bg-clip-text text-transparent">
              Pasang Iklan Anda
            </h2>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl">
            Jual produk wisata Anda di Sanimar Marketplace dan jangkau ribuan calon pembeli!
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Kategori Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Globe size={22} className="text-blue-300" />
              Pilih Kategori
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex flex-col items-center gap-2 px-4 py-6 rounded-2xl border-2 transition-all duration-300 ${
                    selectedCategory === category.value
                      ? "border-blue-500/50 bg-gradient-to-br from-blue-600/30 to-amber-600/30 backdrop-blur-2xl shadow-2xl shadow-blue-500/20"
                      : "border-white/10 bg-white/5 hover:border-blue-500/20 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/10"
                  }`}
                >
                  {category.icon}
                  <span className="font-semibold text-sm">{category.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Form Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              {/* Judul Iklan */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-lg text-slate-200">Judul Iklan</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Paket Tour Pulau Komodo 4D3N"
                  className="h-14 text-lg rounded-2xl bg-white/5 backdrop-blur-2xl border-white/10 text-slate-100 placeholder-slate-400 focus-visible:ring-blue-500/40 focus-visible:border-blue-400/50"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-lg text-slate-200">Deskripsi</Label>
                  <Sheet open={aiHelpOpen} onOpenChange={setAiHelpOpen}>
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="bg-blue-500/20 text-blue-200 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl"
                      >
                        <Sparkles size={16} className="mr-2" />
                        Bikin Pake RANIA! ✨
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-slate-950/95 backdrop-blur-3xl border-l border-white/10">
                      <SheetHeader>
                        <SheetTitle className="text-2xl font-black bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">
                          RANIA Bikin Deskripsi! 🎉
                        </SheetTitle>
                        <SheetDescription className="text-slate-400">
                          Pilih template deskripsi atau biar RANIA yang buat otomatis!
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-8 space-y-4">
                        <Button 
                          onClick={generateAIDescription}
                          className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white font-bold shadow-lg shadow-blue-500/30 rounded-2xl h-14 text-lg"
                        >
                          <Sparkles size={20} className="mr-2" />
                          Generate Otomatis!
                        </Button>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                          <p className="text-sm text-slate-400 mb-2">Tips:</p>
                          <ul className="text-sm text-slate-300 list-disc ml-5 space-y-1">
                            <li>Sebutkan semua fasilitas yang didapatkan</li>
                            <li>Gunakan kata-kata menarik</li>
                            <li>Berikan informasi jelas tentang lokasi</li>
                          </ul>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan produk Anda secara detail..."
                  className="min-h-[160px] text-base rounded-2xl bg-white/5 backdrop-blur-2xl border-white/10 text-slate-100 placeholder-slate-400 focus-visible:ring-blue-500/40 focus-visible:border-blue-400/50 resize-none"
                  required
                />
              </div>

              {/* Harga */}
              <div className="space-y-3">
                <Label htmlFor="price" className="text-lg text-slate-200">Harga (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="150"
                    className="pl-12 h-14 text-lg rounded-2xl bg-white/5 backdrop-blur-2xl border-white/10 text-slate-100 placeholder-slate-400 focus-visible:ring-blue-500/40 focus-visible:border-blue-400/50"
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="negotiable"
                    checked={isNegotiable}
                    onCheckedChange={(checked) => setIsNegotiable(checked as boolean)}
                    className="border-white/30"
                  />
                  <Label htmlFor="negotiable" className="text-slate-300">{t("bisa_nego")}</Label>
                </div>
              </div>
            </div>

            {/* Upload & Kontak */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
                <Label htmlFor="photos" className="text-lg text-slate-200 mb-4 block">Upload Foto</Label>
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer">
                  <Camera size={40} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-300 font-medium mb-1">Klik untuk upload</p>
                  <p className="text-slate-500 text-sm">Min 1, Max 5 foto</p>
                  <input
                    id="photos"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
                <h4 className="text-lg font-semibold text-slate-200 mb-4">Kontak</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa" className="text-slate-300">Nomor WhatsApp</Label>
                    <Input
                      id="wa"
                      placeholder="+670 7XXX-XXXX"
                      className="h-12 rounded-2xl bg-white/5 border-white/10 text-slate-100 placeholder-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="h-12 rounded-2xl bg-white/5 border-white/10 text-slate-100 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Paket Iklan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles size={22} className="text-amber-300" />
              Pilih Paket Iklan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-300 ${
                    selectedPackage === pkg.id
                      ? "border-blue-500/50 bg-gradient-to-br from-blue-600/30 to-amber-600/30 backdrop-blur-2xl shadow-2xl shadow-blue-500/20"
                      : "border-white/10 bg-white/5 hover:border-blue-500/20 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/10"
                  }`}
                >
                  {pkg.badge && (
                    <Badge
                      className={`absolute top-4 right-4 bg-gradient-to-r from-${pkg.color}-500 to-amber-600 text-white border-0 px-3 py-1 text-xs font-black`}
                    >
                      {pkg.badge}
                    </Badge>
                  )}
                  <h4 className="text-xl font-black text-white mb-1">{pkg.name}</h4>
                  <div className="text-3xl font-black bg-gradient-to-r from-white via-blue-200 to-amber-200 bg-clip-text text-transparent mb-2">
                    {pkg.price}
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{pkg.duration} • {pkg.photos}</p>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircle2 size={16} className="text-green-400" />
                      {feature}
                    </li>
                  ))}
                  </ul>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pembayaran (Pro/Premium) */}
          {selectedPackage !== "free" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <DollarSign size={22} className="text-green-300" />
                Pembayaran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/70 rounded-2xl p-5 border border-white/10">
                  <h4 className="font-semibold text-slate-100 mb-3">Transfer Bank BNU</h4>
                  <p className="text-slate-300 text-sm">No. Rek: 1234567890</p>
                  <p className="text-slate-300 text-sm">a/n: LU SANIMAR</p>
                </div>
                <div className="bg-slate-900/70 rounded-2xl p-5 border border-white/10">
                  <h4 className="font-semibold text-slate-100 mb-3">DANA Timor</h4>
                  <p className="text-slate-300 text-sm">No: +670 7XXX-XXXX</p>
                  <p className="text-slate-300 text-sm">a/n: LU SANIMAR</p>
                </div>
              </div>
              <div className="mt-6">
                <Label className="text-slate-300 mb-3 block">Upload Bukti Pembayaran</Label>
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer">
                  <Upload size={40} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-300 font-medium mb-1">Klik untuk upload bukti transfer</p>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4"
          >
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:via-amber-400 hover:to-orange-500 text-black font-black text-xl py-7 rounded-3xl shadow-2xl shadow-orange-500/40 hover:scale-[1.01] transition-all duration-300"
            >
              {selectedPackage !== "free" ? "Saya Sudah Bayar & Kirim Iklan" : "Kirim Iklan Gratis"}
            </Button>
          </motion.div>
        </form>
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

export default SanimarMarketJual;
