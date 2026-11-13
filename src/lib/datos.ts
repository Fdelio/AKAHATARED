/**
 * Capa de datos de la app. Si hay Supabase configurado, lee y escribe en la
 * base real; si no, trabaja en memoria con los datos de ejemplo.
 */
import type { EstadoRevision, Oportunidad, Organizacion, Participacion, Visibilidad } from '../types';
import { supabase } from './supabaseClient';
import * as ejemplo from '../data/datosEjemplo';

// Estado en memoria para el modo ejemplo.
const mem = {
  oportunidades: [...ejemplo.OPORTUNIDADES],
  participaciones: [...ejemplo.PARTICIPACIONES],
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

export async function listarOrganizaciones(): Promise<Organizacion[]> {
  if (supabase) {
    const { data, error } = await supabase.from('organizaciones').select('*').order('pais');
    if (error) throw error;
    return data as Organizacion[];
  }
  return ejemplo.ORGANIZACIONES;
}

export async function listarParticipaciones(): Promise<Participacion[]> {
  if (supabase) {
    const { data, error } = await supabase.from('participaciones').select('*');
    if (error) throw error;
    return data as Participacion[];
  }
  return mem.participaciones;
}

export async function miOrganizacionId(): Promise<string | null> {
  if (supabase) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from('perfiles').select('organizacion_id').eq('id', u.user.id).single();
    return (data?.organizacion_id as string) ?? null;
  }
  return ejemplo.MI_ORGANIZACION_ID;
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
