-- Darse de baja de la app y sumar personas al equipo de Akãhatã (rol revisora).
--
-- 1. Darse de baja: cada persona puede borrar su cuenta desde la app. Se borra
--    de verdad: su correo, su contraseña, su perfil, sus pedidos para sumarse a
--    una organización y sus mensajes privados. Lo que escribió en el chat y el
--    foro está firmado por su organización; queda sin autora, salvo que elija
--    borrarlo también. La organización sigue en la red.
--
-- 2. Sumar revisoras por correo: el equipo de Akãhatã anota un correo y esa
--    persona recibe el rol cuando confirma su correo (al crear la cuenta) o
--    enseguida si ya tenía cuenta confirmada. Los correos quedan en el esquema
--    privado: nadie más los ve.

-- Para poder borrar a quien revisó oportunidades.
alter table oportunidades drop constraint if exists oportunidades_revisada_por_fkey;
alter table oportunidades
  add constraint oportunidades_revisada_por_fkey
  foreign key (revisada_por) references perfiles on delete set null;

-- 1. Darse de baja.
create function public.darme_de_baja(p_borrar_lo_que_escribi boolean default false)
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
  -- Borra la cuenta; el perfil, los pedidos y los mensajes privados se borran en cascada.
  delete from auth.users where id = v_yo;
end;
$$;
revoke execute on function public.darme_de_baja(boolean) from public, anon;
grant execute on function public.darme_de_baja(boolean) to authenticated;

-- 2. Revisoras por correo.
create table privado.revisoras_por_correo (
  email text primary key check (email = lower(email)),
  invitada_por uuid references auth.users on delete set null,
  creada_en timestamptz not null default now()
);
alter table privado.revisoras_por_correo enable row level security;

-- Da el rol a una cuenta confirmada cuyo correo está anotado.
create function privado.dar_rol_por_correo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from privado.revisoras_por_correo r where r.email = lower(new.email)) then
    insert into perfiles (id, rol) values (new.id, 'revisora')
    on conflict (id) do update set rol = 'revisora';
  end if;
  return new;
end;
$$;

create trigger dar_rol_por_correo
  after insert or update of email_confirmed_at on auth.users
  for each row execute function privado.dar_rol_por_correo();

-- Una revisora suma a otra persona al equipo de Akãhatã.
create function public.sumar_revisora(p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
begin
  if not privado.es_revisora() then
    raise exception 'solo_revisoras';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'correo_invalido';
  end if;
  insert into privado.revisoras_por_correo (email, invitada_por) values (v_email, auth.uid())
  on conflict (email) do nothing;
  -- Si ya tiene cuenta confirmada, el rol es inmediato.
  update perfiles p set rol = 'revisora'
  from auth.users u
  where u.id = p.id and lower(u.email) = v_email and u.email_confirmed_at is not null;
end;
$$;
revoke execute on function public.sumar_revisora(text) from public, anon;
grant execute on function public.sumar_revisora(text) to authenticated;

-- El equipo de Akãhatã: quién ya tiene el rol y quién está anotada esperando crear su cuenta.
create function public.equipo_akahata()
returns table (email text, activa boolean)
language sql stable security definer set search_path = public as $$
  select lower(u.email), true
  from perfiles p join auth.users u on u.id = p.id
  where p.rol = 'revisora' and privado.es_revisora()
  union
  select r.email, false
  from privado.revisoras_por_correo r
  where privado.es_revisora()
    and not exists (
      select 1 from perfiles p join auth.users u on u.id = p.id
      where p.rol = 'revisora' and lower(u.email) = r.email
    )
  order by 2 desc, 1;
$$;
revoke execute on function public.equipo_akahata() from public, anon;
grant execute on function public.equipo_akahata() to authenticated;
