import { iniciarArea, datosEnCache } from '../../js/datos.js';
import { esc, urlSegura, esqueleto, revelar, errorCarga, toast } from '../../js/ui.js';
import { sb } from '../../js/supabase.js';
import '../../js/admin-inline.js';

// ─── DATA ───────────────────────────────────────────────────────────────────
let DATA = {};
let activeFilter = 'todas';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name || typeof name !== 'string') return '';
  return name.split(' ').slice(0, 2).filter(Boolean).map(w => w[0]).join('').toUpperCase();
}

function formatDate(str) {
  if (!str) return '';
  const parts = String(str).split('T')[0].split('-');
  if (parts.length < 3) return str;
  const [y, m, d] = parts;
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1] || '?'} ${y}`;
}

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  cumplida: 'Cumplida'
};

const CAT_LABELS = {
  participacion: 'Participación',
  comunicacion: 'Comunicación',
  transparencia: 'Transparencia',
  ambiente: 'Ambiente'
};

// ─── RENDER: HERO ─────────────────────────────────────────────────────────────
function renderHero() {
  const p = DATA.contraloria || {};

  const nombreEl = document.getElementById('hero-nombre');
  if (nombreEl) nombreEl.textContent = p.nombre;

  const sloganEl = document.getElementById('hero-slogan');
  if (sloganEl) sloganEl.textContent = p.slogan;

  // Stats
  const propuestas = DATA.propuestas || [];
  const cumplidas = propuestas.filter(p => p.estado === 'cumplida').length;
  
  const statPropuestas = document.getElementById('stat-propuestas');
  if (statPropuestas) statPropuestas.textContent = propuestas.length;

  const statCumplidas = document.getElementById('stat-cumplidas');
  if (statCumplidas) statCumplidas.textContent = cumplidas;

  const statEquipo = document.getElementById('stat-equipo');
  if (statEquipo) statEquipo.textContent = (p.equipo || []).length;

  // Instagram link
  const igLinks = document.querySelectorAll('[data-instagram]');
  igLinks.forEach(el => {
    const ig = p.redes && p.redes.instagram;
    if (ig) {
      el.href = 'https://instagram.com/' + ig;
      el.textContent = '@' + ig;
      el.style.display = 'inline';
    } else {
      el.style.display = 'none';
    }
  });

  // WhatsApp link
  const waLinks = document.querySelectorAll('[data-whatsapp]');
  waLinks.forEach(el => {
    const wa = p.redes && p.redes.whatsapp;
    if (wa) {
      el.href = 'https://wa.me/57' + String(wa).replace(/\s+/g, '');
      el.textContent = 'WhatsApp';
      el.style.display = 'inline';
    } else {
      el.style.display = 'none';
    }
  });
}

// ─── RENDER: PROPUESTAS ──────────────────────────────────────────────────────
function renderPropuestas(filter) {
  const container = document.getElementById('props-container');
  if (!container) return;

  let lista = DATA.propuestas || [];
  if (filter && filter !== 'todas') lista = lista.filter(p => p.categoria === filter || p.estado === filter);

  if (lista.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No hay propuestas en esta categoría aún.</p></div>`;
    return;
  }

  container.innerHTML = lista.map(p => `
    <div class="prop-card" data-cat="${esc(p.categoria)}" data-estado="${esc(p.estado)}">
      <div class="prop-card-top">
        <span class="prop-num">${esc(String(p.id).padStart(2,'0'))}</span>
        <span class="prop-cat">${esc(CAT_LABELS[p.categoria] || p.categoria)}</span>
      </div>
      <div class="prop-title">${esc(p.titulo)}</div>
      <div class="prop-desc">${esc(p.descripcion)}</div>
      <span class="estado-badge estado-${esc(p.estado)}">${esc(ESTADO_LABELS[p.estado])}</span>
    </div>
  `).join('');
}

let filtrosListos = false;
function initFilterButtons() {
  if (filtrosListos) return;
  filtrosListos = true;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderPropuestas(activeFilter);
      revelar(document.getElementById('props-container'));
    });
  });
}

// ─── RENDER: SEMÁFORO ─────────────────────────────────────────────────────────
function renderSemaforo() {
  const s = DATA.semaforo;
  if (!s) return;

  ['verde', 'amarillo', 'rojo'].forEach(color => {
    const container = document.getElementById(`sem-${color}`);
    if (!container) return;
    const items = s[color] || [];
    container.innerHTML = items.length
      ? items.map(i => `<li>${esc(i)}</li>`).join('')
      : '<li><em>Sin registros aún</em></li>';
  });

  const fechaEl = document.getElementById('sem-fecha');
  if (fechaEl && s.ultima_actualizacion) {
    fechaEl.textContent = `Última actualización: ${esc(formatDate(s.ultima_actualizacion))}`;
  }
}

// ─── RENDER: INFORMES ─────────────────────────────────────────────────────────
function renderInformes() {
  const container = document.getElementById('informes-container');
  if (!container) return;

  if (!DATA.informes || DATA.informes.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📄</div><p>Aún no hay informes publicados. Pronto estarán disponibles.</p></div>`;
    return;
  }

  container.innerHTML = DATA.informes.map(inf => {
    const cleanUrl = urlSegura(inf.archivo_url);
    return `
      <div class="informe-card">
        <div>
          <div class="informe-periodo">${esc(inf.periodo)}</div>
          <div class="informe-titulo">${esc(inf.titulo)}</div>
          <div class="informe-resumen">${esc(inf.resumen)}</div>
          <div class="informe-tags">
            ${(inf.logros || []).slice(0,2).map(l => `<span class="informe-tag">✓ ${esc(l)}</span>`).join('')}
            ${(inf.pendientes || []).length ? `<span class="informe-tag">⏳ ${inf.pendientes.length} pendiente(s)</span>` : ''}
          </div>
        </div>
        ${cleanUrl
          ? `<a class="btn-descargar" href="${esc(cleanUrl)}" target="_blank" rel="noopener">↓ Descargar</a>`
          : `<span class="btn-descargar" style="opacity:0.4;cursor:default;">Próximamente</span>`
        }
      </div>
    `;
  }).join('');
}

// ─── RENDER: ACTIVIDADES ─────────────────────────────────────────────────────
function renderActividades() {
  const container = document.getElementById('actividades-container');
  if (!container) return;

  if (!DATA.actividades || DATA.actividades.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📸</div><p>Las actividades aparecerán aquí cuando se realicen.</p></div>`;
    return;
  }

  container.innerHTML = DATA.actividades.slice().reverse().map(a => {
    const cleanFotoUrl = urlSegura(a.foto_url);
    return `
      <div class="actividad-card" data-tabla="actividades" data-id="${a.id}" data-foto="${esc(cleanFotoUrl)}">
        <div class="actividad-img">
          ${cleanFotoUrl
            ? `<img class="ui-foto" src="${esc(cleanFotoUrl)}" alt="${esc(a.titulo)}" loading="lazy" decoding="async">`
            : `<img class="ui-logo" src="/assets/images/logo-cont.png" alt="" style="width:70px;height:70px;object-fit:contain;border-radius:50%;" onerror="this.style.display='none'">`}
        </div>
        <div class="actividad-body">
          <div class="actividad-fecha">${esc(formatDate(a.fecha))}</div>
          <div class="actividad-titulo">${esc(a.titulo)}</div>
          <div class="actividad-desc">${esc(a.descripcion)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── RENDER: EQUIPO ───────────────────────────────────────────────────────────
function renderEquipo() {
  const container = document.getElementById('equipo-container');
  if (!container) return;
  const equipo = (DATA.contraloria && DATA.contraloria.equipo) || [];

  container.innerHTML = equipo.map((m, i) => {
    const esContralora = i === 0;
    const avatarImg = esContralora
      ? `<img src="/assets/images/logo-cont.png" alt="${esc(m.nombre)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.outerHTML='<span>${esc(initials(m.nombre))}</span>'">` 
      : `<span>${esc(initials(m.nombre))}</span>`;
    return `
      <div class="eq-card ${esContralora ? 'contralora' : ''}">
        <div class="eq-avatar">${avatarImg}</div>
        <div class="eq-nombre">${esc(m.nombre)}</div>
        <div class="eq-rol">${esc(esContralora ? 'Contralora' : m.rol)}</div>
      </div>
    `;
  }).join('');
}

// ─── RENDER: NOTICIAS ────────────────────────────────────────────────────────
function renderNoticias() {
  const container = document.getElementById('noticias-container');
  if (!container) return;

  if (!DATA.noticias || DATA.noticias.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📰</div><p>Aún no hay noticias publicadas.</p></div>`;
    return;
  }

  const CAT_NOTICIA = {
    anuncio: { label: 'Anuncio', cls: 'cat-anuncio' },
    logro:   { label: 'Logro',   cls: 'cat-logro'   },
    evento:  { label: 'Evento',  cls: 'cat-evento'  },
    info:    { label: 'Info',    cls: 'cat-info'    }
  };

  container.innerHTML = DATA.noticias.slice().reverse().map(n => {
    const cat = CAT_NOTICIA[n.categoria] || { label: n.categoria, cls: 'cat-info' };
    const cleanFotoUrl = urlSegura(n.foto_url);
    return `
      <article class="noticia-card" data-tabla="noticias" data-id="${n.id}" data-foto="${esc(cleanFotoUrl)}">
        <div class="noticia-img" style="background:var(--rojo-claro);display:flex;align-items:center;justify-content:center;">
        ${cleanFotoUrl
          ? `<img class="ui-foto" src="${esc(cleanFotoUrl)}" alt="${esc(n.titulo)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;">`
          : `<img class="ui-logo" src="/assets/images/logo-cont.png" alt="" style="width:80px;height:80px;object-fit:contain;border-radius:50%;" onerror="this.style.display='none'">`
        }
      </div>
        <div class="noticia-body">
          <div class="noticia-meta">
            <span class="noticia-cat ${cat.cls}">${esc(cat.label)}</span>
            <span class="noticia-fecha">${esc(formatDate(n.fecha))}</span>
          </div>
          <div class="noticia-titulo">${esc(n.titulo)}</div>
          <div class="noticia-resumen">${esc(n.resumen)}</div>
        </div>
      </article>
    `;
  }).join('');
}

let editorListo = false;
function renderSemaforoEditor() {
  if (editorListo) return;
  editorListo = true;
  const btn = document.getElementById('sem-edit-btn');
  const panel = document.getElementById('sem-edit-panel');
  if (!btn || !panel) return;

  btn.addEventListener('click', () => {
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    btn.textContent = isOpen ? '\u270F Editar semáforo' : '\u2715 Cerrar editor';
    if (!isOpen) {
      const s = DATA.semaforo || {};
      document.getElementById('edit-verde').value    = (s.verde    || []).join('\n');
      document.getElementById('edit-amarillo').value = (s.amarillo || []).join('\n');
      document.getElementById('edit-rojo').value     = (s.rojo     || []).join('\n');
    }
  });

  document.getElementById('sem-save-btn').addEventListener('click', async () => {
    const guardar = document.getElementById('sem-save-btn');
    const parse = id => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const hoy = new Date().toLocaleDateString('en-CA');
    const nuevo = { verde: parse('edit-verde'), amarillo: parse('edit-amarillo'), rojo: parse('edit-rojo') };
    guardar.disabled = true;
    guardar.textContent = 'Guardando…';
    const { error } = await sb.from('semaforo').upsert({ area: 'contraloria', ...nuevo, actualizado: hoy });
    guardar.disabled = false;
    guardar.textContent = 'Guardar cambios';
    if (error) {
      toast('No se pudo guardar: ' + error.message, { tipo: 'error' });
      return;
    }
    DATA.semaforo = { ...nuevo, ultima_actualizacion: hoy };
    renderSemaforo();
    ['sem-verde', 'sem-amarillo', 'sem-rojo'].forEach(id => revelar(document.getElementById(id)));
    panel.style.display = 'none';
    btn.textContent = '✏ Editar semáforo';
    toast('Semáforo actualizado');
  });
}

// ─── RENDER: BUZON LINK ───────────────────────────────────────────────────────
function renderBuzonLink() {
  const links = document.querySelectorAll('[data-buzon-link]');
  links.forEach(el => {
    el.href = (DATA.contraloria && DATA.contraloria.buzon_url) || '#';
  });
}

// ─── ACTIVE NAV ───────────────────────────────────────────────────────────────
function setActiveNav() {
  let page = window.location.pathname.split('/').pop();
  if (!page || page === 'contraloria') page = 'index';
  else page = page.replace('.html', '');

  document.querySelectorAll('.nav-links a').forEach(a => {
    let href = a.getAttribute('href').replace('.html', '');
    if (href === './' || href === '') href = 'index';
    if (href === page) {
      a.classList.add('active');
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
const SECCIONES = [
  ['noticias-container', 'tarjeta', 3],
  ['actividades-container', 'tarjeta', 3],
  ['props-container', 'bloque', 3],
  ['informes-container', 'bloque', 1],
  ['equipo-container', 'bloque', 4]
];

function pintar(datos, { error } = {}) {
  const contenedores = SECCIONES.map(([id]) => document.getElementById(id)).filter(Boolean);
  if (error) {
    contenedores.forEach(el => errorCarga(el, arrancar));
    return;
  }
  DATA = datos;
  renderHero();
  renderPropuestas(activeFilter);
  initFilterButtons();
  renderSemaforo();
  renderSemaforoEditor();
  renderInformes();
  renderActividades();
  renderEquipo();
  renderNoticias();
  renderBuzonLink();
  [...contenedores, ...['sem-verde', 'sem-amarillo', 'sem-rojo'].map(id => document.getElementById(id))].forEach(revelar);
}

function arrancar() {
  if (!datosEnCache('contraloria')) SECCIONES.forEach(([id, tipo, n]) => esqueleto(document.getElementById(id), tipo, n));
  iniciarArea('contraloria', pintar);
}

setActiveNav();
arrancar();
