import { sb, areaDelAdmin } from '../../js/supabase.js';

const form = document.getElementById('login-form');
const box = document.getElementById('login-box');
const errorMsg = document.getElementById('error-message');
const btn = document.getElementById('login-btn');
const pass = document.getElementById('password');

// Si ya hay sesión de admin, directo al panel.
areaDelAdmin().then(area => { if (area) location.replace('/admin/dashboard'); });

document.getElementById('pass-toggle').addEventListener('click', e => {
  const ver = pass.type === 'password';
  pass.type = ver ? 'text' : 'password';
  e.currentTarget.textContent = ver ? 'Ocultar' : 'Ver';
  e.currentTarget.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

function fallar(mensaje) {
  errorMsg.textContent = mensaje;
  box.classList.remove('sacudir');
  void box.offsetWidth;
  box.classList.add('sacudir');
  btn.disabled = false;
  btn.textContent = 'Iniciar sesión';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  let email = document.getElementById('email').value.trim().toLowerCase();
  if (!email || !pass.value) return fallar('Escribe tu usuario y contraseña.');
  if (!email.includes('@')) email += '@auth.com'; // "personeria" → personeria@auth.com

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Verificando…';
  errorMsg.textContent = '';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass.value });
  if (error) {
    return fallar(/invalid/i.test(error.message) ? 'Usuario o contraseña incorrectos.' : 'No se pudo iniciar sesión. Revisa tu conexión.');
  }
  if (!(await areaDelAdmin())) {
    await sb.auth.signOut();
    return fallar('Esta cuenta no tiene permisos de administrador.');
  }
  location.replace('/admin/dashboard');
});
