/**
 * Datos de ejemplo para usar la app sin Supabase (por ejemplo, para mostrarla
 * en reuniones). Las organizaciones, plazos y casos son inventados.
 */
import type { Comentario, Mensaje, Noticia, SesionOrgano, Oportunidad, Organizacion, Participacion, PedidoApoyo, SolicitudUnion } from '../types';

function enDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const ORGANIZACIONES: Organizacion[] = [
  { id: 'ca', nombre: 'Colectiva Ámbar', pais: 'Argentina', temas: ['Derechos sexuales y reproductivos'], ofrece: 'Datos de casos', necesita: 'Contactos en Ginebra', aprobada: true },
  { id: 'rd', nombre: 'Red Diversa del Sur', pais: 'Chile', temas: ['Personas LGBTI+'], ofrece: 'Experiencia en EPU', necesita: 'Traducción al inglés', aprobada: true },
  { id: 'ml', nombre: 'Mujeres en Lucha Andina', pais: 'Bolivia', temas: ['Ambiente y clima'], ofrece: 'Testimonios', necesita: 'Asesoría jurídica', aprobada: true },
  { id: 'tr', nombre: 'Trans Visibles', pais: 'Paraguay', temas: ['Identidad de género'], ofrece: 'Firmas', necesita: 'Seguridad digital', aprobada: true },
  { id: 'ci', nombre: 'Círculo Feminista Caribe', pais: 'República Dominicana', temas: ['Desarrollo y derechos sociales'], ofrece: 'Redes en el Caribe', necesita: 'Financiamiento para viajar', aprobada: true },
  { id: 'ob', nombre: 'Observatorio Cuerpos Libres', pais: 'Perú', temas: ['Salud'], ofrece: 'Informes sombra previos', necesita: 'Datos de otros países', aprobada: true },
  { id: 'ag', nombre: 'Agenda Lésbica', pais: 'Uruguay', temas: ['Personas LGBTI+'], ofrece: 'Experiencia en CIDH', necesita: 'Firmas', aprobada: true },
  { id: 'vd', nombre: 'Voces Diversas', pais: 'Guatemala', temas: ['Empresas y economía'], ofrece: 'Testimonios', necesita: 'Acompañamiento en audiencias', aprobada: true },
];

/** La organización de quien usa la app en modo ejemplo. */
export const MI_ORGANIZACION_ID = 'mia';

export const OPORTUNIDADES: Oportunidad[] = [
  {
    id: 're-amb', sistema: 'ONU', mecanismo: 'Procedimientos especiales',
    titulo: 'Relatoría Especial sobre derechos humanos y medio ambiente: llamado a contribuciones',
    pais: 'Regional', tema: 'Ambiente y clima', fecha_limite: enDias(16),
    resumen: 'La Relatoría prepara un informe temático para el Consejo de Derechos Humanos y pide aportes de la sociedad civil: datos, casos y recomendaciones.',
    angulo_agenda: 'Mostrá cómo la crisis climática y los proyectos extractivos afectan distinto a mujeres, personas LGBTI+ y quienes cuidan: desplazamiento, acceso al agua, violencia en los territorios.',
    pasos: ['Leer el cuestionario y elegir 2 o 3 preguntas donde tu experiencia aporte.', 'Sumar datos o casos concretos de tu país.', 'Proponer recomendaciones con enfoque de género.', 'Enviar por correo antes de la fecha límite.'],
    fuente_nombre: 'Llamados a contribuciones de procedimientos especiales (ACNUDH)', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: true,
  },
  {
    id: 'epu-py', sistema: 'ONU', mecanismo: 'EPU',
    titulo: 'EPU de Paraguay: informes de partes interesadas',
    pais: 'Paraguay', tema: 'Todos los temas', fecha_limite: enDias(12),
    resumen: 'Paraguay será examinado en el próximo ciclo del Examen Periódico Universal. Se puede enviar un informe propio o sumarse a uno conjunto.',
    angulo_agenda: 'El EPU revisa todos los derechos. Además del capítulo de igualdad, podés aportar en educación, salud, trabajo o pobreza, mostrando cómo afectan a tu población.',
    pasos: ['Revisar las recomendaciones que Paraguay recibió en el ciclo anterior.', 'Decidir si van solas o en informe conjunto con otras organizaciones.', 'Enviar el informe por la plataforma de la ONU antes del plazo.', 'Pedir reuniones con embajadas antes de la sesión.'],
    fuente_nombre: 'Calendario del EPU (ACNUDH)', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: true,
  },
  {
    id: 'cidh-aud', sistema: 'OEA', mecanismo: 'CIDH',
    titulo: 'Solicitud de audiencias sobre empresas, extractivismo y derechos humanos',
    pais: 'Regional', tema: 'Empresas y economía', fecha_limite: enDias(19),
    resumen: 'La CIDH abrió el plazo para pedir audiencias del próximo período de sesiones. Una solicitud conjunta de varias organizaciones suele tener más peso.',
    angulo_agenda: 'Las audiencias sobre empresas casi nunca incluyen el impacto en mujeres indígenas, defensoras ambientales o personas LGBTI+ en zonas extractivas. Esa mirada suma.',
    pasos: ['Definir el tema y el objetivo de la audiencia.', 'Coordinar con organizaciones ambientales o de pueblos indígenas una solicitud conjunta.', 'Completar el formulario de solicitud de la CIDH.', 'Preparar una intervención de pocos minutos por organización.'],
    fuente_nombre: 'Comunicados de prensa de la CIDH', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: true,
  },
  {
    id: 'desc-bo', sistema: 'ONU', mecanismo: 'Órganos de tratados',
    titulo: 'Comité DESC revisa a Bolivia: informes alternativos',
    pais: 'Bolivia', tema: 'Desarrollo y derechos sociales', fecha_limite: enDias(34),
    resumen: 'El Comité de Derechos Económicos, Sociales y Culturales examinará a Bolivia. Recibe informes alternativos sobre trabajo, salud, vivienda, educación y seguridad social.',
    angulo_agenda: 'Podés mostrar la discriminación laboral de personas trans, la salud sexual y reproductiva como parte del derecho a la salud, o el trabajo de cuidados no pagado.',
    pasos: ['Leer la lista de cuestiones que el Comité envió al Estado.', 'Elegir los artículos del Pacto donde tu agenda encaja.', 'Redactar el informe con preguntas sugeridas para el Comité.', 'Enviarlo a la secretaría del Comité antes del plazo.'],
    fuente_nombre: 'Calendario de sesiones de los órganos de tratados (ACNUDH)', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: true,
  },
  {
    id: 're-des', sistema: 'ONU', mecanismo: 'Procedimientos especiales',
    titulo: 'Relatoría Especial sobre el derecho al desarrollo: consulta regional',
    pais: 'Regional', tema: 'Desarrollo y derechos sociales', fecha_limite: enDias(41),
    resumen: 'La Relatoría convoca a organizaciones de América Latina a una consulta virtual sobre financiamiento del desarrollo y deuda.',
    angulo_agenda: 'Las políticas de deuda y ajuste recortan servicios de salud y cuidados. Contá cómo eso golpea a las poblaciones con las que trabajás.',
    pasos: ['Inscribirse en la consulta virtual.', 'Preparar una intervención de 3 minutos con un dato y un caso.', 'Enviar un aporte escrito breve después de la consulta.'],
    fuente_nombre: 'Página de la Relatoría Especial sobre el derecho al desarrollo (ACNUDH)', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: false,
  },
  {
    id: 'raadh', sistema: 'Mercosur', mecanismo: 'RAADH',
    titulo: 'Reunión de Altas Autoridades sobre Derechos Humanos: consulta sobre migración',
    pais: 'Regional', tema: 'Migración', fecha_limite: enDias(58),
    resumen: 'La presidencia pro tempore convoca a organizaciones a una consulta previa a la reunión de altas autoridades, con foco en personas migrantes.',
    angulo_agenda: 'Las mujeres y personas LGBTI+ migrantes enfrentan riesgos específicos en el tránsito y en el acceso a documentos. Es una agenda poco presente en estos espacios.',
    pasos: ['Inscribirse en la consulta.', 'Preparar una posición breve sobre los temas de la agenda.', 'Coordinar con organizaciones de otros países del bloque.'],
    fuente_nombre: 'Convocatoria de la presidencia pro tempore', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: false,
  },
  {
    id: 'cedaw-cl', sistema: 'ONU', mecanismo: 'Comité CEDAW',
    titulo: 'Comité CEDAW revisa a Chile: informes sombra',
    pais: 'Chile', tema: 'Violencia de género', fecha_limite: enDias(-40),
    resumen: 'Ejemplo de una convocatoria ya cerrada, para mostrar lo que hicieron las organizaciones.',
    angulo_agenda: '', pasos: [], fuente_nombre: 'ACNUDH', fuente_url: null,
    estado: 'publicada', recolectada_automaticamente: false,
  },
  {
    id: 'q1', sistema: 'ONU', mecanismo: 'Procedimientos especiales',
    titulo: 'Relator Especial sobre el derecho a la alimentación: visita a un país de la región',
    pais: 'Regional', tema: 'Desarrollo y derechos sociales', fecha_limite: enDias(45),
    resumen: 'Resumen generado automáticamente, pendiente de revisión.', angulo_agenda: 'Pendiente de revisión.', pasos: [],
    fuente_nombre: 'Página de visitas a países (ACNUDH)', fuente_url: null,
    estado: 'pendiente', recolectada_automaticamente: true,
  },
  {
    id: 'q2', sistema: 'OEA', mecanismo: 'Corte IDH',
    titulo: 'Solicitud de opinión consultiva: plazo para presentar observaciones escritas',
    pais: 'Regional', tema: 'Ambiente y clima', fecha_limite: enDias(60),
    resumen: 'Resumen generado automáticamente, pendiente de revisión.', angulo_agenda: 'Pendiente de revisión.', pasos: [],
    fuente_nombre: 'Comunicados de la Corte IDH', fuente_url: null,
    estado: 'pendiente', recolectada_automaticamente: true,
  },
];

const sin = { resultado: null, tipo_aporte: null, enviado: false, enlace: null } as const;

export const PARTICIPACIONES: Participacion[] = [
  { oportunidad_id: 'epu-py', organizacion_id: 'tr', visibilidad: 'red', ...sin, tipo_aporte: 'informe_sombra' },
  { oportunidad_id: 'epu-py', organizacion_id: 'rd', visibilidad: 'publica', ...sin, tipo_aporte: 'contribucion' },
  { oportunidad_id: 'epu-py', organizacion_id: 'ob', visibilidad: 'red', ...sin },
  { oportunidad_id: 'cidh-aud', organizacion_id: 'ag', visibilidad: 'publica', ...sin, tipo_aporte: 'intervencion' },
  { oportunidad_id: 'cidh-aud', organizacion_id: 'vd', visibilidad: 'red', ...sin },
  { oportunidad_id: 'cidh-aud', organizacion_id: 'ca', visibilidad: 'red', ...sin },
  { oportunidad_id: 'cidh-aud', organizacion_id: 'ml', visibilidad: 'red', ...sin },
  { oportunidad_id: 're-amb', organizacion_id: 'ml', visibilidad: 'red', ...sin, tipo_aporte: 'contribucion', enviado: true },
  { oportunidad_id: 're-des', organizacion_id: 'ci', visibilidad: 'red', ...sin },
  {
    oportunidad_id: 'cedaw-cl', organizacion_id: 'rd', visibilidad: 'publica', tipo_aporte: 'informe_sombra', enviado: true,
    enlace: null, resultado: 'El Comité recomendó al Estado una ley integral contra la discriminación.',
  },
  { oportunidad_id: 'cedaw-cl', organizacion_id: 'ag', visibilidad: 'red', ...sin, tipo_aporte: 'informe_sombra', enviado: true },
  { oportunidad_id: 'epu-py', organizacion_id: 'mia', visibilidad: 'red', ...sin, tipo_aporte: 'contribucion' },
];

export const PEDIDOS: PedidoApoyo[] = [
  {
    id: 'p1', organizacion_id: 'tr', oportunidad_id: 'epu-py', tipo_documento: 'informe_sombra',
    mensaje: 'Tenemos los datos de casos pero nunca escribimos un informe para el EPU. ¿Nos ayudan con la estructura?',
    contacto: 'contacto@ejemplo.org', estado: 'nuevo', creado_en: enDias(-2),
  },
];

export const SESIONES: SesionOrgano[] = [
  {
    id: 's1', sistema: 'ONU', organo: 'Examen Periódico Universal', nombre: 'EPU · sesión del Grupo de Trabajo',
    fecha_inicio: enDias(40), fecha_fin: enDias(51), a_confirmar: false, lugar: 'Ginebra',
    descripcion: 'Ejemplo: se examinan 14 países, entre ellos dos de la región.', fuente_url: null,
  },
  {
    id: 's2', sistema: 'ONU', organo: 'Consejo de Derechos Humanos', nombre: 'Consejo de Derechos Humanos · período de sesiones',
    fecha_inicio: enDias(75), fecha_fin: enDias(110), a_confirmar: true, lugar: 'Ginebra',
    descripcion: 'Ejemplo: informes de relatorías y resoluciones.', fuente_url: null,
  },
  {
    id: 's3', sistema: 'OEA', organo: 'Asamblea General de la OEA', nombre: 'Asamblea General de la OEA',
    fecha_inicio: enDias(170), fecha_fin: null, a_confirmar: true, lugar: 'Sede a confirmar',
    descripcion: 'Ejemplo: resolución ómnibus de derechos humanos.', fuente_url: null,
  },
];

function haceMinutos(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

export const MENSAJES: Mensaje[] = [
  {
    id: 'm1', oportunidad_id: null, organizacion_id: 'rd', autor: 'x', borrado: false, creado_en: haceMinutos(300),
    texto: '¡Hola a todas! Estamos armando el informe para el EPU de Paraguay. Si alguien tiene datos de salud, nos sirven.',
  },
  {
    id: 'm2', oportunidad_id: null, organizacion_id: 'ob', autor: 'x', borrado: false, creado_en: haceMinutos(240),
    texto: 'Nosotras tenemos datos de acceso a salud de 2025. Les escribimos por privado.',
  },
  {
    id: 'm3', oportunidad_id: 'cidh-aud', organizacion_id: 'ag', autor: 'x', borrado: false, creado_en: haceMinutos(90),
    texto: '¿Armamos una solicitud de audiencia conjunta? Podemos coordinar una reunión el jueves.',
  },
  {
    id: 'm4', oportunidad_id: 'cidh-aud', organizacion_id: 'ml', autor: 'x', borrado: false, creado_en: haceMinutos(60),
    texto: 'Sí, contamos con nosotras. Podemos aportar los testimonios de defensoras ambientales.',
  },
];

export const SOLICITUDES: SolicitudUnion[] = [
  { perfil_id: 'x1', email: 'nueva.persona@ejemplo.org', organizacion_id: 'mia', organizacion: 'Tu organización', creada_en: haceMinutos(30) },
];

function haceDias(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

const nota = (n: Partial<Noticia> & Pick<Noticia, 'id' | 'titulo'>): Noticia => ({
  resumen: '', comentario_akahata: '', url: null, fuente_nombre: 'Akãhatã', tipo: 'noticia', sistema: null, idioma: 'es',
  publicada_en: haceDias(1), estado: 'publicada', recolectada_automaticamente: true, ...n,
});

export const NOTICIAS: Noticia[] = [
  nota({
    id: 'n1', sistema: 'OEA', fuente_nombre: 'CIDH · Comunicados de prensa', publicada_en: haceDias(1),
    titulo: 'Ejemplo: la CIDH anuncia el calendario de sesiones y el plazo para pedir audiencias en 2027',
    resumen: 'La Comisión publicó las fechas de sus períodos de sesiones del próximo año y abrió el plazo para solicitar audiencias públicas.',
    comentario_akahata: 'Es el momento de pensar audiencias conjuntas: una organización ambiental y una feminista pidiendo juntas suman fuerza. Mirá la oportunidad en el Radar.',
  }),
  nota({
    id: 'n2', sistema: 'ONU', fuente_nombre: 'Noticias ONU · Derechos humanos', publicada_en: haceDias(2),
    titulo: 'Ejemplo: el Alto Comisionado celebra la despenalización de las relaciones entre personas del mismo sexo en un país del Caribe',
    resumen: 'El Alto Comisionado de la ONU para los Derechos Humanos saludó la decisión judicial y pidió a otros Estados de la región seguir el ejemplo.',
  }),
  nota({
    id: 'n3', sistema: 'ONU', tipo: 'articulo', fuente_nombre: 'Agenda Estado de Derecho', publicada_en: haceDias(4),
    titulo: 'Ejemplo: qué cambia en la justicia internacional con la nueva composición de los órganos de tratados',
    resumen: 'Un análisis sobre la representación regional y de género en los comités de la ONU elegidos este año.',
  }),
  nota({
    id: 'n4', sistema: 'Mercosur', fuente_nombre: 'IPPDH · Mercosur', publicada_en: haceDias(6),
    titulo: 'Ejemplo: se realizó la Cumbre Social del Mercosur',
    resumen: 'Organizaciones sociales de los países del bloque presentaron sus propuestas a las altas autoridades.',
  }),
  nota({
    id: 'n5', tipo: 'nota_akahata', recolectada_automaticamente: false, publicada_en: haceDias(3),
    titulo: 'Ejemplo de nota de Akãhatã: tres claves para presentar un informe sombra al Comité DESC',
    resumen: 'Lo que aprendimos acompañando a organizaciones de la región en sus primeros informes alternativos.',
  }),
  nota({
    id: 'n6', estado: 'pendiente', idioma: 'en', sistema: 'ONU', fuente_nombre: 'Universal Rights Group', tipo: 'articulo', publicada_en: haceDias(1),
    titulo: 'Example: what to expect from the next Human Rights Council session',
    resumen: '[En inglés: traducir al revisar] A preview of the resolutions and reports on the agenda.',
  }),
];

export const COMENTARIOS: Comentario[] = [
  {
    id: 'c1', noticia_id: 'n1', organizacion_id: 'ag', autor: 'x', borrado: false, creado_en: haceDias(1),
    texto: '¿Alguien más quiere pedir una audiencia sobre defensoras en zonas extractivas? Podemos armarla juntas.',
  },
  {
    id: 'c2', noticia_id: 'n1', organizacion_id: 'ml', autor: 'x', borrado: false, creado_en: haceDias(0.5),
    texto: 'Nosotras sí. Tenemos casos documentados en Bolivia.',
  },
];
