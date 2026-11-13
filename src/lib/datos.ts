/**
 * Capa de datos de la app. Si hay Supabase configurado, lee y escribe en la
 * base real; si no, trabaja en memoria con los datos de ejemplo.
 */
import type {
  EstadoRevision, NuevaOportunidad, NuevaOrganizacion, Oportunidad, Organizacion, Participacion, Sesion, Visibilidad,
} from '../types';
import { supabase } from './supabaseClient';
import * as ejemplo from '../data/datosEjemplo';

// Estado en memoria para el modo ejemplo.
const mem = {
  oportunidades: [...ejemplo.OPORTUNIDADES],
  participaciones: [...ejemplo.PARTICIPACIONES],
  organizaciones: [...ejemplo.ORGANIZACIONES],
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

// ---------- Ingreso ----------

/** Quién ingresó, con su rol y su organización. null si nadie ingresó. */
export async function obtenerSesion(): Promise<Sesion | null> {
  if (supabase) {
    const { data: s } = await supabase.auth.getSession();
    const usuaria = s.session?.user;
    if (!usuaria) return null;
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol, organizaciones(*)')
      .eq('id', usuaria.id)
      .maybeSingle();
    if (error) throw error;
    return {
      email: usuaria.email ?? '',
      rol: (data?.rol as Sesion['rol']) ?? 'miembro',
      organizacion: (data?.organizaciones as unknown as Organizacion | null) ?? null,
    };
  }
  // Modo ejemplo: se muestra todo, como si ingresara alguien del equipo de Akãhatã.
  return {
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

export async function salir() {
  if (supabase) await supabase.auth.signOut();
}

/** Avisa cuando alguien entra (por ejemplo, al volver desde el enlace del correo) o sale. */
export function alCambiarSesion(fn: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') fn();
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
  mem.participaciones.push({ oportunidad_id: oportunidadId, organizacion_id: organizacionId, visibilidad, resultado: null });
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

export async function guardarResultado(oportunidadId: string, organizacionId: string, resultado: string) {
  if (supabase) {
    const { error } = await supabase
      .from('participaciones')
      .update({ resultado, resultado_en: new Date().toISOString() })
      .eq('oportunidad_id', oportunidadId)
      .eq('organizacion_id', organizacionId);
    if (error) throw error;
    return;
  }
  const p = mem.participaciones.find((x) => x.oportunidad_id === oportunidadId && x.organizacion_id === organizacionId);
  if (p) p.resultado = resultado;
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

/** Días que faltan hasta la fecha límite (negativo si ya pasó). */
export function diasHasta(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha + 'T00:00:00');
  return Math.round((f.getTime() - hoy.getTime()) / 86_400_000);
}
