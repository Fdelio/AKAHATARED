import { useState, type FormEvent } from 'react';
import type { NuevaOrganizacion, Sesion } from '../types';
import { Boton } from './ui';

const TEMAS = [
  'Personas LGBTI+', 'Derechos sexuales y reproductivos', 'Identidad de género', 'Violencia de género',
  'Ambiente y clima', 'Desarrollo y derechos sociales', 'Empresas y economía', 'Migración', 'Salud', 'Educación',
];

export const campo =
  'w-full rounded border-2 border-line bg-white px-3 py-2.5 text-[15px] text-ink focus:border-magenta focus:outline-none';
export const etiqueta = 'flex flex-col gap-1 text-[13px] font-bold text-ink';

interface Props {
  sesion: Sesion | null;
  modoEjemplo: boolean;
  onEnviarEnlace: (email: string) => Promise<void>;
  onCrearOrganizacion: (org: NuevaOrganizacion) => Promise<void>;
  onSalir: () => void;
}

export default function CuentaView({ sesion, modoEjemplo, onEnviarEnlace, onCrearOrganizacion, onSalir }: Props) {
  if (!sesion) return <Ingreso modoEjemplo={modoEjemplo} onEnviarEnlace={onEnviarEnlace} />;
  if (!sesion.organizacion) return <AltaOrganizacion email={sesion.email} onCrear={onCrearOrganizacion} onSalir={onSalir} />;

  const org = sesion.organizacion;
  return (
    <div className="flex flex-col gap-4">
      {!org.aprobada && (
        <p className="m-0 rounded-lg bg-naranja-light p-3.5 text-sm text-naranja-dark">
          <b>Tu organización está esperando la aprobación de Akãhatã.</b> Mientras tanto podés ver el radar. Cuando la
          aprueben vas a poder sumarte a oportunidades y aparecer en el mapa de la red.
        </p>
      )}
      <div className="rounded-lg border border-line p-3.5">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">Tu organización</div>
        <b className="block text-lg text-magenta">{org.nombre}</b>
        <span className="text-sm text-ink-soft">{org.pais}{org.temas.length > 0 && ' · ' + org.temas.join(', ')}</span>
      </div>
      <div className="text-sm text-ink-soft">
        Ingresaste como <b className="text-ink">{sesion.email}</b>
        {sesion.rol === 'revisora' && ' (equipo de Akãhatã)'}.
      </div>
      {!modoEjemplo && <Boton variante="borde" onClick={onSalir}>Salir</Boton>}
    </div>
  );
}

function Ingreso({ modoEjemplo, onEnviarEnlace }: { modoEjemplo: boolean; onEnviarEnlace: (e: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'inicio' | 'enviando' | 'enviado' | 'error'>('inicio');

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      await onEnviarEnlace(email.trim());
      setEstado('enviado');
    } catch {
      setEstado('error');
    }
  };

  if (estado === 'enviado') {
    return (
      <div className="flex flex-col gap-3 rounded-lg bg-magenta-light p-4 text-magenta">
        <b className="text-lg">Revisá tu correo</b>
        <p className="m-0 text-sm text-ink">
          Te mandamos un enlace a <b>{email}</b>. Abrilo desde este mismo dispositivo para entrar. Si no llega en unos
          minutos, mirá la carpeta de spam.
        </p>
        <button className="self-start text-sm font-bold underline" onClick={() => setEstado('inicio')}>Usar otro correo</button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-soft">
        El radar es abierto. Para sumarte a oportunidades y ver el mapa de la red, entrá con el correo de tu
        organización. No hace falta contraseña: te mandamos un enlace.
      </p>
      <label className={etiqueta}>
        Correo
        <input type="email" required autoComplete="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@organizacion.org" />
      </label>
      {modoEjemplo && <p className="m-0 text-xs text-naranja-dark">En modo ejemplo no se manda ningún correo.</p>}
      {estado === 'error' && <p className="m-0 text-sm text-magenta">No pudimos mandar el enlace. Revisá el correo e intentá de nuevo en unos minutos.</p>}
      <Boton>{estado === 'enviando' ? 'Enviando…' : 'Mandarme el enlace'}</Boton>
      <p className="m-0 text-xs text-ink-soft">
        Solo guardamos tu correo para que puedas entrar. Tu organización decide qué muestra a la red.
      </p>
    </form>
  );
}

function AltaOrganizacion({ email, onCrear, onSalir }: { email: string; onCrear: (o: NuevaOrganizacion) => Promise<void>; onSalir: () => void }) {
  const [org, setOrg] = useState<NuevaOrganizacion>({ nombre: '', pais: '', temas: [], ofrece: '', necesita: '' });
  const [guardando, setGuardando] = useState(false);
  const cambiar = (k: keyof NuevaOrganizacion, v: string | string[]) => setOrg({ ...org, [k]: v });
  const alternarTema = (t: string) =>
    cambiar('temas', org.temas.includes(t) ? org.temas.filter((x) => x !== t) : [...org.temas, t]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await onCrear(org);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-soft">
        Hola, <b className="text-ink">{email}</b>. Contanos de tu organización. El equipo de Akãhatã la revisa antes de
        sumarla al mapa de la red.
      </p>
      <label className={etiqueta}>
        Nombre de la organización o colectiva
        <input required className={campo} value={org.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
      </label>
      <label className={etiqueta}>
        País
        <input required className={campo} value={org.pais} onChange={(e) => cambiar('pais', e.target.value)} />
      </label>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-[13px] font-bold">Temas en los que trabajan</legend>
        <div className="flex flex-wrap gap-1.5">
          {TEMAS.map((t) => {
            const activo = org.temas.includes(t);
            return (
              <button
                type="button"
                key={t}
                aria-pressed={activo}
                onClick={() => alternarTema(t)}
                className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${activo ? 'border-magenta bg-magenta text-white' : 'border-line text-ink-soft'}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className={etiqueta}>
        Qué pueden ofrecer a la red
        <input className={campo} value={org.ofrece} onChange={(e) => cambiar('ofrece', e.target.value)} placeholder="Ej.: experiencia en EPU, datos de casos" />
      </label>
      <label className={etiqueta}>
        Qué necesitan de la red
        <input className={campo} value={org.necesita} onChange={(e) => cambiar('necesita', e.target.value)} placeholder="Ej.: traducción, contactos en Ginebra" />
      </label>
      <p className="m-0 text-xs text-ink-soft">
        No pedimos nombres de personas ni direcciones. Si trabajan en un contexto de riesgo, pueden usar un nombre
        genérico.
      </p>
      <Boton>{guardando ? 'Enviando…' : 'Enviar para aprobación'}</Boton>
      <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onSalir}>Salir</button>
    </form>
  );
}
