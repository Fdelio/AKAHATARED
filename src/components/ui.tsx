import type { ReactNode } from 'react';
import type { Oportunidad, Organizacion, Sistema } from '../types';
import { diasHasta } from '../lib/datos';

export function EtiquetaSistema({ sistema, mecanismo }: { sistema: Sistema; mecanismo: string }) {
  const estilo =
    sistema === 'OEA'
      ? 'bg-magenta-light text-magenta'
      : sistema === 'Mercosur'
        ? 'bg-berenjena text-rosa'
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
    <span className={`ml-auto text-[13px] font-bold tabular-nums ${d <= 14 ? 'text-magenta' : 'text-ink-soft'}`}>
      {texto}
    </span>
  );
}

export function Iniciales({ org, grande = false }: { org: Pick<Organizacion, 'nombre'>; grande?: boolean }) {
  const ini = org.nombre
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return grande ? (
    <div className="grid size-10 flex-none place-items-center rounded-full border-2 border-naranja bg-magenta-light font-bold text-magenta">
      {ini}
    </div>
  ) : (
    <span className="-ml-1.5 grid size-[22px] place-items-center rounded-full border-2 border-white bg-magenta text-[10px] font-bold text-white first:ml-0">
      {ini}
    </span>
  );
}

export function Boton({
  children, onClick, variante = 'lleno', className = '',
}: { children: ReactNode; onClick?: () => void; variante?: 'lleno' | 'borde' | 'hecho'; className?: string }) {
  const estilos = {
    lleno: 'bg-magenta text-white',
    borde: 'border-2 border-magenta text-magenta bg-transparent',
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
      className="flex w-full flex-col gap-2 rounded-lg border border-line border-l-[5px] border-l-naranja bg-white p-3.5 text-left hover:border-magenta"
    >
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaSistema sistema={o.sistema} mecanismo={o.mecanismo} />
        <Plazo fecha={o.fecha_limite} />
      </div>
      <h3 className="m-0 text-base font-extrabold leading-snug text-magenta">{o.titulo}</h3>
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
