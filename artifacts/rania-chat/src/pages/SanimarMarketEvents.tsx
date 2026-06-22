import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Search, SlidersHorizontal, MapPin, Heart, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Footer from "@/components/Layout/Footer";

const EVENTS = [
  { id: "EVT-001", title: "Timor-Leste Tourism Expo 2026", category: "Festival", date: "2026-07-15", location: "Dili Convention Center", price: 25, image: "🎉", verified: true, badge: "hot" },
  { id: "EVT-002", title: "Dili International Film Festival", category: "Cultural", date: "2026-08-20", location: "Dili", price: 10, image: "🎬", verified: true, badge: null },
  { id: "EVT-003", title: "Electric Music Festival", category: "Music", date: "2026-09-10", location: "Dili Beach", price: 35, image: "🎵", verified: false, badge: null },
  { id: "EVT-004", title: "Food & Culture Fair", category: "Food", date: "2026-07-30", location: "Baucau", price: 5, image: "🍽️", verified: true, badge: "featured" },
];

export default function SanimarMarketEvents() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const filtered = selectedCategory === "all" ? EVENTS : EVENTS.filter(e => e.category.toLowerCase() === selectedCategory);
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
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR Events</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ Create Event</Button></Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-fuchsia-900/40 via-purple-900/40 to-fuchsia-900/40 rounded-3xl border border-fuchsia-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Event & Festival di Timor-Leste</h2>
            <p className="text-xl text-fuchsia-100"> Konser, Festival, Pameran, dan Acara Spesial</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Cari event..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" /></div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12"><SlidersHorizontal size={18} className="mr-2 text-slate-300" /><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="festival">Festival</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="food">Food</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-fuchsia-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{event.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {event.badge && <Badge className="absolute top-3 left-3 bg-red-500/20 text-red-300 border-red-500/30 border px-3 py-1.5 text-xs font-bold">{event.badge}</Badge>}
                  {event.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{event.title}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {event.location}</div>
                  <div className="text-slate-400 flex items-center gap-1"><Calendar size={14} /> {event.date}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent mb-4">${event.price}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200">{event.category}</Badge>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-2xl">Get Tickets <ChevronRight size={16} /></Button>
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