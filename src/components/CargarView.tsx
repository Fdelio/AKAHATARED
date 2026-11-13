import { useState, type FormEvent } from 'react';
import type { NuevaOportunidad, Sistema } from '../types';
import { Boton } from './ui';
import { campo, etiqueta } from './CuentaView';

const MECANISMOS: Record<Sistema, string[]> = {
  ONU: [
    'Examen Periódico Universal (EPU)', 'Comité CEDAW', 'Comité de Derechos Humanos', 'Comité DESC', 'Comité de los Derechos del Niño',
    'Comité contra la Tortura', 'Comité CERD', 'Comité de Trabajadores Migratorios', 'Comité CDPD',
    'Experto Independiente SOGI', 'Relatoría sobre ambiente', 'Relatoría sobre pobreza extrema', 'Relatoría sobre defensoras y defensores',
    'Consejo de Derechos Humanos',
  ],
  OEA: ['CIDH · audiencias', 'CIDH · consultas públicas', 'CIDH · informes', 'Corte IDH · opiniones consultivas', 'Asamblea General de la OEA'],
  Mercosur: ['RAADH', 'IPPDH'],
};

const TEMAS = [
  'Ambiente y clima', 'Desarrollo y derechos sociales', 'Empresas y economía', 'Migración', 'Salud', 'Educación',
  'Personas LGBTI+', 'Derechos sexuales y reproductivos', 'Identidad de género', 'Violencia de género', 'Otro',
];

const VACIA: NuevaOportunidad = {
  sistema: 'ONU', mecanismo: '', titulo: '', pais: 'Regional', tema: '', resumen: '', angulo_agenda: '',
  pasos: [], fecha_limite: '', fuente_nombre: '', fuente_url: null,
};

interface Props {
  onGuardar: (o: NuevaOportunidad, publicar: boolean) => Promise<boolean>;
  onCancelar: () => void;
}

export default function CargarView({ onGuardar, onCancelar }: Props) {
  const [o, setO] = useState<NuevaOportunidad>(VACIA);
  const [pasos, setPasos] = useState('');
  const [publicar, setPublicar] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const cambiar = <K extends keyof NuevaOportunidad>(k: K, v: NuevaOportunidad[K]) => setO({ ...o, [k]: v });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const listaPasos = pasos.split('\n').map((p) => p.trim()).filter(Boolean);
    const ok = await onGuardar({ ...o, pasos: listaPasos, fuente_url: o.fuente_url?.trim() || null }, publicar);
    setGuardando(false);
    if (ok) {
      setO(VACIA);
      setPasos('');
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-soft">
        Para convocatorias que el radar no recolecta solo. Pensá en organizaciones que no trabajan este tema: el
        “cómo sumar tu agenda” es lo que las anima a participar.
      </p>

      <fieldset className="m-0 flex gap-2 border-0 p-0">
        <legend className="mb-1 text-[13px] font-bold">Sistema</legend>
        {(Object.keys(MECANISMOS) as Sistema[]).map((s) => (
          <label key={s} className={`flex-1 cursor-pointer rounded border-2 px-2 py-2 text-center text-sm font-bold ${o.sistema === s ? 'border-magenta bg-magenta text-white' : 'border-line text-ink-soft'}`}>
            <input type="radio" name="sistema" className="sr-only" checked={o.sistema === s} onChange={() => cambiar('sistema', s)} />
            {s}
          </label>
        ))}
      </fieldset>

      <label className={etiqueta}>
        Mecanismo
        <input required list="mecanismos" className={campo} value={o.mecanismo} onChange={(e) => cambiar('mecanismo', e.target.value)} placeholder="Elegí de la lista o escribí otro" />
        <datalist id="mecanismos">
          {MECANISMOS[o.sistema].map((m) => <option key={m} value={m} />)}
        </datalist>
      </label>

      <label className={etiqueta}>
        Título
        <input required className={campo} value={o.titulo} onChange={(e) => cambiar('titulo', e.target.value)} placeholder="Ej.: Consulta sobre el informe de minería y derechos" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={etiqueta}>
          Tema
          <select required className={campo} value={o.tema} onChange={(e) => cambiar('tema', e.target.value)}>
            <option value="" disabled>Elegí…</option>
            {TEMAS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className={etiqueta}>
          País o región
          <input required className={campo} value={o.pais} onChange={(e) => cambiar('pais', e.target.value)} />
        </label>
      </div>

      <label className={etiqueta}>
        Fecha límite
        <input required type="date" className={campo} value={o.fecha_limite} onChange={(e) => cambiar('fecha_limite', e.target.value)} />
      </label>

      <label className={etiqueta}>
        Resumen en lenguaje simple
        <textarea required rows={3} className={campo} value={o.resumen} onChange={(e) => cambiar('resumen', e.target.value)} placeholder="Qué piden, a quién y para qué" />
      </label>

      <label className={etiqueta}>
        Cómo sumar tu agenda
        <textarea rows={3} className={campo} value={o.angulo_agenda} onChange={(e) => cambiar('angulo_agenda', e.target.value)} placeholder="Qué puede aportar una mirada feminista y de diversidad a este tema" />
      </label>

      <label className={etiqueta}>
        Pasos para participar (uno por línea)
        <textarea rows={3} className={campo} value={pasos} onChange={(e) => setPasos(e.target.value)} placeholder={'Leer la nota conceptual\nResponder las preguntas 2 y 5\nEnviar a la dirección indicada'} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={etiqueta}>
          Fuente
          <input required className={campo} value={o.fuente_nombre} onChange={(e) => cambiar('fuente_nombre', e.target.value)} placeholder="Ej.: OHCHR" />
        </label>
        <label className={etiqueta}>
          Enlace
          <input type="url" className={campo} value={o.fuente_url ?? ''} onChange={(e) => cambiar('fuente_url', e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="size-4 accent-magenta" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
        Publicar ya en el radar (si no, queda en Revisión)
      </label>

      <Boton>{guardando ? 'Guardando…' : publicar ? 'Publicar oportunidad' : 'Guardar para revisar'}</Boton>
      <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onCancelar}>Volver a Revisión</button>
    </form>
  );
}
