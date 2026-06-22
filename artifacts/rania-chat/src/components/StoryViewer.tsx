/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Story, Product } from "../types";
import { MOCK_PRODUCTS } from "../data";
import { X, Send, ShoppingCart, VolumeX, Volume2 } from "lucide-react";

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export default function StoryViewer({ stories, initialIndex, onClose, onSelectProduct }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const activeStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle Story Auto-advance Timer (5 seconds)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(old => {
        if (old >= 100) {
          handleNext();
          return 0;
        }
        return old + 2; // Increments to reach 100 in 5s
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // Close if list exhausted
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTapZone = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const thirdOfWidth = rect.width / 3;

    if (clickX < thirdOfWidth) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const handleCtaClick = () => {
    if (activeStory.productCTA) {
      const match = MOCK_PRODUCTS.find(p => p.id === activeStory.productCTA?.productId);
      if (match) {
        onSelectProduct(match);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000000] z-[300] flex flex-col justify-between selection:bg-slate-700 animate-fade-in md:py-8">
      {/* Centered card frame for desktop, full-screen on mobile */}
      <div className="w-full max-w-md mx-auto h-full flex flex-col justify-between bg-[#0B0F1A] border-x border-slate-900/60 relative overflow-hidden md:rounded-2xl md:shadow-[0_0_100px_rgba(0,0,0,0.85)]">
        
        {/* Progress tracks header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 flex gap-1.5 bg-gradient-to-b from-[#000]/60 to-transparent pb-6">
          {stories.map((story, idx) => (
            <div key={story.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all ease-linear"
                style={{ 
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
                  transitionDuration: idx === currentIndex ? "100ms" : "0ms"
                }}
              />
            </div>
          ))}
        </div>

        {/* Story author block */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 py-2 flex items-center gap-3 text-white">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#E63946] p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-sm">
              {activeStory.avatar}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              {activeStory.name}
              {activeStory.live && (
                <span className="bg-[#E63946] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">LIVE</span>
              )}
            </h4>
            <p className="text-[10px] text-white/60">Aktif hari ini</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(prev => !prev)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Story Body & Click Interaction Zone */}
        <div 
          onClick={handleTapZone}
          className="flex-1 relative cursor-pointer flex items-center justify-center bg-black group select-none"
        >
          <img 
            src={activeStory.image} 
            alt="Story content" 
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Left/Right prompt cues showing on tap zone side on hover */}
          <div className="absolute inset-y-0 left-0 w-1/4" title="Tekan kiri untuk Sebelumnya" />
          <div className="absolute inset-y-0 right-0 w-1/4" title="Tekan kanan untuk Selanjutnya" />

          {/* Dynamic product badge overlay */}
          {activeStory.productCTA && (
            <div 
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering story change
                handleCtaClick();
              }}
              className="absolute bottom-20 left-4 right-4 bg-white/95 text-slate-900 rounded-xl p-3 flex items-center gap-3 shadow-[0_12px_24px_rgba(0,0,0,0.35)] animate-slide-up hover:bg-white transition-all cursor-pointer pointer-events-auto"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={18} />
              </div>
              <div className="min-width-0">
                <h5 className="text-[11px] text-slate-500 font-mono tracking-wide uppercase font-semibold">Lihat Dagangan</h5>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{activeStory.productCTA.title}</p>
              </div>
              <span className="ml-auto bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors select-none">
                Buy ${activeStory.productCTA.price}
              </span>
            </div>
          )}
        </div>

        {/* Story footer input */}
        <div className="p-4 bg-slate-950/95 border-t border-slate-900 flex gap-3 items-center">
          <input 
            type="text" 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Kirim pesan ke ${activeStory.name}...`} 
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-xs text-white placeholder-white/40 outline-none focus:border-white/20 transition-all font-body font-normal"
            onClick={(e) => e.stopPropagation()} // Stop modal close on clicking input
          />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setReplyText("");
              alert(`Pesan terkirim ke ${activeStory.name}!`);
            }}
            disabled={!replyText.trim()}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            <Send size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
