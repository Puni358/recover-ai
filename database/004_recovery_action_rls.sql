-- ============================================================
-- RECOVERY ACTION + AUDIT RLS
-- ============================================================

-- ------------------------------------------------------------
-- RECOVERY ACTIONS
-- ------------------------------------------------------------

drop policy if exists "users can insert recovery actions"
on recovery_actions;

create policy "users can insert recovery actions"
on recovery_actions
for insert
to authenticated
with check (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);


drop policy if exists "users can update recovery actions"
on recovery_actions;

create policy "users can update recovery actions"
on recovery_actions
for update
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
)
with check (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);


-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------

drop policy if exists "users can insert audit logs"
on audit_logs;

create policy "users can insert audit logs"
on audit_logs
for insert
to authenticated
with check (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);


-- Allow the authenticated merchant to update its own
-- audit records if needed later.
drop policy if exists "users can update audit logs"
on audit_logs;

create policy "users can update audit logs"
on audit_logs
for update
to authenticated
using (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
)
with check (
  merchant_id in (
    select id
    from merchants
    where user_id = auth.uid()
  )
);
