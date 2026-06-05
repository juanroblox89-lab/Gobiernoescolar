import { db } from '../../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ─── DATA ───────────────────────────────────────────────────────────────────
let DATA = {};

async function loadData() {
  try {
    const docRef = doc(db, "gobierno", "pfc");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      DATA = docSnap.data();
    } else {
      console.warn("No data found for pfc");
    }
  } catch (error) {
    console.error("Error loading data from Firebase:", error);
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '';
  const parts = String(str).split('T')[0].split('-');
  if (parts.length < 3) return str;
  const [y, m, d] = parts;
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1] || '?'} ${y}`;
}

function formatDateShort(str) {
  if (!str) return { dia: '', mes: '' };
  const parts = String(str).split('T')[0].split('-');
  if (parts.length < 3) return { dia: '', mes: '' };
  const [y, m, d] = parts;
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return { dia: parseInt(d), mes: months[parseInt(m)-1] || '' };
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CAT = {
  anuncio: { label: 'Anuncio', cls: 'cat-anuncio' },
  logro:   { label: 'Logro',   cls: 'cat-logro'   },
  evento:  { label: 'Evento',  cls: 'cat-evento'  },
  info:    { label: 'Info',    cls: 'cat-info'     }
};

// ─── RENDER: HERO ─────────────────────────────────────────────────────────────
function renderHero() {
  const p = DATA.pfc || {};
  document.querySelectorAll('[data-pfc-nombre]').forEach(el => el.textContent = p.nombre);
  document.querySelectorAll('[data-pfc-slogan]').forEach(el => el.textContent = `"${p.slogan}"`);
  document.querySelectorAll('[data-pfc-objetivo]').forEach(el => el.textContent = p.objetivo);

  const sn = document.getElementById('stat-noticias');
  if (sn) sn.textContent = (DATA.noticias || []).length;

  const sa = document.getElementById('stat-actividades');
  if (sa) sa.textContent = (DATA.actividades || []).length;

  const se = document.getElementById('stat-eventos');
  if (se) {
    const hoyStr = new Date().toISOString().split('T')[0];
    se.textContent = (DATA.calendario || []).filter(e => e.fecha >= hoyStr).length;
  }
}

// ─── RENDER: NOTICIAS ────────────────────────────────────────────────────────
function renderNoticias() {
  const c = document.getElementById('noticias-container');
  if (!c) return;
  const lista = DATA.noticias || [];
  if (!lista.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📰</div><p>Aún no hay noticias.</p></div>`;
    return;
  }
  c.innerHTML = lista.slice().reverse().map(n => {
    const cat = CAT[n.categoria] || { label: n.categoria, cls: 'cat-info' };
    const cleanFotoUrl = n.foto_url && !n.foto_url.trim().startsWith('javascript:') ? n.foto_url : '';
    return `
      <article class="noticia-card">
        <div class="noticia-img">
          ${cleanFotoUrl
            ? `<img src="${esc(cleanFotoUrl)}" alt="${esc(n.titulo)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<img src="../assets/images/logo-pfc.png" style="width:64px;height:64px;border-radius:50%;opacity:0.4;" onerror="this.style.display='none'">`
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
      </article>`;
  }).join('');
}

// ─── RENDER: AVISOS ──────────────────────────────────────────────────────────
function renderAvisos() {
  const c = document.getElementById('avisos-container');
  if (!c) return;
  const lista = DATA.avisos || [];
  if (!lista.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📌</div><p>No hay avisos por ahora.</p></div>`;
    return;
  }
  c.innerHTML = lista.slice().reverse().map(a => `
    <div class="aviso-card">
      <div class="aviso-fecha">${esc(formatDate(a.fecha))}</div>
      <div class="aviso-titulo">${esc(a.titulo)}</div>
      <div class="aviso-texto">${esc(a.texto)}</div>
    </div>`).join('');
}

// ─── RENDER: CALENDARIO ──────────────────────────────────────────────────────
let calYear, calMonth;

function renderCalendario() {
  if (!document.getElementById('cal-grid')) return;
  const hoy = new Date();
  calYear = hoy.getFullYear();
  calMonth = hoy.getMonth();
  renderMes();
  renderEventosList();
  document.getElementById('cal-prev')?.addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderMes(); });
  document.getElementById('cal-next')?.addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderMes(); });
}

function renderMes() {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesEl = document.getElementById('cal-mes-label');
  if (mesEl) mesEl.textContent = `${meses[calMonth]} ${calYear}`;
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const primer = new Date(calYear, calMonth, 1).getDay();
  const diasMes = new Date(calYear, calMonth + 1, 0).getDate();
  const hoy = new Date();
  const diasEvento = new Set((DATA.calendario || []).filter(e => e.fecha && typeof e.fecha === 'string').filter(e => { const [y,m] = e.fecha.split('-').map(Number); return y===calYear && m-1===calMonth; }).map(e => parseInt(e.fecha.split('-')[2])));
  let html = '';
  for (let i = 0; i < primer; i++) html += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= diasMes; d++) {
    const esHoy = hoy.getFullYear()===calYear && hoy.getMonth()===calMonth && hoy.getDate()===d;
    const tieneEvento = diasEvento.has(d);
    html += `<div class="cal-day${esHoy?' hoy':tieneEvento?' tiene-evento':''}">${d}</div>`;
  }
  grid.innerHTML = html;
}
function renderEventosList() {
  const lista = document.getElementById('eventos-lista');
  if (!lista) return;
  const eventos = DATA.calendario || [];
  if (!eventos.length) { lista.innerHTML = `<p style="font-size:13px;color:var(--blanco-3);padding:1rem 0;font-style:italic;">No hay eventos registrados aún.</p>`; return; }
  lista.innerHTML = eventos.map(e => {
    const { dia, mes } = formatDateShort(e.fecha);
    return `<div class="evento-item"><div class="evento-fecha-badge">${esc(dia)}<br>${esc(mes)}</div><div><div class="evento-info-titulo">${esc(e.titulo)}</div><div class="evento-info-desc">${esc(e.descripcion)}</div></div></div>`;
  }).join('');
}

// ─── RENDER: ACTIVIDADES ─────────────────────────────────────────────────────
function renderActividades() {
  const c = document.getElementById('actividades-container');
  if (!c) return;
  const lista = DATA.actividades || [];
  if (!lista.length) { c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📸</div><p>Las actividades aparecerán aquí cuando se realicen.</p></div>`; return; }
  c.innerHTML = lista.map(a => {
    const cleanFotoUrl = a.foto_url && !a.foto_url.trim().startsWith('javascript:') ? a.foto_url : '';
    return `
      <div class="noticia-card">
        <div class="noticia-img">
          ${cleanFotoUrl
            ? `<img src="${esc(cleanFotoUrl)}" alt="${esc(a.titulo)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<img src="../assets/images/logo-pfc.png" style="width:64px;height:64px;border-radius:50%;opacity:0.4;" onerror="this.style.display='none'">`
          }
        </div>
        <div class="noticia-body">
          <div class="noticia-meta"><span class="noticia-cat cat-evento">Actividad</span><span class="noticia-fecha">${esc(formatDate(a.fecha))}</span></div>
          <div class="noticia-titulo">${esc(a.titulo)}</div>
          <div class="noticia-resumen">${esc(a.descripcion)}</div>
        </div>
      </div>`;
  }).join('');
}

// ─── RENDER: BUZÓN ────────────────────────────────────────────────────────────
function renderBuzonLink() {
  const form = document.getElementById('buzon-form');
  if (form && DATA.pfc && DATA.pfc.buzon_url) form.action = DATA.pfc.buzon_url;
}

// ─── ACTIVE NAV ───────────────────────────────────────────────────────────────
function setActiveNav() {
  let page = window.location.pathname.split('/').pop();
  if (!page || page === 'pfc') page = 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

// ─── RENDER: WHATSAPP ──────────────────────────────────────────────────────────
function renderWhatsappLink() {
  const waLinks = document.querySelectorAll('[data-whatsapp]');
  waLinks.forEach(el => {
    const wa = DATA.pfc && DATA.pfc.whatsapp;
    if (wa) {
      el.href = 'https://wa.me/57' + String(wa).replace(/\s+/g, '');
      el.textContent = 'WhatsApp';
      el.style.display = 'inline';
    } else {
      el.style.display = 'none';
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderHero();
  renderNoticias();
  renderAvisos();
  renderCalendario();
  renderActividades();
  renderBuzonLink();
  renderWhatsappLink();
  setActiveNav();
});
