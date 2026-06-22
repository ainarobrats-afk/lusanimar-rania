/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Story, Comment, CommissionItem } from "./types";

export const CATEGORIES = [
  { id: "all", label: "Semua", icon: "🌐" },
  { id: "property", label: "Rumah & Tanah", icon: "🏠" },
  { id: "vehicle", label: "Otomotif", icon: "🏍️" },
  { id: "job", label: "Pekerjaan", icon: "💼" },
  { id: "local", label: "Produk Lokal", icon: "🇹🇱" },
  { id: "tech", label: "Elektronik", icon: "📱" },
  { id: "food", label: "Bahan Pangan", icon: "🍲" },
  { id: "jastip", label: "Jastip Travel", icon: "🚌" },
  { id: "other", label: "Lainnya", icon: "⚙️" },
];

export const MOCK_PRODUCTS: Product[] = [
  // 1. Properties
  {
    id: "p1",
    title: "Rumah Minimalis Modern 2 Lantai - Pantai Kelapa, Dili",
    price: 49500,
    category: "property",
    location: "Dili (Pantai Kelapa)",
    badges: ["verified"],
    sellerName: "Manuel De Jesus",
    rating: 4.9,
    description:
      "Rumah eksklusif dekat lantai pantai Kelapa dengan 3 kamar tidur, 2 kamar mandi, garasi luas, dan akses cepat ke pusat kota Dili. Surat-surat tanah bersertifikat lengkap.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80",
    expiryDays: 28,
  },
  {
    id: "p8",
    title: "Tanah Murah Strategis 500m² Siap Bangun",
    price: 12000,
    category: "property",
    location: "Liquica (Bazartete)",
    badges: ["verified"],
    sellerName: "Carlos Alkatiri",
    rating: 4.6,
    description:
      "Sebidang tanah datar siap bangun dengan pemandangan pegunungan dan laut Liquica yang eksotis. Akses jalan aspal, listrik, dan air bersih sudah tersedia.",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=500&q=80",
    expiryDays: 45,
  },
  // 2. Vehicles
  {
    id: "p2",
    title: "Honda Scoopy 2022 - Mesin Mulus Kelistrikan Oke",
    price: 1350,
    category: "vehicle",
    location: "Dili (Comoro)",
    badges: ["verified"],
    sellerName: "Lidia Soares",
    rating: 4.8,
    description:
      "Scoopy warna hitam-merah terawat, kilometer rendah (14,000km). Pajak hidup, plat nomor Dili, siap pakai harian.",
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80",
    expiryDays: 15,
  },
  {
    id: "p9",
    title: "Toyota Hilux Double Cab 4x4 Diesel Bekas Proyek",
    price: 16800,
    category: "vehicle",
    location: "Baucau",
    badges: ["verified"],
    sellerName: "Roberto Pinto",
    rating: 4.4,
    description:
      "Hilux tahun 2018 warna putih tangguh. Sangat cocok untuk medan terjal pegunungan Timor-Leste. Mesin sehat bertenaga, AC dingin, semua sistem 4WD aktif.",
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80",
    expiryDays: 32,
  },
  // 3. Locals (Made in Timor-Leste)
  {
    id: "p3",
    title: "Tais Original Handwoven Premium - Motif Ermera",
    price: 75,
    category: "local",
    location: "Ermera",
    badges: ["local"],
    sellerName: "Tais Weaving Coop",
    rating: 5.0,
    description:
      "Tais tenun tradisional buatan tangan pengrajin Ermera. Menggunakan pewarna alami kunyit dan indigo. Sangat cocok untuk acara adat maupun hiasan dinding.",
    image:
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=500&q=80",
    expiryDays: 30,
  },
  {
    id: "p4",
    title: "Kopi Arabika Organik Ermera - Roast Beans 500g",
    price: 12,
    category: "local",
    location: "Ermera (Gleno)",
    badges: ["local"],
    sellerName: "Koperativa Kafé Timor",
    rating: 4.9,
    description:
      "Biji kopi pilihan kualitas ekspor dari pegunungan Ermera. Ditanam secara organik di ketinggian 1200+ mdpl. Rasa fruity dengan body seimbang. Freshly roasted.",
    image:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80",
    expiryDays: 45,
  },
  {
    id: "p7",
    title: "Madu Hutan Liar Murni Baucau - Botol 600ml",
    price: 18,
    category: "local",
    location: "Baucau",
    badges: ["local"],
    sellerName: "Madu Alam Baucau",
    rating: 4.9,
    description:
      "Madu murni diperoleh langsung dari pemburu madu hutan liar di tebing-tebing Baucau. Manis alami dan kaya akan nutrisi untuk stamina tubuh.",
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80",
    expiryDays: 20,
  },
  // 4. Jobs
  {
    id: "p5",
    title: "Lowongan Pekerjaan: Staff Administrasi Kantor Dili",
    price: 320,
    category: "job",
    location: "Dili (Colmera)",
    badges: ["verified"],
    sellerName: "Sari Food Import",
    rating: 4.5,
    description:
      "Dibutuhkan tenaga admin untuk mengurus dokumen logistik, menguasai Excel, Bahasa Tetun & Indonesia. Gaji pokok $320 + bonus kinerja mingguan.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80",
    expiryDays: 14,
  },
  {
    id: "job_sopir",
    title: "Sopir Truk & Logistik Dili",
    price: 350,
    category: "job",
    location: "Dili (Comoro)",
    badges: ["verified"],
    sellerName: "Trans-Timor Logistics",
    rating: 4.8,
    description:
      "Dibutuhkan supir truk pengiriman logistik antar-kabupaten. SIM Timor-Leste aktif, sehat jasmani, jujur dan tepat waktu.",
    image:
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=500&q=80",
    expiryDays: 30,
  },
  {
    id: "job_toko",
    title: "Penjaga Toko Sembako Kelapa",
    price: 250,
    category: "job",
    location: "Dili (Pantai Kelapa)",
    badges: ["verified"],
    sellerName: "Toko Sembako Kmanek",
    rating: 4.7,
    description:
      "Dibutuhkan pramuniaga/penjaga toko sembako harian. Ramah, teliti mengurus kasir, dan senang melayani pelanggan.",
    image:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=500&q=80",
    expiryDays: 15,
  },
  {
    id: "job_kebun",
    title: "Pengelola Kebun Organik Baucau",
    price: 200,
    category: "job",
    location: "Baucau",
    badges: ["local"],
    sellerName: "Kmanek Farm Coop",
    rating: 4.9,
    description:
      "Dibutuhkan pengelola kebun hortikultura organik. Memiliki minat di bidang pertanian perkotaan, menyukai tanaman hidroponik dan organik.",
    image:
      "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=500&q=80",
    expiryDays: 25,
  },
  // 5. Jastip Kupang
  {
    id: "p6",
    title: "Jastip Air Fryer Philips HD9200 dari Kupang",
    price: 58,
    category: "jastip",
    location: "Kupang - Dili",
    badges: ["jastip"],
    sellerName: "Yansen Jastip Bus",
    rating: 4.7,
    description:
      "Titipan Air Fryer Philips HD9200 original dari Kupang. Estimasi 2 hari sampai di Dili via Bus Travel Kupang-Dili. Aman dan bergaransi.",
    image:
      "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=500&q=80",
    expiryDays: 7,
  },
  {
    id: "p10",
    title: "Jastip Satu Dus Indomie Goreng Indonesia (Isi 40)",
    price: 15,
    category: "jastip",
    location: "Kupang - Dili",
    badges: ["jastip"],
    sellerName: "Lia Grosir Kupang",
    rating: 4.9,
    description:
      "Indomie Goreng khas Indonesia satu dus utuh. Dibungkus karton tebal, dititipkan via supir armada Bus Travel Kupang-Dili. Pengambilan di Terminal Dili.",
    image:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80",
    expiryDays: 3,
  },
  // 6. Indonesia Shipped
  {
    id: "p11",
    title: "Kemeja Batik Katun Tradisional Solo Premium",
    price: 24,
    category: "other",
    location: "Kirim dari Surakarta, ID",
    badges: ["ship"],
    sellerName: "Batik Solo Outlet",
    rating: 4.7,
    description:
      "Batik tulis katun halus khas Surakarta, warna tahan lama, adem dipakai. Pengiriman reguler 5-7 hari kerja langsung ke alamat Anda di Timor-Leste.",
    image:
      "https://images.unsplash.com/photo-1598411037746-22ded41af9b2?auto=format&fit=crop&w=500&q=80",
    expiryDays: 19,
  },
  {
    id: "p12",
    title: "Panci Set Teflon Anti Lengket 5 Pcs Maxim",
    price: 36,
    category: "tech",
    location: "Kirim dari Surabaya, ID",
    badges: ["ship"],
    sellerName: "Maxim Surabaya Official",
    rating: 4.5,
    description:
      "Satu set panci Maxim anti lengket isi 5 pcs. Cocok untuk kebutuhan rumah tangga baru. Dikemas bubble wrap ekstra tebal dan dus tegar.",
    image:
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=500&q=80",
    expiryDays: 11,
  },
  // 7. China
  {
    id: "p13",
    title: "Smartwatch Xiaomi Redmi Band 2 Global Version",
    price: 29,
    category: "tech",
    location: "Kirim dari Shenzhen, CN",
    badges: ["china", "ship"],
    sellerName: "Global Tech Direct",
    rating: 4.8,
    description:
      "Xiaomi Redmi Band 2 layar berwarna, sensor detak jantung 24/7, tahan air 5ATM, baterai awet 14 hari. Dikirim langsung dari China via kargo penerbangan.",
    image:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=500&q=80",
    expiryDays: 30,
  },
];

export const MOCK_STORIES: Story[] = [
  {
    id: "s1",
    name: "Petani Kopi",
    avatar: "☕",
    image:
      "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=500&q=80",
    live: true,
    seen: false,
    productCTA: {
      productId: "p4",
      title: "Kopi Arabika Organik Ermera",
      price: 12,
    },
  },
  {
    id: "s2",
    name: "Tais Tenun",
    avatar: "🧣",
    image:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=500&q=80",
    seen: false,
    productCTA: {
      productId: "p3",
      title: "Tais Original Handwoven",
      price: 75,
    },
  },
  {
    id: "s3",
    name: "Bus Kupang",
    avatar: "🚌",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500&q=80",
    seen: false,
    productCTA: {
      productId: "p10",
      title: "Indomie Goreng Indonesia",
      price: 15,
    },
  },
  {
    id: "s4",
    name: "Manuel D.",
    avatar: "🏠",
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=500&q=80",
    seen: true,
    productCTA: {
      productId: "p1",
      title: "Rumah Modern Pantai Kelapa",
      price: 49500,
    },
  },
  {
    id: "s5",
    name: "Madu Jin",
    avatar: "🍯",
    image:
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=500&q=80",
    seen: true,
    productCTA: {
      productId: "p7",
      title: "Madu Hutan Liar Baucau",
      price: 18,
    },
  },
];

export const MOCK_REELS = [
  {
    id: "r1",
    title: "Bongkar madu hutan tebing tinggi Baucau!",
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80",
    price: "$18",
    productId: "p7",
    label: "Promo Sponsored",
  },
  {
    id: "r2",
    title: "Wisata Pantai Pasir Putih Dili",
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=300&q=80",
    price: "Wisata",
    productId: "p2",
    label: "Promo Sponsored",
  },
  {
    id: "r3",
    title: "Proses penenunan selendang Tais bermotif adat",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=300&q=80",
    price: "$75",
    productId: "p3",
    label: "Promo Sponsored",
  },
];

export const MOCK_COMMISSIONS: CommissionItem[] = [
  {
    id: "c1",
    icon: "💸",
    title: "Afiliasi Kopi Ermera (Ouvidio J.)",
    time: "Baru saja",
    amount: 1.2,
  },
  {
    id: "c2",
    icon: "📢",
    title: "Klik Sponsor Baner Otomotif",
    time: "2 menit lalu",
    amount: 0.05,
    isAd: true,
  },
  {
    id: "c3",
    icon: "👥",
    title: "Referral Berhasil: @isabel_dili",
    time: "1 jam lalu",
    amount: 0.5,
  },
  {
    id: "c4",
    icon: "💸",
    title: "Komisi Penjualan Madu Baucau",
    time: "5 jam lalu",
    amount: 1.8,
  },
  {
    id: "c5",
    icon: "📢",
    title: "Tonton Video Promosi Jastip Bus",
    time: "Yesterday",
    amount: 0.1,
    isAd: true,
  },
];

export const DEFAULT_COMMENTS: Comment[] = [
  {
    id: "comment1",
    name: "Ouvidio Guterres",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    text: "Barang sangat bagus dan asli! Saya sudah mampir ke Ermera kemarin, benang rajutan sangat rapat.",
    time: "2 jam lalu",
    likes: 4,
  },
  {
    id: "comment2",
    name: "Maria da Silva",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    text: "Bisa ditawar sampai $60 ka? Siap bayar COD di Dili Timor Plaza.",
    time: "5 jam lalu",
    likes: 2,
  },
];

export const SPIN_SECTORS = [
  { label: "$0.10", color: "#F5A623", value: 0.1 },
  { label: "Zonk 😢", color: "#1F2937", value: 0 },
  { label: "$1.00", color: "#22C55E", value: 1.0 },
  { label: "$0.05", color: "#3B82F6", value: 0.05 },
  { label: "$5.00 Jackpot!", color: "#E63946", value: 5.0 },
  { label: "$0.15", color: "#8B5CF6", value: 0.15 },
  { label: "$0.50", color: "#F5A623", value: 0.5 },
  { label: "$0.08", color: "#10B981", value: 0.08 },
];
