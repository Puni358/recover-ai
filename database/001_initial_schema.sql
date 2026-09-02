
-- RecoverAI
-- Initial PostgreSQL Schema
-- Supabase / PostgreSQL

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type opportunity_type as enum (
  'FAILED_PAYMENT',
  'ABANDONED_CHECKOUT',
  'FAILED_SUBSCRIPTION'
);

create type opportunity_status as enum (
  'OPEN',
  'ANALYZING',
  'RECOMMENDED',
  'APPROVED',
  'EXECUTING',
  'RECOVERED',
  'FAILED',
  'REJECTED',
  'EXPIRED'
);

create type recovery_action_type as enum (
  'RETRY_PAYMENT',
  'SEND_RECOVERY_MESSAGE',
  'CREATE_PAYMENT_LINK',
  'NO_ACTION'
);

create type recovery_action_status as enum (
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'EXECUTING',
  'COMPLETED',
  'FAILED',
  'VERIFIED'
);

create type execution_mode as enum (
  'SIMULATION',
  'RAZORPAY_TEST'
);

create type transaction_status as enum (
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED'
);

create type checkout_status as enum (
  'CREATED',
  'ABANDONED',
  'COMPLETED',
  'EXPIRED'
);

create type subscription_status as enum (
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'EXPIRED'
);

-- ============================================================
-- MERCHANTS
-- ============================================================

create table merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

create table transactions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',

  status transaction_status not null default 'PENDING',

  razorpay_payment_id text,
  razorpay_order_id text,

  failure_reason text,
  payment_method text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CHECKOUT SESSIONS
-- ============================================================

create table checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',

  status checkout_status not null default 'CREATED',

  razorpay_order_id text,

  abandoned_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',

  status subscription_status not null default 'ACTIVE',

  razorpay_subscription_id text,

  next_billing_at timestamptz,
  last_payment_at timestamptz,

  failure_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================

create table opportunities (
  id uuid primary key default gen_random_uuid(),

  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,

  opportunity_type opportunity_type not null,
  status opportunity_status not null default 'OPEN',

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',

  source_transaction_id uuid references transactions(id) on delete set null,
  source_checkout_id uuid references checkout_sessions(id) on delete set null,
  source_subscription_id uuid references subscriptions(id) on delete set null,

  failure_reason text,

  recovery_probability numeric(5,2)
    check (
      recovery_probability is null
      or (
        recovery_probability >= 0
        and recovery_probability <= 100
      )
    ),

  recommended_action recovery_action_type,

  detected_at timestamptz not null default now(),
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RECOVERY ACTIONS
-- ============================================================

create table recovery_actions (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null references opportunities(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,

  action_type recovery_action_type not null,
  status recovery_action_status not null default 'PENDING_APPROVAL',

  execution_mode execution_mode not null default 'SIMULATION',

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',

  approved_at timestamptz,
  executed_at timestamptz,
  verified_at timestamptz,

  external_reference text,

  result_message text,
  failure_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AI ANALYSES
-- ============================================================

create table ai_analyses (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null references opportunities(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,

  provider text not null default 'gemini',
  model text,

  diagnosis text,
  reasoning text,

  recovery_probability numeric(5,2)
    check (
      recovery_probability is null
      or (
        recovery_probability >= 0
        and recovery_probability <= 100
      )
    ),

  recommended_action recovery_action_type,

  evidence jsonb not null default '[]'::jsonb,
  raw_response jsonb,

  created_at timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),

  merchant_id uuid not null references merchants(id) on delete cascade,

  opportunity_id uuid references opportunities(id) on delete set null,
  recovery_action_id uuid references recovery_actions(id) on delete set null,

  event_type text not null,
  message text not null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_customers_merchant_id
  on customers(merchant_id);

create index idx_transactions_merchant_id
  on transactions(merchant_id);

create index idx_transactions_customer_id
  on transactions(customer_id);

create index idx_transactions_status
  on transactions(status);

create index idx_checkout_sessions_merchant_id
  on checkout_sessions(merchant_id);

create index idx_checkout_sessions_customer_id
  on checkout_sessions(customer_id);

create index idx_checkout_sessions_status
  on checkout_sessions(status);

create index idx_subscriptions_merchant_id
  on subscriptions(merchant_id);

create index idx_subscriptions_customer_id
  on subscriptions(customer_id);

create index idx_subscriptions_status
  on subscriptions(status);

create index idx_opportunities_merchant_id
  on opportunities(merchant_id);

create index idx_opportunities_status
  on opportunities(status);

create index idx_opportunities_type
  on opportunities(opportunity_type);

create index idx_recovery_actions_opportunity_id
  on recovery_actions(opportunity_id);

create index idx_recovery_actions_status
  on recovery_actions(status);

create index idx_ai_analyses_opportunity_id
  on ai_analyses(opportunity_id);

create index idx_audit_logs_merchant_id
  on audit_logs(merchant_id);

create index idx_audit_logs_opportunity_id
  on audit_logs(opportunity_id);

create index idx_audit_logs_created_at
  on audit_logs(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table merchants enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table checkout_sessions enable row level security;
alter table subscriptions enable row level security;
alter table opportunities enable row level security;
alter table recovery_actions enable row level security;
alter table ai_analyses enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- DEMO ACCESS POLICIES
-- ============================================================
--
-- For the initial hackathon setup, authenticated users can
-- access records belonging to their merchant.
--
-- Authentication/merchant mapping will be finalized when
-- Supabase Auth is implemented.
--
-- Do not create broad public policies in production.
--
-- ============================================================

-- Temporary development policy.
-- These can be replaced with merchant-specific policies
-- after authentication is connected.

create policy "authenticated users can read merchants"
on merchants
for select
to authenticated
using (true);

create policy "authenticated users can read customers"
on customers
for select
to authenticated
using (true);

create policy "authenticated users can read transactions"
on transactions
for select
to authenticated
using (true);

create policy "authenticated users can read checkout sessions"
on checkout_sessions
for select
to authenticated
using (true);

create policy "authenticated users can read subscriptions"
on subscriptions
for select
to authenticated
using (true);

create policy "authenticated users can read opportunities"
on opportunities
for select
to authenticated
using (true);

create policy "authenticated users can read recovery actions"
on recovery_actions
for select
to authenticated
using (true);

create policy "authenticated users can read AI analyses"
on ai_analyses
for select
to authenticated
using (true);

create policy "authenticated users can read audit logs"
on audit_logs
for select
to authenticated
using (true);

