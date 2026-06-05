import { auth } from '../../js/firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Credenciales fijas para el acceso como fallback (¡se recomienda configurar Firebase Auth!)
const CREDENTIALS = {
  'personeria@auth.com': 'SR20KDET',
  'contraloria@auth.com': 'SR20KDET',
  'pfc@auth.com': 'SR20KDET'
};

const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');

// Redirigir si ya está logueado en LocalStorage
if (localStorage.getItem('adminUser')) {
  window.location.href = 'dashboard';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.toLowerCase();
    const password = document.getElementById('password').value;
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Verificando...';
    errorMsg.textContent = '';
    
    try {
      // Intentar iniciar sesión usando Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sesión iniciada con Firebase Auth");
      localStorage.setItem('adminUser', email);
      window.location.href = 'dashboard';
    } catch (firebaseError) {
      console.warn("Firebase Auth falló, intentando credenciales locales de respaldo:", firebaseError.message);
      
      // Fallback a credenciales fijas si Firebase Auth falla (p.ej., si no se han creado las cuentas en consola)
      if (CREDENTIALS[email] && CREDENTIALS[email] === password) {
        localStorage.setItem('adminUser', email);
        window.location.href = 'dashboard';
      } else {
        errorMsg.textContent = 'Credenciales inválidas. Verifica el correo y la contraseña.';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
      }
    }
  });
}
