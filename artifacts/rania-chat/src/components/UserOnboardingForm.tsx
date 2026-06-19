import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail } from "lucide-react";

interface UserOnboardingFormProps {
  onComplete: (name: string, email: string) => void;
  lang: string;
}

const UserOnboardingForm: React.FC<UserOnboardingFormProps> = ({ onComplete, lang }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onComplete(name.trim(), email.trim());
    }, 500);
  };

  const l = {
    title: lang === "id" ? "Selamat Datang di RANIA!" : "Welcome to RANIA!",
    subtitle: lang === "id" ? "Sebelum memulai, silakan perkenalkan diri Anda" : "Before we start, please introduce yourself",
    nameLabel: lang === "id" ? "Nama Anda" : "Your Name",
    emailLabel: lang === "id" ? "Email Anda" : "Your Email",
    submit: lang === "id" ? "Lanjutkan" : "Continue"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl"
    >
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{l.title}</h2>
          <p className="text-sm text-slate-400">{l.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
              <User size={16} className="text-orange-400" />
              {l.nameLabel}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "id" ? "Masukkan nama Anda" : "Enter your name"}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Mail size={16} className="text-orange-400" />
              {l.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={lang === "id" ? "Masukkan email Anda" : "Enter your email"}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              l.submit
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default UserOnboardingForm;
