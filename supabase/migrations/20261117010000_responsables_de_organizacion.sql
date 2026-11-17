-- Responsables de organización.
-- Una o más personas por organización deciden lo que la organización muestra y quién entra:
--   * editar los datos y el logo de la organización,
--   * aceptar o rechazar a quienes piden sumarse,
--   * mostrar una participación como "Público" (el resto puede elegir solo opciones más cerradas),
--   * nombrar o sacar a otras responsables.
-- Quien crea la organización es responsable. Si una organización se queda sin responsable,
-- pasa a serlo la persona más antigua. Akãhatã (revisoras) puede hacer todo esto siempre.

alter table public.perfiles add column if not exists responsable boolean not null default false;

-- Quienes crearon su organización y siguen en ella pasan a ser responsables.
update public.perfiles p set responsable = true
from public.organizaciones o
where o.id = p.organizacion_id and o.creada_por = p.id;

-- Organizaciones que quedaron sin responsable: la persona más antigua.
update public.perfiles p set responsable = true
where p.id in (
  select distinct on (organizacion_id) id
  from public.perfiles
  where organizacion_id is not null
    and organizacion_id not in (select organizacion_id from public.perfiles where responsable and organizacion_id is not null)
  order by organizacion_id, creado_en
);

create or replace function privado.soy_responsable() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select responsable from perfiles where id = auth.uid() and organizacion_id is not null), false);
$$;
grant execute on function privado.soy_responsable() to authenticated;

-- Nadie se nombra responsable a sí misma editando su perfil.
-- Solo cambia por la función nombrar_responsable, por Akãhatã o al crear la organización.
create or replace function privado.proteger_responsable() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.responsable and not privado.es_revisora() then new.responsable := false; end if;
    return new;
  end if;
  -- Cambia de organización: deja de ser responsable, salvo que sea la organización que creó.
  if new.organizacion_id is distinct from old.organizacion_id then
    new.responsable := new.organizacion_id is not null
      and exists (select 1 from organizaciones where id = new.organizacion_id and creada_por = new.id);
    return new;
  end if;
  if new.responsable is distinct from old.responsable
     and not privado.es_revisora()
     and coalesce(current_setting('privado.cambio_responsable', true), '') <> 'si' then
    raise exception 'Solo una responsable de la organización puede cambiar esto';
  end if;
  return new;
end;
$$;
drop trigger if exists proteger_responsable on public.perfiles;
create trigger proteger_responsable before insert or update on public.perfiles
  for each row execute function privado.proteger_responsable();

-- Si una organización se queda sin responsable (alguien se fue o se dio de baja), la toma la persona más antigua.
create or replace function privado.reponer_responsable() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := old.organizacion_id;
begin
  if v_org is null then return null; end if;
  if not exists (select 1 from perfiles where organizacion_id = v_org and responsable) then
    perform set_config('privado.cambio_responsable', 'si', true);
    update perfiles set responsable = true
    where id = (select id from perfiles where organizacion_id = v_org order by creado_en limit 1);
    perform set_config('privado.cambio_responsable', '', true);
  end if;
  return null;
end;
$$;
drop trigger if exists reponer_responsable on public.perfiles;
create trigger reponer_responsable after update of organizacion_id, responsable or delete on public.perfiles
  for each row execute function privado.reponer_responsable();

-- Nombrar o sacar responsables de mi organización.
create or replace function public.nombrar_responsable(p_perfil uuid, p_responsable boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select organizacion_id into v_org from perfiles where id = p_perfil;
  if v_org is null then raise exception 'Esa persona no está en ninguna organización'; end if;
  if not (privado.es_revisora() or (v_org = privado.mi_organizacion() and privado.soy_responsable())) then
    raise exception 'Solo una responsable de la organización puede hacer esto';
  end if;
  if not p_responsable and not exists (
    select 1 from perfiles where organizacion_id = v_org and responsable and id <> p_perfil
  ) then
    raise exception 'La organización necesita al menos una responsable. Nombrá a otra persona primero.';
  end if;
  perform set_config('privado.cambio_responsable', 'si', true);
  update perfiles set responsable = p_responsable where id = p_perfil;
  perform set_config('privado.cambio_responsable', '', true);
end;
$$;
revoke execute on function public.nombrar_responsable(uuid, boolean) from public, anon;
grant execute on function public.nombrar_responsable(uuid, boolean) to authenticated;

-- Las personas de mi organización, ahora con su id y si son responsables.
drop function if exists public.personas_de_mi_organizacion();
create function public.personas_de_mi_organizacion()
returns table (perfil_id uuid, email text, desde timestamptz, responsable boolean)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.creado_en, p.responsable
  from perfiles p join auth.users u on u.id = p.id
  where p.organizacion_id = privado.mi_organizacion() and privado.mi_organizacion() is not null
  order by p.creado_en;
$$;
revoke execute on function public.personas_de_mi_organizacion() from public, anon;
grant execute on function public.personas_de_mi_organizacion() to authenticated;

-- Aceptar gente: solo responsables (o Akãhatã).
create or replace function public.responder_solicitud(p_perfil uuid, p_aceptar boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select organizacion_id into v_org from solicitudes_union where perfil_id = p_perfil and estado = 'pendiente';
  if v_org is null then
    raise exception 'No existe esa solicitud';
  end if;
  if not (privado.es_revisora() or (v_org = privado.mi_organizacion() and privado.mi_organizacion_aprobada() and privado.soy_responsable())) then
    raise exception 'Solo una responsable de la organización puede responder esta solicitud';
  end if;
  if p_aceptar then
    update perfiles set organizacion_id = v_org where id = p_perfil and organizacion_id is null;
  end if;
  update solicitudes_union set estado = case when p_aceptar then 'aceptada' else 'rechazada' end
  where perfil_id = p_perfil and estado = 'pendiente';
end;
$$;

create or replace function public.solicitudes_para_responder()
returns table (perfil_id uuid, email text, organizacion_id uuid, nombre text, creada_en timestamptz)
language sql stable security definer set search_path = public as $$
  select s.perfil_id, u.email::text, s.organizacion_id, o.nombre, s.creada_en
  from solicitudes_union s
  join auth.users u on u.id = s.perfil_id
  join organizaciones o on o.id = s.organizacion_id
  where s.estado = 'pendiente'
    and ((s.organizacion_id = privado.mi_organizacion() and privado.mi_organizacion_aprobada() and privado.soy_responsable())
     or privado.es_revisora())
  order by s.creada_en;
$$;

-- Datos y logo de la organización: solo responsables (o Akãhatã).
alter policy "editar mi organizacion" on public.organizaciones
  using ((id = privado.mi_organizacion() and privado.soy_responsable()) or privado.es_revisora());

create or replace function privado.puede_cambiar_imagen(p_nombre text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_nombre = 'perfiles/' || auth.uid()::text || '.jpg'
    or (privado.mi_organizacion() is not null and privado.soy_responsable()
        and p_nombre = 'organizaciones/' || privado.mi_organizacion()::text || '.jpg')
    or (privado.es_revisora() and p_nombre like 'organizaciones/%.jpg')
  );
$$;

-- Mostrar una participación como "Público": solo responsables.
alter policy "sumar a mi organizacion" on public.participaciones
  with check (
    organizacion_id = privado.mi_organizacion() and privado.mi_organizacion_aprobada()
    and (visibilidad <> 'publica' or privado.soy_responsable())
  );
alter policy "editar las de mi organizacion" on public.participaciones
  with check (
    organizacion_id = privado.mi_organizacion()
    and (visibilidad <> 'publica' or privado.soy_responsable())
  );

-- De paso: estas funciones no tienen que poder llamarse sin haber ingresado
-- (contar_comentarios queda abierta: la usan quienes miran las noticias sin cuenta).
revoke execute on function public.nombres_de_mis_conversaciones() from public, anon;
revoke execute on function public.personas_de_la_red() from public, anon;
revoke execute on function public.responder_solicitud(uuid, boolean) from public, anon;
revoke execute on function public.solicitudes_para_responder() from public, anon;
grant execute on function public.nombres_de_mis_conversaciones() to authenticated;
grant execute on function public.personas_de_la_red() to authenticated;
grant execute on function public.responder_solicitud(uuid, boolean) to authenticated;
grant execute on function public.solicitudes_para_responder() to authenticated;
