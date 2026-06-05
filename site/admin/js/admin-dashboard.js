import { db, storage } from '../../js/firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// VARIABLES GLOBALES
let currentUserEmail = localStorage.getItem('adminUser');
let currentRole = null; // 'personeria', 'contraloria', o 'pfc'
let currentData = null; // Los datos actuales de Firestore

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// DOM ELEMENTS
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.nav-item');
const sections = {
  noticias: document.getElementById('noticias-section'),
  calendario: document.getElementById('calendario-section'),
  recursos: document.getElementById('recursos-section'),
  semaforo: document.getElementById('semaforo-section')
};

// ─── AUTENTICACIÓN LOCAL ──────────────────────────────────────────────────────
if (!currentUserEmail) {
  window.location.href = './'; // Redirigir al login si no hay sesión
} else {
  if (userEmailEl) userEmailEl.textContent = currentUserEmail;

  // Determinar el rol basado en el email
  if (currentUserEmail.includes('personeria')) currentRole = 'personeria';
  else if (currentUserEmail.includes('contraloria')) currentRole = 'contraloria';
  else if (currentUserEmail.includes('pfc')) currentRole = 'pfc';
  else currentRole = 'personeria'; // Default fallback

  // Solo Contraloría ve la pestaña del semáforo
  const semaforoNavBtn = document.querySelector('[data-target="semaforo"]');
  if (semaforoNavBtn && currentRole !== 'contraloria') {
    semaforoNavBtn.style.display = 'none';
  }

  // Iniciar carga de datos
  loadData();
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminUser');
    window.location.href = './';
  });
}

// ─── NAVEGACIÓN ─────────────────────────────────────────────────────────────
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    Object.values(sections).forEach(s => s && s.classList.add('hidden'));
    const target = sections[item.dataset.target];
    if (target) target.classList.remove('hidden');
  });
});

// ─── RENDER RECURSOS ─────────────────────────────────────────────────────────
function renderRecursos() {
  const list = document.getElementById('recursos-list');
  let items = [];
  
  if (currentRole === 'personeria') {
    items = currentData.documentos || [];
  } else if (currentRole === 'contraloria') {
    items = currentData.informes || [];
  } else {
    // El PFC no tiene recursos aún, ocultar el tab
    const navBtn = document.querySelector('[data-target="recursos"]');
    if (navBtn) navBtn.style.display = 'none';
    return;
  }

  if (items.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);">No hay recursos disponibles para editar en este perfil.</p>';
    return;
  }

  list.innerHTML = items.map((item, index) => {
    let url = item.url || item.archivo_url || '';
    const cleanUrl = url && !url.trim().startsWith('javascript:') ? url : '';
    return `
      <div class="card">
        <div class="card-content">
          <h3 class="card-title">${esc(item.titulo)}</h3>
          <p class="card-desc" style="font-size:12px; margin-top:4px;">${esc(item.descripcion || item.resumen || '')}</p>
          ${cleanUrl ? `<a href="${esc(cleanUrl)}" target="_blank" style="font-size:13px; color:var(--primary); margin-top:8px; display:inline-block; font-weight:600;">Abrir recurso actual ↗</a>` : '<span style="font-size:13px; color:#e74c3c; margin-top:8px; display:inline-block; font-weight:600;">Sin enlace/archivo</span>'}
        </div>
        <div class="card-actions">
          <button class="btn-edit" onclick="editRecurso(${index})">✏️ Editar Link/Archivo</button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── FIRESTORE ──────────────────────────────────────────────────────────────
async function loadData() {
  try {
    const docRef = doc(db, 'gobierno', currentRole);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      currentData = docSnap.data();
      renderNoticiasList();
      renderEventosList();
      renderRecursos();
      renderSemaforoAdmin();
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function saveSemaforo(newSem) {
  try {
    const docRef = doc(db, 'gobierno', 'contraloria');
    await updateDoc(docRef, { semaforo: newSem });
    currentData.semaforo = newSem;
    return true;
  } catch (error) {
    console.error('Error guardando semáforo:', error);
    alert('Error al guardar el semáforo: ' + error.message);
    return false;
  }
}

async function saveData() {
  try {
    const docRef = doc(db, 'gobierno', currentRole);
    const updates = {
      noticias: currentData.noticias || [],
      calendario: currentData.calendario || []
    };
    if (currentRole === 'personeria' && currentData.documentos) {
      updates.documentos = currentData.documentos;
    }
    if (currentRole === 'contraloria' && currentData.informes) {
      updates.informes = currentData.informes;
    }
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating document:', error);
    alert('Hubo un error al guardar los cambios.');
    return false;
  }
}

// ─── SEMAFORO (solo Contraloría) ────────────────────────────────────────────
function renderSemaforoAdmin() {
  if (currentRole !== 'contraloria') return;
  const s = currentData.semaforo || { verde: [], amarillo: [], rojo: [] };

  const textarea = (id, vals) => `<textarea id="${id}" style="width:100%;min-height:120px;padding:10px;border-radius:8px;border:1px solid var(--border);font-size:13px;font-family:inherit;resize:vertical;" placeholder="Un elemento por línea...">${(vals||[]).join('\n')}</textarea>`;

  const section = document.getElementById('semaforo-section');
  if (!section) return;

  section.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Semáforo Institucional</h1>
    </div>
    <div class="dashboard-info-box">
      Escribe un elemento por línea en cada columna. Los cambios se guardarán en Firebase y se verán en la página de Contraloría en tiempo real.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:1.5rem;">
      <div>
        <div style="font-weight:700;color:#27ae60;margin-bottom:8px;font-size:13px;">🟢 Está bien</div>
        ${textarea('sem-verde', s.verde)}
      </div>
      <div>
        <div style="font-weight:700;color:#f39c12;margin-bottom:8px;font-size:13px;">🟡 Se puede mejorar</div>
        ${textarea('sem-amarillo', s.amarillo)}
      </div>
      <div>
        <div style="font-weight:700;color:#e74c3c;margin-bottom:8px;font-size:13px;">🔴 Necesita atención</div>
        ${textarea('sem-rojo', s.rojo)}
      </div>
    </div>
    <button id="btn-guardar-semaforo" class="btn-submit" style="margin-top:1.5rem;">Guardar Semáforo en Firebase</button>
    <span id="sem-feedback-admin" style="margin-left:12px;color:#27ae60;font-weight:600;display:none;">&#10003; ¡Guardado correctamente!</span>
  `;

  document.getElementById('btn-guardar-semaforo').addEventListener('click', async () => {
    const btn = document.getElementById('btn-guardar-semaforo');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    const parse = id => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const today = new Date().toISOString().split('T')[0];
    const newSem = {
      ultima_actualizacion: today,
      verde:    parse('sem-verde'),
      amarillo: parse('sem-amarillo'),
      rojo:     parse('sem-rojo')
    };
    const ok = await saveSemaforo(newSem);
    if (ok) {
      const fb = document.getElementById('sem-feedback-admin');
      fb.style.display = 'inline';
      setTimeout(() => { fb.style.display = 'none'; }, 3000);
    }
    btn.disabled = false;
    btn.textContent = 'Guardar Semáforo en Firebase';
  });
}

// ─── NOTICIAS ────────────────────────────────────────────────────────────────
const noticiasListEl = document.getElementById('noticias-list');
const modalNoticia = document.getElementById('modal-noticia');
const formNoticia = document.getElementById('form-noticia');
function renderNoticiasList() {
  const noticias = currentData.noticias || [];
  if (noticias.length === 0) {
    noticiasListEl.innerHTML = '<p style="color:var(--text-muted)">No hay noticias publicadas.</p>';
    return;
  }

  noticiasListEl.innerHTML = noticias.map((n, index) => `
    <div class="data-card">
      <div class="data-info">
        <h3>${esc(n.titulo)}</h3>
        <p>${esc(n.fecha)} | Categoría: ${esc(n.categoria)}</p>
      </div>
      <div class="data-actions">
        <button class="btn-icon" onclick="editNoticia(${index})">✏️</button>
        <button class="btn-icon delete" onclick="deleteNoticia(${index})">🗑️</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('btn-add-noticia').addEventListener('click', () => {
  formNoticia.reset();
  document.getElementById('noticia-id').value = '';
  document.getElementById('noticia-foto').value = '';
  document.getElementById('noticia-foto-name').textContent = '';
  document.getElementById('modal-noticia-title').textContent = 'Crear Noticia';
  modalNoticia.classList.add('active');
});

document.getElementById('close-modal-noticia').addEventListener('click', () => modalNoticia.classList.remove('active'));
document.getElementById('cancel-noticia').addEventListener('click', () => modalNoticia.classList.remove('active'));

window.editNoticia = (index) => {
  const n = currentData.noticias[index];
  document.getElementById('noticia-id').value = index;
  document.getElementById('noticia-titulo').value = n.titulo;
  document.getElementById('noticia-fecha').value = n.fecha;
  document.getElementById('noticia-categoria').value = n.categoria;
  document.getElementById('noticia-foto').value = n.foto_url || '';
  document.getElementById('noticia-foto-file').value = ''; // Reset file input
  document.getElementById('noticia-foto-name').textContent = n.foto_url ? 'Imagen actual ya guardada' : '';
  document.getElementById('noticia-resumen').value = n.resumen;
  
  document.getElementById('modal-noticia-title').textContent = 'Editar Noticia';
  modalNoticia.classList.add('active');
};

window.deleteNoticia = async (index) => {
  if(confirm("¿Estás seguro de eliminar esta noticia?")) {
    const originalNoticias = [...(currentData.noticias || [])];
    currentData.noticias.splice(index, 1);
    const success = await saveData();
    if (success) {
      renderNoticiasList();
    } else {
      currentData.noticias = originalNoticias;
    }
  }
};

formNoticia.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  const idStr = document.getElementById('noticia-id').value;
  let fotoUrl = document.getElementById('noticia-foto').value;
  const fotoFile = document.getElementById('noticia-foto-file').files[0];

  try {
    // Upload image if selected
    if (fotoFile) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
      if (fotoFile.size > MAX_FILE_SIZE) {
        alert("El archivo excede el tamaño límite de 5 MB.");
        btn.textContent = 'Guardar';
        btn.disabled = false;
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(fotoFile.type)) {
        alert("Formato de imagen inválido. Solo se admiten JPG, PNG, WEBP y GIF.");
        btn.textContent = 'Guardar';
        btn.disabled = false;
        return;
      }

      btn.textContent = 'Subiendo foto...';
      const storageRef = ref(storage, `imagenes/${currentRole}/${Date.now()}_${fotoFile.name}`);
      const snapshot = await uploadBytes(storageRef, fotoFile);
      fotoUrl = await getDownloadURL(snapshot.ref);
    }

    const newNoticia = {
      titulo: document.getElementById('noticia-titulo').value,
      fecha: document.getElementById('noticia-fecha').value,
      categoria: document.getElementById('noticia-categoria').value,
      foto_url: fotoUrl,
      resumen: document.getElementById('noticia-resumen').value,
      id: Date.now() // Simple ID generation
    };

    if(!currentData.noticias) currentData.noticias = [];

    if (idStr !== '') {
      const index = parseInt(idStr);
      newNoticia.id = currentData.noticias[index].id;
      currentData.noticias[index] = newNoticia;
    } else {
      currentData.noticias.push(newNoticia);
    }

    btn.textContent = 'Guardando datos...';
    if (await saveData()) {
      modalNoticia.classList.remove('active');
      renderNoticiasList();
    }
  } catch (error) {
    console.error("Error en submit:", error);
    alert("Hubo un error al guardar la noticia o subir la imagen.");
  }
  
  btn.textContent = 'Guardar';
  btn.disabled = false;
});

// ─── CALENDARIO (Lógica idéntica) ─────────────────────────────────────────────
const eventosListEl = document.getElementById('eventos-list');
const modalEvento = document.getElementById('modal-evento');
const formEvento = document.getElementById('form-evento');
function renderEventosList() {
  const eventos = currentData.calendario || [];
  if (eventos.length === 0) {
    eventosListEl.innerHTML = '<p style="color:var(--text-muted)">No hay eventos programados.</p>';
    return;
  }

  eventosListEl.innerHTML = eventos.map((e, index) => `
    <div class="data-card">
      <div class="data-info">
        <h3>${esc(e.titulo)}</h3>
        <p>${esc(e.fecha)}</p>
      </div>
      <div class="data-actions">
        <button class="btn-icon" onclick="editEvento(${index})">✏️</button>
        <button class="btn-icon delete" onclick="deleteEvento(${index})">🗑️</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('btn-add-evento').addEventListener('click', () => {
  formEvento.reset();
  document.getElementById('evento-id').value = '';
  document.getElementById('modal-evento-title').textContent = 'Crear Evento';
  modalEvento.classList.add('active');
});

document.getElementById('close-modal-evento').addEventListener('click', () => modalEvento.classList.remove('active'));
document.getElementById('cancel-evento').addEventListener('click', () => modalEvento.classList.remove('active'));

window.editEvento = (index) => {
  const e = currentData.calendario[index];
  document.getElementById('evento-id').value = index;
  document.getElementById('evento-titulo').value = e.titulo;
  document.getElementById('evento-fecha').value = e.fecha;
  document.getElementById('evento-desc').value = e.descripcion ?? '';
  
  document.getElementById('modal-evento-title').textContent = 'Editar Evento';
  modalEvento.classList.add('active');
};

window.deleteEvento = async (index) => {
  if(confirm("¿Estás seguro de eliminar este evento?")) {
    const originalCalendario = [...(currentData.calendario || [])];
    currentData.calendario.splice(index, 1);
    const success = await saveData();
    if (success) {
      renderEventosList();
    } else {
      currentData.calendario = originalCalendario;
    }
  }
};

formEvento.addEventListener('submit', async (e) => {
  e.preventDefault();
  const idStr = document.getElementById('evento-id').value;
  const newEvento = {
    titulo: document.getElementById('evento-titulo').value,
    fecha: document.getElementById('evento-fecha').value,
    descripcion: document.getElementById('evento-desc').value,
    id: Date.now()
  };

  if(!currentData.calendario) currentData.calendario = [];

  if (idStr !== '') {
    const index = parseInt(idStr);
    newEvento.id = currentData.calendario[index].id;
    currentData.calendario[index] = newEvento;
  } else {
    currentData.calendario.push(newEvento);
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  if (await saveData()) {
    modalEvento.classList.remove('active');
    renderEventosList();
  }
  
  btn.textContent = 'Guardar';
  btn.disabled = false;
});

// ─── LÓGICA MODAL RECURSOS ──────────────────────────────────────────────────
let editingRecursoIndex = -1;
window.editRecurso = (index) => {
  if (currentRole === 'pfc') return; // PFC has no recursos tab
  editingRecursoIndex = index;
  const items = currentRole === 'personeria' ? currentData.documentos : currentData.informes;
  const item = items[index];
  const urlProp = currentRole === 'personeria' ? 'url' : 'archivo_url';
  
  document.getElementById('recurso-url').value = item[urlProp] || '';
  document.getElementById('recurso-file').value = '';
  document.getElementById('modal-recurso').classList.add('active');
};

document.getElementById('form-recurso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-save-recurso');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const urlInput = document.getElementById('recurso-url').value;
    const fileInput = document.getElementById('recurso-file').files[0];
    let finalUrl = urlInput;

    if (fileInput) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
      if (fileInput.size > MAX_FILE_SIZE) {
        alert("El archivo excede el tamaño límite de 5 MB.");
        btn.disabled = false;
        btn.textContent = originalText;
        return;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(fileInput.type)) {
        alert("Formato de archivo inválido. Solo se admiten PDFs e imágenes (JPG, PNG, WEBP).");
        btn.disabled = false;
        btn.textContent = originalText;
        return;
      }

      btn.textContent = 'Subiendo Archivo...';
      const fileRef = ref(storage, `recursos/${currentRole}/${Date.now()}_${fileInput.name}`);
      const snapshot = await uploadBytes(fileRef, fileInput);
      finalUrl = await getDownloadURL(snapshot.ref);
    }

    const fieldName = currentRole === 'personeria' ? 'documentos' : 'informes';
    const urlProp = currentRole === 'personeria' ? 'url' : 'archivo_url';

    const originalUrl = currentData[fieldName][editingRecursoIndex][urlProp];
    currentData[fieldName][editingRecursoIndex][urlProp] = finalUrl;

    const success = await saveData();
    if (success) {
      renderRecursos();
      document.getElementById('modal-recurso').classList.remove('active');
    } else {
      currentData[fieldName][editingRecursoIndex][urlProp] = originalUrl;
    }
  } catch (error) {
    console.error("Error saving recurso", error);
    alert("Hubo un error al guardar: " + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

document.getElementById('btn-close-recurso').addEventListener('click', () => {
  document.getElementById('modal-recurso').classList.remove('active');
});
