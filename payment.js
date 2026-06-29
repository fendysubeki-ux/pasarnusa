// =============================================================
// payment.js — Halaman Pembayaran PasarNusa
// =============================================================

import { initializeApp }    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth }           from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ─────────────────────────────────────────────
// KONFIGURASI FIREBASE
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// ELEMEN DOM
// ─────────────────────────────────────────────
const el = {
  orderContainer:    document.getElementById("orderContainer"),
  totalBayar:        document.getElementById("totalBayar"),
  paymentMethod:     document.getElementById("paymentMethod"),
  bankName:          document.getElementById("bankName"),
  rekening:          document.getElementById("rekening"),
  atasNama:          document.getElementById("atasNama"),
  statusPembayaran:  document.getElementById("statusPembayaran"),
  expiredTime:       document.getElementById("expiredTime"),
  nomorPesanan:      document.getElementById("nomorPesanan"),
  bayarBtn:          document.getElementById("bayarBtn"),
  copyRekening:      document.getElementById("copyRekening"),
  emptyPayment:      document.getElementById("emptyPayment"),
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let uid             = "";
let orderId         = "";
let dataPesanan     = {};
let dataUmkm        = {};
let countdownInterval = null;

// ─────────────────────────────────────────────
// INISIALISASI
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  try {
    await checkLogin();
    ambilOrderId();
    await loadPesanan();
    initButton();
  } catch (error) {
    console.error("initPage:", error);
    tampilkanKosong("Gagal memuat data pembayaran.");
  }
}

// ─────────────────────────────────────────────
// AUTH — pastikan pengguna sudah login
// ─────────────────────────────────────────────
async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}

// ─────────────────────────────────────────────
// ORDER ID — ambil dari query string ?id=...
// ─────────────────────────────────────────────
function ambilOrderId() {
  orderId = new URLSearchParams(window.location.search).get("id");

  if (!orderId) {
    window.location.href = "pesanan-saya.html";
  }
}

// ─────────────────────────────────────────────
// LOAD PESANAN — ambil dokumen dari Firestore
// ─────────────────────────────────────────────
async function loadPesanan() {
  try {
    const snap = await getDoc(doc(db, "pesanan", orderId));

    if (!snap.exists()) {
      tampilkanKosong();
      return;
    }

    dataPesanan = snap.data();

    // Amankan: hanya pemilik pesanan yang boleh melihat
    if (dataPesanan.uidPembeli !== uid) {
      window.location.href = "pesanan-saya.html";
      return;
    }

    await loadUmkm();
    renderPesanan();
    startCountdown();

  } catch (error) {
    console.error("loadPesanan:", error);
    showToast("Gagal memuat pembayaran.");
  }
}

// ─────────────────────────────────────────────
// LOAD UMKM — ambil data rekening penjual
// ─────────────────────────────────────────────
async function loadUmkm() {
  const snap = await getDoc(doc(db, "users", dataPesanan.uidUmkm));

  if (snap.exists()) {
    dataUmkm = snap.data();
  }
}

// ─────────────────────────────────────────────
// RENDER — isi semua elemen DOM dengan data
// ─────────────────────────────────────────────
function renderPesanan() {
  el.nomorPesanan.textContent    = orderId.substring(0, 8);
  el.totalBayar.textContent      = formatRupiah(dataPesanan.totalBayar);
  el.statusPembayaran.textContent = dataPesanan.statusPembayaran || "Belum Dibayar";
  el.bankName.textContent        = dataUmkm.namaBank        || "-";
  el.rekening.textContent        = dataUmkm.nomorRekening   || "-";
  el.atasNama.textContent        = dataUmkm.atasNama        || "-";
  el.paymentMethod.textContent   = dataPesanan.paymentMethod || "Transfer Bank";

  // Ringkasan biaya di kolom kiri
  el.orderContainer.innerHTML = `
    <div class="summary-item">
      <span>Subtotal</span>
      <b>${formatRupiah(dataPesanan.subtotal)}</b>
    </div>
    <div class="summary-item">
      <span>Ongkir</span>
      <b>${formatRupiah(dataPesanan.ongkir)}</b>
    </div>
    <div class="summary-item">
      <span>Total</span>
      <b>${formatRupiah(dataPesanan.totalBayar)}</b>
    </div>
  `;
}

// ─────────────────────────────────────────────
// TOMBOL — daftarkan semua event listener
// ─────────────────────────────────────────────
function initButton() {
  el.copyRekening.addEventListener("click", salinRekening);
  el.bayarBtn.addEventListener("click", prosesPembayaran);

  // Perubahan metode pembayaran → simpan ke Firestore
  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", async () => {
      el.paymentMethod.textContent = radio.value;

      try {
        await updateDoc(doc(db, "pesanan", orderId), { paymentMethod: radio.value });
      } catch (error) {
        console.error("Gagal menyimpan metode pembayaran:", error);
        showToast("Gagal menyimpan metode pembayaran.");
      }
    });
  });
}

// ─────────────────────────────────────────────
// SALIN REKENING — clipboard API
// ─────────────────────────────────────────────
function salinRekening() {
  navigator.clipboard
    .writeText(el.rekening.textContent)
    .then(() => showToast("Nomor rekening berhasil disalin."))
    .catch(() => showToast("Gagal menyalin nomor rekening."));
}

// ─────────────────────────────────────────────
// COUNTDOWN — hitung mundur 24 jam dari createdAt
// ─────────────────────────────────────────────
function startCountdown() {
  // Bersihkan interval sebelumnya jika ada
  if (countdownInterval) clearInterval(countdownInterval);

  const createdAt = dataPesanan.createdAt?.toDate?.() ?? new Date();
  const expired   = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  countdownInterval = setInterval(() => {
    const selisih = expired - new Date();

    if (selisih <= 0) {
      clearInterval(countdownInterval);
      el.expiredTime.textContent       = "Kedaluwarsa";
      el.statusPembayaran.textContent  = "Kedaluwarsa";
      return;
    }

    const jam   = Math.floor(selisih / 3_600_000);
    const menit = Math.floor((selisih % 3_600_000) / 60_000);
    const detik = Math.floor((selisih % 60_000) / 1_000);

    el.expiredTime.textContent = `${jam}j ${menit}m ${detik}d`;
  }, 1000);
}

// ─────────────────────────────────────────────
// PROSES PEMBAYARAN — update status & redirect
// ─────────────────────────────────────────────
async function prosesPembayaran() {
  try {
    await updateDoc(doc(db, "pesanan", orderId), {
      paymentStatus: "Menunggu Pembayaran",
      updatedAt:     serverTimestamp(),
    });

    showToast("Silakan lakukan pembayaran sesuai metode yang dipilih.");

    setTimeout(() => {
      window.location.href = `upload-bukti.html?id=${orderId}`;
    }, 1000);

  } catch (error) {
    console.error("prosesPembayaran:", error);
    showToast("Gagal memproses pembayaran.");
  }
}

// ─────────────────────────────────────────────
// FORMAT RUPIAH
// ─────────────────────────────────────────────
function formatRupiah(nilai) {
  return "Rp " + Number(nilai || 0).toLocaleString("id-ID");
}

// ─────────────────────────────────────────────
// TOAST — notifikasi kecil sementara
// ─────────────────────────────────────────────
function showToast(message) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Delay kecil agar transisi CSS berjalan
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

// ─────────────────────────────────────────────
// HELPER — tampilkan state kosong & sembunyikan konten
// ─────────────────────────────────────────────
function tampilkanKosong(pesan) {
  el.emptyPayment.hidden = false;

  if (pesan) showToast(pesan);
}
