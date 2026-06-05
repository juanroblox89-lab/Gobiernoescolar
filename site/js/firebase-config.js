import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

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
const storage = getStorage(app);

export { db, auth, storage };
