-- País resuelto server-side vía Cloudflare (proyecto Supabase `uap-codex`).
-- Aplicada vía MCP el 2026-07-12. Este archivo queda como registro/reproducible.
--
-- Descubrimiento (diagnóstico del 12 jul 2026): la API de Supabase pasa por
-- Cloudflare y cada petición llega a PostgREST con `cf-ipcountry` (país del
-- visitante ya resuelto en el edge) y `cf-connecting-ip` (IP real del
-- cliente). Eso permite:
--   1. Tomar el PAÍS del header en vez de confiar en el `cc` que envía el
--      cliente — el cliente lo calculaba con proveedores geo-IP gratuitos
--      (timeouts, rate-limits, adblockers → visitas "XX") y además era
--      falseable llamando al RPC con cualquier `cc`. El valor del cliente
--      queda solo como fallback si el header faltara.
--   2. Usar `cf-connecting-ip` como fuente primaria de IP para el hash del
--      dedup (más limpia que el primer elemento de x-forwarded-for).
--
-- El beacon cliente sigue consultando geo-IP, pero ya solo importa para la
-- señal de datacenter (org/ISP), que no viene en los headers.

-- País de la petición según Cloudflare. NULL si no hay contexto PostgREST,
-- el header falta o trae un valor no-país ('XX' = desconocido; 'T1' = Tor,
-- que ya no pasa la regex).
create or replace function public._request_country()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  hdrs json;
  cc   text;
begin
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    return null;
  end;
  if hdrs is null then
    return null;
  end if;
  cc := upper(coalesce(hdrs->>'cf-ipcountry', ''));
  if cc ~ '^[A-Z]{2}$' and cc <> 'XX' then
    return cc;
  end if;
  return null;
end;
$$;

revoke all on function public._request_country() from public;
-- Sin grant: interna, la llama increment_visit (SECURITY DEFINER, mismo owner).

-- _tracking_allowed: idéntica a 0005 salvo la fuente de IP, que ahora
-- prefiere cf-connecting-ip.
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

  ua := coalesce(hdrs->>'user-agent', '');
  if ua = '' or ua ~* 'bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|python|scrapy|curl|wget|okhttp|go-http|axios|libwww|httpclient|java/|monitor|uptime|pingdom|statuscake|datadog' then
    return false;
  end if;

  ip := trim(split_part(coalesce(hdrs->>'cf-connecting-ip', hdrs->>'x-forwarded-for', hdrs->>'x-real-ip', ''), ',', 1));
  if ip = '' then
    return true;
  end if;

  select salt into s from tracking_salt where id = 1;
  h := encode(extensions.digest(ip || '|' || s || '|' || current_date::text, 'sha256'), 'hex');

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

  if p_kind = 'visit' then
    return row_visits <= 1;
  end if;
  return row_pages <= 50;
end;
$$;

-- increment_visit: el país del servidor manda; el cc del cliente es fallback.
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
end;
$$;

notify pgrst, 'reload schema';
