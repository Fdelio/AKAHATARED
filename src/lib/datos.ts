/**
 * Capa de datos de la app. Si hay Supabase configurado, lee y escribe en la
 * base real; si no, trabaja en memoria con los datos de ejemplo.
 */
import type {
  Comentario, MensajePrivado, Perfil, PersonaRed, EstadoPedido, EstadoRevision, Mensaje, Noticia, NuevaNoticia, NuevaOportunidad, NuevaOrganizacion, NuevoPedido, Oportunidad, Organizacion, Participacion,
  PedidoApoyo, Sesion, SesionOrgano, SolicitudUnion, Trabajo, Visibilidad,
} from '../types';
import { supabase } from './supabaseClient';
import * as ejemplo from '../data/datosEjemplo';

// Estado en memoria para el modo ejemplo.
const mem = {
  oportunidades: [...ejemplo.OPORTUNIDADES],
  participaciones: [...ejemplo.PARTICIPACIONES],
  organizaciones: [...ejemplo.ORGANIZACIONES],
  pedidos: [...ejemplo.PEDIDOS],
  mensajes: [...ejemplo.MENSAJES],
  solicitudes: [...ejemplo.SOLICITUDES],
  noticias: [...ejemplo.NOTICIAS],
  perfil: { ...ejemplo.MI_PERFIL },
  privados: [...ejemplo.PRIVADOS],
  comentarios: [...ejemplo.COMENTARIOS],
};

export async function listarOportunidades(estado: EstadoRevision = 'publicada'): Promise<Oportunidad[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('oportunidades')
      .select('*')
      .eq('estado', estado)
      .order('fecha_limite', { ascending: true });
    if (error) throw error;
    return data as Oportunidad[];
  }
  return mem.oportunidades
    .filter((o) => o.estado === estado)
    .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite));
}

/** Organizaciones del mapa de la red (solo las aprobadas por Akãhatã). */
export async function listarOrganizaciones(aprobadas = true): Promise<Organizacion[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('organizaciones')
      .select('*')
      .eq('aprobada', aprobadas)
      .order('pais');
    if (error) throw error;
    return data as Organizacion[];
  }
  return mem.organizaciones.filter((o) => o.aprobada === aprobadas);
}

export async function listarParticipaciones(): Promise<Participacion[]> {
  if (supabase) {
    const { data, error } = await supabase.from('participaciones').select('*');
    if (error) throw error;
    return data as Participacion[];
  }
  return mem.participaciones;
}

/** Calendario de sesiones desde hoy en adelante. */
export async function listarSesiones(): Promise<SesionOrgano[]> {
  const hoy = new Date().toISOString().slice(0, 10);
  if (supabase) {
    const { data, error } = await supabase
      .from('sesiones')
      .select('*')
      .or(`fecha_fin.gte.${hoy},and(fecha_fin.is.null,fecha_inicio.gte.${hoy})`)
      .order('fecha_inicio');
    if (error) throw error;
    return data as SesionOrgano[];
  }
  return ejemplo.SESIONES;
}

// ---------- Ingreso ----------

/** Quién ingresó, con su rol y su organización. null si nadie ingresó. */
export async function obtenerSesion(): Promise<Sesion | null> {
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    const usuaria = s.session?.user;
    if (!usuaria) return null;
    const [{ data, error }, { data: sol }] = await Promise.all([
      supabase
        .from('perfiles')
        .select('rol, nombre_visible, cargo, presentacion, visible_en_red, acepta_mensajes, organizaciones(*)')
        .eq('id', usuaria.id)
        .maybeSingle(),
      supabase
        .from('solicitudes_union')
        .select('organizacion_id, organizaciones(nombre)')
        .eq('perfil_id', usuaria.id)
        .eq('estado', 'pendiente')
        .maybeSingle(),
    ]);
    if (error) throw error;
    return {
      id: usuaria.id,
      email: usuaria.email ?? '',
      rol: (data?.rol as Sesion['rol']) ?? 'miembro',
      organizacion: (data?.organizaciones as unknown as Organizacion | null) ?? null,
      solicitud: sol
        ? { organizacion_id: sol.organizacion_id, nombre: (sol.organizaciones as unknown as { nombre: string } | null)?.nombre ?? '' }
        : null,
      perfil: {
        nombre_visible: data?.nombre_visible ?? '',
        cargo: data?.cargo ?? '',
        presentacion: data?.presentacion ?? '',
        visible_en_red: data?.visible_en_red ?? false,
        acepta_mensajes: data?.acepta_mensajes ?? false,
      },
    };
  }
  // Modo ejemplo: se muestra todo, como si ingresara alguien del equipo de Akãhatã.
  return {
    id: 'yo',
    solicitud: null,
    perfil: mem.perfil,
    email: 'ejemplo@akahata.org',
    rol: 'revisora',
    organizacion: {
      id: ejemplo.MI_ORGANIZACION_ID, nombre: 'Tu organización', pais: 'Argentina',
      temas: [], ofrece: '', necesita: '', aprobada: true,
    },
  };
}

/** Manda un enlace de ingreso al correo. No hace falta contraseña. */
export async function enviarEnlace(email: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

const volverAca = () => window.location.origin + window.location.pathname;

/** Entrar con correo y contraseña. */
export async function entrarConContrasena(email: string, contrasena: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena });
  if (error) throw error;
}

/**
 * Crear una cuenta con contraseña. Llega un correo para confirmar la dirección
 * (solo esta vez). Devuelve true si ya quedó adentro (sin confirmar).
 */
export async function crearCuenta(email: string, contrasena: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: contrasena,
    options: { emailRedirectTo: volverAca() },
  });
  if (error) throw error;
  // Si el correo ya tenía cuenta, Supabase no avisa (para no revelar quién está registrada):
  // devuelve una persona sin identidades.
  if (data.user && data.user.identities?.length === 0) throw new Error('ya_registrado');
  return !!data.session;
}

/** Manda un correo para elegir una contraseña nueva. */
export async function recuperarContrasena(email: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: volverAca() });
  if (error) throw error;
}

/** Crear o cambiar la contraseña de quien ya entró. */
export async function cambiarContrasena(contrasena: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password: contrasena });
  if (error) throw error;
}

export async function salir() {
  if (supabase) await supabase.auth.signOut();
}

/**
 * Avisa cuando alguien entra (por ejemplo, al volver desde el enlace del correo) o sale.
 * alRecuperar se llama cuando se vuelve del correo para elegir una contraseña nueva.
 */
export function alCambiarSesion(fn: () => void, alRecuperar?: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') alRecuperar?.();
    if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT' || evento === 'PASSWORD_RECOVERY') fn();
  });
  return () => data.subscription.unsubscribe();
}

/** Da de alta la organización de quien ingresó. Queda pendiente de aprobación. */
export async function crearMiOrganizacion(org: NuevaOrganizacion) {
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    const id = s.session?.user.id;
    if (!id) throw new Error('Sin sesión');
    const { data, error } = await supabase.from('organizaciones').insert(org).select('id').single();
    if (error) throw error;
    const { error: e2 } = await supabase.from('perfiles').update({ organizacion_id: data.id }).eq('id', id);
    if (e2) throw e2;
    return;
  }
  mem.organizaciones.push({ ...org, id: 'nueva-' + Date.now(), aprobada: false });
}

export async function aprobarOrganizacion(id: string, aprobada: boolean) {
  if (supabase) {
    const { error } = aprobada
      ? await supabase.from('organizaciones').update({ aprobada: true }).eq('id', id)
      : await supabase.from('organizaciones').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const o = mem.organizaciones.find((x) => x.id === id);
  if (aprobada && o) o.aprobada = true;
  if (!aprobada) mem.organizaciones = mem.organizaciones.filter((x) => x.id !== id);
}

// ---------- Oportunidades y participaciones ----------

/** Akãhatã corrige una oportunidad (por ejemplo, una recolectada automáticamente) antes o después de publicarla. */
export async function actualizarOportunidad(id: string, o: NuevaOportunidad, publicar: boolean) {
  const estado: EstadoRevision = publicar ? 'publicada' : 'pendiente';
  if (supabase) {
    const { error } = await supabase
      .from('oportunidades')
      .update({ ...o, estado, revisada_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return;
  }
  const i = mem.oportunidades.findIndex((x) => x.id === id);
  if (i >= 0) mem.oportunidades[i] = { ...mem.oportunidades[i], ...o, estado };
}

/** Akãhatã carga una oportunidad a mano. Se publica directamente o queda para revisar. */
export async function crearOportunidad(o: NuevaOportunidad, publicar: boolean) {
  const estado: EstadoRevision = publicar ? 'publicada' : 'pendiente';
  if (supabase) {
    const { error } = await supabase.from('oportunidades').insert({
      ...o,
      estado,
      recolectada_automaticamente: false,
      revisada_en: publicar ? new Date().toISOString() : null,
    });
    if (error) throw error;
    return;
  }
  mem.oportunidades.push({ ...o, id: 'nueva-' + Date.now(), estado, recolectada_automaticamente: false });
}

export async function sumarse(oportunidadId: string, organizacionId: string, visibilidad: Visibilidad) {
  if (supabase) {
    const { error } = await supabase
      .from('participaciones')
      .upsert({ oportunidad_id: oportunidadId, organizacion_id: organizacionId, visibilidad });
    if (error) throw error;
    return;
  }
  mem.participaciones = mem.participaciones.filter(
    (p) => !(p.oportunidad_id === oportunidadId && p.organizacion_id === organizacionId),
  );
  mem.participaciones.push({
    oportunidad_id: oportunidadId, organizacion_id: organizacionId, visibilidad,
    resultado: null, tipo_aporte: null, enviado: false, enlace: null,
  });
}

export async function salirse(oportunidadId: string, organizacionId: string) {
  if (supabase) {
    const { error } = await supabase
      .from('participaciones')
      .delete()
      .eq('oportunidad_id', oportunidadId)
      .eq('organizacion_id', organizacionId);
    if (error) throw error;
    return;
  }
  mem.participaciones = mem.participaciones.filter(
    (p) => !(p.oportunidad_id === oportunidadId && p.organizacion_id === organizacionId),
  );
}

/** Qué documento prepara la organización, si ya lo envió, el enlace y el resultado. */
export async function guardarTrabajo(oportunidadId: string, organizacionId: string, t: Trabajo) {
  const limpio: Trabajo = {
    tipo_aporte: t.tipo_aporte,
    enviado: t.enviado,
    enlace: t.enlace?.trim() || null,
    resultado: t.resultado?.trim() || null,
  };
  if (supabase) {
    const { error } = await supabase
      .from('participaciones')
      .update({ ...limpio, resultado_en: limpio.resultado ? new Date().toISOString() : null })
      .eq('oportunidad_id', oportunidadId)
      .eq('organizacion_id', organizacionId);
    if (error) throw error;
    return;
  }
  const p = mem.participaciones.find((x) => x.oportunidad_id === oportunidadId && x.organizacion_id === organizacionId);
  if (p) Object.assign(p, limpio);
}

// ---------- Pedidos de apoyo a Akãhatã ----------

/** Los de mi organización; el equipo de Akãhatã ve todos. */
export async function listarPedidos(): Promise<PedidoApoyo[]> {
  if (supabase) {
    const { data, error } = await supabase.from('pedidos_apoyo').select('*').order('creado_en', { ascending: false });
    if (error) throw error;
    return data as PedidoApoyo[];
  }
  return mem.pedidos;
}

export async function pedirApoyo(organizacionId: string, p: NuevoPedido) {
  if (supabase) {
    const { error } = await supabase.from('pedidos_apoyo').insert({ ...p, organizacion_id: organizacionId });
    if (error) throw error;
    return;
  }
  mem.pedidos.unshift({ ...p, id: 'p-' + Date.now(), organizacion_id: organizacionId, estado: 'nuevo', creado_en: new Date().toISOString() });
}

export async function actualizarPedido(id: string, estado: EstadoPedido) {
  if (supabase) {
    const { error } = await supabase.from('pedidos_apoyo').update({ estado }).eq('id', id);
    if (error) throw error;
    return;
  }
  const p = mem.pedidos.find((x) => x.id === id);
  if (p) p.estado = estado;
}

export async function revisarOportunidad(id: string, estado: EstadoRevision) {
  if (supabase) {
    const { error } = await supabase
      .from('oportunidades')
      .update({ estado, revisada_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return;
  }
  const o = mem.oportunidades.find((x) => x.id === id);
  if (o) o.estado = estado;
}

// ---------- Varias personas por organización ----------

/** Pide sumarse a una organización que ya está en la red. */
export async function pedirUnirme(organizacionId: string) {
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase
      .from('solicitudes_union')
      .insert({ perfil_id: s.session?.user.id, organizacion_id: organizacionId });
    if (error) throw error;
  }
}

export async function cancelarSolicitud() {
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase
      .from('solicitudes_union')
      .update({ estado: 'cancelada' })
      .eq('perfil_id', s.session?.user.id ?? '')
      .eq('estado', 'pendiente');
    if (error) throw error;
  }
}

/** Pedidos para sumarse a mi organización (Akãhatã ve todos). */
export async function listarSolicitudes(): Promise<SolicitudUnion[]> {
  if (supabase) {
    const { data, error } = await supabase.rpc('solicitudes_para_responder');
    if (error) throw error;
    return data as SolicitudUnion[];
  }
  return mem.solicitudes;
}

export async function responderSolicitud(perfilId: string, aceptar: boolean) {
  if (supabase) {
    const { error } = await supabase.rpc('responder_solicitud', { p_perfil: perfilId, p_aceptar: aceptar });
    if (error) throw error;
    return;
  }
  mem.solicitudes = mem.solicitudes.filter((s) => s.perfil_id !== perfilId);
}

/** Correos de las personas de mi organización. */
export async function listarPersonas(): Promise<string[]> {
  if (supabase) {
    const { data, error } = await supabase.rpc('personas_de_mi_organizacion');
    if (error) throw error;
    return (data as { email: string }[]).map((p) => p.email);
  }
  return ['ejemplo@akahata.org', 'otra.persona@ejemplo.org'];
}

// ---------- Chat ----------

/** Mensajes de una sala: null = general, si no, la de esa oportunidad. */
export async function listarMensajes(oportunidadId: string | null): Promise<Mensaje[]> {
  if (supabase) {
    let q = supabase.from('mensajes').select('*').order('creado_en', { ascending: true }).limit(300);
    q = oportunidadId ? q.eq('oportunidad_id', oportunidadId) : q.is('oportunidad_id', null);
    const { data, error } = await q;
    if (error) throw error;
    return data as Mensaje[];
  }
  return mem.mensajes.filter((m) => m.oportunidad_id === oportunidadId);
}

/** Cuántos mensajes tiene cada conversación de oportunidad (para la lista de salas). */
export async function contarMensajesPorOportunidad(): Promise<Record<string, number>> {
  let filas: { oportunidad_id: string | null }[] = mem.mensajes;
  if (supabase) {
    const { data, error } = await supabase.from('mensajes').select('oportunidad_id').not('oportunidad_id', 'is', null).eq('borrado', false);
    if (error) throw error;
    filas = data;
  }
  const cuenta: Record<string, number> = {};
  filas.forEach((f) => f.oportunidad_id && (cuenta[f.oportunidad_id] = (cuenta[f.oportunidad_id] ?? 0) + 1));
  return cuenta;
}

export async function enviarMensaje(organizacionId: string, oportunidadId: string | null, texto: string) {
  if (supabase) {
    const { error } = await supabase
      .from('mensajes')
      .insert({ organizacion_id: organizacionId, oportunidad_id: oportunidadId, texto });
    if (error) throw error;
    return;
  }
  mem.mensajes.push({
    id: 'm-' + Date.now(), organizacion_id: organizacionId, oportunidad_id: oportunidadId, autor: 'yo',
    texto, borrado: false, creado_en: new Date().toISOString(),
  });
}

/** Lo puede hacer quien lo escribió o Akãhatã. El texto se reemplaza. */
export async function borrarMensaje(id: string) {
  if (supabase) {
    const { error } = await supabase.from('mensajes').update({ borrado: true, texto: 'Mensaje borrado' }).eq('id', id);
    if (error) throw error;
    return;
  }
  const m = mem.mensajes.find((x) => x.id === id);
  if (m) Object.assign(m, { borrado: true, texto: 'Mensaje borrado' });
}

/** Avisa cuando llega o cambia un mensaje. Devuelve la función para dejar de escuchar. */
export function escucharMensajes(fn: () => void): () => void {
  const cliente = supabase;
  if (!cliente) return () => {};
  const canal = cliente
    .channel('mensajes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, fn)
    .subscribe();
  return () => {
    cliente.removeChannel(canal);
  };
}

// ---------- Noticias y foro ----------

export async function listarNoticias(estado: EstadoRevision = 'publicada'): Promise<Noticia[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('noticias')
      .select('*')
      .eq('estado', estado)
      .order('publicada_en', { ascending: false })
      .limit(estado === 'publicada' ? 200 : 300);
    if (error) throw error;
    return data as Noticia[];
  }
  return mem.noticias.filter((n) => n.estado === estado).sort((a, b) => b.publicada_en.localeCompare(a.publicada_en));
}

/** Akãhatã escribe una nota propia o carga una noticia a mano. */
export async function crearNoticia(n: NuevaNoticia, publicar: boolean) {
  const estado: EstadoRevision = publicar ? 'publicada' : 'pendiente';
  if (supabase) {
    const { error } = await supabase.from('noticias').insert({ ...n, estado });
    if (error) throw error;
    return;
  }
  mem.noticias.push({
    ...n, id: 'n-' + Date.now(), estado, idioma: 'es', publicada_en: new Date().toISOString(), recolectada_automaticamente: false,
  });
}

/** Corregir, publicar o descartar una noticia. */
export async function actualizarNoticia(id: string, cambios: Partial<NuevaNoticia>, estado: EstadoRevision) {
  if (supabase) {
    const { error } = await supabase.from('noticias').update({ ...cambios, estado }).eq('id', id);
    if (error) throw error;
    return;
  }
  const n = mem.noticias.find((x) => x.id === id);
  if (n) Object.assign(n, cambios, { estado });
}

/** Cantidad de comentarios por noticia (solo la ven organizaciones aprobadas y Akãhatã). */
/** Cantidad de comentarios por noticia. La ve cualquiera (sin el texto). */
export async function contarComentarios(): Promise<Record<string, number>> {
  const cuenta: Record<string, number> = {};
  if (supabase) {
    const { data, error } = await supabase.rpc('contar_comentarios');
    if (error) throw error;
    (data as { noticia_id: string; cantidad: number }[]).forEach((f) => (cuenta[f.noticia_id] = Number(f.cantidad)));
    return cuenta;
  }
  mem.comentarios.filter((c) => !c.borrado).forEach((c) => (cuenta[c.noticia_id] = (cuenta[c.noticia_id] ?? 0) + 1));
  return cuenta;
}

export async function listarComentarios(noticiaId: string): Promise<Comentario[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('noticia_id', noticiaId)
      .order('creado_en', { ascending: true });
    if (error) throw error;
    return data as Comentario[];
  }
  return mem.comentarios.filter((c) => c.noticia_id === noticiaId);
}

export async function comentar(noticiaId: string, organizacionId: string, texto: string) {
  if (supabase) {
    const { error } = await supabase.from('comentarios').insert({ noticia_id: noticiaId, organizacion_id: organizacionId, texto });
    if (error) throw error;
    return;
  }
  mem.comentarios.push({
    id: 'c-' + Date.now(), noticia_id: noticiaId, organizacion_id: organizacionId, autor: 'yo', texto, borrado: false,
    creado_en: new Date().toISOString(),
  });
}

/** Lo puede hacer quien lo escribió o Akãhatã. */
export async function borrarComentario(id: string) {
  if (supabase) {
    const { error } = await supabase.from('comentarios').update({ borrado: true, texto: 'Comentario borrado' }).eq('id', id);
    if (error) throw error;
    return;
  }
  const c = mem.comentarios.find((x) => x.id === id);
  if (c) Object.assign(c, { borrado: true, texto: 'Comentario borrado' });
}

// ---------- Perfil, personas y mensajes privados ----------

export async function guardarPerfil(p: Perfil) {
  const limpio: Perfil = {
    nombre_visible: p.nombre_visible.trim(),
    cargo: p.cargo.trim(),
    presentacion: p.presentacion.trim(),
    visible_en_red: p.visible_en_red,
    acepta_mensajes: p.acepta_mensajes,
  };
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase.from('perfiles').update(limpio).eq('id', s.session?.user.id ?? '');
    if (error) throw error;
    return;
  }
  mem.perfil = limpio;
}

/** Personas que eligieron aparecer en la Red (sin correos). */
export async function listarPersonasDeLaRed(): Promise<PersonaRed[]> {
  if (supabase) {
    const { data, error } = await supabase.rpc('personas_de_la_red');
    if (error) throw error;
    return data as PersonaRed[];
  }
  return [
    ...ejemplo.PERSONAS,
    { id: 'yo', organizacion_id: ejemplo.MI_ORGANIZACION_ID, ...mem.perfil, nombre_visible: mem.perfil.nombre_visible || 'Persona sin nombre' },
  ];
}

/** Todos mis mensajes privados (enviados y recibidos), del más viejo al más nuevo. */
export async function listarMensajesPrivados(): Promise<MensajePrivado[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('mensajes_privados')
      .select('*')
      .order('creado_en', { ascending: true })
      .limit(1000);
    if (error) throw error;
    return data as MensajePrivado[];
  }
  return mem.privados.map((m) => ({ ...m }));
}

/** Nombres de las personas con las que tengo conversaciones. */
export async function nombresDeConversaciones(): Promise<{ id: string; nombre_visible: string; organizacion_id: string | null }[]> {
  if (supabase) {
    const { data, error } = await supabase.rpc('nombres_de_mis_conversaciones');
    if (error) throw error;
    return data;
  }
  return ejemplo.PERSONAS;
}

export async function enviarMensajePrivado(para: string, texto: string) {
  if (supabase) {
    const { error } = await supabase.from('mensajes_privados').insert({ para, texto });
    if (error) throw error;
    return;
  }
  mem.privados.push({ id: 'p-' + Date.now(), de: 'yo', para, texto, leido: false, creado_en: new Date().toISOString() });
}

export async function marcarLeidos(de: string) {
  if (supabase) {
    const { error } = await supabase.from('mensajes_privados').update({ leido: true }).eq('de', de).eq('leido', false);
    if (error) throw error;
    return;
  }
  mem.privados.forEach((m) => m.de === de && (m.leido = true));
}

/** Avisa cuando llega un mensaje privado. */
export function escucharPrivados(fn: () => void): () => void {
  const cliente = supabase;
  if (!cliente) return () => {};
  const canal = cliente
    .channel('privados')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes_privados' }, fn)
    .subscribe();
  return () => {
    cliente.removeChannel(canal);
  };
}

/** Días que faltan hasta la fecha límite (negativo si ya pasó). */
export function diasHasta(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha + 'T00:00:00');
  return Math.round((f.getTime() - hoy.getTime()) / 86_400_000);
}
