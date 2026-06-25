-- Presencia de suscriptores (usuarios autenticados) que entran al sitio.
-- Aplicada vía MCP el 2026-06-25. Este archivo queda como registro/reproducible.
--
-- Privacidad: `subscriber_seen` es PRIVADA (RLS habilitada y SIN policy → nadie
-- la lee vía API; solo la función SECURITY DEFINER la usa para deduplicar por
-- día). El agregado `subscriber_active_daily` es de lectura pública pero solo
-- expone CONTEOS, nunca identidades ni emails.

create table if not exists public.subscriber_seen (
  day     date not null default current_date,
  user_id uuid not null,
  primary key (day, user_id)
);

create table if not exists public.subscriber_active_daily (
  day        date primary key default current_date,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.subscriber_seen enable row level security; -- sin policy: privada
alter table public.subscriber_active_daily enable row level security;

drop policy if exists "public read subscriber_active_daily" on public.subscriber_active_daily;
create policy "public read subscriber_active_daily"
  on public.subscriber_active_daily for select using (true);

-- Marca al suscriptor actual como activo hoy (idempotente por día). No-op si la
-- llamada no lleva sesión (visitante anónimo → auth.uid() es null).
create or replace function public.mark_subscriber_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;

  insert into public.subscriber_seen (day, user_id)
  values (current_date, uid)
  on conflict (day, user_id) do nothing;

  if found then
    insert into public.subscriber_active_daily as a (day, count, updated_at)
    values (current_date, 1, now())
    on conflict (day) do update
      set count = a.count + 1, updated_at = now();
  end if;
end;
$$;

-- Total de suscriptores registrados (solo el número, sin exponer identidades).
create or replace function public.subscriber_total()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint from auth.users;
$$;

revoke all on function public.mark_subscriber_seen() from public;
revoke all on function public.subscriber_total() from public;
grant execute on function public.mark_subscriber_seen() to anon, authenticated;
grant execute on function public.subscriber_total() to anon, authenticated;
