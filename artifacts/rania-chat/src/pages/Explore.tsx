import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import HotelMap from "../components/HotelMap";

const API = "/api";
const GH = "/image";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Partner {
  id: string;
  status: string;
  category: string;
  businessName: string;
  city: string;
  country: string;
  whatsapp: string;
  email?: string;
  description?: string;
  pricingRange?: string;
  promoText?: string;
  amenities: string[];
  images: string[];
  featured: boolean;
  views: number;
  whatsappClicks: number;
  rating: number;
  reviewCount: number;
  raniaScore?: number;
}

interface FlashDeal {
  id: string;
  route: string;
  label: string;
  price: number;
  origPrice: number;
  currency: string;
  airline: string;
  tag: string;
  remainingMs: number;
  discount: number;
}

// ─── Destination data ────────────────────────────────────────────────────────
const POPULAR_DESTINATIONS = [
  {
    city: "Bali",
    country: "Indonesia",
    iata: "DPS",
    flag: "🇮🇩",
    price: 150,
    origPrice: 187,
    discount: 20,
    tag: "Diskon 20%",
    tagColor: "#10b981",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    desc: "Island of Gods",
  },
  {
    city: "Singapore",
    country: "Singapore",
    iata: "SIN",
    flag: "🇸🇬",
    price: 180,
    origPrice: 245,
    discount: 27,
    tag: "Flash Sale",
    tagColor: "#ef4444",
    image: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80",
    desc: "Lion City",
  },
  {
    city: "Darwin",
    country: "Australia",
    iata: "DRW",
    flag: "🇦🇺",
    price: 95,
    origPrice: 130,
    discount: 27,
    tag: "Weekend Getaway",
    tagColor: "#f59e0b",
    image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80",
    desc: "Closest Aussie City",
  },
  {
    city: "London",
    country: "UK",
    iata: "LHR",
    flag: "🇬🇧",
    price: 850,
    origPrice: 1100,
    discount: 23,
    tag: "Early Bird",
    tagColor: "#6366f1",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
    desc: "Big Ben & Beyond",
  },
  {
    city: "Dili",
    country: "Timor-Leste",
    iata: "DIL",
    flag: "🇹🇱",
    price: 45,
    origPrice: 60,
    discount: 25,
    tag: "Home Route",
    tagColor: "#00e5ff",
    image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80",
    desc: "Pearl of the Orient",
  },
  {
    city: "Kuala Lumpur",
    country: "Malaysia",
    iata: "KUL",
    flag: "🇲🇾",
    price: 140,
    origPrice: 195,
    discount: 28,
    tag: "Best Value",
    tagColor: "#a855f7",
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80",
    desc: "Twin Towers City",
  },
];

const HERO_SLIDES = [
  {
    city: "Bali, Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=85",
    color: "#10b981",
  },
  {
    city: "Dili, Timor-Leste",
    image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1400&q=85",
    color: "#00e5ff",
  },
  {
    city: "Singapore",
    image: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=1400&q=85",
    color: "#6366f1",
  },
  {
    city: "Darwin, Australia",
    image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1400&q=85",
    color: "#f59e0b",
  },
];

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All", emoji: "🌍" },
  { id: "hotel", label: "Hotel", emoji: "🏨" },
  { id: "resort", label: "Resort", emoji: "🏖️" },
  { id: "homestay", label: "Homestay", emoji: "🏠" },
  { id: "guesthouse", label: "Guesthouse", emoji: "🏡" },
  { id: "villa", label: "Villa", emoji: "🏛️" },
  { id: "tour", label: "Tours", emoji: "🗺️" },
  { id: "diving", label: "Diving", emoji: "🤿" },
  { id: "rental_car", label: "Car Rental", emoji: "🚗" },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { id: "local_guide", label: "Local Guide", emoji: "🧭" },
  { id: "attraction", label: "Attraction", emoji: "📍" },
];

const CATEGORY_COLORS: Record<string, string> = {
  hotel: "from-blue-600/25 to-blue-800/25 border-blue-500/30",
  resort: "from-teal-600/25 to-cyan-800/25 border-teal-500/30",
  homestay: "from-emerald-600/25 to-green-800/25 border-emerald-500/30",
  guesthouse: "from-lime-600/25 to-green-800/25 border-lime-500/30",
  villa: "from-violet-600/25 to-purple-800/25 border-violet-500/30",
  tour: "from-orange-600/25 to-amber-800/25 border-orange-500/30",
  diving: "from-cyan-600/25 to-blue-800/25 border-cyan-500/30",
  rental_car: "from-slate-600/25 to-gray-800/25 border-slate-500/30",
  restaurant: "from-red-600/25 to-rose-800/25 border-red-500/30",
  local_guide: "from-yellow-600/25 to-amber-800/25 border-yellow-500/30",
  attraction: "from-pink-600/25 to-fuchsia-800/25 border-pink-500/30",
};

const PRICE_FILTERS = [
  { id: "all", label: "All Prices", symbol: "" },
  { id: "$", label: "Budget", symbol: "$" },
  { id: "$$", label: "Mid-Range", symbol: "$$" },
  { id: "$$$", label: "Premium", symbol: "$$$" },
  { id: "$$$$", label: "Luxury", symbol: "$$$$" },
];

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ onSearch }: { onSearch: (q: string) => void }) {
  const [, navigate] = useLocation();
  const [slide, setSlide] = useState(0);
  const [dest, setDest] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setSlide(s => (s + 1) % HERO_SLIDES.length);
        setTransitioning(false);
      }, 400);
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  const current = HERO_SLIDES[slide];

  return (
    <div className="relative overflow-hidden rounded-3xl mb-8" style={{ minHeight: 420 }}>
      {/* Slideshow background */}
      {HERO_SLIDES.map((s, i) => (
        <div key={i} className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === slide && !transitioning ? 1 : 0 }}>
          <img src={s.image} alt={s.city} className="w-full h-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,8,18,0.35) 0%, rgba(5,8,18,0.65) 60%, rgba(5,8,18,0.95) 100%)" }} />

      {/* Location pill */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold text-white transition-all duration-500"
        style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${current.color}40` }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: current.color }} />
        {current.city}
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 flex gap-1.5">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className="rounded-full transition-all duration-300"
            style={{ width: i === slide ? 20 : 6, height: 6, background: i === slide ? current.color : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16" style={{ minHeight: 420 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold mb-4"
          style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)", color: "#00e5ff" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          SANIMAR TRAVEL · TIMOR-LESTE & BEYOND
        </div>

        <h1 className="font-orbitron text-3xl md:text-5xl font-black text-white mb-3 leading-tight max-w-2xl">
          Discover{" "}
          <span style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Timor-Leste
          </span>
          {" "}& Beyond
        </h1>
        <p className="text-gray-300 text-sm md:text-base mb-7 max-w-md">
          Flights, hotels, tours & local guides — all in one place. Powered by RANIA AI.
        </p>

        {/* Search bar */}
        <div className="flex w-full max-w-xl gap-2 mb-5">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <input
              value={dest}
              onChange={e => setDest(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSearch(dest)}
              placeholder="Where do you want to go?"
              className="w-full pl-9 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-400 outline-none"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(16px)" }}
            />
          </div>
          <button
            onClick={() => onSearch(dest)}
            className="px-5 py-3.5 rounded-xl font-bold text-black text-sm flex-shrink-0 transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 20px rgba(0,229,255,0.35)" }}>
            Search
          </button>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => { const el = document.getElementById("deals-section"); el?.scrollIntoView({ behavior: "smooth" }); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            ✈️ Explore Deals
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.2),rgba(168,85,247,0.2))", border: "1px solid rgba(0,229,255,0.3)", color: "#00e5ff" }}>
            🤖 Plan Trip with RANIA AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Popular Destinations ─────────────────────────────────────────────────────
function PopularDestinations({ onDestClick }: { onDestClick: (iata: string, city: string) => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
          style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)" }}>✈️</div>
        <div>
          <div className="font-orbitron text-xs font-black tracking-widest text-white/80 uppercase">Popular Destinations</div>
          <div className="text-[10px] text-gray-500">Click to search flights</div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {POPULAR_DESTINATIONS.map(dest => (
          <button
            key={dest.iata}
            onClick={() => onDestClick(dest.iata, dest.city)}
            className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-left"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="relative h-28 overflow-hidden">
              <img src={dest.image} alt={dest.city} loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Discount tag */}
              <div className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                style={{ background: dest.tagColor + "dd", boxShadow: `0 2px 8px ${dest.tagColor}55` }}>
                {dest.tag}
              </div>
              {/* Flag */}
              <div className="absolute top-2 right-2 text-lg leading-none">{dest.flag}</div>
            </div>
            <div className="p-2.5">
              <div className="font-bold text-white text-xs leading-tight">{dest.city}</div>
              <div className="text-[9px] text-gray-500 mb-1.5">{dest.desc}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-emerald-400">${dest.price}</span>
                <span className="text-[9px] text-gray-600 line-through">${dest.origPrice}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AI Trip Planner Card ─────────────────────────────────────────────────────
function AITripPlanner() {
  const [, navigate] = useLocation();
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("3");
  const [budget, setBudget] = useState("$500");
  const [interest, setInterest] = useState("Beach");

  const handlePlan = () => {
    const prompt = `Tolong buatkan rencana perjalanan ke ${destination || "Bali"} selama ${duration} hari dengan budget ${budget}. Saya tertarik dengan wisata ${interest}. Rekomendasikan penerbangan dari Dili, hotel, dan aktivitas terbaik.`;
    sessionStorage.setItem("rania_prefill", prompt);
    navigate("/");
  };

  return (
    <div className="mb-8 rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(168,85,247,0.06))", border: "1px solid rgba(0,229,255,0.15)" }}>
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.2),rgba(168,85,247,0.2))", border: "1px solid rgba(0,229,255,0.3)" }}>
            🤖
          </div>
          <div>
            <div className="font-orbitron text-sm font-black text-white">Ask RANIA to Plan Your Trip</div>
            <div className="text-[10px] text-cyan-400">AI-powered itinerary in seconds</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Destination</label>
            <input value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Bali, Singapore"
              className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-gray-500 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {["1","2","3","4","5","7","10","14"].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Budget</label>
            <select value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {["$200","$500","$1000","$2000","$5000"].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Interest</label>
            <select value={interest} onChange={e => setInterest(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {["Beach","Mountain","Cultural","Adventure","Shopping","Food","Diving"].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handlePlan}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-black text-sm transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 20px rgba(0,229,255,0.3)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate My Trip Plan
        </button>
      </div>
    </div>
  );
}

// ─── Flash Deal Countdown ─────────────────────────────────────────────────────
function CountdownBadge({ ms }: { ms: number }) {
  const [rem, setRem] = useState(ms);
  useEffect(() => {
    const iv = setInterval(() => setRem(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(iv);
  }, []);
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  if (rem === 0) return <span className="text-red-400 text-[10px] font-bold">EXPIRED</span>;
  return (
    <span className="font-mono text-[11px] font-black text-orange-300">
      {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
    </span>
  );
}

// ─── Flash Deals Banner ───────────────────────────────────────────────────────
function FlashDealBanner({ deals }: { deals: FlashDeal[] }) {
  const [, navigate] = useLocation();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (deals.length < 2) return;
    const iv = setInterval(() => setIdx(i => (i + 1) % deals.length), 4000);
    return () => clearInterval(iv);
  }, [deals.length]);
  if (!deals.length) return null;
  const d = deals[idx];
  return (
    <div id="deals-section" className="relative overflow-hidden rounded-2xl border border-orange-500/30 mb-6"
      style={{ background: "linear-gradient(135deg, rgba(234,88,12,0.15) 0%, rgba(239,68,68,0.10) 50%, rgba(168,85,247,0.10) 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 -top-10 w-72 h-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.6), transparent)" }} />
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5), transparent)" }} />
      </div>
      <div className="relative z-10 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.3)" }}>
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Flash Deals</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                  style={{ background: "rgba(249,115,22,0.25)", border: "1px solid rgba(249,115,22,0.3)" }}>{d.tag}</span>
              </div>
              <div className="text-white font-bold text-base">{d.label} <span className="text-gray-400 font-normal text-sm">· {d.route}</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">{d.airline}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-orbitron text-2xl font-black text-emerald-400">${d.price}</span>
                <span className="text-gray-500 line-through text-sm">${d.origPrice}</span>
                <span className="text-[10px] font-black text-orange-400 bg-orange-400/15 border border-orange-400/25 px-1.5 py-0.5 rounded-full">-{d.discount}%</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-500">Ends in</span>
                <CountdownBadge ms={d.remainingMs} />
              </div>
            </div>
            <button onClick={() => navigate("/")}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-black font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 20px rgba(0,229,255,0.3)" }}>
              Book Now
            </button>
          </div>
        </div>
        {deals.length > 1 && (
          <div className="flex gap-1 mt-3 justify-center md:justify-start">
            {deals.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-orange-400" : "w-2 bg-white/20"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline Review Component ──────────────────────────────────────────────────
interface Review { author: string; rating: number; comment: string; avatar: string; date: string; }

const SAMPLE_REVIEWS: Review[] = [
  { author: "Maria S.", rating: 5, comment: "RANIA helped me find the best deal to Bali! Super easy booking via WhatsApp.", avatar: "https://i.pravatar.cc/40?img=1", date: "2 days ago" },
  { author: "João M.", rating: 5, comment: "Hotel Timor was amazing, booked through this platform. Highly recommend!", avatar: "https://i.pravatar.cc/40?img=2", date: "1 week ago" },
  { author: "Ana K.", rating: 4, comment: "Darwin ticket was cheapest I found anywhere. Will use again for Singapore trip.", avatar: "https://i.pravatar.cc/40?img=5", date: "2 weeks ago" },
];

function ReviewsSection() {
  const [reviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  const handleSubmit = () => {
    if (newRating === 0 || !comment.trim()) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setNewRating(0); setComment(""); }, 3000);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>⭐</div>
        <div>
          <div className="font-orbitron text-xs font-black tracking-widest text-white/80 uppercase">Reviews & Ratings</div>
          <div className="text-[10px] text-gray-500">{reviews.length} reviews · avg {avgRating}/5</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <img src={r.avatar} alt={r.author} className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{r.author}</div>
                <div className="text-[10px] text-gray-500">{r.date}</div>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-xs ${s <= r.rating ? "text-amber-400" : "text-gray-700"}`}>★</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{r.comment}</p>
          </div>
        ))}
      </div>

      {/* Write a review */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs font-bold text-white mb-3">Write a Review</div>
        {submitted ? (
          <div className="text-center py-4 text-emerald-400 font-bold text-sm">Thank you for your review!</div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewRating(s)}
                  className="text-2xl transition-transform hover:scale-125">
                  <span className={(s <= (hoverRating || newRating)) ? "text-amber-400" : "text-gray-700"}>★</span>
                </button>
              ))}
            </div>
            <input value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button onClick={handleSubmit}
              disabled={newRating === 0 || !comment.trim()}
              className="px-4 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", color: "#000" }}>
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Partner Card (with gallery + trending badge) ─────────────────────────────
function PartnerCard({ p, onWAClick, trendingRank }: { p: Partner; onWAClick: (p: Partner) => void; trendingRank?: number }) {
  const [imgIdx, setImgIdx] = useState(0);
  const catInfo = CATEGORIES.find(c => c.id === p.category) || { emoji: "📍", label: p.category };
  const colorClass = CATEGORY_COLORS[p.category] || "from-gray-600/25 to-gray-800/25 border-gray-500/30";
  const images = p.images.length > 0 ? p.images : [`https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=70`];

  return (
    <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] bg-gradient-to-br ${colorClass}`}
      style={{ background: "rgba(4,9,26,0.85)" }}>
      {/* Image + gallery dots */}
      <div className="relative h-44 overflow-hidden">
        <img src={images[imgIdx]} alt={p.businessName} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Trending badge */}
        {trendingRank && trendingRank <= 3 && (
          <div className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg,#ef4444,#f97316)", boxShadow: "0 2px 8px rgba(239,68,68,0.5)" }}>
            🔥 HOT #{trendingRank}
          </div>
        )}
        {/* Featured badge */}
        {p.featured && !trendingRank && (
          <div className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 2px 8px rgba(245,158,11,0.4)" }}>
            ⭐ FEATURED
          </div>
        )}
        {/* Category pill */}
        <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {catInfo.emoji} {catInfo.label}
        </div>
        {/* Rating */}
        {p.reviewCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold text-white backdrop-blur-sm px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            ⭐ {p.rating.toFixed(1)} <span className="text-gray-400 font-normal">({p.reviewCount})</span>
          </div>
        )}
        {/* Gallery dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {images.slice(0, 5).map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                className="rounded-full transition-all"
                style={{ width: i === imgIdx ? 12 : 5, height: 5, background: i === imgIdx ? "#00e5ff" : "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
        )}
        {/* RANIA Score badge */}
        {typeof p.raniaScore === "number" && p.raniaScore > 0 && (
          <div className="absolute bottom-8 left-2 flex items-center gap-1 text-[9px] font-black text-white backdrop-blur-sm px-2 py-0.5 rounded-full"
            style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.25),rgba(168,85,247,0.25))", border: "1px solid rgba(0,229,255,0.3)" }}>
            🧠 {p.raniaScore}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-bold text-white text-base leading-tight mb-0.5 group-hover:text-cyan-300 transition-colors">{p.businessName}</h3>
          <div className="text-[11px] text-gray-400">📍 {p.city}, {p.country}</div>
        </div>
        {p.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{p.description}</p>
        )}
        {/* Google Maps for accommodation partners */}
        {["hotel", "resort", "homestay", "guesthouse", "villa"].includes(p.category) && (
          <div className="mb-3">
            <HotelMap
              hotelName={p.businessName}
              city={p.city}
              country={p.country}
              compact
            />
          </div>
        )}
        {p.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {p.amenities.slice(0, 3).map(a => (
              <span key={a} className="text-[9px] text-cyan-300/80 bg-cyan-400/8 border border-cyan-400/15 px-1.5 py-0.5 rounded-full">{a}</span>
            ))}
            {p.amenities.length > 3 && (
              <span className="text-[9px] text-gray-500 px-1.5 py-0.5">+{p.amenities.length - 3}</span>
            )}
          </div>
        )}
        {p.promoText && (
          <div className="text-[10px] text-orange-300 bg-orange-400/8 border border-orange-400/15 rounded-lg px-2.5 py-1.5 mb-3 leading-relaxed">
            {p.promoText}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div>
            {p.pricingRange && (
              <div className="text-sm font-bold text-emerald-400 font-orbitron">{p.pricingRange}</div>
            )}
          </div>
          <button
            onClick={() => onWAClick(p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", boxShadow: "0 2px 12px rgba(37,211,102,0.3)" }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Explore Page ────────────────────────────────────────────────────────
export default function Explore() {
  const [, navigate] = useLocation();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isRanked, setIsRanked] = useState(false);
  const LIMIT = 12;

  const fetchPartners = useCallback(async (cat: string, q: string, pg: number, sortBy: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(pg), sort: sortBy });
      if (cat !== "all") params.set("category", cat);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`${API}/rania/partners?${params}`);
      const data = await res.json();
      if (pg === 1) setPartners(data.partners || []);
      else setPartners(prev => [...prev, ...(data.partners || [])]);
      setTotal(data.total || 0);
      setIsRanked(data.ranked === true);
      (data.partners || []).forEach((p: Partner) => {
        fetch(`${API}/rania/partners/${p.id}/track`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "view" }),
        }).catch(() => {});
      });
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/rania/flash-deals`).then(r => r.json()).then(d => setFlashDeals(d.deals || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPartners(category, query, 1, sort);
  }, [category, query, sort, fetchPartners]);

  const handleWAClick = (p: Partner) => {
    fetch(`${API}/rania/partners/${p.id}/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "whatsapp_click" }) }).catch(() => {});
    const msg = encodeURIComponent(`Halo ${p.businessName}! Saya lihat bisnis Anda di RANIA Travel. Saya ingin tanya informasi lebih lanjut tentang ${p.category === "hotel" || p.category === "resort" || p.category === "homestay" ? "ketersediaan kamar" : p.category === "tour" ? "paket tour" : p.category === "diving" ? "paket diving" : "layanan"} Anda. Terima kasih!`);
    window.open(`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const handleDestClick = (iata: string, city: string) => {
    setQuery(city);
    const el = document.getElementById("partner-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHeroSearch = (q: string) => {
    setQuery(q);
    const el = document.getElementById("partner-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPartners(category, query, next, sort);
  };

  // Apply price filter client-side
  const filteredPartners = priceFilter === "all"
    ? partners
    : partners.filter(p => p.pricingRange?.startsWith(priceFilter));

  // Trending = sorted by whatsappClicks desc
  const trendingPartners = [...partners].sort((a, b) => (b.whatsappClicks - a.whatsappClicks)).slice(0, 6);
  const featuredPartners = filteredPartners.filter(p => p.featured);
  const regularPartners = filteredPartners.filter(p => !p.featured);
  const hasMore = partners.length < total;

  return (
    <div className="min-h-screen bg-[#050812] text-white overflow-x-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.5), transparent)", top: "-80px", left: "-80px", filter: "blur(80px)" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5), transparent)", bottom: "20%", right: "-100px", filter: "blur(100px)" }} />
      </div>

      {/* TOP NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/6" style={{ background: "rgba(5,8,18,0.94)" }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3" style={{ height: "60px" }}>
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:block">Home</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2 flex-1">
            <img src={`${GH}/logo-sanimar-3d.png.webp`} alt="SANIMAR" className="h-8 w-auto rounded-lg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div>
              <div className="font-orbitron text-sm font-black text-white leading-none">Explore</div>
              <div className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">Travel & Partner Marketplace</div>
            </div>
          </div>
          <a href="/partner/register"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(168,85,247,0.15))", border: "1px solid rgba(0,229,255,0.25)" }}>
            + List Business
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">

        {/* ── HERO SECTION ── */}
        <HeroSection onSearch={handleHeroSearch} />

        {/* ── POPULAR DESTINATIONS ── */}
        <PopularDestinations onDestClick={handleDestClick} />

        {/* ── AI TRIP PLANNER ── */}
        <AITripPlanner />

        {/* ── FLASH DEALS ── */}
        <FlashDealBanner deals={flashDeals} />

        {/* ── TRENDING PARTNERS ── */}
        {!loading && trendingPartners.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>🔥</div>
              <div>
                <div className="font-orbitron text-xs font-black tracking-widest text-white/80 uppercase">Trending Partners</div>
                <div className="text-[10px] text-gray-500">Most contacted this week</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingPartners.map((p, i) => (
                <PartnerCard key={p.id} p={p} onWAClick={handleWAClick} trendingRank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        <ReviewsSection />

        {/* ── PARTNER SEARCH SECTION ── */}
        <div id="partner-section">
          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </div>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search hotels, tours, diving, restaurants..."
              className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  category === cat.id ? "text-black scale-105" : "text-gray-400 hover:text-white"
                }`}
                style={category === cat.id
                  ? { background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 16px rgba(0,229,255,0.3)" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Price Range Filter */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {PRICE_FILTERS.map(pf => (
              <button key={pf.id} onClick={() => setPriceFilter(pf.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0`}
                style={priceFilter === pf.id
                  ? { background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)", color: "#10b981" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#6b7280" }}>
                {pf.symbol ? <span className="text-emerald-400 font-black">{pf.symbol}</span> : null}
                <span>{pf.label}</span>
              </button>
            ))}
          </div>

          {/* Results header + sort */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-400">
                {loading ? "Searching..." : `${filteredPartners.length} partner${filteredPartners.length !== 1 ? "s" : ""} found`}
              </div>
              {isRanked && !loading && (
                <div className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.12),rgba(168,85,247,0.12))", border: "1px solid rgba(0,229,255,0.25)", color: "#a5f3fc" }}>
                  🧠 AI RANKED
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">Sort:</span>
              <div className="flex gap-1">
                {[
                  { id: "score", label: "🧠 Score" },
                  { id: "rating", label: "⭐ Rating" },
                  { id: "views", label: "🔥 Popular" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setSort(opt.id)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                    style={sort === opt.id
                      ? { background: "linear-gradient(135deg,#00e5ff,#a855f7)", color: "#000" }
                      : { background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && partners.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-44 bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/8 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Featured section */}
          {!loading && featuredPartners.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>⭐</div>
                <span className="font-orbitron text-xs font-bold tracking-wider text-white/70">FEATURED PARTNERS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredPartners.map(p => <PartnerCard key={p.id} p={p} onWAClick={handleWAClick} />)}
              </div>
            </div>
          )}

          {/* All partners */}
          {!loading && regularPartners.length > 0 && (
            <div>
              {featuredPartners.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}>🌍</div>
                  <span className="font-orbitron text-xs font-bold tracking-wider text-white/70">ALL PARTNERS</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {regularPartners.map(p => <PartnerCard key={p.id} p={p} onWAClick={handleWAClick} />)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredPartners.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-white font-bold text-lg mb-2">No partners found</div>
              <div className="text-gray-500 text-sm mb-6">Try a different category, price range, or search term</div>
              <button onClick={() => { setCategory("all"); setQuery(""); setPriceFilter("all"); }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
                Clear filters
              </button>
            </div>
          )}

          {/* Load More */}
          {!loading && hasMore && (
            <div className="mt-8 text-center">
              <button onClick={loadMore} className="px-8 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                Load More ({total - partners.length} remaining)
              </button>
            </div>
          )}
        </div>

        {/* CTA — Big Modern Section */}
        <div className="mt-20 mb-4">
          {/* Main CTA */}
          <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(0,229,255,0.06),rgba(168,85,247,0.1),rgba(249,115,22,0.06))", border: "1px solid rgba(168,85,247,0.25)" }}>
            {/* BG blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-25" style={{ background: "radial-gradient(circle,rgba(168,85,247,0.6),transparent)", filter: "blur(80px)" }} />
              <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full opacity-15" style={{ background: "radial-gradient(circle,rgba(0,229,255,0.5),transparent)", filter: "blur(70px)" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 opacity-10" style={{ background: "radial-gradient(ellipse,rgba(249,115,22,0.4),transparent)", filter: "blur(60px)" }} />
            </div>

            <div className="relative z-10 px-6 py-12 md:py-16 text-center">
              <div className="flex justify-center gap-3 text-4xl mb-5">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>✈️</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>🌍</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>🏨</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-3" style={{ fontFamily: "'Orbitron','sans-serif'", letterSpacing: "-0.02em" }}>
                Daftarkan Bisnis Anda
              </h2>
              <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-3">
                Hotel · Tour · Dive Center · Restoran · Homestay
              </p>
              <p className="text-gray-500 text-sm max-w-xl mx-auto mb-10">
                Jangkau ribuan traveler yang berkunjung ke Timor-Leste. <strong className="text-cyan-400">Gratis mendaftar.</strong> Terima pemesanan via WhatsApp langsung dari RANIA AI.
              </p>

              {/* Big CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="/partner/register"
                  className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-black text-lg w-full sm:w-auto min-w-[260px] transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7,#f97316)", boxShadow: "0 8px 48px rgba(168,85,247,0.6), 0 0 0 1px rgba(255,255,255,0.1)" }}>
                  <span className="text-2xl">🚀</span>
                  <span>Daftar Gratis Sekarang</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </a>
                <a href="/"
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-white text-base w-full sm:w-auto min-w-[200px] transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                  <span className="text-xl">🤖</span>
                  <span>Chat dengan RANIA</span>
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs">
                {["✅ Gratis Mendaftar", "⚡ Go Live 24 Jam", "🤖 AI-Powered", "📱 WhatsApp-First", "🌍 Jangkau 10K+ Traveler"].map(b => (
                  <span key={b} className="px-3 py-1.5 rounded-full font-bold text-gray-300" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-4 py-6 mt-10 text-center">
        <div className="text-xs text-gray-600">© 2026 LU SANIMAR Travel · <span className="text-cyan-400/60">RANIA Marketplace</span></div>
      </footer>
    </div>
  );
}
