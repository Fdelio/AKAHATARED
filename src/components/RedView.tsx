import { useState, type ReactNode } from 'react';
import { TIPOS_APORTE, type Oportunidad, type Organizacion, type Participacion } from '../types';
import { diasHasta } from '../lib/datos';
import { Iniciales } from './ui';

interface Props {
  organizaciones: Organizacion[];
  participaciones: Participacion[];
  oportunidades: Oportunidad[];
  /** Mi organización: ve también lo que marcó "solo Akãhatã". */
  miOrg: string | null;
  revisora: boolean;
  onAbrir: (id: string) => void;
  onPedirApoyo: () => void;
}

export default function RedView({ organizaciones, participaciones, oportunidades, miOrg, revisora, onAbrir, onPedirApoyo }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const opPorId = new Map(oportunidades.map((o) => [o.id, o]));
  const visibles = participaciones.filter(
    (p) => opPorId.has(p.oportunidad_id) && (p.visibilidad !== 'solo_akahata' || p.organizacion_id === miOrg || revisora),
  );

  const q = busqueda.trim().toLowerCase();
  const lista = organizaciones.filter(
    (o) => !q || [o.nombre, o.pais, ...o.temas].some((x) => x.toLowerCase().includes(q)),
  );
  const porPais = new Map<string, Organizacion[]>();
  lista.forEach((o) => porPais.set(o.pais, [...(porPais.get(o.pais) ?? []), o]));
  const paises = [...porPais.keys()].sort();
  const enviados = visibles.filter((p) => p.enviado).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-ink-soft">
        {organizaciones.length} organizaciones en {new Set(organizaciones.map((o) => o.pais)).size} países
        {enviados > 0 && <> · {enviados} {enviados === 1 ? 'documento enviado' : 'documentos enviados'}</>}. Cada una elige qué muestra.
      </p>

      <div className="flex flex-col gap-1.5 rounded-lg bg-magenta-light p-3.5 text-sm">
        <b className="text-magenta">¿Preparan un informe sombra, una contribución o un reporte?</b>
        <span>Akãhatã puede acompañarlas en la redacción, la revisión o la traducción.</span>
        <button className="self-start font-bold text-magenta underline" onClick={onPedirApoyo}>Pedir apoyo</button>
      </div>

      <input
        type="search"
        className="w-full rounded border-2 border-line px-3 py-2 text-[15px] focus:border-magenta focus:outline-none"
        placeholder="Buscar por nombre, país o tema"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {paises.map((pais) => (
        <section key={pais}>
          <h3 className="mt-2 mb-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">{pais}</h3>
          {porPais.get(pais)!.map((o) => {
            const ps = visibles.filter((p) => p.organizacion_id === o.id);
            const hechos = ps.filter((p) => p.enviado);
            const enCurso = ps.filter((p) => !p.enviado && diasHasta(opPorId.get(p.oportunidad_id)!.fecha_limite) >= 0);
            return (
              <div key={o.id} className="flex gap-3 border-b border-line py-3 last:border-b-0">
                <Iniciales org={o} grande />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <b>{o.nombre}{o.id === miOrg && <span className="font-semibold text-ink-soft"> (tu organización)</span>}</b>
                  {o.temas.length > 0 && <span className="text-[13px] text-ink-soft">{o.temas.join(', ')}</span>}
                  {(o.ofrece || o.necesita) && (
                    <div className="flex flex-wrap gap-1.5">
                      {o.ofrece && <span className="rounded-full bg-ok-light px-2 py-0.5 text-xs font-bold text-ok">Ofrece: {o.ofrece}</span>}
                      {o.necesita && <span className="rounded-full bg-naranja-light px-2 py-0.5 text-xs font-bold text-naranja-dark">Necesita: {o.necesita}</span>}
                    </div>
                  )}
                  {enCurso.length > 0 && (
                    <Lista titulo="Trabajando en">
                      {enCurso.map((p) => (
                        <Item key={p.oportunidad_id} p={p} o={opPorId.get(p.oportunidad_id)!} onAbrir={onAbrir} />
                      ))}
                    </Lista>
                  )}
                  {hechos.length > 0 && (
                    <Lista titulo="Lo que enviaron">
                      {hechos.map((p) => (
                        <Item key={p.oportunidad_id} p={p} o={opPorId.get(p.oportunidad_id)!} onAbrir={onAbrir} hecho />
                      ))}
                    </Lista>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
      {lista.length === 0 && <p className="m-0 text-sm text-ink-soft">No encontramos organizaciones con esa búsqueda.</p>}
    </div>
  );
}

function Lista({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-1">
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">{titulo}</div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">{children}</ul>
    </div>
  );
}

function Item({ p, o, onAbrir, hecho = false }: { p: Participacion; o: Oportunidad; onAbrir: (id: string) => void; hecho?: boolean }) {
  const abierta = diasHasta(o.fecha_limite) >= 0;
  return (
    <li className="text-[13px] leading-snug">
      {hecho ? '✓ ' : '• '}
      {p.tipo_aporte && <b>{TIPOS_APORTE[p.tipo_aporte]}: </b>}
      {abierta ? (
        <a className="text-magenta underline" href={'#op-' + o.id} onClick={(e) => { e.preventDefault(); onAbrir(o.id); }}>{o.titulo}</a>
      ) : (
        <span>{o.titulo}</span>
      )}
      {p.enlace && <> · <a className="font-bold text-magenta" href={p.enlace} target="_blank" rel="noreferrer">ver documento</a></>}
      {p.visibilidad === 'solo_akahata' && <span className="text-ink-soft"> (solo Akãhatã lo ve)</span>}
      {p.resultado && <div className="mt-0.5 border-l-2 border-line pl-2 text-ink-soft">Resultado: {p.resultado}</div>}
    </li>
  );
}
