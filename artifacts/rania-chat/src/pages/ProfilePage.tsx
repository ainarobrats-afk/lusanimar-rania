import React, { useState } from 'react';
import {
  User,
  Gift,
  Trophy,
  Star,
  Share2,
  MapPin,
  Calendar,
  Sparkles,
  Coins,
  Heart,
  MessageSquare,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MISI_DATA = [
  { id: '1', title: 'Buka App Hari Ini', points: 10, completed: true },
  { id: '2', title: 'Lihat 5 Iklan', points: 25, completed: true },
  { id: '3', title: 'Share ke Grup WA', points: 50, completed: false }
];

const SPIN_OPTIONS = [
  { id: '1', text: 'Zonk', icon: '😞', prize: null },
  { id: '2', text: '10 Poin', icon: '✨', prize: 'points' },
  { id: '3', text: '$0.5', icon: '💰', prize: 'cash' },
  { id: '4', text: 'Zonk', icon: '😢', prize: null },
  { id: '5', text: '10 Poin', icon: '✨', prize: 'points' },
  { id: '6', text: '$2', icon: '💎', prize: 'big' },
  { id: '7', text: 'Zonk', icon: '😐', prize: null },
  { id: '8', text: '10 Poin', icon: '✨', prize: 'points' }
];

const ProfilePage = () => {
  const [points, setPoints] = useState(247);
  const [spinUsed, setSpinUsed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState<string | null>(null);

  const handleSpin = () => {
    if (spinUsed) return;
    setSpinning(true);
    
    setTimeout(() => {
      const random = Math.floor(Math.random() * SPIN_OPTIONS.length);
      const result = SPIN_OPTIONS[random];
      setSpinning(false);
      setShowResult(result.text);
      
      if (result.prize === 'points') {
        setPoints(p => p + 10);
      } else if (result.prize === 'cash') {
        setPoints(p => p + 50);
      } else if (result.prize === 'big') {
        setPoints(p => p + 200);
      }
      
      setSpinUsed(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100 pb-32 pt-6">
      <div className="max-w-md mx-auto px-4">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-amber-600 rounded-full mx-auto mb-4 shadow-xl shadow-blue-500/30 flex items-center justify-center">
            <User size={60} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Maun Keren</h1>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-0 px-3 py-1 flex items-center gap-1">
              <Trophy size={14} />
              Duta Wisata Level 3
            </Badge>
          </div>
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1">
            <MapPin size={14} />
            Dili, Timor Leste
          </p>
        </div>

        {/* Points & Stats Card */}
        <Card className="bg-white/5 border-white/10 rounded-3xl mb-6 shadow-xl shadow-blue-900/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">{points}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Poin</p>
              </div>
              <div>
                <p className="text-2xl font-black bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">12</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Booking</p>
              </div>
              <div>
                <p className="text-2xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">5</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ulasan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spin Wheel */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-500/20 rounded-3xl mb-6 shadow-xl shadow-purple-900/20 overflow-hidden">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Gift size={20} className="text-amber-300" />
              Spin Wheel Hari Ini!
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-center mb-4">
              <div className="w-64 h-64 mx-auto bg-slate-900/80 rounded-full relative flex items-center justify-center border-4 border-purple-500/50 shadow-2xl shadow-purple-900/30">
                <div className={`w-56 h-56 rounded-full bg-gradient-to-br from-purple-700 to-blue-800 flex items-center justify-center transition-transform duration-3000 ${spinning ? 'animate-spin' : ''}`}>
                  {showResult ? (
                    <div className="text-center text-white">
                      <p className="text-4xl mb-2">🎊</p>
                      <p className="text-2xl font-black">{showResult}</p>
                    </div>
                  ) : (
                    <div className="text-center text-white">
                      <Sparkles size={40} className="mx-auto mb-2 text-amber-300" />
                      <p className="text-xl font-semibold">Klik Putar!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              className={`w-full h-14 text-lg font-black rounded-2xl shadow-lg ${
                spinUsed
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-500 hover:via-pink-500 hover:to-orange-500'
              }`}
              onClick={handleSpin}
              disabled={spinUsed}
            >
              {spinUsed ? 'Sudah Diputar Hari Ini' : 'Putar Sekarang! 🎯'}
            </Button>
          </CardContent>
        </Card>

        {/* Misi Mingguan */}
        <Card className="bg-white/5 border-white/10 rounded-3xl mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-300" />
              Misi Mingguan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {MISI_DATA.map((misi) => (
                <div
                  key={misi.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    misi.completed
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        misi.completed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {misi.completed ? <CheckCircle2 size={20} /> : <Star size={20} />}
                    </div>
                    <div>
                      <p className="text-slate-100 font-semibold">{misi.title}</p>
                      <p className="text-xs text-slate-400">+{misi.points} Poin</p>
                    </div>
                  </div>
                  {!misi.completed && (
                    <Button
                      variant="secondary"
                      className="h-10 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-200"
                    >
                      Kerjakan
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-16 bg-white/10 hover:bg-white/15 border border-white/10 text-white">
            <Heart size={20} className="mr-2" />
            Wishlist
          </Button>
          <Button variant="secondary" className="h-16 bg-white/10 hover:bg-white/15 border border-white/10 text-white">
            <MessageSquare size={20} className="mr-2" />
            Pesan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;