// ============================================================================
// SANIMAR ADS V1 — Vendor Ads Dashboard
// CRITICAL: This page is ONLY accessible from Sanimar Market. NEVER in Travel.
// ============================================================================

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  BarChart3,
  Pause,
  Play,
  Plus,
  TrendingUp,
  MousePointerClick,
  Eye,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Campaign {
  id: string;
  listing_id: string;
  campaign_type: string;
  budget_cents: number;
  spent_cents: number;
  clicks: number;
  impressions: number;
  cpc_cents: number;
  status: "active" | "paused" | "budget_exhausted" | "rejected";
  start_date: string;
  end_date: string | null;
  created_at: string;
}

interface WalletData {
  saldo_cents: number;
  total_spent_cents: number;
  total_topped_up_cents: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <Play size={14} /> },
  paused: { label: "Paused", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Pause size={14} /> },
  budget_exhausted: { label: "Budget Done", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <CheckCircle2 size={14} /> },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle size={14} /> },
};

export default function AdsDashboard() {
  const [, navigate] = useLocation();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState(() => localStorage.getItem("rania_user_id") || "demo-vendor");
  const [topupAmount, setTopupAmount] = useState("500"); // $5 default in cents

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/ads/dashboard?user_id=${userId}`);
      const data = await resp.json();
      if (data.success) {
        setWallet(data.data.wallet as WalletData);
        setCampaigns(data.data.campaigns as Campaign[]);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
    setIsLoading(false);
  };

  const handleTopup = async () => {
    try {
      const resp = await fetch("/api/ads/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount_cents: parseInt(topupAmount) }),
      });
      const data = await resp.json();
      if (data.data?.invoice_url) {
        window.open(data.data.invoice_url, "_blank");
      }
    } catch (error) {
      console.error("Topup error:", error);
    }
  };

  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent_cents || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/sanimar-market")} className="text-slate-300 hover:bg-white/10 rounded-xl">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-white to-amber-300 bg-clip-text text-transparent">
                Ads Dashboard
              </h1>
              <p className="text-xs text-slate-400">Sanimar Market — Monetization</p>
            </div>
          </div>
          <Link href="/sanimar-market">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold rounded-2xl px-5 py-2">
              Back to Market
            </Button>
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Wallet size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Balance</p>
                    <p className="text-2xl font-black text-white">
                      {isLoading ? <Skeleton className="h-7 w-20 bg-white/10" /> : `$${((wallet?.saldo_cents || 0) / 100).toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <MousePointerClick size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Total Clicks</p>
                    <p className="text-2xl font-black text-white">
                      {isLoading ? <Skeleton className="h-7 w-16 bg-white/10" /> : totalClicks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Total Spent</p>
                    <p className="text-2xl font-black text-white">
                      {isLoading ? <Skeleton className="h-7 w-20 bg-white/10" /> : `$${(totalSpent / 100).toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Active Ads</p>
                    <p className="text-2xl font-black text-white">
                      {isLoading ? <Skeleton className="h-7 w-10 bg-white/10" /> : activeCampaigns}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top-up Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet size={20} className="text-green-400" />
                Top-Up Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 flex-1">
                  {[500, 1500, 5000].map((cents) => (
                    <Button
                      key={cents}
                      variant={topupAmount === String(cents) ? "default" : "outline"}
                      onClick={() => setTopupAmount(String(cents))}
                      className={`rounded-xl font-bold ${
                        topupAmount === String(cents)
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "border-white/10 text-slate-300"
                      }`}
                    >
                      ${(cents / 100).toFixed(0)}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleTopup}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-2xl px-8"
                >
                  <Plus size={18} className="mr-2" />
                  Top-Up ${(parseInt(topupAmount) / 100).toFixed(2)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaigns Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" />
                Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full bg-white/10 rounded-xl" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-slate-400 text-lg">No campaigns yet</p>
                  <p className="text-slate-500 text-sm mt-1">Promote a listing to see stats here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-slate-400 font-semibold uppercase py-3 px-3">Campaign</th>
                        <th className="text-left text-xs text-slate-400 font-semibold uppercase py-3 px-3">Clicks</th>
                        <th className="text-left text-xs text-slate-400 font-semibold uppercase py-3 px-3">Spent</th>
                        <th className="text-left text-xs text-slate-400 font-semibold uppercase py-3 px-3">Budget Left</th>
                        <th className="text-left text-xs text-slate-400 font-semibold uppercase py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => {
                        const status = statusConfig[campaign.status] || statusConfig.active;
                        const budgetLeft = Math.max(0, campaign.budget_cents - campaign.spent_cents);
                        const progress = campaign.budget_cents > 0
                          ? Math.min(100, (campaign.spent_cents / campaign.budget_cents) * 100)
                          : 0;

                        return (
                          <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-3">
                              <div>
                                <p className="text-white font-semibold text-sm">
                                  {campaign.campaign_type.toUpperCase()} • {campaign.id.slice(0, 8)}
                                </p>
                                <p className="text-slate-500 text-xs mt-0.5">
                                  {new Date(campaign.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-1.5">
                                <MousePointerClick size={14} className="text-blue-400" />
                                <span className="text-white font-bold">{campaign.clicks || 0}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span className="text-amber-400 font-bold">${(campaign.spent_cents / 100).toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-3">
                              <div>
                                <span className="text-green-400 font-bold">${(budgetLeft / 100).toFixed(2)}</span>
                                <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-amber-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <Badge className={`${status.color} border text-xs font-semibold flex items-center gap-1 w-fit`}>
                                {status.icon}
                                {status.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
