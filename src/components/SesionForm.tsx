import { useState, type FormEvent } from 'react';
import type { FechaClave, NuevaSesion, SesionOrgano, Sistema } from '../types';
import { Boton } from './ui';
import { campo, etiqueta } from './CuentaView';

const VACIA: NuevaSesion = {
  sistema: 'ONU', organo: '', nombre: '', fecha_inicio: '', fecha_fin: null, a_confirmar: false,
  lugar: '', descripcion: '', fuente_url: null, fechas_clave: [],
};

const FECHA_VACIA: FechaClave = { fecha: '', texto: '', url: null, aprox: false };

interface Props {
  /** Si viene, el formulario corrige esta sesión; si no, carga una nueva. */
  inicial?: SesionOrgano;
  onGuardar: (s: NuevaSesion) => Promise<boolean>;
  onBorrar?: () => Promise<void>;
  onCancelar: () => void;
}

/** Formulario del equipo de Akãhatã para cargar o corregir una sesión del calendario. */
export default function SesionForm({ inicial, onGuardar, onBorrar, onCancelar }: Props) {
  const [s, setS] = useState<NuevaSesion>(() => {
    if (!inicial) return VACIA;
    const { id: _id, ...resto } = inicial;
    return { ...resto, fechas_clave: inicial.fechas_clave.map((f) => ({ ...f })) };
  });
  const [guardando, setGuardando] = useState(false);
  const cambiar = <K extends keyof NuevaSesion>(k: K, v: NuevaSesion[K]) => setS({ ...s, [k]: v });
  const cambiarFecha = (i: number, f: Partial<FechaClave>) =>
    cambiar('fechas_clave', s.fechas_clave.map((x, j) => (j === i ? { ...x, ...f } : x)));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const fechas = s.fechas_clave
      .filter((f) => f.fecha && f.texto.trim())
      .map((f) => ({ ...f, texto: f.texto.trim(), url: f.url?.trim() || null }));
    await onGuardar({ ...s, fechas_clave: fechas });
    setGuardando(false);
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3.5 rounded-lg border-2 border-rosa bg-tarjeta p-3.5">
      <h3 className="m-0 text-base font-extrabold text-rosa">{inicial ? 'Editar sesión' : 'Nueva sesión'}</h3>

      <fieldset className="m-0 flex gap-2 border-0 p-0">
        <legend className="mb-1 text-[13px] font-bold">Sistema</legend>
        {(['ONU', 'OEA', 'Mercosur'] as Sistema[]).map((x) => (
          <label key={x} className={`flex-1 cursor-pointer rounded border-2 px-2 py-2 text-center text-sm font-bold ${s.sistema === x ? 'border-rosa bg-magenta text-white' : 'border-line text-ink-soft'}`}>
            <input type="radio" name="sistema-sesion" className="sr-only" checked={s.sistema === x} onChange={() => cambiar('sistema', x)} />
            {x}
          </label>
        ))}
      </fieldset>

      <label className={etiqueta}>
        Órgano
        <input required className={campo} value={s.organo} onChange={(e) => cambiar('organo', e.target.value)} placeholder="Ej.: Consejo de Derechos Humanos" />
      </label>
      <label className={etiqueta}>
        Nombre de la sesión
        <input required className={campo} value={s.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej.: CSW71 · Comisión de la Condición Jurídica y Social de la Mujer" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={etiqueta}>
          Empieza
          <input required type="date" className={campo} value={s.fecha_inicio} onChange={(e) => cambiar('fecha_inicio', e.target.value)} />
        </label>
        <label className={etiqueta}>
          Termina
          <input type="date" className={campo} value={s.fecha_fin ?? ''} onChange={(e) => cambiar('fecha_fin', e.target.value || null)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="size-4 accent-rosa" checked={s.a_confirmar} onChange={(e) => cambiar('a_confirmar', e.target.checked)} />
        Fechas a confirmar
      </label>

      <label className={etiqueta}>
        Lugar
        <input className={campo} value={s.lugar} onChange={(e) => cambiar('lugar', e.target.value)} placeholder="Ej.: Ginebra" />
      </label>
      <label className={etiqueta}>
        Descripción
        <textarea rows={3} className={campo} value={s.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
      </label>
      <label className={etiqueta}>
        Enlace a la página de esta sesión
        <input type="url" className={campo} value={s.fuente_url ?? ''} onChange={(e) => cambiar('fuente_url', e.target.value)} placeholder="https://… (la página específica, no la portada)" />
      </label>

      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-bold">Fechas clave para participar</span>
        {s.fechas_clave.length === 0 && (
          <p className="m-0 text-[13px] text-ink-soft">Por ejemplo: cierre de inscripción, plazo para informes, pedido de eventos paralelos.</p>
        )}
        {s.fechas_clave.map((f, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-panel p-2.5">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <input required type="date" aria-label="Fecha" className={campo} value={f.fecha} onChange={(e) => cambiarFecha(i, { fecha: e.target.value })} />
              <button type="button" className="px-2 text-xs font-extrabold uppercase text-ink-soft underline" onClick={() => cambiar('fechas_clave', s.fechas_clave.filter((_, j) => j !== i))}>
                Quitar
              </button>
            </div>
            <input required aria-label="Qué vence ese día" className={campo} value={f.texto} onChange={(e) => cambiarFecha(i, { texto: e.target.value })} placeholder="Qué vence ese día" />
            <input type="url" aria-label="Enlace" className={campo} value={f.url ?? ''} onChange={(e) => cambiarFecha(i, { url: e.target.value })} placeholder="Enlace al formulario o la guía (opcional)" />
            <label className="flex items-center gap-2 text-[13px] font-bold">
              <input type="checkbox" className="size-4 accent-rosa" checked={f.aprox} onChange={(e) => cambiarFecha(i, { aprox: e.target.checked })} />
              Fecha aproximada
            </label>
          </div>
        ))}
        <button type="button" className="self-start text-sm font-bold text-rosa underline" onClick={() => cambiar('fechas_clave', [...s.fechas_clave, { ...FECHA_VACIA }])}>
          + Agregar fecha clave
        </button>
      </div>

      <Boton>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
      <div className="flex justify-between">
        <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onCancelar}>Cancelar</button>
        {onBorrar && (
          <button
            type="button"
            className="text-sm font-bold text-rosa underline"
            onClick={() => {
              if (window.confirm('¿Borrar esta sesión del calendario?')) onBorrar();
            }}
          >
            Borrar sesión
          </button>
        )}
      </div>
    </form>
  );
}
