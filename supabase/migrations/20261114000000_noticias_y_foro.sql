-- Noticias de los espacios internacionales de derechos humanos, con foro.
--
-- 1. "noticias": notas y artículos recolectados cada día de varias fuentes
--    (o escritos por Akãhatã). Entran como "pendiente" y solo se ven en la app
--    cuando Akãhatã las publica. Se guarda título, resumen y enlace.
-- 2. "comentarios": el foro de cada noticia. Solo para organizaciones
--    aprobadas y Akãhatã; se firma con el nombre de la organización.
--    Borrar = marcar (sin DELETE, como en el chat).
-- 3. Recolección diaria con pg_cron (función recolectar-noticias), con la
--    misma autorización que la recolección del radar.

create table noticias (
  id uuid primary key default gen_random_uuid(),
  clave_fuente text unique,
  titulo text not null,
  resumen text not null default '',
  -- Comentario de Akãhatã: por qué importa para la red, cómo sumar la agenda.
  comentario_akahata text not null default '',
  url text,
  fuente_nombre text not null default 'Akãhatã',
  tipo text not null default 'noticia' check (tipo in ('noticia', 'articulo', 'nota_akahata')),
  sistema sistema,
  idioma text not null default 'es',
  publicada_en timestamptz not null default now(),
  estado estado_revision not null default 'pendiente',
  recolectada_automaticamente boolean not null default false,
  creada_en timestamptz not null default now()
);
create index noticias_estado_fecha on noticias (estado, publicada_en desc);

alter table noticias enable row level security;

create policy "todas ven las noticias publicadas" on noticias
  for select to anon, authenticated using (estado = 'publicada' or privado.es_revisora());
create policy "revisoras cargan noticias" on noticias
  for insert to authenticated with check (privado.es_revisora());
create policy "revisoras revisan noticias" on noticias
  for update to authenticated using (privado.es_revisora());

create table comentarios (
  id uuid primary key default gen_random_uuid(),
  noticia_id uuid not null references noticias on delete cascade,
  organizacion_id uuid not null references organizaciones on delete cascade,
  autor uuid default auth.uid() references auth.users on delete set null,
  texto text not null check (length(texto) between 1 and 4000),
  borrado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index comentarios_noticia on comentarios (noticia_id, creado_en);
create index comentarios_organizacion on comentarios (organizacion_id);
create index comentarios_autor on comentarios (autor);

alter table comentarios enable row level security;

create policy "la red lee el foro" on comentarios
  for select to authenticated
  using (privado.mi_organizacion_aprobada() or privado.es_revisora());
create policy "comentar" on comentarios
  for insert to authenticated
  with check (
    autor = auth.uid()
    and organizacion_id = privado.mi_organizacion()
    and privado.mi_organizacion_aprobada()
  );
create policy "borrar comentarios" on comentarios
  for update to authenticated
  using (autor = auth.uid() or privado.es_revisora())
  with check (borrado and texto = 'Comentario borrado');

-- 3. Todos los días a las 7:30 de Buenos Aires (10:30 UTC). Copia la llamada
--    del trabajo 'recolectar-radar' cambiando solo el nombre de la función.
select cron.schedule(
  'recolectar-noticias',
  '30 10 * * *',
  replace(command, '/functions/v1/recolectar''', '/functions/v1/recolectar-noticias''')
)
from cron.job where jobname = 'recolectar-radar';
