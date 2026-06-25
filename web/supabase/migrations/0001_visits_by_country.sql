-- Contador de visitas por país (proyecto Supabase `uap-codex`).
-- Aplicada vía MCP el 2026-06-24. Este archivo queda como registro/reproducible.
--
-- Diseño: la web (anon key) SOLO puede LEER la tabla (RLS select público) y
-- llamar a `increment_visit(cc)`, que hace el upsert atómico con SECURITY
-- DEFINER. No se exponen INSERT/UPDATE directos. Se guarda únicamente el país
-- agregado, nunca IPs.

create table if not exists public.visits_by_country (
  country    text primary key,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.visits_by_country enable row level security;

drop policy if exists "visits_public_read" on public.visits_by_country;
create policy "visits_public_read"
  on public.visits_by_country
  for select
  using (true);

create or replace function public.increment_visit(cc text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(coalesce(cc, 'XX'));
begin
  if code !~ '^[A-Z]{2}$' then
    code := 'XX';
  end if;
  insert into public.visits_by_country as v (country, count, updated_at)
  values (code, 1, now())
  on conflict (country) do update
    set count = v.count + 1,
        updated_at = now();
end;
$$;

revoke all on function public.increment_visit(text) from public;
grant execute on function public.increment_visit(text) to anon, authenticated;
