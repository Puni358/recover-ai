-- Add merchant-level execution mode configuration.
-- Existing merchants remain safe in simulation mode.

alter table public.merchants
add column if not exists execution_mode execution_mode
not null default 'SIMULATION';
