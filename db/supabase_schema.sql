-- ============================================================================
-- RANIA Global — Supabase PostgreSQL Schema
-- Version: 1.0
-- Run in Supabase SQL Editor (Settings → SQL Editor → New Query)
--
-- Tables:
--   users           → registered users
--   sessions        → chat sessions
--   chat_history    → per-session message log
--   flight_searches → search queries (for analytics + cache)
--   flight_quotes   → flight results offered to user
--   bookings        → full booking state machine
--   passengers      → passenger details per booking
--   payments        → payment records per booking
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── users ───────────────────────────────────────────────────────────────────

create table if not exists users (
  id            uuid        primary key default gen_random_uuid(),
  phone         text        unique,                       -- WhatsApp number
  email         text        unique,
  full_name     text,
  language      text        not null default 'id',        -- tet | id | en | pt
  source        text        not null default 'web',       -- web | whatsapp
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table users is 'Registered RANIA users across all channels';

-- ─── sessions ────────────────────────────────────────────────────────────────

create table if not exists sessions (
  id            text        primary key,                  -- sess-{nanoid}
  user_id       uuid        references users(id) on delete set null,
  channel       text        not null default 'web',       -- web | whatsapp
  language      text        not null default 'id',
  started_at    timestamptz not null default now(),
  last_active   timestamptz not null default now(),
  metadata      jsonb
);

comment on table sessions is 'Chat sessions — links to users, tracks language per session';

create index if not exists idx_sessions_user_id   on sessions(user_id);
create index if not exists idx_sessions_last_active on sessions(last_active);

-- ─── chat_history ─────────────────────────────────────────────────────────────

create table if not exists chat_history (
  id            bigserial   primary key,
  session_id    text        not null references sessions(id) on delete cascade,
  role          text        not null check (role in ('user', 'assistant', 'function')),
  content       text        not null,
  function_call jsonb,                                    -- { name, arguments } if role=assistant
  function_name text,                                     -- function name if role=function
  provider      text,                                     -- groq | gemini | cerebras
  created_at    timestamptz not null default now()
);

comment on table chat_history is 'Complete message log per session for context continuity';

create index if not exists idx_chat_session_id on chat_history(session_id);
create index if not exists idx_chat_created_at on chat_history(created_at);

-- ─── flight_searches ─────────────────────────────────────────────────────────

create table if not exists flight_searches (
  id            uuid        primary key default gen_random_uuid(),
  session_id    text        references sessions(id) on delete set null,
  origin        text        not null,
  destination   text        not null,
  departure_date date       not null,
  return_date   date,
  passengers    int         not null default 1,
  cabin_class   text        not null default 'Economy',
  provider_used text,                                     -- travelport | travelpayouts
  results_count int         not null default 0,
  duration_ms   int,
  searched_at   timestamptz not null default now()
);

comment on table flight_searches is 'Search query log for analytics and caching';

create index if not exists idx_fsearch_route
  on flight_searches(origin, destination, departure_date);
create index if not exists idx_fsearch_session on flight_searches(session_id);

-- ─── flight_quotes ────────────────────────────────────────────────────────────

create table if not exists flight_quotes (
  id            uuid        primary key default gen_random_uuid(),
  search_id     uuid        references flight_searches(id) on delete cascade,
  session_id    text        references sessions(id) on delete set null,
  provider      text        not null,
  airline       text        not null,
  airline_code  text        not null,
  flight_number text,
  origin        text        not null,
  destination   text        not null,
  departure_time timestamptz,
  arrival_time  timestamptz,
  duration      text,
  price         numeric(12, 2),
  taxes         numeric(12, 2),
  total_price   numeric(12, 2),
  currency      text        not null default 'USD',
  stops         int         not null default 0,
  cabin_class   text,
  available     boolean     not null default true,
  raw_data      jsonb,                                    -- full provider response
  quoted_at     timestamptz not null default now()
);

comment on table flight_quotes is 'Flight results offered to user — used for booking reference';

create index if not exists idx_fquote_search_id  on flight_quotes(search_id);
create index if not exists idx_fquote_session_id on flight_quotes(session_id);

-- ─── bookings ─────────────────────────────────────────────────────────────────

create table if not exists bookings (
  id            uuid        primary key default gen_random_uuid(),
  session_id    text        references sessions(id) on delete set null,
  user_id       uuid        references users(id) on delete set null,
  quote_id      uuid        references flight_quotes(id) on delete restrict,

  -- Status machine: SEARCHING → OFFERED → DATA_FILLED → PENDING_PAYMENT
  --                → PAID → PROCESSING → TICKETED
  --                → VERIFY → REFUNDED
  status        text        not null default 'SEARCHING'
                check (status in (
                  'SEARCHING','OFFERED','DATA_FILLED',
                  'PENDING_PAYMENT','PAID','PROCESSING',
                  'TICKETED','VERIFY','REFUNDED','CANCELLED'
                )),

  -- Flight snapshot (denormalized for audit — never changes after booking)
  flight_data   jsonb       not null,                    -- full UnifiedFlight at time of booking
  pricing       jsonb,                                   -- { supplier, markup, customer_total }

  -- Supplier
  supplier      text        not null default 'travelport', -- travelport | kiwi
  pnr           text,                                    -- booking confirmation code
  ticket_number text,
  supplier_booking_ref text,

  -- Payment
  payment_id    text,                                    -- Xendit invoice_id
  payment_status text,                                   -- pending | paid | expired | refunded
  paid_at       timestamptz,

  -- Internal
  profit        int,                                     -- profit in IDR
  error_log     jsonb,
  retry_count   int         not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table bookings is 'Core booking state machine — source of truth for all booking status';

create index if not exists idx_bookings_status     on bookings(status);
create index if not exists idx_bookings_user_id    on bookings(user_id);
create index if not exists idx_bookings_session_id on bookings(session_id);
create index if not exists idx_bookings_created_at on bookings(created_at);

-- ─── passengers ───────────────────────────────────────────────────────────────

create table if not exists passengers (
  id                uuid        primary key default gen_random_uuid(),
  booking_id        uuid        not null references bookings(id) on delete cascade,
  full_name         text        not null,
  passport_number   text        not null,
  passport_expiry   date        not null,
  nationality       text        not null default 'Timor-Leste',
  date_of_birth     date        not null,
  email             text        not null,
  phone             text        not null,
  passenger_type    text        not null default 'ADT'  -- ADT | CNN | INF
                    check (passenger_type in ('ADT','CNN','INF')),
  created_at        timestamptz not null default now()
);

comment on table passengers is 'Passenger details per booking — validated at time of entry';

create index if not exists idx_passengers_booking_id on passengers(booking_id);

-- ─── payments ─────────────────────────────────────────────────────────────────

create table if not exists payments (
  id                uuid        primary key default gen_random_uuid(),
  booking_id        uuid        not null references bookings(id) on delete restrict,
  provider          text        not null default 'xendit',
  external_id       text        unique,                  -- Xendit invoice_id
  method            text,                                -- QRIS | VA_BCA | CARD | BNCTL | MOSAN
  amount            numeric(12, 2) not null,
  currency          text        not null default 'IDR',
  status            text        not null default 'pending'
                    check (status in ('pending','paid','expired','refunded','failed')),
  qr_url            text,
  va_number         text,
  invoice_url       text,
  paid_at           timestamptz,
  expired_at        timestamptz,
  webhook_received  boolean     not null default false,
  webhook_payload   jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table payments is 'Payment records — one per booking attempt, Xendit webhook updates status';

create index if not exists idx_payments_booking_id  on payments(booking_id);
create index if not exists idx_payments_external_id on payments(external_id);
create index if not exists idx_payments_status      on payments(status);

-- ─── system_logs ─────────────────────────────────────────────────────────────

create table if not exists system_logs (
  id          bigserial   primary key,
  booking_id  uuid        references bookings(id) on delete set null,
  session_id  text        references sessions(id) on delete set null,
  level       text        not null check (level in ('INFO','WARN','ERROR')),
  source      text        not null,                      -- PARSER|HUNTER|VALIDATOR|CASHIER|PILOT
  message     text        not null,
  data        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_logs_booking_id  on system_logs(booking_id);
create index if not exists idx_logs_level       on system_logs(level);
create index if not exists idx_logs_created_at  on system_logs(created_at);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_users_updated_at
  before update on users
  for each row execute function update_updated_at();

create or replace trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

create or replace trigger trg_payments_updated_at
  before update on payments
  for each row execute function update_updated_at();

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Enable RLS — workers use service_role key which bypasses RLS
-- Frontend should never have direct Supabase access to these tables

alter table users           enable row level security;
alter table sessions        enable row level security;
alter table chat_history    enable row level security;
alter table flight_searches enable row level security;
alter table flight_quotes   enable row level security;
alter table bookings        enable row level security;
alter table passengers      enable row level security;
alter table payments        enable row level security;
alter table system_logs     enable row level security;

-- Service role (Cloudflare Workers) has full access — no public access
-- Add user-facing policies when auth is implemented
