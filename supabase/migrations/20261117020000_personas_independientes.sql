-- Personas independientes en la red.
--
-- Activistas, académicas o periodistas que no forman parte de una organización
-- piden entrar a la red y una revisora de Akãhatã las aprueba, igual que a las
-- organizaciones. Una vez aprobadas:
--   * ven la Red (organizaciones y personas), el chat y el foro de noticias,
--   * escriben en el chat y en el foro firmando con su nombre (no hay organización),
--   * mandan y reciben mensajes privados, si lo eligen.
-- No se suman a oportunidades ni piden acompañamiento: eso sigue siendo de organizaciones.
-- Si después entra a una organización, deja de ser independiente.

-- 1. Datos del perfil.
alter table public.perfiles
  add column if not exists independiente text check (independiente in ('pendiente', 'aprobada')),
  -- Cómo se presenta: Activista, Académica, Periodista u Otra.
  add column if not exists se_presenta text not null default '',
  add column if not exists pais text not null default '';

-- Nadie se aprueba a sí misma. Al entrar a una organización deja de ser independiente.
create or replace function privado.proteger_independiente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.organizacion_id is not null then
    new.independiente := null;
    return new;
  end if;
  if auth.uid() is null or privado.es_revisora() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.independiente = 'aprobada' then new.independiente := 'pendiente'; end if;
  elsif new.independiente = 'aprobada' and old.independiente is distinct from 'aprobada' then
    new.independiente := 'pendiente';
  end if;
  return new;
end;
$$;
drop trigger if exists proteger_independiente on public.perfiles;
create trigger proteger_independiente before insert or update on public.perfiles
  for each row execute function privado.proteger_independiente();

-- 2. ¿Quien llama es parte de la red? Organización aprobada o persona independiente aprobada.
create or replace function privado.soy_independiente() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select independiente = 'aprobada' and organizacion_id is null from perfiles where id = auth.uid()), false);
$$;
create or replace function privado.en_la_red() returns boolean
language sql stable security definer set search_path = public as $$
  select privado.mi_organizacion_aprobada() or privado.soy_independiente();
$$;
grant execute on function privado.soy_independiente() to authenticated;
grant execute on function privado.en_la_red() to authenticated;

-- 3. Chat y foro: se lee si sos parte de la red; las independientes firman con su nombre.
alter table public.mensajes alter column organizacion_id drop not null;
alter table public.comentarios alter column organizacion_id drop not null;
alter table public.mensajes add column if not exists firma text;
alter table public.comentarios add column if not exists firma text;

-- La firma la pone la base, no quien escribe: el nombre visible de su perfil.
create or replace function privado.firmar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.organizacion_id is null then
    select coalesce(nullif(trim(nombre_visible), ''), 'Persona independiente')
           || case when se_presenta <> '' then ' · ' || se_presenta else '' end
      into new.firma
      from perfiles where id = auth.uid();
  else
    new.firma := null;
  end if;
  return new;
end;
$$;
drop trigger if exists firmar on public.mensajes;
create trigger firmar before insert on public.mensajes for each row execute function privado.firmar();
drop trigger if exists firmar on public.comentarios;
create trigger firmar before insert on public.comentarios for each row execute function privado.firmar();

alter policy "la red lee el chat" on public.mensajes
  using (privado.en_la_red() or privado.es_revisora());
alter policy "escribir en el chat" on public.mensajes
  with check (
    autor = auth.uid()
    and (
      (organizacion_id = privado.mi_organizacion() and privado.mi_organizacion_aprobada())
      or (organizacion_id is null and privado.soy_independiente())
    )
  );

alter policy "la red lee el foro" on public.comentarios
  using (privado.en_la_red() or privado.es_revisora());
alter policy "comentar" on public.comentarios
  with check (
    autor = auth.uid()
    and (
      (organizacion_id = privado.mi_organizacion() and privado.mi_organizacion_aprobada())
      or (organizacion_id is null and privado.soy_independiente())
    )
  );

-- 4. Personas de la red: las de organizaciones aprobadas y las independientes aprobadas.
drop function if exists public.personas_de_la_red();
create function public.personas_de_la_red()
returns table (
  id uuid, nombre_visible text, cargo text, presentacion text, organizacion_id uuid, acepta_mensajes boolean,
  foto_en timestamptz, se_presenta text, pais text
)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.nombre_visible, ''), 'Persona sin nombre'), p.cargo, p.presentacion, p.organizacion_id,
         p.acepta_mensajes, p.foto_en, p.se_presenta, p.pais
  from perfiles p left join organizaciones o on o.id = p.organizacion_id
  where (o.aprobada or (p.organizacion_id is null and p.independiente = 'aprobada'))
    and (p.visible_en_red or p.id = auth.uid())
    and (privado.en_la_red() or privado.es_revisora())
  order by o.nombre nulls last, p.nombre_visible;
$$;
revoke execute on function public.personas_de_la_red() from public, anon;
grant execute on function public.personas_de_la_red() to authenticated;

-- 5. Mensajes privados.
create or replace function privado.acepta_mensajes(p_perfil uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.acepta_mensajes and (o.aprobada or (p.organizacion_id is null and p.independiente = 'aprobada'))
                   from perfiles p left join organizaciones o on o.id = p.organizacion_id
                   where p.id = p_perfil), false);
$$;

alter policy "escribir mensaje privado" on public.mensajes_privados
  with check (
    de = auth.uid()
    and privado.en_la_red()
    and (
      privado.acepta_mensajes(para)
      or exists (select 1 from mensajes_privados m where m.de = para and m.para = auth.uid())
    )
  );

-- 6. Fotos de perfil y logos: también para independientes aprobadas.
create or replace function privado.puede_ver_imagen(p_nombre text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_tipo text := split_part(p_nombre, '/', 1);
  v_id uuid;
begin
  begin
    v_id := replace(split_part(p_nombre, '/', 2), '.jpg', '')::uuid;
  exception when others then
    return false;
  end;
  if auth.uid() is null then return false; end if;
  if privado.es_revisora() then return true; end if;
  if v_tipo = 'perfiles' then
    if v_id = auth.uid() then return true; end if;
    return privado.en_la_red() and (
      exists (select 1 from perfiles p left join organizaciones o on o.id = p.organizacion_id
              where p.id = v_id and p.visible_en_red
                and (o.aprobada or (p.organizacion_id is null and p.independiente = 'aprobada')))
      or exists (select 1 from mensajes_privados m
                 where (m.de = v_id and m.para = auth.uid()) or (m.de = auth.uid() and m.para = v_id))
    );
  elsif v_tipo = 'organizaciones' then
    return v_id = privado.mi_organizacion()
      or (privado.en_la_red() and exists (select 1 from organizaciones where id = v_id and aprobada));
  end if;
  return false;
end;
$$;

-- 7. Para Akãhatã: quiénes piden entrar como independientes (con su correo, para poder contactarlas).
create or replace function public.independientes_por_revisar()
returns table (id uuid, email text, nombre_visible text, se_presenta text, pais text, cargo text, presentacion text, creado_en timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.nombre_visible, p.se_presenta, p.pais, p.cargo, p.presentacion, p.creado_en
  from perfiles p join auth.users u on u.id = p.id
  where p.independiente = 'pendiente' and p.organizacion_id is null and privado.es_revisora()
  order by p.creado_en;
$$;
revoke execute on function public.independientes_por_revisar() from public, anon;
grant execute on function public.independientes_por_revisar() to authenticated;

-- 8. Darse de baja: lo que una independiente firmó con su nombre queda sin su nombre.
create or replace function public.darme_de_baja(p_borrar_lo_que_escribi boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_yo uuid := auth.uid();
begin
  if v_yo is null then
    raise exception 'sin_sesion';
  end if;
  -- Que Akãhatã no se quede sin nadie que pueda revisar.
  if privado.es_revisora()
     and not exists (select 1 from perfiles where rol = 'revisora' and id <> v_yo) then
    raise exception 'ultima_revisora';
  end if;
  if p_borrar_lo_que_escribi then
    update mensajes set borrado = true, texto = 'Mensaje borrado' where autor = v_yo;
    update comentarios set borrado = true, texto = 'Comentario borrado' where autor = v_yo;
  end if;
  update mensajes set firma = 'Persona que se dio de baja' where autor = v_yo and firma is not null;
  update comentarios set firma = 'Persona que se dio de baja' where autor = v_yo and firma is not null;
  -- Borra la cuenta; el perfil, los pedidos y los mensajes privados se borran en cascada.
  delete from auth.users where id = v_yo;
end;
$$;
