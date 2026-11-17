-- Intención de apoyo: cuenta los clics en «Apoya UAP Codex» (proyecto `uap-codex`).
--
-- Por qué existe (17 nov 2026, decisión del dueño): antes de abrir aportes de
-- lectores se mide cuánta gente estaría dispuesta. El botón no cobra nada: al
-- pulsarlo agradece la intención y dice que los aportes aún no están abiertos.
-- Esta tabla guarda solo el conteo por día y por lugar del botón.
--
-- Mismas defensas que el contador de visitas (0005-0007), en una función propia
-- para no tocar `_tracking_allowed`:
--   * cuenta del dueño exenta (`tracking_exempt`);
--   * filtro de user-agent de bots y clientes HTTP crudos;
--   * como mucho una intención por IP y día, con la IP hasheada (sha256 con el
--     salt secreto y la fecha) y purgada a los dos días; nunca la IP cruda.
-- Si falta el contexto de PostgREST o la IP, falla ABIERTO, igual que el gate
-- de visitas: se cuenta.

create table if not exists public.support_intent (
  day    date not null,
  source text not null,
  clicks int  not null default 0,
  primary key (day, source)
);

create table if not exists public.support_intent_dedup (
  day     date not null,
  ip_hash text not null,
  primary key (day, ip_hash)
);

alter table public.support_intent enable row level security;
alter table public.support_intent_dedup enable row level security;

-- El conteo es público (se muestra en /visitantes); la tabla de dedup no.
drop policy if exists "public read support_intent" on public.support_intent;
create policy "public read support_intent"
  on public.support_intent for select using (true);

create or replace function public.increment_support_intent(p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  src  text := case when p_source in ('footer', 'about') then p_source else 'other' end;
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

revoke all on function public.increment_support_intent(text) from public;
grant execute on function public.increment_support_intent(text) to anon, authenticated;

notify pgrst, 'reload schema';
