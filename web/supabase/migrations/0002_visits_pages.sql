-- Páginas más visitadas (proyecto Supabase `uap-codex`).
-- Aplicada vía MCP el 2026-06-25. Este archivo queda como registro/reproducible.
--
-- Mismo diseño que el contador de país: la web (anon key) SOLO puede LEER las
-- tablas (RLS select público) y llamar a `increment_page(p)`, que hace el upsert
-- atómico con SECURITY DEFINER. Se guarda únicamente la ruta pública agregada
-- (sin query string, sin hash), nunca IPs ni datos personales.
--
-- `visits_by_path`   = total acumulado por ruta.
-- `visits_pages_daily` = total por (día, ruta), para filtrar por periodo.

create table if not exists public.visits_by_path (
  path       text primary key,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.visits_pages_daily (
  day   date   not null default current_date,
  path  text   not null,
  count bigint not null default 0,
  primary key (day, path)
);

alter table public.visits_by_path enable row level security;
alter table public.visits_pages_daily enable row level security;

drop policy if exists "public read visits_by_path" on public.visits_by_path;
create policy "public read visits_by_path"
  on public.visits_by_path for select using (true);

drop policy if exists "public read visits_pages_daily" on public.visits_pages_daily;
create policy "public read visits_pages_daily"
  on public.visits_pages_daily for select using (true);

create or replace function public.increment_page(p text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  norm text := split_part(split_part(coalesce(p, '/'), '?', 1), '#', 1);
begin
  if norm = '' then norm := '/'; end if;
  if left(norm, 1) <> '/' then norm := '/' || norm; end if;
  if length(norm) > 1 then
    norm := regexp_replace(norm, '/+$', '');
    if norm = '' then norm := '/'; end if;
  end if;
  norm := left(norm, 200);

  insert into public.visits_by_path as v (path, count, updated_at)
  values (norm, 1, now())
  on conflict (path) do update
    set count = v.count + 1,
        updated_at = now();

  insert into public.visits_pages_daily as d (day, path, count)
  values (current_date, norm, 1)
  on conflict (day, path) do update
    set count = d.count + 1;
end;
$$;

revoke all on function public.increment_page(text) from public;
grant execute on function public.increment_page(text) to anon, authenticated;
