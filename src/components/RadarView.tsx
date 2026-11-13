import { useState } from 'react';
import type { Oportunidad, Organizacion, Participacion } from '../types';
import { TarjetaOportunidad } from './ui';

const TEMAS = ['Todos', 'Ambiente y clima', 'Desarrollo y derechos sociales', 'Empresas y economía', 'Migración', 'Salud', 'Todos los temas'];

interface Props {
  oportunidades: Oportunidad[];
  organizaciones: Organizacion[];
  participaciones: Participacion[];
  miOrg: string | null;
  onAbrir: (id: string) => void;
}

export default function RadarView({ oportunidades, organizaciones, participaciones, miOrg, onAbrir }: Props) {
  const [tema, setTema] = useState('Todos');
  const lista = oportunidades.filter((o) => tema === 'Todos' || o.tema === tema);
  const orgPorId = new Map(organizaciones.map((o) => [o.id, o]));

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-lg bg-magenta-light px-3.5 py-3 text-sm">
        <b className="font-extrabold text-magenta">Llevá tu agenda a nuevos espacios.</b> Ambiente, desarrollo,
        economía o migración también se discuten en la ONU, la OEA y el Mercosur. Tu mirada feminista y de
        diversidad cambia esos debates.
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por tema">
        {TEMAS.map((t) => (
          <button
            key={t}
            aria-pressed={t === tema}
            onClick={() => setTema(t)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              t === tema ? 'border-magenta bg-magenta font-bold text-white' : 'border-line bg-white text-ink'
            }`}
          >
            {t === 'Todos los temas' ? 'Revisión general (EPU)' : t}
          </button>
        ))}
      </div>
      {lista.length === 0 && <p className="text-sm text-ink-soft">No hay oportunidades abiertas en este tema.</p>}
      {lista.map((o) => {
        const ps = participaciones.filter((p) => p.oportunidad_id === o.id);
        const sumadas = ps.filter((p) => p.organizacion_id !== miOrg).map((p) => orgPorId.get(p.organizacion_id)).filter(Boolean) as Organizacion[];
        return (
          <TarjetaOportunidad
            key={o.id}
            o={o}
            sumadas={sumadas}
            incluyeMia={ps.some((p) => p.organizacion_id === miOrg)}
            onAbrir={() => onAbrir(o.id)}
          />
        );
      })}
    </div>
  );
}
