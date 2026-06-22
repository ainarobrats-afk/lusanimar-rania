import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Utensils, Search, MapPin, Star, ChevronRight, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Layout/Footer";

const RESTAURANTS = [
  { id: "RES-001", name: "Restaurant Timor", cuisine: "Traditional", rating: 4.6, reviews: 234, location: "Dili", hours: "10:00-22:00", image: "🍽️", verified: true, badge: "top" },
  { id: "RES-002", name: "Bali Café", cuisine: "Indonesian", rating: 4.4, reviews: 189, location: "Dili", hours: "08:00-20:00", image: "☕", verified: true, badge: null },
  { id: "RES-003", name: "Seafood Market", cuisine: "Seafood", rating: 4.8, reviews: 312, location: "Dili", hours: "11:00-23:00", image: "🐟", verified: true, badge: "featured" },
];

export default function TravelRestaurants() {
  const [cuisine, setCuisine] = useState("all");
  const filtered = cuisine === "all" ? RESTAURANTS : RESTAURANTS.filter(r => r.cuisine.toLowerCase() === cuisine);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-red-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-rose-600/20 rounded-full blur-[90px]" />
      </div>
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Back to Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-red-300 to-rose-300 bg-clip-text text-transparent">SANIMAR Restaurants</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ Add Restaurant</Button></Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-red-900/40 via-rose-900/40 to-red-900/40 rounded-3xl border border-red-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Best Restaurants in Timor-Leste</h2>
            <p className="text-xl text-red-100">Kuliner lokal dan internasional</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Search restaurant..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" /></div>
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12"><Utensils size={18} className="mr-2 text-slate-300" /><SelectValue placeholder="Cuisine" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all">All Cuisines</SelectItem>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="indonesian">Indonesian</SelectItem>
                <SelectItem value="seafood">Seafood</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-2xl">Search</Button>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((restaurant, i) => (
            <motion.div key={restaurant.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{restaurant.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {restaurant.badge && <Badge className="absolute top-3 left-3 bg-red-500/20 text-red-300 border-red-500/30 border px-3 py-1.5 text-xs font-bold">{restaurant.badge}</Badge>}
                  {restaurant.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{restaurant.name}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {restaurant.location}</div>
                  <div className="flex items-center gap-1 text-amber-300 text-sm"><Star size={14} className="fill-amber-300" /> {restaurant.rating} ({restaurant.reviews} reviews)</div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200">{restaurant.cuisine}</Badge>
                    <div className="flex items-center gap-1"><Clock size={14} /> {restaurant.hours}</div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl">Call <Phone size={16} className="ml-2" /></Button>
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