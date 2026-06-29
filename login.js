// ======================================
// PASARNUSA — login.js
// Logika autentikasi Firebase untuk halaman login.
// Menggunakan ES Module (type="module" di HTML).
// ======================================


// ======================================
// IMPORT FIREBASE
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// KONFIGURASI FIREBASE
// ======================================

const firebaseConfig = {
  apiKey:            "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain:        "pasarnusa-18aa0.firebaseapp.com",
  projectId:         "pasarnusa-18aa0",
  storageBucket:     "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId:             "1:866998011671:web:5555115feb82741ab55952",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


// ======================================
// REFERENSI ELEMEN DOM
// ======================================

const form           = document.getElementById("loginForm");
const emailInput     = document.getElementById("email");
const passwordInput  = document.getElementById("password");
const btnLogin       = document.getElementById("btnLogin");
const rememberMe     = document.getElementById("rememberMe");
const togglePassword = document.getElementById("togglePassword");


// ======================================
// TOGGLE SHOW/HIDE PASSWORD
// ======================================

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type         = isHidden ? "text" : "password";
  togglePassword.textContent = isHidden ? "🙈" : "👁️";
  // Update aria-label agar aksesibel
  togglePassword.setAttribute(
    "aria-label",
    isHidden ? "Sembunyikan password" : "Tampilkan password"
  );
});


// ======================================
// EVENT SUBMIT FORM
// ======================================

form.addEventListener("submit", loginUser);


// ======================================
// FUNGSI: LOGIN PENGGUNA
// ======================================

async function loginUser(e) {
  e.preventDefault();

  const userEmail    = emailInput.value.trim();
  const userPassword = passwordInput.value;

  // Validasi field kosong sebelum request ke Firebase
  if (!userEmail || !userPassword) {
    showToast("Lengkapi email dan password.");
    return;
  }

  // Nonaktifkan tombol agar tidak double-submit
  setLoading(true);

  try {
    // Atur persistensi sesi: lokal (ingat saya) atau sesi saja
    const persistence = rememberMe.checked
      ? browserLocalPersistence
      : browserSessionPersistence;

    await setPersistence(auth, persistence);

    // Login dengan email & password
    const { user } = await signInWithEmailAndPassword(auth, userEmail, userPassword);

    // Ambil role dari Firestore lalu redirect
    await loadUserRole(user.uid);

  } catch (error) {
    console.error("[Login Error]", error);
    showError(error.code);
    setLoading(false);
  }
}


// ======================================
// FUNGSI: AMBIL ROLE PENGGUNA DARI FIRESTORE
// ======================================

async function loadUserRole(uid) {
  try {
    const snapshot = await getDoc(doc(db, "users", uid));

    if (!snapshot.exists()) {
      throw new Error("DATA_NOT_FOUND");
    }

    const { role = "user", nama = "" } = snapshot.data();

    // Simpan data sesi di localStorage
    localStorage.setItem("uid",  uid);
    localStorage.setItem("role", role);
    localStorage.setItem("nama", nama);

    redirectByRole(role);

  } catch (error) {
    console.error("[Load Role Error]", error);
    showToast("Gagal mengambil data pengguna. Silakan coba lagi.");
    setLoading(false);
  }
}


// ======================================
// FUNGSI: REDIRECT BERDASARKAN ROLE
// ======================================

function redirectByRole(role) {
  const routes = {
    admin:     "admin/dashboard.html",
    umkm:      "dashboard-umkm.html",
    affiliate: "dashboard-affiliate.html",
  };

  // Arahkan ke dashboard sesuai role, default ke beranda
  window.location.href = routes[role] ?? "index.html";
}


// ======================================
// FUNGSI: TAMPILKAN PESAN ERROR FIREBASE
// ======================================

function showError(code) {
  const errorMessages = {
    "auth/invalid-email":          "Format email tidak valid.",
    "auth/user-not-found":         "Email belum terdaftar.",
    "auth/wrong-password":         "Password yang dimasukkan salah.",
    "auth/invalid-credential":     "Email atau password salah.",
    "auth/too-many-requests":      "Terlalu banyak percobaan login. Coba beberapa saat lagi.",
    "auth/network-request-failed": "Periksa koneksi internet Anda.",
  };

  const message = errorMessages[code] ?? "Login gagal. Silakan coba lagi.";
  showToast(message);
}


// ======================================
// FUNGSI: LOADING STATE TOMBOL LOGIN
// ======================================

function setLoading(isLoading) {
  btnLogin.disabled     = isLoading;
  btnLogin.textContent  = isLoading ? "Memproses..." : "Masuk";
}


// ======================================
// FUNGSI: TAMPILKAN TOAST NOTIFIKASI
// ======================================

function showToast(message) {
  // Hapus toast lama jika masih ada
  document.querySelector(".toast")?.remove();

  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;
  // Aksesibilitas: agar screen reader membaca notifikasi
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");

  document.body.appendChild(toast);

  // Tampilkan dengan sedikit delay agar transisi CSS berjalan
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Sembunyikan & hapus setelah 3 detik
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
