import { sb, AREAS, areaDelAdmin, subirArchivo } from '../../js/supabase.js';
import { cargarArea } from '../../js/datos.js';
import { toast, esc, urlSegura } from '../../js/ui.js';

// ─── ÍCONOS ───────────────────────────────────────────────────────────────────
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  mas: svg('<path d="M12 5v14M5 12h14"/>'),
  lapiz: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  basura: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  imagen: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>')
};

// ─── CONFIGURACIÓN DE SECCIONES ───────────────────────────────────────────────
const CATEGORIAS = { anuncio: 'Anuncio', logro: 'Logro', evento: 'Evento', info: 'Información' };
const CAT_PROPUESTA = { participacion: 'Participación', comunicacion: 'Comunicación', transparencia: 'Transparencia', ambiente: 'Ambiente' };
const ESTADOS = { pendiente: 'Pendiente', en_progreso: 'En progreso', cumplida: 'Cumplida' };

const hoy = () => new Date().toLocaleDateString('en-CA');
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmtFecha = f => {
  if (!f) return '';
  const [y, m, d] = String(f).slice(0, 10).split('-');
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]} ${y}`;
};
const recorte = (t, n = 90) => (t && t.length > n ? t.slice(0, n).trimEnd() + '…' : t || '');

const SECCIONES = [
  {
    id: 'noticias', nav: 'Noticias', titulo: 'Noticias publicadas', singular: 'noticia', genero: 'a',
    tabla: 'noticias', orden: ['fecha', false], foto: true,
    campos: [
      { k: 'titulo', l: 'Título', req: true },
      { k: 'fecha', l: 'Fecha', t: 'date', req: true, def: hoy },
      { k: 'categoria', l: 'Categoría', t: 'select', ops: CATEGORIAS, def: () => 'anuncio' },
      { k: 'foto_url', l: 'Foto', t: 'imagen' },
      { k: 'resumen', l: 'Resumen', t: 'textarea', filas: 5, req: true }
    ],
    meta: r => `<span>${fmtFecha(r.fecha)}</span><span class="tag">${esc(CATEGORIAS[r.categoria] || r.categoria)}</span>`
  },
  {
    id: 'actividades', nav: 'Actividades', titulo: 'Actividades', singular: 'actividad', genero: 'a',
    tabla: 'actividades', orden: ['fecha', false], foto: true,
    campos: [
      { k: 'titulo', l: 'Título', req: true },
      { k: 'fecha', l: 'Fecha', t: 'date', req: true, def: hoy },
      { k: 'foto_url', l: 'Foto', t: 'imagen' },
      { k: 'descripcion', l: 'Descripción', t: 'textarea', filas: 5 }
    ],
    meta: r => `<span>${fmtFecha(r.fecha)}</span>`
  },
  {
    id: 'eventos', nav: 'Calendario', titulo: 'Eventos del calendario', singular: 'evento', genero: 'o',
    tabla: 'eventos', orden: ['fecha', true],
    campos: [
      { k: 'titulo', l: 'Título del evento', req: true },
      { k: 'fecha', l: 'Fecha', t: 'date', req: true, def: hoy },
      { k: 'descripcion', l: 'Descripción', t: 'textarea', filas: 4 }
    ],
    meta: r => `<span>${fmtFecha(r.fecha)}</span>${r.fecha >= hoy() ? '<span class="tag ok">Próximo</span>' : '<span class="tag">Pasado</span>'}`
  },
  {
    id: 'avisos', areas: ['pfc'], nav: 'Avisos', titulo: 'Avisos', singular: 'aviso', genero: 'o',
    tabla: 'avisos', orden: ['fecha', false],
    campos: [
      { k: 'titulo', l: 'Título', req: true },
      { k: 'fecha', l: 'Fecha', t: 'date', req: true, def: hoy },
      { k: 'texto', l: 'Texto', t: 'textarea', filas: 4 }
    ],
    meta: r => `<span>${fmtFecha(r.fecha)}</span>`
  },
  {
    id: 'documentos', areas: ['personeria'], nav: 'Documentos', titulo: 'Documentos', singular: 'documento', genero: 'o',
    tabla: 'documentos', orden: ['orden', true],
    campos: [
      { k: 'titulo', l: 'Título', req: true },
      { k: 'descripcion', l: 'Descripción', t: 'textarea', filas: 3 },
      { k: 'icono', l: 'Ícono (emoji)', def: () => '📄', ancho: 'corto' },
      { k: 'url', l: 'Archivo o enlace', t: 'archivo' }
    ],
    meta: r => (urlSegura(r.url) ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" class="tag ok">Abrir ↗</a>` : '<span class="tag aviso">Sin archivo</span>') + `<span>${esc(recorte(r.descripcion, 60))}</span>`
  },
  {
    id: 'informes', areas: ['contraloria'], nav: 'Informes', titulo: 'Informes', singular: 'informe', genero: 'o',
    tabla: 'informes', orden: ['fecha', false],
    campos: [
      { k: 'titulo', l: 'Título', req: true },
      { k: 'periodo', l: 'Periodo', ph: 'Primer periodo 2026' },
      { k: 'fecha', l: 'Fecha', t: 'date', req: true, def: hoy },
      { k: 'resumen', l: 'Resumen', t: 'textarea', filas: 3 },
      { k: 'logros', l: 'Logros', t: 'lista', hint: 'Uno por línea.' },
      { k: 'pendientes', l: 'Pendientes', t: 'lista', hint: 'Uno por línea.' },
      { k: 'archivo_url', l: 'Archivo del informe', t: 'archivo' }
    ],
    meta: r => `<span>${esc(r.periodo)}</span>` + (urlSegura(r.archivo_url) ? '<span class="tag ok">Con archivo</span>' : '<span class="tag aviso">Sin archivo</span>')
  },
  {
    id: 'propuestas', areas: ['contraloria'], nav: 'Propuestas', titulo: 'Propuestas', singular: 'propuesta', genero: 'a',
    tabla: 'propuestas', orden: ['numero', true],
    campos: [
      { k: 'numero', l: 'Número', t: 'number', ancho: 'corto' },
      { k: 'titulo', l: 'Título', req: true },
      { k: 'descripcion', l: 'Descripción', t: 'textarea', filas: 3 },
      { k: 'categoria', l: 'Categoría', t: 'select', ops: CAT_PROPUESTA, def: () => 'participacion' },
      { k: 'estado', l: 'Estado', t: 'select', ops: ESTADOS, def: () => 'pendiente' }
    ],
    meta: r => `<span class="tag">${esc(CAT_PROPUESTA[r.categoria] || r.categoria)}</span>
      <select class="estado-rapido" data-id="${r.id}" aria-label="Estado">${Object.entries(ESTADOS).map(([v, l]) => `<option value="${v}" ${r.estado === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`
  },
  { id: 'semaforo', areas: ['contraloria'], nav: 'Semáforo', especial: true },
  { id: 'perfil', nav: 'Perfil', especial: true }
];

// ─── ESTADO ───────────────────────────────────────────────────────────────────
const E = { area: null, filas: {}, perfil: null, semaforo: null, seccion: null, filtro: 'todas' };
const $ = sel => document.querySelector(sel);
const main = $('#main');
const secciones = () => SECCIONES.filter(s => !s.areas || s.areas.includes(E.area));
const cfg = id => SECCIONES.find(s => s.id === id);
const refrescarSitio = () => cargarArea(E.area).catch(() => {});

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────
const { data: { session } } = await sb.auth.getSession();
E.area = session ? await areaDelAdmin() : null;
if (!E.area) {
  if (session) await sb.auth.signOut();
  location.replace('/admin/');
} else {
  document.body.dataset.rol = E.area;
  $('#area-nombre').textContent = AREAS[E.area].nombre;
  $('#user-email').textContent = session.user.email;
  $('#link-sitio').href = AREAS[E.area].ruta;
  document.title = `Panel · ${AREAS[E.area].nombre}`;
  $('#logout-btn').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.replace('/admin/');
  });
  await cargarTodo();
  pintarNav();
  aplicarHash();
  window.addEventListener('hashchange', aplicarHash);
  $('#cargando').classList.add('fuera');
}

async function cargarTodo() {
  const listas = secciones().filter(s => s.tabla);
  const [perfil, sem, ...res] = await Promise.all([
    sb.from('areas').select('*').eq('id', E.area).single(),
    sb.from('semaforo').select('*').eq('area', E.area).maybeSingle(),
    ...listas.map(s => sb.from(s.tabla).select('*').eq('area', E.area).order(s.orden[0], { ascending: s.orden[1] }).order('id', { ascending: false }))
  ]);
  const error = [perfil, sem, ...res].find(r => r.error)?.error;
  if (error) toast('Error cargando datos: ' + error.message, { tipo: 'error', duracion: 8000 });
  E.perfil = perfil.data;
  E.semaforo = sem.data;
  listas.forEach((s, i) => { E.filas[s.id] = res[i].data || []; });
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
function pintarNav() {
  $('#nav').innerHTML = secciones().map(s => {
    const filas = E.filas[s.id];
    const sinFoto = s.foto && filas?.some(r => !r.foto_url);
    return `<button class="nav-item ${E.seccion === s.id ? 'active' : ''}" data-ir="${s.id}">
      ${esc(s.nav)}${sinFoto ? '<span class="nav-alerta" title="Hay publicaciones sin foto"></span>' : ''}
      ${filas ? `<span class="nav-count">${filas.length}</span>` : ''}</button>`;
  }).join('');
}

$('#nav').addEventListener('click', e => {
  const b = e.target.closest('[data-ir]');
  if (b) ir(b.dataset.ir);
});

function ir(id, { sinHash = false } = {}) {
  if (!secciones().some(s => s.id === id)) id = secciones()[0].id;
  if (E.seccion !== id) E.filtro = 'todas';
  E.seccion = id;
  if (!sinHash) history.replaceState(null, '', '#' + id);
  pintarNav();
  document.querySelector('.nav-item.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  pintarSeccion();
}

// #noticias · #nuevo=noticias · #editar=noticias:12
function aplicarHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [accion, valor] = h.split('=');
  if (accion === 'nuevo' && cfg(valor)) {
    ir(valor);
    abrirModal(cfg(valor));
  } else if (accion === 'editar' && valor) {
    const [id, fila] = valor.split(':');
    ir(id);
    const r = E.filas[id]?.find(x => String(x.id) === fila);
    if (r) abrirModal(cfg(id), r);
  } else {
    ir(h || 'noticias', { sinHash: !h });
  }
}

// ─── SECCIONES ────────────────────────────────────────────────────────────────
function pintarSeccion() {
  const s = cfg(E.seccion);
  window.scrollTo({ top: 0 });
  if (s.id === 'semaforo') return pintarSemaforo();
  if (s.id === 'perfil') return pintarPerfil();

  const todas = E.filas[s.id] || [];
  const sinFoto = s.foto ? todas.filter(r => !r.foto_url) : [];
  if (E.filtro === 'sin-foto' && !sinFoto.length) E.filtro = 'todas';
  const filas = E.filtro === 'sin-foto' ? sinFoto : todas;
  const nueva = `Nuev${s.genero} ${s.singular}`;

  main.innerHTML = `
    <section class="seccion">
      <div class="page-header">
        <div>
          <h1 class="page-title">${esc(s.titulo)}</h1>
          <p class="page-sub">${todas.length} en total${sinFoto.length ? ` · ${sinFoto.length} sin foto` : ''}</p>
        </div>
        <button class="btn-add" data-nuevo>${ICON.mas}${nueva}</button>
      </div>
      ${sinFoto.length ? `<div class="filtros">
        <button class="filtro ${E.filtro === 'todas' ? 'active' : ''}" data-filtro="todas">Todas (${todas.length})</button>
        <button class="filtro ${E.filtro === 'sin-foto' ? 'active' : ''}" data-filtro="sin-foto">Sin foto (${sinFoto.length})</button>
      </div>` : ''}
      <div class="lista" id="lista">
        ${filas.length ? filas.map((r, i) => fila(s, r, i)).join('') : `<div class="vacio">Todavía no hay ${esc(s.titulo.toLowerCase())}.<br><button class="btn-add" data-nuevo>${ICON.mas}${nueva}</button></div>`}
      </div>
    </section>`;
  main.querySelectorAll('.thumb img').forEach(img => img.complete && img.classList.add('ok'));
}

function fila(s, r, i = 0) {
  const url = urlSegura(r.foto_url);
  const thumb = !s.foto ? '' : url
    ? `<button class="thumb" data-foto title="Cambiar foto"><img src="${esc(url)}" alt="" loading="lazy" onload="this.classList.add('ok')"><span class="thumb-hover">Cambiar</span></button>`
    : `<button class="thumb vacia" data-foto title="Asociar imagen">${ICON.imagen}Asociar</button>`;
  return `<div class="data-card" data-id="${r.id}" style="--i:${Math.min(i, 10)}">
    ${thumb}
    <div class="data-info">
      <h3>${s.id === 'propuestas' ? `<span style="color:var(--text-muted)">${String(r.numero).padStart(2, '0')}</span> ` : ''}${esc(r.titulo)}</h3>
      <div class="data-meta">${s.meta(r)}</div>
    </div>
    <div class="data-actions">
      <button class="btn-icon" data-editar title="Editar" aria-label="Editar">${ICON.lapiz}</button>
      <button class="btn-icon delete" data-borrar title="Eliminar" aria-label="Eliminar">${ICON.basura}</button>
    </div>
  </div>`;
}

main.addEventListener('click', e => {
  const s = cfg(E.seccion);
  if (e.target.closest('[data-nuevo]')) return abrirModal(s);
  const f = e.target.closest('[data-filtro]');
  if (f) { E.filtro = f.dataset.filtro; return pintarSeccion(); }
  const card = e.target.closest('.data-card');
  if (!card) return;
  const r = E.filas[s.id].find(x => String(x.id) === card.dataset.id);
  if (e.target.closest('[data-editar]')) abrirModal(s, r);
  else if (e.target.closest('[data-borrar]')) borrar(s, r, card);
  else if (e.target.closest('[data-foto]')) elegirArchivo('image/*', file => fotoRapida(s, r, card, file));
});

// Cambio de estado de una propuesta sin abrir el formulario.
main.addEventListener('change', async e => {
  const sel = e.target.closest('.estado-rapido');
  if (!sel) return;
  const r = E.filas.propuestas.find(x => String(x.id) === sel.dataset.id);
  const antes = r.estado;
  r.estado = sel.value;
  const { error } = await sb.from('propuestas').update({ estado: sel.value }).eq('id', r.id);
  if (error) { r.estado = antes; sel.value = antes; return toast(error.message, { tipo: 'error' }); }
  toast(`Estado: ${ESTADOS[sel.value]}`);
  refrescarSitio();
});

// Arrastrar una imagen sobre la miniatura de una fila.
main.addEventListener('dragover', e => {
  const t = e.target.closest('.thumb');
  if (!t) return;
  e.preventDefault();
  t.classList.add('soltar');
});
main.addEventListener('dragleave', e => e.target.closest('.thumb')?.classList.remove('soltar'));
main.addEventListener('drop', e => {
  const t = e.target.closest('.thumb');
  if (!t) return;
  e.preventDefault();
  t.classList.remove('soltar');
  const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
  const card = t.closest('.data-card');
  const s = cfg(E.seccion);
  if (file) fotoRapida(s, E.filas[s.id].find(x => String(x.id) === card.dataset.id), card, file);
});

function elegirArchivo(accept, alElegir) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.addEventListener('change', () => input.files[0] && alElegir(input.files[0]));
  input.click();
}

async function fotoRapida(s, r, card, file) {
  const thumb = card.querySelector('.thumb');
  thumb.insertAdjacentHTML('beforeend', '<span class="thumb-cargando"><span class="spinner"></span></span>');
  try {
    const url = await subirArchivo(E.area, file, s.tabla);
    const { error } = await sb.from(s.tabla).update({ foto_url: url }).eq('id', r.id);
    if (error) throw error;
    r.foto_url = url;
    await new Promise(res => { const img = new Image(); img.onload = img.onerror = res; img.src = url; });
    reemplazarFila(s, r);
    pintarNav();
    actualizarSub(s);
    toast('Imagen asociada');
    refrescarSitio();
  } catch (err) {
    thumb.querySelector('.thumb-cargando')?.remove();
    toast(err.message || 'No se pudo subir la imagen', { tipo: 'error' });
  }
}

function reemplazarFila(s, r, destacar = false) {
  const vieja = main.querySelector(`.data-card[data-id="${r.id}"]`);
  const tmp = document.createElement('div');
  tmp.innerHTML = fila(s, r);
  const nueva = tmp.firstElementChild;
  nueva.style.animation = 'none';
  if (vieja) vieja.replaceWith(nueva);
  if (destacar) {
    nueva.classList.add('destacar');
    nueva.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setTimeout(() => nueva.classList.remove('destacar'), 1600);
  }
}

function actualizarSub(s) {
  const todas = E.filas[s.id];
  const sinFoto = s.foto ? todas.filter(r => !r.foto_url).length : 0;
  const sub = main.querySelector('.page-sub');
  if (sub) sub.textContent = `${todas.length} en total${sinFoto ? ` · ${sinFoto} sin foto` : ''}`;
}

async function borrar(s, r, card) {
  card.classList.add('saliendo');
  const { error } = await sb.from(s.tabla).delete().eq('id', r.id);
  if (error) {
    card.classList.remove('saliendo');
    return toast('No se pudo eliminar: ' + error.message, { tipo: 'error' });
  }
  E.filas[s.id] = E.filas[s.id].filter(x => x !== r);
  setTimeout(() => { pintarSeccion(); pintarNav(); }, 200);
  refrescarSitio();
  const nombre = s.singular[0].toUpperCase() + s.singular.slice(1);
  toast(`${nombre} eliminad${s.genero}`, {
    accion: 'Deshacer',
    duracion: 7000,
    alAccionar: async () => {
      const { id, created_at, ...copia } = r;
      const { data, error: err } = await sb.from(s.tabla).insert(copia).select().single();
      if (err) return toast(err.message, { tipo: 'error' });
      E.filas[s.id].push(data);
      ordenar(s);
      pintarSeccion();
      pintarNav();
      reemplazarFila(s, data, true);
      refrescarSitio();
    }
  });
}

function ordenar(s) {
  const [col, asc] = s.orden;
  E.filas[s.id].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : b.id - a.id) * (asc ? 1 : -1));
}

// ─── CAMPOS DE FORMULARIO (modal y perfil) ────────────────────────────────────
function campoHTML(c, valor) {
  const id = `f-${c.k}`;
  const req = c.req ? 'required' : '';
  const hint = c.hint ? `<p class="form-hint">${esc(c.hint)}</p>` : '';
  const estilo = c.ancho === 'corto' ? 'style="max-width:160px"' : '';
  switch (c.t) {
    case 'textarea':
      return `<div class="form-group"><label for="${id}">${c.l}</label><textarea id="${id}" name="${c.k}" rows="${c.filas || 4}" ${req}>${esc(valor)}</textarea>${hint}</div>`;
    case 'lista':
      return `<div class="form-group"><label for="${id}">${c.l}</label><textarea id="${id}" name="${c.k}" rows="3">${esc((valor || []).join('\n'))}</textarea>${hint}</div>`;
    case 'select':
      return `<div class="form-group"><label for="${id}">${c.l}</label><select id="${id}" name="${c.k}">${Object.entries(c.ops).map(([v, l]) => `<option value="${v}" ${valor === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    case 'imagen':
      return `<div class="form-group"><span class="form-label">${c.l}</span>
        <div class="dropzone" data-imagen="${c.k}">
          <div class="dropzone-preview"></div>
          <div class="dropzone-texto"><strong>Arrastra una foto aquí</strong>o elígela desde tu dispositivo. Se optimiza sola para que cargue rápido.
            <div class="dropzone-botones"><button type="button" class="btn-mini" data-elegir>Elegir foto</button><button type="button" class="btn-mini peligro" data-quitar>Quitar</button></div>
          </div>
          <input type="hidden" name="${c.k}" value="${esc(valor)}">
        </div></div>`;
    case 'archivo':
      return `<div class="form-group"><label for="${id}">${c.l}</label>
        <input type="url" id="${id}" name="${c.k}" value="${esc(valor)}" placeholder="https://drive.google.com/…">
        <div class="dropzone-botones"><button type="button" class="btn-mini" data-subir-pdf="${c.k}">Subir PDF o imagen</button></div>
        <p class="form-hint">Pega un enlace o sube el archivo (máx. 10 MB).</p></div>`;
    default:
      return `<div class="form-group"><label for="${id}">${c.l}</label><input id="${id}" name="${c.k}" type="${c.t || 'text'}" value="${esc(valor)}" ${req} ${estilo} ${c.ph ? `placeholder="${esc(c.ph)}"` : ''}>${hint}</div>`;
  }
}

// Activa los campos de imagen/archivo dentro de un contenedor. `ocupado(bool)` bloquea el guardado mientras sube.
function activarCampos(cont, ocupado, carpeta) {
  cont.querySelectorAll('[data-imagen]').forEach(dz => {
    const input = dz.querySelector('input[type=hidden]');
    const prev = dz.querySelector('.dropzone-preview');
    const quitar = dz.querySelector('[data-quitar]');
    const pintar = url => {
      prev.style.backgroundImage = url ? `url("${url}")` : '';
      prev.innerHTML = url ? '' : ICON.imagen;
      quitar.classList.toggle('hidden', !url);
      dz.querySelector('[data-elegir]').textContent = url ? 'Cambiar foto' : 'Elegir foto';
    };
    pintar(input.value);
    const subir = async file => {
      const local = URL.createObjectURL(file);
      pintar(local);
      prev.innerHTML = '<span class="spinner" style="color:#fff"></span>';
      ocupado(true);
      try {
        input.value = await subirArchivo(E.area, file, carpeta);
        pintar(input.value);
      } catch (err) {
        pintar(input.value);
        toast(err.message || 'No se pudo subir la imagen', { tipo: 'error' });
      } finally {
        URL.revokeObjectURL(local);
        ocupado(false);
      }
    };
    dz.querySelector('[data-elegir]').addEventListener('click', () => elegirArchivo('image/*', subir));
    quitar.addEventListener('click', () => { input.value = ''; pintar(''); });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('soltar'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('soltar'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('soltar');
      const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
      if (file) subir(file);
    });
  });
  cont.querySelectorAll('[data-subir-pdf]').forEach(b => {
    b.addEventListener('click', () => elegirArchivo('application/pdf,image/*', async file => {
      const texto = b.textContent;
      b.innerHTML = '<span class="spinner"></span>';
      ocupado(true);
      try {
        cont.querySelector(`[name="${b.dataset.subirPdf}"]`).value = await subirArchivo(E.area, file, 'documentos');
        toast('Archivo subido');
      } catch (err) {
        toast(err.message || 'No se pudo subir el archivo', { tipo: 'error' });
      } finally {
        b.textContent = texto;
        ocupado(false);
      }
    }));
  });
}

function leerCampos(form, campos) {
  const datos = {};
  for (const c of campos) {
    const el = form.querySelector(`[name="${c.k}"]`);
    if (!el) continue;
    let v = el.value.trim();
    if (c.t === 'lista') v = v.split('\n').map(x => x.trim()).filter(Boolean);
    if (c.t === 'number') v = parseInt(v) || 0;
    if (c.t === 'archivo' && v && !/^https?:\/\//i.test(v)) v = 'https://' + v;
    datos[c.k] = v;
  }
  return datos;
}

function validar(form) {
  let primero = null;
  form.querySelectorAll('[required]').forEach(el => {
    const mal = !el.value.trim();
    el.setAttribute('aria-invalid', mal);
    el.style.borderColor = mal ? 'var(--error)' : '';
    if (mal && !primero) primero = el;
  });
  primero?.focus();
  return !primero;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
const modal = $('#modal');
const form = $('#modal-form');
const btnGuardar = $('#modal-guardar');
let modalCtx = null;
let subiendo = 0;
let inicial = '';

function abrirModal(s, r = null) {
  modalCtx = { s, r };
  $('#modal-title').textContent = r ? `Editar ${s.singular}` : `Nuev${s.genero} ${s.singular}`;
  $('#modal-campos').innerHTML = s.campos.map(c => campoHTML(c, r ? r[c.k] : c.def?.() ?? '')).join('');
  activarCampos($('#modal-campos'), on => {
    subiendo += on ? 1 : -1;
    btnGuardar.disabled = subiendo > 0;
    btnGuardar.textContent = subiendo > 0 ? 'Subiendo foto…' : 'Guardar';
  }, s.tabla);
  inicial = JSON.stringify(leerCampos(form, s.campos));
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => form.querySelector('input:not([type=hidden]), textarea')?.focus({ preventScroll: true }), 60);
}

function cerrarModal(forzar = false) {
  if (!modal.classList.contains('active')) return;
  const cambios = modalCtx && JSON.stringify(leerCampos(form, modalCtx.s.campos)) !== inicial;
  if (!forzar && cambios && !confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (/^#(nuevo|editar)=/.test(location.hash)) history.replaceState(null, '', '#' + E.seccion);
}

modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-cerrar]')) cerrarModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (subiendo > 0 || !validar(form)) return;
  const { s, r } = modalCtx;
  const datos = leerCampos(form, s.campos);
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<span class="spinner"></span>Guardando…';
  const consulta = r
    ? sb.from(s.tabla).update(datos).eq('id', r.id).select().single()
    : sb.from(s.tabla).insert({ ...datos, area: E.area }).select().single();
  const { data, error } = await consulta;
  btnGuardar.disabled = false;
  btnGuardar.textContent = 'Guardar';
  if (error) return toast('No se pudo guardar: ' + error.message, { tipo: 'error' });

  if (r) Object.assign(r, data);
  else E.filas[s.id].push(data);
  ordenar(s);
  cerrarModal(true);
  E.filtro = 'todas';
  pintarSeccion();
  pintarNav();
  reemplazarFila(s, data, true);
  toast(r ? 'Cambios guardados' : `${s.singular[0].toUpperCase() + s.singular.slice(1)} publicad${s.genero}`);
  refrescarSitio();
});

// ─── SEMÁFORO ─────────────────────────────────────────────────────────────────
function pintarSemaforo() {
  const s = E.semaforo || { verde: [], amarillo: [], rojo: [] };
  const col = (k, titulo, color) => `<div class="form-group"><div class="sem-titulo" style="--c:${color}">${titulo}</div>
    <textarea name="${k}" rows="7" placeholder="Un elemento por línea…">${esc((s[k] || []).join('\n'))}</textarea></div>`;
  main.innerHTML = `
    <section class="seccion">
      <div class="page-header"><div>
        <h1 class="page-title">Semáforo institucional</h1>
        <p class="page-sub">${s.actualizado ? `Última actualización: ${fmtFecha(s.actualizado)}` : 'Sin actualizar todavía'}</p>
      </div></div>
      <div class="dashboard-info-box">Escribe un elemento por línea. Al guardar, se publica de inmediato en la página de Contraloría.</div>
      <form class="panel" id="form-sem">
        <div class="sem-grid">${col('verde', 'Está bien', '#27AE60')}${col('amarillo', 'Se puede mejorar', '#F39C12')}${col('rojo', 'Necesita atención', '#E74C3C')}</div>
        <div class="panel-actions"><button class="btn-primary btn-auto" type="submit">Guardar semáforo</button></div>
      </form>
    </section>`;
  $('#form-sem').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const lista = k => e.target.querySelector(`[name=${k}]`).value.split('\n').map(x => x.trim()).filter(Boolean);
    const fila = { area: E.area, verde: lista('verde'), amarillo: lista('amarillo'), rojo: lista('rojo'), actualizado: hoy() };
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Guardando…';
    const { error } = await sb.from('semaforo').upsert(fila);
    btn.disabled = false;
    btn.textContent = 'Guardar semáforo';
    if (error) return toast('No se pudo guardar: ' + error.message, { tipo: 'error' });
    E.semaforo = fila;
    main.querySelector('.page-sub').textContent = `Última actualización: ${fmtFecha(fila.actualizado)}`;
    toast('Semáforo publicado');
    refrescarSitio();
  });
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────
function camposPerfil() {
  const c = [
    { k: 'nombre', l: 'Nombre del representante', req: true },
    { k: 'cargo', l: 'Cargo' },
    { k: 'slogan', l: 'Eslogan' },
    { k: 'objetivo', l: 'Objetivo de la página', t: 'textarea', filas: 4 },
    { k: 'whatsapp', l: 'WhatsApp', ph: '300 123 4567' }
  ];
  if (E.area === 'contraloria') c.push({ k: 'instagram', l: 'Instagram (sin @)' });
  c.push({ k: 'buzon_url', l: 'Enlace del buzón (Formspree)', t: 'url', hint: 'A dónde llegan los mensajes del buzón.' });
  if (E.area === 'contraloria') c.push({ k: 'equipo', l: 'Equipo', t: 'lista', hint: 'Una persona por línea: Nombre — Rol. La primera es la contralora.' });
  return c;
}

function pintarPerfil() {
  const p = { ...E.perfil, equipo: (E.perfil.equipo || []).map(m => `${m.nombre} — ${m.rol}`) };
  const campos = camposPerfil();
  main.innerHTML = `
    <section class="seccion">
      <div class="page-header"><div>
        <h1 class="page-title">Perfil</h1>
        <p class="page-sub">Lo que se muestra en el encabezado y el pie de ${esc(AREAS[E.area].nombre)}.</p>
      </div></div>
      <form class="panel" id="form-perfil" novalidate>
        ${campos.map(c => campoHTML(c, p[c.k])).join('')}
        <div class="panel-actions"><button class="btn-primary btn-auto" type="submit">Guardar perfil</button></div>
      </form>
    </section>`;
  $('#form-perfil').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar(e.target)) return;
    const btn = e.target.querySelector('button[type=submit]');
    const datos = leerCampos(e.target, campos);
    if (datos.equipo) {
      datos.equipo = datos.equipo.map(l => {
        const [nombre, rol = 'Equipo'] = l.split(/\s+[—–-]\s+/);
        return { nombre: nombre.trim(), rol: rol.trim() };
      });
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Guardando…';
    const { data, error } = await sb.from('areas').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', E.area).select().single();
    btn.disabled = false;
    btn.textContent = 'Guardar perfil';
    if (error) return toast('No se pudo guardar: ' + error.message, { tipo: 'error' });
    E.perfil = data;
    toast('Perfil actualizado');
    refrescarSitio();
  });
}
