import type { SesionOrgano } from '../types';
import { EtiquetaSistema } from './ui';

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

export default function CalendarioView({ sesiones }: { sesiones: SesionOrgano[] }) {
  if (sesiones.length === 0) return <p className="text-sm text-ink-soft">No hay sesiones cargadas todavía.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-ink-soft">
        Las sesiones donde se decide. Preparar la incidencia con tiempo hace la diferencia: muchas inscripciones y
        plazos cierran semanas antes.
      </p>
      {sesiones.map((s) => {
        const i = partes(s.fecha_inicio);
        return (
          <article key={s.id} className="flex gap-3 rounded-lg border border-line bg-white p-3.5">
            <div className="flex w-14 flex-none flex-col items-center rounded-lg bg-magenta-light py-2 text-magenta">
              <span className="text-[11px] font-extrabold uppercase">{MESES[i.m]}</span>
              <span className="text-xl font-black leading-none">{s.a_confirmar && !s.fecha_fin ? '·' : i.d}</span>
              <span className="text-[11px] font-bold">{i.a}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <EtiquetaSistema sistema={s.sistema} mecanismo={s.organo} />
              <h3 className="m-0 text-[15px] font-extrabold leading-snug text-magenta">{s.nombre}</h3>
              <span className="text-[13px] font-bold text-ink">
                {rangoFechas(s)}
                {s.lugar && ` · ${s.lugar}`}
                {s.a_confirmar && <span className="ml-1.5 rounded bg-naranja-light px-1.5 py-0.5 text-[11px] text-naranja-dark">a confirmar</span>}
              </span>
              {s.descripcion && <p className="m-0 text-[13px] text-ink-soft">{s.descripcion}</p>}
              {s.fuente_url && (
                <a href={s.fuente_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-magenta">
                  Más información
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
