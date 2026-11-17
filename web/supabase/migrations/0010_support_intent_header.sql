-- Acepta el origen «header» en la intención de apoyo (proyecto `uap-codex`).
--
-- El 17 nov 2026 el botón destacado de la barra superior («Ver probabilidades»,
-- 9 vistas en 30 días) pasó a ser «Apoya UAP Codex» por decisión del dueño, y
-- su clic se cuenta aparte para comparar con el pie y Metodología. Sin este
-- cambio la función lo guardaba como 'other'. Solo cambia esa lista; el resto
-- del cuerpo es idéntico a 0009.

create or replace function public.increment_support_intent(p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  src  text := case when p_source in ('footer', 'about', 'header') then p_source else 'other' end;
  hdrs json;
  ua   text;
  ip   text;
  s    text;
  h    text;
  n    int;
begin
  if auth.uid() is not null and exists (
    select 1 from tracking_exempt where user_id = auth.uid()
  ) then
    return;
  end if;

  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    hdrs := null;
  end;

  if hdrs is not null then
    ua := coalesce(hdrs->>'user-agent', '');
    if ua = '' or ua ~* 'bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|python|scrapy|curl|wget|okhttp|go-http|axios|libwww|httpclient|java/|monitor|uptime|pingdom|statuscake|datadog' then
      return;
    end if;

    ip := trim(split_part(coalesce(hdrs->>'x-forwarded-for', hdrs->>'x-real-ip', ''), ',', 1));
    if ip <> '' then
      select salt into s from tracking_salt where id = 1;
      h := encode(extensions.digest(ip || '|' || s || '|' || current_date::text, 'sha256'), 'hex');
      delete from support_intent_dedup where day < current_date - 1;
      insert into support_intent_dedup (day, ip_hash) values (current_date, h)
      on conflict do nothing;
      get diagnostics n = row_count;
      if n = 0 then
        return; -- esta IP ya marcó su intención hoy
      end if;
    end if;
  end if;

  insert into public.support_intent as t (day, source, clicks)
  values (current_date, src, 1)
  on conflict (day, source) do update set clicks = t.clicks + 1;
end;
$$;

notify pgrst, 'reload schema';
