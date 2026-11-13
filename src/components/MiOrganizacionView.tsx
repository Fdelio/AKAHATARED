import { useState, type ReactNode } from 'react';
import {
  TIPOS_APORTE, type NuevoPedido, type Oportunidad, type Participacion, type PedidoApoyo, type Sesion, type SolicitudUnion, type TipoAporte,
  type Trabajo,
} from '../types';
import { Boton, EtiquetaSistema, Plazo } from './ui';
import { campo, etiqueta } from './CuentaView';
import PedirApoyo from './PedirApoyo';

interface Props {
  sesion: Sesion;
  oportunidades: Oportunidad[];
  participaciones: Participacion[];
  pedidos: PedidoApoyo[];
  personas: string[];
  solicitudes: SolicitudUnion[];
  onResponder: (perfilId: string, aceptar: boolean) => void;
  onAbrir: (id: string) => void;
  onIrACuenta: () => void;
  onGuardar: (oportunidadId: string, t: Trabajo) => void;
  onPedirApoyo: (p: NuevoPedido) => Promise<void>;
}

const ESTADO_PEDIDO = { nuevo: 'Enviado', en_curso: 'Akãhatã lo está viendo', cerrado: 'Cerrado' } as const;

export default function MiOrganizacionView({
  sesion, oportunidades, participaciones, pedidos, personas, solicitudes, onResponder, onAbrir, onIrACuenta, onGuardar, onPedirApoyo,
}: Props) {
  const org = sesion.organizacion;
  const [pidiendo, setPidiendo] = useState<string | null>(null); // id de oportunidad, o '' para un pedido general

  if (!org) {
    return (
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-ink-soft">Todavía no registraste tu organización.</p>
        <Boton onClick={onIrACuenta}>Registrar mi organización</Boton>
      </div>
    );
  }
  if (!org.aprobada) {
    return (
      <p className="m-0 rounded-lg bg-naranja-light p-3.5 text-sm text-naranja-dark">
        <b>{org.nombre} está esperando la aprobación de Akãhatã.</b> Cuando la aprueben vas a poder sumarte a
        oportunidades, registrar lo que hacen y pedir apoyo.
      </p>
    );
  }

  const mias = participaciones.filter((p) => p.organizacion_id === org.id);
  const titulo = (id: string | null) => oportunidades.find((o) => o.id === id)?.titulo;
  const enviarPedido = async (p: NuevoPedido) => {
    await onPedirApoyo(p);
    setPidiendo(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line p-3.5">
        <b className="block text-lg text-magenta">{org.nombre}</b>
        <span className="text-sm text-ink-soft">{org.pais}{org.temas.length > 0 && ' · ' + org.temas.join(', ')}</span>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Personas que entran por la organización</h3>
        {solicitudes.map((s) => (
          <div key={s.perfil_id} className="flex flex-col gap-2 rounded-lg border border-naranja bg-naranja-light/40 p-3 text-sm">
            <span><b>{s.email}</b> pidió sumarse a {org.nombre}. ¿Forma parte del equipo?</span>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded bg-magenta px-1.5 py-2.5 text-xs font-extrabold uppercase text-white" onClick={() => onResponder(s.perfil_id, true)}>Aceptar</button>
              <button className="rounded border-2 border-line px-1.5 py-2 text-xs font-extrabold uppercase text-ink-soft" onClick={() => onResponder(s.perfil_id, false)}>Rechazar</button>
            </div>
          </div>
        ))}
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
          {personas.map((p) => <li key={p}>• {p}{p === sesion.email && <span className="text-ink-soft"> (vos)</span>}</li>)}
        </ul>
        <p className="m-0 text-xs text-ink-soft">
          Para sumar a alguien: que entre con su correo y elija “{org.nombre}” en “Ya está en la red”. Te va a aparecer acá
          para aceptarla.
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Apoyo de Akãhatã</h3>
        {pidiendo === '' ? (
          <PedirApoyo oportunidadId={null} email={sesion.email} onEnviar={enviarPedido} onCancelar={() => setPidiendo(null)} />
        ) : (
          <Boton variante="borde" onClick={() => setPidiendo('')}>Pedir apoyo para redactar un documento</Boton>
        )}
        {pedidos.map((p) => (
          <div key={p.id} className="rounded-lg bg-crema p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <b>{TIPOS_APORTE[p.tipo_documento]}</b>
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-naranja-dark">{ESTADO_PEDIDO[p.estado]}</span>
            </div>
            {titulo(p.oportunidad_id) && <div className="text-[13px] text-ink-soft">Para: {titulo(p.oportunidad_id)}</div>}
            <div className="mt-1">{p.mensaje}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Nuestro trabajo</h3>
        {mias.length === 0 && (
          <p className="m-0 text-sm text-ink-soft">
            Todavía no se sumaron a ninguna oportunidad. Buscalas en Oportunidades y tocá “Me sumo”.
          </p>
        )}
        {mias.map((p) => {
          const o = oportunidades.find((x) => x.id === p.oportunidad_id);
          if (!o) return null;
          return (
            <Trabajo
              key={o.id}
              o={o}
              p={p}
              onAbrir={() => onAbrir(o.id)}
              onGuardar={(t) => onGuardar(o.id, t)}
              pidiendo={pidiendo === o.id}
              onPedir={() => setPidiendo(o.id)}
              formPedido={<PedirApoyo oportunidadId={o.id} email={sesion.email} onEnviar={enviarPedido} onCancelar={() => setPidiendo(null)} />}
            />
          );
        })}
      </section>
    </div>
  );
}

function Trabajo({
  o, p, onAbrir, onGuardar, pidiendo, onPedir, formPedido,
}: {
  o: Oportunidad; p: Participacion; onAbrir: () => void; onGuardar: (t: Trabajo) => void;
  pidiendo: boolean; onPedir: () => void; formPedido: ReactNode;
}) {
  const [t, setT] = useState<Trabajo>({ tipo_aporte: p.tipo_aporte, enviado: p.enviado, enlace: p.enlace, resultado: p.resultado });
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-white p-3.5">
      <button onClick={onAbrir} className="flex flex-col gap-2 border-0 bg-transparent p-0 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaSistema sistema={o.sistema} mecanismo={o.mecanismo} />
          <Plazo fecha={o.fecha_limite} />
        </div>
        <h3 className="m-0 text-base font-extrabold text-magenta">{o.titulo}</h3>
      </button>
      <label className={etiqueta}>
        Qué documento preparan
        <select
          className={campo}
          value={t.tipo_aporte ?? ''}
          onChange={(e) => setT({ ...t, tipo_aporte: (e.target.value || null) as TipoAporte | null })}
        >
          <option value="">Todavía no sabemos</option>
          {(Object.keys(TIPOS_APORTE) as TipoAporte[]).map((k) => (
            <option key={k} value={k}>{TIPOS_APORTE[k]}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="size-4 accent-magenta" checked={t.enviado} onChange={(e) => setT({ ...t, enviado: e.target.checked })} />
        Ya lo enviamos
      </label>
      {t.enviado && (
        <>
          <label className={etiqueta}>
            Enlace al documento (opcional)
            <input type="url" className={campo} value={t.enlace ?? ''} onChange={(e) => setT({ ...t, enlace: e.target.value })} placeholder="https://…" />
          </label>
          <label className={etiqueta}>
            Resultado
            <textarea
              rows={3}
              className={campo}
              value={t.resultado ?? ''}
              onChange={(e) => setT({ ...t, resultado: e.target.value })}
              placeholder="Qué se logró, qué recomendaciones salieron, qué seguimiento hace falta"
            />
          </label>
        </>
      )}
      <Boton variante="borde" onClick={() => onGuardar(t)}>Guardar</Boton>
      {pidiendo ? formPedido : !t.enviado && (
        <button className="self-start text-sm font-bold text-magenta underline" onClick={onPedir}>
          Pedir apoyo de Akãhatã para redactarlo
        </button>
      )}
    </div>
  );
}
