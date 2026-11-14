import { CalendarDays, MessagesSquare, Network, Newspaper, PenLine } from 'lucide-react';
import { Ingreso } from './CuentaView';

interface Props {
  modoEjemplo: boolean;
  onVerOportunidades: () => void;
}

const QUE_HAY = [
  {
    Icono: Newspaper,
    titulo: 'Noticias',
    texto: 'Lo que pasa en la ONU, la OEA y el Mercosur, de distintas fuentes y elegido por Akãhatã, con un foro para conversar cada noticia.',
  },
  {
    Icono: CalendarDays,
    titulo: 'Oportunidades de participar',
    texto: 'Convocatorias abiertas de la ONU, la OEA y el Mercosur, explicadas en lenguaje simple, y el calendario de sesiones del Consejo de Derechos Humanos, el EPU, la CSW y la Asamblea General de la OEA.',
  },
  {
    Icono: Network,
    titulo: 'La red',
    texto: 'Organizaciones de América Latina, en qué están trabajando y qué informes y contribuciones enviaron. Cada organización decide qué muestra.',
  },
  {
    Icono: PenLine,
    titulo: 'Apoyo de Akãhatã',
    texto: 'Acompañamiento para redactar informes sombra, contribuciones y reportes.',
  },
  {
    Icono: MessagesSquare,
    titulo: 'Chat de la red',
    texto: 'Para coordinar informes conjuntos y acciones con otras organizaciones.',
  },
];

const PASOS = [
  'Creá tu cuenta con tu correo y una contraseña (la primera vez confirmás el correo).',
  'Registrá tu organización, o sumate a la tuya si ya está en la red.',
  'El equipo de Akãhatã la aprueba y ya podés participar.',
];

/** Portada para quien todavía no ingresó: qué es la app y cómo entrar. */
export default function BienvenidaView({ modoEjemplo, onVerOportunidades }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-white sm:my-6 sm:min-h-0 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-line">
      <section className="relative isolate overflow-hidden bg-magenta px-6 pt-8 pb-12 text-white">
        <div className="absolute -bottom-[120px] -left-[90px] -z-10 h-[160px] w-[240px] rounded-full bg-naranja" />
        <div className="absolute -top-[40px] -right-[40px] -z-10 size-36 rounded-full border-2 border-naranja" />
        <div className="flex items-center gap-2.5">
          <img src={import.meta.env.BASE_URL + 'logo-marca.png'} alt="" className="size-10 rounded-full bg-white" />
          <b className="text-xl font-extrabold tracking-tight">Akãhatã</b>
        </div>
        <h1 className="mt-6 mb-3 text-[32px] font-black leading-[1.05]">Radar de Incidencia Internacional</h1>
        <p className="m-0 text-[15px] font-semibold leading-snug text-magenta-light">
          Para que las organizaciones de América Latina lleven sus agendas a la ONU, la OEA y el Mercosur, en todos los
          temas, y no vayan solas.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button
            onClick={() => document.getElementById('entrar')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded bg-white px-5 py-3 text-[13px] font-extrabold uppercase tracking-widest text-magenta"
          >
            Entrar
          </button>
          <button
            onClick={onVerOportunidades}
            className="rounded border-2 border-white px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-white"
          >
            Ver noticias y oportunidades
          </button>
        </div>
      </section>

      <main className="flex flex-col gap-6 px-6 pt-6 pb-8">
        <div className="rounded-lg border-2 border-naranja px-4 py-3 text-sm">
          <b className="text-naranja-dark">Tu agenda también cabe en otros espacios.</b> Ambiente, desarrollo, economía
          o migración se discuten en estos mecanismos. Una mirada feminista y de diversidad cambia esos debates.
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Qué encontrás</h2>
          {QUE_HAY.map(({ Icono, titulo, texto }) => (
            <div key={titulo} className="flex gap-3">
              <div className="grid size-10 flex-none place-items-center rounded-full bg-magenta-light text-magenta">
                <Icono size={20} />
              </div>
              <div>
                <b className="block text-magenta">{titulo}</b>
                <span className="text-sm text-ink-soft">{texto}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-[13px] font-extrabold uppercase tracking-wider text-naranja-dark">Cómo entrar</h2>
          <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-sm marker:font-extrabold marker:text-naranja">
            {PASOS.map((p) => <li key={p}>{p}</li>)}
          </ol>
        </section>

        <section id="entrar" className="flex flex-col gap-3 rounded-lg bg-crema p-4">
          <h2 className="m-0 text-lg font-black text-magenta">Entrar</h2>
          <Ingreso modoEjemplo={modoEjemplo} />
        </section>

        <button className="self-center text-sm font-bold text-magenta underline" onClick={onVerOportunidades}>
          Ver noticias y oportunidades sin registrarme
        </button>

        <p className="m-0 -mt-2 text-center text-xs text-ink-soft">
          Una iniciativa de{' '}
          <a className="font-bold text-magenta" href="https://www.akahataorg.org" target="_blank" rel="noreferrer">Akãhatã</a>.
          Pedimos pocos datos y cada organización elige qué es público.
        </p>
      </main>
    </div>
  );
}
