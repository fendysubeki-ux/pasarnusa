// ============================================================
// notifikasi.js — Logika Halaman Notifikasi PasarNusa
// Menangani: autentikasi, load/render notifikasi, aksi massal,
//            statistik, auto-refresh, dan toast feedback.
// ============================================================

import { initializeApp }   from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ============================================================
// KONFIGURASI FIREBASE
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain:        "pasarnusa-18aa0.firebaseapp.com",
  projectId:         "pasarnusa-18aa0",
  storageBucket:     "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId:             "1:866998011671:web:5555115feb82741ab55952",
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);


// ============================================================
// REFERENSI ELEMEN DOM
// ============================================================

const notifContainer = document.getElementById("notifContainer");
const elTotal        = document.getElementById("totalNotif");
const elBelum        = document.getElementById("belumDibaca");
const elSudah        = document.getElementById("sudahDibaca");
const readAllBtn     = document.getElementById("readAllBtn");
const deleteAllBtn   = document.getElementById("deleteAllBtn");
const emptyState     = document.getElementById("emptyNotif");


// ============================================================
// STATE MODUL
// ============================================================

let uid         = "";        // UID pengguna yang sedang login
let semuaNotif  = [];        // Cache daftar notifikasi terkini
let refreshTimer = null;     // Referensi timer auto-refresh


// ============================================================
// INISIALISASI
// ============================================================

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  await loadNotif();
  initButtons();
  startAutoRefresh();
}


// ============================================================
// CEK LOGIN — Redirect ke login.html jika belum masuk
// ============================================================

async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}


// ============================================================
// LOAD NOTIFIKASI — Ambil dari Firestore, urutkan terbaru dulu
// ============================================================

async function loadNotif() {
  try {
    const snap = await getDocs(
      query(
        collection(db, "notifikasi"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
      )
    );

    semuaNotif = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderNotif();
    updateStatistik();
  } catch (err) {
    console.error("[loadNotif]", err);
    showToast("Gagal memuat notifikasi.");
  }
}


// ============================================================
// RENDER — Tampilkan daftar notifikasi atau empty state
// ============================================================

function renderNotif() {
  const isEmpty = semuaNotif.length === 0;

  // Tampilkan / sembunyikan empty state
  emptyState.hidden       = !isEmpty;
  emptyState.ariaHidden   = String(isEmpty ? "false" : "true");
  notifContainer.hidden   = isEmpty;

  if (isEmpty) return;

  // Bangun fragmen DOM sekali, hindari innerHTML += dalam loop
  const fragment = document.createDocumentFragment();

  semuaNotif.forEach(item => {
    const el = document.createElement("div");
    el.className  = `notif-item${item.dibaca ? "" : " unread"}`;
    el.dataset.id = item.id;
    el.setAttribute("role", "listitem");

    // Gunakan textContent untuk field user agar aman dari XSS
    const judulEl  = document.createElement("h3");
    judulEl.textContent = item.judul;

    const pesanEl  = document.createElement("p");
    pesanEl.textContent = item.pesan;

    const timeEl   = document.createElement("div");
    timeEl.className    = "notif-time";
    timeEl.textContent  = formatTanggal(item.createdAt);

    el.innerHTML = `
      <div class="notif-icon" aria-hidden="true">${getIcon(item.judul)}</div>
      <div class="notif-content"></div>
      <div class="notif-actions">
        <button class="btn btn-secondary js-baca"
                aria-label="${item.dibaca ? "Sudah dibaca" : "Tandai dibaca"}">
          ${item.dibaca ? "✓ Dibaca" : "Baca"}
        </button>
        <button class="btn btn-danger js-hapus" aria-label="Hapus notifikasi">🗑</button>
      </div>
    `;

    // Sisipkan elemen teks yang sudah di-escape
    el.querySelector(".notif-content").append(judulEl, pesanEl, timeEl);

    // Event listener (lebih aman & efisien daripada onclick inline)
    el.querySelector(".js-baca").addEventListener("click",  () => bacaNotif(item.id));
    el.querySelector(".js-hapus").addEventListener("click", () => hapusNotif(item.id));

    fragment.appendChild(el);
  });

  notifContainer.replaceChildren(fragment);
}


// ============================================================
// STATISTIK — Perbarui angka ringkasan di atas
// ============================================================

function updateStatistik() {
  const jumlahBelum = semuaNotif.filter(n => !n.dibaca).length;

  elTotal.textContent = semuaNotif.length;
  elBelum.textContent = jumlahBelum;
  elSudah.textContent = semuaNotif.length - jumlahBelum;
}


// ============================================================
// ICON — Pilih emoji berdasarkan kata kunci di judul
// ============================================================

function getIcon(judul = "") {
  const teks = judul.toLowerCase();
  if (teks.includes("pesanan"))   return "📦";
  if (teks.includes("bayar"))     return "💳";
  if (teks.includes("kirim"))     return "🚚";
  if (teks.includes("review"))    return "⭐";
  if (teks.includes("affiliate")) return "💰";
  return "🔔";
}


// ============================================================
// TANDAI DIBACA — Perbarui satu notifikasi
// ============================================================

async function bacaNotif(id) {
  try {
    await updateDoc(doc(db, "notifikasi", id), { dibaca: true });
    await loadNotif();
  } catch (err) {
    console.error("[bacaNotif]", err);
    showToast("Gagal memperbarui notifikasi.");
  }
}


// ============================================================
// HAPUS — Hapus satu notifikasi
// ============================================================

async function hapusNotif(id) {
  try {
    await deleteDoc(doc(db, "notifikasi", id));
    await loadNotif();
    showToast("Notifikasi dihapus.");
  } catch (err) {
    console.error("[hapusNotif]", err);
    showToast("Gagal menghapus notifikasi.");
  }
}


// ============================================================
// TANDAI SEMUA DIBACA — Gunakan writeBatch agar efisien
// ============================================================

async function bacaSemua() {
  const belumDibacaList = semuaNotif.filter(n => !n.dibaca);
  if (belumDibacaList.length === 0) {
    showToast("Semua notifikasi sudah dibaca.");
    return;
  }

  try {
    const batch = writeBatch(db);
    belumDibacaList.forEach(n => {
      batch.update(doc(db, "notifikasi", n.id), { dibaca: true });
    });
    await batch.commit();
    await loadNotif();
    showToast("Semua notifikasi telah dibaca.");
  } catch (err) {
    console.error("[bacaSemua]", err);
    showToast("Gagal memperbarui notifikasi.");
  }
}


// ============================================================
// HAPUS SEMUA — Konfirmasi dulu, lalu batch delete
// ============================================================

async function hapusSemua() {
  if (!confirm("Hapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.")) return;

  try {
    const batch = writeBatch(db);
    semuaNotif.forEach(n => {
      batch.delete(doc(db, "notifikasi", n.id));
    });
    await batch.commit();
    await loadNotif();
    showToast("Semua notifikasi dihapus.");
  } catch (err) {
    console.error("[hapusSemua]", err);
    showToast("Gagal menghapus notifikasi.");
  }
}


// ============================================================
// INISIALISASI TOMBOL AKSI
// ============================================================

function initButtons() {
  readAllBtn.addEventListener("click",   bacaSemua);
  deleteAllBtn.addEventListener("click", hapusSemua);
}


// ============================================================
// AUTO-REFRESH — Muat ulang notifikasi setiap 30 detik
// ============================================================

function startAutoRefresh() {
  // Bersihkan timer lama jika ada (mencegah duplikasi)
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(loadNotif, 30_000);
}


// ============================================================
// FORMAT TANGGAL — Ubah Firestore Timestamp atau string ke lokal
// ============================================================

function formatTanggal(waktu) {
  if (!waktu) return "-";

  const tanggal = waktu?.toDate ? waktu.toDate() : new Date(waktu);
  if (isNaN(tanggal.getTime())) return "-";

  return tanggal.toLocaleString("id-ID", {
    day:    "2-digit",
    month:  "long",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}


// ============================================================
// TOAST — Notifikasi singkat di layar (muncul 3 detik)
// ============================================================

function showToast(pesan) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = pesan;           // textContent, bukan innerText — lebih aman
  toast.setAttribute("role", "alert"); // Dibaca screen reader secara otomatis

  document.body.appendChild(toast);

  // Trigger transisi CSS (butuh delay 1 frame agar class "show" terbaca)
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
