import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";

const GH = "https://raw.githubusercontent.com/ainarobrats-afk/SANIMAR-TRAVEL/main/Rania%20Ai/public";

// ─── Destination data ─────────────────────────────────────────────────────────
interface DestinationInfo {
  iata: string;
  city: string;
  country: string;
  flag: string;
  tagline: string;
  heroImage: string;
  heroGradient: string;
  description: string;
  bestMonths: string;
  visa: { passport: string; type: string; cost: string; duration: string; note: string }[];
  weather: { month: string; temp: string; rain: string; emoji: string }[];
  attractions: { name: string; desc: string; emoji: string; type: "must" | "hidden" | "food" | "activity" }[];
  hotels: { name: string; stars: number; area: string; price: string; tag: string }[];
  hiddenGems: { name: string; desc: string; emoji: string }[];
  transport: { name: string; desc: string; emoji: string }[];
  currency: string;
  timezone: string;
  language: string;
  tipOfDay: string;
}

const DESTINATIONS: Record<string, DestinationInfo> = {
  DPS: {
    iata: "DPS", city: "Bali", country: "Indonesia", flag: "🇮🇩",
    tagline: "Pulau Dewata — Surga Seni, Alam & Spiritual",
    heroImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80",
    heroGradient: "from-orange-600/70 via-pink-600/50 to-purple-900/80",
    description: "Bali adalah destinasi wisata Indonesia yang paling terkenal di dunia. Dikenal dengan pura Hindu yang indah, terraced rice fields Tegalalang, pantai kelas dunia, serta seni dan budaya yang kaya. Dari Dili hanya 2 jam terbang langsung!",
    bestMonths: "April – Oktober (musim kering, terbaik untuk pantai & outdoor)",
    visa: [
      { passport: "🇹🇱 Timor-Leste", type: "Visa on Arrival", cost: "USD 35", duration: "30 hari", note: "Bisa diperpanjang 30 hari lagi" },
      { passport: "🇮🇩 Indonesia", type: "Bebas Visa", cost: "Gratis", duration: "Tidak terbatas", note: "WNI tidak perlu visa" },
    ],
    weather: [
      { month: "Jan", temp: "28°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Feb", temp: "28°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Mar", temp: "28°C", rain: "💧💧", emoji: "🌦" },
      { month: "Apr", temp: "28°C", rain: "💧", emoji: "⛅" },
      { month: "Mei", temp: "27°C", rain: "💧", emoji: "☀️" },
      { month: "Jun", temp: "26°C", rain: "💧", emoji: "☀️" },
      { month: "Jul", temp: "26°C", rain: "", emoji: "☀️" },
      { month: "Agt", temp: "26°C", rain: "", emoji: "☀️" },
      { month: "Sep", temp: "27°C", rain: "💧", emoji: "⛅" },
      { month: "Okt", temp: "28°C", rain: "💧💧", emoji: "🌦" },
      { month: "Nov", temp: "28°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Des", temp: "28°C", rain: "💧💧💧", emoji: "🌧" },
    ],
    attractions: [
      { name: "Tanah Lot", desc: "Pura di atas batu karang tepi laut, sunset terbaik Bali", emoji: "🛕", type: "must" },
      { name: "Ubud Palace & Market", desc: "Pusat seni dan budaya Bali, pasar kerajinan tangan", emoji: "🎨", type: "must" },
      { name: "Tegalalang Rice Terrace", desc: "Terraced sawah Bali yang ikonik, foto-worthy!", emoji: "🌾", type: "must" },
      { name: "Seminyak Beach", desc: "Pantai premium dengan beach clubs, sunset cocktail", emoji: "🏖", type: "activity" },
      { name: "Tirta Empul Temple", desc: "Pura suci dengan kolam pemandian spiritual", emoji: "💧", type: "hidden" },
      { name: "Warung Babi Guling Bu Oka", desc: "Babi guling legendaris Ubud — Wajib coba!", emoji: "🍽", type: "food" },
      { name: "Nusa Penida", desc: "Pulau tersembunyi dengan Kelingking Beach & Broken Beach", emoji: "🏝", type: "hidden" },
      { name: "Mount Batur Sunrise Trek", desc: "Pendakian 4 jam, sunrise di puncak gunung berapi aktif", emoji: "🌋", type: "activity" },
    ],
    hotels: [
      { name: "Four Seasons Jimbaran", stars: 5, area: "Jimbaran", price: "$350+/malam", tag: "LUXURY" },
      { name: "Alaya Resort Ubud", stars: 4, area: "Ubud", price: "$120+/malam", tag: "PREMIUM" },
      { name: "Karma Kandara", stars: 5, area: "Nusa Dua", price: "$280+/malam", tag: "CLIFF RESORT" },
      { name: "Bisma Eight", stars: 4, area: "Ubud", price: "$80+/malam", tag: "JUNGLE VIEW" },
      { name: "Grand Hyatt Bali", stars: 5, area: "Nusa Dua", price: "$200+/malam", tag: "BEACH" },
      { name: "Kuta Beach Heritage", stars: 3, area: "Kuta", price: "$45+/malam", tag: "BUDGET" },
    ],
    hiddenGems: [
      { name: "Nusa Lembongan", desc: "Pulau kecil dengan ManGrove, snorkeling manta ray, lebih sepi dari Nusa Penida", emoji: "🐠" },
      { name: "Sidemen Valley", desc: "Desa pedesaan Bali yang autentik, pemandangan Gunung Agung, terhindar turis", emoji: "🏔" },
      { name: "Amed Beach", desc: "Spot snorkeling & diving WWII shipwreck USS Liberty, tenang & murah", emoji: "⚓" },
    ],
    transport: [
      { name: "Grab/Gojek", desc: "Ojek & taksi online, termurah & termudah", emoji: "🛵" },
      { name: "Sewa Motor", desc: "$5-8/hari, paling praktis keliling Bali", emoji: "🏍" },
      { name: "Sanimar Driver", desc: "Driver terpercaya SANIMAR Bali — hubungi via WhatsApp: +670 75143965", emoji: "🚗" },
    ],
    currency: "IDR (Rp) — $1 ≈ Rp 16,000",
    timezone: "WITA (UTC+8) — sama dengan Dili",
    language: "Bahasa Indonesia + Bali",
    tipOfDay: "💡 Selalu beli air minum botol tutup, jangan minum air keran di Bali!",
  },
  SIN: {
    iata: "SIN", city: "Singapore", country: "Singapore", flag: "🇸🇬",
    tagline: "Lion City — Asia's Global Hub",
    heroImage: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80",
    heroGradient: "from-red-600/70 via-white/10 to-blue-900/80",
    description: "Singapura adalah kota negara paling kosmopolitan di Asia. Bersih, aman, dan efisien. Hub penerbangan terbesar Asia Tenggara. Dari Dili, 1 stop via Bali dengan Singapore Airlines atau Scoot.",
    bestMonths: "Feb – April & Nov – Jan (lebih sedikit hujan)",
    visa: [
      { passport: "🇹🇱 Timor-Leste", type: "Visa Required", cost: "SGD 30-150", duration: "30 hari", note: "Apply di Kedutaan Singapura Dili atau online" },
      { passport: "🇮🇩 Indonesia", type: "30-day Visa Free", cost: "Gratis", duration: "30 hari", note: "Berlaku mulai 2024 untuk paspor Indonesia" },
    ],
    weather: [
      { month: "Jan", temp: "26°C", rain: "💧💧", emoji: "🌦" },
      { month: "Feb", temp: "27°C", rain: "💧", emoji: "⛅" },
      { month: "Mar", temp: "28°C", rain: "💧", emoji: "⛅" },
      { month: "Apr", temp: "28°C", rain: "💧💧", emoji: "🌦" },
      { month: "Mei", temp: "28°C", rain: "💧💧", emoji: "🌦" },
      { month: "Jun", temp: "28°C", rain: "💧", emoji: "⛅" },
      { month: "Jul", temp: "28°C", rain: "💧", emoji: "⛅" },
      { month: "Agt", temp: "28°C", rain: "💧", emoji: "⛅" },
      { month: "Sep", temp: "28°C", rain: "💧💧", emoji: "🌦" },
      { month: "Okt", temp: "27°C", rain: "💧💧", emoji: "🌦" },
      { month: "Nov", temp: "27°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Des", temp: "26°C", rain: "💧💧💧", emoji: "🌧" },
    ],
    attractions: [
      { name: "Marina Bay Sands", desc: "Ikon Singapura — infinity pool, casino, skypark", emoji: "🏢", type: "must" },
      { name: "Gardens by the Bay", desc: "Supertrees raksasa, indoor garden spektakuler", emoji: "🌳", type: "must" },
      { name: "Sentosa Island", desc: "Universal Studios, beach, cable car", emoji: "🎢", type: "activity" },
      { name: "Chinatown & Little India", desc: "Kuliner murah & otentik, belanja souvenir", emoji: "🍜", type: "food" },
      { name: "Changi Airport Jewel", desc: "Mall airport dengan air terjun indoor terbesar dunia", emoji: "💎", type: "must" },
      { name: "Hawker Centre", desc: "Maxwell Food Centre, Lau Pa Sat — makan murah kelas dunia", emoji: "🍛", type: "food" },
    ],
    hotels: [
      { name: "Marina Bay Sands", stars: 5, area: "Marina Bay", price: "$500+/malam", tag: "ICONIC" },
      { name: "Fullerton Hotel", stars: 5, area: "CBD", price: "$350+/malam", tag: "HERITAGE" },
      { name: "Capella Singapore", stars: 5, area: "Sentosa", price: "$600+/malam", tag: "RESORT" },
      { name: "Ibis Budget", stars: 2, area: "Various", price: "$80+/malam", tag: "BUDGET" },
      { name: "Hotel G Singapore", stars: 3, area: "Bugis", price: "$130+/malam", tag: "HIPSTER" },
    ],
    hiddenGems: [
      { name: "Haji Lane", desc: "Lorong bercorak warna-warni, cafe indie, street art — Instagram spot tersembunyi", emoji: "🎨" },
      { name: "Pulau Ubin", desc: "Pulau kecil di NE Singapore, suasana kampung 1960an, bersepeda di hutan", emoji: "🌴" },
      { name: "Tiong Bahru Estate", desc: "Kawasan art deco bersejarah, bakery lokal, kucing berkeliaran bebas", emoji: "🐱" },
    ],
    transport: [
      { name: "MRT", desc: "Kereta bawah tanah super efisien, $1-3 per perjalanan", emoji: "🚇" },
      { name: "Bus", desc: "EZ-Link card untuk bus & MRT, sangat murah", emoji: "🚌" },
      { name: "Grab", desc: "Grab tersedia di Singapura, sedikit lebih mahal dari MRT", emoji: "🚗" },
    ],
    currency: "SGD — $1 USD ≈ SGD 1.35",
    timezone: "SGT (UTC+8) — sama dengan Dili",
    language: "English, Mandarin, Malay, Tamil",
    tipOfDay: "💡 Beli EZ-Link card di bandara Changi saat tiba — hemat 30% vs bayar tunai di MRT!",
  },
  DRW: {
    iata: "DRW", city: "Darwin", country: "Australia", flag: "🇦🇺",
    tagline: "Northern Territory Gateway — Dekat & Eksotis",
    heroImage: "https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?w=1200&q=80",
    heroGradient: "from-red-700/70 via-orange-600/50 to-gray-900/80",
    description: "Darwin adalah kota Australia yang paling dekat dengan Dili — hanya 1,5 jam terbang langsung! Gateway ke Outback Australia, Kakadu National Park, dan budaya Aboriginal. Kota kosmopolitan kecil yang ramah.",
    bestMonths: "Mei – Oktober (musim kering, dry season — tidak ada crocodile di pantai)",
    visa: [
      { passport: "🇹🇱 Timor-Leste", type: "Tourist Visa (eVisitor)", cost: "AUD 20 (Biometric)", duration: "3 bulan (12 bulan multiple)", note: "Apply online di immi.homeaffairs.gov.au, 1-2 hari proses" },
      { passport: "🇮🇩 Indonesia", type: "Tourist Visa", cost: "AUD 20-190", duration: "Hingga 12 bulan", note: "eVisitor untuk paspor eligible, atau apply di Kedutaan" },
    ],
    weather: [
      { month: "Jan", temp: "33°C", rain: "💧💧💧", emoji: "⛈" },
      { month: "Feb", temp: "33°C", rain: "💧💧💧", emoji: "⛈" },
      { month: "Mar", temp: "33°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Apr", temp: "33°C", rain: "💧💧", emoji: "🌦" },
      { month: "Mei", temp: "31°C", rain: "💧", emoji: "⛅" },
      { month: "Jun", temp: "29°C", rain: "", emoji: "☀️" },
      { month: "Jul", temp: "29°C", rain: "", emoji: "☀️" },
      { month: "Agt", temp: "30°C", rain: "", emoji: "☀️" },
      { month: "Sep", temp: "32°C", rain: "💧", emoji: "⛅" },
      { month: "Okt", temp: "34°C", rain: "💧💧", emoji: "🌦" },
      { month: "Nov", temp: "34°C", rain: "💧💧💧", emoji: "⛈" },
      { month: "Des", temp: "33°C", rain: "💧💧💧", emoji: "⛈" },
    ],
    attractions: [
      { name: "Kakadu National Park", desc: "UNESCO World Heritage — Aboriginal rock art 20,000 tahun, buaya, air terjun", emoji: "🌿", type: "must" },
      { name: "Mindil Beach Sunset Market", desc: "Pasar sunset tiap Kamis/Minggu, kuliner Asia-Pasifik, live music", emoji: "🌅", type: "must" },
      { name: "Litchfield National Park", desc: "Waterfalls, natural swimming holes — 1,5 jam dari Darwin", emoji: "💦", type: "activity" },
      { name: "Darwin Waterfront", desc: "Wave pool, restaurants, lagoon swimming", emoji: "🏊", type: "activity" },
      { name: "Crocodylus Park", desc: "Lihat saltwater crocodile raksasa dari dekat!", emoji: "🐊", type: "activity" },
    ],
    hotels: [
      { name: "SKYCITY Darwin", stars: 5, area: "Darwin CBD", price: "$250+/malam", tag: "RESORT CASINO" },
      { name: "DoubleTree Hilton Darwin", stars: 5, area: "Esplanade", price: "$200+/malam", tag: "WATERFRONT" },
      { name: "Sage Hotel Darwin", stars: 4, area: "CBD", price: "$140+/malam", tag: "MODERN" },
      { name: "YHA Darwin", stars: 2, area: "CBD", price: "$40+/malam", tag: "BUDGET/BACKPACKER" },
    ],
    hiddenGems: [
      { name: "Berry Springs Nature Park", desc: "Swimming hole dengan pohon paperbark, cocok untuk piknik keluarga, gratis", emoji: "🌊" },
      { name: "Batchelor Town", desc: "Gateway ke Litchfield, warung lokal, atmosfer outback Australia", emoji: "🏜" },
      { name: "East Point Reserve", desc: "Sunset terbaik Darwin, WWII gun emplacements, wallabies liar saat senja", emoji: "🦘" },
    ],
    transport: [
      { name: "Rental Car", desc: "Wajib punya mobil di Darwin — $50-80/hari dari bandara", emoji: "🚗" },
      { name: "Bus Darwin", desc: "Rute terbatas, $2 flat fee, cocok untuk dalam kota", emoji: "🚌" },
    ],
    currency: "AUD — $1 USD ≈ AUD 1.55",
    timezone: "ACST (UTC+9:30) — 1 jam lebih dari Dili",
    language: "English",
    tipOfDay: "💡 JANGAN berenang di pantai alam Darwin! Ada saltwater crocodile. Renang hanya di area resmi (Wave Pool, lagoon).",
  },
  NRT: {
    iata: "NRT", city: "Tokyo", country: "Japan", flag: "🇯🇵",
    tagline: "Tokyo — Kota Masa Depan yang Memukau",
    heroImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
    heroGradient: "from-red-700/70 via-pink-500/40 to-indigo-900/80",
    description: "Tokyo adalah salah satu kota paling menakjubkan di dunia — teknologi futuristik berpadu budaya tradisional. Sushi terbaik, anime, kuil Shinto, pohon sakura, dan fashion terdepan. Dari Dili via Singapura atau Qatar Airways.",
    bestMonths: "Maret – Mei (sakura!) atau September – November (foliage musim gugur)",
    visa: [
      { passport: "🇹🇱 Timor-Leste", type: "Tourist Visa", cost: "Gratis (waiver)", duration: "15-90 hari", note: "Sejak 2023, Timor-Leste masuk daftar visa waiver Jepang! Cek di website Kedutaan Jepang Dili." },
      { passport: "🇮🇩 Indonesia", type: "Visa Free (2023)", cost: "Gratis", duration: "30 hari", note: "Indonesia masuk program bebas visa Jepang mulai 2023" },
    ],
    weather: [
      { month: "Jan", temp: "6°C", rain: "💧", emoji: "❄️" },
      { month: "Feb", temp: "7°C", rain: "💧", emoji: "❄️" },
      { month: "Mar", temp: "11°C", rain: "💧💧", emoji: "🌸" },
      { month: "Apr", temp: "16°C", rain: "💧💧", emoji: "🌸" },
      { month: "Mei", temp: "21°C", rain: "💧💧", emoji: "⛅" },
      { month: "Jun", temp: "24°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Jul", temp: "28°C", rain: "💧💧", emoji: "☀️" },
      { month: "Agt", temp: "29°C", rain: "💧💧", emoji: "☀️" },
      { month: "Sep", temp: "24°C", rain: "💧💧💧", emoji: "🌦" },
      { month: "Okt", temp: "18°C", rain: "💧💧", emoji: "🍁" },
      { month: "Nov", temp: "12°C", rain: "💧", emoji: "🍂" },
      { month: "Des", temp: "8°C", rain: "💧", emoji: "❄️" },
    ],
    attractions: [
      { name: "Shibuya Crossing", desc: "Persimpangan paling ramai di dunia — wajib foto!", emoji: "🚦", type: "must" },
      { name: "Senso-ji Temple Asakusa", desc: "Kuil Buddha tertua Tokyo, pasar suvenir tradisional", emoji: "⛩", type: "must" },
      { name: "Harajuku Takeshita Street", desc: "Fashion street unik Jepang, crepes, Harajuku style", emoji: "👘", type: "activity" },
      { name: "Tsukiji Outer Market", desc: "Pasar ikan terbesar — sushi & sashimi paling segar!", emoji: "🐟", type: "food" },
      { name: "Shinjuku Gyoen", desc: "Taman nasional indah, sakura bulan Maret-April", emoji: "🌸", type: "must" },
      { name: "Akihabara", desc: "Surga teknologi, anime, manga, game — electronic district", emoji: "🤖", type: "activity" },
    ],
    hotels: [
      { name: "The Peninsula Tokyo", stars: 5, area: "Marunouchi", price: "$700+/malam", tag: "ULTRA LUXURY" },
      { name: "Park Hyatt Tokyo", stars: 5, area: "Shinjuku", price: "$550+/malam", tag: "LOST IN TRANSLATION" },
      { name: "Dormy Inn", stars: 3, area: "Shibuya/Shinjuku", price: "$80+/malam", tag: "BEST VALUE" },
      { name: "Tokyo Central Youth Hostel", stars: 1, area: "Iidabashi", price: "$30+/malam", tag: "BUDGET" },
    ],
    hiddenGems: [
      { name: "Yanaka District", desc: "Neighbourhood Tokyo zaman Edo yang terpelihara, kuil, kucing, toko tradisional", emoji: "🐱" },
      { name: "Shimokitazawa", desc: "Bohemian neighborhood — live music, vintage shops, indie cafes", emoji: "🎸" },
      { name: "Odaiba at Night", desc: "Artificial island dengan Rainbow Bridge, life-size Gundam, futuristic vibes", emoji: "🌉" },
    ],
    transport: [
      { name: "IC Card (Suica/Pasmo)", desc: "Isi di vending machine bandara — bisa pakai di semua MRT, bus, convenience store!", emoji: "🚇" },
      { name: "JR Pass", desc: "Worth it kalau keliling Jepang (Tokyo-Kyoto-Osaka) — $200-300, beli sebelum berangkat", emoji: "🚅" },
    ],
    currency: "JPY (¥) — $1 USD ≈ ¥155",
    timezone: "JST (UTC+9) — 1 jam lebih dari Dili",
    language: "Japanese (sedikit English di tourist area)",
    tipOfDay: "💡 Bawa uang tunai! Banyak tempat di Jepang TIDAK terima kartu kredit, terutama warung lokal.",
  },
  KOE: {
    iata: "KOE", city: "Kupang", country: "Indonesia (NTT)", flag: "🇮🇩",
    tagline: "Kupang — Saudara NTT yang Satu Rasa",
    heroImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    heroGradient: "from-green-700/70 via-teal-600/50 to-blue-900/80",
    description: "Kupang adalah ibu kota NTT (Nusa Tenggara Timur), kota saudara Dili yang berbagi budaya, bahasa Tetun, dan adat istiadat yang sama. Hanya 2 jam dari Dili via darat atau 45 menit terbang. Gateway ke keajaiban NTT.",
    bestMonths: "Mei – Oktober (musim kering)",
    visa: [
      { passport: "🇹🇱 Timor-Leste", type: "Visa on Arrival (Border)", cost: "USD 30 atau Rp 500.000", duration: "30 hari", note: "Bisa masuk via darat di Motain/Mota'ain border crossing" },
      { passport: "🇮🇩 Indonesia", type: "Bebas Visa", cost: "Gratis", duration: "Tidak terbatas", note: "WNI bebas tanpa visa" },
    ],
    weather: [
      { month: "Jan", temp: "31°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Feb", temp: "30°C", rain: "💧💧💧", emoji: "🌧" },
      { month: "Mar", temp: "30°C", rain: "💧💧", emoji: "🌦" },
      { month: "Apr", temp: "31°C", rain: "💧", emoji: "⛅" },
      { month: "Mei", temp: "30°C", rain: "", emoji: "☀️" },
      { month: "Jun", temp: "28°C", rain: "", emoji: "☀️" },
      { month: "Jul", temp: "27°C", rain: "", emoji: "☀️" },
      { month: "Agt", temp: "27°C", rain: "", emoji: "☀️" },
      { month: "Sep", temp: "29°C", rain: "💧", emoji: "⛅" },
      { month: "Okt", temp: "31°C", rain: "💧💧", emoji: "🌦" },
      { month: "Nov", temp: "31°C", rain: "💧💧", emoji: "🌦" },
      { month: "Des", temp: "31°C", rain: "💧💧💧", emoji: "🌧" },
    ],
    attractions: [
      { name: "Lasiana Beach", desc: "Pantai ikonik Kupang, sunset indah, pohon lontar berjajar", emoji: "🌅", type: "must" },
      { name: "Pantai Namosain", desc: "Kawasan nelayan tradisional, pasar ikan segar pagi hari", emoji: "🐟", type: "activity" },
      { name: "Pulau Semau", desc: "Pulau kecil di Teluk Kupang, snorkeling, pasir putih, sepi", emoji: "🏝", type: "hidden" },
      { name: "Museum NTT", desc: "Koleksi tenun ikat NTT dari semua pulau, artefak budaya", emoji: "🏛", type: "activity" },
      { name: "Pasar Oeba & Inpres", desc: "Pasar tradisional Kupang — sirih pinang, jagung bose, ayam taliwang", emoji: "🛒", type: "food" },
    ],
    hotels: [
      { name: "Swiss-Belhotel Kupang", stars: 4, area: "Pantai Kupang", price: "$80+/malam", tag: "BEST" },
      { name: "Aston Kupang", stars: 4, area: "Kota", price: "$70+/malam", tag: "MODERN" },
      { name: "Hotel Kristal", stars: 3, area: "Pusat Kota", price: "$40+/malam", tag: "LOCAL FAV" },
      { name: "Guest House Lokal", stars: 2, area: "Berbagai area", price: "$15+/malam", tag: "BUDGET" },
    ],
    hiddenGems: [
      { name: "Pantai Tablolong", desc: "40km dari Kupang, pantai tersembunyi dengan ombak besar untuk surfing", emoji: "🏄" },
      { name: "Bukit Fatukoa", desc: "Bukit dengan pemandangan panorama Kota Kupang dan laut, sunrise/sunset", emoji: "⛰" },
      { name: "Desa Oesao", desc: "Desa Timor tradisional, tenun ikat langsung dari pengrajin, harga pabrik", emoji: "🧵" },
    ],
    transport: [
      { name: "Ojek/Bentor", desc: "Bentor (becak motor) = transport khas Kupang, Rp 5.000-20.000", emoji: "🛺" },
      { name: "Rental Motor/Mobil", desc: "Motor Rp 75.000/hari, mobil Rp 300.000/hari + driver", emoji: "🚗" },
    ],
    currency: "IDR (Rp) — $1 USD ≈ Rp 16,000",
    timezone: "WITA (UTC+8) — sama dengan Dili",
    language: "Bahasa Indonesia + Bahasa Kupang (Melayu Kupang) + Tetun di perbatasan",
    tipOfDay: "💡 Orang Kupang sangat ramah ke warga Timor-Leste — kita satu keluarga besar! Bicara aja pakai campur Tetun-Indonesia, mereka pasti paham!",
  },
  LBJ: {
    iata: "LBJ", city: "Labuan Bajo", country: "Indonesia (Flores)", flag: "🇮🇩",
    tagline: "Labuan Bajo — Surganya Dunia di Timur Indonesia",
    heroImage: "https://images.unsplash.com/photo-1570880127439-79e00dd9e3b1?w=1200&q=80",
    heroGradient: "from-teal-700/70 via-blue-600/50 to-purple-900/80",
    description: "Labuan Bajo adalah salah satu destinasi wisata premium Indonesia. Gerbang menuju Pulau Komodo dan Komodo dragon asli, pink beach, diving kelas dunia, serta sunset paling indah di Indonesia Timur.",
    bestMonths: "Mei – September (musim kering — terbaik untuk diving dan island hopping)",
    visa: [
      { passport: "🇹🇱 Timor-Leste", type: "Visa on Arrival", cost: "USD 35", duration: "30 hari", note: "Tersedia di Bandara Komodo LBJ" },
      { passport: "🇮🇩 Indonesia", type: "Bebas Visa", cost: "Gratis", duration: "Tidak terbatas", note: "" },
    ],
    weather: [
      { month: "Jan", temp: "29°C", rain: "💧💧", emoji: "🌦" },
      { month: "Feb", temp: "29°C", rain: "💧💧", emoji: "🌦" },
      { month: "Mar", temp: "29°C", rain: "💧💧", emoji: "🌦" },
      { month: "Apr", temp: "29°C", rain: "💧", emoji: "⛅" },
      { month: "Mei", temp: "29°C", rain: "", emoji: "☀️" },
      { month: "Jun", temp: "28°C", rain: "", emoji: "☀️" },
      { month: "Jul", temp: "27°C", rain: "", emoji: "☀️" },
      { month: "Agt", temp: "27°C", rain: "", emoji: "☀️" },
      { month: "Sep", temp: "28°C", rain: "", emoji: "☀️" },
      { month: "Okt", temp: "29°C", rain: "💧", emoji: "⛅" },
      { month: "Nov", temp: "29°C", rain: "💧💧", emoji: "🌦" },
      { month: "Des", temp: "29°C", rain: "💧💧", emoji: "🌦" },
    ],
    attractions: [
      { name: "Komodo Island", desc: "Lihat Komodo dragon liar! Trekking dengan ranger di habitat aslinya", emoji: "🦎", type: "must" },
      { name: "Pink Beach (Pantai Merah)", desc: "Salah satu dari 7 pink beach di dunia! Snorkeling coral warna-warni", emoji: "🏖", type: "must" },
      { name: "Manta Point", desc: "Renang dengan manta ray raksasa di spot diving legendaris", emoji: "🐠", type: "activity" },
      { name: "Padar Island Viewpoint", desc: "Pendakian 30 menit, pemandangan 3 teluk — foto paling ikonik NTT", emoji: "⛰", type: "must" },
      { name: "Sunset Cruise Labuan Bajo", desc: "Boat trip sunset di antara pulau-pulau eksotis", emoji: "🌅", type: "activity" },
    ],
    hotels: [
      { name: "Ayana Komodo Resort", stars: 5, area: "Waecicu Beach", price: "$300+/malam", tag: "ULTRA LUXURY" },
      { name: "La Cecile Hotel", stars: 4, area: "Labuan Bajo Town", price: "$120+/malam", tag: "OCEAN VIEW" },
      { name: "Green Hill Hotel", stars: 3, area: "Kota", price: "$50+/malam", tag: "VALUE" },
      { name: "Bajo Guest House", stars: 2, area: "Kota", price: "$20+/malam", tag: "BUDGET" },
    ],
    hiddenGems: [
      { name: "Kanawa Island", desc: "Pulau kecil tenang di sekitar Labuan Bajo, snorkeling bagus, cottage sederhana", emoji: "🐡" },
      { name: "Kalong Island (Bat Island)", desc: "Sore hari, ribuan kelelawar besar terbang dari pulau — fenomena alam menakjubkan", emoji: "🦇" },
      { name: "Rangko Cave", desc: "Gua dengan kolam air laut berwarna biru kristal di dalamnya — hidden wonder!", emoji: "💎" },
    ],
    transport: [
      { name: "Boat Charter", desc: "Sewa perahu untuk island hopping $80-200/hari, bisa patungan rombongan", emoji: "⛵" },
      { name: "Ojek Kota", desc: "Rp 10.000-30.000 untuk perjalanan dalam kota Labuan Bajo", emoji: "🛵" },
    ],
    currency: "IDR (Rp) — $1 USD ≈ Rp 16,000",
    timezone: "WITA (UTC+8) — sama dengan Dili",
    language: "Bahasa Indonesia + Manggarai (bahasa lokal Flores)",
    tipOfDay: "💡 Booking trip Komodo jauh-jauh hari, terutama Juli-Agustus! Tempat cepat penuh dan harga naik 2x di peak season.",
  },
};

// Add more destinations with basic data for others
const BASIC_DESTINATIONS: Record<string, Partial<DestinationInfo>> = {
  SYD: { city: "Sydney", country: "Australia", flag: "🇦🇺", tagline: "Sydney — Opera House & Harbour Bridge", heroGradient: "from-blue-700/70 via-cyan-500/40 to-gray-900/80", heroImage: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80" },
  KUL: { city: "Kuala Lumpur", country: "Malaysia", flag: "🇲🇾", tagline: "KL — Menara Petronas & Kuliner Halal", heroGradient: "from-blue-700/70 via-indigo-500/40 to-gray-900/80", heroImage: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80" },
  BKK: { city: "Bangkok", country: "Thailand", flag: "🇹🇭", tagline: "Bangkok — Street Food Capital of the World", heroGradient: "from-yellow-700/70 via-red-500/40 to-gray-900/80", heroImage: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80" },
};

export default function DestinationDetail() {
  const [, params] = useRoute("/destination/:iata");
  const [, navigate] = useLocation();
  const iata = (params?.iata || "DPS").toUpperCase();
  const dest = DESTINATIONS[iata];
  const basicDest = BASIC_DESTINATIONS[iata];
  const [activeTab, setActiveTab] = useState<"overview" | "visa" | "weather" | "hotels" | "gems">("overview");
  const [lang] = useState<"id" | "en" | "tet">("id");

  useEffect(() => { window.scrollTo(0, 0); }, [iata]);

  if (!dest && !basicDest) {
    return (
      <div className="min-h-screen bg-[#04091a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✈️</div>
          <div className="text-white font-bold text-xl mb-2">Destinasi {iata} belum tersedia</div>
          <p className="text-gray-400 text-sm mb-6">RANIA sedang menyiapkan info lengkap untuk destinasi ini.</p>
          <button onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)" }}>
            ← Kembali ke RANIA
          </button>
        </div>
      </div>
    );
  }

  const info = dest || ({ ...basicDest, iata, description: `Destinasi ${basicDest?.city}, ${basicDest?.country}.`, bestMonths: "Hubungi RANIA untuk info terbaik.", visa: [], weather: [], attractions: [], hotels: [], hiddenGems: [], transport: [], currency: "Hubungi RANIA", timezone: "Hubungi RANIA", language: "Hubungi RANIA", tipOfDay: "💡 Tanya RANIA untuk tips perjalanan ke destinasi ini!" } as DestinationInfo);

  const TABS = [
    { id: "overview", label: "Overview", emoji: "🌍" },
    { id: "visa", label: "Visa", emoji: "📋" },
    { id: "weather", label: "Cuaca", emoji: "🌤" },
    { id: "hotels", label: "Hotel", emoji: "🏨" },
    { id: "gems", label: "Hidden Gems", emoji: "💎" },
  ] as const;

  const typeColors: Record<string, string> = {
    must: "#f97316", hidden: "#a855f7", food: "#22c55e", activity: "#06b6d4",
  };
  const typeLabels: Record<string, string> = {
    must: "WAJIB", hidden: "HIDDEN GEM", food: "KULINER", activity: "AKTIVITAS",
  };

  const bookFlightUrl = `/?search=DIL-${iata}`;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#04091a 0%,#0a0f2e 50%,#04091a 100%)", fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>

      {/* Hero */}
      <div className="relative h-[55vw] max-h-[500px] min-h-[280px] overflow-hidden">
        <img src={info.heroImage} alt={info.city} className="w-full h-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${info.heroGradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04091a] via-transparent to-transparent" />

        {/* Back button */}
        <button onClick={() => navigate("/")}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white/90 hover:text-white transition-all backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)" }}>
          ← RANIA
        </button>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{info.flag}</span>
            <span className="text-sm font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-lg">{iata}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-1" style={{ fontFamily: "'Orbitron','sans-serif'" }}>
            {info.city}
          </h1>
          <p className="text-white/70 text-sm md:text-base font-medium mb-4">{info.tagline}</p>

          {/* Book now CTA */}
          <div className="flex flex-wrap gap-3">
            <a href={bookFlightUrl}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-black text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 24px rgba(249,115,22,0.5)" }}>
              ✈️ Cari Tiket ke {info.city}
            </a>
            <a href="/?chat=open"
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 backdrop-blur-md"
              style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
              🤖 Tanya RANIA
            </a>
          </div>
        </div>
      </div>

      {/* Tip of the day */}
      <div className="px-4 md:px-10 pt-4">
        <div className="rounded-xl px-4 py-3 text-sm text-amber-300 font-medium"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
          {info.tipOfDay}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-10 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeTab === t.id ? "text-black" : "text-gray-400 hover:text-white"}`}
              style={activeTab === t.id ? { background: "linear-gradient(135deg,#00e5ff,#a855f7)" } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-10 mt-6 pb-20">

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Description + quick facts */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <h2 className="text-white font-black text-lg mb-3">Tentang {info.city}</h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{info.description}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-300"><span>🗓</span><span>Terbaik: {info.bestMonths}</span></div>
                  <div className="flex items-center gap-1.5 text-purple-300"><span>💱</span><span>{info.currency}</span></div>
                  <div className="flex items-center gap-1.5 text-emerald-300"><span>🕐</span><span>{info.timezone}</span></div>
                  <div className="flex items-center gap-1.5 text-orange-300"><span>🗣</span><span>{info.language}</span></div>
                </div>
              </div>
              <div className="rounded-2xl p-5"
                style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <h3 className="text-orange-400 font-black text-sm mb-3">✈️ Penerbangan dari DIL</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between"><span>Rute</span><span className="text-white font-bold">DIL → {iata}</span></div>
                  <div className="border-t border-white/5 pt-2">
                    <a href={bookFlightUrl}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-black text-sm mt-2 transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                      Cari Tiket Sekarang
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Attractions */}
            {info.attractions && info.attractions.length > 0 && (
              <div>
                <h2 className="text-white font-black text-lg mb-3">🎯 Tempat Wajib Dikunjungi</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {info.attractions.map((a, i) => (
                    <div key={i} className="rounded-xl p-4 hover:scale-[1.02] transition-all cursor-default"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl">{a.emoji}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-black"
                          style={{ background: typeColors[a.type] }}>
                          {typeLabels[a.type]}
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm mb-1">{a.name}</div>
                      <div className="text-[11px] text-gray-400">{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transport */}
            {info.transport && info.transport.length > 0 && (
              <div>
                <h2 className="text-white font-black text-lg mb-3">🚗 Transportasi Lokal</h2>
                <div className="flex flex-wrap gap-3">
                  {info.transport.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-4 flex-1 min-w-[200px]"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                      <div>
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-[11px] text-gray-400">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visa */}
        {activeTab === "visa" && (
          <div className="space-y-4">
            <h2 className="text-white font-black text-xl mb-1">📋 Informasi Visa ke {info.city}</h2>
            <p className="text-gray-400 text-sm mb-4">Info visa berdasarkan kewarganegaraan. Selalu cek ke kedutaan terkait untuk info terbaru.</p>
            {info.visa && info.visa.length > 0 ? (
              <div className="space-y-3">
                {info.visa.map((v, i) => (
                  <div key={i} className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-lg font-bold text-white">{v.passport}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-black"
                        style={{ background: v.type.includes("Free") || v.type.includes("Bebas") ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.2)", color: v.type.includes("Free") || v.type.includes("Bebas") ? "#4ade80" : "#fb923c", border: `1px solid ${v.type.includes("Free") || v.type.includes("Bebas") ? "rgba(34,197,94,0.3)" : "rgba(249,115,22,0.3)"}` }}>
                        {v.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div><div className="text-[10px] text-gray-500 uppercase mb-0.5">Biaya</div><div className="text-white font-bold text-sm">{v.cost}</div></div>
                      <div><div className="text-[10px] text-gray-500 uppercase mb-0.5">Durasi</div><div className="text-white font-bold text-sm">{v.duration}</div></div>
                      {v.note && <div className="col-span-2 sm:col-span-1"><div className="text-[10px] text-gray-500 uppercase mb-0.5">Catatan</div><div className="text-cyan-300 text-xs">{v.note}</div></div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-gray-400 text-sm">Tanya RANIA untuk info visa terkini ke {info.city}</p>
                <a href="/?chat=open" className="inline-block mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)" }}>Tanya RANIA</a>
              </div>
            )}
          </div>
        )}

        {/* Weather */}
        {activeTab === "weather" && (
          <div>
            <h2 className="text-white font-black text-xl mb-1">🌤 Cuaca Bulanan — {info.city}</h2>
            <p className="text-gray-400 text-sm mb-6">Waktu terbaik berkunjung: <span className="text-cyan-300 font-bold">{info.bestMonths}</span></p>
            {info.weather && info.weather.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {info.weather.map((w, i) => (
                  <div key={i} className="rounded-xl p-3 text-center hover:scale-105 transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-xs font-black text-gray-400 mb-1">{w.month}</div>
                    <div className="text-2xl mb-1">{w.emoji}</div>
                    <div className="text-white font-bold text-sm">{w.temp}</div>
                    <div className="text-[10px] text-blue-400 mt-0.5">{w.rain || "Kering"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Tanya RANIA untuk info cuaca terkini</div>
            )}
          </div>
        )}

        {/* Hotels */}
        {activeTab === "hotels" && (
          <div>
            <h2 className="text-white font-black text-xl mb-1">🏨 Rekomendasi Hotel — {info.city}</h2>
            <p className="text-gray-400 text-sm mb-6">Pilihan hotel untuk semua budget. RANIA dapat bantu booking!</p>
            {info.hotels && info.hotels.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {info.hotels.map((h, i) => (
                  <div key={i} className="rounded-2xl p-5 hover:scale-[1.02] transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-black text-white text-sm">{h.name}</div>
                        <div className="text-yellow-400 text-xs">{"⭐".repeat(h.stars)}</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-black"
                        style={{ background: h.stars >= 5 ? "#f59e0b" : h.stars >= 4 ? "#8b5cf6" : h.stars >= 3 ? "#06b6d4" : "#6b7280" }}>
                        {h.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mb-2">📍 {h.area}</div>
                    <div className="text-lg font-black text-orange-400">{h.price}</div>
                    <a href={`/?chat=hotel+${info.city}+${h.name}`}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                      style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.2)" }}>
                      🤖 Tanya RANIA
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Tanya RANIA untuk rekomendasi hotel</div>
            )}
          </div>
        )}

        {/* Hidden Gems */}
        {activeTab === "gems" && (
          <div>
            <h2 className="text-white font-black text-xl mb-1">💎 Hidden Gems — {info.city}</h2>
            <p className="text-gray-400 text-sm mb-6">Tempat-tempat tersembunyi yang hanya RANIA tahu 🤫</p>
            {info.hiddenGems && info.hiddenGems.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {info.hiddenGems.map((g, i) => (
                  <div key={i} className="rounded-2xl p-5 hover:scale-[1.02] transition-all cursor-default"
                    style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <div className="text-3xl mb-3">{g.emoji}</div>
                    <div className="font-black text-white text-base mb-2">{g.name}</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Tanya RANIA untuk temukan hidden gems</div>
            )}

            {/* Ask RANIA CTA */}
            <div className="mt-8 rounded-2xl p-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.08), rgba(168,85,247,0.08))", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div className="text-3xl mb-2">🤖✨</div>
              <h3 className="text-white font-black text-lg mb-2">RANIA tahu lebih banyak hidden gems!</h3>
              <p className="text-gray-400 text-sm mb-4">Tanya RANIA untuk rekomendasi tempat tersembunyi, restoran lokal terbaik, dan itinerary personal.</p>
              <a href="/?chat=open"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-black text-black text-sm transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 20px rgba(168,85,247,0.4)" }}>
                Chat dengan RANIA →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        style={{ background: "linear-gradient(to top, rgba(4,9,26,1), transparent)" }}>
        <a href={bookFlightUrl}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-black text-base transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 8px 32px rgba(249,115,22,0.5)" }}>
          ✈️ Cari Tiket DIL → {iata} Sekarang
        </a>
      </div>
    </div>
  );
}
