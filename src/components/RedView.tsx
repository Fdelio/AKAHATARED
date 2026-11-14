import { useState, type ReactNode } from 'react';
import { TIPOS_APORTE, type Oportunidad, type Organizacion, type Participacion, type PersonaRed } from '../types';
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
  personas: PersonaRed[];
  usuariaId: string;
  /** Si quien mira ya aparece en la red (según su perfil). */
  apareceEnRed: boolean;
  onEscribir: (personaId: string) => void;
  onCompletarPerfil: () => void;
}

export default function RedView(props: Props) {
  const [pestana, setPestana] = useState<'orgs' | 'personas'>('orgs');
  const otras = props.personas.filter((p) => p.id !== props.usuariaId).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 rounded-lg bg-crema p-1" role="tablist">
        {([['orgs', `Organizaciones (${props.organizaciones.length})`], ['personas', `Personas (${otras})`]] as const).map(([id, t]) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`rounded-md py-2 text-[12px] font-extrabold uppercase tracking-wider ${pestana === id ? 'bg-magenta text-white' : 'text-ink-soft'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {pestana === 'orgs' ? <Organizaciones {...props} /> : <Personas {...props} />}
    </div>
  );
}

function Personas({ personas, organizaciones, usuariaId, apareceEnRed, onEscribir, onCompletarPerfil }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const orgPorId = new Map(organizaciones.map((o) => [o.id, o]));
  const q = busqueda.trim().toLowerCase();
  const lista = personas
    .filter((p) => p.id !== usuariaId)
    .filter((p) =>
      !q || [p.nombre_visible, p.cargo ?? '', p.presentacion ?? '', orgPorId.get(p.organizacion_id)?.nombre ?? '', orgPorId.get(p.organizacion_id)?.pais ?? '']
        .some((x) => x.toLowerCase().includes(q)),
    )
    .sort((a, b) => (orgPorId.get(a.organizacion_id)?.nombre ?? '').localeCompare(orgPorId.get(b.organizacion_id)?.nombre ?? ''));

  return (
    <>
      {!apareceEnRed && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-naranja-light p-3.5 text-sm text-naranja-dark">
          <b>Todavía no aparecés en esta lista.</b>
          <span className="text-ink">Completá tu perfil y elegí si querés aparecer y recibir mensajes. Tu correo nunca se muestra.</span>
          <button className="self-start font-bold text-magenta underline" onClick={onCompletarPerfil}>Completar mi perfil</button>
        </div>
      )}
      <p className="m-0 text-sm text-ink-soft">
        Personas de las organizaciones de la red que eligieron aparecer. Para contactarlas, escribiles dentro de la app.
      </p>
      <input
        type="search"
        className="w-full rounded border-2 border-line px-3 py-2 text-[15px] focus:border-magenta focus:outline-none"
        placeholder="Buscar por nombre, organización, país o tema"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      {lista.map((p) => {
        const o = orgPorId.get(p.organizacion_id);
        return (
          <div key={p.id} className="flex gap-3 border-b border-line py-3 last:border-b-0">
            <Avatar nombre={p.nombre_visible} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b>{p.nombre_visible}</b>
              <span className="text-[13px] text-ink-soft">
                {[p.cargo, o && `${o.nombre} (${o.pais})`].filter(Boolean).join(' · ')}
              </span>
              {p.presentacion && <span className="text-[13px] leading-snug">{p.presentacion}</span>}
              {p.acepta_mensajes ? (
                <button className="mt-1 self-start rounded-full bg-magenta px-3 py-1 text-xs font-extrabold text-white" onClick={() => onEscribir(p.id)}>
                  Escribir
                </button>
              ) : (
                <span className="text-xs text-ink-soft">No recibe mensajes privados</span>
              )}
            </div>
          </div>
        );
      })}
      {lista.length === 0 && (
        <p className="m-0 text-sm text-ink-soft">{q ? 'No encontramos personas con esa búsqueda.' : 'Todavía nadie completó su perfil para aparecer.'}</p>
      )}
    </>
  );
}

function Organizaciones({ organizaciones, participaciones, oportunidades, miOrg, revisora, onAbrir, onPedirApoyo }: Props) {
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
    <>
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
    </>
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

export function Avatar({ nombre }: { nombre: string }) {
  const ini = nombre.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '·';
  return (
    <div className="grid size-10 flex-none place-items-center rounded-full border-2 border-magenta bg-naranja-light font-bold text-naranja-dark">
      {ini}
    </div>
  );
}
