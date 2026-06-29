/**
 * tracking.js — Logika halaman Tracking Pesanan
 * PasarNusa © 2026
 *
 * Alur:
 *  1. Tunggu DOM siap → initPage()
 *  2. Verifikasi login → checkLogin()
 *  3. Baca ?id= dari URL → ambilId()
 *  4. Ambil data Firestore → loadTracking()
 *  5. Isi UI + render timeline → isiData() + renderTimeline()
 *  6. Pasang event listener tombol → initButton()
 *  7. Auto-refresh setiap 30 detik
 */

import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* ─────────────────────────────────────────
   KONFIGURASI FIREBASE
   ───────────────────────────────────────── */
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


/* ─────────────────────────────────────────
   REFERENSI ELEMEN DOM
   Dikelompokkan agar mudah ditemukan saat
   debugging dan tidak perlu querySelector
   berulang di setiap fungsi.
   ───────────────────────────────────────── */
const el = {
  // Ringkasan pesanan
  nomorPesanan:    document.getElementById("nomorPesanan"),
  statusPesanan:   document.getElementById("statusPesanan"),
  totalBayar:      document.getElementById("totalBayar"),
  kurir:           document.getElementById("kurir"),
  resi:            document.getElementById("resi"),
  // Penjual
  namaToko:        document.getElementById("namaToko"),
  namaPenjual:     document.getElementById("namaPenjual"),
  whatsappPenjual: document.getElementById("whatsappPenjual"),
  // Timeline
  timelineContainer: document.getElementById("timelineContainer"),
  // Sidebar summary
  summaryStatus:   document.getElementById("summaryStatus"),
  summaryKurir:    document.getElementById("summaryKurir"),
  summaryResi:     document.getElementById("summaryResi"),
  estimasiSampai:  document.getElementById("estimasiSampai"),
  // Tombol aksi
  copyResi:        document.getElementById("copyResi"),
  chatPenjual:     document.getElementById("chatPenjual"),
  detailPesanan:   document.getElementById("detailPesanan"),
  // Empty state
  emptyTracking:   document.getElementById("emptyTracking"),
};


/* ─────────────────────────────────────────
   KONSTANTA — urutan & ikon status pesanan
   ───────────────────────────────────────── */
const STATUS_LIST = [
  "Belum Bayar",
  "Menunggu Verifikasi",
  "Diproses",
  "Dikirim",
  "Selesai",
];

const STATUS_ICON = {
  "Belum Bayar":          "💳",
  "Menunggu Verifikasi":  "🧾",
  "Diproses":             "📦",
  "Dikirim":              "🚚",
  "Selesai":              "✅",
};

const STATUS_DESKRIPSI = {
  "Belum Bayar":         "Menunggu pembayaran dari pembeli.",
  "Menunggu Verifikasi": "Bukti pembayaran sedang diperiksa.",
  "Diproses":            "Pesanan sedang disiapkan oleh penjual.",
  "Dikirim":             "Pesanan sedang dalam perjalanan.",
  "Selesai":             "Pesanan telah diterima.",
};

const STATUS_ESTIMASI = {
  "Belum Bayar":         "Menunggu pembayaran",
  "Menunggu Verifikasi": "1 hari",
  "Diproses":            "1–2 hari",
  "Dikirim":             "2–5 hari",
  "Selesai":             "Pesanan selesai",
};


/* ─────────────────────────────────────────
   STATE MODUL
   ───────────────────────────────────────── */
let uid        = "";
let pesananId  = "";
let dataPesanan = {};


/* ─────────────────────────────────────────
   ENTRY POINT
   ───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();   // redirect ke login.html jika belum masuk
  ambilId();            // baca ?id= dari URL
  await loadTracking(); // muat data dari Firestore
  initButton();         // pasang event listener tombol
}


/* ─────────────────────────────────────────
   AUTH — cek status login
   ───────────────────────────────────────── */
async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}


/* ─────────────────────────────────────────
   AMBIL ID PESANAN DARI URL
   Contoh: tracking.html?id=abc123
   ───────────────────────────────────────── */
function ambilId() {
  pesananId = new URLSearchParams(window.location.search).get("id");

  if (!pesananId) {
    window.location.href = "pesanan-saya.html";
  }
}


/* ─────────────────────────────────────────
   LOAD TRACKING — ambil dokumen Firestore
   ───────────────────────────────────────── */
async function loadTracking() {
  try {
    const snap = await getDoc(doc(db, "pesanan", pesananId));

    // Pesanan tidak ditemukan
    if (!snap.exists()) {
      tampilkanEmptyState();
      return;
    }

    dataPesanan = snap.data();

    // Keamanan: pastikan pesanan milik pengguna yang sedang login
    if (dataPesanan.uidPembeli !== uid) {
      window.location.href = "pesanan-saya.html";
      return;
    }

    isiData();
    renderTimeline();

  } catch (error) {
    console.error("[tracking.js] Gagal memuat data:", error);
    showToast("Gagal memuat tracking. Coba lagi.");
    showError("Tidak dapat memuat data. Periksa koneksi Anda.");
  }
}


/* ─────────────────────────────────────────
   ISI DATA — perbarui semua teks UI
   ───────────────────────────────────────── */
function isiData() {
  const d = dataPesanan;

  // Nomor pesanan disingkat 8 karakter pertama agar ringkas
  el.nomorPesanan.textContent    = `#${pesananId.substring(0, 8).toUpperCase()}`;
  el.statusPesanan.textContent   = d.status            || "—";
  el.totalBayar.textContent      = formatRupiah(d.totalBayar);
  el.kurir.textContent           = d.kurir             || "—";
  el.resi.textContent            = d.resi              || "—";

  // Informasi penjual
  el.namaToko.textContent        = d.namaUmkm          || "—";
  el.namaPenjual.textContent     = d.namaPemilik        || d.namaUmkm || "—";
  el.whatsappPenjual.textContent = d.whatsappUmkm       || "—";

  // Sidebar ringkasan
  el.summaryStatus.textContent   = d.status            || "—";
  el.summaryKurir.textContent    = d.kurir             || "—";
  el.summaryResi.textContent     = d.resi              || "—";
  el.estimasiSampai.textContent  = STATUS_ESTIMASI[d.status] || "—";

  // Href tombol aksi
  el.detailPesanan.href = `detail-pesanan.html?id=${pesananId}`;
  el.chatPenjual.href   = buildWhatsAppUrl(d.whatsappUmkm);
}


/* ─────────────────────────────────────────
   RENDER TIMELINE — tampilkan langkah status
   Menggunakan DocumentFragment agar DOM
   hanya disentuh sekali (lebih efisien dari
   innerHTML += di dalam loop).
   ───────────────────────────────────────── */
function renderTimeline() {
  const currentIndex = STATUS_LIST.indexOf(dataPesanan.status);
  const fragment     = document.createDocumentFragment();

  STATUS_LIST.forEach((status, index) => {
    const isActive  = index <= currentIndex;
    const isCurrent = index === currentIndex;

    const item = document.createElement("div");
    item.className = `timeline-item${isActive ? " active" : ""}`;

    // aria-label untuk screen reader
    item.setAttribute(
      "aria-label",
      `${status}${isCurrent ? " (status saat ini)" : ""}`
    );

    item.innerHTML = `
      <div class="timeline-icon" aria-hidden="true">${STATUS_ICON[status]}</div>
      <div class="timeline-content">
        <h3>${status}</h3>
        <p>${STATUS_DESKRIPSI[status] ?? "—"}</p>
      </div>
    `;

    fragment.appendChild(item);
  });

  // Reset aria-busy setelah konten selesai dimuat
  el.timelineContainer.setAttribute("aria-busy", "false");
  el.timelineContainer.innerHTML = "";
  el.timelineContainer.appendChild(fragment);
}


/* ─────────────────────────────────────────
   EVENT LISTENER TOMBOL
   ───────────────────────────────────────── */
function initButton() {
  el.copyResi.addEventListener("click", () => {
    if (!dataPesanan.resi) {
      showToast("Nomor resi belum tersedia.");
      return;
    }

    navigator.clipboard
      .writeText(dataPesanan.resi)
      .then(() => showToast("Nomor resi berhasil disalin."))
      .catch(() => showToast("Gagal menyalin resi."));
  });
}


/* ─────────────────────────────────────────
   HELPER — buat URL WhatsApp
   Hapus semua karakter non-angka, tangani
   awalan 0 → 62 (kode negara Indonesia).
   ───────────────────────────────────────── */
function buildWhatsAppUrl(nomor = "") {
  let digits = nomor.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }

  return digits ? `https://wa.me/${digits}` : "#";
}


/* ─────────────────────────────────────────
   HELPER — format angka ke Rupiah
   ───────────────────────────────────────── */
function formatRupiah(angka) {
  return "Rp\u00a0" + Number(angka || 0).toLocaleString("id-ID");
  // \u00a0 = non-breaking space agar "Rp" dan angka tidak terpisah baris
}


/* ─────────────────────────────────────────
   HELPER — tampilkan empty state
   ───────────────────────────────────────── */
function tampilkanEmptyState() {
  // Sembunyikan konten utama, tampilkan empty state
  document.querySelector(".tracking-layout")?.remove();
  el.emptyTracking.removeAttribute("hidden");
}


/* ─────────────────────────────────────────
   HELPER — tampilkan pesan error di timeline
   ───────────────────────────────────────── */
function showError(message) {
  el.timelineContainer.innerHTML = `
    <div class="empty-state-mini" role="alert">
      ⚠️ ${message}
    </div>
  `;
}


/* ─────────────────────────────────────────
   HELPER — toast notifikasi
   Dibuat sekali, dihapus otomatis setelah 3 detik.
   ───────────────────────────────────────── */
function showToast(message) {
  // Hindari toast menumpuk jika dipanggil cepat berulang
  document.querySelector(".toast")?.remove();

  const toast = document.createElement("div");
  toast.className  = "toast";
  toast.textContent = message;
  toast.setAttribute("role", "status");    // dibacakan screen reader
  toast.setAttribute("aria-live", "polite");

  document.body.appendChild(toast);

  // Tampilkan dengan sedikit delay agar transisi CSS berjalan
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}


/* ─────────────────────────────────────────
   AUTO-REFRESH setiap 30 detik
   Hanya berjalan jika pesananId sudah ada
   dan status pesanan belum selesai.
   ───────────────────────────────────────── */
const REFRESH_INTERVAL_MS = 30_000;

setInterval(async () => {
  if (!pesananId) return;

  // Tidak perlu refresh jika pesanan sudah selesai
  if (dataPesanan.status === "Selesai") return;

  await loadTracking();
}, REFRESH_INTERVAL_MS);
