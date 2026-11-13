import type { EstadoRevision, Oportunidad } from '../types';
import { EtiquetaSistema } from './ui';

interface Props {
  pendientes: Oportunidad[];
  onRevisar: (id: string, estado: EstadoRevision) => void;
  onAviso: (t: string) => void;
}

export default function RevisionView({ pendientes, onRevisar, onAviso }: Props) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="m-0 text-sm text-ink-soft">
        {pendientes.length === 0
          ? 'No hay oportunidades nuevas para revisar.'
          : `${pendientes.length} ${pendientes.length === 1 ? 'oportunidad nueva espera' : 'oportunidades nuevas esperan'} revisión. Solo el equipo de Akãhatã ve esta sección.`}
      </p>
      {pendientes.map((o) => (
        <div key={o.id} className="flex flex-col gap-2 rounded-lg border border-dashed border-line bg-white p-3.5">
          <EtiquetaSistema sistema={o.sistema} mecanismo={o.mecanismo} />
          <h3 className="m-0 text-base font-extrabold text-magenta">{o.titulo}</h3>
          <div className="border-l-[3px] border-line pl-2.5 text-[13px] text-ink-soft">
            Fuente: {o.fuente_nombre}. Resumen generado por IA en español y portugués.
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded bg-magenta px-1.5 py-2.5 text-xs font-extrabold uppercase text-white" onClick={() => onRevisar(o.id, 'publicada')}>Publicar</button>
            <button className="rounded border-2 border-magenta px-1.5 py-2 text-xs font-extrabold uppercase text-magenta" onClick={() => onAviso('Próximamente: editar el resumen y el "cómo sumar tu agenda"')}>Editar</button>
            <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onRevisar(o.id, 'descartada')}>Descartar</button>
          </div>
        </div>
      ))}
      <button
        className="rounded border-2 border-magenta px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest text-magenta"
        onClick={() => onAviso('Próximamente: formulario para cargar una oportunidad a mano')}
      >
        + Cargar una oportunidad a mano
      </button>
    </div>
  );
}
