import { useState } from 'react';
import { TIPOS_APORTE, type NuevoPedido, type Oportunidad, type Organizacion, type Participacion, type Visibilidad } from '../types';
import PedirApoyo from './PedirApoyo';
import { Boton, EtiquetaSistema, Iniciales, Plazo } from './ui';

interface Props {
  o: Oportunidad;
  organizaciones: Organizacion[];
  participaciones: Participacion[];
  miOrg: string | null;
  onSumarse: (v: Visibilidad) => void;
  onSalirse: () => void;
  email: string;
  /** null si la persona no tiene una organización aprobada. */
  onPedirApoyo: ((p: NuevoPedido) => Promise<void>) | null;
  onSinOrganizacion: () => void;
  onConversar: () => void;
  /** Solo para el equipo de Akãhatã. */
  onEditar?: () => void;
}

const OPCIONES: { v: Visibilidad; texto: string }[] = [
  { v: 'red', texto: 'Solo organizaciones de la red' },
  { v: 'publica', texto: 'Público' },
  { v: 'solo_akahata', texto: 'Solo Akãhatã (para contextos de riesgo)' },
];

export default function OportunidadView({ o, organizaciones, participaciones, miOrg, onSumarse, onSalirse, email, onPedirApoyo, onSinOrganizacion, onConversar, onEditar }: Props) {
  const ps = participaciones.filter((p) => p.oportunidad_id === o.id);
  const mia = ps.find((p) => p.organizacion_id === miOrg);
  const [vis, setVis] = useState<Visibilidad>(mia?.visibilidad ?? 'red');
  const [pidiendo, setPidiendo] = useState(false);
  const orgPorId = new Map(organizaciones.map((x) => [x.id, x]));
  const otras = ps.filter((p) => p.organizacion_id !== miOrg && p.visibilidad !== 'solo_akahata');

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaSistema sistema={o.sistema} mecanismo={o.mecanismo} />
        <Plazo fecha={o.fecha_limite} />
      </div>
      {onEditar && (
        <button
          onClick={onEditar}
          className="self-start rounded border-2 border-magenta px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-magenta"
        >
          Editar (equipo Akãhatã)
        </button>
      )}
      <h2 className="m-0 text-[22px] font-black leading-tight text-magenta">{o.titulo}</h2>
      <div className="text-sm text-ink-soft">
        {o.pais} · {o.tema}
      </div>
      <p className="m-0">{o.resumen}</p>

      <div className="flex flex-col gap-1 rounded-lg border-2 border-naranja px-3.5 py-3">
        <b className="font-extrabold text-naranja-dark">Cómo sumar tu agenda</b>
        <span>{o.angulo_agenda}</span>
      </div>

      {o.pasos.length > 0 && (
        <>
          <h3 className="mt-2 mb-0 text-base font-extrabold text-magenta">Cómo participar</h3>
          <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 marker:font-extrabold marker:text-naranja">
            {o.pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </>
      )}

      <h3 className="mt-2 mb-0 text-base font-extrabold text-magenta">Quiénes se sumaron ({otras.length + (mia ? 1 : 0)})</h3>
      <div>
        {otras.map((p) => {
          const org = orgPorId.get(p.organizacion_id);
          if (!org) return null;
          return (
            <div key={org.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
              <Iniciales org={org} grande />
              <div>
                <b className="block">{org.nombre}</b>
                <span className="text-[13px] text-ink-soft">
                  {org.pais}
                  {p.tipo_aporte && <> · {TIPOS_APORTE[p.tipo_aporte].toLowerCase()}{p.enviado && ' (enviado)'}</>}
                </span>
              </div>
            </div>
          );
        })}
        {mia && (
          <div className="flex items-center gap-3 py-2.5">
            <Iniciales org={{ nombre: 'Tu Organización' }} grande />
            <div>
              <b className="block">Tu organización</b>
              <span className="text-[13px] text-ink-soft">{OPCIONES.find((x) => x.v === mia.visibilidad)?.texto}</span>
            </div>
          </div>
        )}
        {otras.length === 0 && !mia && (
          <p className="m-0 text-sm text-ink-soft">Todavía nadie. Podés ser la primera y avisar a la red.</p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2 rounded-lg border-0 bg-crema px-3.5 py-3">
        <legend className="float-left mb-1 font-bold">Si te sumás, ¿quién lo puede ver?</legend>
        {OPCIONES.map((op) => (
          <label key={op.v} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="radio"
              name="visibilidad"
              className="mt-1 accent-magenta"
              checked={vis === op.v}
              onChange={() => setVis(op.v)}
            />
            {op.texto}
          </label>
        ))}
      </fieldset>

      {mia ? (
        <Boton variante="hecho" onClick={onSalirse}>Te sumaste ✓ · Tocá para salir</Boton>
      ) : (
        <Boton onClick={() => onSumarse(vis)}>Me sumo</Boton>
      )}
      {pidiendo && onPedirApoyo ? (
        <PedirApoyo
          oportunidadId={o.id}
          email={email}
          onEnviar={async (p) => {
            await onPedirApoyo(p);
            setPidiendo(false);
          }}
          onCancelar={() => setPidiendo(false)}
        />
      ) : (
        <Boton variante="borde" onClick={() => (onPedirApoyo ? setPidiendo(true) : onSinOrganizacion())}>
          Pedir apoyo de Akãhatã para redactar
        </Boton>
      )}
      <Boton variante="borde" onClick={onConversar}>Conversar con la red sobre esta oportunidad</Boton>
      <div className="border-l-[3px] border-line pl-2.5 text-[13px] text-ink-soft">
        Fuente: {o.fuente_url ? <a className="text-magenta" href={o.fuente_url} target="_blank" rel="noreferrer">{o.fuente_nombre}</a> : o.fuente_nombre}.{' '}
        {o.recolectada_automaticamente ? 'Recolectada automáticamente y revisada por Akãhatã.' : 'Cargada por Akãhatã.'}
      </div>
    </div>
  );
}
