-- Calendario de sesiones de los órganos donde se hace incidencia:
-- Consejo de Derechos Humanos, EPU, CSW, Asamblea General de la OEA, etc.
-- Lo ve todo el mundo; lo edita el equipo de Akãhatã.

create table sesiones (
  id uuid primary key default gen_random_uuid(),
  sistema sistema not null,
  organo text not null,
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date,
  -- true cuando la fecha todavía no está confirmada oficialmente.
  a_confirmar boolean not null default false,
  lugar text not null default '',
  descripcion text not null default '',
  fuente_url text,
  creada_en timestamptz not null default now()
);
create index sesiones_fecha on sesiones (fecha_inicio);

alter table sesiones enable row level security;
create policy "todas ven las sesiones" on sesiones
  for select to anon, authenticated using (true);
create policy "revisoras cargan sesiones" on sesiones
  for insert to authenticated with check (privado.es_revisora());
create policy "revisoras editan sesiones" on sesiones
  for update to authenticated using (privado.es_revisora());
create policy "revisoras borran sesiones" on sesiones
  for delete to authenticated using (privado.es_revisora());

-- Primeras sesiones (revisadas el 13 de noviembre de 2026).
insert into sesiones (sistema, organo, nombre, fecha_inicio, fecha_fin, a_confirmar, lugar, descripcion, fuente_url) values
('ONU', 'Examen Periódico Universal', 'EPU · 54ª sesión del Grupo de Trabajo', '2027-01-18', '2027-01-29', false, 'Ginebra',
 'Se examinan, entre otros, Venezuela y Haití. El plazo para informes de la sociedad civil ya cerró, pero todavía se puede hacer incidencia con las misiones de otros países para que formulen recomendaciones.',
 'https://upr-info.org/en/upr-process/upr-agenda'),
('ONU', 'Consejo de Derechos Humanos', 'Consejo de Derechos Humanos · 64º período de sesiones', '2027-02-22', '2027-04-02', true, 'Ginebra',
 'Primera sesión del año: informes de relatorías, debates interactivos y resoluciones. Las organizaciones con estatus consultivo pueden presentar declaraciones escritas y orales.',
 'https://www.ohchr.org/en/hr-bodies/hrc/sessions'),
('ONU', 'Comisión de la Condición Jurídica y Social de la Mujer', 'CSW71 · Comisión de la Condición Jurídica y Social de la Mujer', '2027-03-08', '2027-03-19', false, 'Nueva York',
 'El principal espacio de la ONU sobre igualdad de género. Hay foro de ONG en paralelo y eventos paralelos que pueden organizar las organizaciones.',
 'https://www.unwomen.org/en/how-we-work/commission-on-the-status-of-women'),
('OEA', 'Asamblea General de la OEA', 'Asamblea General de la OEA · 57º período ordinario de sesiones', '2027-06-01', null, true, 'Sede a confirmar',
 'Los Estados negocian la resolución ómnibus de derechos humanos, incluidos los párrafos sobre orientación sexual e identidad de género. Antes hay un diálogo con la sociedad civil, con inscripción previa.',
 'https://www.oas.org/es/council/AG/'),
('ONU', 'Consejo de Derechos Humanos', 'Consejo de Derechos Humanos · 65º período de sesiones', '2027-06-14', '2027-07-09', true, 'Ginebra',
 'Sesión de mitad de año. Incluye el diálogo con la Relatora Especial sobre la violencia contra las mujeres y las niñas y el informe sobre detención de personas migrantes.',
 'https://www.ohchr.org/en/hr-bodies/hrc/sessions'),
('ONU', 'Consejo de Derechos Humanos', 'Consejo de Derechos Humanos · 66º período de sesiones', '2027-09-13', '2027-10-08', true, 'Ginebra',
 'Última sesión del año. Se presenta el estudio sobre derechos humanos y adaptación climática.',
 'https://www.ohchr.org/en/hr-bodies/hrc/sessions'),
('ONU', 'Examen Periódico Universal', 'EPU · 55ª sesión (inicio del quinto ciclo)', '2027-11-01', null, true, 'Ginebra',
 'Empieza el quinto ciclo del EPU. Los plazos para informes de la sociedad civil suelen cerrar unos seis meses antes de cada sesión.',
 'https://upr-info.org/en/upr-process/upr-agenda');
