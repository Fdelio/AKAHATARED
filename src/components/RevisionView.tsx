import type { EstadoRevision, Oportunidad, Organizacion } from '../types';
import { EtiquetaSistema } from './ui';

interface Props {
  pendientes: Oportunidad[];
  orgsPendientes: Organizacion[];
  onRevisar: (id: string, estado: EstadoRevision) => void;
  onAprobarOrg: (id: string, aprobada: boolean) => void;
  onCargar: () => void;
  onAviso: (t: string) => void;
}

export default function RevisionView({ pendientes, orgsPendientes, onRevisar, onAprobarOrg, onCargar, onAviso }: Props) {
  return (
    <div className="flex flex-col gap-3.5">
      <button
        className="rounded bg-magenta px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest text-white"
        onClick={onCargar}
      >
        + Cargar una oportunidad a mano
      </button>

      {orgsPendientes.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">
            Organizaciones que pidieron sumarse
          </h3>
          {orgsPendientes.map((org) => (
            <div key={org.id} className="flex flex-col gap-2 rounded-lg border border-naranja bg-naranja-light/40 p-3.5">
              <b className="text-magenta">{org.nombre}</b>
              <span className="text-[13px] text-ink-soft">
                {org.pais}{org.temas.length > 0 && ' · ' + org.temas.join(', ')}
              </span>
              {(org.ofrece || org.necesita) && (
                <span className="text-[13px]">
                  {org.ofrece && <>Ofrece: {org.ofrece}. </>}
                  {org.necesita && <>Necesita: {org.necesita}.</>}
                </span>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded bg-magenta px-1.5 py-2.5 text-xs font-extrabold uppercase text-white" onClick={() => onAprobarOrg(org.id, true)}>Aprobar</button>
                <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onAprobarOrg(org.id, false)}>Rechazar</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <h3 className="m-0 mt-1 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Oportunidades para revisar</h3>
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
            Fuente: {o.fuente_nombre}.{o.recolectada_automaticamente && " Resumen generado por IA en español y portugués."}{!o.recolectada_automaticamente && " Cargada a mano."}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded bg-magenta px-1.5 py-2.5 text-xs font-extrabold uppercase text-white" onClick={() => onRevisar(o.id, 'publicada')}>Publicar</button>
            <button className="rounded border-2 border-magenta px-1.5 py-2 text-xs font-extrabold uppercase text-magenta" onClick={() => onAviso('Próximamente: editar el resumen y el "cómo sumar tu agenda"')}>Editar</button>
            <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onRevisar(o.id, 'descartada')}>Descartar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
