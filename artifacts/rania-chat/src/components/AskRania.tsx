/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Message, Product } from "../types";
import { MOCK_PRODUCTS } from "../data";
import { Sparkles, Send, Bot, User, CornerDownRight } from "lucide-react";
import { LanguageCode } from "../i18n";

interface AskRaniaProps {
  lang: LanguageCode;
  onSelectProduct: (product: Product) => void;
  onEmitCoin: (x: number, y: number) => void;
}

const GREETINGS: Record<LanguageCode, string> = {
  tet: "Bondia / Botarde / Bonoite, Maun/Mana! Ha'u RANIA, bele ajuda Ita ho saida ohin loron?",
  id: "Selamat pagi/siang/sore, Bapak/Ibu! Saya RANIA, ada yang bisa saya bantu hari ini?",
  en: "Good morning/afternoon/evening! I'm RANIA, how may I assist you today?",
  pt: "Bom dia / Boa tarde / Boa noite! Ha'u RANIA, iha qué ha'u bele ajuda Ita ohin?"
};

const LABELS = {
  tet: {
    title: "Tanya RANIA",
    subtitle: "Peskiza intelijente ho asiste dezenvolvimentu lokál",
    recom: "Rekomendasaun ho kategoria lokál:",
    placeholder: "Ketik iha ne'e... (Koko: 'Rekomendasaun motór iha Dili')",
    searching: "nia hodi buka...",
    chips: [
      { text: "💡 Ideia Negósiu $3000", query: "Budget $3000 mau buka usaha apa di Timor-Leste?" },
      { text: "🇹🇱 Tais Tradisionál", query: "Cari Tais asli Timor tenun?" },
      { text: "💼 Lowongan Serbisu", query: "Adakah lowongan kerja gaji dolar?" },
      { text: "🚌 Dalan Jastip Travel", query: "Bagaimana cara jastip barang dari Kupang?" },
    ],
    errorMsg: "Deskulpa Maun/Mana, parseke rede iha problema uitoan. Favór koko fali!"
  },
  id: {
    title: "Tanya RANIA AI",
    subtitle: "Pencarian cerdas dan asisten bisnis lokal Timor-Leste",
    recom: "Rekomendasi Marketplace Valid untuk Anda:",
    placeholder: "Ketik disini... (Coba: 'Rekomendasi motor murah di Dili')",
    searching: "menjelajahi Sanimar...",
    chips: [
      { text: "💡 Ide Usaha $3000", query: "Budget $3000 mau buka usaha apa di Timor-Leste?" },
      { text: "🇹🇱 Tais Tenun Asli", query: "Cari Tais asli Timor tenun?" },
      { text: "💼 Lowongan Kerja", query: "Adakah lowongan kerja gaji dolar?" },
      { text: "🚌 Cara Jastip Travel", query: "Bagaimana cara jastip barang dari Kupang?" },
    ],
    errorMsg: "Maaf, sepertinya jaringan saya terputus sebentar. Tapi tenang, silakan coba lagi atau tanyakan hal lain seputar Sanimar!"
  },
  en: {
    title: "Ask RANIA AI",
    subtitle: "Smart search assistant and local Timor-Leste business guide",
    recom: "Valid recommendations matching your request:",
    placeholder: "Type here... (e.g. 'Cheap motor recommendations near Dili')",
    searching: "scanning Sanimar database...",
    chips: [
      { text: "💡 Business Ideas $3000", query: "What business can I start with a $3000 budget in Timor-Leste?" },
      { text: "🇹🇱 Authentic Tais Weaving", query: "Show me original handcrafted Tais?" },
      { text: "💼 Career Opportunities", query: "Are there any high-paying jobs in Dili?" },
      { text: "🚌 How to use Jastip", query: "How to ship packages from Kupang to Dili?" },
    ],
    errorMsg: "My apologies. The connection timed out. Please try sending your query once more!"
  },
  pt: {
    title: "Perguntar à RANIA",
    subtitle: "Pesquisa inteligente e consultoria empresarial local em Timor-Leste",
    recom: "Recomendações válidas de produtos adaptados para si:",
    placeholder: "Escreva aqui... (Ex: 'Recomendações de motas em Dili')",
    searching: "pesquisando o Mercado Sanimar...",
    chips: [
      { text: "💡 Ideias de Negócio $3000", query: "Que negócio iniciar com um orçamento de $3000 em Timor-Leste?" },
      { text: "🇹🇱 Tecelagem de Tais", query: "Quero ver tecelagem de tais tradicionais?" },
      { text: "💼 Ofertas de Emprego", query: "Há candidaturas para empregos em Dili?" },
      { text: "🚌 Como fazer Jastip", query: "Como importar mercadorias de Kupang para Dili?" },
    ],
    errorMsg: "Desculpe. A ligação falhou temporariamente. Por favor, tente de novo!"
  }
};

export default function AskRania({ lang, onSelectProduct, onEmitCoin }: AskRaniaProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: GREETINGS[lang]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update initial greeting when lang changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === "model") {
        return [{ role: "model", text: GREETINGS[lang] }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: "user", text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setRecommendedProducts([]);

    try {
      // Build conversation history (excluding introductory message)
      const history = messages.slice(1).map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await fetch("/api/rania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${textToSend} (Please reply in ${lang === "tet" ? "Tetun / casual Tetun-Indo" : lang === "id" ? "Indonesian" : lang === "pt" ? "Portuguese" : "English"})`,
          conversationHistory: history
        })
      });

      if (!res.ok) {
        throw new Error("Gagal terhubung dengan server");
      }

      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
      
      if (data.recommendedProductIds && Array.isArray(data.recommendedProductIds)) {
        const matching = MOCK_PRODUCTS.filter(p => data.recommendedProductIds.includes(p.id));
        setRecommendedProducts(matching);
        
        if (matching.length > 0) {
          triggerCoinReward();
        }
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: LABELS[lang].errorMsg
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const triggerCoinReward = () => {
    const raniaOrb = document.getElementById("rania-orb-element");
    if (raniaOrb) {
      const rect = raniaOrb.getBoundingClientRect();
      onEmitCoin(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  const handleQuickChip = (query: string, e: React.MouseEvent) => {
    onEmitCoin(e.clientX, e.clientY);
    handleSend(query);
  };

  const currentLabels = LABELS[lang];

  return (
    <>
      {/* 1. FLOATING LAUNCHER OR TOOLTIP DISPLAY */}
      <div className="fixed bottom-24 right-6 md:bottom-28 md:right-8 z-[200] pointer-events-none flex flex-col items-end gap-3 font-sans">
        {!isOpen && (
          <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 text-[10.5px] text-slate-200 px-3 py-2 rounded-xl shadow-lg animate-bounce mr-1 select-none flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span>
              {lang === "tet" ? "Hau RANIA AI iha ne'e! 💬" :
               lang === "id" ? "Ada RANIA AI disini! 💬" :
               lang === "pt" ? "Assistente RANIA AI! 💬" : "RANIA AI is here! 💬"}
            </span>
          </div>
        )}
      </div>

      {/* Floating Action Circular trigger button (Facebook position) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          // Emit dynamic coin reward trigger on toggle click
          onEmitCoin(window.innerWidth - 60, window.innerHeight - 60);
        }}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[210] w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-[0_6px_22px_rgba(59,130,246,0.55)] hover:shadow-[0_8px_26px_rgba(59,130,246,0.65)] hover:scale-105 active:scale-95 transition-all outline-none border-2 border-blue-450 overflow-hidden cursor-pointer"
        title="Tanya RANIA AI"
      >
        {isOpen ? (
          <span className="text-xl font-bold font-sans">✕</span>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src="/src/assets/images/rania_avatar_1782061622582.jpg" 
              alt="Rania Chat AI"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#111827] animate-ping" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#111827]" />
          </div>
        )}
      </button>

      {/* 2. EXPANDED FLOATING MESSAGE WINDOW CONTAINER (FB CHAT STYLE) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-8 z-[200] w-[350px] max-w-[calc(100vw-32px)] bg-[#111827]/95 backdrop-blur-xl border border-[rgba(59,130,246,0.3)] hover:border-[rgba(59,130,246,0.45)] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-fade-in font-sans">
          
          {/* Decorative radial background blur */}
          <div className="absolute top-[-30%] right-[-10%] w-56 h-56 rounded-full bg-radial from-[rgba(59,130,246,0.18)] to-transparent pointer-events-none" />

          {/* RANIA Header bar with status marker */}
          <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#111827] px-4 py-3.5 border-b border-slate-805/85 flex items-center justify-between select-none relative z-10">
            <div className="flex items-center gap-2.5">
              <div 
                id="rania-orb-element"
                className="w-8 h-8 rounded-full border border-blue-400 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.4)] bg-slate-950"
              >
                <img 
                  src="/src/assets/images/rania_avatar_1782061622582.jpg" 
                  alt="RANIA AI" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xs text-white flex items-center gap-1.5 leading-none">
                  {currentLabels.title}
                  <span className="text-[8.5px] bg-[#3B82F6] text-white px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wide">AI</span>
                </h3>
                <span className="text-[9.5px] text-slate-400 mt-1 block leading-none">{currentLabels.subtitle}</span>
              </div>
            </div>

            {/* Header collapse close control button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Chat scrolling log timeline viewport */}
          <div className="bg-[#0B0F1A]/75 px-4 py-3.5 h-[270px] overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 relative z-10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && (
                  <div className="w-5.5 h-5.5 rounded-full border border-blue-500/30 overflow-hidden shrink-0 mt-0.5 bg-slate-950">
                    <img 
                      src="/src/assets/images/rania_avatar_1782061622582.jpg" 
                      alt="RANIA" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#3B82F6] text-white rounded-tr-none shadow-[0_2px_8px_rgba(59,130,246,0.2)] font-medium"
                      : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
                {msg.role === "user" && (
                  <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#E63946] text-white flex items-center justify-center text-[9px] shrink-0 mt-0.5 shadow-md">
                    <User size={10} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-5.5 h-5.5 rounded-full border border-blue-500/30 overflow-hidden shrink-0 mt-0.5 bg-slate-950">
                  <img 
                    src="/src/assets/images/rania_avatar_1782061622582.jpg" 
                    alt="RANIA" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl rounded-tl-none px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <div className="w-1.2 h-1.2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-1.2 h-1.2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.2 h-1.2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 font-mono text-[9px]">{currentLabels.searching}</span>
                </div>
              </div>
            )}

            {/* Inline AI Recommended Product Cards inside Chat Box */}
            {recommendedProducts.length > 0 && (
              <div className="pt-2.5 border-t border-slate-900 space-y-2">
                <p className="text-[10px] text-[#F5A623] font-bold flex items-center gap-1 bg-[#F5A623]/10 pb-1 pt-0.5 px-2 rounded">
                  <CornerDownRight size={10} /> {currentLabels.recom}
                </p>
                <div className="space-y-1.5">
                  {recommendedProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onSelectProduct(p)}
                      className="flex gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-805 hover:border-slate-700/80 rounded-xl p-2 cursor-pointer transition-all duration-200"
                    >
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                      <div className="min-width-0 flex flex-col justify-center flex-1">
                        <h4 className="text-[11px] font-semibold text-slate-100 line-clamp-1 leading-normal">{p.title}</h4>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="text-[11px] font-bold text-[#F5A623] font-mono">$ {p.price.toLocaleString()}</span>
                          <span className="text-[8.5px] text-slate-500 bg-[#111827] px-1.5 py-0.5 rounded font-sans shrink-0">{p.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Interactive Chat Input & Suggestion Chips block */}
          <div className="p-3 bg-[#111827] border-t border-slate-805/80 relative z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2 relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentLabels.placeholder}
                className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-[#3B82F6] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center transition-all shadow-[0_3px_10px_rgba(59,130,246,0.3)] shrink-0 cursor-pointer disabled:opacity-50"
                disabled={loading || !input.trim()}
              >
                <Send size={13} />
              </button>
            </form>

            {/* Prompt Suggestion Quick Chips */}
            <div className="flex gap-1 mt-2.5 overflow-x-auto pb-0.5 scrollbar-none select-none">
              {currentLabels.chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={(e) => handleQuickChip(chip.query, e)}
                  className="text-[9px] bg-[#090D16] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </>
  );
}
