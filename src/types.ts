export type Sistema = 'ONU' | 'OEA' | 'Mercosur';

/** Quién puede ver que una organización se sumó a una oportunidad. */
export type Visibilidad = 'publica' | 'red' | 'solo_akahata';

export type EstadoRevision = 'pendiente' | 'publicada' | 'descartada';

export interface Organizacion {
  id: string;
  nombre: string;
  pais: string;
  temas: string[];
  ofrece: string;
  necesita: string;
  /** Las organizaciones nuevas quedan pendientes hasta que Akãhatã las aprueba. */
  aprobada: boolean;
}

/** Datos de la persona que ingresó. */
export interface Sesion {
  email: string;
  rol: 'miembro' | 'revisora';
  organizacion: Organizacion | null;
}

/** Lo que se completa al dar de alta una organización. */
export type NuevaOrganizacion = Pick<Organizacion, 'nombre' | 'pais' | 'temas' | 'ofrece' | 'necesita'>;

/** Lo que completa Akãhatã al cargar una oportunidad a mano. */
export type NuevaOportunidad = Omit<Oportunidad, 'id' | 'estado' | 'recolectada_automaticamente'>;

export interface Oportunidad {
  id: string;
  sistema: Sistema;
  mecanismo: string;
  titulo: string;
  pais: string;
  tema: string;
  resumen: string;
  /** "Cómo sumar tu agenda": qué aporta una mirada feminista y de diversidad a este tema. */
  angulo_agenda: string;
  pasos: string[];
  fecha_limite: string; // YYYY-MM-DD
  fuente_nombre: string;
  fuente_url: string | null;
  estado: EstadoRevision;
  recolectada_automaticamente: boolean;
}

export interface Participacion {
  oportunidad_id: string;
  organizacion_id: string;
  visibilidad: Visibilidad;
  resultado: string | null;
}

export type Pantalla = 'radar' | 'red' | 'mias' | 'revision' | 'cuenta' | 'cargar';

/** Sesión de un órgano (Consejo de DDHH, EPU, CSW, Asamblea General de la OEA…). */
export interface SesionOrgano {
  id: string;
  sistema: Sistema;
  organo: string;
  nombre: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string | null;
  /** La fecha todavía no está confirmada oficialmente. */
  a_confirmar: boolean;
  lugar: string;
  descripcion: string;
  fuente_url: string | null;
}
