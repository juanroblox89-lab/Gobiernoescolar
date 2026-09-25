// Importa el export de Firestore (_migracion/*.json) a Supabase y crea los 3 admins.
// Las fotos de Firebase Storage no se pudieron descargar (402: facturación cerrada),
// así que esas filas quedan sin foto para que el admin las asocie de nuevo.
// Uso: node scripts/importar.mjs   (idempotente: borra y reinserta el contenido)
import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';

const root = new URL('../', import.meta.url);
const env = Object.fromEntries(fs.readFileSync(new URL('.env', root), 'utf8').split('\n').filter(Boolean)
  .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const ref = new URL(env.SUPABASE_URL).host.split('.')[0];
const leer = a => JSON.parse(fs.readFileSync(new URL(`_migracion/${a}.json`, root), 'utf8'));
const sinFirebase = url => (url && !url.includes('firebasestorage') ? url : '');
const fotosPerdidas = [];
const foto = (url, donde) => { if (url && url.includes('firebasestorage')) fotosPerdidas.push(donde); return sinFirebase(url); };

const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: 5432, user: `postgres.${ref}`, password: env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query('begin');
await db.query('truncate public.noticias, public.actividades, public.eventos, public.documentos, public.informes, public.propuestas, public.avisos, public.semaforo restart identity');

const ins = (tabla, fila) => {
  const cols = Object.keys(fila);
  return db.query(`insert into public.${tabla} (${cols.join(',')}) values (${cols.map((_, i) => '$' + (i + 1)).join(',')})`, Object.values(fila));
};
const fecha = f => (f && /^\d{4}-\d{2}-\d{2}/.test(f) ? f.slice(0, 10) : null);

for (const area of ['personeria', 'contraloria', 'pfc']) {
  const d = leer(area);
  const p = d[area] || {};
  await db.query(`insert into public.areas (id, nombre, cargo, slogan, objetivo, institucion, anio, foto_url, whatsapp, instagram, buzon_url, color, equipo)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    on conflict (id) do update set nombre=excluded.nombre, cargo=excluded.cargo, slogan=excluded.slogan, objetivo=excluded.objetivo,
      institucion=excluded.institucion, anio=excluded.anio, foto_url=excluded.foto_url, whatsapp=excluded.whatsapp,
      instagram=excluded.instagram, buzon_url=excluded.buzon_url, color=excluded.color, equipo=excluded.equipo, updated_at=now()`,
    [area, p.nombre || '', p.cargo || '', (p.slogan || '').replace(/^"|"$/g, ''), (p.objetivo || '').trim(), p.institucion || '', p.anio || '',
     foto(p.foto_url, `${area}: foto de perfil`), p.whatsapp || p.redes?.whatsapp || '', p.redes?.instagram || '', p.buzon_url || '', p.color || '',
     JSON.stringify(p.equipo || [])]);

  for (const n of d.noticias || [])
    await ins('noticias', { area, titulo: n.titulo.trim(), fecha: fecha(n.fecha), categoria: n.categoria || 'info', resumen: (n.resumen || '').trim(), foto_url: foto(n.foto_url, `${area}: noticia "${n.titulo.trim()}"`) });
  for (const a of d.actividades || [])
    await ins('actividades', { area, titulo: a.titulo.trim(), fecha: fecha(a.fecha), descripcion: (a.descripcion || '').trim(), foto_url: foto(a.foto_url, `${area}: actividad "${a.titulo.trim()}"`) });
  for (const e of d.calendario || [])
    await ins('eventos', { area, titulo: e.titulo.trim(), fecha: fecha(e.fecha), descripcion: (e.descripcion || '').trim() });
  for (const [i, doc] of (d.documentos || []).entries())
    await ins('documentos', { area, titulo: doc.titulo, descripcion: doc.descripcion || '', tipo: doc.tipo || 'pdf', icono: doc.icono || '📄', url: sinFirebase(doc.url), orden: i });
  for (const inf of d.informes || [])
    await ins('informes', { area, titulo: inf.titulo, periodo: inf.periodo || '', fecha: fecha(inf.fecha), resumen: inf.resumen || '', logros: inf.logros || [], pendientes: inf.pendientes || [], archivo_url: sinFirebase(inf.archivo_url) });
  for (const pr of d.propuestas || [])
    await ins('propuestas', { area, numero: pr.id, titulo: pr.titulo, descripcion: pr.descripcion || '', categoria: pr.categoria, estado: pr.estado || 'pendiente' });
  for (const av of d.avisos || [])
    await ins('avisos', { area, titulo: av.titulo, texto: av.texto || '', fecha: fecha(av.fecha) });
  if (d.semaforo)
    await ins('semaforo', { area, verde: d.semaforo.verde || [], amarillo: d.semaforo.amarillo || [], rojo: d.semaforo.rojo || [], actualizado: fecha(d.semaforo.ultima_actualizacion) });
}
await db.query('commit');

// ─── Admins (Supabase Auth) ───────────────────────────────────────────────────
const credsFile = new URL('_migracion/credenciales-admin.txt', root);
const creds = fs.existsSync(credsFile) ? Object.fromEntries(fs.readFileSync(credsFile, 'utf8').split('\n').filter(l => l.includes(' ')).map(l => l.split(' '))) : {};
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
const existentes = (await (await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?per_page=100`, { headers: H })).json()).users || [];
for (const area of ['personeria', 'contraloria', 'pfc']) {
  const email = `${area}@auth.com`;
  let user = existentes.find(u => u.email === email);
  if (!user) {
    creds[email] = crypto.randomBytes(9).toString('base64url');
    const r = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, { method: 'POST', headers: H, body: JSON.stringify({ email, password: creds[email], email_confirm: true }) });
    user = await r.json();
    if (!user.id) throw new Error(`no se pudo crear ${email}: ${JSON.stringify(user)}`);
  }
  await db.query('insert into public.admins (user_id, area) values ($1, $2) on conflict (user_id) do update set area = excluded.area', [user.id, area]);
}
fs.writeFileSync(credsFile, Object.entries(creds).map(([e, p]) => `${e} ${p}`).join('\n') + '\n');
fs.writeFileSync(new URL('_migracion/fotos-perdidas.txt', root), fotosPerdidas.join('\n') + '\n');

const { rows } = await db.query(`select 'noticias' t, count(*) from noticias union all select 'actividades', count(*) from actividades
  union all select 'eventos', count(*) from eventos union all select 'documentos', count(*) from documentos union all select 'informes', count(*) from informes
  union all select 'propuestas', count(*) from propuestas union all select 'avisos', count(*) from avisos union all select 'semaforo', count(*) from semaforo
  union all select 'areas', count(*) from areas union all select 'admins', count(*) from admins`);
console.table(rows);
console.log(`Fotos perdidas (a re-asociar): ${fotosPerdidas.length}`);
await db.end();
