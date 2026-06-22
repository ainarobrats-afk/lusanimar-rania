import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Car, Search, MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Layout/Footer";

const RENTALS = [
  { id: "RNT-001", type: "Car", model: "Toyota Avanza", price: 35, period: "day", location: "Dili", image: "🚗", verified: true, badge: null },
  { id: "RNT-002", type: "Car", model: "Honda Jazz", price: 30, period: "day", location: "Dili", image: "🚗", verified: true, badge: "hot" },
  { id: "RNT-003", type: "Motorcycle", model: "Honda Beat", price: 10, period: "day", location: "Dili", image: "🏍️", verified: false, badge: null },
];

export default function TravelRental() {
  const [location, setLocation] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [type, setType] = useState("all");

  const filtered = type === "all" ? RENTALS : RENTALS.filter(r => r.type.toLowerCase() === type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-orange-600/20 rounded-full blur-[90px]" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Back to Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">SANIMAR Rental</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ List Vehicle</Button></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/40 to-amber-900/40 rounded-3xl border border-amber-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Rental Mobil & Motor</h2>
            <p className="text-xl text-amber-100">Harga terjangkau, pickup cepat</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <div className="relative">
              <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input type="date" value={pickup} onChange={e => setPickup(e.target.value)} className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <div className="relative">
              <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input type="date" value={dropoff} onChange={e => setDropoff(e.target.value)} className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-2xl">Search Rental</Button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{item.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {item.badge && <Badge className="absolute top-3 left-3 bg-red-500/20 text-red-300 border-red-500/30 border px-3 py-1.5 text-xs font-bold">{item.badge}</Badge>}
                  {item.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{item.model}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {item.location}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">${item.price}<span className="text-sm text-slate-400 ml-1">/{item.period}</span></div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl">Rent Now <ChevronRight size={16} /></Button>
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