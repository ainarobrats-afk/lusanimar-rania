-- ============================================================================
-- SANIMAR ADS V1 — Monetization Engine Migration
-- Date: 2026-10-01
-- Scope: vendor_wallet, ads_campaign, ads_click_log, ads_terms_log
-- CRITICAL: Ads ONLY in Sanimar Market. NEVER in RANIA Travel.
-- ============================================================================

-- Prerequisite: market_listings table (referenced by ads_campaign)
CREATE TABLE IF NOT EXISTS market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INT,
  currency VARCHAR(8) DEFAULT 'USD',
  category TEXT,
  images JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','sold_out','removed')),
  is_sponsored BOOLEAN DEFAULT false,
  seller_name TEXT,
  seller_location TEXT,
  seller_wa TEXT,
  seller_verified BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  saves INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_listings_category ON market_listings(category);
CREATE INDEX IF NOT EXISTS idx_market_listings_user ON market_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_sponsored ON market_listings(is_sponsored) WHERE is_sponsored = true;

-- ─── Vendor Wallet ─────────────────────────────────────────────────────────
-- Prepaid only: vendor must top-up before running ads
CREATE TABLE IF NOT EXISTS vendor_wallet (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  saldo_cents INT DEFAULT 0,            -- $5.00 = 500 cents
  total_spent_cents INT DEFAULT 0,      -- Lifetime ad spend
  total_topped_up_cents INT DEFAULT 0,  -- Lifetime top-ups
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Ads Campaign ──────────────────────────────────────────────────────────
-- Core monetization: CPC, CPM, Pin, CPA campaign types
CREATE TABLE IF NOT EXISTS ads_campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES market_listings(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('cpc','cpm','pin','cpa')),
  budget_cents INT NOT NULL,             -- Total budget vendor sets (prepaid)
  spent_cents INT DEFAULT 0,             -- How much consumed so far
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  cpc_cents INT DEFAULT 10,              -- $0.10 per click default
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','paused','budget_exhausted','rejected')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'            -- Flexible: pin_position, targeting, etc.
);
CREATE INDEX IF NOT EXISTS idx_ads_campaign_user ON ads_campaign(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaign_status ON ads_campaign(status);
CREATE INDEX IF NOT EXISTS idx_ads_campaign_active ON ads_campaign(listing_id, status)
  WHERE status = 'active';

-- ─── Ads Click Log ─────────────────────────────────────────────────────────
-- Every click = money. Log everything for auditing.
CREATE TABLE IF NOT EXISTS ads_click_log (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID REFERENCES ads_campaign(id) ON DELETE CASCADE,
  clicker_user_id UUID,                  -- Who clicked (null = anonymous)
  clicker_ip INET,                       -- For fraud detection
  cost_cents INT,                        -- Cost of this specific click
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ads_click_log_campaign ON ads_click_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_click_log_created ON ads_click_log(created_at);

-- ─── Ads Terms Log ─────────────────────────────────────────────────────────
-- Legal: vendor must accept terms before running ads
CREATE TABLE IF NOT EXISTS ads_terms_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  terms_version TEXT DEFAULT 'v1.0',
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ads_terms_log_user ON ads_terms_log(user_id);

-- ─── Row Level Security ────────────────────────────────────────────────────
-- Vendors can only see their own wallet and campaigns
ALTER TABLE vendor_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_click_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  -- vendor_wallet: users see only their own row
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vendor_wallet_own' AND tablename = 'vendor_wallet') THEN
    CREATE POLICY vendor_wallet_own ON vendor_wallet
      FOR ALL USING (user_id = auth.uid());
  END IF;

  -- ads_campaign: users see only their own campaigns
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ads_campaign_own' AND tablename = 'ads_campaign') THEN
    CREATE POLICY ads_campaign_own ON ads_campaign
      FOR ALL USING (user_id = auth.uid());
  END IF;

  -- ads_click_log: readable by campaign owner
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ads_click_log_read' AND tablename = 'ads_click_log') THEN
    CREATE POLICY ads_click_log_read ON ads_click_log
      FOR SELECT USING (
        campaign_id IN (SELECT id FROM ads_campaign WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ─── Helper: Auto-expire campaigns when budget exhausted ───────────────────
-- Trigger: when spent_cents >= budget_cents, auto-set status to budget_exhausted
CREATE OR REPLACE FUNCTION fn_check_campaign_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.spent_cents >= NEW.budget_cents AND NEW.status = 'active' THEN
    NEW.status := 'budget_exhausted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_campaign_budget ON ads_campaign;
CREATE TRIGGER trg_check_campaign_budget
  BEFORE UPDATE OF spent_cents ON ads_campaign
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_campaign_budget();

-- ─── Helper: Update vendor_wallet timestamp ────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_wallet_timestamp ON vendor_wallet;
CREATE TRIGGER trg_update_wallet_timestamp
  BEFORE UPDATE ON vendor_wallet
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_wallet_timestamp();
