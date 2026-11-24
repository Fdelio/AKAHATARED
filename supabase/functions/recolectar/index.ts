// Recolector diario del radar de incidencia.
//
// Lee las fuentes que se pueden leer automáticamente y guarda cada convocatoria
// nueva como oportunidad "pendiente", para que Akãhatã la revise, complete el
// "cómo sumar tu agenda" y la publique. Nunca publica nada por su cuenta.
//
// Fuentes:
//   - CIDH · Cuestionarios de consulta (oas.org)
//   - CIDH · Comunicados de prensa que abren un plazo para la sociedad civil
//     (pedidos de audiencias, consultas públicas, convocatorias). Se guarda el
//     enlace al comunicado específico.
//   - CIDH y REDESCA a través de Google Noticias: desde noviembre de 2026
//     oas.org bloquea la lectura automática (Cloudflare), así que las dos
//     fuentes anteriores pueden volver vacías. Google solo trae el título y la
//     fecha, no el texto: el plazo se estima y se avisa para que Akãhatã lo
//     confirme en el comunicado antes de publicar.
//   - ONU · procedimientos especiales y ACNUDH, a través de la página de
//     convocatorias de Geneva Environment Network (ohchr.org bloquea la lectura
//     automática).
//   - ONU · órganos de tratados (CEDAW, DESC, Derechos Humanos, Niñez, CERD,
//     Tortura, Discapacidad, Migrantes, Desapariciones), desde la base de
//     sesiones tbinternet.ohchr.org: una oportunidad por cada país de América
//     Latina y el Caribe que se examina en una sesión próxima. Si la página de
//     la sesión no trae el plazo para la sociedad civil, se pone uno estimado
//     y se avisa en el resumen para que Akãhatã lo confirme.
//
// Con ?probar=1 devuelve lo que encontró sin guardar nada.
//
// No repite: cada convocatoria tiene una "clave_fuente" única.

import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

interface Hallazgo {
  clave_fuente: string;
  sistema: 'ONU' | 'OEA' | 'Mercosur';
  mecanismo: string;
  titulo: string;
  resumen: string;
  tema: string;
  fecha_limite: string; // YYYY-MM-DD
  fuente_nombre: string;
  fuente_url: string;
  pais?: string;
  pasos?: string[];
}

const CIDH_URL = 'https://www.oas.org/es/cidh/jsForm/?File=/es/cidh/informes/cuestionarios.asp';
const CIDH_COMUNICADOS_URL = 'https://www.oas.org/es/cidh/prensa/comunicados.asp';
/** Títulos de comunicados que suelen abrir un plazo para participar. */
const CONVOCA =
  /solicitudes? de audiencia|solicitar audiencia|recibe solicitudes|consulta p[úu]blica|convoca|convocatoria|abre (?:el )?(?:plazo|registro|inscripci)|registro para participar|cuestionario|llamado a/i;
const CIDH_GN_URL = 'https://news.google.com/rss/search?q=site:oas.org/es+when:30d&hl=es-419&gl=US&ceid=US:es-419';
const GEN_URL = 'https://www.genevaenvironmentnetwork.org/resources/updates/special-procedures-of-the-human-rights-council/';

const MESES_ES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const MESES_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
};

const hoy = () => new Date().toISOString().slice(0, 10);
const iso = (a: number, m: number, d: number) =>
  `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Quita etiquetas y entidades HTML. */
function texto(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8217;/g, '’')
    .replace(/&([aeiouAEIOU])acute;/g, (_, v) => v.normalize('NFD') + '\u0301')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&mdash;|&#8212;|&ndash;|&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "23 de noviembre [de 2026]" -> fecha ISO. Sin año: el próximo 23 de noviembre. */
function fechaEs(t: string): string | null {
  const m = t.match(/(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i);
  if (!m) return null;
  const mes = MESES_ES[m[2].toLowerCase()];
  if (!mes) return null;
  const dia = Number(m[1]);
  let anio = m[3] ? Number(m[3]) : new Date().getFullYear();
  if (!m[3] && iso(anio, mes, dia) < hoy()) anio += 1;
  return iso(anio, mes, dia);
}

/** "31 December 2026" o "December 31, 2026" -> fecha ISO. */
function fechaEn(t: string): string | null {
  let m = t.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (m && MESES_EN[m[2].toLowerCase()]) return iso(Number(m[3]), MESES_EN[m[2].toLowerCase()], Number(m[1]));
  m = t.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MESES_EN[m[1].toLowerCase()]) return iso(Number(m[3]), MESES_EN[m[1].toLowerCase()], Number(m[2]));
  return null;
}

/** Tema aproximado por palabras clave. Akãhatã lo corrige al revisar. */
function adivinarTema(t: string): string {
  const s = t.toLowerCase();
  const reglas: [RegExp, string][] = [
    [/clim|ambient|environment|agua|water|tóxic|toxic|miner|extract/, 'Ambiente y clima'],
    [/migra|refugi|desplaz|fronter|displac|border/, 'Migración'],
    [/empresa|business|econom|trabajo|labou?r|financ|deuda|debt/, 'Empresas y economía'],
    [/salud|health/, 'Salud'],
    [/educa/, 'Educación'],
    [/lgbti|orientación sexual|sexual orientation|gender identity|identidad de género|trans\b/, 'Personas LGBTI+'],
    [/mujer|women|girls|niñas|género|gender/, 'Violencia de género'],
    [/desca|social|pobreza|poverty|vivienda|housing|aliment|food|desarroll|develop/, 'Desarrollo y derechos sociales'],
  ];
  return reglas.find(([r]) => r.test(s))?.[1] ?? 'Otro';
}

async function leer(url: string, codificacion = 'utf-8'): Promise<string> {
  const r = await fetch(url, { headers: { 'user-agent': 'RedIncidencia/1.0 (+https://fdelio.github.io/AKAHATARED/)' } });
  if (!r.ok) throw new Error(`${url} respondió ${r.status}`);
  return new TextDecoder(codificacion).decode(await r.arrayBuffer());
}

async function deCidh(): Promise<Hallazgo[]> {
  const html = await leer(CIDH_URL, 'iso-8859-1');
  const bloques = html.split(/<div>\s*<h1 style='margin:0'>/).slice(1);
  const hallazgos: Hallazgo[] = [];
  for (const b of bloques) {
    const img = b.match(/src="[^"]*\/(q\d+)_SPA\.png"[^>]*alt="([^"]+)"/);
    if (!img) continue;
    const plano = texto(b);
    // Ojo: el texto puede traer "9:00 a.m." antes de la fecha, por eso no se corta en el punto.
    const plazo = plano.match(/(?:plazo|vence)[\s\S]{0,160}/i)?.[0] ?? '';
    const fecha = fechaEs(plazo);
    if (!fecha || fecha < hoy()) continue;
    const titulo = img[2].replace(/^Cuestionario de Consulta:\s*/i, '').trim();
    const parrafos = [...b.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => texto(m[1])).filter((p) => p.length > 60);
    const relatoria = plano.match(/Relator[ií]a (?:Especial )?sobre [^,(]+/)?.[0];
    hallazgos.push({
      clave_fuente: `cidh-cuestionario-${img[1]}`,
      sistema: 'OEA',
      mecanismo: relatoria ? `CIDH · ${relatoria.trim()}` : 'CIDH',
      titulo,
      resumen: parrafos.slice(0, 2).join(' '),
      tema: adivinarTema(titulo + ' ' + plano),
      fecha_limite: fecha,
      fuente_nombre: 'CIDH · Cuestionarios de consulta',
      fuente_url: b.match(/class='listOfLinks'><li><a[^>]*href='([^']+)'/)?.[1] ?? CIDH_URL,
    });
  }
  return hallazgos;
}

/**
 * Busca la fecha de cierre en el texto de un comunicado: lo que viene después
 * de "solicitudes", "plazo", "hasta", etc. En "del 19 de noviembre al 10 de
 * diciembre de 2026" toma el 10 de diciembre.
 */
function cierreEnComunicado(t: string): string | null {
  for (const m of t.matchAll(/(?:solicitud|plazo|vence|hasta|cierr|registro|inscrip|recib)[\s\S]{0,220}/gi)) {
    const tramo = m[0];
    const rango = tramo.match(/del?\s+\d{1,2}(?:\s+de\s+[a-záéíóú]+)?(?:\s+de\s+\d{4})?\s+(?:al|hasta el)\s+(\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+de\s+\d{4})?)/i);
    const fecha = fechaEs(rango ? rango[1] : tramo);
    if (fecha && fecha >= hoy()) return fecha;
  }
  return null;
}

async function deComunicadosCidh(): Promise<Hallazgo[]> {
  const html = await leer(CIDH_COMUNICADOS_URL, 'iso-8859-1');
  const hace30 = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const patron = /<li><a href='[^']*?(\/es\/cidh\/prensa\/comunicados\/(\d{4})\/(\d+)\.asp)[^']*'[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*>([^<]*)<\/span>/gi;
  const hallazgos: Hallazgo[] = [];
  for (const m of html.matchAll(patron)) {
    const titulo = texto(m[4]).replace(/^[A-Z]*\d+\/\d+\s*[—–-]\s*/, '');
    const publicado = fechaEs(m[5]);
    if (!titulo || !CONVOCA.test(titulo) || !publicado || publicado < hace30) continue;
    const url = 'https://www.oas.org/es/CIDH/jsForm/?File=' + m[1];
    try {
      const cuerpo = texto(await leer(url, 'iso-8859-1'));
      const desde = cuerpo.search(/Washington,? D\.?C\.?\s*[—–-]/);
      const nota = desde >= 0 ? cuerpo.slice(desde) : cuerpo;
      const fecha = cierreEnComunicado(nota);
      if (!fecha) continue;
      hallazgos.push({
        clave_fuente: `cidh-comunicado-${m[2]}-${m[3]}`,
        sistema: 'OEA',
        mecanismo: /audiencia/i.test(titulo) ? 'CIDH · audiencias' : 'CIDH · consultas públicas',
        titulo,
        resumen: nota.replace(/^Washington,? D\.?C\.?\s*[—–-]\s*/, '').slice(0, 600),
        tema: adivinarTema(titulo + ' ' + nota.slice(0, 1500)),
        fecha_limite: fecha,
        fuente_nombre: `CIDH · Comunicado ${m[3]}/${m[2].slice(2)}`,
        fuente_url: url,
      });
    } catch {
      // Si un comunicado no se puede leer, se sigue con los demás.
    }
  }
  return hallazgos;
}

/** Para comparar títulos que llegan por caminos distintos. */
const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^cuestionario de consulta:?\s*/, '').replace(/[^a-z0-9]+/g, ' ').trim();

async function deCidhGoogle(): Promise<Hallazgo[]> {
  const xml = await leer(CIDH_GN_URL);
  const hace30 = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const hallazgos: Hallazgo[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const campo = (n: string) => m[1].match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`))?.[1] ?? '';
    const titulo = texto(campo('title').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, '’'))
      .replace(/\s+-\s+(OAS\.org|OAS - Organization of American States)$/i, '')
      .trim();
    const url = texto(campo('link'));
    const fecha = new Date(texto(campo('pubDate')));
    if (!titulo || !url || isNaN(fecha.getTime())) continue;
    const publicado = fecha.toISOString().slice(0, 10);
    if (publicado < hace30) continue;
    if (!/CIDH|Comisi[óo]n Interamericana|REDESCA|Relator[íi]a|Cuestionario/i.test(titulo)) continue;
    if (!(CONVOCA.test(titulo) || /invita a (participar|presentar|enviar)|contribuciones/i.test(titulo))) continue;
    // Sin el texto no se sabe el plazo: se estima en tres semanas desde la publicación.
    const estimada = restarDias(publicado, -21);
    const plazo = estimada >= hoy() ? estimada : restarDias(hoy(), -7);
    const cuestionario = /cuestionario/i.test(titulo);
    const relatoria = titulo.match(/REDESCA|Relator[íi]a (?:Especial )?(?:sobre|para) [^,(:]+/i)?.[0];
    hallazgos.push({
      clave_fuente: `cidh-gn-${normalizar(titulo).replace(/ /g, '-').slice(0, 120)}`,
      sistema: 'OEA',
      mecanismo: relatoria ? `CIDH · ${relatoria.trim()}` : /audiencia/i.test(titulo) ? 'CIDH · audiencias' : 'CIDH · consultas públicas',
      titulo: titulo.replace(/^Cuestionario de Consulta:\s*/i, '').trim(),
      resumen: `Publicado por la CIDH el ${legible(publicado)}. Plazo estimado (tres semanas desde la publicación): abrir el enlace y confirmar la fecha y la forma de envío antes de publicar.`,
      tema: adivinarTema(titulo),
      fecha_limite: plazo,
      fuente_nombre: cuestionario ? 'CIDH · Cuestionarios de consulta' : 'CIDH · Comunicados de prensa',
      fuente_url: url,
    });
  }
  return hallazgos;
}

async function deGeneva(): Promise<Hallazgo[]> {
  const html = await leer(GEN_URL);
  const hallazgos: Hallazgo[] = [];
  // Cada convocatoria es un <h4> con su título, debajo del <h2> del mandato.
  const partes = html.split(/(?=<h2[ >])/);
  for (const parte of partes) {
    const mandato = texto(parte.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '');
    const convocatorias = parte.split(/(?=<h4[ >])/).slice(1);
    for (const c of convocatorias) {
      const titulo = texto(c.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)?.[1] ?? '');
      const linea = c.match(/Deadline[\s\S]{0,800}?<\/p>/i)?.[0] ?? '';
      const fecha = fechaEn(texto(linea));
      const enlace = c.match(/href="(https:\/\/www\.ohchr\.org\/en\/calls-for-input\/[^"]+)"/)?.[1];
      if (!titulo || !fecha || !enlace || fecha < hoy()) continue;
      const resumen = [...c.matchAll(/<p>([\s\S]*?)<\/p>/g)]
        .map((m) => texto(m[1]))
        .filter((p) => p.length > 60 && !/^Deadline/i.test(p))
        .slice(0, 2)
        .join(' ');
      hallazgos.push({
        clave_fuente: `ohchr:${enlace}`,
        sistema: 'ONU',
        mecanismo: mandato || 'Procedimientos especiales',
        titulo,
        resumen: `[En inglés: traducir al revisar] ${resumen}`,
        tema: adivinarTema(titulo + ' ' + resumen),
        fecha_limite: fecha,
        fuente_nombre: 'ACNUDH · Calls for input (vía Geneva Environment Network)',
        fuente_url: enlace,
      });
    }
  }
  return hallazgos;
}

// ---------- Órganos de tratados (tbinternet.ohchr.org) ----------

const TB = 'https://tbinternet.ohchr.org/_layouts/15/TreatyBodyExternal/';

/** Código del comité en tbinternet -> nombre en la app y tema por defecto. */
const COMITES: Record<string, { nombre: string; tema: string }> = {
  CEDAW: { nombre: 'Comité CEDAW', tema: 'Todos los temas' },
  CESCR: { nombre: 'Comité DESC', tema: 'Desarrollo y derechos sociales' },
  CCPR: { nombre: 'Comité de Derechos Humanos', tema: 'Todos los temas' },
  CRC: { nombre: 'Comité de los Derechos del Niño', tema: 'Todos los temas' },
  CERD: { nombre: 'Comité CERD', tema: 'Todos los temas' },
  CAT: { nombre: 'Comité contra la Tortura', tema: 'Todos los temas' },
  CRPD: { nombre: 'Comité CDPD', tema: 'Todos los temas' },
  CMW: { nombre: 'Comité de Trabajadores Migratorios', tema: 'Migración' },
  CED: { nombre: 'Comité contra la Desaparición Forzada', tema: 'Todos los temas' },
};

/** Países de América Latina y el Caribe, como los escribe la ONU en inglés. */
export const REGION: Record<string, string> = {
  'Antigua and Barbuda': 'Antigua y Barbuda', Argentina: 'Argentina', Bahamas: 'Bahamas', Barbados: 'Barbados',
  Belize: 'Belice', 'Bolivia (Plurinational State of)': 'Bolivia', Brazil: 'Brasil', Chile: 'Chile', Colombia: 'Colombia',
  'Costa Rica': 'Costa Rica', Cuba: 'Cuba', Dominica: 'Dominica', 'Dominican Republic': 'República Dominicana',
  Ecuador: 'Ecuador', 'El Salvador': 'El Salvador', Grenada: 'Granada', Guatemala: 'Guatemala', Guyana: 'Guyana',
  Haiti: 'Haití', Honduras: 'Honduras', Jamaica: 'Jamaica', Mexico: 'México', Nicaragua: 'Nicaragua', Panama: 'Panamá',
  Paraguay: 'Paraguay', Peru: 'Perú', 'Saint Kitts and Nevis': 'San Cristóbal y Nieves', 'Saint Lucia': 'Santa Lucía',
  'Saint Vincent and the Grenadines': 'San Vicente y las Granadinas', Suriname: 'Surinam',
  'Trinidad and Tobago': 'Trinidad y Tobago', Uruguay: 'Uruguay', 'Venezuela (Bolivarian Republic of)': 'Venezuela',
};

/** Qué se examina, según el encabezado de la lista de la ONU. null = no es una instancia para la sociedad civil. */
const TIPOS: Record<string, 'informe' | 'lista' | 'seguimiento' | 'adicional' | null> = {
  'STATES PARTIES REPORTS': 'informe',
  'NON REPORTING STATE': 'informe',
  OPSC: 'informe',
  OPAC: 'informe',
  'LISTS OF ISSUES PRIOR TO REPORTING': 'lista',
  'LISTS OF ISSUES IN ABSENCE OF A REPORT': 'lista',
  'LISTS OF ISSUES': 'lista',
  'FOLLOW-UP TO CONCLUDING OBSERVATIONS': 'seguimiento',
  'REPORTS ON ADDITIONAL INFORMATION': 'adicional',
  'LIST OF THEMES ON ADDITIONAL INFORMATION': 'adicional',
  'STAND ALONE REQUEST FOR ADDITIONAL INFORMATION': 'adicional',
  'INDIVIDUAL COMMUNICATIONS DECIDED': null,
  'ARTICLE 34': null,
};
const ENCABEZADO = new RegExp(
  '(' + Object.keys(TIPOS).sort((a, b) => b.length - a.length).map((k) => k.replace(/[-()]/g, '\\$&')).join('|') + ')(?= )',
  'g',
);

const MESES_CORTOS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const MESES_NOMBRE = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** "08 Feb 2027" -> "2027-02-08" */
function fechaCorta(t: string): string | null {
  const m = t.match(/(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})/);
  return m && MESES_CORTOS[m[2]] ? iso(Number(m[3]), MESES_CORTOS[m[2]], Number(m[1])) : null;
}
const legible = (f: string) => {
  const [a, m, d] = f.split('-').map(Number);
  return `${d} de ${MESES_NOMBRE[m - 1]} de ${a}`;
};
const restarDias = (f: string, n: number) => new Date(new Date(f + 'T12:00:00Z').getTime() - n * 86_400_000).toISOString().slice(0, 10);

export interface SesionTB {
  id: string;
  numero: string;
  previo: boolean;
  inicio: string;
  fin: string;
  /** País (en inglés) -> qué se examina. */
  paises: Map<string, 'informe' | 'lista' | 'seguimiento' | 'adicional'>;
}

/** Lee la lista de sesiones de un comité (texto ya sin etiquetas). */
export function sesionesDeLaLista(plano: string): SesionTB[] {
  const desde = plano.indexOf('items in');
  const cuerpo = desde >= 0 ? plano.slice(desde) : plano;
  const fila = /(\d{4}) (.{1,120}?) (Consideration of State Reports|\(Pre-Sessional Working Group\) Pre-Sessional Working Group) \d (\d\d [A-Z][a-z]{2} \d{4}) (\d\d [A-Z][a-z]{2} \d{4})/g;
  const filas = [...cuerpo.matchAll(fila)];
  return filas.map((m, i) => {
    const resto = cuerpo.slice(m.index! + m[0].length, i + 1 < filas.length ? filas[i + 1].index : undefined);
    const paises = new Map<string, 'informe' | 'lista' | 'seguimiento' | 'adicional'>();
    // Después de los encabezados la ONU repite las listas sin encabezado: se corta ahí.
    const partes = resto.split(ENCABEZADO).slice(1);
    for (let j = 0; j < partes.length; j += 2) {
      const tipo = TIPOS[partes[j]];
      let valor = partes[j + 1] ?? '';
      if (j + 2 >= partes.length) {
        // El último bloque incluye la repetición: se queda con lo que va hasta que vuelve a empezar la primera lista.
        const primera = (partes[1] ?? '').trim();
        const corte = primera ? valor.indexOf(' ' + primera.split(',')[0], j === 0 ? 1 : 0) : -1;
        if (corte > 0) valor = valor.slice(0, corte);
      }
      if (!tipo) continue;
      for (const pais of Object.keys(REGION)) {
        const re = new RegExp('(^|[ ,])' + pais.replace(/[()]/g, '\\$&') + '( \\(Initial report\\))?(,|$| )');
        if (re.test(' ' + valor.trim() + ' ') && !paises.has(pais)) paises.set(pais, tipo);
      }
    }
    return {
      id: m[1],
      // La ONU repite la etiqueta: "121 (to be confirmed) 121 (to be confirmed)".
      numero: m[2].match(/^\d+/)?.[0] ?? m[2].slice(0, Math.ceil(m[2].length / 2)).replace(/[:\s]+$/, ''),
      previo: m[3].startsWith('('),
      inicio: fechaCorta(m[4])!,
      fin: fechaCorta(m[5])!,
      paises,
    };
  }).filter((s) => !/cancel/i.test(s.numero));
}

/**
 * Busca en la página de la sesión un plazo para la sociedad civil que se refiera al país.
 * La secretaría a veces escribe "(Deadline for CSO ... : 7 DECEMBER 2026)" junto a la lista
 * de países a los que aplica: solo se usa si el país aparece poco antes del plazo.
 */
export function plazoEnSesion(plano: string, pais: string): string | null {
  const nombre = pais.split(' (')[0].toLowerCase();
  for (const m of plano.matchAll(/deadline[^:)]{0,120}:\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/gi)) {
    const antes = plano.slice(Math.max(0, m.index! - 400), m.index!).toLowerCase();
    const fecha = fechaEn(m[1]);
    if (fecha && antes.includes(nombre)) return fecha;
  }
  return null;
}

async function deTratados(): Promise<Hallazgo[]> {
  const hallazgos: Hallazgo[] = [];
  const listas = await Promise.all(
    Object.keys(COMITES).map(async (codigo) => {
      try {
        return { codigo, sesiones: sesionesDeLaLista(texto(await leer(`${TB}SessionsList.aspx?Treaty=${codigo}`))) };
      } catch {
        return { codigo, sesiones: [] as SesionTB[] };
      }
    }),
  );
  const tareas: Promise<void>[] = [];
  for (const { codigo, sesiones } of listas) {
    const comite = COMITES[codigo];
    for (const s of sesiones) {
      if (s.inicio < hoy() || s.paises.size === 0) continue;
      const url = `${TB}SessionDetails1.aspx?SessionID=${s.id}&Lang=en`;
      tareas.push((async () => {
        let pagina = '';
        try {
          pagina = texto(await leer(url));
        } catch {
          // Sin la página se sigue con el plazo estimado.
        }
        for (const [pais, tipo] of s.paises) {
          const nombre = REGION[pais];
          const real = pagina ? plazoEnSesion(pagina, pais) : null;
          // Sin plazo publicado: seis semanas antes de que empiece la sesión.
          const fecha = real ?? restarDias(s.inicio, 42);
          if (fecha < hoy()) continue;
          const instancia = s.previo ? `grupo de trabajo previo a la sesión ${s.numero}` : `sesión ${s.numero}`;
          const titulo = {
            informe: `Examen de ${nombre} ante el ${comite.nombre}: informe alternativo`,
            lista: `Lista de cuestiones para ${nombre} (${comite.nombre}): aportes de la sociedad civil`,
            seguimiento: `Seguimiento de las recomendaciones a ${nombre} (${comite.nombre})`,
            adicional: `${comite.nombre}: información adicional sobre ${nombre}`,
          }[tipo];
          const queHace = {
            informe: `examina el informe de ${nombre}`,
            lista: `prepara la lista de cuestiones (las preguntas que ${nombre} tiene que responder)`,
            seguimiento: `revisa si ${nombre} cumplió las recomendaciones prioritarias de su último examen`,
            adicional: `revisa la información adicional sobre ${nombre}`,
          }[tipo];
          const aviso = real
            ? `Plazo para la sociedad civil: ${legible(real)}, según la página de la sesión.`
            : `Plazo estimado (seis semanas antes de la sesión): confirmarlo en la página oficial antes de publicar.`;
          hallazgos.push({
            clave_fuente: `tb-${codigo}-${s.id}-${pais.toLowerCase().replace(/[^a-z]+/g, '-')}`,
            sistema: 'ONU',
            mecanismo: comite.nombre,
            titulo,
            pais: nombre,
            resumen: `El ${comite.nombre} ${queHace} en el ${instancia}, del ${legible(s.inicio)} al ${legible(s.fin)}. Las organizaciones pueden mandar información propia antes de esa fecha. ${aviso}`,
            tema: comite.tema,
            fecha_limite: fecha,
            fuente_nombre: `ONU · Base de datos de órganos de tratados (sesión ${s.numero})`,
            fuente_url: url,
            pasos: [
              'Abrir la página oficial de la sesión y buscar la nota para la sociedad civil: plazo, extensión y a dónde se envía',
              `Preparar un informe breve con datos y casos de ${nombre}, ligados a los artículos del tratado`,
              'Enviarlo antes del plazo por el medio que indica el Comité',
            ],
          });
        }
      })());
    }
  }
  await Promise.all(tareas);
  return hallazgos;
}

Deno.serve(async (req: Request) => {
  const probar = new URL(req.url).searchParams.has('probar');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const informe: Record<string, unknown> = {};
  const todos: Hallazgo[] = [];

  for (const [nombre, fuente] of [['cidh', deCidh], ['cidh-comunicados', deComunicadosCidh], ['cidh-google', deCidhGoogle], ['geneva', deGeneva], ['tratados', deTratados]] as const) {
    try {
      const h = await fuente();
      todos.push(...h);
      informe[nombre] = { encontradas: h.length };
    } catch (e) {
      informe[nombre] = { error: String(e) };
    }
  }

  // Lo que llega por Google Noticias puede ser algo ya leído directo de oas.org o ya
  // guardado (con otra clave): se descarta por título.
  const vistos = new Set<string>();
  const { data: guardadas } = await supabase
    .from('oportunidades')
    .select('titulo')
    .gte('creada_en', new Date(Date.now() - 60 * 86_400_000).toISOString());
  for (const g of guardadas ?? []) vistos.add(normalizar(g.titulo));
  for (const h of todos) if (!h.clave_fuente.startsWith('cidh-gn-')) vistos.add(normalizar(h.titulo));
  const unicos = todos.filter((h) => {
    if (!h.clave_fuente.startsWith('cidh-gn-')) return true;
    const k = normalizar(h.titulo);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  todos.length = 0;
  todos.push(...unicos);

  if (probar) {
    return new Response(JSON.stringify({ ...informe, hallazgos: todos }, null, 2), { headers: { 'content-type': 'application/json' } });
  }

  if (todos.length > 0) {
    const { data, error } = await supabase
      .from('oportunidades')
      .upsert(
        // Todas las filas llevan las mismas columnas: si falta una, se guardaría vacía.
        todos.map((h) => ({ ...h, pais: h.pais ?? 'Regional', pasos: h.pasos ?? [], estado: 'pendiente', recolectada_automaticamente: true })),
        { onConflict: 'clave_fuente', ignoreDuplicates: true },
      )
      .select('titulo');
    informe.nuevas = error ? { error: error.message } : (data ?? []).map((d) => d.titulo);
  } else {
    informe.nuevas = [];
  }

  return new Response(JSON.stringify(informe, null, 2), { headers: { 'content-type': 'application/json' } });
});
