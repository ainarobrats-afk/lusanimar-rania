import React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/i18n/LanguageContext";
import { MessageSquare, Mail, MapPin, Phone, Globe, Plane, Building2, Car, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950/80 border-t border-white/10 mt-16 pt-16 pb-10 backdrop-blur-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <span className="text-2xl font-black text-white">S</span>
              </div>
              <div>
                <h3 className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">SANIMAR</h3>
                <p className="text-[11px] text-blue-300/90 font-bold tracking-[0.25em] uppercase">MARKETPLACE</p>
              </div>
            </Link>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              Sanimar Marketplace: destinasi utama Anda untuk perjalanan, hotel, transportasi, dan asuransi di Timor Leste dan sekitarnya.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Sparkles size={16} className="text-amber-300" />
              <span>Terpercaya oleh ribuan pengguna</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
              <Globe size={20} className="text-blue-400" />
              Navigasi Cepat
            </h4>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/" className="text-slate-400 hover:text-blue-300 transition-all duration-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-slate-400 hover:text-blue-300 transition-all duration-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  {t("explore")}
                </Link>
              </li>
              <li>
                <Link href="/sanimar-market" className="text-slate-400 hover:text-blue-300 transition-all duration-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  {t("market")}
                </Link>
              </li>
              <li>
                <Link href="/flight-routes" className="text-slate-400 hover:text-blue-300 transition-all duration-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  {t("routes")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
              <MessageSquare size={20} className="text-green-400" />
              {t("help")}
            </h4>
            <ul className="space-y-3 text-base">
              <li className="flex items-center gap-3 text-slate-400">
                <Phone size={18} className="text-green-400 flex-shrink-0" />
                <span>{t("contact_wa")}: +670 7XXX-XXXX</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail size={18} className="text-blue-400 flex-shrink-0" />
                <span>{t("contact_email")}: help@sanimar.tl</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <MapPin size={18} className="text-amber-400 flex-shrink-0" />
                <span>Dili, Timor Leste</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
              <Building2 size={20} className="text-amber-400" />
              Kategori
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Globe size={14} className="text-blue-400" />
                {t("tours")}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Plane size={14} className="text-blue-400" />
                {t("flights")}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Building2 size={14} className="text-blue-400" />
                {t("hotels")}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Car size={14} className="text-blue-400" />
                {t("transport")}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <ShieldCheck size={14} className="text-blue-400" />
                {t("insurance")}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CreditCard size={14} className="text-blue-400" />
                {t("visa")}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-slate-500 text-sm">
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
