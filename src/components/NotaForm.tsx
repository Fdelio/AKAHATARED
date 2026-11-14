import { useState, type FormEvent } from 'react';
import type { Noticia, NuevaNoticia, Sistema, TipoNoticia } from '../types';
import { Boton } from './ui';
import { campo, etiqueta } from './CuentaView';

interface Props {
  /** Si viene, se edita esta noticia; si no, Akãhatã escribe una nota nueva. */
  inicial?: Noticia;
  onGuardar: (n: NuevaNoticia, publicar: boolean) => Promise<boolean>;
  onCancelar: () => void;
}

export default function NotaForm({ inicial, onGuardar, onCancelar }: Props) {
  const [n, setN] = useState<NuevaNoticia>(
    inicial
      ? {
          titulo: inicial.titulo, resumen: inicial.resumen.replace(/^\[En inglés: traducir al revisar\]\s*/, ''),
          comentario_akahata: inicial.comentario_akahata, url: inicial.url, fuente_nombre: inicial.fuente_nombre,
          tipo: inicial.tipo, sistema: inicial.sistema, imagen_url: inicial.imagen_url,
        }
      : { titulo: '', resumen: '', comentario_akahata: '', url: null, fuente_nombre: 'Akãhatã', tipo: 'nota_akahata', sistema: null, imagen_url: null },
  );
  const [publicar, setPublicar] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const cambiar = <K extends keyof NuevaNoticia>(k: K, v: NuevaNoticia[K]) => setN({ ...n, [k]: v });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await onGuardar({ ...n, url: n.url?.trim() || null, imagen_url: n.imagen_url?.trim() || null }, publicar);
    setGuardando(false);
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {inicial?.idioma === 'en' && (
        <p className="m-0 rounded bg-naranja-light p-3 text-sm text-naranja-dark">Esta nota llegó en inglés: traducí el título y el resumen antes de publicarla.</p>
      )}
      <label className={etiqueta}>
        Título
        <input required className={campo} value={n.titulo} onChange={(e) => cambiar('titulo', e.target.value)} />
      </label>
      <label className={etiqueta}>
        Resumen
        <textarea rows={inicial ? 4 : 8} className={campo} value={n.resumen} onChange={(e) => cambiar('resumen', e.target.value)}
          placeholder={inicial ? 'Qué pasó, en pocas líneas' : 'El texto de la nota'} />
      </label>
      <label className={etiqueta}>
        Por qué importa para la red (opcional)
        <textarea rows={3} className={campo} value={n.comentario_akahata} onChange={(e) => cambiar('comentario_akahata', e.target.value)}
          placeholder="Qué oportunidad abre, cómo pueden sumar su agenda organizaciones de otros temas" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={etiqueta}>
          Sistema
          <select className={campo} value={n.sistema ?? ''} onChange={(e) => cambiar('sistema', (e.target.value || null) as Sistema | null)}>
            <option value="">Varios / ninguno</option>
            <option>ONU</option>
            <option>OEA</option>
            <option>Mercosur</option>
          </select>
        </label>
        <label className={etiqueta}>
          Tipo
          <select className={campo} value={n.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoNoticia)}>
            <option value="noticia">Noticia</option>
            <option value="articulo">Artículo</option>
            <option value="nota_akahata">Nota de Akãhatã</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={etiqueta}>
          Fuente
          <input required className={campo} value={n.fuente_nombre} onChange={(e) => cambiar('fuente_nombre', e.target.value)} />
        </label>
        <label className={etiqueta}>
          Enlace
          <input type="url" className={campo} value={n.url ?? ''} onChange={(e) => cambiar('url', e.target.value)} placeholder="https://…" />
        </label>
      </div>
      <label className={etiqueta}>
        Imagen (enlace, opcional)
        <input type="url" className={campo} value={n.imagen_url ?? ''} onChange={(e) => cambiar('imagen_url', e.target.value)} placeholder="https://…/foto.jpg" />
        <span className="text-xs font-normal text-ink-soft">Si queda vacío, la noticia lleva una ilustración con los colores de Akãhatã.</span>
      </label>
      {n.imagen_url && <img src={n.imagen_url} alt="" referrerPolicy="no-referrer" className="aspect-video w-full rounded-lg object-cover" />}
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="size-4 accent-magenta" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
        Publicar en Noticias (si no, queda en Revisión)
      </label>
      <Boton>{guardando ? 'Guardando…' : publicar ? 'Publicar' : 'Guardar para revisar'}</Boton>
      <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onCancelar}>Cancelar</button>
    </form>
  );
}
