-- Origen de las visitas: dominio de procedencia por día (proyecto `uap-codex`).
--
-- Por qué existe (20 nov 2026, decisión del dueño): el contador guardaba país y
-- página, pero no de qué sitio llega el lector. GA4 sí lo ve, pero solo de
-- quien acepta cookies. Aquí se guarda SOLO el dominio (google.com, chatgpt.com,
-- x.com…) o «directo», agregado por día: nunca la URL completa, la ruta, la
-- query ni nada personal, así que no necesita consentimiento.
--
-- El origen se cuenta una vez por visita, dentro de `increment_visit`, con el
-- mismo gate que el país (`_tracking_allowed('visit')`: dueño exento, UA de
-- bots, una visita por IP hasheada y día). El cliente manda `document.referrer`
-- de la página de entrada; la normalización a dominio se hace AQUÍ, en el
-- servidor, para que un cliente no pueda escribir texto libre en la tabla.

create table if not exists public.visits_referrer_daily (
  day    date   not null default current_date,
  domain text   not null,
  count  bigint not null default 0,
  primary key (day, domain)
);

alter table public.visits_referrer_daily enable row level security;

drop policy if exists "public read visits_referrer_daily" on public.visits_referrer_daily;
create policy "public read visits_referrer_daily"
  on public.visits_referrer_daily for select using (true);

-- URL de procedencia → dominio. Vacío o del propio sitio → 'directo'. Lo que no
-- parezca un host válido → 'otro'.
create or replace function public._referrer_domain(ref text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  host text;
begin
  if ref is null or btrim(ref) = '' then
    return 'directo';
  end if;
  -- android-app://com.google.android.gm/ → com.google.android.gm
  host := lower(split_part(split_part(split_part(btrim(ref), '://', 2), '/', 1), '?', 1));
  host := regexp_replace(host, '^.*@', '');                                    -- sin credenciales
  host := split_part(host, ':', 1);                                           -- sin puerto
  host := regexp_replace(host, '^(www|m|l|lm)\.', '');
  if host = '' or host !~ '^[a-z0-9.-]{1,100}$' or host !~ '\.' then
    return 'otro';
  end if;
  if host in ('uapcodex.org', 'dgonzamat.github.io') then
    return 'directo';
  end if;
  return host;
end;
$$;

revoke all on function public._referrer_domain(text) from public;
revoke execute on function public._referrer_domain(text) from anon, authenticated;

-- increment_visit con origen. Se reemplaza la firma de un argumento por una de
-- dos con `ref` opcional (dos firmas a la vez harían ambigua la llamada {cc} en
-- PostgREST). Los clientes con la versión vieja en caché siguen llamando con
-- {cc}: cuentan la visita y no registran origen, para no inflar 'directo' con
-- visitas cuyo origen se desconoce.
drop function if exists public.increment_visit(text);

create or replace function public.increment_visit(cc text, ref text default null)
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
  code := coalesce(public._request_country(), code);

  insert into public.visits_by_country as v (country, count, updated_at)
  values (code, 1, now())
  on conflict (country) do update
    set count = v.count + 1,
        updated_at = now();

  insert into public.visits_daily as d (day, country, count)
  values (current_date, code, 1)
  on conflict (day, country) do update
    set count = d.count + 1;

  if ref is not null then
    insert into public.visits_referrer_daily as r (day, domain, count)
    values (current_date, public._referrer_domain(ref), 1)
    on conflict (day, domain) do update
      set count = r.count + 1;
  end if;
end;
$$;

revoke all on function public.increment_visit(text, text) from public;
grant execute on function public.increment_visit(text, text) to anon, authenticated;

-- Agregado por dominio en el periodo, para /visitantes.
create or replace function public.visits_referrer_agg(p_since date default null)
returns table(domain text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select domain, sum(count)::bigint as count
  from public.visits_referrer_daily
  where p_since is null or day >= p_since
  group by domain
  order by sum(count) desc
$$;

grant execute on function public.visits_referrer_agg(date) to anon, authenticated;

notify pgrst, 'reload schema';
