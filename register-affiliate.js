// ======================================
// PASARNUSA - REGISTER AFFILIATE
// register-affiliate.js
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ======================================
// FIREBASE INIT
// Catatan: apiKey Firebase Web aman untuk diekspos di client-side,
// keamanan sebenarnya diatur lewat Firestore Security Rules.
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
// ELEMENTS
// ======================================

const form = document.getElementById("registerForm");
const namaInput = document.getElementById("nama");
const emailInput = document.getElementById("email");
const whatsappInput = document.getElementById("whatsapp");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const agreeInput = document.getElementById("agree");
const btnDaftar = document.getElementById("btnDaftar");
const togglePassword = document.getElementById("togglePassword");
const formMessage = document.getElementById("formMessage"); // boleh null jika HTML belum diperbarui

// Teks asli tombol, dipakai untuk reset setelah proses selesai/gagal
const BTN_DEFAULT_TEXT = btnDaftar.innerText;

// Validasi pola input (selaras dengan atribut pattern di HTML)
const WHATSAPP_REGEX = /^08[0-9]{8,12}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

// ======================================
// SHOW / HIDE PASSWORD
// ======================================

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.innerText = isHidden ? "🙈" : "👁️";
  togglePassword.setAttribute("aria-pressed", String(isHidden));
});

// ======================================
// FORM SUBMIT
// ======================================

form.addEventListener("submit", registerAffiliate);

/**
 * Menangani submit form pendaftaran affiliate:
 * validasi input, buat akun di Firebase Auth, lalu simpan profil ke Firestore.
 */
async function registerAffiliate(e) {
  e.preventDefault();

  const data = {
    nama: namaInput.value.trim(),
    email: emailInput.value.trim(),
    whatsapp: whatsappInput.value.trim(),
    username: usernameInput.value.trim().toLowerCase(),
    password: passwordInput.value,
  };

  const errorMessage = validateForm(data);
  if (errorMessage) {
    showMessage(errorMessage, "error");
    return;
  }

  setLoading(true);

  try {
    const usernameTaken = await isUsernameTaken(data.username);
    if (usernameTaken) {
      showMessage("Username sudah digunakan. Silakan pilih username lain.", "error");
      setLoading(false);
      return;
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    await saveAffiliate(credential.user.uid, data);
  } catch (error) {
    console.error(error);
    showMessage(getAuthErrorMessage(error.code), "error");
    setLoading(false);
  }
}

/**
 * Validasi seluruh field form.
 * Mengembalikan pesan error (string) jika ada masalah, atau null jika valid.
 */
function validateForm({ nama, email, whatsapp, username, password }) {
  if (!nama || !email || !whatsapp || !username || !password) {
    return "Lengkapi semua data.";
  }
  if (password.length < 6) {
    return "Password minimal 6 karakter.";
  }
  if (!WHATSAPP_REGEX.test(whatsapp)) {
    return "Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.";
  }
  if (!USERNAME_REGEX.test(username)) {
    return "Username harus 4-20 karakter, hanya huruf/angka/underscore.";
  }
  if (!agreeInput.checked) {
    return "Anda harus menyetujui syarat dan ketentuan.";
  }
  return null;
}

/**
 * Mengecek apakah username sudah dipakai oleh pengguna lain di koleksi "users".
 * Mengembalikan true jika sudah dipakai, false jika masih tersedia.
 */
async function isUsernameTaken(username) {
  const usersRef = collection(db, "users");
  const usernameQuery = query(usersRef, where("username", "==", username), limit(1));
  const snapshot = await getDocs(usernameQuery);
  return !snapshot.empty;
}

// ======================================
// SAVE AFFILIATE TO FIRESTORE
// ======================================

/**
 * Menyimpan data profil affiliate ke Firestore setelah akun Auth dibuat.
 * Jika gagal, akun Auth tetap dibuat — pengguna bisa diarahkan untuk login
 * dan melengkapi data, atau admin dapat memperbaikinya secara manual.
 */
async function saveAffiliate(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      nama: data.nama,
      email: data.email,
      whatsapp: data.whatsapp,
      username: data.username,
      role: "affiliate",
      status: "aktif",
      saldoKomisi: 0,
      totalKomisi: 0,
      totalKlik: 0,
      totalPenjualan: 0,
      totalOrder: 0,
      createdAt: serverTimestamp(),
    });

    await signOut(auth);

    showMessage("Pendaftaran affiliate berhasil. Mengalihkan ke halaman login...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    console.error(error);
    showMessage("Akun berhasil dibuat, tetapi gagal menyimpan profil affiliate. Silakan hubungi admin.", "error");
    setLoading(false);
  }
}

// ======================================
// HELPERS
// ======================================

/** Mengatur status loading pada tombol submit. */
function setLoading(isLoading) {
  btnDaftar.disabled = isLoading;
  btnDaftar.innerText = isLoading ? "Mendaftarkan..." : BTN_DEFAULT_TEXT;
}

/** Menerjemahkan kode error Firebase Auth ke pesan berbahasa Indonesia. */
function getAuthErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Email sudah digunakan.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/weak-password":
      return "Password terlalu lemah.";
    case "auth/network-request-failed":
      return "Periksa koneksi internet Anda.";
    default:
      return "Terjadi kesalahan. Silakan coba lagi.";
  }
}

/**
 * Menampilkan pesan ke pengguna.
 * Mengutamakan elemen #formMessage (lebih ramah aksesibilitas) jika tersedia,
 * jika tidak, jatuh kembali ke toast notification.
 */
function showMessage(message, type = "error") {
  if (formMessage) {
    formMessage.textContent = message;
    formMessage.className = `form-message form-message--${type}`;
    return;
  }
  showToast(message);
}

/** Toast notification sederhana sebagai fallback jika #formMessage tidak ada di HTML. */
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
