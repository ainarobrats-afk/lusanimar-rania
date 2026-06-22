import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Truck, Package, Globe, Shield, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Layout/Footer";

export default function CrossBorder() {
  const [activeTab, setActiveTab] = useState("marketplace");

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
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Cross-Border Trade</h1>
          <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black">Ship Now</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/40 to-amber-900/40 rounded-3xl border border-amber-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🌉</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Jembatan Timor</h2>
            <p className="text-xl text-amber-100">Indonesia ↔ Timor-Leste — aman, ada escrow, barang sampai baru bayar</p>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { tab: "marketplace", label: "Marketplace", icon: Package },
            { tab: "shipping", label: "Shipping", icon: Truck },
            { tab: "escrow", label: "Escrow", icon: Shield },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`rounded-2xl border p-4 flex items-center gap-2 ${activeTab === item.tab ? "border-amber-500/40 bg-white/10" : "border-white/10 bg-white/5"}`}
            >
              <item.icon className="text-amber-300" />
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "marketplace" && (
          <Card className="bg-white/5 backdrop-blur-3xl border border-white/10">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "🔥 Flash Deals Indo → Timor", desc: "Produk Indonesia diskon + free shipping", color: "from-red-500/20 to-orange-500/20" },
                  { title: "🇹🇱 Produk Lokal Timor", desc: "Tais, kopi, madu, kerajinan lokal", color: "from-blue-500/20 to-cyan-500/20" },
                  { title: "🇮🇩 Produk Indonesia", desc: "Fashion, elektronik, sparepart", color: "from-green-500/20 to-emerald-500/20" },
                  { title: "🇨🇳 Import China", desc: "HP, laptop, aksesoris dari supplier China", color: "from-purple-500/20 to-violet-500/20" },
                  { title: "📦 Kirim Kupang ↔ Dili", desc: "Cek ongkir dan lacak resi realtime", color: "from-amber-500/20 to-yellow-500/20" },
                  { title: "⭐ Verified Sellers", desc: "Seller terverifikasi dengan rating tinggi", color: "from-teal-500/20 to-emerald-500/20" },
                ].map((item, idx) => (
                  <div key={item.title} className={`rounded-2xl p-4 bg-gradient-to-br ${item.color} border border-white/10`}>
                    <h3 className="font-black text-white mb-2">{item.title}</h3>
                    <p className="text-slate-200 text-sm mb-3">{item.desc}</p>
                    <Link href="/sanimar-market"><Button size="sm" className="bg-white/10 hover:bg-white/15 border border-white/10 text-white">Browse</Button></Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "shipping" && (
          <Card className="bg-white/5 backdrop-blur-3xl border border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Shipping Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { name: "Lorosae Express", rating: 4.8, deliveries: 520 },
                  { name: "Timor Travel Cargo", rating: 4.6, deliveries: 340 },
                  { name: "Leste Cargo", rating: 4.7, deliveries: 410 },
                ].map((partner) => (
                  <div key={partner.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-white font-bold mb-1">{partner.name}</div>
                    <div className="text-amber-300 text-sm">Rating: {partner.rating}</div>
                    <div className="text-slate-300 text-xs">Paket berhasil: {partner.deliveries}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "escrow" && (
          <Card className="bg-white/5 backdrop-blur-3xl border border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="text-amber-400" />
                <div>
                  <h3 className="text-white font-bold text-lg">Escrow Protection</h3>
                  <p className="text-slate-200 text-sm mt-1">Uang ditahan SANIMAR sampai buyer konfirmasi barang diterima. Tanpa penipuan, tanpa risiko.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-white/10 border-white/10 text-white">Verified Importer</Badge>
                    <Badge className="bg-white/10 border-white/10 text-white">Auto Customs</Badge>
                    <Badge className="bg-white/10 border-white/10 text-white">Live Tracking</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}