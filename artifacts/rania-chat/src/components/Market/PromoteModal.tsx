// ============================================================================
// SANIMAR ADS V1 — Promote Modal Component
// CRITICAL: This component ONLY appears in Sanimar Market pages. NEVER in Travel.
// ============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, Rocket, Check, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  userId: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  clicks: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
}

const PACKAGES: Package[] = [
  {
    id: "hemat",
    name: "Paket Hemat",
    price: 500, // $5 = 500 cents
    priceLabel: "$5",
    clicks: "50 Clicks",
    duration: "7 Days Pin #1",
    icon: <Zap size={24} />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "laris",
    name: "Paket Laris",
    price: 1500, // $15
    priceLabel: "$15",
    clicks: "200 Clicks",
    duration: "30 Days Pin #1",
    icon: <Crown size={24} />,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "sultan",
    name: "Paket Sultan",
    price: 5000, // $50
    priceLabel: "$50",
    clicks: "Unlimited Clicks",
    duration: "Pin #1 Forever",
    icon: <Rocket size={24} />,
    color: "from-purple-500 to-pink-500",
  },
];

const TERMS_TEXT = `TERMS & CONDITIONS V1.1

1. No gambling, loan, SARA, adult content.
2. Click cost $0.10. No refunds once campaign starts.
3. We can remove your ad anytime if you break rules. Money forfeited.
4. Ads only shown in Sanimar Market, never in Travel.
5. Prepaid only — vendor must top-up before ads run.
6. Campaign auto-stops when budget exhausted.
7. Fraudulent clicks (bot, self-click) will be deducted without refund.
8. We reserve the right to reject any ad for any reason.
9. AUTO-RENEWAL: If enabled, your card/wallet will be auto-debited monthly.
   Cancel anytime from Ads Dashboard. No penalty.
10. HOTEL COMMISSION: Hotel bookings via Market incur 10% platform commission.
    90% goes to vendor, 10% to platform. Split is automatic and final.`;

const PromoteModal: React.FC<PromoteModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  userId,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true); // FITUR 1: default ON
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowTerms(true);
    setError(null);
  };

  const handlePay = async () => {
    if (!selectedPackage || !termsAccepted) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Top-up wallet with the package amount
      const topupResp = await fetch("/api/ads/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          amount_cents: selectedPackage.price,
        }),
      });
      const topupData = await topupResp.json();

      if (topupData.invoice_url) {
        // Redirect to Xendit payment page
        window.open(topupData.invoice_url, "_blank");
        setSuccess(true);
        return;
      }

      // If topup succeeds immediately (webhook already processed), create campaign
      if (topupData.success) {
        // Step 2: Create campaign
        const campaignResp = await fetch("/api/ads/create_campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            listing_id: listingId,
            campaign_type: "cpc",
            budget_cents: selectedPackage.price,
            duration_days: selectedPackage.id === "hemat" ? 7 : selectedPackage.id === "laris" ? 30 : 365,
            auto_renew: autoRenew,
            auto_renew_amount_cents: selectedPackage.price,
          }),
        });
        const campaignData = await campaignResp.json();

        if (campaignData.success) {
          setSuccess(true);
        } else {
          setError(campaignData.error || "Failed to create campaign");
        }
      } else {
        setError(topupData.error || "Top-up failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setSelectedPackage(null);
    setShowTerms(false);
    setTermsAccepted(false);
    setAutoRenew(true); // Reset to default ON
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600">
              <div>
                <h2 className="text-xl font-black text-white">💰 Promote Your Listing</h2>
                <p className="text-sm text-white/80 mt-1 truncate max-w-[300px]">{listingTitle}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20 rounded-full">
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              {success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-10 space-y-4"
                >
                  <div className="text-6xl">🎉</div>
                  <h3 className="text-2xl font-black text-white">Campaign Active!</h3>
                  <p className="text-slate-400">
                    Your listing is now promoted. Check the Ads Dashboard for real-time stats.
                  </p>
                  <Button
                    onClick={() => { window.location.href = "/sanimar-market/ads/dashboard"; }}
                    className="bg-gradient-to-r from-blue-600 to-amber-600 text-white font-bold rounded-2xl px-8 py-3"
                  >
                    Go to Dashboard
                  </Button>
                </motion.div>
              ) : showTerms && selectedPackage ? (
                /* Terms & Conditions View */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${selectedPackage.color} flex items-center justify-center text-white`}>
                      {selectedPackage.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold">{selectedPackage.name}</p>
                      <p className="text-amber-400 font-black text-lg">{selectedPackage.priceLabel}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 max-h-60 overflow-y-auto">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{TERMS_TEXT}</pre>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-slate-800 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-200 font-semibold">I Agree to All Terms</span>
                  </label>

                  {/* FITUR 1: Auto-renewal checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm text-blue-200 font-bold flex items-center gap-2">
                        <span>{"🔄"}</span> Perpanjang otomatis tiap bulan
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Auto-debit $${(selectedPackage.price / 100).toFixed(0)}/bln. Iklan gak pernah mati.
                      </span>
                    </div>
                  </label>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                      <AlertTriangle size={16} />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => { setShowTerms(false); setSelectedPackage(null); }}
                      className="flex-1 text-slate-300 border border-white/10 rounded-2xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePay}
                      disabled={!termsAccepted || isLoading}
                      className={`flex-1 bg-gradient-to-r ${selectedPackage.color} text-white font-bold rounded-2xl disabled:opacity-40`}
                    >
                      {isLoading ? "Processing..." : `Pay ${selectedPackage.priceLabel} via QRIS`}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Package Selection View */
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm mb-2">
                    Get 10x more buyers! Choose a promotion package:
                  </p>
                  {PACKAGES.map((pkg) => (
                    <motion.button
                      key={pkg.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPackage(pkg)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-white/8 transition-all duration-200 text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${pkg.color} flex items-center justify-center text-white shrink-0`}>
                        {pkg.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg">{pkg.name}</p>
                        <p className="text-slate-400 text-sm">{pkg.clicks} • {pkg.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-black text-2xl">{pkg.priceLabel}</p>
                      </div>
                    </motion.button>
                  ))}

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mt-3">
                      <AlertTriangle size={16} />
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromoteModal;
