import { useState, type FormEvent } from 'react';
import { TIPOS_APORTE, type NuevoPedido, type TipoAporte } from '../types';
import { Boton } from './ui';
import { campo, etiqueta } from './CuentaView';

interface Props {
  oportunidadId: string | null;
  /** Para precargar el contacto. */
  email: string;
  onEnviar: (p: NuevoPedido) => Promise<void>;
  onCancelar: () => void;
}

/** Formulario para pedir a Akãhatã apoyo en la redacción de un documento. */
export default function PedirApoyo({ oportunidadId, email, onEnviar, onCancelar }: Props) {
  const [tipo, setTipo] = useState<TipoAporte>('informe_sombra');
  const [mensaje, setMensaje] = useState('');
  const [contacto, setContacto] = useState(email);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await onEnviar({ oportunidad_id: oportunidadId, tipo_documento: tipo, mensaje: mensaje.trim(), contacto: contacto.trim() });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg border-2 border-naranja bg-naranja-light/40 p-3.5">
      <b className="text-naranja-dark">Pedir apoyo de Akãhatã para redactar</b>
      <p className="m-0 text-[13px] text-ink-soft">
        El equipo de Akãhatã puede acompañarlas con la estructura, la redacción, la revisión o la traducción. Solo
        Akãhatã ve este pedido.
      </p>
      <label className={etiqueta}>
        Qué documento preparan
        <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoAporte)}>
          {(Object.keys(TIPOS_APORTE) as TipoAporte[]).map((t) => (
            <option key={t} value={t}>{TIPOS_APORTE[t]}</option>
          ))}
        </select>
      </label>
      <label className={etiqueta}>
        Qué necesitan
        <textarea
          required
          rows={3}
          className={campo}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Ej.: tenemos los datos pero no sabemos cómo armar el informe; necesitamos revisión antes de enviarlo"
        />
      </label>
      <label className={etiqueta}>
        Cómo las contactamos
        <input required className={campo} value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Correo, Signal, WhatsApp…" />
      </label>
      <Boton>{enviando ? 'Enviando…' : 'Enviar pedido'}</Boton>
      <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onCancelar}>Cancelar</button>
    </form>
  );
}
