// Servidor estático local para probar el sitio (URLs limpias como en Vercel). Uso: node scripts/servir.mjs [puerto]
import http from 'http';
import fs from 'fs';
import path from 'path';
const raiz = path.resolve(new URL('../site', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(raiz, p);
  if (!f.startsWith(raiz)) return res.writeHead(403).end();
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f.replace(/\/?$/, '') + '.html')) f = f.replace(/[\/]?$/, '') + '.html';
  if (!fs.existsSync(f)) return res.writeHead(404).end('404');
  res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}).listen(process.argv[2] || 5930);
