import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, MessageSquare, DollarSign, TrendingUp,
  Eye, Heart, Star, Settings, BarChart3, Plus, Edit, Trash2, Search,
  Home, Globe, Plane, ShoppingBag, Menu, Bot, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/Layout/LanguageSwitcher";
import Footer from "@/components/Layout/Footer";
import ChatMarket from "@/components/Chat/ChatMarket";

const API_BASE = import.meta.env.VITE_API_URL || "";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

interface Listing {
  id: string;
  title: string;
  price: number;
  views: number;
  likes: number;
  chats: number;
  status: "active" | "sold" | "pending" | "draft";
  badge?: string;
  image: string;
  postedAt: string;
}

export default function SanimarMarketSeller() {
  const { t, language } = useLanguage();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    views: 12450,
    favorites: 890,
    messages: 234,
    sales: 45,
    revenue: 12500,
    conversion: 3.2,
  });

  useEffect(() => {
    setListings([
      { id: "PRD-001", title: "iPhone 15 Pro Max", price: 900, views: 1240, likes: 45, chats: 12, status: "active", badge: "hot", image: "📱", postedAt: "2 hari lalu" },
      { id: "SRV-003", title: "Visa Processing", price: 200, views: 3400, likes: 156, chats: 89, status: "active", badge: "hot", image: "📄", postedAt: "3 hari lalu" },
      { id: "VEH-001", title: "Toyota Hilux 2022", price: 18000, views: 2100, likes: 8, chats: 3, status: "sold", badge: "top", image: "🚗", postedAt: "1 minggu lalu" },
      { id: "PRO-002", title: "Apartment - Near Beach", price: 200, views: 1200, likes: 3, chats: 1, status: "active", image: "🏠", postedAt: "5 hari lalu" },
    ]);
  }, []);

  const menuItems = [
    { href: "/sanimar-market", label: "Marketplace", icon: <ShoppingBag size={22} /> },
    { href: "/sanimar-market/seller", label: "Seller Dashboard", icon: <LayoutDashboard size={22} /> },
    { href: "/sanimar-market/jual", label: "Sell Item", icon: <Plus size={22} /> },
    { href: "/sanimar-market/chat", label: "Messages", icon: <MessageSquare size={22} /> },
    { href: "/profile", label: "Profile", icon: <Home size={22} /> },
  ];

  const statCards = [
    { label: "Total Views", value: formatNumber(stats.views), icon: <Eye size={24} />, color: "from-blue-500 to-cyan-600", trend: "+12%" },
    { label: "Favorites", value: formatNumber(stats.favorites), icon: <Heart size={24} />, color: "from-red-500 to-pink-600", trend: "+8%" },
    { label: "Messages", value: formatNumber(stats.messages), icon: <MessageSquare size={24} />, color: "from-purple-500 to-violet-600", trend: "+24%" },
    { label: "Total Sales", value: stats.sales, icon: <DollarSign size={24} />, color: "from-green-500 to-emerald-600", trend: "+5%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100 relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-600/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header initial={{ y: -120 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10 shadow-2xl shadow-blue-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-xl font-black text-white">S</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h1>
                <p className="text-[11px] text-blue-300/90 font-bold tracking-[0.25em] uppercase">SELLER DASHBOARD</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant={item.href === "/sanimar-market/seller" ? "default" : "ghost"} className={`text-sm font-semibold px-4 py-2 rounded-2xl transition-all duration-300 ${item.href === "/sanimar-market/seller" ? "bg-gradient-to-r from-blue-600 to-amber-600 text-white shadow-xl" : "text-slate-200 hover:text-white hover:bg-white/10"}`}>
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5">
                    <Menu size={28} className="text-blue-200" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85%] sm:w-80 bg-slate-950/95 backdrop-blur-3xl border-r border-white/10">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between py-6 border-b border-white/10">
                      <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30"><span className="text-xl font-black text-white">S</span></div>
                        <div><h2 className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h2><p className="text-[10px] text-blue-300/90 font-bold tracking-[0.25em]">SELLER</p></div>
                      </Link>
                    </div>
                    <nav className="flex-1 space-y-3 pt-6">
                      {menuItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-4 px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5">{item.icon}<span className="font-semibold text-lg">{item.label}</span></Button>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent mb-2">Seller Dashboard</h1>
          <p className="text-slate-400 text-lg">Kelola listing, pesanan, dan performa jualan Anda</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-gradient-to-br ${stat.color} rounded-3xl p-6 text-white shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 rounded-2xl p-3">{stat.icon}</div>
                <Badge className="bg-white/20 text-white border-0 text-xs font-bold">{stat.trend}</Badge>
              </div>
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-white/80 font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-bold">Overview</TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-bold">My Listings</TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-bold">Messages</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-bold">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8 space-y-6">
            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2"><TrendingUp size={20} className="text-blue-400" /> Recent Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "iPhone 15 Pro Max", views: 145, time: "2 hours ago" },
                      { title: "Visa Processing", views: 89, time: "5 hours ago" },
                      { title: "Toyota Hilux 2022", views: 56, time: "1 day ago" },
                      { title: "Apartment - Near Beach", views: 34, time: "2 days ago" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="text-xs text-slate-400">{item.time}</div>
                        </div>
                        <div className="flex items-center gap-1 text-blue-300 font-bold"><Eye size={16} />{item.views}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2"><MessageSquare size={20} className="text-green-400" /> Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { from: "John doe", msg: "Apakah masih tersedia?", time: "10 min", unread: true },
                      { from: "Maria", msg: "Bisa nego?", time: "1 hour", unread: true },
                      { from: "Carlos", msg: "Kapan bisa lihat?", time: "3 hours", unread: false },
                    ].map((msg, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${msg.unread ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10"}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">{msg.from[0]}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-sm">{msg.from}</span>
                            <span className="text-xs text-slate-400">{msg.time}</span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-1">{msg.msg}</p>
                        </div>
                        {msg.unread && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Card */}
            <Card className="bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-green-900/40 border border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><DollarSign size={20} className="text-green-400" /> Revenue This Month</CardTitle>
                <CardDescription className="text-green-200">Total pendapatan Anda bulan ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black bg-gradient-to-r from-green-300 via-emerald-300 to-green-400 bg-clip-text text-transparent mb-4">${stats.revenue.toLocaleString()}</div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">+{stats.conversion}% conversion</Badge>
                  <span className="text-slate-300">Target: $15,000</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search listings..." className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
              </div>
              <Link href="/sanimar-market/jual">
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black rounded-2xl">
                  <Plus size={18} className="mr-2" /> New Listing
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{listing.image}</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge className={`${listing.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"} border px-3 py-1.5 text-xs font-bold`}>{listing.status}</Badge>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button variant="ghost" size="icon" className="bg-slate-950/70 rounded-full border border-white/20 hover:bg-slate-950/90 p-2"><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="bg-slate-950/70 rounded-full border border-white/20 hover:bg-slate-950/90 p-2 text-red-400"><Trash2 size={16} /></Button>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-white text-lg line-clamp-1">{listing.title}</CardTitle>
                    <CardDescription className="text-slate-400">Posted {listing.postedAt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent mb-4">${listing.price.toLocaleString()}</div>
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1"><Eye size={14} />{listing.views}</div>
                      <div className="flex items-center gap-1"><Heart size={14} />{listing.likes}</div>
                      <div className="flex items-center gap-1"><MessageSquare size={14} />{listing.chats}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-8">
            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Inbox</CardTitle>
                <CardDescription className="text-slate-400">Pesan dari pembeli</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { from: "John doe", msg: "Apakah iPhone 15 masih tersedia?", time: "10 min", unread: true },
                    { from: "Maria", msg: "Bisa diskon?", time: "1 hour", unread: true },
                    { from: "Carlos", msg: "Kapan bisa lihat mobil?", time: "3 hours", unread: false },
                    { from: "Ana", msg: "Terima kasih informasinya", time: "1 day", unread: false },
                  ].map((msg, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${msg.unread ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10"} cursor-pointer hover:border-white/30 transition-all duration-300`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">{msg.from[0]}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{msg.from}</span>
                          <span className="text-xs text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-1">{msg.msg}</p>
                      </div>
                      {msg.unread && <div className="w-3 h-3 rounded-full bg-blue-400" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Total Revenue", value: "$12,500", change: "+12.5%", icon: <DollarSign size={32} />, color: "from-green-500 to-emerald-600" },
                { title: "Conversion Rate", value: "3.2%", change: "+0.4%", icon: <TrendingUp size={32} />, color: "from-blue-500 to-cyan-600" },
                { title: "Avg. Rating", value: "4.8", change: "+0.2", icon: <Star size={32} />, color: "from-amber-500 to-orange-600" },
                { title: "Response Rate", value: "94%", change: "+2%", icon: <MessageSquare size={32} />, color: "from-purple-500 to-violet-600" },
                { title: "Total Views", value: "12,450", change: "+1,234", icon: <Eye size={32} />, color: "from-cyan-500 to-blue-600" },
                { title: "Active Listings", value: "4", change: "0", icon: <Package size={32} />, color: "from-pink-500 to-rose-600" },
              ].map((item, i) => (
                <Card key={i} className="bg-white/5 backdrop-blur-3xl border border-white/10">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 shadow-lg`}>{item.icon}</div>
                    <div className="text-3xl font-black text-white mb-1">{item.value}</div>
                    <div className="text-sm text-slate-400 mb-2">{item.title}</div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">{item.change}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          {[
            { href: "/sanimar-market", icon: <Home size={22} />, label: "Home" },
            { href: "/sanimar-market/seller", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
            { href: "/sanimar-market/jual", icon: <Plus size={26} />, label: "Sell", highlight: true },
            { href: "/sanimar-market/chat", icon: <MessageSquare size={22} />, label: "Chat" },
            { href: "/profile", icon: <Home size={22} />, label: "Profile" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 ${item.highlight ? "bg-gradient-to-t from-orange-500 to-amber-500 text-black -mt-4 shadow-xl shadow-orange-500/40 w-16 h-16 justify-center" : "text-slate-300 hover:text-white"}`}>
                {item.icon}
                <span className={`text-[10px] font-bold ${item.highlight ? "text-black" : ""}`}>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
      <ChatMarket isOpen={false} onToggle={() => {}} onClose={() => {}} />
    </div>
  );
}