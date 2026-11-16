import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { NuevaOrganizacion, Organizacion, Perfil, Sesion } from '../types';
import { Boton, Iniciales } from './ui';
import { Avatar } from './RedView';
import * as datos from '../lib/datos';

const TEMAS = [
  'Personas LGBTI+', 'Derechos sexuales y reproductivos', 'Identidad de género', 'Violencia de género',
  'Ambiente y clima', 'Desarrollo y derechos sociales', 'Empresas y economía', 'Migración', 'Salud', 'Educación',
];

export const campo =
  'w-full rounded border-2 border-line bg-tarjeta px-3 py-2.5 text-[15px] text-ink focus:border-rosa focus:outline-none';
export const etiqueta = 'flex flex-col gap-1 text-[13px] font-bold text-ink';

/** Campo de contraseña con un ojito para mostrar u ocultar lo que se escribe. */
function CampoContrasena({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input
        type={visible ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`${campo} pr-11`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft hover:text-rosa focus:text-rosa focus:outline-none"
      >
        {visible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
      </button>
    </span>
  );
}

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
  /** La persona borró su cuenta. */
  onDadaDeBaja: () => void;
}

export default function CuentaView({
  sesion, modoEjemplo, onCrearOrganizacion, organizaciones, onPedirUnirme, onCancelarSolicitud, onSalir, onRecargar, onDadaDeBaja,
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
        <DarmeDeBaja tieneOrganizacion={false} onListo={onDadaDeBaja} />
      </div>
    );
  }
  if (!sesion.organizacion) {
    return (
      <div className="flex flex-col gap-6">
        <SinOrganizacion
          email={sesion.email}
          organizaciones={organizaciones}
          onPedirUnirme={onPedirUnirme}
          onCrear={onCrearOrganizacion}
          onSalir={onSalir}
        />
        <DarmeDeBaja tieneOrganizacion={false} onListo={onDadaDeBaja} />
      </div>
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
      <div className="flex flex-col gap-3 rounded-lg border border-line p-3.5">
        <div className="flex items-center gap-3">
          <Iniciales org={org} grande />
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">Tu organización</div>
            <b className="block text-lg leading-tight text-rosa">{org.nombre}</b>
            <span className="text-sm text-ink-soft">{org.pais}{org.temas.length > 0 && ' · ' + org.temas.join(', ')}</span>
          </div>
        </div>
        <CambiarImagen
          tiene={!!org.logo_en}
          textoSubir="Subir el logo de la organización"
          textoCambiar="Cambiar el logo"
          textoBorrar="Sacar el logo"
          ayuda="Opcional. Lo ven las organizaciones de la red. Lo puede cambiar cualquier persona de tu organización."
          onCambiar={(a) => datos.cambiarLogo(org.id, a)}
          onListo={onRecargar}
        />
      </div>
      <TuPerfil perfil={sesion.perfil} perfilId={sesion.id} fotoEn={sesion.foto_en} aprobada={org.aprobada} onGuardado={onRecargar} />
      <div className="text-sm text-ink-soft">
        Ingresaste como <b className="text-ink">{sesion.email}</b>
        {sesion.rol === 'revisora' && ' (equipo de Akãhatã)'}. Tu correo no se muestra a nadie.
      </div>
      <CambiarContrasena />
      {sesion.rol === 'revisora' && <EquipoAkahata />}
      {!modoEjemplo && <Boton variante="borde" onClick={onSalir}>Salir</Boton>}
      <DarmeDeBaja tieneOrganizacion onListo={onDadaDeBaja} />
    </div>
  );
}

/** Borrar la cuenta. Es de verdad: no queda el correo ni el perfil. */
function DarmeDeBaja({ tieneOrganizacion, onListo }: { tieneOrganizacion: boolean; onListo: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [borrarLoQueEscribi, setBorrarLoQueEscribi] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [estado, setEstado] = useState<'' | 'borrando' | 'error' | 'ultima'>('');

  if (!abierto)
    return (
      <button type="button" className="self-start text-sm text-ink-soft underline" onClick={() => setAbierto(true)}>
        Darme de baja y borrar mi cuenta
      </button>
    );

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('borrando');
    try {
      await datos.darmeDeBaja(borrarLoQueEscribi);
      onListo();
    } catch (err) {
      setEstado(/ultima_revisora/.test(String((err as Error)?.message ?? err)) ? 'ultima' : 'error');
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg border-2 border-rosa/40 p-3.5">
      <b className="text-rosa">Darme de baja</b>
      <p className="m-0 text-sm text-ink">
        Se borra tu cuenta de la app: tu correo, tu contraseña, tu perfil y tus mensajes privados. No te vamos a mandar
        más correos. No se puede deshacer: si querés volver, creás una cuenta nueva.
      </p>
      {tieneOrganizacion && (
        <p className="m-0 text-sm text-ink-soft">
          Tu organización sigue en la red con el resto de su equipo. Lo que escribiste en el chat y en los comentarios
          está firmado por la organización y queda sin tu nombre.
        </p>
      )}
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input type="checkbox" className="mt-1 size-4 accent-rosa" checked={borrarLoQueEscribi} onChange={(e) => setBorrarLoQueEscribi(e.target.checked)} />
        <span>Borrar también todo lo que escribí en el chat y en los comentarios de noticias.</span>
      </label>
      <label className={etiqueta}>
        Para confirmar, escribí BORRAR
        <input className={campo} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} autoComplete="off" />
      </label>
      {estado === 'ultima' && (
        <p className="m-0 text-sm text-rosa">
          Sos la única persona del equipo de Akãhatã que puede revisar. Antes de darte de baja, sumá a otra persona al
          equipo.
        </p>
      )}
      {estado === 'error' && <p className="m-0 text-sm text-rosa">No se pudo borrar la cuenta. Intentá de nuevo.</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={confirmacion.trim().toUpperCase() !== 'BORRAR' || estado === 'borrando'}
          className="rounded bg-magenta px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-wider text-white disabled:opacity-40"
        >
          {estado === 'borrando' ? 'Borrando…' : 'Borrar mi cuenta'}
        </button>
        <button type="button" className="text-sm font-bold text-ink-soft underline" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Solo para el equipo de Akãhatã: sumar personas con el mismo rol (revisar, publicar noticias y oportunidades). */
function EquipoAkahata() {
  const [equipo, setEquipo] = useState<{ email: string; activa: boolean }[] | null>(null);
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'' | 'guardando' | 'listo' | 'error'>('');

  const cargar = () => datos.equipoAkahata().then(setEquipo).catch(() => setEquipo([]));
  useEffect(() => {
    cargar();
  }, []);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('guardando');
    try {
      await datos.sumarRevisora(email.trim());
      setEmail('');
      setEstado('listo');
      cargar();
    } catch {
      setEstado('error');
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg border border-line p-3.5">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">Equipo de Akãhatã</div>
        <p className="m-0 mt-1 text-sm text-ink-soft">
          Estas personas pueden cargar noticias y oportunidades y aprobar lo que está en Revisión.
        </p>
      </div>
      {equipo && equipo.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
          {equipo.map((p) => (
            <li key={p.email}>
              {p.email}
              {!p.activa && <span className="text-ink-soft"> · todavía no creó su cuenta</span>}
            </li>
          ))}
        </ul>
      )}
      <label className={etiqueta}>
        Sumar a alguien por su correo
        <input type="email" required className={campo} value={email} onChange={(e) => { setEmail(e.target.value); setEstado(''); }} placeholder="nombre@akahataorg.org" />
        <span className="text-xs font-normal text-ink-soft">
          Si ya tiene cuenta, el rol es inmediato. Si no, lo recibe cuando cree su cuenta con ese correo y lo confirme.
        </span>
      </label>
      {estado === 'listo' && <p className="m-0 text-sm font-bold text-rosa">Listo, la sumamos al equipo.</p>}
      {estado === 'error' && <p className="m-0 text-sm text-rosa">No se pudo sumar. Revisá el correo.</p>}
      <Boton variante="borde">{estado === 'guardando' ? 'Sumando…' : 'Sumar al equipo'}</Boton>
    </form>
  );
}

/** Datos personales opcionales. Cada persona elige si aparece en la red y si se le puede escribir. */
function TuPerfil({
  perfil, perfilId, fotoEn, aprobada, onGuardado,
}: { perfil: Perfil; perfilId: string; fotoEn: string | null; aprobada: boolean; onGuardado: () => void }) {
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
      <div className="flex items-center gap-3">
        <Avatar nombre={p.nombre_visible || '·'} perfilId={perfilId} foto_en={fotoEn} />
        <CambiarImagen
          tiene={!!fotoEn}
          textoSubir="Subir una foto"
          textoCambiar="Cambiar la foto"
          textoBorrar="Sacar la foto"
          ayuda="Opcional. Puede ser una foto tuya, un dibujo o lo que quieras. La ven solo las organizaciones de la red, y solo si elegís aparecer en la red."
          onCambiar={datos.cambiarMiFoto}
          onListo={onGuardado}
        />
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
        <input type="checkbox" className="mt-1 size-4 accent-rosa" checked={p.visible_en_red} onChange={(e) => cambiar('visible_en_red', e.target.checked)} />
        <span><b>Aparecer en la red.</b> Tu nombre, lo que hacés y tu organización se ven solo para organizaciones aprobadas.</span>
      </label>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input type="checkbox" className="mt-1 size-4 accent-rosa" checked={p.acepta_mensajes} onChange={(e) => cambiar('acepta_mensajes', e.target.checked)} />
        <span><b>Recibir mensajes privados</b> dentro de la app. Nadie ve tu correo.</span>
      </label>
      {!aprobada && p.visible_en_red && (
        <p className="m-0 text-xs text-naranja-dark">Vas a aparecer cuando Akãhatã apruebe tu organización.</p>
      )}
      {estado === 'listo' && <p className="m-0 text-sm font-bold text-rosa">Listo, guardamos tu perfil.</p>}
      {estado === 'error' && <p className="m-0 text-sm text-rosa">No se pudo guardar. Intentá de nuevo.</p>}
      <Boton variante="borde">{estado === 'guardando' ? 'Guardando…' : 'Guardar perfil'}</Boton>
    </form>
  );
}

/** Subir, cambiar o sacar una imagen (foto de perfil o logo). */
function CambiarImagen({
  tiene, textoSubir, textoCambiar, textoBorrar, ayuda, onCambiar, onListo,
}: {
  tiene: boolean; textoSubir: string; textoCambiar: string; textoBorrar: string; ayuda: string;
  onCambiar: (archivo: File | null) => Promise<void>; onListo: () => void;
}) {
  const [estado, setEstado] = useState<'' | 'subiendo' | 'error'>('');
  const cambiar = async (archivo: File | null) => {
    setEstado('subiendo');
    try {
      await onCambiar(archivo);
      setEstado('');
      onListo();
    } catch (err) {
      console.error(err);
      setEstado('error');
    }
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <label className="cursor-pointer text-sm font-bold text-rosa underline">
          {estado === 'subiendo' ? 'Guardando…' : tiene ? textoCambiar : textoSubir}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={estado === 'subiendo'}
            onChange={(e) => {
              const a = e.target.files?.[0];
              e.target.value = '';
              if (a) cambiar(a);
            }}
          />
        </label>
        {tiene && estado !== 'subiendo' && (
          <button type="button" className="text-sm text-ink-soft underline" onClick={() => cambiar(null)}>{textoBorrar}</button>
        )}
      </div>
      <span className="text-xs text-ink-soft">{ayuda}</span>
      {estado === 'error' && <span className="text-xs text-rosa">No se pudo guardar la imagen. Probá con otra.</span>}
    </div>
  );
}

function CambiarContrasena() {
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);
  if (listo) return <p className="m-0 text-sm font-bold text-rosa">Guardamos tu contraseña. La próxima vez entrá con tu correo y esa contraseña.</p>;
  if (!abierto)
    return (
      <button type="button" className="self-start text-sm font-bold text-rosa underline" onClick={() => setAbierto(true)}>
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
      <div className="flex flex-col gap-3 rounded-lg bg-magenta-light p-4 text-rosa">
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
        <div className="grid grid-cols-2 rounded-lg bg-tarjeta p-1" role="tablist">
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
          <CampoContrasena
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
            value={contrasena}
            onChange={setContrasena}
          />
        </label>
      )}
      {modo === 'crear' && (
        <label className={etiqueta}>
          Repetí la contraseña
          <CampoContrasena autoComplete="new-password" value={repetida} onChange={setRepetida} />
          <span className="text-xs font-normal text-ink-soft">Al menos 8 caracteres. La primera vez te llega un correo para confirmar tu dirección.</span>
        </label>
      )}
      {modoEjemplo && <p className="m-0 text-xs text-naranja-dark">En modo ejemplo no se manda ningún correo.</p>}
      {error && <p className="m-0 text-sm text-rosa">{error}</p>}
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
          <button type="button" className="font-bold text-rosa underline" onClick={() => cambiarModo('olvide')}>¿Olvidaste tu contraseña? (o todavía no tenés)</button>
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
      <b className="text-rosa">{titulo}</b>
      <label className={etiqueta}>
        Contraseña nueva
        <CampoContrasena autoComplete="new-password" value={c1} onChange={setC1} />
      </label>
      <label className={etiqueta}>
        Repetila
        <CampoContrasena autoComplete="new-password" value={c2} onChange={setC2} />
      </label>
      {error && <p className="m-0 text-sm text-rosa">{error}</p>}
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
      <div className="grid grid-cols-2 rounded-lg bg-panel p-1" role="tablist">
        {(['unirme', 'nueva'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`rounded-md px-1 py-2 text-[12px] font-extrabold uppercase tracking-wider ${modo === m ? 'bg-magenta text-white shadow-sm' : 'text-ink-soft'}`}
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
                className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${activo ? 'border-rosa bg-magenta text-white' : 'border-line text-ink-soft'}`}
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
