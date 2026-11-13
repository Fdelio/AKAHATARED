import { useCallback, useEffect, useState } from 'react';
import { BookmarkCheck, CheckCheck, Network, Radar } from 'lucide-react';
import type { EstadoRevision, Oportunidad, Organizacion, Pantalla, Participacion, Visibilidad } from './types';
import * as datos from './lib/datos';
import { modoEjemplo } from './lib/supabaseClient';
import RadarView from './components/RadarView';
import OportunidadView from './components/OportunidadView';
import RedView from './components/RedView';
import MiasView from './components/MiasView';
import RevisionView from './components/RevisionView';

const NAV: { id: Pantalla; label: string; Icono: typeof Radar }[] = [
  { id: 'radar', label: 'Radar', Icono: Radar },
  { id: 'red', label: 'Red', Icono: Network },
  { id: 'mias', label: 'Me sumé', Icono: BookmarkCheck },
  { id: 'revision', label: 'Revisión', Icono: CheckCheck },
];

const TITULOS: Record<Pantalla, [string, string]> = {
  radar: ['Radar de incidencia', 'Oportunidades en todos los temas'],
  red: ['Mapa de la red', 'Organizaciones por país'],
  mias: ['Me sumé', 'Tus oportunidades y resultados'],
  revision: ['Revisión de Akãhatã', 'Recolectado automáticamente, falta aprobar'],
};

/** La ruta vive en el hash (#radar, #op-<id>, #red…) para que los links se puedan compartir. */
function leerRuta(): { pantalla: Pantalla; oportunidadId: string | null } {
  const h = window.location.hash.slice(1);
  if (h.startsWith('op-')) return { pantalla: 'radar', oportunidadId: h.slice(3) };
  if (h === 'red' || h === 'mias' || h === 'revision') return { pantalla: h, oportunidadId: null };
  return { pantalla: 'radar', oportunidadId: null };
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [pendientes, setPendientes] = useState<Oportunidad[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [participaciones, setParticipaciones] = useState<Participacion[]>([]);
  const [miOrg, setMiOrg] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [ops, pend, orgs, parts, mia] = await Promise.all([
        datos.listarOportunidades('publicada'),
        datos.listarOportunidades('pendiente'),
        datos.listarOrganizaciones(),
        datos.listarParticipaciones(),
        datos.miOrganizacionId(),
      ]);
      setOportunidades(ops);
      setPendientes(pend);
      setOrganizaciones(orgs);
      setParticipaciones([...parts]);
      setMiOrg(mia);
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
    return () => window.removeEventListener('hashchange', alCambiar);
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

  const abierta = ruta.oportunidadId ? oportunidades.find((o) => o.id === ruta.oportunidadId) : undefined;
  const [titulo, subtitulo] = abierta ? [abierta.mecanismo, abierta.sistema] : TITULOS[ruta.pantalla];

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-white sm:my-6 sm:min-h-0 sm:rounded-3xl sm:border sm:border-line">
      <header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <img src="/logo-marca.png" alt="" className="size-9" />
        <b className="text-xl font-extrabold tracking-tight text-magenta">Akãhatã</b>
        <span className="ml-auto text-xs font-bold">Red de incidencia</span>
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
              miOrg && ejecutar(() => datos.sumarse(abierta.id, miOrg, v), 'Te sumaste. Te avisamos antes del plazo.')
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
            onAviso={setAviso}
            onRevisar={(id, estado: EstadoRevision) =>
              ejecutar(() => datos.revisarOportunidad(id, estado), estado === 'publicada' ? 'Publicada en el radar' : 'Descartada')
            }
          />
        )}
      </main>

      <nav className="sticky bottom-0 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Secciones">
        {NAV.map(({ id, label, Icono }) => {
          const actual = !abierta && ruta.pantalla === id;
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
