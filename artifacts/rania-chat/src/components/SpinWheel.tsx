/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SPIN_SECTORS } from "../data";
import { X, Trophy, Coins } from "lucide-react";

interface SpinWheelProps {
  onClose: () => void;
  onWinAmount: (amount: number) => void;
  onEmitCoin: (x: number, y: number) => void;
}

export default function SpinWheel({ onClose, onWinAmount, onEmitCoin }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prizeResult, setPrizeResult] = useState<string | null>(null);

  const startSpin = (e: React.MouseEvent) => {
    if (spinning) return;

    // Trigger coin emit relative to tap
    onEmitCoin(e.clientX, e.clientY);

    setSpinning(true);
    setPrizeResult(null);

    // Pick a random sector
    const sectorCount = SPIN_SECTORS.length;
    const winningIndex = Math.floor(Math.random() * sectorCount);
    
    // Calculate final rotation (aiming for 5 complete rotations + customized center angle)
    const extraRotations = 5 * 360; 
    const sectorAngle = 360 / sectorCount;
    
    // We target the center of the sector slice
    const targetAngle = 360 - (winningIndex * sectorAngle) - (sectorAngle / 2);
    const finalRotation = rotation - (rotation % 360) + extraRotations + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      const wonSector = SPIN_SECTORS[winningIndex];
      
      if (wonSector.value > 0) {
        setPrizeResult(`Selamat! Kamu mendapatkan Saldo ${wonSector.label}`);
        onWinAmount(wonSector.value);
        
        // Trigger some continuous coins
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            onEmitCoin(window.innerWidth / 2, window.innerHeight / 2 - 50);
          }, i * 150);
        }
      } else {
        setPrizeResult("Yaa, hampir saja! Coba lagi besok ya.");
      }
    }, 3600); // Equal-paced wait with css transition
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm bg-[#111827] border border-slate-800 rounded-2xl p-6 relative overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute top decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F5A623] to-[#E63946]" />

        {/* Header close */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-1.5">
            <Trophy className="text-[#F5A623]" size={18} /> Daily Spin Sanimar
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
          Putar roda keberuntungan setiap 24 jam sekali secara GRATIS! Hadiah saldo langsung otomatis masuk ke Sanimar Wallet kamu.
        </p>

        {/* Wheel container */}
        <div className="flex flex-col items-center gap-6 pb-2">
          
          <div className="relative w-56 h-56">
            
            {/* Top Pointer */}
            <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-[#F5A623] z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />

            {/* Wheel SVG content */}
            <svg 
              className="w-full h-full select-none pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: "transform 3.5s cubic-bezier(0.1, 0.8, 0.1, 1)"
              }}
              viewBox="0 0 200 200"
            >
              {SPIN_SECTORS.map((sector, idx) => {
                const totalSectors = SPIN_SECTORS.length;
                const angle = 360 / totalSectors;
                const startAngle = idx * angle;
                const endAngle = startAngle + angle;
                
                // SVG arc coordinate functions
                const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                  return {
                    x: centerX + radius * Math.cos(angleInRadians),
                    y: centerY + radius * Math.sin(angleInRadians)
                  };
                };

                const startCoord = polarToCartesian(100, 100, 95, startAngle);
                const endCoord = polarToCartesian(100, 100, 95, endAngle);
                const largeArcFlag = angle <= 180 ? 0 : 1;
                
                // Text label translation
                const textAngle = startAngle + angle / 2;
                const radians = ((textAngle - 90) * Math.PI) / 180;
                const textRadius = 60;
                const textX = 100 + textRadius * Math.cos(radians);
                const textY = 100 + textRadius * Math.sin(radians);

                return (
                  <g key={idx}>
                    <path
                      d={`M 100 100 L ${startCoord.x} ${startCoord.y} A 95 95 0 ${largeArcFlag} 1 ${endCoord.x} ${endCoord.y} Z`}
                      fill={sector.color}
                      stroke="#222"
                      strokeWidth="1.2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill={idx === 1 ? "#aaa" : "#fff"}
                      fontSize="7"
                      fontWeight="700"
                      textAnchor="middle"
                      transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                    >
                      {sector.label}
                    </text>
                  </g>
                );
              })}
              {/* Inner ring helper */}
              <circle cx="100" cy="100" r="10" fill="#222" stroke="#444" strokeWidth="1" />
            </svg>

            {/* Inner Interactive Press Center */}
            <button
              onClick={startSpin}
              disabled={spinning}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#1F2937] hover:bg-slate-800 border-2 border-[#F5A623] flex items-center justify-center font-display font-black text-xs text-[#F5A623] hover:text-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all z-20 cursor-pointer disabled:opacity-80 active:scale-95"
            >
              {spinning ? "🎡" : "SPIN"}
            </button>
          </div>

          {/* Results announcement overlay */}
          <div className="min-h-12 mt-2 w-full flex items-center justify-center">
            {prizeResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center animate-slide-up">
                <p className="text-sm font-semibold text-white flex items-center justify-center gap-1.5">
                  <Coins className="text-[#2BD366]" size={16} /> {prizeResult}
                </p>
              </div>
            ) : spinning ? (
              <p className="text-xs text-[#F5A623] animate-pulse">Memutar keberuntungan...</p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">Tekan tombol SPIN di tengah roda!</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
