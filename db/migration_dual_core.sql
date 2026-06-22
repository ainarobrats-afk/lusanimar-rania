-- ============================================================================
-- RANIA V3.0 Dual-Core — user_memory table
-- Cross-chat memory shared between RANIA Travel and RANIA Market
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_memory (
  user_id       UUID PRIMARY KEY,
  suka_bali     BOOLEAN DEFAULT false,
  jual_tour     BOOLEAN DEFAULT false,
  cari_hotel    BOOLEAN DEFAULT false,
  budget        INT,
  nama          TEXT,
  bahasa        VARCHAR(8) DEFAULT 'id',
  nasionalitas  TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user_id (already PK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);

-- Upsert helper: call with ON CONFLICT(user_id) DO UPDATE
-- Example:
--   INSERT INTO user_memory (user_id, suka_bali, budget)
--   VALUES ('...', true, 5000000)
--   ON CONFLICT (user_id) DO UPDATE
--   SET suka_bali = EXCLUDED.suka_bali,
--       budget = EXCLUDED.budget,
--       updated_at = NOW();
