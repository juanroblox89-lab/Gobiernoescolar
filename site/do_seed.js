import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsrNdWn8-EHkriujFNNsPo_ik5haFkxCM",
  authDomain: "gobiernoescolar-38ace.firebaseapp.com",
  projectId: "gobiernoescolar-38ace",
  storageBucket: "gobiernoescolar-38ace.firebasestorage.app",
  messagingSenderId: "802749239429",
  appId: "1:802749239429:web:30407ac08857cc6e3599ec"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");
const auth = getAuth(app);

const personeriaData = {
  "personeria": {
    "nombre": "Julieta Quintero Osorio",
    "cargo": "Personera Estudiantil",
    "slogan": "Solo tú pones el límite para soñar",
    "institucion": "I.E.E.N.S.S.M",
    "anio": "2026",
    "objetivo": "Interactuar con los estudiantes de la institución, incluyéndolos en las decisiones, planes y proyectos de la personería estudiantil. Permitiéndoles expresarse, conocer más a fondo las actividades que realiza la institución y comunicarse a través de la personera.",
    "buzon_url": "https://formspree.io/f/mvzwdjww",
    "foto_url": "",
    "equipo": [ { "nombre": "Julieta Quintero Osorio", "rol": "Personera" } ]
  },
  "noticias": [
    { "id": 1, "titulo": "¡Julieta Quintero es la nueva Personera Estudiantil 2026!", "fecha": "2026-01-20", "categoria": "anuncio", "resumen": "Con su propuesta de inclusión y participación activa, Julieta Quintero Osorio fue elegida Personera Estudiantil. ¡Gracias a toda la comunidad que participó!", "foto_url": "" },
    { "id": 2, "titulo": "Buzón digital ya disponible para todos", "fecha": "2026-02-01", "categoria": "logro", "resumen": "A partir de hoy puedes enviar tus dudas, sugerencias y propuestas directamente a la personería. Tu opinión cuenta y será respondida.", "foto_url": "" }
  ],
  "calendario": [
    { "id": 1, "titulo": "Reunión de apertura de personería", "fecha": "2026-02-10", "descripcion": "Primera reunión oficial del equipo de personería para definir el plan de trabajo del año." },
    { "id": 2, "titulo": "Socialización del manual de convivencia", "fecha": "2026-03-05", "descripcion": "Jornada por salones para presentar el manual de convivencia actualizado." }
  ],
  "documentos": [
    { "id": 1, "titulo": "Manual de convivencia", "descripcion": "Normas, derechos y deberes de toda la comunidad educativa.", "tipo": "pdf", "url": "", "icono": "📋" },
    { "id": 2, "titulo": "PEI — Proyecto Educativo Institucional", "descripcion": "Misión, visión y lineamientos pedagógicos de la institución.", "tipo": "pdf", "url": "", "icono": "📘" }
  ],
  "actividades": [
    { "id": 1, "titulo": "Primera semana de personería", "fecha": "2026-02-10", "descripcion": "Presentación de la personera y su equipo ante la comunidad estudiantil.", "foto_url": "" }
  ]
};

const contraloriaData = {
  "contraloria": {
    "nombre": "Susana Restrepo Velásquez",
    "slogan": "Un estudiante informado es un estudiante protegido",
    "color": "#C0392B",
    "buzon_url": "https://formspree.io/f/xojkppeg",
    "redes": { "instagram": "contraloria_04_nssm", "whatsapp": "" },
    "equipo": [
      { "nombre": "Susana Restrepo Velásquez", "rol": "Contralora" },
      { "nombre": "Julieta Quintero Osorio", "rol": "Personera" },
      { "nombre": "Samara Gutiérrez Pérez", "rol": "Equipo" },
      { "nombre": "Mabel Pérez Pérez", "rol": "Equipo" },
      { "nombre": "María José Patiño Cuello", "rol": "Equipo" },
      { "nombre": "Geraldine García Arizmendi", "rol": "Equipo" },
      { "nombre": "Luis Miguel Guerra Zapata", "rol": "Equipo" },
      { "nombre": "Juan Diego Londoño Hernández", "rol": "Equipo" }
    ]
  },
  "propuestas": [
    { "id": 1, "titulo": "Buzón de propuestas y denuncias", "descripcion": "Un espacio físico y digital donde profesores y estudiantes pueden sugerir mejoras o reportar problemas relacionados con los recursos.", "estado": "en_progreso", "categoria": "participacion" },
    { "id": 2, "titulo": "Folletos e infografías por salón", "descripcion": "Repartición periódica de folletos, infografías o carteles explicando los mecanismos de participación ciudadana/estudiantil.", "estado": "pendiente", "categoria": "comunicacion" },
    { "id": 3, "titulo": "Redes sociales y videos cortos", "descripcion": "Manejo de redes, videos cortos y publicaciones acerca del manejo de los recursos de la institución.", "estado": "pendiente", "categoria": "comunicacion" },
    { "id": 4, "titulo": "Informes sobre recursos institucionales", "descripcion": "Carteles en la institución sobre cómo se usan los recursos institucionales de forma clara y fácil de entender.", "estado": "pendiente", "categoria": "transparencia" },
    { "id": 5, "titulo": "Campañas y concursos de cuidado", "descripcion": "Competencias y concursos para promover el cuidado del agua, la energía, el mobiliario y la limpieza entre los estudiantes.", "estado": "pendiente", "categoria": "ambiente" },
    { "id": 6, "titulo": "Puntos ecológicos para reciclaje", "descripcion": "Gestionar la adquisición de basureras donde se separen las botellas de las tapas de plástico creando puntos ecológicos.", "estado": "pendiente", "categoria": "ambiente" },
    { "id": 7, "titulo": "Seguimiento a salones y materiales", "descripcion": "Realizar revisiones para detectar daños o necesidades y presentar informes con fotos a la institución.", "estado": "pendiente", "categoria": "transparencia" },
    { "id": 8, "titulo": "Representación en consejos institucionales", "descripcion": "Representar de forma activa a los estudiantes y sus necesidades materiales en los consejos institucionales.", "estado": "pendiente", "categoria": "participacion" },
    { "id": 9, "titulo": "Rendición de cuentas por periodo", "descripcion": "Presentar una rendición de cuentas al final de cada periodo para informar qué se hizo, qué se logró y qué está pendiente.", "estado": "pendiente", "categoria": "transparencia" },
    { "id": 10, "titulo": "Semáforo institucional", "descripcion": "Mostrar lo que está bien, lo que se puede mejorar y lo que necesita atención urgente.", "estado": "en_progreso", "categoria": "transparencia" }
  ],
  "informes": [
    { "id": 1, "titulo": "Informe — Primer periodo", "fecha": "2026-03-02", "periodo": "Primer periodo 2026", "resumen": "Se tomó posesión del cargo el día 06 de Marzo del presente año, realizó una reunión inicial con el Señor Rector, se asistió a una reunión con el CMJ, se solicitó el PEI y el informe financiero anual, se creó una página web, se programó una visita a las sedes rurales vinculadas a la Normal para realizar entrega de diferentes materiales de los cuales se hará conteo anticipadamente", "logros": [ "Se vinculó la pagina web al proceso", "Se vinculó el apoyo del CMJ" ], "pendientes": [ "Conseguir basureras ecológicas", "Creación del buzón físico" ], "archivo_url": "" }
  ],
  "semaforo": {
    "ultima_actualizacion": "2026-03-01",
    "verde": [ "Asistencia docente regular", "Horarios cumplidos" ],
    "amarillo": [ "Limpieza de baños", "Señalización de rutas de evacuación" ],
    "rojo": [ "Falta de basureras de reciclaje", "Materiales pedagógicos dañados" ]
  },
  "actividades": [
    { "id": 1, "titulo": "Primera visita a las sedes rurales", "fecha": "2026-03-26", "descripcion": "Entrega de materiales", "foto_url": "" }
  ],
  "noticias": [
    { "id": 1, "titulo": "Susana Restrepo toma posesión como Contralora Estudiantil", "fecha": "2026-03-06", "categoria": "anuncio", "resumen": "El 6 de marzo del presente año se realizó la posesión oficial del cargo. Se celebró una reunión inicial con el Señor Rector y se asistió a una reunión con el CMJ para arrancar el trabajo del año.", "foto_url": "" },
    { "id": 2, "titulo": "Página web de la contraloría ya está en línea", "fecha": "2026-03-10", "categoria": "logro", "resumen": "Como parte de las primeras acciones, se creó y vinculó la página web oficial de la contraloría estudiantil al proceso de seguimiento y comunicación con la comunidad.", "foto_url": "" },
    { "id": 3, "titulo": "Visita programada a sedes rurales", "fecha": "2026-03-20", "categoria": "evento", "resumen": "Se programó una visita a las sedes rurales vinculadas a la Normal para realizar entrega de diferentes materiales. Se realizará conteo anticipado de los materiales.", "foto_url": "" }
  ]
};

const pfcData = {
  "pfc": {
    "nombre": "Estiven Agudelo Giraldo",
    "cargo": "Representante Estudiantil PFC",
    "slogan": "Solo tú pones el límite para soñar",
    "institucion": "I.E.E.N.S.S.M",
    "anio": "2026",
    "objetivo": "Esta plataforma nace como un punto de encuentro para los maestros en formación del PFC, donde cada voz tiene valor. Su propósito es abrir canales reales de participación, facilitando el diálogo, la construcción colectiva y el fortalecimiento del rol estudiantil dentro del programa.",
    "buzon_url": ""
  },
  "noticias": [
    { "id": 1, "titulo": "Estiven Agudelo, nuevo Representante del PFC 2026", "fecha": "2026-03-06", "categoria": "anuncio", "resumen": "Estiven Agudelo Giraldo fue elegido como Representante Estudiantil del Programa de Formación Complementaria. Su propuesta se enfoca en fortalecer la comunicación y la participación activa de todos los maestros en formación.", "foto_url": "" }
  ],
  "calendario": [
    { "id": 1, "titulo": "Inicio del año académico PFC", "fecha": "2026-02-03", "descripcion": "Arranque oficial de actividades del Programa de Formación Complementaria 2026." }
  ],
  "actividades": [
    { "id": 1, "titulo": "Primera reunión de representantes", "fecha": "2026-03-06", "descripcion": "Reunión de inicio con los representantes del gobierno escolar para coordinar el trabajo del año.", "foto_url": "" }
  ],
  "avisos": [
    { "id": 1, "titulo": "Plataforma del PFC en línea", "fecha": "2026-03-10", "texto": "Ya está disponible este espacio digital para los maestros en formación. Aquí encontrarán noticias, el calendario académico, actividades y el buzón de participación." }
  ]
};

async function main() {
  try {
    // Attempt to log in with the user's provided credentials first, 
    // to ensure write access if security rules require it
    await signInWithEmailAndPassword(auth, "gobiernoescolar@auth.com", "SR20KDET");
    console.log("Logged in successfully!");
  } catch (e) {
    console.log("Login failed or skipped. Error:", e.message);
  }

  try {
    await setDoc(doc(db, "gobierno", "personeria"), personeriaData);
    console.log("Seeded personeria");
    await setDoc(doc(db, "gobierno", "contraloria"), contraloriaData);
    console.log("Seeded contraloria");
    await setDoc(doc(db, "gobierno", "pfc"), pfcData);
    console.log("Seeded pfc");
    console.log("ALL_SEEDED_SUCCESSFULLY");
    process.exit(0);
  } catch (e) {
    console.error("Error seeding:", e);
    process.exit(1);
  }
}

main();
