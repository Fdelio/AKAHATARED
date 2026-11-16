-- Foto de perfil (opcional) y logo de cada organización (opcional).
--
-- Cuidado de activistas en riesgo:
--  - Las imágenes van a un espacio privado: no hay enlaces públicos. La app
--    pide enlaces que vencen en una hora, y solo se los da a quien puede verlas.
--  - La foto de una persona la ven ella misma, Akãhatã, y las organizaciones
--    aprobadas solo si la persona eligió aparecer en la red o si ya se
--    escribieron por privado. Los logos los ven las organizaciones aprobadas.
--  - La app achica la imagen antes de subirla, lo que también le borra los
--    datos ocultos (lugar donde se sacó la foto, teléfono, etc.).

-- Cuándo se subió la imagen (null = no tiene). Sirve también para refrescarla.
alter table perfiles add column foto_en timestamptz;
alter table organizaciones add column logo_en timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- ¿Quien llama puede ver esta imagen? Rutas: perfiles/<id>.jpg y organizaciones/<id>.jpg
create function privado.puede_ver_imagen(p_nombre text) returns boolean
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
    return privado.mi_organizacion_aprobada() and (
      exists (select 1 from perfiles p join organizaciones o on o.id = p.organizacion_id
              where p.id = v_id and p.visible_en_red and o.aprobada)
      or exists (select 1 from mensajes_privados m
                 where (m.de = v_id and m.para = auth.uid()) or (m.de = auth.uid() and m.para = v_id))
    );
  elsif v_tipo = 'organizaciones' then
    return v_id = privado.mi_organizacion()
      or (privado.mi_organizacion_aprobada() and exists (select 1 from organizaciones where id = v_id and aprobada));
  end if;
  return false;
end;
$$;
grant execute on function privado.puede_ver_imagen(text) to authenticated;

-- ¿Quien llama puede subir o borrar esta imagen? La propia foto, el logo de su organización, o cualquier logo si es revisora.
create function privado.puede_cambiar_imagen(p_nombre text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_nombre = 'perfiles/' || auth.uid()::text || '.jpg'
    or (privado.mi_organizacion() is not null and p_nombre = 'organizaciones/' || privado.mi_organizacion()::text || '.jpg')
    or (privado.es_revisora() and p_nombre like 'organizaciones/%.jpg')
  );
$$;
grant execute on function privado.puede_cambiar_imagen(text) to authenticated;

create policy "ver imagenes" on storage.objects
  for select to authenticated
  using (bucket_id = 'imagenes' and privado.puede_ver_imagen(name));
create policy "subir imagenes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes' and privado.puede_cambiar_imagen(name));
create policy "reemplazar imagenes" on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes' and privado.puede_cambiar_imagen(name))
  with check (bucket_id = 'imagenes' and privado.puede_cambiar_imagen(name));
create policy "borrar imagenes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes' and privado.puede_cambiar_imagen(name));

-- Las listas de personas ahora dicen si tienen foto.
drop function public.personas_de_la_red();
create function public.personas_de_la_red()
returns table (id uuid, nombre_visible text, cargo text, presentacion text, organizacion_id uuid, acepta_mensajes boolean, foto_en timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.nombre_visible, ''), 'Persona sin nombre'), p.cargo, p.presentacion, p.organizacion_id, p.acepta_mensajes, p.foto_en
  from perfiles p join organizaciones o on o.id = p.organizacion_id
  where o.aprobada
    and (p.visible_en_red or p.id = auth.uid())
    and (privado.mi_organizacion_aprobada() or privado.es_revisora())
  order by o.nombre, p.nombre_visible;
$$;

drop function public.nombres_de_mis_conversaciones();
create function public.nombres_de_mis_conversaciones()
returns table (id uuid, nombre_visible text, organizacion_id uuid, foto_en timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.nombre_visible, ''), 'Persona sin nombre'), p.organizacion_id, p.foto_en
  from perfiles p
  where p.id in (
    select para from mensajes_privados where de = auth.uid()
    union select de from mensajes_privados where para = auth.uid()
  );
$$;
