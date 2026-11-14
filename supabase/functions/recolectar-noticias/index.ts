// Recolector diario de noticias y artículos sobre los espacios internacionales
// de derechos humanos (ONU, OEA, Mercosur).
//
// Lee fuentes que se pueden leer automáticamente (canales RSS y la página de
// comunicados de la CIDH) y guarda cada nota nueva como "pendiente". Akãhatã
// la revisa y la publica. Nunca publica nada por su cuenta. Solo guarda el
// título, un resumen breve, la imagen y el enlace: el texto completo queda en la fuente.

import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

type Sistema = 'ONU' | 'OEA' | 'Mercosur';

interface Nota {
  clave_fuente: string;
  titulo: string;
  resumen: string;
  url: string;
  fuente_nombre: string;
  tipo: 'noticia' | 'articulo';
  sistema: Sistema | null;
  idioma: 'es' | 'en';
  publicada_en: string; // ISO
  imagen_url: string | null;
}

interface FuenteRss {
  nombre: string;
  url: string;
  tipo: Nota['tipo'];
  idioma: Nota['idioma'];
  sistema: Sistema | null;
  /** Si es true, solo entran las notas que mencionan algún mecanismo. */
  filtrar: boolean;
}

const FUENTES_RSS: FuenteRss[] = [
  { nombre: 'Noticias ONU · Derechos humanos', url: 'https://news.un.org/feed/subscribe/es/news/topic/human-rights/feed/rss.xml', tipo: 'noticia', idioma: 'es', sistema: 'ONU', filtrar: false },
  { nombre: 'CEJIL', url: 'https://cejil.org/feed/', tipo: 'noticia', idioma: 'es', sistema: null, filtrar: false },
  { nombre: 'IPS Noticias', url: 'https://ipsnoticias.net/feed/', tipo: 'noticia', idioma: 'es', sistema: null, filtrar: true },
  { nombre: 'Agenda Estado de Derecho', url: 'https://agendaestadodederecho.com/feed/', tipo: 'articulo', idioma: 'es', sistema: null, filtrar: true },
  { nombre: 'Universal Rights Group', url: 'https://www.universal-rights.org/feed/', tipo: 'articulo', idioma: 'en', sistema: 'ONU', filtrar: false },
  { nombre: 'IPPDH · Mercosur', url: 'https://www.ippdh.mercosur.int/feed/', tipo: 'noticia', idioma: 'es', sistema: 'Mercosur', filtrar: false },
];

const CIDH_URL = 'https://www.oas.org/es/cidh/prensa/comunicados.asp';
const DIAS_ATRAS = 21;

const MECANISMOS =
  /\b(ONU|Naciones Unidas|Consejo de Derechos Humanos|ACNUDH|Alto Comisionad|relator|EPU|Examen Peri[óo]dico|CEDAW|CSW|Comit[ée] de|CIDH|Comisi[óo]n Interamericana|Corte (IDH|Interamericana)|OEA|Organizaci[óo]n de los Estados Americanos|Mercosur|IPPDH|RAADH|Human Rights Council|Special Rapporteur|UPR|treaty bod)/i;

const ua = { 'user-agent': 'RedIncidencia/1.0 (+https://fdelio.github.io/AKAHATARED/)' };

function texto(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#8220;|&#8221;|&quot;|&#822[01];/g, '"')
    .replace(/&#8217;|&#039;|&#39;/g, '’')
    .replace(/&#8211;|&#8212;|&mdash;|&ndash;/g, '–')
    .replace(/&#8230;|\[&#8230;\]|\[…\]/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function corto(t: string, max = 400): string {
  const limpio = t.replace(/La entrada .* se publicó primero en .*$/i, '').replace(/The post .* appeared first on .*$/i, '').trim();
  return limpio.length > max ? limpio.slice(0, max).replace(/\s+\S*$/, '') + '…' : limpio;
}

function adivinarSistema(t: string): Sistema | null {
  if (/CIDH|Comisi[óo]n Interamericana|Corte (IDH|Interamericana)|\bOEA\b|Estados Americanos|Inter-American/i.test(t)) return 'OEA';
  if (/Mercosur|IPPDH|RAADH/i.test(t)) return 'Mercosur';
  if (/\bONU\b|Naciones Unidas|Consejo de Derechos Humanos|ACNUDH|relator|EPU|CEDAW|\bUN\b|United Nations|Human Rights Council/i.test(t)) return 'ONU';
  return null;
}

async function leer(url: string, codificacion = 'utf-8'): Promise<string> {
  const r = await fetch(url, { headers: ua });
  if (!r.ok) throw new Error(`${url} respondió ${r.status}`);
  return new TextDecoder(codificacion).decode(await r.arrayBuffer());
}

/** Imagen de la nota: adjunto del RSS, miniatura o la primera imagen del texto. */
function imagenDe(item: string): string | null {
  const candidatos = [
    item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i)?.[1],
    item.match(/<enclosure[^>]+type=["']image[^>]*url=["']([^"']+)["']/i)?.[1],
    item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1],
    item.match(/<media:content[^>]+url=["']([^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i)?.[1],
    item.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
    item.match(/&lt;img[^&]+src=(?:&quot;|["'])([^"'&]+)/i)?.[1],
  ];
  const url = candidatos.find((u) => u && /^https:\/\//.test(u) && !/gravatar|emoji|pixel|feeds\.feedburner/i.test(u));
  return url ? url.replace(/&amp;/g, '&') : null;
}

const desde = () => new Date(Date.now() - DIAS_ATRAS * 86_400_000);

async function deRss(f: FuenteRss): Promise<Nota[]> {
  const xml = await leer(f.url);
  const notas: Nota[] = [];
  for (const m of xml.matchAll(/<item[ >]([\s\S]*?)<\/item>/g)) {
    const item = m[1];
    const campo = (n: string) => item.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`))?.[1] ?? '';
    const titulo = texto(campo('title'));
    const url = texto(campo('link')).replace('news.un.org/feed/view/', 'news.un.org/');
    const fecha = new Date(texto(campo('pubDate')));
    const resumen = corto(texto(campo('description')));
    if (!titulo || !url || isNaN(fecha.getTime()) || fecha < desde()) continue;
    if (f.filtrar && !MECANISMOS.test(titulo + ' ' + resumen)) continue;
    notas.push({
      clave_fuente: url,
      titulo,
      resumen: f.idioma === 'en' ? `[En inglés: traducir al revisar] ${resumen}` : resumen,
      url,
      fuente_nombre: f.nombre,
      tipo: f.tipo,
      sistema: f.sistema ?? adivinarSistema(titulo + ' ' + resumen),
      idioma: f.idioma,
      publicada_en: fecha.toISOString(),
      imagen_url: imagenDe(item),
    });
  }
  return notas;
}

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

async function deCidh(): Promise<Nota[]> {
  const html = await leer(CIDH_URL, 'iso-8859-1');
  const notas: Nota[] = [];
  // <li><a href='...comunicados/2026/250.asp&...'>250/26&mdash;Título</a><br /><span>Washington, DC, 13 de noviembre de 2026</span></li>
  const patron = /<li><a href='[^']*?(\/es\/cidh\/prensa\/comunicados\/\d{4}\/\d+\.asp)[^']*'[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*>([^<]*)<\/span>/gi;
  for (const m of html.matchAll(patron)) {
    const titulo = texto(m[2]).replace(/^[A-Z]*\d+\/\d+\s*[—–-]\s*/, '');
    const f = m[3].match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/i);
    const mes = f && MESES[f[2].toLowerCase()];
    if (!titulo || !f || !mes) continue;
    const fecha = new Date(Date.UTC(+f[3], mes - 1, +f[1], 12));
    if (fecha < desde()) continue;
    const url = 'https://www.oas.org/es/CIDH/jsForm/?File=' + m[1];
    notas.push({
      clave_fuente: url,
      titulo,
      resumen: '',
      url,
      fuente_nombre: 'CIDH · Comunicados de prensa',
      tipo: 'noticia',
      sistema: 'OEA',
      idioma: 'es',
      publicada_en: fecha.toISOString(),
      imagen_url: null,
    });
  }
  return notas;
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const informe: Record<string, unknown> = {};
  const todas: Nota[] = [];
  const tareas: [string, () => Promise<Nota[]>][] = [
    ['CIDH', deCidh],
    ...FUENTES_RSS.map((f) => [f.nombre, () => deRss(f)] as [string, () => Promise<Nota[]>]),
  ];
  await Promise.all(
    tareas.map(async ([nombre, fn]) => {
      try {
        const n = await fn();
        todas.push(...n);
        informe[nombre] = n.length;
      } catch (e) {
        informe[nombre] = { error: String(e) };
      }
    }),
  );

  if (todas.length > 0) {
    const { data, error } = await supabase
      .from('noticias')
      .upsert(
        todas.map((n) => ({ ...n, estado: 'pendiente', recolectada_automaticamente: true })),
        { onConflict: 'clave_fuente', ignoreDuplicates: true },
      )
      .select('titulo');
    informe.nuevas = error ? { error: error.message } : (data ?? []).length;

    // Las que ya estaban sin imagen y ahora la tienen.
    let imagenes = 0;
    for (const n of todas.filter((x) => x.imagen_url)) {
      const { data: d } = await supabase
        .from('noticias')
        .update({ imagen_url: n.imagen_url })
        .eq('clave_fuente', n.clave_fuente)
        .is('imagen_url', null)
        .select('id');
      imagenes += d?.length ?? 0;
    }
    informe.imagenes_agregadas = imagenes;
  }
  return new Response(JSON.stringify(informe, null, 2), { headers: { 'content-type': 'application/json' } });
});
