// =============================================================
// register.js — Pendaftaran UMKM | PasarNusa
// Alur: validasi → Firebase Auth → simpan Firestore → redirect
// =============================================================

// --- Import Firebase (versi modular) -------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =============================================================
// KONFIGURASI FIREBASE
// =============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain:        "pasarnusa-18aa0.firebaseapp.com",
  projectId:         "pasarnusa-18aa0",
  storageBucket:     "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId:             "1:866998011671:web:5555115feb82741ab55952"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


// =============================================================
// REFERENSI ELEMEN DOM
// =============================================================

const form           = document.getElementById("registerForm");
const btnDaftar      = document.getElementById("btnDaftar");
const togglePassword = document.getElementById("togglePassword");

// Kolom input — dikelompokkan agar mudah diiterasi saat validasi
const fields = {
  nama:      document.getElementById("nama"),
  namaToko:  document.getElementById("namaToko"),
  email:     document.getElementById("email"),
  whatsapp:  document.getElementById("whatsapp"),
  alamat:    document.getElementById("alamat"),
  provinsi:  document.getElementById("provinsi"),
  kabupaten: document.getElementById("kabupaten"),
  kecamatan: document.getElementById("kecamatan"),
  desa:      document.getElementById("desa"),
  password:  document.getElementById("password"),
  agree:     document.getElementById("agree"),
};


// =============================================================
// TOMBOL SHOW / HIDE PASSWORD
// =============================================================

togglePassword.addEventListener("click", () => {
  const isHidden = fields.password.type === "password";
  fields.password.type           = isHidden ? "text" : "password";
  togglePassword.textContent     = isHidden ? "🙈" : "👁️";
  togglePassword.setAttribute("aria-label", isHidden ? "Sembunyikan password" : "Tampilkan password");
});


// =============================================================
// SUBMIT FORM
// =============================================================

form.addEventListener("submit", registerUmkm);

async function registerUmkm(e) {
  e.preventDefault();

  // --- Validasi sisi klien ---
  const validationError = getValidationError();
  if (validationError) {
    showToast(validationError);
    return;
  }

  setLoading(true);

  try {
    // Buat akun di Firebase Auth
    const credential = await createUserWithEmailAndPassword(
      auth,
      fields.email.value.trim(),
      fields.password.value
    );

    // Simpan profil UMKM ke Firestore
    await saveUmkm(credential.user.uid);

  } catch (error) {
    console.error("[registerUmkm]", error);
    showError(error.code);
    setLoading(false);
  }
}


// =============================================================
// VALIDASI — mengembalikan pesan error pertama, atau null jika valid
// =============================================================

function getValidationError() {
  const f = fields;

  // Cek semua field teks wajib tidak kosong
  const textFields = ["nama", "namaToko", "email", "whatsapp", "alamat",
                      "provinsi", "kabupaten", "kecamatan", "desa", "password"];
  for (const key of textFields) {
    if (!f[key].value.trim()) return "Lengkapi semua data.";
  }

  if (f.password.value.length < 6)               return "Password minimal 6 karakter.";
  if (!f.whatsapp.value.trim().startsWith("08")) return "Nomor WhatsApp harus diawali 08.";
  if (!f.agree.checked)                          return "Setujui syarat dan ketentuan.";

  return null;
}


// =============================================================
// SIMPAN DATA UMKM KE FIRESTORE
// =============================================================

async function saveUmkm(uid) {
  const f = fields;

  await setDoc(doc(db, "users", uid), {
    uid,

    // Identitas
    nama:      f.nama.value.trim(),
    namaToko:  f.namaToko.value.trim(),
    email:     f.email.value.trim(),
    whatsapp:  f.whatsapp.value.trim(),

    // Alamat
    alamat:    f.alamat.value.trim(),
    provinsi:  f.provinsi.value.trim(),
    kabupaten: f.kabupaten.value.trim(),
    kecamatan: f.kecamatan.value.trim(),
    desa:      f.desa.value.trim(),

    // Meta akun
    role:   "umkm",
    status: "aktif",

    // Profil toko — diisi saat onboarding berikutnya
    fotoToko:   "",
    logoToko:   "",
    deskripsi:  "",

    // Statistik awal
    rating:         0,
    totalProduk:    0,
    totalPesanan:   0,
    totalPenjualan: 0,
    pendapatan:     0,

    createdAt: serverTimestamp(),
  });

  // Keluarkan dari sesi; pengguna login secara eksplisit
  await signOut(auth);

  showToast("Pendaftaran UMKM berhasil! Silakan login.");
  setTimeout(() => { window.location.href = "login.html"; }, 1500);
}


// =============================================================
// PENANGANAN ERROR FIREBASE AUTH
// =============================================================

// Peta kode error → pesan ramah pengguna
const AUTH_ERRORS = {
  "auth/email-already-in-use":  "Email sudah digunakan oleh akun lain.",
  "auth/invalid-email":         "Format email tidak valid.",
  "auth/weak-password":         "Password terlalu lemah, coba yang lebih panjang.",
  "auth/network-request-failed":"Periksa koneksi internet Anda.",
};

function showError(code) {
  const message = AUTH_ERRORS[code] ?? "Terjadi kesalahan, silakan coba lagi.";
  showToast(message);
}


// =============================================================
// UTILITAS — state loading tombol
// =============================================================

function setLoading(isLoading) {
  btnDaftar.disabled   = isLoading;
  btnDaftar.textContent = isLoading ? "Mendaftarkan..." : "🏪 Daftarkan UMKM";
}


// =============================================================
// UTILITAS — notifikasi toast
// =============================================================

function showToast(message) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;           // textContent lebih aman dari innerText/innerHTML
  toast.setAttribute("role", "alert");   // agar screen reader mengumumkan pesan
  document.body.appendChild(toast);

  // Tampilkan dengan jeda singkat agar transisi CSS berjalan
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Sembunyikan lalu hapus dari DOM
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
