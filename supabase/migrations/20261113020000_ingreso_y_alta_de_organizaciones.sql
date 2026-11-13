-- Ingreso con correo y alta de organizaciones.
--
-- 1. Cada persona que ingresa por primera vez recibe un perfil automáticamente.
-- 2. Una persona sin organización puede dar de alta la suya. Queda "pendiente"
--    hasta que el equipo de Akãhatã la apruebe; mientras tanto no aparece en
--    el mapa de la red ni puede sumarse a oportunidades.
-- 3. Una persona solo puede ligarse a una organización que ella misma creó
--    (o que le asigne una revisora). Antes cualquiera podía poner en su perfil
--    el id de otra organización y actuar en su nombre.

alter table organizaciones
  add column aprobada boolean not null default false,
  add column creada_por uuid references auth.users on delete set null;

-- Las que ya existían las cargó Akãhatã: quedan aprobadas.
update organizaciones set aprobada = true where creada_por is null;

-- Funciones auxiliares (en el esquema privado, que la API no expone).
create function privado.mi_rol() returns rol
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid();
$$;

create function privado.mi_organizacion_aprobada() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select o.aprobada from perfiles p join organizaciones o on o.id = p.organizacion_id
                   where p.id = auth.uid()), false);
$$;

grant execute on function privado.mi_rol() to authenticated;
grant execute on function privado.mi_organizacion_aprobada() to authenticated;

-- 1. Perfil automático al primer ingreso.
create function privado.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger crear_perfil_al_ingresar
  after insert on auth.users
  for each row execute function privado.crear_perfil();

insert into perfiles (id) select id from auth.users on conflict (id) do nothing;

-- 2. Alta de organizaciones. Solo una revisora puede aprobar; el resto de las
--    personas no puede tocar "aprobada" ni "creada_por".
create function privado.proteger_organizacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if privado.es_revisora() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.aprobada := false;
    new.creada_por := auth.uid();
  else
    new.aprobada := old.aprobada;
    new.creada_por := old.creada_por;
  end if;
  return new;
end;
$$;

create trigger proteger_organizacion
  before insert or update on organizaciones
  for each row execute function privado.proteger_organizacion();

-- (Se usa "alter policy" en vez de borrar y recrear las políticas.)
alter policy "revisoras crean organizaciones" on organizaciones rename to "crear organizacion";
alter policy "crear organizacion" on organizaciones
  with check (privado.es_revisora() or privado.mi_organizacion() is null);

-- La red ve solo las aprobadas; cada quien ve también la suya pendiente.
alter policy "la red ve organizaciones" on organizaciones rename to "ver organizaciones";
alter policy "ver organizaciones" on organizaciones
  using (
    aprobada
    or creada_por = auth.uid()
    or id = privado.mi_organizacion()
    or privado.es_revisora()
  );

-- 3. El perfil solo se liga a una organización creada por la misma persona.
alter policy "editar mi perfil" on perfiles
  with check (
    id = auth.uid()
    and rol = privado.mi_rol()
    and (
      organizacion_id is not distinct from privado.mi_organizacion()
      or organizacion_id in (select id from organizaciones where creada_por = auth.uid())
    )
  );

-- Sumarse a oportunidades: solo organizaciones aprobadas.
alter policy "sumar a mi organizacion" on participaciones
  with check (organizacion_id = privado.mi_organizacion() and privado.mi_organizacion_aprobada());

-- Akãhatã puede rechazar (borrar) una organización pendiente.
create policy "revisoras borran organizaciones" on organizaciones
  for delete to authenticated using (privado.es_revisora());
