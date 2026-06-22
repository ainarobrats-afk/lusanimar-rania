import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Store, Search, SlidersHorizontal, MapPin, Star, Phone, MessageSquare, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Footer from "@/components/Layout/Footer";

const BUSINESSES = [
  { id: "BUS-001", name: "Hotel Timor", category: "Hotels", rating: 4.5, reviews: 234, location: "Dili", phone: "+670 1234 5678", image: "🏨", verified: true, badge: "top", hours: "24/7" },
  { id: "BUS-002", name: "Café Delta", category: "Restaurants", rating: 4.7, reviews: 189, location: "Dili", phone: "+670 2345 6789", image: "☕", verified: true, badge: null, hours: "07:00-22:00" },
  { id: "BUS-003", name: "Car Rental Express", category: "Rental", rating: 4.3, reviews: 145, location: "Dili", phone: "+670 3456 7890", image: "🚗", verified: true, badge: null, hours: "08:00-18:00" },
  { id: "BUS-004", name: "Dili Medical Center", category: "Healthcare", rating: 4.6, reviews: 312, location: "Dili", phone: "+670 4567 8901", image: "🏥", verified: true, badge: "verified", hours: "24/7" },
  { id: "BUS-005", name: "Timor Bank", category: "Banking", rating: 4.4, reviews: 567, location: "Dili", phone: "+670 5678 9012", image: "🏦", verified: true, badge: null, hours: "09:00-16:00" },
];

export default function SanimarMarketBusiness() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const filtered = selectedCategory === "all" ? BUSINESSES : BUSINESSES.filter(b => b.category.toLowerCase() === selectedCategory);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
      </div>
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Back to Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">Business Directory</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ Add Business</Button></Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-cyan-900/40 rounded-3xl border border-cyan-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Direktori Bisnis Timor-Leste</h2>
            <p className="text-xl text-cyan-100">Restoran, Hotel, Klinik, Bank, dan Layanan Profesional</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Cari bisnis, kategori..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" /></div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12"><SlidersHorizontal size={18} className="mr-2 text-slate-300" /><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="hotels">Hotels</SelectItem>
              <SelectItem value="restaurants">Restaurants</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="banking">Banking</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((business, i) => (
            <motion.div key={business.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{business.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {business.badge && <Badge className="absolute top-3 left-3 bg-amber-500/20 text-amber-300 border-amber-500/30 border px-3 py-1.5 text-xs font-bold">{business.badge}</Badge>}
                  {business.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{business.name}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {business.location}</div>
                  <div className="flex items-center gap-1 text-amber-300 text-sm"><Star size={14} className="fill-amber-300" /> {business.rating} ({business.reviews} reviews)</div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-slate-300 mb-4">
                    <div className="flex items-center gap-1"><Clock size={14} /> {business.hours}</div>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200">{business.category}</Badge>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl">Call <Phone size={16} className="ml-2" /></Button>
                  <Button variant="ghost" className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-2.5"><MessageSquare size={18} /></Button>
                  <Button variant="ghost" className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-2.5"><ChevronRight size={18} /></Button>
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