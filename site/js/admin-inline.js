// Modo admin sobre las páginas públicas: si quien navega es admin de esta área,
// puede asociar/cambiar la foto de noticias y actividades ahí mismo, sin ir al panel.
import { sb, AREAS, areaDelAdmin, subirArchivo } from './supabase.js';
import { cargarArea } from './datos.js';
import { toast, esc } from './ui.js';

const AREA = document.body.dataset.area;

const ICONO = {
  imagen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  lapiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
};

const NUEVA = {
  'noticias-container':    { tabla: 'noticias',    texto: 'Nueva noticia' },
  'actividades-container': { tabla: 'actividades', texto: 'Nueva actividad' }
};

export const adminListo = (async () => {
  if (!AREA) return null;
  const area = await areaDelAdmin().catch(() => null);
  if (area !== AREA) return null;
  document.body.classList.add('es-admin');
  montarBarra();
  decorar();
  new MutationObserver(decorar).observe(document.body, { childList: true, subtree: true });
  return area;
})();

function montarBarra() {
  const barra = document.createElement('div');
  barra.className = 'ui-admin-bar';
  barra.innerHTML = `<span class="punto" aria-hidden="true"></span><span class="etiqueta">Admin · ${esc(AREAS[AREA].nombre)}</span>
    <a href="/admin/dashboard">Panel</a><button type="button">Salir</button>`;
  barra.querySelector('button').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.reload();
  });
  document.body.appendChild(barra);
}

let decorando = false;
function decorar() {
  if (decorando) return;
  decorando = true;
  for (const [id, cfg] of Object.entries(NUEVA)) {
    const grid = document.getElementById(id);
    if (grid && !grid.getAttribute('aria-busy') && !grid.querySelector('.ui-nueva')) {
      grid.insertAdjacentHTML('afterbegin', `<a class="ui-nueva" href="/admin/dashboard#nuevo=${cfg.tabla}">${ICONO.mas}${cfg.texto}</a>`);
      grid.querySelector('.empty-state')?.remove();
    }
  }
  document.querySelectorAll('[data-tabla][data-id]:not([data-ui-dec])').forEach(prepararTarjeta);
  decorando = false;
}

function prepararTarjeta(card) {
  card.dataset.uiDec = '1';
  const caja = card.querySelector('.noticia-img, .actividad-img');
  if (!caja) return;
  caja.insertAdjacentHTML('beforeend',
    `<a class="ui-chip ui-editar-link" href="/admin/dashboard#editar=${card.dataset.tabla}:${card.dataset.id}" title="Editar en el panel">${ICONO.lapiz}Editar</a>`);
  pintarControles(card, caja);

  // Arrastrar y soltar una imagen directo sobre la tarjeta.
  caja.addEventListener('dragover', e => { e.preventDefault(); caja.classList.add('ui-soltar'); });
  caja.addEventListener('dragleave', () => caja.classList.remove('ui-soltar'));
  caja.addEventListener('drop', e => {
    e.preventDefault();
    caja.classList.remove('ui-soltar');
    const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
    if (file) asociar(card, caja, file);
  });
}

function pintarControles(card, caja) {
  caja.querySelector('.ui-asociar, .ui-foto-acciones')?.remove();
  if (!card.dataset.foto) {
    caja.insertAdjacentHTML('beforeend',
      `<button type="button" class="ui-asociar"><span>${ICONO.imagen}Asociar imagen</span><small>o arrástrala aquí</small></button>`);
    caja.querySelector('.ui-asociar').addEventListener('click', () => elegirArchivo(f => asociar(card, caja, f)));
  } else {
    caja.insertAdjacentHTML('beforeend',
      `<div class="ui-foto-acciones"><button type="button" class="ui-chip" data-accion="cambiar">${ICONO.imagen}Cambiar</button><button type="button" class="ui-chip" data-accion="quitar">Quitar</button></div>`);
    caja.querySelector('[data-accion="cambiar"]').addEventListener('click', () => elegirArchivo(f => asociar(card, caja, f)));
    caja.querySelector('[data-accion="quitar"]').addEventListener('click', () => quitar(card, caja));
  }
}

function elegirArchivo(alElegir) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.addEventListener('change', () => input.files[0] && alElegir(input.files[0]));
  input.click();
}

async function guardarFoto(card, url) {
  const { data, error } = await sb.from(card.dataset.tabla).update({ foto_url: url }).eq('id', card.dataset.id).select('id');
  if (error) throw error;
  if (!data.length) throw new Error('No tienes permiso para editar esta publicación.');
  cargarArea(AREA).catch(() => {});
}

function mostrarFoto(card, caja, url) {
  card.dataset.foto = url;
  caja.querySelectorAll('img').forEach(img => img.remove());
  if (url) {
    caja.insertAdjacentHTML('afterbegin', `<img class="ui-foto" src="${esc(url)}" alt="${esc(card.querySelector('.noticia-titulo, .actividad-titulo')?.textContent || '')}" style="width:100%;height:100%;object-fit:cover;">`);
  }
  pintarControles(card, caja);
}

async function asociar(card, caja, file) {
  const capa = document.createElement('div');
  capa.className = 'ui-subiendo';
  capa.innerHTML = '<span class="ui-spinner"></span>Subiendo…';
  caja.appendChild(capa);
  try {
    const url = await subirArchivo(AREA, file, card.dataset.tabla);
    await guardarFoto(card, url);
    await new Promise(res => { const img = new Image(); img.onload = img.onerror = res; img.src = url; });
    mostrarFoto(card, caja, url);
    toast('Imagen asociada');
  } catch (e) {
    toast(e.message || 'No se pudo subir la imagen', { tipo: 'error' });
  } finally {
    capa.remove();
  }
}

async function quitar(card, caja) {
  const anterior = card.dataset.foto;
  try {
    await guardarFoto(card, '');
    mostrarFoto(card, caja, '');
    toast('Imagen quitada', {
      accion: 'Deshacer',
      duracion: 6000,
      alAccionar: async () => {
        try { await guardarFoto(card, anterior); mostrarFoto(card, caja, anterior); }
        catch (e) { toast(e.message, { tipo: 'error' }); }
      }
    });
  } catch (e) {
    toast(e.message || 'No se pudo quitar la imagen', { tipo: 'error' });
  }
}
