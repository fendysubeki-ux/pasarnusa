// =============================================================================
// PasarNusa — tentang.js
// Mengambil data produk dari Firestore dan menampilkan statistik halaman Tentang.
// =============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// -----------------------------------------------------------------------------
// Konfigurasi Firebase
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain:        "pasarnusa-18aa0.firebaseapp.com",
  projectId:         "pasarnusa-18aa0",
  storageBucket:     "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId:             "1:866998011671:web:5555115feb82741ab55952",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// -----------------------------------------------------------------------------
// Referensi elemen DOM
// Hero stats (atas halaman) dan ringkasan stats (seksi Angka)
// -----------------------------------------------------------------------------
const els = {
  totalUmkm:   document.getElementById("totalUmkm"),
  totalProduk:  document.getElementById("totalProduk"),
  totalWilayah: document.getElementById("totalWilayah"),
  statUmkm:    document.getElementById("statUmkm"),
  statProduk:   document.getElementById("statProduk"),
  statWilayah:  document.getElementById("statWilayah"),
};

// -----------------------------------------------------------------------------
// Inisialisasi halaman
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setFooterYear();
  loadStatistik();
});

// Tandai halaman sudah selesai dimuat (untuk animasi CSS fade-in)
document.body.classList.add("page-loaded");

// -----------------------------------------------------------------------------
// Ambil & proses data produk dari Firestore
// Hanya produk dengan status "Aktif" dan stok > 0 yang dihitung.
// -----------------------------------------------------------------------------
async function loadStatistik() {
  try {
    const snapshot = await getDocs(collection(db, "produk"));

    const produkAktif = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const stokValid = Number(data.stok ?? 0) > 0;

      if (data.status !== "Aktif" || !stokValid) return;

      produkAktif.push(data);
    });

    updateStatistik(produkAktif);
  } catch (error) {
    console.error("[PasarNusa] Gagal memuat statistik:", error);
    showError();
  }
}

// -----------------------------------------------------------------------------
// Hitung & tampilkan statistik dengan animasi angka
// -----------------------------------------------------------------------------
function updateStatistik(produk) {
  const umkm    = new Set(produk.map((p) => p.uid).filter(Boolean));
  const wilayah = new Set(produk.map((p) => p.provinsi).filter(Boolean));

  const stats = {
    produk:  produk.length,
    umkm:    umkm.size,
    wilayah: wilayah.size,
  };

  animateNumber(els.totalProduk,  stats.produk);
  animateNumber(els.totalUmkm,    stats.umkm);
  animateNumber(els.totalWilayah, stats.wilayah);
  animateNumber(els.statProduk,   stats.produk);
  animateNumber(els.statUmkm,     stats.umkm);
  animateNumber(els.statWilayah,  stats.wilayah);
}

// -----------------------------------------------------------------------------
// Animasi count-up dari 0 ke target
// Durasi tetap ±1 detik terlepas dari besarnya angka target.
// -----------------------------------------------------------------------------
function animateNumber(element, target) {
  if (!element || target <= 0) {
    if (element) element.textContent = target;
    return;
  }

  const DURATION_MS  = 1000;
  const INTERVAL_MS  = 20;
  const steps        = DURATION_MS / INTERVAL_MS;           // ~50 langkah
  const increment    = Math.max(1, Math.ceil(target / steps));

  let current = 0;

  const timer = setInterval(() => {
    current += increment;

    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    element.textContent = current.toLocaleString("id-ID");  // format angka lokal
  }, INTERVAL_MS);
}

// -----------------------------------------------------------------------------
// Tampilkan tanda "-" di semua elemen statistik saat terjadi error
// -----------------------------------------------------------------------------
function showError() {
  Object.values(els).forEach((el) => {
    if (el) el.textContent = "-";
  });
}

// -----------------------------------------------------------------------------
// Perbarui tahun di footer secara otomatis
// -----------------------------------------------------------------------------
function setFooterYear() {
  const elTahun = document.querySelector(".footer-bottom strong");
  if (elTahun) elTahun.textContent = new Date().getFullYear();
}
