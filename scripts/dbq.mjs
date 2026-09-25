// Corre un archivo .sql (o SQL inline con -e) contra la DB de Supabase. Uso: node dbq.mjs archivo.sql | node dbq.mjs -e "select 1"
import fs from 'fs'; import pg from 'pg';
const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n').filter(Boolean).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const ref = new URL(env.SUPABASE_URL).host.split('.')[0];
const sql = process.argv[2] === '-e' ? process.argv[3] : fs.readFileSync(process.argv[2], 'utf8');
const hosts = env.SUPABASE_DB_HOST ? [env.SUPABASE_DB_HOST] : ['us-east-1', 'us-east-2', 'us-west-1', 'sa-east-1', 'eu-central-1', 'us-west-2', 'ca-central-1', 'eu-west-1'].flatMap(r => [`aws-0-${r}.pooler.supabase.com`, `aws-1-${r}.pooler.supabase.com`]);
for (const host of hosts) {
  const c = new pg.Client({ host, port: 5432, user: `postgres.${ref}`, password: env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try { await c.connect(); } catch (e) { if (/tenant|not found|ENOTFOUND|timeout/i.test(e.message)) continue; console.error(host, e.message); process.exit(1); }
  if (!env.SUPABASE_DB_HOST) console.error('host:', host);
  try { const r = await c.query(sql); const rs = Array.isArray(r) ? r : [r]; for (const x of rs) if (x.rows?.length) console.table(x.rows); console.log('OK'); }
  catch (e) { console.error('ERROR:', e.message); process.exitCode = 1; }
  await c.end(); process.exit();
}
console.error('no pooler host matched'); process.exit(1);
