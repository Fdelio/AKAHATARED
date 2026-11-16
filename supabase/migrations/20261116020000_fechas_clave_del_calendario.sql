-- Fechas clave para participar en cada sesión del calendario (inscripción,
-- informes, eventos paralelos, audiencias...) y enlaces a la página específica
-- de cada sesión. El equipo de Akãhatã las edita desde la app.
-- Datos revisados el 16 de noviembre de 2026.

alter table sesiones add column if not exists fechas_clave jsonb not null default '[]'::jsonb;

-- Que una fecha clave tenga siempre fecha, texto, enlace (o null) y si es aproximada.
create or replace function privado.fechas_clave_validas(f jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(f) = 'array' and not exists (
    select 1 from jsonb_array_elements(f) e
    where jsonb_typeof(e) <> 'object'
       or coalesce(e->>'fecha', '') !~ '^\d{4}-\d{2}-\d{2}$'
       or coalesce(trim(e->>'texto'), '') = ''
  )
$$;
alter table sesiones drop constraint if exists fechas_clave_validas;
alter table sesiones add constraint fechas_clave_validas check (privado.fechas_clave_validas(fechas_clave));

-- ---------- CSW71 ----------
update sesiones set
  lugar = 'Nueva York (sede de la ONU)',
  fuente_url = 'https://www.unwomen.org/en/how-we-work/commission-on-the-status-of-women/csw71-2027',
  descripcion = 'El principal espacio de la ONU sobre igualdad de género. Tema prioritario: acelerar la igualdad de género en el marco de la Agenda 2030. Tema de revisión: igualdad de género frente al cambio climático, el ambiente y el riesgo de desastres; tema transversal: pobreza y autonomía económica. Para inscribirse en la sesión oficial hace falta estatus consultivo ante el ECOSOC; sin él, se puede ir en la delegación de una organización que lo tenga o participar del Foro de ONG, abierto a todas.',
  fechas_clave = '[
    {"fecha":"2026-10-16","texto":"Cierre de declaraciones escritas (solo ONG con estatus ECOSOC)","url":"https://www.unwomen.org/en/csw/ngo-participation/written-and-oral-statements","aprox":false},
    {"fecha":"2026-11-17","texto":"Abren las postulaciones de eventos paralelos del Foro de ONG (miembros de NGO CSW/NY)","url":"https://ngocsw.org/ngocsw-forum/","aprox":false},
    {"fecha":"2026-11-23","texto":"Abren las postulaciones de eventos paralelos del Foro de ONG para el resto de las organizaciones (con costo según la sala)","url":"https://ngocsw.org/ngocsw-forum/","aprox":true},
    {"fecha":"2027-01-22","texto":"Cierre de la inscripción de ONG con estatus ECOSOC para la sesión oficial (no se aceptan inscripciones tardías)","url":"https://indico.un.org/event/1026202/","aprox":false},
    {"fecha":"2027-01-31","texto":"Cierre de pedidos de eventos paralelos oficiales en la ONU (los piden Estados y agencias; las ONG pueden coorganizar con una misión)","url":"https://www.unwomen.org/en/how-we-work/commission-on-the-status-of-women/csw71-2027","aprox":true},
    {"fecha":"2027-02-01","texto":"Abre la inscripción al Foro de ONG CSW71 (sin fecha de cierre; asistir a los eventos paralelos es gratis)","url":"https://ngocsw.org/ngocsw-forum/faq/","aprox":true}
  ]'::jsonb
where nombre like 'CSW71%';

-- ---------- Consejo de Derechos Humanos ----------
-- Plazos estimados según el CDH 62: eventos paralelos unas 4 semanas antes y
-- declaraciones escritas unas 3 semanas antes del inicio.
update sesiones set
  descripcion = 'Primera sesión del año: informes de relatorías, debates interactivos y resoluciones. Las organizaciones con estatus ECOSOC pueden presentar declaraciones escritas y orales y pedir eventos paralelos; las demás pueden hacerlo junto con una organización que lo tenga.',
  fechas_clave = '[
    {"fecha":"2027-01-25","texto":"Cierre estimado de pedidos de eventos paralelos (ONG con estatus ECOSOC)","url":"https://www.ohchr.org/sites/default/files/documents/hrbodies/hrcouncil/step-by-step-informal-guidance-on-the-registr.pdf","aprox":true},
    {"fecha":"2027-02-01","texto":"Cierre estimado de declaraciones escritas (ONG con estatus ECOSOC)","url":null,"aprox":true}
  ]'::jsonb
where nombre like 'Consejo de Derechos Humanos · 64%';
update sesiones set fechas_clave = '[
    {"fecha":"2027-05-17","texto":"Cierre estimado de pedidos de eventos paralelos (ONG con estatus ECOSOC)","url":"https://www.ohchr.org/sites/default/files/documents/hrbodies/hrcouncil/step-by-step-informal-guidance-on-the-registr.pdf","aprox":true},
    {"fecha":"2027-05-24","texto":"Cierre estimado de declaraciones escritas (ONG con estatus ECOSOC)","url":null,"aprox":true}
  ]'::jsonb
where nombre like 'Consejo de Derechos Humanos · 65%';
update sesiones set fechas_clave = '[
    {"fecha":"2027-08-16","texto":"Cierre estimado de pedidos de eventos paralelos (ONG con estatus ECOSOC)","url":"https://www.ohchr.org/sites/default/files/documents/hrbodies/hrcouncil/step-by-step-informal-guidance-on-the-registr.pdf","aprox":true},
    {"fecha":"2027-08-23","texto":"Cierre estimado de declaraciones escritas (ONG con estatus ECOSOC)","url":null,"aprox":true}
  ]'::jsonb
where nombre like 'Consejo de Derechos Humanos · 66%';

-- ---------- EPU ----------
update sesiones set
  nombre = 'EPU · 55ª sesión (inicio del quinto ciclo)',
  fuente_url = 'https://upr-info.org/en/session/session-55-november-2027',
  descripcion = 'Empieza el quinto ciclo del EPU. De la región se examinan Brasil y Ecuador. El plazo para informes de la sociedad civil cierra unos siete meses antes; el ACNUDH publica la fecha exacta en su página de sesiones del EPU.',
  fechas_clave = '[
    {"fecha":"2027-04-15","texto":"Plazo estimado para informes de la sociedad civil sobre Brasil y Ecuador (confirmar en el ACNUDH)","url":"https://www.ohchr.org/en/hr-bodies/upr/upr-sessions","aprox":true}
  ]'::jsonb
where nombre like 'EPU · 55%';

-- ---------- Asamblea General de la OEA ----------
update sesiones set
  lugar = 'Sede a confirmar (Bolivia ofreció Santa Cruz de la Sierra)',
  descripcion = 'Los Estados negocian la resolución ómnibus de derechos humanos, incluidos los párrafos sobre orientación sexual e identidad de género. Antes hay un diálogo con la sociedad civil: para participar, la organización tiene que estar inscripta en el Registro de sociedad civil de la OEA, que demora; conviene hacerlo con meses de anticipación.',
  fechas_clave = '[
    {"fecha":"2027-03-01","texto":"Recomendado: tener la organización inscripta en el Registro de sociedad civil de la OEA","url":"https://www.oas.org/ext/es/derechos-humanos/registro-sociedad-civil","aprox":true},
    {"fecha":"2027-05-01","texto":"Cierre estimado de la inscripción para el diálogo con la sociedad civil","url":"https://www.oas.org/es/council/AG/","aprox":true}
  ]'::jsonb
where nombre like 'Asamblea General de la OEA · 57%';

-- ---------- Sesiones nuevas ----------
insert into sesiones (sistema, organo, nombre, fecha_inicio, fecha_fin, a_confirmar, lugar, descripcion, fuente_url, fechas_clave)
select * from (values
('OEA'::sistema, 'CIDH', 'CIDH · 198 Período de Sesiones', date '2027-03-09', date '2027-03-19', false,
 'Audiencias presenciales (sede a confirmar)',
 'Sesiones internas virtuales del 9 al 12 de marzo y audiencias públicas presenciales del 15 al 19. Las organizaciones pueden pedir audiencias temáticas o sobre un país.',
 'https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp',
 '[
   {"fecha":"2026-11-19","texto":"Abre el pedido de audiencias públicas","url":"https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp","aprox":false},
   {"fecha":"2026-12-10","texto":"Cierra el pedido de audiencias públicas","url":"https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp","aprox":false},
   {"fecha":"2027-01-15","texto":"La CIDH avisa qué audiencias otorgó","url":null,"aprox":false},
   {"fecha":"2027-02-12","texto":"Publicación del calendario de audiencias","url":null,"aprox":false}
 ]'::jsonb),
('OEA'::sistema, 'CIDH', 'CIDH · 199 Período de Sesiones', date '2027-07-19', date '2027-08-06', false,
 'Audiencias virtuales',
 'Sesiones internas virtuales del 19 al 23 de julio y audiencias públicas virtuales del 2 al 6 de agosto. Al ser virtual, es más accesible para organizaciones con pocos recursos.',
 'https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp',
 '[
   {"fecha":"2027-04-02","texto":"Abre el pedido de audiencias públicas","url":null,"aprox":false},
   {"fecha":"2027-04-23","texto":"Cierra el pedido de audiencias públicas","url":null,"aprox":false},
   {"fecha":"2027-06-02","texto":"La CIDH avisa qué audiencias otorgó","url":null,"aprox":false},
   {"fecha":"2027-07-02","texto":"Publicación del calendario de audiencias","url":null,"aprox":false}
 ]'::jsonb),
('OEA'::sistema, 'CIDH', 'CIDH · 200 Período de Sesiones', date '2027-11-08', date '2027-11-19', false,
 'Audiencias presenciales (sede a confirmar)',
 'Sesiones internas virtuales del 8 al 12 de noviembre y audiencias públicas presenciales del 15 al 19.',
 'https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp',
 '[
   {"fecha":"2027-07-15","texto":"Abre el pedido de audiencias públicas","url":null,"aprox":false},
   {"fecha":"2027-08-05","texto":"Cierra el pedido de audiencias públicas","url":null,"aprox":false},
   {"fecha":"2027-09-15","texto":"La CIDH avisa qué audiencias otorgó","url":null,"aprox":false},
   {"fecha":"2027-10-15","texto":"Publicación del calendario de audiencias","url":null,"aprox":false}
 ]'::jsonb),
('ONU'::sistema, 'Comité CEDAW', 'Comité CEDAW · 94º período de sesiones', date '2027-02-01', date '2027-02-19', true,
 'Ginebra',
 'El Comité examina los informes de los Estados sobre la Convención contra la discriminación de la mujer. Las organizaciones envían informes alternativos antes de la sesión; los países y el plazo exacto figuran en la página de la sesión. En el grupo de trabajo previo de octubre de 2026 se trabajó, entre otros, sobre Barbados y Haití.',
 'https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/SessionDetails1.aspx?SessionID=2863&Lang=en',
 '[]'::jsonb),
('ONU'::sistema, 'Comité CEDAW', 'Comité CEDAW · 95º período de sesiones', date '2027-06-15', date '2027-07-09', true,
 'Ginebra',
 'Examen de informes de los Estados. Los países y el plazo para informes alternativos figuran en la página de la sesión.',
 'https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/SessionDetails1.aspx?SessionID=2958&Lang=en',
 '[]'::jsonb),
('ONU'::sistema, 'Comité CEDAW', 'Comité CEDAW · 96º período de sesiones', date '2027-10-04', date '2027-10-22', true,
 'Ginebra',
 'Examen de informes de los Estados. Los países y el plazo para informes alternativos figuran en la página de la sesión.',
 'https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/SessionDetails1.aspx?SessionID=2962&Lang=en',
 '[]'::jsonb)
) as v(sistema, organo, nombre, fecha_inicio, fecha_fin, a_confirmar, lugar, descripcion, fuente_url, fechas_clave)
where not exists (select 1 from sesiones s where s.nombre = v.nombre);

-- ---------- Oportunidades con plazo (quedan en Revisión para que Akãhatã las publique) ----------
insert into oportunidades (sistema, mecanismo, titulo, pais, tema, resumen, angulo_agenda, pasos, fecha_limite, fuente_nombre, fuente_url, clave_fuente, estado)
select * from (values
('OEA'::sistema, 'CIDH · audiencias', 'Pedir una audiencia pública ante la CIDH (198 Período de Sesiones, marzo de 2027)', 'Regional', 'Todos los temas',
 'La CIDH recibe pedidos de audiencias públicas del 19 de noviembre al 10 de diciembre de 2026. Las audiencias serán presenciales, del 15 al 19 de marzo de 2027. Una audiencia permite exponer una situación de derechos humanos ante la Comisión y el Estado.',
 'Las audiencias pueden ser sobre un país o un tema regional. Sumar organizaciones de otros temas (ambiente, migración, trabajo) a un mismo pedido fortalece la solicitud y muestra el cruce de agendas.',
 array['Armar el pedido con otras organizaciones (las audiencias conjuntas tienen más chances)', 'Completar el formulario en línea de la CIDH entre el 19 de noviembre y el 10 de diciembre', 'Esperar la respuesta el 15 de enero de 2027'],
 date '2026-12-10', 'CIDH · Comunicado 250/26', 'https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp', 'cidh-comunicado-2026-250', 'pendiente'::estado_revision),
('ONU'::sistema, 'Comisión de la Condición Jurídica y Social de la Mujer (CSW)', 'Inscribirse para participar en la CSW71 (marzo de 2027, Nueva York)', 'Regional', 'Desarrollo y derechos sociales',
 'Las organizaciones con estatus consultivo ante el ECOSOC pueden inscribir hasta 20 representantes en Indico hasta el 22 de enero de 2027. No se aceptan inscripciones tardías. La ONU no cobra la inscripción, pero tampoco cubre viajes.',
 'El tema de revisión de la CSW71 es clima, ambiente y riesgo de desastres, y el tema transversal es pobreza y autonomía económica. Es una buena puerta para organizaciones que trabajan esos temas.',
 array['Confirmar que la organización tiene estatus ECOSOC (o sumarse a la delegación de una que lo tenga)', 'La persona de enlace de la organización inscribe a cada representante en Indico', 'Inscribirse antes del 22 de enero de 2027'],
 date '2027-01-22', 'ONU Mujeres · CSW71', 'https://indico.un.org/event/1026202/', 'manual:csw71-inscripcion', 'pendiente'::estado_revision),
('OEA'::sistema, 'CIDH · audiencias', 'Pedir una audiencia pública virtual ante la CIDH (199 Período de Sesiones, agosto de 2027)', 'Regional', 'Todos los temas',
 'La CIDH recibe pedidos de audiencias del 2 al 23 de abril de 2027. Las audiencias serán virtuales, del 2 al 6 de agosto de 2027.',
 'Al ser virtual, es una buena oportunidad para organizaciones sin recursos para viajar.',
 array['Armar el pedido con otras organizaciones', 'Completar el formulario de la CIDH entre el 2 y el 23 de abril de 2027', 'Esperar la respuesta el 2 de junio de 2027'],
 date '2027-04-23', 'CIDH · Comunicado 250/26', 'https://www.oas.org/es/CIDH/jsForm/?File=/es/cidh/prensa/comunicados/2026/250.asp', 'manual:cidh-audiencias-199', 'pendiente'::estado_revision)
) as v(sistema, mecanismo, titulo, pais, tema, resumen, angulo_agenda, pasos, fecha_limite, fuente_nombre, fuente_url, clave_fuente, estado)
on conflict (clave_fuente) do nothing;
