import { db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Pega aquí el objeto DATA original de app-per.js
const personeriaData = {
  "personeria": {
    "nombre": "Julieta Quintero Osorio",
    "cargo": "Personera Estudiantil",
    "slogan": "Solo tú pones el límite para soñar",
    "institucion": "I.E.E.N.S.S.M",
    "anio": "2026",
    "objetivo": "Interactuar con los estudiantes...",
    "buzon_url": "https://formspree.io/f/mvzwdjww",
    "foto_url": "",
    "equipo": [{ "nombre": "Julieta Quintero Osorio", "rol": "Personera" }]
  },
  "noticias": [
    {
      "id": 1,
      "titulo": "¡Julieta Quintero es la nueva Personera Estudiantil 2026!",
      "fecha": "2026-01-20",
      "categoria": "anuncio",
      "resumen": "Con su propuesta...",
      "foto_url": ""
    }
  ],
  "calendario": [
    {
      "id": 1,
      "titulo": "Reunión de apertura de personería",
      "fecha": "2026-02-10",
      "descripcion": "Primera reunión oficial..."
    }
  ],
  "documentos": [],
  "actividades": []
};

// Puedes crear constantes similares para contraloriaData y pfcData

export async function seedDatabase() {
  console.log("Iniciando migración de datos a Firebase...");
  try {
    await setDoc(doc(db, "gobierno", "personeria"), personeriaData);
    console.log("Personería migrada exitosamente!");
    
    // await setDoc(doc(db, "gobierno", "contraloria"), contraloriaData);
    // await setDoc(doc(db, "gobierno", "pfc"), pfcData);
    
    alert("Migración completada con éxito. Revisa la consola de Firebase.");
  } catch (e) {
    console.error("Error en la migración: ", e);
  }
}

// Para ejecutar: llama a seedDatabase() desde la consola del navegador
