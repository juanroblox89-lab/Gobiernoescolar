// Prueba de permisos (RLS) contra Supabase con la llave pública, como lo haría el navegador.
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter(Boolean).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const creds = Object.fromEntries(fs.readFileSync('_migracion/credenciales-admin.txt', 'utf8').trim().split('\n').map(l => l.split(' ')));
const U = env.SUPABASE_URL, K = env.SUPABASE_ANON_KEY;
const h = (tok = K) => ({ apikey: K, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', Prefer: 'return=representation' });
const ok = (nombre, cond) => console.log(cond ? '✓' : '✗', nombre);

const r1 = await (await fetch(`${U}/rest/v1/noticias?select=id,area,titulo&order=id`, { headers: h() })).json();
ok(`anónimo lee noticias (${r1.length})`, r1.length === 9);
const r2 = await fetch(`${U}/rest/v1/noticias`, { method: 'POST', headers: h(), body: JSON.stringify({ area: 'personeria', titulo: 'hack' }) });
ok(`anónimo NO puede insertar (${r2.status})`, r2.status === 401 || r2.status === 403);
const r3 = await (await fetch(`${U}/rest/v1/admins?select=*`, { headers: h() })).json();
ok('anónimo NO ve la tabla admins', Array.isArray(r3) && r3.length === 0);

const login = await (await fetch(`${U}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'personeria@auth.com', password: creds['personeria@auth.com'] }) })).json();
ok('login personería', !!login.access_token);
const T = login.access_token;
const propia = r1.find(n => n.area === 'personeria'), ajena = r1.find(n => n.area === 'contraloria');
const u1 = await (await fetch(`${U}/rest/v1/noticias?id=eq.${propia.id}`, { method: 'PATCH', headers: h(T), body: JSON.stringify({ titulo: propia.titulo }) })).json();
ok('personería edita SU noticia', u1.length === 1);
const u2 = await (await fetch(`${U}/rest/v1/noticias?id=eq.${ajena.id}`, { method: 'PATCH', headers: h(T), body: JSON.stringify({ titulo: 'hack' }) })).json();
ok('personería NO edita noticia de contraloría', Array.isArray(u2) && u2.length === 0);
const i1 = await fetch(`${U}/rest/v1/noticias`, { method: 'POST', headers: h(T), body: JSON.stringify({ area: 'pfc', titulo: 'hack' }) });
ok(`personería NO inserta en PFC (${i1.status})`, i1.status >= 400);

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const up = n => fetch(`${U}/storage/v1/object/media/${n}`, { method: 'POST', headers: { apikey: K, Authorization: `Bearer ${T}`, 'Content-Type': 'image/png' }, body: png });
const s1 = await up('personeria/prueba/test.png');
ok(`personería sube a su carpeta (${s1.status})`, s1.ok);
const pub = await fetch(`${U}/storage/v1/object/public/media/personeria/prueba/test.png`);
ok(`la imagen es pública (${pub.status})`, pub.ok);
const s2 = await up('contraloria/prueba/test.png');
ok(`personería NO sube a carpeta de contraloría (${s2.status})`, !s2.ok);
const del = await fetch(`${U}/storage/v1/object/media/personeria/prueba/test.png`, { method: 'DELETE', headers: { apikey: K, Authorization: `Bearer ${T}` } });
ok('limpieza del archivo de prueba', del.ok);
