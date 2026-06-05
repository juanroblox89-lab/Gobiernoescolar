import { db } from '../../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ─── DATA ───────────────────────────────────────────────────────────────────
let DATA = {};
let activeFilter = 'todas';

async function loadData() {
  try {
    const docRef = doc(db, "gobierno", "contraloria");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      DATA = docSnap.data();
    } else {
      console.warn("No data found for contraloria");
    }
  } catch (error) {
    console.error("Error loading data from Firebase:", error);
  }
}

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

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function initFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderPropuestas(activeFilter);
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
    const cleanUrl = inf.archivo_url && !inf.archivo_url.trim().startsWith('javascript:') ? inf.archivo_url : '';
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
          ? `<a class="btn-descargar" href="${cleanUrl}" target="_blank">↓ Descargar</a>`
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

  container.innerHTML = DATA.actividades.map(a => {
    const cleanFotoUrl = a.foto_url && !a.foto_url.trim().startsWith('javascript:') ? a.foto_url : '';
    return `
      <div class="actividad-card">
        <div class="actividad-img">
          ${cleanFotoUrl
            ? `<img src="${cleanFotoUrl}" alt="${esc(a.titulo)}">`
            : `<img src="../assets/images/logo-cont.png" alt="Logo" style="width:70px;height:70px;object-fit:contain;border-radius:50%;opacity:0.6;" onerror="this.style.display='none'">`}
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
      ? `<img src="../assets/images/logo-cont.png" alt="${esc(m.nombre)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'">` 
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
    const cleanFotoUrl = n.foto_url && !n.foto_url.trim().startsWith('javascript:') ? n.foto_url : '';
    return `
      <article class="noticia-card">
        <div class="noticia-img" style="background:var(--rojo-claro);display:flex;align-items:center;justify-content:center;">
        ${cleanFotoUrl
          ? `<img src="${esc(cleanFotoUrl)}" alt="${esc(n.titulo)}" style="width:100%;height:100%;object-fit:cover;">`
          : `<img src="../assets/images/logo-cont.png" alt="Logo" style="width:80px;height:80px;object-fit:contain;border-radius:50%;opacity:0.7;" onerror="this.style.display='none'">`
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

function renderSemaforoEditor() {
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

  document.getElementById('sem-save-btn').addEventListener('click', () => {
    const parse = id => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const today = new Date().toISOString().split('T')[0];
    const newData = {
      ultima_actualizacion: today,
      verde:    parse('edit-verde'),
      amarillo: parse('edit-amarillo'),
      rojo:     parse('edit-rojo')
    };
    DATA.semaforo = newData;
    renderSemaforo();
    panel.style.display = 'none';
    btn.textContent = '\u270F Editar semáforo';
    const fb = document.getElementById('sem-feedback');
    if (fb) {
      fb.style.display = 'inline';
      fb.textContent = '\u2713 Vista previa actualizada (para guardar definitivo usa el panel admin)';
      setTimeout(() => { fb.style.display = 'none'; }, 4000);
    }
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
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
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
  setActiveNav();
});
