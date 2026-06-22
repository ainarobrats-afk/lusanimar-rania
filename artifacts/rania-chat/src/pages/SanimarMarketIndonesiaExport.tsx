import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Star, ChevronRight, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Layout/Footer";

const ITEMS = [
  { id: "IDN-001", title: "Kemeja Batik Premium", category: "Fashion", price: 120000, currency: "IDR", seller: "Batika Surabaya", location: "Surabaya", image: "👕", verified: true, rating: 4.8, sales: 230, ready: "Kupang" },
  { id: "IDN-002", title: "Samsung Galaxy S23", category: "Elektronik", price: 8500000, currency: "IDR", seller: "Tech Indo", location: "Jakarta", image: "📱", verified: true, rating: 4.7, sales: 120, ready: "Dili" },
  { id: "IDN-003", title: "Sparepart Yamaha NMAX", category: "Sparepart", price: 350000, currency: "IDR", seller: "Auto Parts Kupang", location: "Kupang", image: "⚙️", verified: true, rating: 4.6, sales: 310, ready: "Kupang" },
  { id: "IDN-004", title: "Sofa Minimalis", category: "Furniture", price: 2500000, currency: "IDR", seller: "Furniture NTT", location: "Kupang", image: "🪑", verified: false, rating: 4.4, sales: 45, ready: "Kupang" },
  { id: "IDN-005", title: "Lipstik Matte", category: "Kosmetik", price: 85000, currency: "IDR", seller: "Beauty Indo", location: "Surabaya", image: "💄", verified: true, rating: 4.9, sales: 540, ready: "Dili" },
  { id: "IDN-006", title: "Semen Portland 50kg", category: "Material Bangunan", price: 75000, currency: "IDR", seller: "Toko Bangunan NTT", location: "Kupang", image: "🧱", verified: true, rating: 4.5, sales: 890, ready: "Kupang" }
];

export default function SanimarMarketIndonesiaExport() {
  const [category, setCategory] = useState("all");
  const [ready, setReady] = useState("all");
  const filtered = ITEMS.filter(item => (category === "all" || item.category === category) && (ready === "all" || item.ready === ready));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-red-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-rose-600/20 rounded-full blur-[90px]" />
      </div>
      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-red-300 to-rose-300 bg-clip-text text-transparent">Indonesia Export</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black">+ Sell</Button></Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-red-900/40 via-rose-900/40 to-red-900/40 rounded-3xl border border-red-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🇮🇩</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Produk Indonesia</h2>
            <p className="text-xl text-red-100">Fashion, elektronik, sparepart, furniture, kosmetik, material bangunan</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Cari produk..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" /></div>
          <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12"><SlidersHorizontal size={18} className="mr-2 text-slate-300" /><SelectValue placeholder="Kategori" /></SelectTrigger><SelectContent className="bg-slate-900 border-white/10"><SelectItem value="all">Semua</SelectItem><SelectItem value="Fashion">Fashion</SelectItem><SelectItem value="Elektronik">Elektronik</SelectItem><SelectItem value="Sparepart">Sparepart</SelectItem><SelectItem value="Furniture">Furniture</SelectItem><SelectItem value="Kosmetik">Kosmetik</SelectItem><SelectItem value="Material Bangunan">Material Bangunan</SelectItem></SelectContent></Select>
          <Select value={ready} onValueChange={setReady}><SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 rounded-2xl h-12"><SelectValue placeholder="Lokasi Stok" /></SelectTrigger><SelectContent className="bg-slate-900 border-white/10"><SelectItem value="all">Semua</SelectItem><SelectItem value="Kupang">Ready di Kupang</SelectItem><SelectItem value="Dili">Ready di Dili</SelectItem></SelectContent></Select>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{item.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {item.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                  <Badge className="absolute bottom-3 left-3 bg-white/10 border-white/10 text-white text-xs px-2 py-1">Ready: {item.ready}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{item.title}</CardTitle>
                  <div className="text-slate-400 text-sm">{item.seller} • {item.location}</div>
                  <div className="flex items-center gap-1 text-amber-300 text-sm"><Star size={14} className="fill-amber-300" /> {item.rating} ({item.sales} sold)</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black bg-gradient-to-r from-red-300 to-rose-300 bg-clip-text text-transparent">{item.price.toLocaleString()} <span className="text-sm">{item.currency}</span></div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl">Buy <ChevronRight size={16} /></Button>
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