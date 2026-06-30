-- Agregación server-side para /visitantes (proyecto Supabase `uap-codex`).
--
-- Problema que resuelve: el panel traía las filas crudas de `visits_daily` y
-- `visits_pages_daily` (sin límite) y agregaba en el cliente. PostgREST corta
-- en 1000 filas por defecto, así que a medida que crecen las tablas
-- (día × país, día × ruta) la agregación se truncaba en silencio y los totales
-- y el "top de páginas" quedaban mal. Estas funciones agregan en el servidor y
-- devuelven conjuntos acotados (nº de países, top-N de páginas, nº de días).
--
-- `p_since` = fecha de corte inclusiva (UTC). NULL = todo el histórico.
-- Solo lectura (STABLE); SECURITY DEFINER + grant a anon/authenticated, igual
-- que el resto del módulo. Las tablas ya tienen RLS de select público.

-- Visitas por país en el periodo.
create or replace function public.visits_country_agg(p_since date default null)
returns table(country text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select country, sum(count)::bigint as count
  from public.visits_daily
  where p_since is null or day >= p_since
  group by country
  order by sum(count) desc
$$;

-- Totales por día en el periodo (tendencia, pico, promedio).
create or replace function public.visits_day_agg(p_since date default null)
returns table(day date, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select day, sum(count)::bigint as count
  from public.visits_daily
  where p_since is null or day >= p_since
  group by day
  order by day asc
$$;

-- Top-N de páginas más visitadas en el periodo.
create or replace function public.visits_pages_agg(
  p_since date default null,
  p_limit int default 50
)
returns table(path text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select path, sum(count)::bigint as count
  from public.visits_pages_daily
  where p_since is null or day >= p_since
  group by path
  order by sum(count) desc
  limit greatest(1, least(p_limit, 200))
$$;

-- Suscriptores activos por día en el periodo.
create or replace function public.subscriber_day_agg(p_since date default null)
returns table(day date, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select day, sum(count)::bigint as count
  from public.subscriber_active_daily
  where p_since is null or day >= p_since
  group by day
  order by day asc
$$;

revoke all on function public.visits_country_agg(date) from public;
revoke all on function public.visits_day_agg(date) from public;
revoke all on function public.visits_pages_agg(date, int) from public;
revoke all on function public.subscriber_day_agg(date) from public;
grant execute on function public.visits_country_agg(date) to anon, authenticated;
grant execute on function public.visits_day_agg(date) to anon, authenticated;
grant execute on function public.visits_pages_agg(date, int) to anon, authenticated;
grant execute on function public.subscriber_day_agg(date) to anon, authenticated;

-- Forzar el reload del schema-cache de PostgREST: sin esto, justo tras aplicar
-- la migración las RPCs nuevas pueden no exponerse aún (404) y el panel cae a
-- estado "error" hasta el siguiente reload automático.
notify pgrst, 'reload schema';
