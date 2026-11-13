import type { Organizacion } from '../types';
import { Iniciales } from './ui';

export default function RedView({ organizaciones }: { organizaciones: Organizacion[] }) {
  const porPais = new Map<string, Organizacion[]>();
  organizaciones.forEach((o) => porPais.set(o.pais, [...(porPais.get(o.pais) ?? []), o]));
  const paises = [...porPais.keys()].sort();

  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 mb-2 text-sm text-ink-soft">
        {organizaciones.length} organizaciones en {paises.length} países. Cada una elige qué muestra.
      </p>
      {paises.map((pais) => (
        <section key={pais}>
          <h3 className="mt-3 mb-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">{pais}</h3>
          {porPais.get(pais)!.map((o) => (
            <div key={o.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
              <Iniciales org={o} grande />
              <div className="min-w-0">
                <b className="block">{o.nombre}</b>
                <span className="text-[13px] text-ink-soft">{o.temas.join(', ')}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-ok-light px-2 py-0.5 text-xs font-bold text-ok">Ofrece: {o.ofrece}</span>
                  <span className="rounded-full bg-naranja-light px-2 py-0.5 text-xs font-bold text-naranja-dark">Necesita: {o.necesita}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
