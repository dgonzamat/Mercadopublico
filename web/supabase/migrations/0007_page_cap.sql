-- Baja el tope de pageviews por IP y día de 50 a 15 (proyecto `uap-codex`).
--
-- Problema que resuelve: el tope de 50 de 0005 era tan alto que no filtraba
-- nada real. Auditoría del 19-20 jul 2026 sobre `visit_dedup`:
--
--   páginas/IP en el día | IPs | páginas
--   1-3                  |  19 |  21
--   4-25                 |   0 |   0     <-- hueco: no hay zona gris
--   26+                  |   1 |  28
--
-- Una sola IP produjo más páginas (28) que los 19 lectores humanos juntos (21),
-- y pasó holgada bajo el tope de 50. La distribución es bimodal, así que
-- cualquier corte dentro del hueco separa sin falsos positivos; 15 es el centro
-- (5x el máximo humano observado) y deja margen para un lector muy enganchado.
--
-- Solo cambia ese literal: el resto del cuerpo es idéntico a 0005. No toca datos
-- históricos — las filas ya contadas se conservan.

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
  return row_pages <= 15;
end;
$$;

revoke all on function public._tracking_allowed(text) from public;

notify pgrst, 'reload schema';
