import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCheck, MessagesSquare, Network, Newspaper, Radar, UserRound } from 'lucide-react';
import type {
  EstadoRevision, Noticia, NuevaNoticia, NuevaOportunidad, NuevaOrganizacion, NuevoPedido, Oportunidad, Organizacion, Pantalla, Participacion, PedidoApoyo, Sesion,
  SesionOrgano, SolicitudUnion, Visibilidad,
} from './types';
import * as datos from './lib/datos';
import { modoEjemplo } from './lib/supabaseClient';
import RadarView from './components/RadarView';
import OportunidadView from './components/OportunidadView';
import RedView from './components/RedView';
import MiOrganizacionView from './components/MiOrganizacionView';
import RevisionView from './components/RevisionView';
import CuentaView from './components/CuentaView';
import CargarView from './components/CargarView';
import ChatView from './components/ChatView';
import BienvenidaView from './components/BienvenidaView';
import NoticiasView, { NotaView } from './components/NoticiasView';
import NotaForm from './components/NotaForm';
import { Boton } from './components/ui';

type ItemNav = { id: Pantalla; label: string; Icono: typeof Radar };
const NAV: ItemNav[] = [
  { id: 'noticias', label: 'Noticias', Icono: Newspaper },
  { id: 'radar', label: 'Oportunidades', Icono: Radar },
  { id: 'red', label: 'Red', Icono: Network },
  { id: 'chat', label: 'Chat', Icono: MessagesSquare },
  { id: 'mias', label: 'Mi organización', Icono: Building2 },
];

const TITULOS: Record<Pantalla, [string, string]> = {
  noticias: ['Noticias', 'Lo que pasa en los espacios internacionales'],
  radar: ['Oportunidades de participar', 'ONU, OEA y Mercosur, en todos los temas'],
  red: ['La red', 'Organizaciones, en qué trabajan y qué hicieron'],
  chat: ['Chat de la red', 'Para coordinar entre organizaciones'],
  mias: ['Mi organización', 'Nuestro trabajo y pedidos de apoyo'],
  revision: ['Revisión de Akãhatã', 'Lo que espera aprobación'],
  cuenta: ['Tu cuenta', 'Tu organización en la red'],
  cargar: ['Cargar oportunidad', 'Se suma al radar de incidencia'],
};

const RUTAS: Pantalla[] = ['noticias', 'radar', 'red', 'chat', 'mias', 'revision', 'cuenta', 'cargar'];

/** La ruta vive en el hash (#radar, #op-<id>, #red…) para que los links se puedan compartir. */
function leerRuta(): {
  pantalla: Pantalla; oportunidadId: string | null; editarId: string | null; sala?: string; notaId?: string; notaEditar?: string;
} {
  const h = window.location.hash.slice(1);
  if (h.startsWith('nota-')) return { pantalla: 'noticias', oportunidadId: null, editarId: null, notaId: h.slice(5) };
  if (h.startsWith('editar-nota-')) return { pantalla: 'cargar', oportunidadId: null, editarId: null, notaEditar: h.slice(12) };
  if (h === 'nueva-nota') return { pantalla: 'cargar', oportunidadId: null, editarId: null, notaEditar: 'nueva' };
  if (h.startsWith('chat-')) return { pantalla: 'chat', oportunidadId: null, editarId: null, sala: h.slice(5) };
  if (h.startsWith('op-')) return { pantalla: 'radar', oportunidadId: h.slice(3), editarId: null };
  if (h.startsWith('editar-')) return { pantalla: 'cargar', oportunidadId: null, editarId: h.slice(7) };
  if ((RUTAS as string[]).includes(h)) return { pantalla: h as Pantalla, oportunidadId: null, editarId: null };
  return { pantalla: 'noticias', oportunidadId: null, editarId: null };
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [pendientes, setPendientes] = useState<Oportunidad[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [participaciones, setParticipaciones] = useState<Participacion[]>([]);
  const [orgsPendientes, setOrgsPendientes] = useState<Organizacion[]>([]);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [sesiones, setSesiones] = useState<SesionOrgano[]>([]);
  const [pedidos, setPedidos] = useState<PedidoApoyo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudUnion[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Ya se sabe si hay alguien que ingresó (para no mostrar la portada un instante de más). */
  const [listo, setListo] = useState(false);
  /** Mira las oportunidades sin registrarse. Un enlace compartido a una oportunidad entra directo. */
  const [visitante, setVisitante] = useState(() => /^#(op-|nota-|radar$|noticias$)/.test(window.location.hash));
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiasPendientes, setNoticiasPendientes] = useState<Noticia[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const s = await datos.obtenerSesion();
      const revisora = s?.rol === 'revisora';
      const conOrg = !!s?.organizacion?.aprobada;
      const [ops, pend, orgs, orgsPend, parts, cal, peds, sols, pers, nots, notsPend, coms] = await Promise.all([
        datos.listarOportunidades('publicada'),
        revisora ? datos.listarOportunidades('pendiente') : [],
        s ? datos.listarOrganizaciones(true) : [],
        revisora ? datos.listarOrganizaciones(false) : [],
        s ? datos.listarParticipaciones() : [],
        datos.listarSesiones(),
        s ? datos.listarPedidos() : [],
        conOrg || revisora ? datos.listarSolicitudes() : [],
        conOrg ? datos.listarPersonas() : [],
        datos.listarNoticias('publicada'),
        revisora ? datos.listarNoticias('pendiente') : [],
        conOrg || revisora ? datos.contarComentarios() : {},
      ]);
      setNoticias(nots);
      setNoticiasPendientes(notsPend);
      setComentarios(coms);
      setSolicitudes(sols);
      setPersonas(pers);
      setPedidos(peds);
      setSesiones(cal);
      setSesion(s);
      setOportunidades(ops);
      setPendientes(pend);
      setOrganizaciones(orgs);
      setOrgsPendientes(orgsPend);
      setParticipaciones([...parts]);
      setError(null);
    } catch (e) {
      setError('No se pudieron cargar los datos. Revisá tu conexión e intentá de nuevo.');
      console.error(e);
    } finally {
      setListo(true);
    }
  }, []);

  useEffect(() => {
    cargar();
    const alCambiar = () => setRuta(leerRuta());
    window.addEventListener('hashchange', alCambiar);
    const dejarDeEscuchar = datos.alCambiarSesion(cargar);
    return () => {
      window.removeEventListener('hashchange', alCambiar);
      dejarDeEscuchar();
    };
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2400);
    return () => clearTimeout(t);
  }, [aviso]);

  const ir = (hash: string) => {
    window.location.hash = hash;
    window.scrollTo(0, 0);
  };

  const ejecutar = async (accion: () => Promise<void>, mensaje: string) => {
    try {
      await accion();
      await cargar();
      setAviso(mensaje);
    } catch (e) {
      console.error(e);
      setAviso('No se pudo guardar. Intentá de nuevo.');
    }
  };

  /** Solo una organización aprobada puede sumarse a oportunidades. */
  const miOrg = sesion?.organizacion?.aprobada ? sesion.organizacion.id : null;
  const revisora = sesion?.rol === 'revisora';
  const nav = NAV;
  const porRevisar = pendientes.length + orgsPendientes.length + noticiasPendientes.length + solicitudes.length
    + pedidos.filter((p) => p.estado === 'nuevo').length;

  const pedirIngreso = () => {
    setAviso(sesion ? 'Tu organización todavía espera aprobación' : 'Entrá con tu organización para sumarte');
    ir('cuenta');
  };

  const pedirApoyo = (p: NuevoPedido) =>
    miOrg ? ejecutar(() => datos.pedirApoyo(miOrg, p), 'Pedido enviado. Akãhatã se va a contactar.') : Promise.resolve();

  const responder = (perfilId: string, aceptar: boolean) =>
    ejecutar(() => datos.responderSolicitud(perfilId, aceptar), aceptar ? 'Persona aceptada' : 'Pedido rechazado');

  const enEdicion = ruta.editarId
    ? [...pendientes, ...oportunidades].find((x) => x.id === ruta.editarId)
    : undefined;

  const guardarOportunidad = async (o: NuevaOportunidad, publicar: boolean) => {
    try {
      if (enEdicion) await datos.actualizarOportunidad(enEdicion.id, o, publicar);
      else await datos.crearOportunidad(o, publicar);
      await cargar();
      setAviso(publicar ? 'Publicada en el radar' : 'Guardada en Revisión');
      ir(enEdicion && publicar ? 'op-' + enEdicion.id : publicar ? 'radar' : 'revision');
      return true;
    } catch (e) {
      console.error(e);
      setAviso('No se pudo guardar. Intentá de nuevo.');
      return false;
    }
  };

  const notaEnEdicion = ruta.notaEditar && ruta.notaEditar !== 'nueva'
    ? [...noticiasPendientes, ...noticias].find((x) => x.id === ruta.notaEditar)
    : undefined;

  const guardarNota = async (n: NuevaNoticia, publicar: boolean) => {
    try {
      if (notaEnEdicion) await datos.actualizarNoticia(notaEnEdicion.id, n, publicar ? 'publicada' : 'pendiente');
      else await datos.crearNoticia(n, publicar);
      await cargar();
      setAviso(publicar ? 'Publicada en Noticias' : 'Guardada en Revisión');
      ir(notaEnEdicion && publicar ? 'nota-' + notaEnEdicion.id : publicar ? 'noticias' : 'revision');
      return true;
    } catch (e) {
      console.error(e);
      setAviso('No se pudo guardar. Intentá de nuevo.');
      return false;
    }
  };

  const notaAbierta = ruta.notaId ? [...noticias, ...noticiasPendientes].find((n) => n.id === ruta.notaId) : undefined;
  const abierta = ruta.oportunidadId ? oportunidades.find((o) => o.id === ruta.oportunidadId) : undefined;
  const [titulo, subtitulo] = abierta
    ? [abierta.mecanismo, abierta.sistema]
    : notaAbierta
      ? ['Noticias', notaAbierta.fuente_nombre]
      : ruta.notaEditar
        ? [ruta.notaEditar === 'nueva' ? 'Escribir una nota' : 'Editar noticia', 'Revisá el texto antes de publicar']
    : ruta.editarId
      ? ['Editar oportunidad', 'Revisá el texto antes de publicar']
      : TITULOS[ruta.pantalla];

  if (!listo) return <div className="min-h-screen bg-white" aria-busy="true" />;

  // Quien no ingresó ve la portada con el ingreso. (#bienvenida la muestra igual, para revisarla.)
  if ((!sesion && !visitante) || window.location.hash === '#bienvenida') {
    return (
      <BienvenidaView
        modoEjemplo={modoEjemplo}
        onEnviarEnlace={datos.enviarEnlace}
        onVerOportunidades={() => {
          setVisitante(true);
          ir('noticias');
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-white sm:my-6 sm:min-h-0 sm:rounded-3xl sm:border sm:border-line">
      <header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <img src={import.meta.env.BASE_URL + 'logo-marca.png'} alt="" className="size-9" />
        <b className="text-xl font-extrabold tracking-tight text-magenta">Akãhatã</b>
        <span className="ml-auto text-right text-[10px] font-bold leading-tight whitespace-nowrap">Radar de Incidencia<br />Internacional</span>
        {revisora && (
          <button aria-label="Revisión" onClick={() => ir('revision')} className="relative grid size-9 flex-none place-items-center rounded-full bg-magenta-light text-magenta">
            <CheckCheck size={18} />
            {porRevisar > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-naranja px-1 text-[10px] font-extrabold text-white">
                {porRevisar > 99 ? '99+' : porRevisar}
              </span>
            )}
          </button>
        )}
        <button aria-label="Tu cuenta" onClick={() => ir('cuenta')} className="grid size-9 flex-none place-items-center rounded-full bg-magenta-light text-magenta">
          <UserRound size={18} />
        </button>
      </header>
      {modoEjemplo && (
        <div className="bg-naranja-light px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">
          Modo ejemplo · datos inventados
        </div>
      )}
      <div className="relative isolate flex items-center gap-3 overflow-hidden bg-magenta px-5 pt-5 pb-6 text-white">
        <div className="absolute -bottom-[70px] -left-[60px] -z-10 h-[120px] w-[200px] rounded-full bg-naranja" />
        <div className="absolute -top-[26px] -right-[26px] -z-10 size-24 rounded-full border-2 border-naranja" />
        {(abierta || notaAbierta) && (
          <button aria-label="Volver" onClick={() => ir(abierta ? 'radar' : 'noticias')} className="grid size-9 flex-none place-items-center rounded-full bg-white text-lg font-extrabold text-magenta">
            ←
          </button>
        )}
        <div>
          <h1 className="m-0 text-2xl font-black leading-tight">{titulo}</h1>
          <div className="text-[13px] font-semibold text-magenta-light">{subtitulo}</div>
        </div>
      </div>

      <main className="flex-1 px-5 pt-4 pb-6">
        {error && <p className="rounded bg-magenta-light p-3 text-sm text-magenta">{error}</p>}
        {notaAbierta ? (
          <NotaView
            key={notaAbierta.id}
            n={notaAbierta}
            organizaciones={
              sesion?.organizacion && !organizaciones.some((o) => o.id === sesion.organizacion!.id)
                ? [...organizaciones, sesion.organizacion]
                : organizaciones
            }
            miOrg={miOrg}
            usuariaId={sesion?.id ?? null}
            revisora={revisora}
            onEditar={revisora ? () => ir('editar-nota-' + notaAbierta.id) : undefined}
            onIngresar={() => ir('cuenta')}
            onAviso={setAviso}
          />
        ) : ruta.pantalla === 'noticias' ? (
          <NoticiasView noticias={noticias} comentarios={comentarios} onAbrir={(id) => ir('nota-' + id)} />
        ) : abierta ? (
          <OportunidadView
            key={abierta.id}
            o={abierta}
            organizaciones={organizaciones}
            participaciones={participaciones}
            miOrg={miOrg}
            email={sesion?.email ?? ''}
            onPedirApoyo={miOrg ? pedirApoyo : null}
            onSinOrganizacion={pedirIngreso}
            onConversar={() => ir('chat-' + abierta.id)}
            onEditar={revisora ? () => ir('editar-' + abierta.id) : undefined}
            onSumarse={(v: Visibilidad) =>
              miOrg ? ejecutar(() => datos.sumarse(abierta.id, miOrg, v), 'Te sumaste. Te avisamos antes del plazo.') : pedirIngreso()
            }
            onSalirse={() => miOrg && ejecutar(() => datos.salirse(abierta.id, miOrg), 'Saliste de esta oportunidad')}
          />
        ) : ruta.pantalla === 'radar' ? (
          <RadarView
            oportunidades={oportunidades}
            organizaciones={organizaciones}
            participaciones={participaciones}
            miOrg={miOrg}
            sesiones={sesiones}
            onAbrir={(id) => ir('op-' + id)}
          />
        ) : ruta.pantalla === 'cuenta' ? (
          <CuentaView
            sesion={sesion}
            modoEjemplo={modoEjemplo}
            onEnviarEnlace={datos.enviarEnlace}
            onCrearOrganizacion={(org: NuevaOrganizacion) =>
              ejecutar(() => datos.crearMiOrganizacion(org), 'Enviada. Akãhatã la va a revisar.')
            }
            organizaciones={organizaciones}
            onPedirUnirme={(id) => ejecutar(() => datos.pedirUnirme(id), 'Pedido enviado. Te avisamos cuando te acepten.')}
            onCancelarSolicitud={() => ejecutar(datos.cancelarSolicitud, 'Pedido cancelado')}
            onSalir={() => ejecutar(datos.salir, 'Saliste de la app').then(() => ir('radar'))}
          />
        ) : !sesion && (ruta.pantalla === 'red' || ruta.pantalla === 'mias' || ruta.pantalla === 'chat') ? (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-sm text-ink-soft">
              {ruta.pantalla === 'chat'
                ? 'El chat es solo para las organizaciones de la red y el equipo de Akãhatã.'
                : ruta.pantalla === 'red'
                ? 'El mapa de la red lo ven solo las organizaciones que forman parte, para cuidar a quienes trabajan en contextos de riesgo.'
                : 'Entrá con tu organización para registrar su trabajo y pedir apoyo a Akãhatã.'}
            </p>
            <Boton onClick={() => ir('cuenta')}>Entrar</Boton>
          </div>
        ) : (ruta.pantalla === 'revision' || ruta.pantalla === 'cargar') && !revisora ? (
          <p className="m-0 text-sm text-ink-soft">Esta sección es solo para el equipo de Akãhatã.</p>
        ) : ruta.pantalla === 'cargar' && ruta.notaEditar ? (
          ruta.notaEditar !== 'nueva' && !notaEnEdicion ? (
            <p className="m-0 text-sm text-ink-soft">Cargando la noticia…</p>
          ) : (
            <NotaForm key={ruta.notaEditar} inicial={notaEnEdicion} onGuardar={guardarNota} onCancelar={() => ir(notaEnEdicion?.estado === 'publicada' ? 'nota-' + notaEnEdicion.id : 'revision')} />
          )
        ) : ruta.pantalla === 'cargar' ? (
          ruta.editarId && !enEdicion ? (
            <p className="m-0 text-sm text-ink-soft">Cargando la oportunidad…</p>
          ) : (
            <CargarView key={ruta.editarId ?? 'nueva'} inicial={enEdicion} onGuardar={guardarOportunidad} onCancelar={() => ir(enEdicion?.estado === 'publicada' ? 'op-' + enEdicion.id : 'revision')} />
          )
        ) : ruta.pantalla === 'chat' ? (
          <ChatView
            sala={ruta.sala ?? null}
            oportunidades={oportunidades}
            organizaciones={
              sesion?.organizacion && !organizaciones.some((o) => o.id === sesion.organizacion!.id)
                ? [...organizaciones, sesion.organizacion]
                : organizaciones
            }
            miOrg={miOrg}
            usuariaId={sesion!.id}
            revisora={revisora}
            onCambiarSala={(s) => ir(s ? 'chat-' + s : 'chat')}
            onAviso={setAviso}
          />
        ) : ruta.pantalla === 'red' ? (
          <RedView
            organizaciones={organizaciones}
            participaciones={participaciones}
            oportunidades={oportunidades}
            miOrg={miOrg}
            revisora={revisora}
            onAbrir={(id) => ir('op-' + id)}
            onPedirApoyo={() => ir('mias')}
          />
        ) : ruta.pantalla === 'mias' ? (
          <MiOrganizacionView
            sesion={sesion!}
            oportunidades={oportunidades}
            participaciones={participaciones}
            pedidos={pedidos.filter((p) => p.organizacion_id === sesion?.organizacion?.id)}
            onAbrir={(id) => ir('op-' + id)}
            onIrACuenta={() => ir('cuenta')}
            onGuardar={(id, t) => miOrg && ejecutar(() => datos.guardarTrabajo(id, miOrg, t), 'Guardado')}
            onPedirApoyo={pedirApoyo}
            personas={personas}
            solicitudes={solicitudes.filter((x) => x.organizacion_id === sesion?.organizacion?.id)}
            onResponder={responder}
          />
        ) : (
          <RevisionView
            pendientes={pendientes}
            orgsPendientes={orgsPendientes}
            pedidos={pedidos}
            noticiasPendientes={noticiasPendientes}
            onNuevaNota={() => ir('nueva-nota')}
            onEditarNota={(id) => ir('editar-nota-' + id)}
            onRevisarNota={(id, estado) =>
              ejecutar(() => datos.actualizarNoticia(id, {}, estado), estado === 'publicada' ? 'Publicada en Noticias' : 'Descartada')
            }
            solicitudes={solicitudes}
            onResponder={responder}
            organizaciones={organizaciones}
            oportunidades={oportunidades}
            onPedido={(id, estado) => ejecutar(() => datos.actualizarPedido(id, estado), estado === 'cerrado' ? 'Pedido cerrado' : 'Pedido en curso')}
            onCargar={() => ir('cargar')}
            onEditar={(id) => ir('editar-' + id)}
            onAprobarOrg={(id, ok) => ejecutar(() => datos.aprobarOrganizacion(id, ok), ok ? 'Organización aprobada' : 'Organización rechazada')}
            onRevisar={(id, estado: EstadoRevision) =>
              ejecutar(() => datos.revisarOportunidad(id, estado), estado === 'publicada' ? 'Publicada en el radar' : 'Descartada')
            }
          />
        )}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Secciones">
        {nav.map(({ id, label, Icono }) => {
          const actual = abierta ? id === 'radar' : ruta.pantalla === id;
          return (
            <button
              key={id}
              onClick={() => ir(id)}
              aria-current={actual ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 border-0 bg-transparent px-0 pt-2.5 pb-3 text-[10px] leading-tight ${actual ? 'font-bold text-magenta' : 'text-ink-soft'}`}
            >
              <Icono size={22} />
              {label}
            </button>
          );
        })}
      </nav>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-sm text-white transition-opacity ${aviso ? 'opacity-100' : 'opacity-0'}`}
      >
        {aviso}
      </div>
    </div>
  );
}
