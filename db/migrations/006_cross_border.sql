-- SANIMAR Cross-Border Trade Engine V2.0
-- Migration: add cross-border tables

-- 1) cross_border_orders
CREATE TABLE IF NOT EXISTS cross_border_orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE NOT NULL,
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  escrow_status VARCHAR(50) DEFAULT 'held',
  shipping_partner_id INTEGER,
  tracking_number VARCHAR(100),
  customs_document VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2) shipping_partners
CREATE TABLE IF NOT EXISTS shipping_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  warehouse_kupang_address TEXT,
  rate_per_kg DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3) escrow_wallets
CREATE TABLE IF NOT EXISTS escrow_wallets (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES cross_border_orders(id),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'held',
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);