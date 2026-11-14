import { useState } from 'react';
import { TIPOS_APORTE, type EstadoPedido, type EstadoRevision, type Oportunidad, type Organizacion, type Noticia, type PedidoApoyo, type SolicitudUnion } from '../types';
import { EtiquetaSistema } from './ui';

interface Props {
  pendientes: Oportunidad[];
  orgsPendientes: Organizacion[];
  pedidos: PedidoApoyo[];
  organizaciones: Organizacion[];
  oportunidades: Oportunidad[];
  onPedido: (id: string, estado: EstadoPedido) => void;
  solicitudes: SolicitudUnion[];
  noticiasPendientes: Noticia[];
  onNuevaNota: () => void;
  onEditarNota: (id: string) => void;
  onRevisarNota: (id: string, estado: EstadoRevision) => void;
  onResponder: (perfilId: string, aceptar: boolean) => void;
  onRevisar: (id: string, estado: EstadoRevision) => void;
  onAprobarOrg: (id: string, aprobada: boolean) => void;
  onCargar: () => void;
  onEditar: (id: string) => void;
}

export default function RevisionView({ pendientes, orgsPendientes, pedidos, organizaciones, oportunidades, onPedido, solicitudes, onResponder, noticiasPendientes, onNuevaNota, onEditarNota, onRevisarNota, onRevisar, onAprobarOrg, onCargar, onEditar }: Props) {
  const [verTodas, setVerTodas] = useState(false);
  const notas = verTodas ? noticiasPendientes : noticiasPendientes.slice(0, 8);

  return (
    <div className="flex flex-col gap-3.5">
      <button
        className="rounded bg-magenta px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest text-white"
        onClick={onCargar}
      >
        + Cargar una oportunidad a mano
      </button>
      <button
        className="rounded border-2 border-magenta px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-magenta"
        onClick={onNuevaNota}
      >
        + Escribir una nota para Noticias
      </button>

      {pedidos.some((p) => p.estado !== 'cerrado') && (
        <section className="flex flex-col gap-2.5">
          <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Pedidos de apoyo para redactar</h3>
          {pedidos.filter((p) => p.estado !== 'cerrado').map((p) => {
            const org = organizaciones.find((o) => o.id === p.organizacion_id);
            const op = oportunidades.find((o) => o.id === p.oportunidad_id);
            return (
              <div key={p.id} className="flex flex-col gap-1.5 rounded-lg border border-magenta bg-magenta-light/40 p-3.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-magenta">{org?.nombre ?? 'Organización'}</b>
                  {org && <span className="text-[13px] text-ink-soft">{org.pais}</span>}
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-naranja-dark">
                    {p.estado === 'nuevo' ? 'Nuevo' : 'En curso'}
                  </span>
                </div>
                <span><b>{TIPOS_APORTE[p.tipo_documento]}</b>{op && <> para “{op.titulo}”</>}</span>
                <span>{p.mensaje}</span>
                <span className="text-[13px]">
                  Contacto:{' '}
                  {p.contacto.includes('@') ? <a className="font-bold text-magenta" href={'mailto:' + p.contacto}>{p.contacto}</a> : <b>{p.contacto}</b>}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {p.estado === 'nuevo' ? (
                    <button className="rounded bg-magenta px-1.5 py-2.5 text-xs font-extrabold uppercase text-white" onClick={() => onPedido(p.id, 'en_curso')}>Lo tomamos</button>
                  ) : <span />}
                  <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onPedido(p.id, 'cerrado')}>Cerrar</button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {solicitudes.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Personas que piden sumarse a una organización</h3>
          <p className="m-0 text-[13px] text-ink-soft">También las puede aceptar alguien de esa organización.</p>
          {solicitudes.map((s) => (
            <div key={s.perfil_id} className="flex flex-col gap-2 rounded-lg border border-naranja bg-naranja-light/40 p-3 text-sm">
              <span><b>{s.email}</b> → {s.organizacion}</span>
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded bg-magenta px-1.5 py-2.5 text-xs font-extrabold uppercase text-white" onClick={() => onResponder(s.perfil_id, true)}>Aceptar</button>
                <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onResponder(s.perfil_id, false)}>Rechazar</button>
              </div>
            </div>
          ))}
        </section>
      )}

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

      {noticiasPendientes.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">
            Noticias para revisar ({noticiasPendientes.length})
          </h3>
          <p className="m-0 text-[13px] text-ink-soft">
            Llegan solas cada mañana. Publicá las que le sirven a la red; podés sumar un comentario de Akãhatã con Editar.
          </p>
          {notas.map((n) => (
            <div key={n.id} className="flex flex-col gap-1.5 rounded-lg border border-dashed border-line bg-white p-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
                {n.fuente_nombre} · {new Date(n.publicada_en).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </span>
              {n.url ? (
                <a href={n.url} target="_blank" rel="noreferrer" className="text-[15px] font-extrabold leading-snug text-magenta">{n.titulo}</a>
              ) : (
                <b className="text-[15px] leading-snug text-magenta">{n.titulo}</b>
              )}
              {n.resumen && <span className="line-clamp-2 text-[13px] text-ink-soft">{n.resumen}</span>}
              <div className="grid grid-cols-3 gap-2">
                <button className="rounded bg-magenta px-1.5 py-2 text-xs font-extrabold uppercase text-white" onClick={() => onRevisarNota(n.id, 'publicada')}>Publicar</button>
                <button className="rounded border-2 border-magenta px-1.5 py-1.5 text-xs font-extrabold uppercase text-magenta" onClick={() => onEditarNota(n.id)}>Editar</button>
                <button className="rounded border-2 border-line px-1.5 py-1.5 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onRevisarNota(n.id, 'descartada')}>Descartar</button>
              </div>
            </div>
          ))}
          {noticiasPendientes.length > notas.length && (
            <button className="self-start text-sm font-bold text-magenta underline" onClick={() => setVerTodas(true)}>
              Ver las {noticiasPendientes.length - notas.length} restantes
            </button>
          )}
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
            <button className="rounded border-2 border-magenta px-1.5 py-2 text-xs font-extrabold uppercase text-magenta" onClick={() => onEditar(o.id)}>Editar</button>
            <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onRevisar(o.id, 'descartada')}>Descartar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
