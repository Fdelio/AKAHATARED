import { useCallback, useEffect, useState } from 'react';
import { BookmarkCheck, CheckCheck, Network, Radar, UserRound } from 'lucide-react';
import type {
  EstadoRevision, NuevaOportunidad, NuevaOrganizacion, Oportunidad, Organizacion, Pantalla, Participacion, Sesion, Visibilidad,
} from './types';
import * as datos from './lib/datos';
import { modoEjemplo } from './lib/supabaseClient';
import RadarView from './components/RadarView';
import OportunidadView from './components/OportunidadView';
import RedView from './components/RedView';
import MiasView from './components/MiasView';
import RevisionView from './components/RevisionView';
import CuentaView from './components/CuentaView';
import CargarView from './components/CargarView';
import { Boton } from './components/ui';

type ItemNav = { id: Pantalla; label: string; Icono: typeof Radar };
const NAV: ItemNav[] = [
  { id: 'radar', label: 'Radar', Icono: Radar },
  { id: 'red', label: 'Red', Icono: Network },
  { id: 'mias', label: 'Me sumé', Icono: BookmarkCheck },
];
const NAV_REVISION: ItemNav = { id: 'revision', label: 'Revisión', Icono: CheckCheck };
const NAV_CUENTA: ItemNav = { id: 'cuenta', label: 'Cuenta', Icono: UserRound };

const TITULOS: Record<Pantalla, [string, string]> = {
  radar: ['Radar de incidencia', 'Oportunidades en todos los temas'],
  red: ['Mapa de la red', 'Organizaciones por país'],
  mias: ['Me sumé', 'Tus oportunidades y resultados'],
  revision: ['Revisión de Akãhatã', 'Organizaciones y oportunidades por aprobar'],
  cuenta: ['Tu cuenta', 'Tu organización en la red'],
  cargar: ['Cargar oportunidad', 'Se suma al radar de incidencia'],
};

const RUTAS: Pantalla[] = ['red', 'mias', 'revision', 'cuenta', 'cargar'];

/** La ruta vive en el hash (#radar, #op-<id>, #red…) para que los links se puedan compartir. */
function leerRuta(): { pantalla: Pantalla; oportunidadId: string | null; editarId: string | null } {
  const h = window.location.hash.slice(1);
  if (h.startsWith('op-')) return { pantalla: 'radar', oportunidadId: h.slice(3), editarId: null };
  if (h.startsWith('editar-')) return { pantalla: 'cargar', oportunidadId: null, editarId: h.slice(7) };
  if ((RUTAS as string[]).includes(h)) return { pantalla: h as Pantalla, oportunidadId: null, editarId: null };
  return { pantalla: 'radar', oportunidadId: null, editarId: null };
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [pendientes, setPendientes] = useState<Oportunidad[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [participaciones, setParticipaciones] = useState<Participacion[]>([]);
  const [orgsPendientes, setOrgsPendientes] = useState<Organizacion[]>([]);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const s = await datos.obtenerSesion();
      const revisora = s?.rol === 'revisora';
      const [ops, pend, orgs, orgsPend, parts] = await Promise.all([
        datos.listarOportunidades('publicada'),
        revisora ? datos.listarOportunidades('pendiente') : [],
        s ? datos.listarOrganizaciones(true) : [],
        revisora ? datos.listarOrganizaciones(false) : [],
        s ? datos.listarParticipaciones() : [],
      ]);
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
  const nav = [...NAV, revisora ? NAV_REVISION : NAV_CUENTA];

  const pedirIngreso = () => {
    setAviso(sesion ? 'Tu organización todavía espera aprobación' : 'Entrá con tu organización para sumarte');
    ir('cuenta');
  };

  const enEdicion = ruta.editarId
    ? [...pendientes, ...oportunidades].find((x) => x.id === ruta.editarId)
    : undefined;

  const guardarOportunidad = async (o: NuevaOportunidad, publicar: boolean) => {
    try {
      if (enEdicion) await datos.actualizarOportunidad(enEdicion.id, o, publicar);
      else await datos.crearOportunidad(o, publicar);
      await cargar();
      setAviso(publicar ? 'Publicada en el radar' : 'Guardada en Revisión');
      ir(publicar ? 'radar' : 'revision');
      return true;
    } catch (e) {
      console.error(e);
      setAviso('No se pudo guardar. Intentá de nuevo.');
      return false;
    }
  };

  const abierta = ruta.oportunidadId ? oportunidades.find((o) => o.id === ruta.oportunidadId) : undefined;
  const [titulo, subtitulo] = abierta
    ? [abierta.mecanismo, abierta.sistema]
    : ruta.editarId
      ? ['Editar oportunidad', 'Revisá el texto antes de publicar']
      : TITULOS[ruta.pantalla];

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-white sm:my-6 sm:min-h-0 sm:rounded-3xl sm:border sm:border-line">
      <header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <img src={import.meta.env.BASE_URL + 'logo-marca.png'} alt="" className="size-9" />
        <b className="text-xl font-extrabold tracking-tight text-magenta">Akãhatã</b>
        <span className="ml-auto text-xs font-bold">Red de incidencia</span>
        {revisora && (
          <button aria-label="Tu cuenta" onClick={() => ir('cuenta')} className="grid size-9 place-items-center rounded-full bg-magenta-light text-magenta">
            <UserRound size={18} />
          </button>
        )}
      </header>
      {modoEjemplo && (
        <div className="bg-naranja-light px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-naranja-dark">
          Modo ejemplo · datos inventados
        </div>
      )}
      <div className="relative isolate flex items-center gap-3 overflow-hidden bg-magenta px-5 pt-5 pb-6 text-white">
        <div className="absolute -bottom-[70px] -left-[60px] -z-10 h-[120px] w-[200px] rounded-full bg-naranja" />
        <div className="absolute -top-[26px] -right-[26px] -z-10 size-24 rounded-full border-2 border-naranja" />
        {abierta && (
          <button aria-label="Volver" onClick={() => ir('radar')} className="grid size-9 flex-none place-items-center rounded-full bg-white text-lg font-extrabold text-magenta">
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
        {abierta ? (
          <OportunidadView
            key={abierta.id}
            o={abierta}
            organizaciones={organizaciones}
            participaciones={participaciones}
            miOrg={miOrg}
            onAviso={setAviso}
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
            onSalir={() => ejecutar(datos.salir, 'Saliste de la app').then(() => ir('radar'))}
          />
        ) : !sesion && (ruta.pantalla === 'red' || ruta.pantalla === 'mias') ? (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-sm text-ink-soft">
              {ruta.pantalla === 'red'
                ? 'El mapa de la red lo ven solo las organizaciones que forman parte, para cuidar a quienes trabajan en contextos de riesgo.'
                : 'Entrá con tu organización para ver las oportunidades a las que te sumaste y registrar resultados.'}
            </p>
            <Boton onClick={() => ir('cuenta')}>Entrar</Boton>
          </div>
        ) : (ruta.pantalla === 'revision' || ruta.pantalla === 'cargar') && !revisora ? (
          <p className="m-0 text-sm text-ink-soft">Esta sección es solo para el equipo de Akãhatã.</p>
        ) : ruta.pantalla === 'cargar' ? (
          ruta.editarId && !enEdicion ? (
            <p className="m-0 text-sm text-ink-soft">Cargando la oportunidad…</p>
          ) : (
            <CargarView key={ruta.editarId ?? 'nueva'} inicial={enEdicion} onGuardar={guardarOportunidad} onCancelar={() => ir('revision')} />
          )
        ) : ruta.pantalla === 'red' ? (
          <RedView organizaciones={organizaciones} />
        ) : ruta.pantalla === 'mias' ? (
          <MiasView
            oportunidades={oportunidades}
            participaciones={participaciones}
            miOrg={miOrg}
            onAbrir={(id) => ir('op-' + id)}
            onGuardar={(id, r) => miOrg && ejecutar(() => datos.guardarResultado(id, miOrg, r), 'Resultado guardado')}
          />
        ) : (
          <RevisionView
            pendientes={pendientes}
            orgsPendientes={orgsPendientes}
            onCargar={() => ir('cargar')}
            onEditar={(id) => ir('editar-' + id)}
            onAprobarOrg={(id, ok) => ejecutar(() => datos.aprobarOrganizacion(id, ok), ok ? 'Organización aprobada' : 'Organización rechazada')}
            onRevisar={(id, estado: EstadoRevision) =>
              ejecutar(() => datos.revisarOportunidad(id, estado), estado === 'publicada' ? 'Publicada en el radar' : 'Descartada')
            }
          />
        )}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Secciones">
        {nav.map(({ id, label, Icono }) => {
          const actual = !abierta && (ruta.pantalla === id || (id === 'revision' && ruta.pantalla === 'cargar'));
          return (
            <button
              key={id}
              onClick={() => ir(id)}
              aria-current={actual ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 border-0 bg-transparent px-1 pt-2.5 pb-3 text-xs ${actual ? 'font-bold text-magenta' : 'text-ink-soft'}`}
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
