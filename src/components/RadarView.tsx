import { useState } from 'react';
import type { Oportunidad, Organizacion, Participacion, SesionOrgano } from '../types';
import { TarjetaOportunidad } from './ui';
import { diasHasta } from '../lib/datos';
import CalendarioView from './CalendarioView';

interface Props {
  oportunidades: Oportunidad[];
  organizaciones: Organizacion[];
  participaciones: Participacion[];
  miOrg: string | null;
  sesiones: SesionOrgano[];
  onAbrir: (id: string) => void;
}

export default function RadarView({ oportunidades, organizaciones, participaciones, miOrg, sesiones, onAbrir }: Props) {
  const [vista, setVista] = useState<'convocatorias' | 'calendario'>('convocatorias');
  const [tema, setTema] = useState('Todos');
  const abiertas = oportunidades.filter((o) => diasHasta(o.fecha_limite) >= 0);
  // Los temas salen de las oportunidades abiertas, así no aparecen filtros vacíos.
  const TEMAS = ['Todos', ...[...new Set(abiertas.map((o) => o.tema))].sort()];
  const lista = abiertas.filter((o) => tema === 'Todos' || o.tema === tema);
  const orgPorId = new Map(organizaciones.map((o) => [o.id, o]));

  const pestanas = (
    <div className="grid grid-cols-2 rounded-lg bg-crema p-1" role="tablist">
      {(['convocatorias', 'calendario'] as const).map((v) => (
        <button
          key={v}
          role="tab"
          aria-selected={vista === v}
          onClick={() => setVista(v)}
          className={`rounded-md py-2 text-[13px] font-extrabold uppercase tracking-wider ${
            vista === v ? 'bg-white text-magenta shadow-sm' : 'text-ink-soft'
          }`}
        >
          {v === 'convocatorias' ? `Convocatorias (${abiertas.length})` : 'Calendario'}
        </button>
      ))}
    </div>
  );

  if (vista === 'calendario') {
    return (
      <div className="flex flex-col gap-3.5">
        {pestanas}
        <CalendarioView sesiones={sesiones} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {pestanas}
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
