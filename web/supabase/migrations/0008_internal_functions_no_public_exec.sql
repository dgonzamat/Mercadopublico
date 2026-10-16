-- Quita EXECUTE a `anon` y `authenticated` en las dos funciones internas del
-- gate de visitas (proyecto `uap-codex`).
--
-- Problema que resuelve: `_tracking_allowed` y `_request_country` son SECURITY
-- DEFINER y solo las llaman `increment_visit` e `increment_page`, pero tenían
-- EXECUTE para `anon` y `authenticated` (aviso del revisor de seguridad de
-- Supabase). Con la anon key, que viaja en el bundle, cualquiera podía llamarlas
-- directo por /rest/v1/rpc: `_tracking_allowed` escribe en `visit_dedup`, así
-- que una llamada suelta gastaba el cupo diario de una IP sin contar visita.
--
-- Por qué no rompe el contador: los dos llamadores son SECURITY DEFINER con
-- dueño `postgres`, y la comprobación de EXECUTE de una función llamada desde
-- otra se hace con el rol del dueño del llamador, que conserva el permiso. No
-- había GRANT a PUBLIC (acl verificada el 16 oct 2026), así que basta con
-- revocar a los dos roles de la API. `create or replace` posteriores conservan
-- la acl.

revoke execute on function public._tracking_allowed(text) from anon, authenticated;
revoke execute on function public._request_country() from anon, authenticated;
