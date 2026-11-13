// Recolector diario del radar de incidencia.
//
// Lee las fuentes que se pueden leer automáticamente y guarda cada convocatoria
// nueva como oportunidad "pendiente", para que Akãhatã la revise, complete el
// "cómo sumar tu agenda" y la publique. Nunca publica nada por su cuenta.
//
// Fuentes:
//   - CIDH · Cuestionarios de consulta (oas.org)
//   - ONU · procedimientos especiales y ACNUDH, a través de la página de
//     convocatorias de Geneva Environment Network (ohchr.org bloquea la lectura
//     automática).
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
}

const CIDH_URL = 'https://www.oas.org/es/cidh/jsForm/?File=/es/cidh/informes/cuestionarios.asp';
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
    .replace(/&amp;/g, '&')
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

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const informe: Record<string, unknown> = {};
  const todos: Hallazgo[] = [];

  for (const [nombre, fuente] of [['cidh', deCidh], ['geneva', deGeneva]] as const) {
    try {
      const h = await fuente();
      todos.push(...h);
      informe[nombre] = { encontradas: h.length };
    } catch (e) {
      informe[nombre] = { error: String(e) };
    }
  }

  if (todos.length > 0) {
    const { data, error } = await supabase
      .from('oportunidades')
      .upsert(
        todos.map((h) => ({ ...h, estado: 'pendiente', recolectada_automaticamente: true })),
        { onConflict: 'clave_fuente', ignoreDuplicates: true },
      )
      .select('titulo');
    informe.nuevas = error ? { error: error.message } : (data ?? []).map((d) => d.titulo);
  } else {
    informe.nuevas = [];
  }

  return new Response(JSON.stringify(informe, null, 2), { headers: { 'content-type': 'application/json' } });
});
