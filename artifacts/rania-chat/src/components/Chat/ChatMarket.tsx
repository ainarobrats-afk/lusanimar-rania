// ============================================================================
// RANIA Market Chat — Sanimar Market Edition
// System Prompt: Asistente Inteligente Sales & Marketing husi LU SANIMAR MARKET
// ============================================================================

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Plane, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

interface ChatMarketProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

// ─── Memory helpers ───────────────────────────────────────────────────────────
const getUserMemory = (key: string): string | null => {
  try {
    const memory = JSON.parse(localStorage.getItem("rania_user_memory") || "{}");
    return memory[key] ?? null;
  } catch { return null; }
};

const saveUserMemory = (key: string, value: string) => {
  try {
    const m = JSON.parse(localStorage.getItem("rania_user_memory") || "{}");
    m[key] = value;
    localStorage.setItem("rania_user_memory", JSON.stringify(m));
  } catch { /* ignore */ }
};

// ─── Build initial greeting based on memory ──────────────────────────────────
const buildInitialMessages = () => {
  const msgs: Array<{ id: number; text: string; isUser: boolean }> = [
    {
      id: 1,
      text: "Ola Maun/Mana! 😊 Ha'u mak **RANIA**, Asistente Sales & Marketing husi **Sanimar Market**.\n\nBele ajuda ita ho:\n🛒 Jual barang / Fa'an barang\n💰 Cek harga pasaran\n📋 Sistem reseller & komisi\n📣 Bikin iklan promosi",
      isUser: false,
    },
  ];

  // Cross-sell hints from travel memory
  if (getUserMemory("jual_tour") === "true") {
    msgs.push({
      id: 2,
      text: "Ita iha interes kona-ba tour? 🌴 Sanimar Market iha kategori **Tour & Wisata** — bele lista ita nia pakote tour iha ne'e!",
      isUser: false,
    });
  }
  if (getUserMemory("suka_bali") === "true") {
    msgs.push({
      id: 3,
      text: "Ha'u hare ita gosta Bali! 🏝️ Iha vendor tour Bali iha Market ne'e — hakarak hare ka lista ita nia pakote?",
      isUser: false,
    });
  }

  return msgs;
};

// ─── Quick reply buttons ──────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: "🛒 Mau Jual", text: "Saya mau jual barang" },
  { label: "💰 Cek Harga", text: "Cek harga pasaran" },
  { label: "📋 Reseller", text: "Cara jadi reseller?" },
  { label: "📣 Bikin Iklan", text: "Bantu bikin iklan" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const ChatMarket: React.FC<ChatMarketProps> = ({
  isOpen: isOpenProp,
  onToggle,
  onClose,
}) => {
  const [, navigate] = useLocation();

  // Support both controlled (from parent) and uncontrolled (standalone) mode
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const handleToggle = onToggle ?? (() => setInternalOpen((v) => !v));
  const handleClose = onClose ?? (() => setInternalOpen(false));

  const [messages, setMessages] = useState(buildInitialMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSwitchBtn, setShowSwitchBtn] = useState(false);
  const [pendingMsg, setPendingMsg] = useState("");
  const [quickShown, setQuickShown] = useState(true);

  const sessionId = useRef<string>(
    localStorage.getItem("rania_session_id") || `sess-${Date.now().toString(36)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("rania_session_id", sessionId.current);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle message passed from Travel chat
  useEffect(() => {
    const fromTravel = localStorage.getItem("pesan_dari_travel");
    if (fromTravel && isOpen) {
      localStorage.removeItem("pesan_dari_travel");
      addUserMessage(fromTravel);
      sendToApi(fromTravel);
    }
  }, [isOpen]);

  // ─── API call ───────────────────────────────────────────────────────────────
  const sendToApi = async (text: string) => {
    setIsTyping(true);
    setShowSwitchBtn(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId.current,
        },
        body: JSON.stringify({
          pesan: text,
          tipe_chat: "market",
          session_id: sessionId.current,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.action === "SWITCH_TO_TRAVEL") {
        addBotMessage(data.jawaban || data.reply || "Ini soal penerbangan — biar RANIA Travel yang bantu ✈️");
        setShowSwitchBtn(true);
        setPendingMsg(data.teks_otomatis || text);
      } else {
        addBotMessage(data.jawaban || data.reply || "Ha'u simu ita nia mensajen! Saida mak ita hakarak?");
      }
    } catch {
      addBotMessage(localFallback(text));
    }
    setIsTyping(false);
  };

  // ─── Local fallback when API fails ──────────────────────────────────────────
  const localFallback = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes("jual") || t.includes("fa'an"))
      return "Siap bos! Kasih info ya: **1)** Barang apa? **2)** Kondisi? **3)** Harga? Nanti saya bantu bikin iklan menarik! 📸";
    if (t.includes("reseller") || t.includes("komisaun") || t.includes("komisi"))
      return "Untuk info sistem reseller & komisi, silakan hubungi tim kami via WhatsApp. Saya catat minat kamu ya! 📋";
    if (t.includes("harga") || t.includes("presu"))
      return "Untuk cek harga pasaran, berikan nama barang yang ingin dicek ya Bos! 💰";
    if (t.includes("iklan") || t.includes("anúnsiu"))
      return "Siap bantu bikin iklan! Kasih detail barang/jasa yang mau dipromosikan ya. 📣";
    return "Ola Maun! Ha'u mak RANIA husi Sanimar Market. Bele ajuda ita ho jual-beli, harga pasaran, reseller, ka bikin iklan. Saida mak ita hakarak? 😊";
  };

  // ─── Message helpers ─────────────────────────────────────────────────────────
  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), text, isUser: true }]);
  };
  const addBotMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now() + 1, text, isUser: false }]);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    setQuickShown(false);
    addUserMessage(text);

    // Save memory hints
    const t = text.toLowerCase();
    if (t.includes("tour") || t.includes("jual tour")) saveUserMemory("jual_tour", "true");
    if (t.includes("bali") || t.includes("denpasar")) saveUserMemory("suka_bali", "true");

    await sendToApi(text);
  };

  const handleQuick = (text: string) => {
    setInputText(text);
    setQuickShown(false);
    addUserMessage(text);
    sendToApi(text);
  };

  const handleSwitchToTravel = () => {
    localStorage.setItem("pesan_dari_market", pendingMsg);
    navigate("/?chat=travel&auto_send=1");
    handleClose();
  };

  // ─── Render message text (simple bold support) ───────────────────────────────
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <>
      {/* ── Floating trigger button (always visible when chat is closed) ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className="fixed bottom-24 right-5 z-[90] flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl shadow-orange-500/40 font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#f97316,#d97706)" }}
          >
            <MessageSquare size={20} />
            <span>Chat RANIA Market</span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-4 right-4 bottom-4 w-full sm:w-[420px] z-[100] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: "#060b18" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-4 shrink-0"
              style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-sm leading-tight">RANIA Market</p>
                  <p className="text-[11px] text-white/70">Sanimar Market · Sales & Marketing AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-green-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Online
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 rounded-full w-8 h-8"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 max-w-[88%] ${msg.isUser ? "flex-row-reverse" : ""}`}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: msg.isUser ? "#1e3a5f" : "#7c2d12" }}
                    >
                      {msg.isUser
                        ? <User size={14} className="text-blue-200" />
                        : <Bot size={14} className="text-orange-300" />
                      }
                    </div>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.isUser
                          ? "text-white"
                          : "text-slate-200 border border-white/8"
                      }`}
                      style={{
                        background: msg.isUser
                          ? "linear-gradient(135deg,#1d4ed8,#92400e)"
                          : "rgba(255,255,255,0.05)",
                      }}
                    >
                      {renderText(msg.text)}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-2 max-w-[88%]">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#7c2d12" }}>
                      <Bot size={14} className="text-orange-300" />
                    </div>
                    <div className="px-3.5 py-3 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="flex gap-1 items-center">
                        {[0, 150, 300].map((d) => (
                          <div key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Switch to Travel button */}
              {showSwitchBtn && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center py-1">
                  <Button
                    onClick={handleSwitchToTravel}
                    className="font-bold text-white rounded-2xl px-6 py-2.5 shadow-xl shadow-blue-500/30"
                    style={{ background: "linear-gradient(135deg,#2563eb,#d97706)" }}
                  >
                    <Plane size={18} className="mr-2" />
                    ✈️ Pindah ke RANIA Travel
                  </Button>
                </motion.div>
              )}

              {/* Quick replies — shown once at start */}
              {quickShown && messages.length <= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => handleQuick(q.text)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-500/40 text-orange-300 hover:bg-orange-500/15 transition-all"
                    >
                      {q.label}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/8 shrink-0" style={{ background: "#060b18" }}>
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Tulis pesan ke RANIA Market..."
                  className="flex-1 bg-white/5 border-white/10 text-slate-200 placeholder-slate-500 focus-visible:ring-orange-500/40 rounded-xl text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="rounded-xl shrink-0 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}
                >
                  <Send size={17} />
                </Button>
              </div>
              <p className="text-center text-[10px] text-slate-600 mt-2">
                Powered by RANIA AI · Sanimar Market
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatMarket;
