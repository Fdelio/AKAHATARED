// Edge Function de prueba: ¿puede el servidor de la app leer las páginas de
// donde sale el radar? Visita cada fuente y devuelve si respondió con la
// página o la rechazó (por ejemplo, por protección contra robots).
//
// Uso, una vez desplegada en Supabase:
//   curl -H "Authorization: Bearer <SUPABASE_ANON_KEY>" https://<proyecto>.supabase.co/functions/v1/probar-fuentes
//
// No guarda nada: solo sirve para decidir qué fuentes se pueden recolectar solas.

const FUENTES: { nombre: string; url: string }[] = [
  { nombre: 'ONU · Llamados a contribuciones', url: 'https://www.ohchr.org/en/calls-for-input-listing' },
  { nombre: 'ONU · Calendario del EPU', url: 'https://www.ohchr.org/en/hr-bodies/upr/upr-main' },
  { nombre: 'ONU · Sesiones de órganos de tratados', url: 'https://tbinternet.ohchr.org/_layouts/15/TreatyBodyExternal/SessionsList.aspx' },
  { nombre: 'OEA · Comunicados de la CIDH', url: 'https://www.oas.org/es/cidh/prensa/comunicados.asp' },
  { nombre: 'OEA · Corte IDH, opiniones consultivas', url: 'https://www.corteidh.or.cr/opiniones_consultivas.cfm' },
  { nombre: 'Mercosur · RAADH', url: 'https://www.raadh.mercosur.int/' },
  { nombre: 'Plan B · UPR Info, agenda', url: 'https://upr-info.org/en/upr-process/upr-agenda' },
];

async function probar(f: { nombre: string; url: string }) {
  const inicio = Date.now();
  try {
    const r = await fetch(f.url, {
      headers: {
        'User-Agent': 'RedIncidenciaAkahata/0.1 (+https://akahataorg.org; radar de oportunidades de incidencia)',
        'Accept-Language': 'es,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    const html = await r.text();
    const titulo = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
    const pareceBloqueo = /captcha|access denied|cloudflare|forbidden|are you a robot/i.test(html.slice(0, 5000));
    return {
      fuente: f.nombre,
      url: f.url,
      estado_http: r.status,
      bytes: html.length,
      titulo,
      resultado: r.ok && !pareceBloqueo && html.length > 2000 ? 'se puede leer' : 'rechazada o vacía',
      ms: Date.now() - inicio,
    };
  } catch (e) {
    return { fuente: f.nombre, url: f.url, resultado: 'error', detalle: String(e), ms: Date.now() - inicio };
  }
}

Deno.serve(async () => {
  const resultados = await Promise.all(FUENTES.map(probar));
  return new Response(JSON.stringify({ probado_en: new Date().toISOString(), resultados }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
});
