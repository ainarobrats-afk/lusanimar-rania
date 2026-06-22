import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, Image as ImageIcon, Video, MapPin, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Footer from "@/components/Layout/Footer";

const POSTS = [
  { id: "POST-001", author: "Maria Santos", avatar: "👩", time: "2 jam lalu", location: "Dili", content: "Rumah dijual di Dili Center. 3KT, 2KM, harga $45.000. Negosiasi serius!", image: "🏠", likes: 24, comments: 8, shares: 3, saved: false, liked: false, category: "property", verified: true },
  { id: "POST-002", author: "Joao Costa", avatar: "👨", time: "5 jam lalu", location: "Baucau", content: "Tukang bangunan profesional. Renovasi, konstruksi, plumbing. Pengalaman 10 tahun.", image: null, likes: 45, comments: 12, shares: 8, saved: false, liked: false, category: "services", verified: false },
  { id: "POST-003", author: "Ana Ribeiro", avatar: "👩‍🦰", time: "Kemarin", location: "Dili", content: "Lowongan! Hotel Darwin butuh receptionist. Gaji $400/bulan. Kirim CV ke hr@hoteldarwin.tl", image: null, likes: 89, comments: 34, shares: 45, saved: false, liked: false, category: "jobs", verified: true },
];

export default function SocialFeed() {
  const [posts, setPosts] = useState(POSTS);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-blue-950/10 text-slate-100">
      <div className="fixed inset-0 -z-20 bg-slate-950" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-[90px]" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/55 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/sanimar-market"><Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/10 font-semibold">← Market</Button></Link>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Social Feed</h1>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black">+ Post</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/40 to-blue-900/40 rounded-3xl border border-blue-400/20 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Community Feed</h2>
            <p className="text-xl text-blue-100">Berita terbaru dari komunitas SANIMAR</p>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-slate-800 border border-white/10">
                        <AvatarFallback className="text-2xl bg-slate-800">{post.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{post.author}</span>
                          {post.verified && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 border text-xs px-1.5 py-0.5">✓</Badge>}
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-2">
                          <span>{post.time}</span>
                          <span>•</span>
                          <MapPin size={12} /> {post.location}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-slate-400 hover:text-white"><MoreHorizontal size={20} /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-100 mb-4 leading-relaxed">{post.content}</p>
                  {post.image && (
                    <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-8xl mb-4 border border-white/5">
                      {post.image}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-300 capitalize">{post.category}</Badge>
                  </div>
                </CardContent>
                <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => toggleLike(post.id)} className={`gap-2 ${post.liked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}>
                    <Heart size={20} className={post.liked ? 'fill-red-400' : ''} /> {post.likes}
                  </Button>
                  <Button variant="ghost" className="text-slate-400 hover:text-blue-400 gap-2">
                    <MessageCircle size={20} /> {post.comments}
                  </Button>
                  <Button variant="ghost" className="text-slate-400 hover:text-green-400 gap-2">
                    <Share2 size={20} /> {post.shares}
                  </Button>
                  <Button variant="ghost" onClick={() => toggleSave(post.id)} className={`gap-2 ${post.saved ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}>
                    <Bookmark size={20} className={post.saved ? 'fill-amber-400' : ''} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}