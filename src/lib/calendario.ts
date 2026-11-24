// Fechas y horas de cierre, y "Agregar a mi calendario" (Google Calendar o archivo .ics para el celular y Outlook).
import type { Oportunidad, SesionOrgano } from '../types';

/** Ciudades de referencia que usan los mecanismos para sus plazos. */
export const ZONAS: Record<string, string> = {
  Ginebra: 'Europe/Zurich',
  'Nueva York': 'America/New_York',
  Washington: 'America/New_York',
  'San José (Costa Rica)': 'America/Costa_Rica',
  'Buenos Aires': 'America/Argentina/Buenos_Aires',
  Montevideo: 'America/Montevideo',
  Asunción: 'America/Asuncion',
  'Ciudad de México': 'America/Mexico_City',
  Bogotá: 'America/Bogota',
  Lima: 'America/Lima',
  Santiago: 'America/Santiago',
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function horaCorta(h: string | null | undefined): string | null {
  return h ? h.slice(0, 5) : null;
}

/** Cuántos minutos está adelantada la zona respecto de UTC en ese momento. */
function desfase(utcMs: number, zona: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(utcMs));
  const v = (t: string) => Number(partes.find((p) => p.type === t)?.value);
  return (Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute')) - utcMs) / 60_000;
}

/** El momento exacto de cierre, o null si no se sabe la hora o la ciudad. */
export function momentoDeCierre(o: Pick<Oportunidad, 'fecha_limite' | 'hora_cierre' | 'zona_cierre'>): Date | null {
  const h = horaCorta(o.hora_cierre);
  const zona = o.zona_cierre ? ZONAS[o.zona_cierre] : null;
  if (!h || !zona) return null;
  const [a, m, d] = o.fecha_limite.split('-').map(Number);
  const [hh, mm] = h.split(':').map(Number);
  const supuesto = Date.UTC(a, m - 1, d, hh, mm);
  // Dos pasadas por si el cambio de horario cae justo entre medio.
  let utc = supuesto - desfase(supuesto, zona) * 60_000;
  utc = supuesto - desfase(utc, zona) * 60_000;
  return new Date(utc);
}

/** "15 de enero de 2027" */
export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** "15 de enero de 2027 a las 18:00 (hora de Ginebra)" */
export function textoCierre(o: Pick<Oportunidad, 'fecha_limite' | 'hora_cierre' | 'zona_cierre'>): string {
  const h = horaCorta(o.hora_cierre);
  let t = fechaLarga(o.fecha_limite);
  if (h) t += ` a las ${h}`;
  if (h && o.zona_cierre) t += ` (hora de ${o.zona_cierre})`;
  return t;
}

/** La misma hora en la zona de quien mira, si es distinta: "14:00" o "2:00 del 16 de enero". */
export function enTuHora(o: Pick<Oportunidad, 'fecha_limite' | 'hora_cierre' | 'zona_cierre'>): string | null {
  const m = momentoDeCierre(o);
  if (!m) return null;
  const local = `${String(m.getHours()).padStart(2, '0')}:${String(m.getMinutes()).padStart(2, '0')}`;
  const mismoDia = m.getDate() === Number(o.fecha_limite.slice(8, 10));
  if (local === horaCorta(o.hora_cierre) && mismoDia) return null;
  return mismoDia ? local : `${local} del ${m.getDate()} de ${MESES[m.getMonth()]}`;
}

// ---------- Agregar a mi calendario ----------

export interface Evento {
  titulo: string;
  detalle: string;
  /** Con hora: momento exacto. Sin hora: días completos, fin inclusive (YYYY-MM-DD). */
  inicio: Date | string;
  fin: Date | string;
  enlace: string | null;
}

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dia = (f: string) => f.replace(/-/g, '');
function diaSiguiente(f: string): string {
  const d = new Date(f + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function fechas(e: Evento): [string, string] {
  return typeof e.inicio === 'string'
    ? [dia(e.inicio), dia(diaSiguiente(e.fin as string))]
    : [utc(e.inicio), utc(e.fin as Date)];
}

export function eventoDeOportunidad(o: Oportunidad): Evento {
  const m = momentoDeCierre(o);
  const detalle = [`Cierra el ${textoCierre(o)}.`, o.resumen, o.fuente_url ? `Convocatoria oficial: ${o.fuente_url}` : '', 'Akãhatã: Sonar de incidencia']
    .filter(Boolean)
    .join('\n\n');
  return {
    titulo: `Cierra: ${o.titulo}`,
    detalle,
    // Con hora: un recordatorio de 30 minutos que termina justo al cierre.
    inicio: m ? new Date(m.getTime() - 30 * 60_000) : o.fecha_limite,
    fin: m ?? o.fecha_limite,
    enlace: o.fuente_url,
  };
}

export function eventoDeSesion(s: SesionOrgano): Evento {
  const detalle = [s.descripcion, s.lugar ? `Lugar: ${s.lugar}` : '', s.fuente_url ? `Página oficial: ${s.fuente_url}` : '', 'Akãhatã: Sonar de incidencia']
    .filter(Boolean)
    .join('\n\n');
  return { titulo: s.nombre, detalle, inicio: s.fecha_inicio, fin: s.fecha_fin ?? s.fecha_inicio, enlace: s.fuente_url };
}

export function enlaceGoogle(e: Evento): string {
  const [i, f] = fechas(e);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: e.titulo, dates: `${i}/${f}`, details: e.detalle });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}

const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => '\\' + c);

/** Archivo .ics (Apple, Outlook, el calendario del celular), con aviso tres días antes. */
export function archivoIcs(e: Evento): string {
  const [i, f] = fechas(e);
  const conHora = typeof e.inicio !== 'string';
  const lineas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Akahata//Sonar de incidencia//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@radar-akahata`,
    `DTSTAMP:${utc(new Date())}`,
    conHora ? `DTSTART:${i}` : `DTSTART;VALUE=DATE:${i}`,
    conHora ? `DTEND:${f}` : `DTEND;VALUE=DATE:${f}`,
    `SUMMARY:${escapar(e.titulo)}`,
    `DESCRIPTION:${escapar(e.detalle)}`,
    ...(e.enlace ? [`URL:${e.enlace}`] : []),
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapar(e.titulo)}`, 'TRIGGER:-P3D', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lineas.join('\r\n') + '\r\n';
}

export function descargarIcs(e: Evento) {
  const blob = new Blob([archivoIcs(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = e.titulo.replace(/[^\p{L}\p{N} ]+/gu, '').trim().slice(0, 60) + '.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
