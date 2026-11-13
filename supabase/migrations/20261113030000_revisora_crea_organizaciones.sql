-- Cuando una revisora crea una organización, queda registrada como creadora
-- (así puede ligarse a ella). El panel de Supabase sigue sin restricciones.
create or replace function privado.proteger_organizacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Sin persona usuaria (panel de Supabase, tareas del servidor): sin restricciones.
  if auth.uid() is null then
    return new;
  end if;
  -- Revisora: puede aprobar, y queda registrada como creadora si no se indicó otra.
  if privado.es_revisora() then
    if tg_op = 'INSERT' then
      new.creada_por := coalesce(new.creada_por, auth.uid());
    end if;
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
