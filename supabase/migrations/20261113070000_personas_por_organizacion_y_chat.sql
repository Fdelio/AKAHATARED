-- Varias personas por organización y chat de la red.
--
-- 1. Una persona sin organización puede pedir sumarse a una organización ya
--    aprobada. La aceptan las personas de esa organización o Akãhatã.
-- 2. Chat para organizaciones aprobadas: una sala general y una conversación
--    por oportunidad. Los mensajes se firman con el nombre de la organización
--    (no de la persona). Akãhatã puede borrar cualquier mensaje.
--
-- (Sin DELETE ni REVOKE: el panel pide una confirmación que no llega. Las
-- solicitudes y los mensajes se marcan en vez de borrarse.)

-- ---------- 1. Solicitudes para sumarse a una organización ----------

create table solicitudes_union (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles on delete cascade,
  organizacion_id uuid not null references organizaciones on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  creada_en timestamptz not null default now()
);
create index solicitudes_union_organizacion on solicitudes_union (organizacion_id);
-- Una sola solicitud pendiente por persona.
create unique index solicitudes_union_una_pendiente on solicitudes_union (perfil_id) where estado = 'pendiente';

alter table solicitudes_union enable row level security;

create policy "ver solicitudes" on solicitudes_union
  for select to authenticated
  using (perfil_id = auth.uid() or organizacion_id = privado.mi_organizacion() or privado.es_revisora());

create policy "pedir sumarme" on solicitudes_union
  for insert to authenticated
  with check (
    perfil_id = auth.uid()
    and estado = 'pendiente'
    and privado.mi_organizacion() is null
    and exists (select 1 from organizaciones o where o.id = organizacion_id and o.aprobada)
  );

create policy "cancelar mi solicitud" on solicitudes_union
  for update to authenticated
  using (perfil_id = auth.uid() and estado = 'pendiente')
  with check (perfil_id = auth.uid() and estado = 'cancelada');

-- Solicitudes que puedo responder, con el correo de quien pide.
create function public.solicitudes_para_responder()
returns table (perfil_id uuid, email text, organizacion_id uuid, organizacion text, creada_en timestamptz)
language sql stable security definer set search_path = public as $$
  select s.perfil_id, u.email::text, s.organizacion_id, o.nombre, s.creada_en
  from solicitudes_union s
  join auth.users u on u.id = s.perfil_id
  join organizaciones o on o.id = s.organizacion_id
  where s.estado = 'pendiente'
    and ((s.organizacion_id = privado.mi_organizacion() and privado.mi_organizacion_aprobada())
     or privado.es_revisora())
  order by s.creada_en;
$$;

-- Aceptar o rechazar. Solo personas de esa organización (aprobada) o Akãhatã.
create function public.responder_solicitud(p_perfil uuid, p_aceptar boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select organizacion_id into v_org from solicitudes_union where perfil_id = p_perfil and estado = 'pendiente';
  if v_org is null then
    raise exception 'No existe esa solicitud';
  end if;
  if not (privado.es_revisora() or (v_org = privado.mi_organizacion() and privado.mi_organizacion_aprobada())) then
    raise exception 'No podés responder esta solicitud';
  end if;
  if p_aceptar then
    update perfiles set organizacion_id = v_org where id = p_perfil and organizacion_id is null;
  end if;
  update solicitudes_union set estado = case when p_aceptar then 'aceptada' else 'rechazada' end
  where perfil_id = p_perfil and estado = 'pendiente';
end;
$$;

-- Quiénes forman parte de mi organización (solo correos, para saber quién entra).
create function public.personas_de_mi_organizacion()
returns table (email text, desde timestamptz)
language sql stable security definer set search_path = public as $$
  select u.email::text, p.creado_en
  from perfiles p join auth.users u on u.id = p.id
  where p.organizacion_id = privado.mi_organizacion() and privado.mi_organizacion() is not null
  order by p.creado_en;
$$;

-- Las tres funciones controlan adentro quién llama: sin organización ni rol no devuelven nada.

-- ---------- 2. Chat ----------

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  -- null = sala general; si no, la conversación de esa oportunidad.
  oportunidad_id uuid references oportunidades on delete cascade,
  organizacion_id uuid not null references organizaciones on delete cascade,
  autor uuid default auth.uid() references auth.users on delete set null,
  texto text not null check (length(texto) between 1 and 2000),
  borrado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index mensajes_sala on mensajes (oportunidad_id, creado_en);
create index mensajes_organizacion on mensajes (organizacion_id);
create index mensajes_autor on mensajes (autor);

alter table mensajes enable row level security;

create policy "la red lee el chat" on mensajes
  for select to authenticated
  using (privado.mi_organizacion_aprobada() or privado.es_revisora());

create policy "escribir en el chat" on mensajes
  for insert to authenticated
  with check (
    autor = auth.uid()
    and organizacion_id = privado.mi_organizacion()
    and privado.mi_organizacion_aprobada()
  );

-- Borrar = marcar como borrado y vaciar el texto. Lo puede hacer quien lo
-- escribió o Akãhatã (moderación).
create policy "borrar mensajes" on mensajes
  for update to authenticated
  using (autor = auth.uid() or privado.es_revisora())
  with check (borrado and texto = 'Mensaje borrado');

-- Mensajes nuevos en tiempo real.
alter publication supabase_realtime add table mensajes;
