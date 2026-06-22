import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, Search, SlidersHorizontal, MapPin, Bed, Bath, Maximize, Heart, Phone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import Footer from "@/components/Layout/Footer";

const PROPERTY_LISTINGS = [
  { id: "PRO-001", title: "Villa Dili with Ocean View", type: "Villa", price: 125000, location: "Dili", beds: 3, baths: 2, area: 250, image: "🏠", verified: true, badge: "featured" },
  { id: "PRO-002", title: "Apartment Near Beach", type: "Apartment", price: 200, period: "month", location: "Dili", beds: 2, baths: 1, area: 80, image: "🏢", verified: true, badge: null },
  { id: "PRO-003", title: "Commercial Space - City Center", type: "Commercial", price: 800, period: "month", location: "Dili", area: 200, image: "🏪", verified: false, badge: null },
  { id: "PRO-004", title: "Land for Development", type: "Land", price: 45000, location: "Baucau", area: 500, image: "🏞️", verified: true, badge: "hot" },
  { id: "PRO-005", title: "Modern House - Becora", type: "House", price: 75000, location: "Becora", beds: 4, baths: 3, area: 180, image: "🏡", verified: true, badge: null },
];

export default function SanimarMarketProperty() {
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState("all");

  const filtered = selectedType === "all" ? PROPERTY_LISTINGS : PROPERTY_LISTINGS.filter(p => p.type.toLowerCase() === selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market">
            <Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Back to Market</Button>
          </Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR Property</h1>
          <Link href="/sanimar-market/jual">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ Sell Property</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-teal-900/40 via-emerald-900/40 to-teal-900/40 rounded-3xl border border-teal-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Temukan Hunian Impian Anda</h2>
            <p className="text-xl text-teal-100">Rumah, Apartemen, Villa, Tanah, dan Komersial di Timor-Leste</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Cari lokasi, tipe properti..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12">
              <SlidersHorizontal size={18} className="mr-2 text-slate-300" />
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="house">Rumah</SelectItem>
              <SelectItem value="apartment">Apartemen</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="land">Tanah</SelectItem>
              <SelectItem value="commercial">Komersial</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Listings */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-teal-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{item.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {item.badge && <Badge className={`absolute top-3 left-3 ${item.badge === 'hot' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'} border px-3 py-1.5 text-xs font-bold`}>{item.badge}</Badge>}
                  {item.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold flex items-center gap-1">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{item.title}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {item.location}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent mb-4">
                    ${item.price.toLocaleString()}{item.period ? `/${item.period}` : ""}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    {item.beds && <div className="flex items-center gap-1"><Bed size={14} />{item.beds} Bed</div>}
                    {item.baths && <div className="flex items-center gap-1"><Bath size={14} />{item.baths} Bath</div>}
                    <div className="flex items-center gap-1"><Maximize size={14} />{item.area} m²</div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl">Detail <ChevronRight size={16} /></Button>
                  <Button variant="ghost" className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-2.5"><Heart size={18} /></Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}