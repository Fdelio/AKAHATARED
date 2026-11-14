import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Comentario, Noticia, Organizacion, Sistema } from '../types';
import * as datos from '../lib/datos';
import { Iniciales } from './ui';

const TIPO: Record<Noticia['tipo'], string> = { noticia: 'Noticia', articulo: 'Artículo', nota_akahata: 'Nota de Akãhatã' };

export const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

function Etiquetas({ n }: { n: Noticia }) {
  const color =
    n.tipo === 'nota_akahata'
      ? 'bg-magenta text-white'
      : n.sistema === 'OEA'
        ? 'bg-magenta-light text-magenta'
        : n.sistema === 'Mercosur'
          ? 'bg-berenjena text-rosa'
          : 'bg-naranja-light text-naranja-dark';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${color}`}>
        {n.tipo === 'nota_akahata' ? 'Akãhatã' : n.sistema ?? 'Internacional'} · {TIPO[n.tipo]}
      </span>
      <span className="ml-auto text-[12px] text-ink-soft">{fechaCorta(n.publicada_en)}</span>
    </div>
  );
}

interface ListaProps {
  noticias: Noticia[];
  comentarios: Record<string, number>;
  onAbrir: (id: string) => void;
}

/** Portada de noticias: lo último de los espacios internacionales. */
export default function NoticiasView({ noticias, comentarios, onAbrir }: ListaProps) {
  const [filtro, setFiltro] = useState<'Todas' | Sistema | 'Akãhatã'>('Todas');
  const filtros = ['Todas', 'ONU', 'OEA', 'Mercosur', 'Akãhatã'] as const;
  const lista = noticias.filter((n) =>
    filtro === 'Todas' ? true : filtro === 'Akãhatã' ? n.tipo === 'nota_akahata' : n.sistema === filtro,
  );

  return (
    <div className="flex flex-col gap-3.5">
      <p className="m-0 text-sm text-ink-soft">
        Lo que pasa en la ONU, la OEA y el Mercosur, elegido por Akãhatã de distintas fuentes. Entrá a cada noticia para
        conversar con la red.
      </p>
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`flex-none rounded-full border-2 px-3 py-1 text-[13px] font-bold ${filtro === f ? 'border-magenta bg-magenta text-white' : 'border-line text-ink-soft'}`}
          >
            {f}
          </button>
        ))}
      </div>
      {lista.length === 0 && <p className="m-0 text-sm text-ink-soft">Todavía no hay noticias publicadas acá.</p>}
      {lista.map((n) => (
        <button
          key={n.id}
          onClick={() => onAbrir(n.id)}
          className={`flex w-full flex-col gap-2 rounded-lg border bg-white p-3.5 text-left hover:border-magenta ${n.tipo === 'nota_akahata' ? 'border-magenta border-l-[5px]' : 'border-line'}`}
        >
          <Etiquetas n={n} />
          <h3 className="m-0 text-base font-extrabold leading-snug text-magenta">{n.titulo}</h3>
          {n.resumen && <p className="m-0 line-clamp-3 text-sm text-ink">{n.resumen}</p>}
          <div className="flex items-center gap-2 text-[12px] text-ink-soft">
            <span>{n.fuente_nombre}</span>
            {n.comentario_akahata && <span className="font-bold text-naranja-dark">· Comentario de Akãhatã</span>}
            {comentarios[n.id] ? (
              <span className="ml-auto font-bold text-magenta">💬 {comentarios[n.id]}</span>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );
}

interface NotaProps {
  n: Noticia;
  organizaciones: Organizacion[];
  miOrg: string | null;
  usuariaId: string | null;
  revisora: boolean;
  onEditar?: () => void;
  onIngresar: () => void;
  onAviso: (t: string) => void;
}

/** Una noticia con su foro de discusión. */
export function NotaView({ n, organizaciones, miOrg, usuariaId, revisora, onEditar, onIngresar, onAviso }: NotaProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const puedeLeer = !!miOrg || revisora;
  const orgPorId = new Map(organizaciones.map((o) => [o.id, o]));

  const cargar = useCallback(async () => {
    if (!puedeLeer) return;
    try {
      setComentarios(await datos.listarComentarios(n.id));
    } catch (e) {
      console.error(e);
    }
  }, [n.id, puedeLeer]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!miOrg || !texto.trim()) return;
    setEnviando(true);
    try {
      await datos.comentar(n.id, miOrg, texto.trim());
      setTexto('');
      await cargar();
    } catch (err) {
      console.error(err);
      onAviso('No se pudo publicar el comentario.');
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (id: string) => {
    try {
      await datos.borrarComentario(id);
      await cargar();
    } catch (err) {
      console.error(err);
      onAviso('No se pudo borrar.');
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <Etiquetas n={n} />
      {onEditar && (
        <button onClick={onEditar} className="self-start rounded border-2 border-magenta px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-magenta">
          Editar (equipo Akãhatã)
        </button>
      )}
      <h2 className="m-0 text-[22px] font-black leading-tight text-magenta">{n.titulo}</h2>
      {n.resumen && <p className="m-0 whitespace-pre-wrap">{n.resumen}</p>}
      {n.comentario_akahata && (
        <div className="flex flex-col gap-1 rounded-lg border-2 border-naranja px-3.5 py-3">
          <b className="font-extrabold text-naranja-dark">Por qué importa para la red</b>
          <span className="whitespace-pre-wrap">{n.comentario_akahata}</span>
        </div>
      )}
      {n.url && (
        <a href={n.url} target="_blank" rel="noreferrer" className="self-start rounded bg-magenta px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-white">
          Leer completo en {n.fuente_nombre.split(' · ')[0]}
        </a>
      )}
      <div className="border-l-[3px] border-line pl-2.5 text-[13px] text-ink-soft">
        Fuente: {n.fuente_nombre}. {n.recolectada_automaticamente ? 'Recolectada automáticamente y elegida por Akãhatã.' : 'Publicada por Akãhatã.'}
      </div>

      <h3 className="mt-2 mb-0 text-base font-extrabold text-magenta">Foro de la red</h3>
      {!puedeLeer ? (
        <div className="flex flex-col gap-2 rounded-lg bg-crema p-3.5 text-sm">
          El foro es para las organizaciones de la red, para cuidar a quienes trabajan en contextos de riesgo.
          <button className="self-start font-bold text-magenta underline" onClick={onIngresar}>Entrar con mi organización</button>
        </div>
      ) : (
        <>
          {comentarios.length === 0 && <p className="m-0 text-sm text-ink-soft">Todavía nadie comentó. ¿Qué piensa tu organización?</p>}
          <div className="flex flex-col gap-2.5">
            {comentarios.map((c) => {
              const org = orgPorId.get(c.organizacion_id);
              const puedeBorrar = !c.borrado && (c.autor === usuariaId || revisora);
              return (
                <div key={c.id} className="flex gap-2.5">
                  <Iniciales org={org ?? { nombre: '?' }} />
                  <div className="min-w-0 flex-1 rounded-lg bg-crema px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                      <b className="text-magenta">{org?.nombre ?? 'Organización'}</b>
                      <span className="text-ink-soft">{fechaCorta(c.creado_en)}</span>
                    </div>
                    <div className={`whitespace-pre-wrap break-words ${c.borrado ? 'italic text-ink-soft' : ''}`}>{c.texto}</div>
                    {puedeBorrar && (
                      <button className="mt-1 text-[11px] font-bold text-ink-soft underline" onClick={() => borrar(c.id)}>
                        Borrar{revisora && c.autor !== usuariaId ? ' (moderación)' : ''}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {miOrg ? (
            <form onSubmit={enviar} className="flex flex-col gap-2">
              <textarea
                rows={3}
                maxLength={4000}
                className="w-full rounded border-2 border-line px-3 py-2 text-[15px] focus:border-magenta focus:outline-none"
                placeholder="Tu comentario va firmado con el nombre de tu organización"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <button disabled={enviando || !texto.trim()} className="self-end rounded bg-magenta px-4 py-2.5 text-[13px] font-extrabold uppercase text-white disabled:opacity-50">
                Comentar
              </button>
            </form>
          ) : (
            <p className="m-0 text-sm text-ink-soft">Cuando tu organización esté aprobada vas a poder comentar.</p>
          )}
        </>
      )}
    </div>
  );
}
