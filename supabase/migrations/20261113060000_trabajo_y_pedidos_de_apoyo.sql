-- Qué hizo cada organización y pedidos de apoyo a Akãhatã.
--
-- 1. Cada participación puede registrar qué tipo de documento se preparó
--    (informe sombra, contribución, reporte…), si ya se envió y un enlace.
--    Así la Red muestra en qué está trabajando cada organización y qué hizo,
--    respetando la visibilidad que eligió.
-- 2. Una organización aprobada puede pedir apoyo a Akãhatã para redactar un
--    documento. Solo la propia organización y el equipo de Akãhatã ven el pedido.

create type tipo_aporte as enum ('informe_sombra', 'contribucion', 'reporte', 'intervencion', 'otro');

alter table participaciones
  add column tipo_aporte tipo_aporte,
  add column enviado boolean not null default false,
  add column enlace text;

create type estado_pedido as enum ('nuevo', 'en_curso', 'cerrado');

create table pedidos_apoyo (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones on delete cascade,
  oportunidad_id uuid references oportunidades on delete set null,
  tipo_documento tipo_aporte not null default 'otro',
  mensaje text not null,
  -- Cómo contactar a la organización (por defecto, el correo de quien pide).
  contacto text not null,
  estado estado_pedido not null default 'nuevo',
  creado_por uuid default auth.uid() references auth.users on delete set null,
  creado_en timestamptz not null default now()
);
create index pedidos_apoyo_organizacion on pedidos_apoyo (organizacion_id);
create index pedidos_apoyo_oportunidad on pedidos_apoyo (oportunidad_id);

alter table pedidos_apoyo enable row level security;

create policy "ver pedidos de mi organizacion" on pedidos_apoyo
  for select to authenticated
  using (organizacion_id = privado.mi_organizacion() or privado.es_revisora());

create policy "pedir apoyo" on pedidos_apoyo
  for insert to authenticated
  with check (
    organizacion_id = privado.mi_organizacion()
    and privado.mi_organizacion_aprobada()
    and estado = 'nuevo'
  );

create policy "revisoras gestionan pedidos" on pedidos_apoyo
  for update to authenticated using (privado.es_revisora());
