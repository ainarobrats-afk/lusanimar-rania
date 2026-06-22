import { Link } from "wouter";
import { motion } from "framer-motion";
import { Truck, Star, MapPin, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Layout/Footer";

const PARTNERS = [
  { id: "CAR-001", name: "Lorosae Express", type: "Cargo", rating: 4.8, total_deliveries: 520, rate_per_kg: 15000, warehouse: "Kupang", routes: ["Kupang -> Dili", "Kupang -> Baucau"], eta: "1-2 hari" },
  { id: "CAR-002", name: "Timor Travel Cargo", type: "Travel Courier", rating: 4.6, total_deliveries: 340, rate_per_kg: 18000, warehouse: "Kupang", routes: ["Kupang -> Dili", "Kupang -> Oecusse"], eta: "1 hari" },
  { id: "CAR-003", name: "Leste Cargo", type: "Cargo", rating: 4.7, total_deliveries: 410, rate_per_kg: 16000, warehouse: "Kupang", routes: ["Kupang -> Dili"], eta: "2 hari" }
];

export default function SanimarMarketCargoPartners() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-orange-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-orange-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
      </div>
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">Cargo Partners</h1>
          <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black">Become Partner</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-orange-900/40 via-amber-900/40 to-orange-900/40 rounded-3xl border border-orange-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Kupang ↔ Dili Delivery</h2>
            <p className="text-xl text-orange-100">Kirim barang antar Timor-Leste dan Indonesia dengan aman, ada tracking, dan rating</p>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PARTNERS.map((partner, i) => (
            <motion.div key={partner.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden hover:border-orange-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-2xl">🚚</div>
                    <div>
                      <CardTitle className="text-white text-lg">{partner.name}</CardTitle>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 border text-xs px-2 py-0.5">{partner.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300"><Star size={16} className="text-amber-400" /> {partner.rating} rating</div>
                    <div className="flex items-center gap-2 text-slate-300"><Truck size={16} className="text-orange-400" /> {partner.total_deliveries} deliveries</div>
                    <div className="flex items-center gap-2 text-slate-300"><MapPin size={16} className="text-red-400" /> Warehouse: {partner.warehouse}</div>
                    <div className="flex items-center gap-2 text-slate-300"><Clock size={16} className="text-blue-400" /> ETA: {partner.eta}</div>
                    <div className="flex items-center gap-2 text-slate-300"><Shield size={16} className="text-teal-400" /> Rp {partner.rate_per_kg.toLocaleString()}/kg</div>
                    <div className="text-slate-400 text-xs mt-2">Routes: {partner.routes.join(", ")}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}