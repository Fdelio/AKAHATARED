-- Red de Incidencia de Akãhatã: esquema inicial.
--
-- Tablas:
--   organizaciones   organizaciones de la red
--   perfiles         cada persona usuaria, ligada a una organización; rol "revisora" = equipo de Akãhatã
--   oportunidades    convocatorias de la ONU, la OEA y el Mercosur (recolectadas o cargadas a mano)
--   participaciones  qué organización se sumó a qué oportunidad, con quién lo puede ver y el resultado
--
-- Seguridad: Row Level Security en todas las tablas. La visibilidad de cada
-- participación ("publica", "red", "solo_akahata") la decide la organización,
-- porque hay activistas en contextos de riesgo.

create extension if not exists pgcrypto;

create type sistema as enum ('ONU', 'OEA', 'Mercosur');
create type estado_revision as enum ('pendiente', 'publicada', 'descartada');
create type visibilidad as enum ('publica', 'red', 'solo_akahata');
create type rol as enum ('miembro', 'revisora');

create table organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  pais text not null,
  temas text[] not null default '{}',
  ofrece text not null default '',
  necesita text not null default '',
  creada_en timestamptz not null default now()
);

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  organizacion_id uuid references organizaciones on delete set null,
  nombre_visible text,
  rol rol not null default 'miembro',
  creado_en timestamptz not null default now()
);

create table oportunidades (
  id uuid primary key default gen_random_uuid(),
  sistema sistema not null,
  mecanismo text not null,
  titulo text not null,
  pais text not null default 'Regional',
  tema text not null,
  resumen text not null default '',
  angulo_agenda text not null default '',
  pasos text[] not null default '{}',
  fecha_limite date not null,
  fuente_nombre text not null,
  fuente_url text,
  -- Para no cargar dos veces la misma convocatoria al recolectar.
  clave_fuente text unique,
  estado estado_revision not null default 'pendiente',
  recolectada_automaticamente boolean not null default false,
  revisada_por uuid references perfiles,
  revisada_en timestamptz,
  creada_en timestamptz not null default now()
);
create index oportunidades_estado_fecha on oportunidades (estado, fecha_limite);

create table participaciones (
  oportunidad_id uuid not null references oportunidades on delete cascade,
  organizacion_id uuid not null references organizaciones on delete cascade,
  visibilidad visibilidad not null default 'red',
  resultado text,
  resultado_en timestamptz,
  creada_en timestamptz not null default now(),
  primary key (oportunidad_id, organizacion_id)
);

-- Funciones auxiliares para las políticas.
create function es_revisora() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'revisora');
$$;

create function mi_organizacion() returns uuid
language sql stable security definer set search_path = public as $$
  select organizacion_id from perfiles where id = auth.uid();
$$;

alter table organizaciones enable row level security;
alter table perfiles enable row level security;
alter table oportunidades enable row level security;
alter table participaciones enable row level security;

-- Organizaciones: las ve la red; cada una edita la suya.
create policy "la red ve organizaciones" on organizaciones
  for select to authenticated using (true);
create policy "editar mi organizacion" on organizaciones
  for update to authenticated using (id = mi_organizacion() or es_revisora());
create policy "revisoras crean organizaciones" on organizaciones
  for insert to authenticated with check (es_revisora());

-- Perfiles: cada persona ve y edita el suyo; las revisoras ven todos.
create policy "ver mi perfil" on perfiles
  for select to authenticated using (id = auth.uid() or es_revisora());
create policy "crear mi perfil" on perfiles
  for insert to authenticated with check (id = auth.uid() and rol = 'miembro');
create policy "editar mi perfil" on perfiles
  for update to authenticated using (id = auth.uid())
  with check (id = auth.uid() and rol = (select rol from perfiles where id = auth.uid()));
create policy "revisoras gestionan perfiles" on perfiles
  for update to authenticated using (es_revisora());

-- Oportunidades: las publicadas son públicas; las pendientes solo las ve Akãhatã.
create policy "todas ven las publicadas" on oportunidades
  for select to anon, authenticated using (estado = 'publicada' or es_revisora());
create policy "revisoras cargan" on oportunidades
  for insert to authenticated with check (es_revisora());
create policy "revisoras revisan" on oportunidades
  for update to authenticated using (es_revisora());

-- Participaciones: cada organización ve siempre las suyas; las demás según su visibilidad.
create policy "ver participaciones segun visibilidad" on participaciones
  for select to authenticated using (
    organizacion_id = mi_organizacion()
    or es_revisora()
    or visibilidad in ('publica', 'red')
  );
create policy "ver participaciones publicas" on participaciones
  for select to anon using (visibilidad = 'publica');
create policy "sumar a mi organizacion" on participaciones
  for insert to authenticated with check (organizacion_id = mi_organizacion());
create policy "editar las de mi organizacion" on participaciones
  for update to authenticated using (organizacion_id = mi_organizacion());
create policy "salir de una oportunidad" on participaciones
  for delete to authenticated using (organizacion_id = mi_organizacion());
