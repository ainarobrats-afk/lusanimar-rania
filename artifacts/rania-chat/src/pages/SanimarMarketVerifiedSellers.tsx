import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, Shield, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Layout/Footer";

const SELLERS = [
  { id: "VER-001", name: "Tech Dili", badge: "verified", category: "Electronics", rating: 4.8, sales: 320, joined: "2026-01-15" },
  { id: "VER-002", name: "Property TL", badge: "verified", category: "Property", rating: 4.5, sales: 85, joined: "2026-02-20" },
  { id: "VER-003", name: "Kopi Ermera", badge: "verified", category: "Food", rating: 4.8, sales: 420, joined: "2026-03-10" }
];

export default function SanimarMarketVerifiedSellers() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-teal-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-emerald-600/20 rounded-full blur-[90px]" />
      </div>
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">Verified Sellers</h1>
          <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black">Become Verified</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-teal-900/40 via-emerald-900/40 to-teal-900/40 rounded-3xl border border-teal-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Seller Terpercaya</h2>
            <p className="text-xl text-teal-100">Centang biru = aman. Verified seller gets priority ranking, featured placement, and AI recommendations.</p>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SELLERS.map((seller, i) => (
            <motion.div key={seller.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden hover:border-teal-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-2xl">🏪</div>
                    <div>
                      <CardTitle className="text-white text-lg">{seller.name}</CardTitle>
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 border text-xs px-2 py-0.5">✓ Verified</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300"><Award size={16} className="text-teal-400" /> {seller.category}</div>
                    <div className="flex items-center gap-2 text-slate-300"><Star size={16} className="text-amber-400" /> {seller.rating} rating</div>
                    <div className="flex items-center gap-2 text-slate-300"><TrendingUp size={16} className="text-emerald-400" /> {seller.sales} sales</div>
                    <div className="flex items-center gap-2 text-slate-300"><Shield size={16} className="text-teal-400" /> Joined {seller.joined}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/sanimar-market/seller/${seller.id}`} className="w-full"><Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl">Visit Store</Button></Link>
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