-- Hora exacta de cierre de cada oportunidad y la ciudad de referencia de esa hora
-- (por ejemplo, 18:00 hora de Ginebra). Las dos son opcionales.
alter table public.oportunidades
  add column if not exists hora_cierre time,
  add column if not exists zona_cierre text;

-- Enlace correcto del cuestionario de REDESCA (antes llevaba a la lista general de la CIDH).
update public.oportunidades
set fuente_url = 'https://www.oas.org/es/cidh/jsForm/?File=/es/cidh/r/desca/cuestionarios.asp'
where titulo = 'Consulta para el Plan de Trabajo 2027–2029 de la Relatoría DESCA';

-- Hora que indica la convocatoria del Grupo de Trabajo sobre Desapariciones.
update public.oportunidades
set hora_cierre = '18:00', zona_cierre = 'Ginebra'
where titulo = 'Militarización y desapariciones forzadas';
