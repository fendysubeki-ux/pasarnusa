// ======================================
// PASARNUSA REGISTER USER
// register-user.js
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ======================================
// FIREBASE CONFIG & INIT
// ======================================
const firebaseConfig = {
  apiKey: "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain: "pasarnusa-18aa0.firebaseapp.com",
  projectId: "pasarnusa-18aa0",
  storageBucket: "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId: "1:866998011671:web:5555115feb82741ab55952",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======================================
// ELEMENT REFERENCES
// ======================================
const form = document.getElementById("registerForm");
const nama = document.getElementById("nama");
const email = document.getElementById("email");
const whatsapp = document.getElementById("whatsapp");
const password = document.getElementById("password");
const btnDaftar = document.getElementById("btnDaftar");
const togglePassword = document.getElementById("togglePassword");
const formMessage = document.getElementById("formMessage");

// Pola sederhana untuk validasi nomor WhatsApp Indonesia (08xxxxxxxxxx)
const WHATSAPP_PATTERN = /^08[0-9]{8,11}$/;

// ======================================
// SHOW / HIDE PASSWORD
// ======================================
togglePassword.addEventListener("click", () => {
  const isHidden = password.type === "password";
  password.type = isHidden ? "text" : "password";
  togglePassword.innerText = isHidden ? "🙈" : "👁️";
  togglePassword.setAttribute("aria-pressed", String(isHidden));
});

// ======================================
// FORM SUBMIT
// ======================================
form.addEventListener("submit", registerUser);

/**
 * Menangani submit form registrasi:
 * validasi input lalu membuat akun di Firebase Auth.
 */
async function registerUser(event) {
  event.preventDefault();
  clearMessage();

  const userNama = nama.value.trim();
  const userEmail = email.value.trim();
  const userWhatsapp = whatsapp.value.trim();
  const userPassword = password.value;

  // Validasi kelengkapan data
  if (!userNama || !userEmail || !userWhatsapp || !userPassword) {
    return showMessage("Lengkapi semua data.", "error");
  }

  // Validasi panjang password
  if (userPassword.length < 6) {
    return showMessage("Password minimal 6 karakter.", "error");
  }

  // Validasi format nomor WhatsApp
  if (!WHATSAPP_PATTERN.test(userWhatsapp)) {
    return showMessage("Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.", "error");
  }

  setLoading(true);

  try {
    const credential = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
    await saveUser(credential.user.uid, { userNama, userEmail, userWhatsapp });
  } catch (error) {
    console.error(error);
    showMessage(getErrorMessage(error.code), "error");
    setLoading(false);
  }
}

// ======================================
// SAVE USER TO FIRESTORE
// ======================================

/**
 * Menyimpan data profil user ke Firestore, lalu sign out
 * (karena user baru harus login ulang secara eksplisit)
 * dan mengarahkan ke halaman login.
 */
async function saveUser(uid, { userNama, userEmail, userWhatsapp }) {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      nama: userNama,
      email: userEmail,
      whatsapp: userWhatsapp,
      role: "user",
      status: "aktif",
      createdAt: serverTimestamp(),
    });

    await signOut(auth);
    showMessage("Pendaftaran berhasil. Mengarahkan ke halaman login...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    console.error(error);
    showMessage("Gagal menyimpan data. Silakan coba lagi.", "error");
    setLoading(false);
  }
}

// ======================================
// HELPERS: UI STATE
// ======================================

/** Mengaktifkan/menonaktifkan tombol submit beserta teksnya. */
function setLoading(isLoading) {
  btnDaftar.disabled = isLoading;
  btnDaftar.innerText = isLoading ? "Mendaftarkan..." : "Daftar Sekarang";
}

/** Menampilkan pesan error/sukses pada elemen #formMessage. */
function showMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.classList.remove("error", "success");
  formMessage.classList.add(type);
}

/** Mengosongkan pesan sebelumnya sebelum validasi baru dijalankan. */
function clearMessage() {
  formMessage.textContent = "";
  formMessage.classList.remove("error", "success");
}

// ======================================
// HELPERS: ERROR MAPPING
// ======================================

/** Menerjemahkan kode error Firebase Auth ke pesan berbahasa Indonesia. */
function getErrorMessage(code) {
  const messages = {
    "auth/email-already-in-use": "Email sudah digunakan.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/weak-password": "Password terlalu lemah.",
    "auth/network-request-failed": "Periksa koneksi internet.",
  };

  return messages[code] || "Terjadi kesalahan. Silakan coba lagi.";
}
