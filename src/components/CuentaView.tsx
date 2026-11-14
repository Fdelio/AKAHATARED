import { useState, type FormEvent } from 'react';
import type { NuevaOrganizacion, Organizacion, Perfil, Sesion } from '../types';
import { Boton } from './ui';
import * as datos from '../lib/datos';

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
  onCrearOrganizacion: (org: NuevaOrganizacion) => Promise<void>;
  /** Organizaciones aprobadas, para sumarse a una que ya está en la red. */
  organizaciones: Organizacion[];
  onPedirUnirme: (organizacionId: string) => Promise<void>;
  onCancelarSolicitud: () => void;
  onSalir: () => void;
  /** Vuelve a leer la sesión después de guardar el perfil. */
  onRecargar: () => void;
}

export default function CuentaView({
  sesion, modoEjemplo, onCrearOrganizacion, organizaciones, onPedirUnirme, onCancelarSolicitud, onSalir, onRecargar,
}: Props) {
  if (!sesion) return <Ingreso modoEjemplo={modoEjemplo} />;
  if (!sesion.organizacion && sesion.solicitud) {
    return (
      <div className="flex flex-col gap-4">
        <p className="m-0 rounded-lg bg-naranja-light p-3.5 text-sm text-naranja-dark">
          Pediste sumarte a <b>{sesion.solicitud.nombre}</b>. Te va a aceptar alguien de esa organización o el equipo de
          Akãhatã. Mientras tanto podés ver las oportunidades.
        </p>
        <Boton variante="borde" onClick={onCancelarSolicitud}>Cancelar el pedido</Boton>
        <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onSalir}>Salir</button>
      </div>
    );
  }
  if (!sesion.organizacion) {
    return (
      <SinOrganizacion
        email={sesion.email}
        organizaciones={organizaciones}
        onPedirUnirme={onPedirUnirme}
        onCrear={onCrearOrganizacion}
        onSalir={onSalir}
      />
    );
  }

  const org = sesion.organizacion;
  return (
    <div className="flex flex-col gap-4">
      {!org.aprobada && (
        <p className="m-0 rounded-lg bg-naranja-light p-3.5 text-sm text-naranja-dark">
          <b>Tu organización está esperando la aprobación de Akãhatã.</b> Mientras tanto podés ver el radar. Cuando la
          aprueben vas a poder sumarte a oportunidades y aparecer en la red.
        </p>
      )}
      <div className="rounded-lg border border-line p-3.5">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">Tu organización</div>
        <b className="block text-lg text-magenta">{org.nombre}</b>
        <span className="text-sm text-ink-soft">{org.pais}{org.temas.length > 0 && ' · ' + org.temas.join(', ')}</span>
      </div>
      <TuPerfil perfil={sesion.perfil} aprobada={org.aprobada} onGuardado={onRecargar} />
      <div className="text-sm text-ink-soft">
        Ingresaste como <b className="text-ink">{sesion.email}</b>
        {sesion.rol === 'revisora' && ' (equipo de Akãhatã)'}. Tu correo no se muestra a nadie.
      </div>
      <CambiarContrasena />
      {!modoEjemplo && <Boton variante="borde" onClick={onSalir}>Salir</Boton>}
    </div>
  );
}

/** Datos personales opcionales. Cada persona elige si aparece en la red y si se le puede escribir. */
function TuPerfil({ perfil, aprobada, onGuardado }: { perfil: Perfil; aprobada: boolean; onGuardado: () => void }) {
  const [p, setP] = useState<Perfil>(perfil);
  const [estado, setEstado] = useState<'' | 'guardando' | 'listo' | 'error'>('');
  const cambiar = <K extends keyof Perfil>(k: K, v: Perfil[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setEstado('');
  };
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('guardando');
    try {
      await datos.guardarPerfil(p);
      setEstado('listo');
      onGuardado();
    } catch {
      setEstado('error');
    }
  };
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg border border-line p-3.5">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">Tu perfil</div>
        <p className="m-0 mt-1 text-sm text-ink-soft">
          Todo es opcional. Podés usar un apodo o solo tu nombre de pila. Si tu trabajo te pone en riesgo, no pongas
          nada que te identifique.
        </p>
      </div>
      <label className={etiqueta}>
        Cómo querés que te vean
        <input className={campo} maxLength={80} value={p.nombre_visible} onChange={(e) => cambiar('nombre_visible', e.target.value)} placeholder="Ej.: Camila" />
      </label>
      <label className={etiqueta}>
        Qué hacés en tu organización
        <input className={campo} maxLength={80} value={p.cargo} onChange={(e) => cambiar('cargo', e.target.value)} placeholder="Ej.: incidencia internacional" />
      </label>
      <label className={etiqueta}>
        Algo sobre vos o tu trabajo
        <textarea className={campo} rows={3} maxLength={400} value={p.presentacion} onChange={(e) => cambiar('presentacion', e.target.value)} placeholder="Temas en los que trabajás, idiomas, espacios donde participaste…" />
      </label>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input type="checkbox" className="mt-1 size-4 accent-magenta" checked={p.visible_en_red} onChange={(e) => cambiar('visible_en_red', e.target.checked)} />
        <span><b>Aparecer en la red.</b> Tu nombre, lo que hacés y tu organización se ven solo para organizaciones aprobadas.</span>
      </label>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input type="checkbox" className="mt-1 size-4 accent-magenta" checked={p.acepta_mensajes} onChange={(e) => cambiar('acepta_mensajes', e.target.checked)} />
        <span><b>Recibir mensajes privados</b> dentro de la app. Nadie ve tu correo.</span>
      </label>
      {!aprobada && p.visible_en_red && (
        <p className="m-0 text-xs text-naranja-dark">Vas a aparecer cuando Akãhatã apruebe tu organización.</p>
      )}
      {estado === 'listo' && <p className="m-0 text-sm font-bold text-magenta">Listo, guardamos tu perfil.</p>}
      {estado === 'error' && <p className="m-0 text-sm text-magenta">No se pudo guardar. Intentá de nuevo.</p>}
      <Boton variante="borde">{estado === 'guardando' ? 'Guardando…' : 'Guardar perfil'}</Boton>
    </form>
  );
}

function CambiarContrasena() {
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);
  if (listo) return <p className="m-0 text-sm font-bold text-magenta">Guardamos tu contraseña. La próxima vez entrá con tu correo y esa contraseña.</p>;
  if (!abierto)
    return (
      <button type="button" className="self-start text-sm font-bold text-magenta underline" onClick={() => setAbierto(true)}>
        Crear o cambiar tu contraseña
      </button>
    );
  return <NuevaContrasena titulo="Crear o cambiar tu contraseña" onListo={() => setListo(true)} />;
}

type ModoIngreso = 'entrar' | 'crear' | 'olvide' | 'enlace';

/** Ingreso con correo y contraseña. El correo se usa solo para confirmar la cuenta la primera vez y para recuperar la contraseña. */
export function Ingreso({ modoEjemplo }: { modoEjemplo: boolean }) {
  const [modo, setModo] = useState<ModoIngreso>('entrar');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [estado, setEstado] = useState<'inicio' | 'enviando' | 'correo' | 'error'>('inicio');
  const [error, setError] = useState('');

  const cambiarModo = (m: ModoIngreso) => {
    setModo(m);
    setEstado('inicio');
    setError('');
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (modo === 'crear' && contrasena !== repetida) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEstado('enviando');
    try {
      const correo = email.trim();
      if (modo === 'entrar') {
        await datos.entrarConContrasena(correo, contrasena);
        setEstado('inicio');
      } else if (modo === 'crear') {
        const adentro = await datos.crearCuenta(correo, contrasena);
        setEstado(adentro ? 'inicio' : 'correo');
      } else if (modo === 'olvide') {
        await datos.recuperarContrasena(correo);
        setEstado('correo');
      } else {
        await datos.enviarEnlace(correo);
        setEstado('correo');
      }
    } catch (err) {
      const m = String((err as Error)?.message ?? err);
      setEstado('error');
      setError(
        m === 'ya_registrado'
          ? 'Ese correo ya tiene cuenta. Entrá con tu contraseña o tocá “¿Olvidaste tu contraseña?”.'
          : /invalid login credentials/i.test(m)
            ? 'Correo o contraseña incorrectos. Si hasta ahora entrabas con un enlace, todavía no tenés contraseña: tocá “¿Olvidaste tu contraseña?” para crear una.'
            : /email not confirmed/i.test(m)
              ? 'Todavía no confirmaste tu correo. Buscá el mensaje que te mandamos al crear la cuenta (mirá también en spam).'
              : /password should be at least|weak/i.test(m)
                ? 'La contraseña es muy corta: usá al menos 8 caracteres.'
                : 'No pudimos completar el pedido. Revisá los datos e intentá de nuevo en unos minutos.',
      );
    }
  };

  if (estado === 'correo') {
    const texto =
      modo === 'crear'
        ? 'Te mandamos un correo para confirmar tu dirección. Es solo esta vez: después entrás con tu correo y tu contraseña.'
        : modo === 'olvide'
          ? 'Te mandamos un correo con un enlace para elegir una contraseña nueva.'
          : 'Te mandamos un enlace para entrar. Abrilo desde este mismo dispositivo.';
    return (
      <div className="flex flex-col gap-3 rounded-lg bg-magenta-light p-4 text-magenta">
        <b className="text-lg">Revisá tu correo</b>
        <p className="m-0 text-sm text-ink">
          {texto} Lo mandamos a <b>{email}</b>. Si no llega en unos minutos, mirá la carpeta de spam.
        </p>
        <button className="self-start text-sm font-bold underline" onClick={() => cambiarModo('entrar')}>Volver</button>
      </div>
    );
  }

  const conContrasena = modo === 'entrar' || modo === 'crear';
  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {(modo === 'entrar' || modo === 'crear') && (
        <div className="grid grid-cols-2 rounded-lg bg-white p-1" role="tablist">
          {(['entrar', 'crear'] as const).map((m) => (
            <button
              type="button"
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => cambiarModo(m)}
              className={`rounded-md py-2 text-[12px] font-extrabold uppercase tracking-wider ${modo === m ? 'bg-magenta text-white' : 'text-ink-soft'}`}
            >
              {m === 'entrar' ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </button>
          ))}
        </div>
      )}
      {modo === 'olvide' && (
        <p className="m-0 text-sm text-ink-soft">Escribí tu correo y te mandamos un enlace para elegir una contraseña nueva.</p>
      )}
      {modo === 'enlace' && (
        <p className="m-0 text-sm text-ink-soft">Te mandamos un enlace para entrar sin contraseña. Abrilo desde este mismo dispositivo.</p>
      )}
      <label className={etiqueta}>
        Correo
        <input type="email" required autoComplete="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@organizacion.org" />
      </label>
      {conContrasena && (
        <label className={etiqueta}>
          Contraseña
          <input
            type="password"
            required
            minLength={8}
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
            className={campo}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </label>
      )}
      {modo === 'crear' && (
        <label className={etiqueta}>
          Repetí la contraseña
          <input type="password" required minLength={8} autoComplete="new-password" className={campo} value={repetida} onChange={(e) => setRepetida(e.target.value)} />
          <span className="text-xs font-normal text-ink-soft">Al menos 8 caracteres. La primera vez te llega un correo para confirmar tu dirección.</span>
        </label>
      )}
      {modoEjemplo && <p className="m-0 text-xs text-naranja-dark">En modo ejemplo no se manda ningún correo.</p>}
      {error && <p className="m-0 text-sm text-magenta">{error}</p>}
      <Boton>
        {estado === 'enviando'
          ? 'Un momento…'
          : modo === 'entrar'
            ? 'Entrar'
            : modo === 'crear'
              ? 'Crear cuenta'
              : modo === 'olvide'
                ? 'Mandarme el enlace'
                : 'Mandarme el enlace para entrar'}
      </Boton>
      <div className="flex flex-col items-start gap-1.5 text-sm">
        {modo === 'entrar' && (
          <button type="button" className="font-bold text-magenta underline" onClick={() => cambiarModo('olvide')}>¿Olvidaste tu contraseña? (o todavía no tenés)</button>
        )}
        {modo !== 'enlace' && (
          <button type="button" className="text-ink-soft underline" onClick={() => cambiarModo('enlace')}>Entrar con un enlace por correo, sin contraseña</button>
        )}
        {(modo === 'olvide' || modo === 'enlace') && (
          <button type="button" className="text-ink-soft underline" onClick={() => cambiarModo('entrar')}>Volver a entrar con contraseña</button>
        )}
      </div>
      <p className="m-0 text-xs text-ink-soft">
        Solo guardamos tu correo para que puedas entrar. Nunca se muestra en la app.
      </p>
    </form>
  );
}

/** Crear o cambiar la contraseña (también al volver del correo de recuperación). */
export function NuevaContrasena({ titulo, onListo }: { titulo: string; onListo: (ok: boolean) => void }) {
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (c1 !== c2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await datos.cambiarContrasena(c1);
      setC1('');
      setC2('');
      onListo(true);
    } catch (err) {
      const m = String((err as Error)?.message ?? err);
      setError(/should be different/i.test(m) ? 'Es la misma contraseña que ya tenías.' : 'No se pudo guardar. Probá con otra contraseña de al menos 8 caracteres.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg border border-line p-3.5">
      <b className="text-magenta">{titulo}</b>
      <label className={etiqueta}>
        Contraseña nueva
        <input type="password" required minLength={8} autoComplete="new-password" className={campo} value={c1} onChange={(e) => setC1(e.target.value)} />
      </label>
      <label className={etiqueta}>
        Repetila
        <input type="password" required minLength={8} autoComplete="new-password" className={campo} value={c2} onChange={(e) => setC2(e.target.value)} />
      </label>
      {error && <p className="m-0 text-sm text-magenta">{error}</p>}
      <Boton variante="borde">{guardando ? 'Guardando…' : 'Guardar contraseña'}</Boton>
    </form>
  );
}

function SinOrganizacion({
  email, organizaciones, onPedirUnirme, onCrear, onSalir,
}: {
  email: string; organizaciones: Organizacion[]; onPedirUnirme: (id: string) => Promise<void>;
  onCrear: (o: NuevaOrganizacion) => Promise<void>; onSalir: () => void;
}) {
  const [modo, setModo] = useState<'unirme' | 'nueva'>(organizaciones.length > 0 ? 'unirme' : 'nueva');
  const [elegida, setElegida] = useState('');
  const [enviando, setEnviando] = useState(false);

  const pedir = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await onPedirUnirme(elegida);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-soft">
        Hola, <b className="text-ink">{email}</b>. ¿Tu organización ya está en la red?
      </p>
      <div className="grid grid-cols-2 rounded-lg bg-crema p-1" role="tablist">
        {(['unirme', 'nueva'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`rounded-md px-1 py-2 text-[12px] font-extrabold uppercase tracking-wider ${modo === m ? 'bg-white text-magenta shadow-sm' : 'text-ink-soft'}`}
          >
            {m === 'unirme' ? 'Ya está en la red' : 'Registrar una nueva'}
          </button>
        ))}
      </div>
      {modo === 'unirme' ? (
        <form onSubmit={pedir} className="flex flex-col gap-4">
          <label className={etiqueta}>
            Elegí tu organización
            <select required className={campo} value={elegida} onChange={(e) => setElegida(e.target.value)}>
              <option value="" disabled>Elegí…</option>
              {[...organizaciones].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((o) => (
                <option key={o.id} value={o.id}>{o.nombre} ({o.pais})</option>
              ))}
            </select>
          </label>
          <p className="m-0 text-xs text-ink-soft">
            Le avisamos a la organización: alguien de su equipo (o Akãhatã) confirma que formás parte. Van a ver tu correo.
          </p>
          <Boton>{enviando ? 'Enviando…' : 'Pedir sumarme'}</Boton>
          <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={onSalir}>Salir</button>
        </form>
      ) : (
        <AltaOrganizacion email={email} onCrear={onCrear} onSalir={onSalir} />
      )}
    </div>
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
        Contanos de tu organización (vas a quedar como <b className="text-ink">{email}</b>). El equipo de Akãhatã la
        revisa antes de sumarla a la red.
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
