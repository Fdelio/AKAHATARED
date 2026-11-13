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

/** Qué documento preparó (o prepara) la organización. */
export type TipoAporte = 'informe_sombra' | 'contribucion' | 'reporte' | 'intervencion' | 'otro';

export const TIPOS_APORTE: Record<TipoAporte, string> = {
  informe_sombra: 'Informe sombra o alternativo',
  contribucion: 'Contribución o respuesta a cuestionario',
  reporte: 'Reporte o informe propio',
  intervencion: 'Intervención oral o audiencia',
  otro: 'Otro',
};

export interface Participacion {
  oportunidad_id: string;
  organizacion_id: string;
  visibilidad: Visibilidad;
  resultado: string | null;
  tipo_aporte: TipoAporte | null;
  /** Ya lo enviaron. */
  enviado: boolean;
  enlace: string | null;
}

/** Lo que una organización registra sobre su trabajo en una oportunidad. */
export type Trabajo = Pick<Participacion, 'tipo_aporte' | 'enviado' | 'enlace' | 'resultado'>;

export type EstadoPedido = 'nuevo' | 'en_curso' | 'cerrado';

/** Pedido de apoyo a Akãhatã para redactar un documento. */
export interface PedidoApoyo {
  id: string;
  organizacion_id: string;
  oportunidad_id: string | null;
  tipo_documento: TipoAporte;
  mensaje: string;
  contacto: string;
  estado: EstadoPedido;
  creado_en: string;
}

export type NuevoPedido = Pick<PedidoApoyo, 'oportunidad_id' | 'tipo_documento' | 'mensaje' | 'contacto'>;

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
