import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Hotel, Search, MapPin, Star, ChevronRight, Wifi, Dumbbell, Coffee, Waves, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Layout/Footer";

const HOTELS = [
  { id: "HTL-001", name: "Hilton Bali Resort", location: "Bali", rating: 4.8, reviews: 1234, price: 120, image: "🏨", amenities: ["wifi", "pool", "gym", "restaurant"], verified: true, badge: "featured" },
  { id: "HTL-002", name: "Hotel Timor", location: "Dili", rating: 4.5, reviews: 567, price: 45, image: "🏨", amenities: ["wifi", "parking"], verified: true, badge: null },
  { id: "HTL-003", name: "Beachfront Inn", location: "Atauro", rating: 4.3, reviews: 234, price: 35, image: "🏖️", amenities: ["wifi", "restaurant"], verified: false, badge: null },
];

export default function TravelHotels() {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-purple-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-pink-600/20 rounded-full blur-[90px]" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Back to Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">SANIMAR Hotels</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ List Hotel</Button></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 rounded-3xl border border-purple-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Temukan Hotel Terbaik</h2>
            <p className="text-xl text-purple-100">3,500+ hotels di seluruh Asia Tenggara</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <div className="relative">
              <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <div className="relative">
              <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12">
                <SelectValue placeholder="Guests" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="1">1 Guest</SelectItem>
                <SelectItem value="2">2 Guests</SelectItem>
                <SelectItem value="3">3+ Guests</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl">Search Hotels</Button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOTELS.map((hotel, i) => (
            <motion.div key={hotel.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">{hotel.image}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  {hotel.badge && <Badge className="absolute top-3 left-3 bg-purple-500/20 text-purple-300 border-purple-500/30 border px-3 py-1.5 text-xs font-bold">{hotel.badge}</Badge>}
                  {hotel.verified && <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-300 border-green-500/30 border px-3 py-1.5 text-xs font-bold">✓ Verified</Badge>}
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-lg line-clamp-1">{hotel.name}</CardTitle>
                  <div className="text-slate-400 flex items-center gap-1"><MapPin size={14} /> {hotel.location}</div>
                  <div className="flex items-center gap-1 text-amber-300 text-sm"><Star size={14} className="fill-amber-300" /> {hotel.rating} ({hotel.reviews} reviews)</div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.includes("wifi") && <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200"><Wifi size={12} className="mr-1" />WiFi</Badge>}
                    {hotel.amenities.includes("pool") && <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200"><Waves size={12} className="mr-1" />Pool</Badge>}
                    {hotel.amenities.includes("gym") && <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200"><Dumbbell size={12} className="mr-1" />Gym</Badge>}
                    {hotel.amenities.includes("restaurant") && <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200"><Coffee size={12} className="mr-1" />Restaurant</Badge>}
                    {hotel.amenities.includes("parking") && <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-200"><Car size={12} className="mr-1" />Parking</Badge>}
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <div className="flex-1">
                    <div className="text-3xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">${hotel.price}<span className="text-sm text-slate-400 ml-1">/night</span></div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl">Book <ChevronRight size={16} /></Button>
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