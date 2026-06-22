import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plane, Search, MapPin, Calendar, Users, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Layout/Footer";

const FLIGHTS = [
  { id: "FLT-001", from: "DIL", fromCity: "Dili", to: "DPS", toCity: "Bali", airline: "Citilink", price: 95, duration: "2h 30m", stops: "Direct", image: "✈️" },
  { id: "FLT-002", from: "DIL", fromCity: "Dili", to: "CGK", toCity: "Jakarta", airline: "Lion Air", price: 120, duration: "3h 45m", stops: "Direct", image: "✈️" },
  { id: "FLT-003", from: "DIL", fromCity: "Dili", to: "SIN", toCity: "Singapore", airline: "Singapore Airlines", price: 280, duration: "2h 15m", stops: "Direct", image: "✈️" },
  { id: "FLT-004", from: "DIL", fromCity: "Dili", to: "DRW", toCity: "Darwin", airline: "Air Asia", price: 150, duration: "1h 45m", stops: "Direct", image: "✈️" },
];

export default function TravelFlights() {
  const [from, setFrom] = useState("DIL");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-blue-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-[90px]" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Back to Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">SANIMAR Flights</h1>
          <Link href="/sanimar-market/jual"><Button className="bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black">+ List Flight</Button></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/40 to-blue-900/40 rounded-3xl border border-blue-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Temukan Tiket Pesawat Terbaik</h2>
            <p className="text-xl text-blue-100">1400+ airports, 500+ airlines, 73 countries</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="From" className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={to} onChange={e => setTo(e.target.value)} placeholder="To" className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <div className="relative">
              <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12" />
            </div>
            <Select value={passengers} onValueChange={setPassengers}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12">
                <Users size={18} className="mr-2 text-slate-300" />
                <SelectValue placeholder="Passengers" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="1">1 Passenger</SelectItem>
                <SelectItem value="2">2 Passengers</SelectItem>
                <SelectItem value="3">3 Passengers</SelectItem>
                <SelectItem value="4">4+ Passengers</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-2xl">Search Flights</Button>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {FLIGHTS.map((flight, i) => (
            <motion.div key={flight.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{flight.image}</div>
                      <div>
                        <div className="text-2xl font-black text-white">{flight.from} → {flight.to}</div>
                        <div className="text-slate-400">{flight.fromCity} to {flight.toCity}</div>
                        <div className="text-sm text-slate-300">✈️ {flight.airline} • ⏱ {flight.duration} • {flight.stops}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">${flight.price}</div>
                      <div className="text-sm text-slate-400">per person</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl">Book Now <ChevronRight size={16} /></Button>
                    <Button variant="ghost" className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl px-6">Details</Button>
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