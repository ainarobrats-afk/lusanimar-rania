import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useLocation } from "wouter";

interface ChatFloatProps {
  alwaysOpen?: boolean;
}

const ChatFloat = ({ alwaysOpen = false }: ChatFloatProps) => {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [messages, setMessages] = useState([
    { id: 1, text: t("ola_maun") + "! " + t("welcome_rania"), isUser: false },
    { id: 2, text: t("ask_anything"), isUser: false },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSwitchButton, setShowSwitchButton] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const sessionIdRef = useRef<string>(
    localStorage.getItem("rania_session_id") || `sess-${Date.now().toString(36)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save session ID to localStorage
  useEffect(() => {
    localStorage.setItem("rania_session_id", sessionIdRef.current);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check URL for auto-send from Market
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isTravel = params.get("chat") === "travel";
    const autoSend = params.get("auto_send") === "1";

    const pendingMsg = localStorage.getItem("pesan_dari_market");
    if (pendingMsg) {
      setIsOpen(true);
      localStorage.removeItem("pesan_dari_market");

      // Add user message
      const userMsg = { id: Date.now(), text: pendingMsg, isUser: true };
      setMessages((prev) => [...prev, userMsg]);

      // Auto-send to API if requested
      if (autoSend || isTravel) {
        sendToApi(pendingMsg);
      }

      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Send message to API
  const sendToApi = async (text: string) => {
    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionIdRef.current,
        },
        body: JSON.stringify({
          pesan: text,
          tipe_chat: "travel",
          session_id: sessionIdRef.current,
        }),
      });
      const data = await response.json();

      if (data.action === "SWITCH_TO_MARKET") {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: data.jawaban || data.reply, isUser: false },
        ]);
        setShowSwitchButton(true);
        setPendingMessage(data.teks_otomatis || text);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: data.jawaban || data.reply || "Ola! Ha'u simu ita-nia mensajen.", isUser: false },
        ]);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.", isUser: false },
      ]);
    }
    setIsTyping(false);
  };

  const handleSwitchToMarket = () => {
    localStorage.setItem("pesan_dari_travel", pendingMessage);
    navigate("/sanimar-market");
  };

  // Helper functions for user memory
  const saveUserMemory = (key: string, value: string) => {
    try {
      const existingMemory = JSON.parse(localStorage.getItem("rania_user_memory") || "{}");
      existingMemory[key] = value;
      localStorage.setItem("rania_user_memory", JSON.stringify(existingMemory));
    } catch (e) {
      console.error("Failed to save user memory:", e);
    }
  };

  const getUserMemory = (key: string) => {
    try {
      const memory = JSON.parse(localStorage.getItem("rania_user_memory") || "{}");
      return memory[key];
    } catch (e) {
      return null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMessage = { id: Date.now(), text: inputText, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText("");
    setShowSwitchButton(false);

    // Save travel preferences to memory for cross-sell
    const lowerInput = currentInput.toLowerCase();
    if (lowerInput.includes("bali") || lowerInput.includes("denpasar")) {
      saveUserMemory("suka_bali", "true");
    }
    if (lowerInput.includes("hotel")) {
      saveUserMemory("cari_hotel", "true");
    }

    await sendToApi(currentInput);
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-full bg-gradient-to-r from-blue-600 to-amber-600 text-white font-bold shadow-lg shadow-blue-500/40"
      >
        <MessageSquare size={24} />
        <span className="hidden sm:inline">{t("ai_assistant")}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl shadow-blue-900/30 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-blue-600 to-amber-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{t("ai_assistant")}</h3>
                  <p className="text-xs opacity-80">{t("ola_maun")}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                <X size={20} />
              </Button>
            </div>

            <div className="p-4 h-96 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.isUser ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      msg.isUser 
                        ? "flex-row-reverse" 
                        : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-700">
                      {msg.isUser ? <User size={16} className="text-slate-300" /> : <Bot size={16} className="text-blue-300" />}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.isUser
                          ? "bg-gradient-to-r from-blue-600 to-amber-600 text-white"
                          : "bg-slate-800 text-slate-200 border border-slate-700/50"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-700">
                      <Bot size={16} className="text-blue-300" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-200 border border-slate-700/50">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {showSwitchButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={handleSwitchToMarket}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-xl shadow-orange-500/30 px-6 py-3 text-base"
                    size="lg"
                  >
                    <ShoppingCart size={20} className="mr-2" />
                    🛒 Pindah ke RANIA Market
                  </Button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800/50">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Hakarak mensajen..."
                  className="bg-slate-900 border-slate-700/50 focus-visible:ring-blue-500/30"
                />
                <Button onClick={handleSend} className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500">
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatFloat;
