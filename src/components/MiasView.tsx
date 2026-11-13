import { useState } from 'react';
import type { Oportunidad, Participacion } from '../types';
import { Boton, EtiquetaSistema, Plazo } from './ui';

interface Props {
  oportunidades: Oportunidad[];
  participaciones: Participacion[];
  miOrg: string | null;
  onAbrir: (id: string) => void;
  onGuardar: (oportunidadId: string, resultado: string) => void;
}

export default function MiasView({ oportunidades, participaciones, miOrg, onAbrir, onGuardar }: Props) {
  const mias = participaciones.filter((p) => p.organizacion_id === miOrg);
  const [borradores, setBorradores] = useState<Record<string, string>>({});

  if (mias.length === 0) {
    return <p className="text-sm text-ink-soft">Todavía no te sumaste a ninguna oportunidad. Buscalas en el Radar.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {mias.map((p) => {
        const o = oportunidades.find((x) => x.id === p.oportunidad_id);
        if (!o) return null;
        const valor = borradores[o.id] ?? p.resultado ?? '';
        return (
          <div key={o.id} className="flex flex-col gap-2 rounded-lg border border-line bg-white p-3.5">
            <button onClick={() => onAbrir(o.id)} className="flex flex-col gap-2 border-0 bg-transparent p-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <EtiquetaSistema sistema={o.sistema} mecanismo={o.mecanismo} />
                <Plazo fecha={o.fecha_limite} />
              </div>
              <h3 className="m-0 text-base font-extrabold text-magenta">{o.titulo}</h3>
            </button>
            <label htmlFor={`res-${o.id}`} className="mt-1 font-bold">Registrar el resultado</label>
            <span className="text-[13px] text-ink-soft">
              Después del espacio: qué se logró, qué recomendaciones salieron y qué seguimiento hace falta.
            </span>
            <textarea
              id={`res-${o.id}`}
              className="min-h-20 w-full rounded-lg border border-line p-2.5 font-sans"
              placeholder="Ej.: la CIDH pidió información al Estado sobre…"
              value={valor}
              onChange={(e) => setBorradores({ ...borradores, [o.id]: e.target.value })}
            />
            <Boton variante="borde" onClick={() => onGuardar(o.id, valor)}>Guardar resultado</Boton>
          </div>
        );
      })}
    </div>
  );
}
