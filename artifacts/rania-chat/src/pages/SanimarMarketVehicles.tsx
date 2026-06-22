import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CarFront, Search, SlidersHorizontal, MapPin, Heart, ChevronRight, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Footer from "@/components/Layout/Footer";

const VEHICLES = [
  { id: "VEH-001", title: "Toyota Hilux 2022", type: "Car", price: 18000, location: "Dili", km: 12000, image: "🚗", verified: true, badge: "hot" },
  { id: "VEH-002", title: "Honda Beat 2023", type: "Motorcycle", price: 1200, location: "Dili", km: 5000, image: "🏍️", verified: true, badge: null },
  { id: "VEH-003", title: "Isuzu Truck", type: "Truck", price: 25000, location: "Kupang", km: 45000, image: "🚚", verified: false, badge: null },
];

export default function SanimarMarketVehicles() {
  const [selectedType, setSelectedType] = useState("all");
  const filtered = selectedType === "all" ? VEHICLES : VEHICLES.filter(v => v.type.toLowerCase() === selectedType);
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
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR Auto</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ Sell Vehicle</Button></Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-sky-900/40 via-blue-900/40 to-sky-900/40 rounded-3xl border border-sky-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🚘</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Cari Kendaraan Impian</h2>
            <p className="text-xl text-sky-100">Mobil, Motor, Truk, dan Alat Berat</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Cari merek, tipe..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" /></div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12"><SlidersHorizontal size={18} className="mr-2 text-slate-300" /><SelectValue placeholder="Tipe" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="car">Mobil</SelectItem>
              <SelectItem value="motorcycle">Motor</SelectItem>
              <SelectItem value="truck">Truk</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{item.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {item.badge && <Badge className="absolute top-3 left-3 bg-red-500/20 text-red-300 border-red-500/30 border px-3 py-1.5 text-xs font-bold">{item.badge}</Badge>}
                  {item.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{item.title}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {item.location}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent mb-4">${item.price.toLocaleString()}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-300"><div className="flex items-center gap-1"><Gauge size={14} />{item.km.toLocaleString()} km</div></div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl">Detail <ChevronRight size={16} /></Button>
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