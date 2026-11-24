import { useEffect, useState, type ReactNode } from 'react';
import type { Oportunidad, Organizacion, Sistema } from '../types';
import { diasHasta, enlaceImagen } from '../lib/datos';
import { descargarIcs, enlaceGoogle, type Evento } from '../lib/calendario';

/** Enlace para mostrar una imagen privada (foto o logo), o null mientras carga o si no hay. */
export function useImagen(ruta: string | null, version: string | null | undefined): string | null {
  const [url, setUrl] = useState<{ clave: string; url: string | null } | null>(null);
  const clave = ruta && version ? ruta + '?' + version : null;
  useEffect(() => {
    if (!ruta || !version) return;
    let vigente = true;
    enlaceImagen(ruta, version).then((u) => vigente && setUrl({ clave: ruta + '?' + version, url: u }));
    return () => {
      vigente = false;
    };
  }, [ruta, version]);
  return clave && url?.clave === clave ? url.url : null;
}

export function EtiquetaSistema({ sistema, mecanismo }: { sistema: Sistema; mecanismo: string }) {
  const estilo =
    sistema === 'OEA'
      ? 'bg-magenta-light text-rosa'
      : sistema === 'Mercosur'
        ? 'bg-berenjena text-rosa ring-1 ring-inset ring-rosa/40'
        : 'bg-naranja-light text-naranja-dark';
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${estilo}`}>
      {sistema} · {mecanismo}
    </span>
  );
}

export function Plazo({ fecha }: { fecha: string }) {
  const d = diasHasta(fecha);
  const texto = d < 0 ? 'Cerrada' : d === 0 ? 'Cierra hoy' : `Cierra en ${d} ${d === 1 ? 'día' : 'días'}`;
  return (
    <span className={`ml-auto text-[13px] font-bold tabular-nums ${d <= 14 ? 'text-rosa' : 'text-ink-soft'}`}>
      {texto}
    </span>
  );
}

export function Iniciales({
  org, grande = false,
}: { org: Pick<Organizacion, 'nombre'> & Partial<Pick<Organizacion, 'id' | 'logo_en'>>; grande?: boolean }) {
  const logo = useImagen(org.id ? `organizaciones/${org.id}.jpg` : null, org.logo_en);
  if (logo)
    return grande ? (
      <img src={logo} alt="" className="size-10 flex-none rounded-full border-2 border-naranja bg-white object-cover" />
    ) : (
      <img src={logo} alt="" className="-ml-1.5 size-[22px] rounded-full border-2 border-tarjeta bg-white object-cover first:ml-0" />
    );
  const ini = org.nombre
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return grande ? (
    <div className="grid size-10 flex-none place-items-center rounded-full border-2 border-naranja bg-magenta-light font-bold text-rosa">
      {ini}
    </div>
  ) : (
    <span className="-ml-1.5 grid size-[22px] place-items-center rounded-full border-2 border-tarjeta bg-magenta text-[10px] font-bold text-white first:ml-0">
      {ini}
    </span>
  );
}

export function Boton({
  children, onClick, variante = 'lleno', className = '',
}: { children: ReactNode; onClick?: () => void; variante?: 'lleno' | 'borde' | 'hecho'; className?: string }) {
  const estilos = {
    lleno: 'bg-magenta text-white',
    borde: 'border-2 border-rosa text-rosa bg-transparent',
    hecho: 'bg-ok-light text-ok',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full rounded px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest ${estilos[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function TarjetaOportunidad({
  o, sumadas, incluyeMia, onAbrir,
}: { o: Oportunidad; sumadas: Organizacion[]; incluyeMia: boolean; onAbrir: () => void }) {
  const n = sumadas.length + (incluyeMia ? 1 : 0);
  return (
    <button
      onClick={onAbrir}
      className="flex w-full flex-col gap-2 rounded-lg border border-line border-l-[5px] border-l-naranja bg-tarjeta p-3.5 text-left hover:border-rosa"
    >
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaSistema sistema={o.sistema} mecanismo={o.mecanismo} />
        <Plazo fecha={o.fecha_limite} />
      </div>
      <h3 className="m-0 text-base font-extrabold leading-snug text-rosa">{o.titulo}</h3>
      <div className="text-sm text-ink-soft">
        {o.pais} · {o.tema}
      </div>
      {sumadas.length <= 1 && (
        <div className="self-start rounded bg-naranja-light px-2 py-1 text-[13px] font-bold text-naranja-dark">
          Pocas organizaciones de la red aportan acá. Tu agenda hace falta.
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[13px] text-ink-soft">
        {n > 0 ? (
          <>
            <span className="flex">
              {sumadas.slice(0, 3).map((s) => (
                <Iniciales key={s.id} org={s} />
              ))}
            </span>
            {n} {n === 1 ? 'organización se sumó' : 'organizaciones se sumaron'}
            {incluyeMia && ' · incluida la tuya'}
          </>
        ) : (
          'Nadie se sumó todavía'
        )}
      </div>
    </button>
  );
}

/** "Agregar a mi calendario": Google Calendar o archivo para el celular, Apple y Outlook. */
export function AgregarAlCalendario({ evento, chico = false }: { evento: Evento; chico?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const opcion = 'rounded border border-line bg-tarjeta px-3 py-2 text-[13px] font-bold text-ink';
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className={
          chico
            ? 'self-start text-[13px] font-bold text-rosa underline'
            : 'w-full rounded border-2 border-rosa px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest text-rosa'
        }
      >
        Agregar a mi calendario
      </button>
      {abierto && (
        <div className="flex flex-wrap gap-2">
          <a className={opcion} href={enlaceGoogle(evento)} target="_blank" rel="noopener noreferrer" onClick={() => setAbierto(false)}>
            Google Calendar
          </a>
          <button
            type="button"
            className={opcion}
            onClick={() => {
              descargarIcs(evento);
              setAbierto(false);
            }}
          >
            Celular, Apple u Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}

/** Aviso de cuidado en el chat, el foro y los mensajes privados: no están cifrados de punta a punta. */
export function AvisoSeguridad({ donde }: { donde: 'red' | 'privado' }) {
  return (
    <div className="rounded-lg border border-naranja/60 bg-naranja-light/40 px-3 py-2.5 text-[13px] leading-snug">
      <b className="text-naranja-dark">Cuidá lo que compartís.</b>{' '}
      {donde === 'red'
        ? 'Lo leen todas las organizaciones de la red y no está cifrado de punta a punta.'
        : 'Lo leen solo ustedes dos, pero no está cifrado de punta a punta.'}{' '}
      No pongas nombres de personas en riesgo, direcciones, datos de casos ni estrategias sensibles. Para eso usá{' '}
      <a href="https://signal.org/es/" target="_blank" rel="noopener noreferrer" className="font-bold text-rosa underline">Signal</a>.
    </div>
  );
}

/** El logo completo de Akãhatã, con enlace a su web. Va al pie de la portada y en Cuenta. */
export function SelloAkahata() {
  return (
    <a
      href="https://www.akahataorg.org"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-4 self-center rounded-2xl bg-[#fdf6f1] px-5 py-4 no-underline"
    >
      <img src={import.meta.env.BASE_URL + 'logo-akahata.png'} alt="Akãhatã" className="h-20 w-auto" />
      <span className="max-w-[150px] text-[13px] font-bold leading-snug text-[#2e0526]">
        Una iniciativa de Akãhatã.
        <span className="mt-1 block text-[#a30d5f] underline">akahataorg.org</span>
      </span>
    </a>
  );
}
