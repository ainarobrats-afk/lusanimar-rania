import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  MoreHorizontal,
  User,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Reel {
  id: string;
  user: { name: string; avatar: string; verified: boolean };
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  product: { name: string; price: string; link: string };
}

const REELS_DATA: Reel[] = [
  {
    id: '1',
    user: { name: 'Pak Anton', avatar: 'A', verified: true },
    videoUrl: '',
    caption: 'Liburan ke Atauro itu wajib! 🌴 Lihat viewnya bu! Paket tour murah di SANIMAR MARKET!',
    likes: 3421,
    comments: 128,
    product: { name: 'Paket Tour Atauro 3D2N', price: '$150', link: '/sanimar-market/product/1' }
  },
  {
    id: '2',
    user: { name: 'Dewi Travel', avatar: 'D', verified: true },
    videoUrl: '',
    caption: 'Hotel baru di Dili! Pemandangan laut pas banget! ✨',
    likes: 5120,
    comments: 234,
    product: { name: 'Hotel Seaside Dili', price: '$80/malam', link: '/sanimar-market/product/3' }
  },
  {
    id: '3',
    user: { name: 'Jaka Tour', avatar: 'J', verified: false },
    videoUrl: '',
    caption: 'Jaco Island surga tersembunyi di Timor! 🤩',
    likes: 8765,
    comments: 456,
    product: { name: 'Paket Jaco Island', price: '$200', link: '/sanimar-market/product/1' }
  }
];

const ReelsPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    const newLiked = new Set(liked);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLiked(newLiked);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-purple-900/20" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-10 px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-2xl bg-gradient-to-r from-blue-300 to-amber-300 bg-clip-text text-transparent">
            SANIMAR <span className="text-white/70">SHORTS</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" className="text-white">
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <span className="text-white font-semibold border-b-2 border-blue-400 pb-1">Beranda</span>
          <span className="text-slate-400 font-semibold pb-1">Mengikuti</span>
        </div>
      </div>

      {/* Reels Swiper (simulated) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full max-w-lg">
          {/* Current Reel */}
          <div className="relative w-full h-full flex flex-col">
            {/* Video Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-slate-950 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
                  <Sparkles size={40} className="text-white" />
                </div>
                <p className="text-white/80 text-lg font-semibold mb-2">Video RAMELAU {activeIndex + 1}</p>
                <p className="text-slate-400 text-sm">Swipe ke atas untuk selanjutnya!</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-20">
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col gap-1"
                onClick={() => toggleLike(REELS_DATA[activeIndex].id)}
              >
                <Heart
                  size={32}
                  fill={liked.has(REELS_DATA[activeIndex].id) ? 'currentColor' : 'none'}
                  className={liked.has(REELS_DATA[activeIndex].id) ? 'text-red-500' : 'text-white'}
                />
                <span className="text-white text-xs font-bold">
                  {formatNumber(REELS_DATA[activeIndex].likes)}
                </span>
              </Button>

              <Button variant="ghost" size="icon" className="flex flex-col gap-1">
                <MessageCircle size={32} className="text-white" />
                <span className="text-white text-xs font-bold">
                  {formatNumber(REELS_DATA[activeIndex].comments)}
                </span>
              </Button>

              <Button variant="ghost" size="icon" className="flex flex-col gap-1">
                <Share2 size={32} className="text-white" />
                <span className="text-white text-xs font-bold">Share</span>
              </Button>

              <div className="mt-4">
                <div className="w-12 h-12 rounded-2xl border-2 border-white overflow-hidden bg-gradient-to-br from-blue-500 to-amber-600 flex items-center justify-center">
                  <Music size={24} className="text-white" />
                </div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white">
                      {REELS_DATA[activeIndex].user.avatar}
                    </div>
                    <span className="text-white font-bold">
                      {REELS_DATA[activeIndex].user.name}
                    </span>
                    {REELS_DATA[activeIndex].user.verified && (
                      <Badge className="bg-blue-500 border-0 text-xs px-1 py-0">
                        ✓ Verified
                      </Badge>
                    )}
                    <Button
                      variant="secondary"
                      className="ml-2 h-8 px-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold"
                    >
                      Ikuti
                    </Button>
                  </div>
                  <p className="text-white text-sm mb-2 leading-relaxed">
                    {REELS_DATA[activeIndex].caption}
                  </p>
                  
                  {/* Product Booking Card */}
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-amber-600 rounded-full pl-3 pr-1 py-1 shadow-xl shadow-blue-500/30">
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/90 truncate">
                        {REELS_DATA[activeIndex].product.name}
                      </p>
                      <p className="text-sm font-black text-white">
                        {REELS_DATA[activeIndex].product.price}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-9 px-4 bg-white text-blue-900 font-black rounded-full hover:bg-white/90"
                    >
                      Booking Sekarang!
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe up indicator */}
      {activeIndex < REELS_DATA.length - 1 && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div className="text-white/60 flex flex-col items-center">
            <Sparkles size={18} className="mb-1" />
            <span className="text-xs font-semibold">Swipe Up</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelsPage;