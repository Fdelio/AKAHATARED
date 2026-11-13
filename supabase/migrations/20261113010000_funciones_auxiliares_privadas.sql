-- Las funciones auxiliares de permisos no tienen que estar expuestas en la API
-- pública (/rest/v1/rpc). Se mueven a un esquema "privado"; las políticas de
-- seguridad las siguen usando igual.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated;
alter function public.es_revisora() set schema privado;
alter function public.mi_organizacion() set schema privado;
alter function privado.es_revisora() set search_path = public;
alter function privado.mi_organizacion() set search_path = public;
grant execute on function privado.es_revisora() to anon, authenticated;
grant execute on function privado.mi_organizacion() to anon, authenticated;
