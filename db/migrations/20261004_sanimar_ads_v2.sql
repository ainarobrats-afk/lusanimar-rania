-- ============================================================================
-- SANIMAR ADS V1.1 — Auto-Renewal + Notifications + Hotel Commission
-- Date: 2026-10-04
-- FITUR 1: Auto-renewal (recurring)
-- FITUR 2: Low-budget WA notifications
-- FITUR 3: Hotel 10% commission split
-- ============================================================================

-- ─── FITUR 1: Auto-Renewal columns on ads_campaign ─────────────────────────
ALTER TABLE ads_campaign ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;
ALTER TABLE ads_campaign ADD COLUMN IF NOT EXISTS auto_renew_amount_cents INT DEFAULT 0;
ALTER TABLE ads_campaign ADD COLUMN IF NOT EXISTS auto_renew_interval_days INT DEFAULT 30;
ALTER TABLE ads_campaign ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ;
ALTER TABLE ads_campaign ADD COLUMN IF NOT EXISTS xendit_recurring_id TEXT;

-- Index for cron: find campaigns that need auto-renewal
CREATE INDEX IF NOT EXISTS idx_ads_campaign_auto_renew
  ON ads_campaign(auto_renew, status, end_date)
  WHERE auto_renew = true AND status IN ('active', 'budget_exhausted');

-- ─── FITUR 2: Notification Log (prevent duplicate nagging) ─────────────────
CREATE TABLE IF NOT EXISTS ads_notification_log (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID REFERENCES ads_campaign(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT DEFAULT 'low_budget',  -- low_budget, exhausted, auto_renew_failed
  channel TEXT DEFAULT 'wa',                     -- wa, email, push
  message_sent TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ads_notif_log_campaign ON ads_notification_log(campaign_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_ads_notif_log_sent ON ads_notification_log(sent_at);

-- Prevent duplicate nags: unique per campaign per type per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_notif_log_daily
  ON ads_notification_log(campaign_id, notification_type, DATE(sent_at));

-- ─── FITUR 3: Hotel Commission / Split Payment ─────────────────────────────
CREATE TABLE IF NOT EXISTS ads_commission_log (
  id BIGSERIAL PRIMARY KEY,
  listing_id UUID REFERENCES market_listings(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ads_campaign(id) ON DELETE SET NULL,
  booking_amount_cents INT NOT NULL,         -- Total booking amount
  vendor_share_cents INT NOT NULL,           -- 90% to hotel vendor
  platform_share_cents INT NOT NULL,         -- 10% to platform (Maun)
  vendor_user_id UUID REFERENCES users(id),  -- Hotel owner
  platform_account TEXT DEFAULT 'platform-main',
  xendit_split_id TEXT,                      -- Xendit split payment reference
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ads_commission_listing ON ads_commission_log(listing_id);
CREATE INDEX IF NOT EXISTS idx_ads_commission_vendor ON ads_commission_log(vendor_user_id);
CREATE INDEX IF NOT EXISTS idx_ads_commission_status ON ads_commission_log(status);

-- Vendor bank/wallet info for commission payouts
CREATE TABLE IF NOT EXISTS vendor_payout_info (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  dana_number TEXT,           -- Dana/OVO/GoPay number
  xendit_customer_id TEXT,    -- Xendit customer for disbursements
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper: Auto-renew trigger — when campaign budget exhausted + auto_renew = true,
-- the cron job will pick it up, but this function does the actual renewal
CREATE OR REPLACE FUNCTION fn_auto_renew_campaign(
  p_campaign_id UUID,
  p_budget_cents INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_campaign ads_campaign%ROWTYPE;
  v_wallet vendor_wallet%ROWTYPE;
BEGIN
  -- Get campaign
  SELECT * INTO v_campaign FROM ads_campaign WHERE id = p_campaign_id;
  IF NOT FOUND OR NOT v_campaign.auto_renew THEN
    RETURN false;
  END IF;

  -- Check if wallet has enough balance
  SELECT * INTO v_wallet FROM vendor_wallet WHERE user_id = v_campaign.user_id;
  IF NOT FOUND OR v_wallet.saldo_cents < p_budget_cents THEN
    RETURN false;
  END IF;

  -- Deduct wallet
  UPDATE vendor_wallet
  SET saldo_cents = saldo_cents - p_budget_cents
  WHERE user_id = v_campaign.user_id;

  -- Reset campaign budget
  UPDATE ads_campaign
  SET budget_cents = budget_cents + p_budget_cents,
      status = 'active',
      last_renewed_at = NOW(),
      spent_cents = 0,
      clicks = 0
  WHERE id = p_campaign_id;

  -- Re-mark listing as sponsored
  UPDATE market_listings SET is_sponsored = true WHERE id = v_campaign.listing_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
