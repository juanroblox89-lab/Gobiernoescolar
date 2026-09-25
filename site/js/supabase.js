// Cliente único de Supabase para todo el sitio (la llave anon es pública; la seguridad está en RLS).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/+esm';

export const SUPABASE_URL = 'https://qkygveiinaakoknwkwwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFreWd2ZWlpbmFha29rbndrd3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzkyNjIsImV4cCI6MjEwNTg1NTI2Mn0.q2QmMTZi_MySJn-HfgPV3Tniyla7Wn7LeppoeQhlutU';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const AREAS = {
  personeria:  { nombre: 'Personería',  ruta: '/personeria/' },
  contraloria: { nombre: 'Contraloría', ruta: '/contraloria/' },
  pfc:         { nombre: 'PFC',         ruta: '/pfc/' }
};

// Área que administra la sesión actual (o null si no hay sesión / no es admin).
export async function areaDelAdmin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb.from('admins').select('area').eq('user_id', session.user.id).maybeSingle();
  return data?.area ?? null;
}

// Sube una imagen o PDF al bucket "media" dentro de la carpeta del área y devuelve la URL pública.
// Las fotos se reducen en el navegador (máx. 1600 px, JPEG) para que carguen rápido en celulares.
export async function subirArchivo(area, file, carpeta = 'imagenes') {
  const MAX = 10 * 1024 * 1024;
  const esImagen = /^image\/(jpeg|png|webp)$/.test(file.type);
  const permitido = esImagen || file.type === 'image/gif' || file.type === 'application/pdf';
  if (!permitido) throw new Error('Formato no admitido. Usa JPG, PNG, WEBP, GIF o PDF.');
  let cuerpo = file, ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  if (esImagen) {
    try { cuerpo = await reducirImagen(file); ext = 'jpg'; } catch { /* si falla, se sube el original */ }
  }
  if (cuerpo.size > MAX) throw new Error('El archivo pesa más de 10 MB.');
  const nombre = `${area}/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(nombre, cuerpo, { contentType: cuerpo.type || file.type, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(nombre).data.publicUrl;
}

async function reducirImagen(file, lado = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
  if (!blob) throw new Error('canvas');
  return blob.size < file.size ? blob : file;
}
