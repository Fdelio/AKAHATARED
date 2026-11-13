-- Recolección automática del radar, todos los días a las 7:00 de Buenos Aires
-- (10:00 UTC). Llama a la Edge Function "recolectar", que deja las
-- convocatorias nuevas como "pendientes" para que Akãhatã las revise.
--
-- La clave que va en el encabezado es la clave pública (anon) del proyecto:
-- es la misma que usa la app en el navegador, no es secreta.

create extension if not exists pg_cron;

select cron.schedule(
  'recolectar-radar',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://ttdkjdgqhwvvxdfpqsfm.supabase.co/functions/v1/recolectar',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZGtqZGdxaHd2dnhkZnBxc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1Nzg4MjEsImV4cCI6MjExMDE1NDgyMX0.8qzeVZ0v6YVL2s8TuKRUzh-5TOUiifuH5zzFQougD2w',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
