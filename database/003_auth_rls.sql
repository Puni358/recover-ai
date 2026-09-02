-- RecoverAI
-- Migration 003: Authentication-aware Row Level Security
--
-- Every authenticated user can only access data belonging
-- to their own merchant account.

-- ============================================================
-- 1. Ensure merchants are linked to Supabase Auth
-- ============================================================

alter table merchants
add column if not exists user_id uuid
references auth.users(id)
on delete cascade;

-- ============================================================
-- 2. Merchant policy
-- ============================================================

drop policy if exists "authenticated users can read merchants"
on merchants;

drop policy if exists "users can read their merchant"
on merchants;

create policy "users can read their merchant"
on merchants
for select
to authenticated
using (
  user_id = auth.uid()
);

-- ============================================================
-- 3. Customers
-- ============================================================

drop policy if exists "authenticated users can read customers"
on customers;

create policy "users can read their customers"
on customers
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 4. Transactions
-- ============================================================

drop policy if exists "authenticated users can read transactions"
on transactions;

create policy "users can read their transactions"
on transactions
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 5. Checkout Sessions
-- ============================================================

drop policy if exists "authenticated users can read checkout_sessions"
on checkout_sessions;

create policy "users can read their checkout sessions"
on checkout_sessions
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 6. Subscriptions
-- ============================================================

drop policy if exists "authenticated users can read subscriptions"
on subscriptions;

create policy "users can read their subscriptions"
on subscriptions
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 7. Opportunities
-- ============================================================

drop policy if exists "authenticated users can read opportunities"
on opportunities;

create policy "users can read their opportunities"
on opportunities
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 8. Recovery Actions
-- ============================================================

drop policy if exists "authenticated users can read recovery_actions"
on recovery_actions;

create policy "users can read their recovery actions"
on recovery_actions
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 9. AI Analyses
-- ============================================================

drop policy if exists "authenticated users can read ai_analyses"
on ai_analyses;

create policy "users can read their ai analyses"
on ai_analyses
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);

-- ============================================================
-- 10. Audit Logs
-- ============================================================

drop policy if exists "authenticated users can read audit_logs"
on audit_logs;

create policy "users can read their audit logs"
on audit_logs
for select
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);
