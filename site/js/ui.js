// Utilidades de interfaz compartidas: esqueletos, entrada escalonada, fundido de imágenes y toasts.
document.documentElement.classList.add('ui-js');

// Las imágenes de tarjetas aparecen con fundido al terminar de cargar (o si fallan, igual se muestran).
const marcarImagen = img => img.classList.add('ui-ok');
document.addEventListener('load', e => { if (e.target.tagName === 'IMG') marcarImagen(e.target); }, true);
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') marcarImagen(e.target); }, true);

export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function urlSegura(url) {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : '';
}

// Placeholders con la misma forma que el contenido real, para que nada salte al cargar.
export function esqueleto(el, tipo = 'tarjeta', n = 3) {
  if (!el) return;
  const linea = (w, cls = '') => `<span class="ui-skel ui-skel-line ${cls}" style="width:${w}%"></span>`;
  const tarjetaCls = el.classList.contains('actividades-grid') ? 'actividad-card' : 'noticia-card';
  const imgCls = tarjetaCls === 'actividad-card' ? 'actividad-img' : 'noticia-img';
  const bodyCls = tarjetaCls === 'actividad-card' ? 'actividad-body' : 'noticia-body';
  const plantillas = {
    tarjeta: () => `<div class="${tarjetaCls} ui-skel-card" aria-hidden="true"><div class="${imgCls}"></div><div class="${bodyCls}">${linea(35)}${linea(85, 'lg')}${linea(100)}${linea(70)}</div></div>`,
    fila: () => `<div class="ui-skel-row" aria-hidden="true"><span class="ui-skel ui-skel-badge"></span><div>${linea(60, 'lg')}${linea(90)}</div></div>`,
    bloque: () => `<div class="ui-skel-card" aria-hidden="true" style="padding:1.25rem 0">${linea(30)}${linea(75, 'lg')}${linea(100)}${linea(55)}</div>`
  };
  el.innerHTML = Array.from({ length: n }, plantillas[tipo] || plantillas.tarjeta).join('');
  el.setAttribute('aria-busy', 'true');
}

// Entrada escalonada de los hijos de un contenedor (máx. 8 con retraso, el resto juntos).
export function revelar(el) {
  if (!el) return;
  el.removeAttribute('aria-busy');
  [...el.children].forEach((hijo, i) => {
    hijo.style.setProperty('--i', Math.min(i, 8));
    hijo.classList.remove('ui-in');
    void hijo.offsetWidth;
    hijo.classList.add('ui-in');
  });
  el.querySelectorAll('img').forEach(img => { if (img.complete) marcarImagen(img); });
}

export function errorCarga(el, reintentar) {
  if (!el) return;
  el.removeAttribute('aria-busy');
  el.innerHTML = `<div class="ui-error">No pudimos cargar esta sección. Revisa tu conexión.<button type="button">Reintentar</button></div>`;
  el.querySelector('button').addEventListener('click', reintentar);
}

let pila;
export function toast(mensaje, { tipo = '', accion, alAccionar, duracion = 3500 } = {}) {
  if (!pila) {
    pila = document.createElement('div');
    pila.className = 'ui-toasts';
    pila.setAttribute('role', 'status');
    pila.setAttribute('aria-live', 'polite');
    document.body.appendChild(pila);
  }
  const t = document.createElement('div');
  t.className = `ui-toast ${tipo}`;
  t.innerHTML = `<span>${esc(mensaje)}</span>${accion ? `<button type="button">${esc(accion)}</button>` : ''}`;
  pila.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('abierto')));
  const cerrar = () => {
    t.classList.remove('abierto');
    setTimeout(() => t.remove(), 220);
  };
  const timer = setTimeout(cerrar, duracion);
  t.querySelector('button')?.addEventListener('click', () => { clearTimeout(timer); cerrar(); alAccionar?.(); });
  return cerrar;
}
