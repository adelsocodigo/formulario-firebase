import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig } from "./firebase.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const form = document.getElementById("inscripcionForm");
const estado = document.getElementById("estado");
const btnListar = document.getElementById("btnListar");

// Abrir listado en otra pestaña (si lo usas)
btnListar?.addEventListener("click", () => {
  window.open("listar.html", "_blank");
});

// Inicia sesión anónima y espera a que esté lista
try {
  await signInAnonymously(auth);
} catch (e) {
  console.error("Error al iniciar sesión anónima:", e);
  if (estado) estado.textContent = "Error de autenticación anónima. Revisa Authentication → Sign-in method.";
}

// Espera a tener usuario
const user = await new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (u) => {
    unsub();
    resolve(u);
  });
});

if (!user) {
  console.error("No se obtuvo usuario anónimo");
  if (estado) estado.textContent = "No se pudo autenticar (anónimo).";
}

// Manejador del formulario
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Desactiva temporalmente para evitar envíos dobles
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  if (estado) estado.textContent = "Guardando...";

  const data = {
    nombre: (form.nombre?.value || "").trim(),
    apellido: (form.apellido?.value || "").trim(),
    email: (form.email?.value || "").trim().toLowerCase(),
    telefono: (form.telefono?.value || "").trim(),
    comentarios: (form.comentarios?.value || "").trim(),
    creadoEn: serverTimestamp(), // validado en reglas contra request.time
    uid: user?.uid || null,
  };

  try {
    // Validación mínima
    if (!data.nombre || !data.apellido || !data.email) {
      throw new Error("Completa nombre, apellido y email.");
    }
    // Validación simple de email
    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      throw new Error("Email no válido.");
    }

    await addDoc(collection(db, "inscritos"), data);

    if (estado) estado.textContent = "Inscripción enviada ✅";
    form.reset();
  } catch (err) {
    console.error("Error al guardar en Firestore:", err);
    if (estado) estado.textContent = "Error: " + (err?.message || "No se pudo guardar");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});
