import { useState } from 'react';
import type { FechaClave, NuevaSesion, SesionOrgano } from '../types';
import { diasHasta } from '../lib/datos';
import { EtiquetaSistema } from './ui';
import SesionForm from './SesionForm';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function partes(f: string) {
  const [a, m, d] = f.split('-').map(Number);
  return { a, m: m - 1, d };
}

/** "18–29 ene 2027", "22 feb – 2 abr 2027" o "junio de 2027" si solo se sabe el mes. */
export function rangoFechas(s: Pick<SesionOrgano, 'fecha_inicio' | 'fecha_fin' | 'a_confirmar'>): string {
  const i = partes(s.fecha_inicio);
  if (!s.fecha_fin) return s.a_confirmar ? `${MESES_LARGOS[i.m]} de ${i.a}` : `${i.d} ${MESES[i.m]} ${i.a}`;
  const f = partes(s.fecha_fin);
  const texto =
    i.m === f.m && i.a === f.a
      ? `${i.d}–${f.d} ${MESES[f.m]} ${f.a}`
      : `${i.d} ${MESES[i.m]} – ${f.d} ${MESES[f.m]} ${f.a}`;
  return s.a_confirmar ? `aprox. ${texto}` : texto;
}

function fechaCorta(f: FechaClave): string {
  const p = partes(f.fecha);
  return `${f.aprox ? 'aprox. ' : ''}${p.d} ${MESES[p.m]} ${p.a}`;
}

function faltan(fecha: string): string {
  const d = diasHasta(fecha);
  return d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`;
}

interface Props {
  sesiones: SesionOrgano[];
  /** Solo para el equipo de Akãhatã: guardar (id null = nueva) y borrar. */
  onGuardar?: (id: string | null, s: NuevaSesion) => Promise<boolean>;
  onBorrar?: (id: string) => Promise<void>;
}

export default function CalendarioView({ sesiones, onGuardar, onBorrar }: Props) {
  const [editando, setEditando] = useState<string | null>(null); // id, 'nueva' o null
  const proximas = sesiones
    .flatMap((s) => s.fechas_clave.filter((f) => diasHasta(f.fecha) >= 0).map((f) => ({ f, s })))
    .sort((a, b) => a.f.fecha.localeCompare(b.f.fecha))
    .slice(0, 6);

  const guardar = (id: string | null) => async (s: NuevaSesion) => {
    const ok = await onGuardar!(id, s);
    if (ok) setEditando(null);
    return ok;
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-ink-soft">
        Las sesiones donde se decide. Preparar la incidencia con tiempo hace la diferencia: muchas inscripciones y
        plazos cierran semanas antes.
      </p>

      {proximas.length > 0 && (
        <section className="flex flex-col gap-2 rounded-lg border-2 border-naranja px-3.5 py-3">
          <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Próximos plazos</h3>
          {proximas.map(({ f, s }, i) => (
            <div key={s.id + i} className="flex flex-col border-b border-line pb-2 text-[13px] last:border-b-0 last:pb-0">
              <span className="font-extrabold text-rosa">
                {fechaCorta(f)} <span className="font-bold text-ink-soft">· {faltan(f.fecha)}</span>
              </span>
              {f.url ? (
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline decoration-rosa/50">{f.texto}</a>
              ) : (
                <span className="font-bold text-ink">{f.texto}</span>
              )}
              <span className="text-ink-soft">{s.nombre}</span>
            </div>
          ))}
        </section>
      )}

      {onGuardar && (editando === 'nueva' ? (
        <SesionForm onGuardar={guardar(null)} onCancelar={() => setEditando(null)} />
      ) : (
        <button
          className="rounded border-2 border-rosa px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-rosa"
          onClick={() => setEditando('nueva')}
        >
          + Agregar una sesión
        </button>
      ))}

      {sesiones.length === 0 && <p className="text-sm text-ink-soft">No hay sesiones cargadas todavía.</p>}
      {sesiones.map((s) => {
        if (editando === s.id && onGuardar)
          return (
            <SesionForm
              key={s.id}
              inicial={s}
              onGuardar={guardar(s.id)}
              onBorrar={onBorrar ? async () => { await onBorrar(s.id); setEditando(null); } : undefined}
              onCancelar={() => setEditando(null)}
            />
          );
        const i = partes(s.fecha_inicio);
        return (
          <article key={s.id} className="flex gap-3 rounded-lg border border-line bg-tarjeta p-3.5">
            <div className="flex h-fit w-14 flex-none flex-col items-center rounded-lg bg-magenta-light py-2 text-rosa">
              <span className="text-[11px] font-extrabold uppercase">{MESES[i.m]}</span>
              <span className="text-xl font-black leading-none">{s.a_confirmar && !s.fecha_fin ? '·' : i.d}</span>
              <span className="text-[11px] font-bold">{i.a}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <EtiquetaSistema sistema={s.sistema} mecanismo={s.organo} />
              <h3 className="m-0 text-[15px] font-extrabold leading-snug text-rosa">{s.nombre}</h3>
              <span className="text-[13px] font-bold text-ink">
                {rangoFechas(s)}
                {s.lugar && ` · ${s.lugar}`}
                {s.a_confirmar && <span className="ml-1.5 rounded bg-naranja-light px-1.5 py-0.5 text-[11px] text-naranja-dark">a confirmar</span>}
              </span>
              {s.descripcion && <p className="m-0 text-[13px] text-ink-soft">{s.descripcion}</p>}
              {s.fechas_clave.length > 0 && (
                <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 border-l-[3px] border-naranja p-0 pl-2.5">
                  {s.fechas_clave.map((f, j) => {
                    const pasada = diasHasta(f.fecha) < 0;
                    return (
                      <li key={j} className={`text-[13px] ${pasada ? 'text-ink-soft line-through decoration-1' : ''}`}>
                        <b className={pasada ? '' : 'text-naranja-dark'}>{fechaCorta(f)}</b>{' · '}
                        {f.url ? (
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline decoration-rosa/50">{f.texto}</a>
                        ) : (
                          f.texto
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                {s.fuente_url && (
                  <a href={s.fuente_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-rosa">
                    Página oficial de esta sesión
                  </a>
                )}
                {onGuardar && (
                  <button className="text-[13px] font-bold text-ink-soft underline" onClick={() => setEditando(s.id)}>
                    Editar (equipo Akãhatã)
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
