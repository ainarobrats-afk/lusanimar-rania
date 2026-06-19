import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home,
  Video,
  PlusCircle,
  MessageSquare,
  User,
  Sparkles
} from 'lucide-react';

const MarketTabBar = () => {
  const [location] = useLocation();

  const tabs = [
    { path: '/', label: 'Beranda', icon: <Home size={24} /> },
    { path: '/reels', label: 'Reels', icon: <Video size={24} /> },
    { path: '/sanimar-market/jual', label: 'Jual', icon: <PlusCircle size={32} />, isCenter: true },
    { path: '/sanimar-market', label: 'Market', icon: <MessageSquare size={24} /> },
    { path: '/profile', label: 'Saya', icon: <User size={24} /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 py-3 pb-5">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 ${tab.isCenter ? 'transform -translate-y-3' : ''}`}
          >
            <div
              className={`flex items-center justify-center ${
                tab.isCenter
                  ? 'w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 shadow-xl shadow-orange-500/40'
                  : location === tab.path
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.isCenter ? (
                <Sparkles size={30} className="text-white" />
              ) : (
                tab.icon
              )}
            </div>
            <span
              className={`text-xs font-semibold ${
                location === tab.path ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MarketTabBar;