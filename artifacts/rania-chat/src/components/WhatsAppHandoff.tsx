import { useState } from "react";

interface WhatsAppHandoffProps {
  lang: "tet" | "id" | "en" | "pt";
  context?: {
    flightFrom?: string;
    flightTo?: string;
    flightAirline?: string;
    flightNum?: string;
    flightPrice?: number;
    bookingId?: string;
  };
  variant?: "inline" | "floating" | "banner";
}

const WA_NUMBER = "";

const LABELS = {
  tet: { text: "Lanjut via WhatsApp", hint: "Falar ho agente SANIMAR" },
  id: { text: "Lanjut via WhatsApp", hint: "Chat dengan agen SANIMAR" },
  en: { text: "Continue via WhatsApp", hint: "Chat with SANIMAR agent" },
  pt: { text: "Continuar via WhatsApp", hint: "Falar com agente SANIMAR" },
};

function buildWaMessage(lang: string, ctx?: WhatsAppHandoffProps["context"]): string {
  if (ctx?.bookingId) {
    return lang === "id"
      ? `Halo SANIMAR Travel, saya butuh bantuan untuk booking ${ctx.bookingId} (${ctx.flightFrom}→${ctx.flightTo})`
      : lang === "en"
      ? `Hi SANIMAR Travel, I need help with booking ${ctx.bookingId} (${ctx.flightFrom}→${ctx.flightTo})`
      : lang === "pt"
      ? `Olá SANIMAR Travel, preciso de ajuda com a reserva ${ctx.bookingId} (${ctx.flightFrom}→${ctx.flightTo})`
      : `Olá SANIMAR Travel, hau presiza ajuda ba booking ${ctx.bookingId} (${ctx.flightFrom}→${ctx.flightTo})`;
  }
  if (ctx?.flightFrom && ctx?.flightTo) {
    return lang === "id"
      ? `Halo SANIMAR Travel, saya mau tanya tentang penerbangan ${ctx.flightFrom}→${ctx.flightTo}${ctx.flightAirline ? ` (${ctx.flightAirline})` : ""}. Bisa bantu saya?`
      : lang === "en"
      ? `Hi SANIMAR Travel, I'd like to inquire about flights ${ctx.flightFrom}→${ctx.flightTo}${ctx.flightAirline ? ` (${ctx.flightAirline})` : ""}. Can you help me?`
      : lang === "pt"
      ? `Olá SANIMAR Travel, gostaria de saber sobre voos ${ctx.flightFrom}→${ctx.flightTo}${ctx.flightAirline ? ` (${ctx.flightAirline})` : ""}. Pode ajudar?`
      : `Olá SANIMAR Travel, hau hakarak hatene kona-ba voo ${ctx.flightFrom}→${ctx.flightTo}${ctx.flightAirline ? ` (${ctx.flightAirline})` : ""}. Bele ajuda hau?`;
  }
  return lang === "id"
    ? "Halo SANIMAR Travel, saya butuh bantuan pemesanan tiket pesawat."
    : lang === "en"
    ? "Hi SANIMAR Travel, I need help booking a flight."
    : lang === "pt"
    ? "Olá SANIMAR Travel, preciso de ajuda para reservar um voo."
    : "Olá SANIMAR Travel, hau presiza ajuda ba atu rezerva bilhete aviaun.";
}

export default function WhatsAppHandoff({ lang, context, variant = "inline" }: WhatsAppHandoffProps) {
  const [pulsed, setPulsed] = useState(false);
  const L = LABELS[lang] || LABELS.en;
  const msg = buildWaMessage(lang, context);
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  const handleClick = () => {
    setPulsed(true);
    setTimeout(() => setPulsed(false), 600);
    window.open(url, "_blank", "noopener");
  };

  if (variant === "floating") {
    return (
      <button
        onClick={handleClick}
        title={L.hint}
        className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-150 active:scale-95"
        aria-label={L.text}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.083.535 4.04 1.47 5.746L0 24l6.404-1.449A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.58-.502-5.07-1.376l-.362-.214-3.798.86.875-3.716-.234-.382A9.97 9.97 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"/>
        </svg>
      </button>
    );
  }

  if (variant === "banner") {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl">
        <span className="text-[#25D366] text-xl">💬</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#25D366] font-semibold">{L.text}</p>
          <p className="text-[10px] text-gray-400 truncate">{L.hint}</p>
        </div>
        <button
          onClick={handleClick}
          className={`flex-shrink-0 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#1ebe5d] transition-all duration-150 ${pulsed ? "scale-95" : ""}`}
        >
          ▶ Chat
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3.5 py-2 bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold rounded-xl hover:bg-[#25D366]/25 transition-all duration-150 ${pulsed ? "scale-95" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.083.535 4.04 1.47 5.746L0 24l6.404-1.449A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.58-.502-5.07-1.376l-.362-.214-3.798.86.875-3.716-.234-.382A9.97 9.97 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"/>
      </svg>
      {L.text}
    </button>
  );
}
