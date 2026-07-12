-- Blindaje server-side del tracking (proyecto Supabase `uap-codex`).
-- Aplicada vía MCP el 2026-07-12. Este archivo queda como registro/reproducible.
--
-- Problema que resuelve: todo el filtrado anti-bot vivía en el CLIENTE
-- (`VisitorBeacon.tsx`), así que (a) cualquier cliente con la anon key podía
-- llamar `increment_visit`/`increment_page` directo por RPC saltándose todo, y
-- (b) un crawler con Chrome "de verdad" (ventana real, UA normal) pasaba el
-- filtro de UA y el gate de engagement — el patrón de las visitas diarias
-- constantes desde Singapur (jul 2026). Además el dedup era por pestaña
-- (`sessionStorage`), de modo que el contador medía sesiones, no visitantes.
--
-- Defensas añadidas (todas dentro de las funciones SECURITY DEFINER, invisibles
-- e inescapables para el cliente):
--   1. Filtro de user-agent server-side (bots honestos y clientes HTTP crudos).
--   2. Dedup por día e IP HASHEADA: 1 visita/día por IP, tope de 50 pageviews/
--      día por IP. Nunca se guarda la IP cruda — solo
--      sha256(ip | salt | día), y las filas se purgan a los 2 días.
--   3. Exención del dueño autenticado (`tracking_exempt`): no depende del
--      localStorage del dispositivo.
--
-- Privacidad: mismo contrato que el resto del módulo — sin IPs crudas, sin
-- identificadores persistentes. El hash usa un salt secreto (tabla sin policies
-- de lectura) + la fecha, así que ni siquiera es correlacionable entre días.

create extension if not exists pgcrypto with schema extensions;

-- Salt secreto para el hash de IP. RLS sin policies: ilegible para anon/
-- authenticated; solo las funciones SECURITY DEFINER (owner) lo leen.
create table if not exists public.tracking_salt (
  id   int  primary key default 1 check (id = 1),
  salt text not null
);
alter table public.tracking_salt enable row level security;

insert into public.tracking_salt (id, salt)
values (1, encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (id) do nothing;

-- Dedup efímero por (día, hash de IP). Se purga oportunistamente en cada
-- llamada (day < hoy - 1), así nunca acumula histórico.
create table if not exists public.visit_dedup (
  day     date not null,
  ip_hash text not null,
  visits  int  not null default 0,
  pages   int  not null default 0,
  primary key (day, ip_hash)
);
alter table public.visit_dedup enable row level security;

-- Usuarios exentos de tracking (el dueño). Se administra a mano por SQL/MCP;
-- RLS sin policies = invisible e inmodificable desde la web.
create table if not exists public.tracking_exempt (
  user_id uuid primary key
);
alter table public.tracking_exempt enable row level security;

-- Consulta del cliente: ¿mi sesión está exenta? El beacon la usa para activar
-- el opt-out local (`uap-notrack`) automáticamente en cualquier dispositivo
-- donde el dueño inicie sesión.
create or replace function public.is_tracking_exempt()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tracking_exempt where user_id = auth.uid()
  );
$$;

revoke all on function public.is_tracking_exempt() from public;
grant execute on function public.is_tracking_exempt() to authenticated;

-- Gate central: decide si esta petición debe contar. `p_kind` = 'visit'|'page'.
-- Devuelve true si hay que contar. Falla ABIERTO (cuenta) cuando no hay
-- contexto PostgREST (p. ej. SQL directo de mantención) o no llega IP: mejor
-- un falso positivo ocasional que romper el conteo entero.
create or replace function public._tracking_allowed(p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hdrs       json;
  ua         text;
  ip         text;
  s          text;
  h          text;
  row_visits int;
  row_pages  int;
begin
  -- Dueño autenticado: exento aunque el localStorage del dispositivo se pierda.
  if auth.uid() is not null and exists (
    select 1 from tracking_exempt where user_id = auth.uid()
  ) then
    return false;
  end if;

  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    hdrs := null;
  end;
  if hdrs is null then
    return true;
  end if;

  -- Filtro de UA server-side: bots declarados y clientes HTTP crudos que
  -- llaman al RPC directo (curl, python-requests, etc.) sin pasar por la web.
  ua := coalesce(hdrs->>'user-agent', '');
  if ua = '' or ua ~* 'bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|python|scrapy|curl|wget|okhttp|go-http|axios|libwww|httpclient|java/|monitor|uptime|pingdom|statuscake|datadog' then
    return false;
  end if;

  -- IP del cliente: primer elemento de x-forwarded-for (lo pone el edge de
  -- Supabase; el cliente no puede falsearlo hacia atrás).
  ip := trim(split_part(coalesce(hdrs->>'x-forwarded-for', hdrs->>'x-real-ip', ''), ',', 1));
  if ip = '' then
    return true;
  end if;

  select salt into s from tracking_salt where id = 1;
  h := encode(extensions.digest(ip || '|' || s || '|' || current_date::text, 'sha256'), 'hex');

  -- Purga oportunista: la tabla solo retiene hoy y ayer.
  delete from visit_dedup where day < current_date - 1;

  insert into visit_dedup as d (day, ip_hash, visits, pages)
  values (
    current_date, h,
    case when p_kind = 'visit' then 1 else 0 end,
    case when p_kind = 'page'  then 1 else 0 end
  )
  on conflict (day, ip_hash) do update
    set visits = d.visits + case when excluded.visits > 0 then 1 else 0 end,
        pages  = d.pages  + case when excluded.pages  > 0 then 1 else 0 end
  returning visits, pages into row_visits, row_pages;

  -- 1 visita por IP y día (visitantes únicos diarios); tope de pageviews por
  -- IP y día para que un crawler recorriendo el corpus no distorsione el top.
  if p_kind = 'visit' then
    return row_visits <= 1;
  end if;
  return row_pages <= 50;
end;
$$;

revoke all on function public._tracking_allowed(text) from public;
-- Sin grant a anon/authenticated: es interna, solo la llaman las funciones de
-- abajo (SECURITY DEFINER del mismo owner).

-- Redefinición de increment_visit: mismo contrato hacia el cliente, pero ahora
-- pasa por el gate. (Cuerpo original en 0001/0003 — suma a visits_by_country y
-- visits_daily.)
create or replace function public.increment_visit(cc text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(coalesce(cc, 'XX'));
begin
  if not public._tracking_allowed('visit') then
    return;
  end if;

  if code !~ '^[A-Z]{2}$' then
    code := 'XX';
  end if;

  insert into public.visits_by_country as v (country, count, updated_at)
  values (code, 1, now())
  on conflict (country) do update
    set count = v.count + 1,
        updated_at = now();

  insert into public.visits_daily as d (day, country, count)
  values (current_date, code, 1)
  on conflict (day, country) do update
    set count = d.count + 1;
end;
$$;

-- Redefinición de increment_page: idem, con el gate de 'page'.
create or replace function public.increment_page(p text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  norm text := split_part(split_part(coalesce(p, '/'), '?', 1), '#', 1);
begin
  if not public._tracking_allowed('page') then
    return;
  end if;

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

notify pgrst, 'reload schema';
