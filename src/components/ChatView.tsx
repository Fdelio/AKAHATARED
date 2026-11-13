import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Mensaje, Oportunidad, Organizacion } from '../types';
import * as datos from '../lib/datos';
import { Iniciales } from './ui';

interface Props {
  /** null = sala general. */
  sala: string | null;
  oportunidades: Oportunidad[];
  organizaciones: Organizacion[];
  /** Mi organización aprobada; sin ella se puede leer pero no escribir. */
  miOrg: string | null;
  usuariaId: string;
  revisora: boolean;
  onCambiarSala: (sala: string | null) => void;
  onAviso: (t: string) => void;
}

const hora = (iso: string) =>
  new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function ChatView({ sala, oportunidades, organizaciones, miOrg, usuariaId, revisora, onCambiarSala, onAviso }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [conteo, setConteo] = useState<Record<string, number>>({});
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const orgPorId = new Map(organizaciones.map((o) => [o.id, o]));

  const cargar = useCallback(async () => {
    try {
      const [ms, c] = await Promise.all([datos.listarMensajes(sala), datos.contarMensajesPorOportunidad()]);
      setMensajes(ms);
      setConteo(c);
    } catch (e) {
      console.error(e);
    }
  }, [sala]);

  useEffect(() => {
    cargar();
    return datos.escucharMensajes(cargar);
  }, [cargar]);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [mensajes.length]);

  // Salas: la general, las oportunidades abiertas y las que ya tienen conversación.
  const salas = oportunidades.filter((o) => datos.diasHasta(o.fecha_limite) >= 0 || conteo[o.id]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!miOrg || !texto.trim()) return;
    setEnviando(true);
    try {
      await datos.enviarMensaje(miOrg, sala, texto.trim());
      setTexto('');
      await cargar();
    } catch (err) {
      console.error(err);
      onAviso('No se pudo enviar. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (id: string) => {
    try {
      await datos.borrarMensaje(id);
      await cargar();
      onAviso('Mensaje borrado');
    } catch (err) {
      console.error(err);
      onAviso('No se pudo borrar.');
    }
  };

  const actual = sala ? oportunidades.find((o) => o.id === sala) : null;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-[13px] font-bold">
        Conversación
        <select
          className="w-full rounded border-2 border-line bg-white px-3 py-2.5 text-[15px] focus:border-magenta focus:outline-none"
          value={sala ?? ''}
          onChange={(e) => onCambiarSala(e.target.value || null)}
        >
          <option value="">Sala general de la red</option>
          {salas.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo.length > 60 ? o.titulo.slice(0, 58) + '…' : o.titulo}
              {conteo[o.id] ? ` (${conteo[o.id]})` : ''}
            </option>
          ))}
        </select>
      </label>
      <p className="m-0 text-[13px] text-ink-soft">
        {actual
          ? 'Para coordinar esta oportunidad: quién escribe qué, informes conjuntos, reuniones.'
          : 'Para toda la red. Los mensajes van firmados con el nombre de la organización, no de la persona.'}{' '}
        Solo lo ven las organizaciones aprobadas y Akãhatã.
      </p>

      <div className="flex flex-col gap-2.5 rounded-lg bg-crema p-3">
        {mensajes.length === 0 && <p className="m-0 text-sm text-ink-soft">Todavía no hay mensajes. Escribí el primero.</p>}
        {mensajes.map((m) => {
          const org = orgPorId.get(m.organizacion_id);
          const propia = m.organizacion_id === miOrg;
          const puedeBorrar = !m.borrado && (m.autor === usuariaId || revisora);
          return (
            <div key={m.id} className={`flex gap-2 ${propia ? 'flex-row-reverse' : ''}`}>
              <Iniciales org={org ?? { nombre: '?' }} />
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${propia ? 'bg-magenta-light' : 'bg-white'}`}>
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <b className="text-magenta">{org?.nombre ?? 'Organización'}</b>
                  <span className="text-ink-soft">{hora(m.creado_en)}</span>
                </div>
                <div className={`whitespace-pre-wrap break-words ${m.borrado ? 'italic text-ink-soft' : ''}`}>{m.texto}</div>
                {puedeBorrar && (
                  <button className="mt-1 text-[11px] font-bold text-ink-soft underline" onClick={() => borrar(m.id)}>
                    Borrar{revisora && m.autor !== usuariaId ? ' (moderación)' : ''}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      {miOrg ? (
        <form onSubmit={enviar} className="flex gap-2">
          <textarea
            rows={2}
            maxLength={2000}
            className="flex-1 rounded border-2 border-line px-3 py-2 text-[15px] focus:border-magenta focus:outline-none"
            placeholder="Escribí un mensaje…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button disabled={enviando || !texto.trim()} className="rounded bg-magenta px-4 text-[13px] font-extrabold uppercase text-white disabled:opacity-50">
            Enviar
          </button>
        </form>
      ) : (
        <p className="m-0 text-sm text-ink-soft">Cuando tu organización esté aprobada vas a poder escribir.</p>
      )}
    </div>
  );
}
