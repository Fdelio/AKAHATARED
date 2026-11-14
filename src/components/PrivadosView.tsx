import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import type { MensajePrivado, Organizacion, PersonaRed } from '../types';
import * as datos from '../lib/datos';
import { Avatar } from './RedView';

interface Props {
  privados: MensajePrivado[];
  usuariaId: string;
  /** Con quién se está hablando; null = lista de conversaciones. */
  personaId: string | null;
  personas: PersonaRed[];
  organizaciones: Organizacion[];
  puedeEscribir: boolean;
  onAbrir: (personaId: string | null) => void;
  onCambio: () => void;
  onAviso: (t: string) => void;
}

const hora = (iso: string) =>
  new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function PrivadosView({ privados, usuariaId, personaId, personas, organizaciones, puedeEscribir, onAbrir, onCambio, onAviso }: Props) {
  const [extra, setExtra] = useState<{ id: string; nombre_visible: string; organizacion_id: string | null }[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const orgPorId = new Map(organizaciones.map((o) => [o.id, o]));

  // Nombres de quienes escribieron aunque no aparezcan en la red.
  useEffect(() => {
    datos.nombresDeConversaciones().then(setExtra).catch(console.error);
  }, [privados.length]);

  const quien = (id: string) => {
    const p = personas.find((x) => x.id === id) ?? extra.find((x) => x.id === id);
    const o = p?.organizacion_id ? orgPorId.get(p.organizacion_id) : undefined;
    return { nombre: p?.nombre_visible ?? 'Persona de la red', org: o?.nombre ?? null, acepta: personas.find((x) => x.id === id)?.acepta_mensajes ?? false };
  };

  // Conversaciones: la otra persona y el último mensaje.
  const porPersona = new Map<string, MensajePrivado[]>();
  privados.forEach((m) => {
    const otra = m.de === usuariaId ? m.para : m.de;
    porPersona.set(otra, [...(porPersona.get(otra) ?? []), m]);
  });

  const conversacion = personaId ? porPersona.get(personaId) ?? [] : [];
  const sinLeer = conversacion.filter((m) => m.para === usuariaId && !m.leido).length;

  useEffect(() => {
    if (personaId && sinLeer > 0) datos.marcarLeidos(personaId).then(onCambio).catch(console.error);
  }, [personaId, sinLeer, onCambio]);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [conversacion.length, personaId]);

  if (!personaId) {
    const lista = [...porPersona.entries()].sort((a, b) => b[1].at(-1)!.creado_en.localeCompare(a[1].at(-1)!.creado_en));
    return (
      <div className="flex flex-col gap-2">
        <p className="m-0 flex items-center gap-1.5 text-sm text-ink-soft">
          <Lock size={14} /> Solo lo ven las dos personas. Para escribirle a alguien nuevo, buscala en Red → Personas.
        </p>
        {lista.map(([id, ms]) => {
          const q = quien(id);
          const ultimo = ms.at(-1)!;
          const nuevos = ms.filter((m) => m.para === usuariaId && !m.leido).length;
          return (
            <button key={id} onClick={() => onAbrir(id)} className="flex gap-3 border-b border-line py-3 text-left last:border-b-0">
              <Avatar nombre={q.nombre} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline justify-between gap-2">
                  <b className="truncate">{q.nombre}</b>
                  <span className="flex-none text-[11px] text-ink-soft">{hora(ultimo.creado_en)}</span>
                </span>
                {q.org && <span className="text-[12px] text-ink-soft">{q.org}</span>}
                <span className={`truncate text-[13px] ${nuevos ? 'font-bold text-ink' : 'text-ink-soft'}`}>
                  {ultimo.de === usuariaId && 'Vos: '}{ultimo.texto}
                </span>
              </div>
              {nuevos > 0 && (
                <span className="self-center rounded-full bg-magenta px-2 py-0.5 text-[11px] font-extrabold text-white">{nuevos}</span>
              )}
            </button>
          );
        })}
        {lista.length === 0 && <p className="m-0 text-sm text-ink-soft">Todavía no tenés mensajes privados.</p>}
      </div>
    );
  }

  const q = quien(personaId);
  // Se puede escribir si la persona acepta mensajes o si ya nos escribió.
  const yaEscribio = conversacion.some((m) => m.de === personaId);
  const habilitado = puedeEscribir && (q.acepta || yaEscribio);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !habilitado) return;
    setEnviando(true);
    try {
      await datos.enviarMensajePrivado(personaId, texto.trim());
      setTexto('');
      onCambio();
    } catch (err) {
      console.error(err);
      onAviso('No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => onAbrir(null)} className="flex items-center gap-1 self-start text-sm font-bold text-magenta">
        <ArrowLeft size={16} /> Mensajes privados
      </button>
      <div className="flex items-center gap-3 rounded-lg border border-line p-3">
        <Avatar nombre={q.nombre} />
        <div className="flex flex-col">
          <b>{q.nombre}</b>
          {q.org && <span className="text-[13px] text-ink-soft">{q.org}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {conversacion.map((m) => {
          const mio = m.de === usuariaId;
          return (
            <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-[14px] ${mio ? 'self-end bg-magenta text-white' : 'self-start bg-white text-ink'}`}>
              <div className="whitespace-pre-wrap break-words">{m.texto}</div>
              <div className={`mt-0.5 text-[10px] ${mio ? 'text-white/80' : 'text-ink-soft'}`}>{hora(m.creado_en)}</div>
            </div>
          );
        })}
        {conversacion.length === 0 && <p className="m-0 text-sm text-ink-soft">Escribile para presentarte. Solo lo ven ustedes dos.</p>}
        <div ref={fin} />
      </div>
      {habilitado ? (
        <form onSubmit={enviar} className="flex gap-2">
          <textarea
            className="min-h-11 flex-1 resize-none rounded border-2 border-line bg-white px-3 py-2 text-[15px] focus:border-magenta focus:outline-none"
            rows={1}
            maxLength={4000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje"
          />
          <button disabled={enviando || !texto.trim()} className="rounded bg-magenta px-4 font-extrabold text-white disabled:opacity-50">
            Enviar
          </button>
        </form>
      ) : (
        <p className="m-0 text-sm text-ink-soft">
          {puedeEscribir ? 'Esta persona no recibe mensajes privados.' : 'Podés escribir cuando Akãhatã apruebe tu organización.'}
        </p>
      )}
    </div>
  );
}
