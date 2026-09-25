// Carga los datos de un área con la misma forma que tenía el documento de Firestore,
// así los renderizadores de cada página no cambian. Usa caché (stale-while-revalidate):
// pinta al instante lo último que se vio y luego refresca desde Supabase.
import { sb } from './supabase.js';

const CLAVE = area => `ge:datos:${area}:v1`;

export function datosEnCache(area) {
  try { return JSON.parse(sessionStorage.getItem(CLAVE(area)) || localStorage.getItem(CLAVE(area)) || 'null'); }
  catch { return null; }
}

export async function cargarArea(area) {
  const porArea = t => sb.from(t).select('*').eq('area', area);
  const [perfil, noticias, actividades, eventos, documentos, informes, propuestas, avisos, semaforo] = await Promise.all([
    sb.from('areas').select('*').eq('id', area).single(),
    porArea('noticias').order('fecha').order('id'),
    porArea('actividades').order('fecha').order('id'),
    porArea('eventos').order('fecha'),
    porArea('documentos').order('orden').order('id'),
    porArea('informes').order('fecha'),
    porArea('propuestas').order('numero').order('id'),
    porArea('avisos').order('fecha').order('id'),
    porArea('semaforo').maybeSingle()
  ]);
  const error = [perfil, noticias, actividades, eventos, documentos, informes, propuestas, avisos, semaforo].find(r => r.error)?.error;
  if (error) throw error;

  const p = perfil.data;
  const s = semaforo.data;
  const datos = {
    [area]: { ...p, redes: { instagram: p.instagram, whatsapp: p.whatsapp } },
    noticias: noticias.data,
    actividades: actividades.data,
    calendario: eventos.data,
    documentos: documentos.data,
    informes: informes.data,
    propuestas: propuestas.data.map(x => ({ ...x, id: x.numero || x.id, _id: x.id })),
    avisos: avisos.data,
    semaforo: s ? { verde: s.verde, amarillo: s.amarillo, rojo: s.rojo, ultima_actualizacion: s.actualizado } : null
  };
  try {
    const json = JSON.stringify(datos);
    sessionStorage.setItem(CLAVE(area), json);
    localStorage.setItem(CLAVE(area), json);
  } catch { /* almacenamiento lleno o bloqueado: no pasa nada */ }
  return datos;
}

// Pinta con caché si hay, luego con datos frescos (solo si cambiaron). `pintar(datos, {primera})`.
export async function iniciarArea(area, pintar) {
  const cache = datosEnCache(area);
  if (cache) pintar(cache, { desdeCache: true });
  try {
    const frescos = await cargarArea(area);
    if (!cache || JSON.stringify(cache) !== JSON.stringify(frescos)) pintar(frescos, { desdeCache: false, habiaCache: !!cache });
    return frescos;
  } catch (e) {
    console.error('No se pudieron cargar los datos:', e);
    if (!cache) pintar(null, { error: true });
    return cache;
  }
}
