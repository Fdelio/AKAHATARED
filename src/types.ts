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
}

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

export type Pantalla = 'radar' | 'red' | 'mias' | 'revision';
