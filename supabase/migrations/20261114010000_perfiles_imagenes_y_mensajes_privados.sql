-- Perfil personal, imágenes en noticias, conteo público de comentarios y
-- mensajes privados entre personas de la red.
--
-- Cuidado de activistas en riesgo: el perfil pide pocos datos, nada es
-- obligatorio y cada persona elige si aparece en la Red y si se le puede
-- escribir. Nunca se muestra el correo: el contacto es por mensaje privado
-- dentro de la app.

-- 1. Perfil personal.
alter table perfiles
  add column cargo text not null default '',
  add column presentacion text not null default '',
  -- 'red': aparece en la Red para organizaciones aprobadas; 'oculto': no aparece.
  add column visible_en_red boolean not null default false,
  add column acepta_mensajes boolean not null default false;

-- Personas de la red, para organizaciones aprobadas y Akãhatã. Sin correos.
create function public.personas_de_la_red()
returns table (id uuid, nombre_visible text, cargo text, presentacion text, organizacion_id uuid, acepta_mensajes boolean)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.nombre_visible, ''), 'Persona sin nombre'), p.cargo, p.presentacion, p.organizacion_id, p.acepta_mensajes
  from perfiles p join organizaciones o on o.id = p.organizacion_id
  where o.aprobada
    and (p.visible_en_red or p.id = auth.uid())
    and (privado.mi_organizacion_aprobada() or privado.es_revisora())
  order by o.nombre, p.nombre_visible;
$$;

-- 2. Imagen de cada noticia (la de la fuente, si tiene).
alter table noticias add column imagen_url text;

-- 3. Cuántos comentarios tiene cada noticia publicada. Lo ve cualquiera
--    (sin el texto), para que se note que hay conversación.
create function public.contar_comentarios()
returns table (noticia_id uuid, cantidad bigint)
language sql stable security definer set search_path = public as $$
  select c.noticia_id, count(*)
  from comentarios c join noticias n on n.id = c.noticia_id
  where not c.borrado and n.estado = 'publicada'
  group by c.noticia_id;
$$;

-- 4. Mensajes privados entre dos personas de organizaciones aprobadas.
create table mensajes_privados (
  id uuid primary key default gen_random_uuid(),
  de uuid not null default auth.uid() references perfiles on delete cascade,
  para uuid not null references perfiles on delete cascade,
  texto text not null check (length(texto) between 1 and 4000),
  leido boolean not null default false,
  creado_en timestamptz not null default now(),
  check (de <> para)
);
create index mensajes_privados_para on mensajes_privados (para, creado_en);
create index mensajes_privados_de on mensajes_privados (de, creado_en);

alter table mensajes_privados enable row level security;

create policy "ver mis mensajes privados" on mensajes_privados
  for select to authenticated using (de = auth.uid() or para = auth.uid());

-- (perfiles solo deja ver el propio, por eso la consulta va en una función.)
create function privado.acepta_mensajes(p_perfil uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.acepta_mensajes and o.aprobada
                   from perfiles p join organizaciones o on o.id = p.organizacion_id
                   where p.id = p_perfil), false);
$$;
grant execute on function privado.acepta_mensajes(uuid) to authenticated;

-- Se puede escribir a quien acepta mensajes, o responder a quien ya escribió.
create policy "escribir mensaje privado" on mensajes_privados
  for insert to authenticated
  with check (
    de = auth.uid()
    and privado.mi_organizacion_aprobada()
    and (
      privado.acepta_mensajes(para)
      or exists (select 1 from mensajes_privados m where m.de = para and m.para = auth.uid())
    )
  );

-- Quien recibe marca como leído.
create policy "marcar leido" on mensajes_privados
  for update to authenticated using (para = auth.uid()) with check (para = auth.uid());

alter publication supabase_realtime add table mensajes_privados;

-- Nombre de quien escribe o recibe, para la lista de conversaciones
-- (aunque no aparezca en la Red).
create function public.nombres_de_mis_conversaciones()
returns table (id uuid, nombre_visible text, organizacion_id uuid)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.nombre_visible, ''), 'Persona sin nombre'), p.organizacion_id
  from perfiles p
  where p.id in (
    select para from mensajes_privados where de = auth.uid()
    union select de from mensajes_privados where para = auth.uid()
  );
$$;
