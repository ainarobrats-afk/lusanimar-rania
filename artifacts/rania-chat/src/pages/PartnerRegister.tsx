import { useState } from "react";
import { useLocation } from "wouter";

const API = "/api";
const GH = "https://raw.githubusercontent.com/ainarobrats-afk/SANIMAR-TRAVEL/main/Rania%20Ai/public";

const CATEGORIES = [
  { id: "hotel", label: "Hotel", emoji: "🏨" },
  { id: "resort", label: "Resort", emoji: "🏖️" },
  { id: "homestay", label: "Homestay", emoji: "🏠" },
  { id: "guesthouse", label: "Guesthouse", emoji: "🏡" },
  { id: "villa", label: "Villa", emoji: "🏛️" },
  { id: "tour", label: "Tour Operator", emoji: "🗺️" },
  { id: "diving", label: "Diving Center", emoji: "🤿" },
  { id: "rental_car", label: "Car Rental", emoji: "🚗" },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { id: "local_guide", label: "Local Guide", emoji: "🧭" },
  { id: "attraction", label: "Attraction", emoji: "📍" },
];

interface FormData {
  businessName: string;
  category: string;
  city: string;
  country: string;
  whatsapp: string;
  email: string;
  description: string;
  pricingRange: string;
  promoText: string;
  instagram: string;
  facebook: string;
  website: string;
  googleMapsLink: string;
}

export default function PartnerRegister() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    businessName: "",
    category: "",
    city: "",
    country: "Timor-Leste",
    whatsapp: "",
    email: "",
    description: "",
    pricingRange: "",
    promoText: "",
    instagram: "",
    facebook: "",
    website: "",
    googleMapsLink: "",
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const validateStep1 = () => {
    if (!form.businessName.trim()) return "Business name is required";
    if (!form.category) return "Please select a category";
    if (!form.city.trim()) return "City is required";
    if (!form.whatsapp.trim()) return "WhatsApp number is required";
    if (form.whatsapp.replace(/[^0-9]/g, "").length < 8) return "Enter a valid WhatsApp number";
    return "";
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) { setError("Please add a short description"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/rania/partners/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(data.partnerId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#050812] text-white flex flex-col items-center justify-center px-4">
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`.font-orbitron { font-family: 'Orbitron', sans-serif; }`}</style>
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-6 animate-bounce">✅</div>
          <h1 className="text-2xl font-black text-white mb-3">Submission Received!</h1>
          <p className="text-gray-400 text-sm mb-2">Your business listing is under review.</p>
          <p className="text-gray-500 text-xs mb-6">Our team will review and activate your listing within 24 hours. You'll be notified via WhatsApp.</p>
          <div className="rounded-xl p-4 mb-6 text-left" style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}>
            <div className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2">Submission ID</div>
            <div className="font-mono text-white font-bold">{success}</div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/explore")}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              ← View Explore
            </button>
            <button onClick={() => navigate("/")}
              className="px-6 py-3 rounded-xl font-bold text-black text-sm"
              style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)" }}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" };
  const labelCls = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen bg-[#050812] text-white overflow-x-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`.font-orbitron { font-family: 'Orbitron', sans-serif; }`}</style>

      {/* Aurora */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-12" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.4), transparent)", top: "-100px", left: "-100px", filter: "blur(100px)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4), transparent)", bottom: "10%", right: "-80px", filter: "blur(80px)" }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/6" style={{ background: "rgba(5,8,18,0.94)" }}>
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3" style={{ height: "60px" }}>
          <button onClick={() => navigate("/explore")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <span>Explore</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2 flex-1">
            <img src={`${GH}/image/logo-sanimar-3d.png.webp`} alt="SANIMAR" className="h-7 w-auto rounded-lg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div>
              <div className="font-orbitron text-sm font-black text-white leading-none">Partner Registration</div>
              <div className="text-[9px] text-cyan-400/80 font-bold tracking-widest">FREE LISTING</div>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2].map(s => (
              <div key={s} className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${s === step ? "text-black" : s < step ? "text-white" : "text-gray-600"}`}
                style={s === step ? { background: "linear-gradient(135deg,#00e5ff,#a855f7)" } : s < step ? { background: "rgba(0,229,255,0.25)", border: "1px solid rgba(0,229,255,0.4)" } : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {s < step ? "✓" : s}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold mb-4" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00e5ff" }}>
            🏨 Partner Marketplace
          </div>
          <h1 className="text-3xl font-black mb-2">
            {step === 1 ? "List Your Business" : "Tell Travelers About You"}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 1 ? "Join the RANIA partner network — free to list, WhatsApp-first booking" : "Add photos, description and special offers to attract more customers"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-6 md:p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Business Name *</label>
                <input value={form.businessName} onChange={set("businessName")} placeholder="e.g. Dili Ocean Hotel" className={inputCls} style={inputStyle} maxLength={120} />
              </div>

              <div>
                <label className={labelCls}>Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                      className={`flex items-center gap-2 p-3 rounded-xl text-left text-sm font-bold transition-all ${form.category === cat.id ? "text-black scale-105" : "text-gray-400 hover:text-white"}`}
                      style={form.category === cat.id
                        ? { background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 16px rgba(0,229,255,0.25)" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                      }>
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City *</label>
                  <input value={form.city} onChange={set("city")} placeholder="e.g. Dili" className={inputCls} style={inputStyle} maxLength={80} />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <input value={form.country} onChange={set("country")} placeholder="Timor-Leste" className={inputCls} style={inputStyle} maxLength={80} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>WhatsApp Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-green-400">💬</span>
                    <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+670 77 000 000" className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }} maxLength={30} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email (optional)</label>
                  <input value={form.email} onChange={set("email")} type="email" placeholder="info@yourbusiness.tl" className={inputCls} style={inputStyle} maxLength={120} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Pricing Range (optional)</label>
                <input value={form.pricingRange} onChange={set("pricingRange")} placeholder="e.g. From $50/night · or $35–$150/person" className={inputCls} style={inputStyle} maxLength={80} />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Short Description *</label>
                <textarea value={form.description} onChange={set("description")}
                  placeholder="Describe your business in 2–3 sentences. What makes you unique? What can travelers expect?"
                  className={inputCls} style={{ ...inputStyle, resize: "none", minHeight: "100px" }} maxLength={600} rows={4} />
                <div className="text-right text-[9px] text-gray-600 mt-1">{form.description.length}/600</div>
              </div>

              <div>
                <label className={labelCls}>Special Offer / Promo Text (optional)</label>
                <input value={form.promoText} onChange={set("promoText")} placeholder="e.g. 🎉 15% off for 3+ nights! Book via WhatsApp" className={inputCls} style={inputStyle} maxLength={200} />
              </div>

              <div className="pt-2 border-t border-white/6">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Social & Links (optional)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📸</span>
                      <input value={form.instagram} onChange={set("instagram")} placeholder="@yourbusiness" className={inputCls} style={{ ...inputStyle, paddingLeft: "2.2rem" }} maxLength={120} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Facebook</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📘</span>
                      <input value={form.facebook} onChange={set("facebook")} placeholder="facebook.com/yourbusiness" className={inputCls} style={{ ...inputStyle, paddingLeft: "2.2rem" }} maxLength={120} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Website</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🌐</span>
                      <input value={form.website} onChange={set("website")} placeholder="https://yourbusiness.tl" className={inputCls} style={{ ...inputStyle, paddingLeft: "2.2rem" }} maxLength={200} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Google Maps Link</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📍</span>
                      <input value={form.googleMapsLink} onChange={set("googleMapsLink")} placeholder="maps.google.com/..." className={inputCls} style={{ ...inputStyle, paddingLeft: "2.2rem" }} maxLength={500} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust signals */}
              <div className="rounded-xl p-4" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">🔒</span>
                  <div className="text-xs text-gray-400 leading-relaxed">
                    All submissions are reviewed by our team within 24 hours. We'll contact you via WhatsApp once your listing is approved. Listing is <strong className="text-white">completely free</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 justify-end">
            {step === 2 && (
              <button onClick={() => { setStep(1); setError(""); }}
                className="px-5 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                ← Back
              </button>
            )}
            {step === 1 ? (
              <button onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-black text-sm transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: "0 4px 20px rgba(0,229,255,0.3)" }}>
                Next: Details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-black text-sm transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", boxShadow: submitting ? "none" : "0 4px 20px rgba(0,229,255,0.3)" }}>
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Submitting...</>
                ) : (
                  <>Submit Listing ✓</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "📋", step: "1", title: "Submit", desc: "Fill in your business details in under 2 minutes" },
            { icon: "✅", step: "2", title: "Review", desc: "Our team reviews and approves within 24 hours" },
            { icon: "🚀", step: "3", title: "Go Live", desc: "Your listing is visible to thousands of travelers" },
          ].map(item => (
            <div key={item.step} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Step {item.step}</div>
              <div className="font-bold text-white text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
