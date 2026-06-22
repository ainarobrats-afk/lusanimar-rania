import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag, Search, SlidersHorizontal, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Layout/Footer";

const PRODUCTS = [
  { id: "PRD-001", title: "iPhone 15 Pro Max", category: "Electronics", price: 900, seller: "Tech Dili", location: "Dili", image: "📱", verified: true, rating: 4.8, sales: 45 },
  { id: "PRD-002", title: "Sony Alpha Camera", category: "Electronics", price: 1200, seller: "Photo Pro", location: "Dili", image: "📸", verified: true, rating: 4.9, sales: 12 },
  { id: "PRD-003", title: "MacBook Pro 16\"", category: "Electronics", price: 2500, seller: "Tech Dili", location: "Dili", image: "💻", verified: true, rating: 5.0, sales: 15 },
];

export default function SanimarMarketProducts() {
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category.toLowerCase() === category);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-orange-600/20 rounded-full blur-[90px]" />
      </div>
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Products</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ Sell</Button></Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/40 to-amber-900/40 rounded-3xl border border-amber-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Products Marketplace</h2>
            <p className="text-xl text-amber-100">Elektronik, fashion, dan kebutuhan rumah</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Cari produk..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" /></div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12"><SlidersHorizontal size={18} className="mr-2 text-slate-300" /><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product, i) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{product.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {product.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{product.title}</CardTitle>
                  <div className="text-slate-400 text-sm">{product.seller} • {product.location}</div>
                  <div className="flex items-center gap-1 text-amber-300 text-sm"><Star size={14} className="fill-amber-300" /> {product.rating} ({product.sales} sold)</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">${product.price}</div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl">Buy <ChevronRight size={16} /></Button>
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