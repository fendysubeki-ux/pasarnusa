// =============================================================================
// wilayah.js — Halaman Wilayah PasarNusa
// Bertanggung jawab untuk:
//   1. Memuat data produk dari Firestore
//   2. Mengelompokkan produk per provinsi
//   3. Merender grid wilayah dan statistik
//   4. Menangani pencarian dan wilayah populer
// =============================================================================


// -----------------------------------------------------------------------------
// IMPORT FIREBASE
// -----------------------------------------------------------------------------

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore, collection, getDocs }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// -----------------------------------------------------------------------------
// KONFIGURASI FIREBASE
// Ganti nilai ini jika project berpindah atau environment berubah.
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
// REFERENSI ELEMEN DOM
// Diambil sekali di awal agar tidak berulang kali query saat runtime.
// -----------------------------------------------------------------------------

const wilayahGrid       = document.getElementById("wilayahGrid");
const elTotalProvinsi   = document.getElementById("totalProvinsi");
const elTotalKabupaten  = document.getElementById("totalKabupaten");
const elTotalKecamatan  = document.getElementById("totalKecamatan");
const elTotalDesa       = document.getElementById("totalDesa");
const elTotalUmkm       = document.getElementById("totalUmkm");
const elSearchWilayah   = document.getElementById("searchWilayah");
const formSearch        = document.getElementById("formSearchWilayah");


// -----------------------------------------------------------------------------
// STATE APLIKASI
// Data yang disimpan di memori setelah Firestore selesai dimuat.
// -----------------------------------------------------------------------------

/** @type {Array<{nama: string, jumlah: number}>} */
let semuaProvinsi = [];


// -----------------------------------------------------------------------------
// INISIALISASI
// Dipanggil saat DOM siap; urutan penting: loading → fetch → render
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  loadWilayah();
  initSearch();
});


// -----------------------------------------------------------------------------
// LOADING — Skeleton placeholder sebelum data siap
// -----------------------------------------------------------------------------

/**
 * Menampilkan 8 skeleton card sebagai placeholder visual
 * saat data Firestore belum selesai dimuat.
 */
function showLoading() {
  const skeletonHTML = `
    <div class="wilayah-card skeleton-card" aria-hidden="true">
      <div class="wilayah-icon skeleton"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    </div>`;

  wilayahGrid.setAttribute("aria-busy", "true");
  wilayahGrid.innerHTML = skeletonHTML.repeat(8);
}


// -----------------------------------------------------------------------------
// FETCH DATA — Ambil produk dari Firestore
// -----------------------------------------------------------------------------

/**
 * Mengambil koleksi "produk" dari Firestore.
 * Hanya produk dengan status "Aktif" dan stok > 0 yang diproses.
 */
async function loadWilayah() {
  try {
    const snapshot = await getDocs(collection(db, "produk"));

    const produkAktif = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Saring produk tidak aktif atau kehabisan stok
      if (data.status !== "Aktif") return;
      if (Number(data.stok ?? 0) <= 0) return;

      produkAktif.push(data);
    });

    generateWilayah(produkAktif);

  } catch (error) {
    console.error("[wilayah.js] Gagal memuat data:", error);
    showError();
  }
}


// -----------------------------------------------------------------------------
// GENERATE WILAYAH — Kelompokkan produk per provinsi
// -----------------------------------------------------------------------------

/**
 * Memproses array produk menjadi data wilayah yang terstruktur,
 * lalu memperbarui statistik dan merender grid.
 *
 * @param {Array<Object>} produkList - Daftar produk aktif dari Firestore
 */
function generateWilayah(produkList) {
  // Akumulator provinsi: { [namaProv]: { nama, jumlah } }
  const provinsiMap = {};

  // Set untuk menghitung unik kabupaten, kecamatan, desa, dan pemilik UMKM
  const setKabupaten = new Set();
  const setKecamatan = new Set();
  const setDesa      = new Set();
  const setUmkm      = new Set();

  produkList.forEach((item) => {
    const namaProv = item.provinsi?.trim() || "Indonesia";

    // Hitung jumlah produk per provinsi
    if (!provinsiMap[namaProv]) {
      provinsiMap[namaProv] = { nama: namaProv, jumlah: 0 };
    }
    provinsiMap[namaProv].jumlah++;

    // Kumpulkan nilai unik untuk statistik
    if (item.kabupaten) setKabupaten.add(item.kabupaten);
    if (item.kecamatan) setKecamatan.add(item.kecamatan);
    if (item.desa)      setDesa.add(item.desa);
    if (item.uid)       setUmkm.add(item.uid);
  });

  // Simpan ke state agar bisa dipakai ulang oleh search & sort
  semuaProvinsi = Object.values(provinsiMap);

  updateStatistik(setKabupaten.size, setKecamatan.size, setDesa.size, setUmkm.size);
  renderWilayah(semuaProvinsi);
  updatePopularWilayah();
}


// -----------------------------------------------------------------------------
// STATISTIK — Perbarui semua elemen angka di halaman
// -----------------------------------------------------------------------------

/**
 * Mengisi elemen statistik di hero dan kartu statistik.
 * Kedua lokasi (hero + kartu) menggunakan ID berbeda sehingga
 * harus diisi secara terpisah.
 *
 * @param {number} totalKab - Jumlah kabupaten unik
 * @param {number} totalKec - Jumlah kecamatan unik
 * @param {number} totalDes - Jumlah desa unik
 * @param {number} totalUser - Jumlah pemilik UMKM unik
 */
function updateStatistik(totalKab, totalKec, totalDes, totalUser) {
  const totalProv = semuaProvinsi.length;

  // Hero stats
  if (elTotalProvinsi)  elTotalProvinsi.textContent  = totalProv;
  if (elTotalKabupaten) elTotalKabupaten.textContent  = totalKab;
  if (elTotalUmkm)      elTotalUmkm.textContent       = totalUser;

  // Kartu statistik wilayah
  const cardProv = document.getElementById("totalProvinsiCard");
  const cardKab  = document.getElementById("totalKabupatenCard");
  if (cardProv) cardProv.textContent = totalProv;
  if (cardKab)  cardKab.textContent  = totalKab;

  if (elTotalKecamatan) elTotalKecamatan.textContent = totalKec;
  if (elTotalDesa)      elTotalDesa.textContent      = totalDes;
}


// -----------------------------------------------------------------------------
// RENDER WILAYAH — Tampilkan kartu wilayah di grid
// -----------------------------------------------------------------------------

/**
 * Merender array provinsi ke dalam #wilayahGrid.
 * Menggunakan innerHTML sekali (bukan +=) untuk performa lebih baik.
 *
 * @param {Array<{nama: string, jumlah: number}>} data - Data provinsi
 */
function renderWilayah(data) {
  wilayahGrid.setAttribute("aria-busy", "false");

  if (data.length === 0) {
    showEmpty();
    return;
  }

  // Bangun semua HTML sekaligus, baru masukkan ke DOM (menghindari reflow berulang)
  wilayahGrid.innerHTML = data.map(createWilayahCard).join("");

  // Pasang event navigasi pada setiap kartu
  wilayahGrid.querySelectorAll(".wilayah-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prov = card.dataset.provinsi;
      window.location.href = `produk.html?provinsi=${encodeURIComponent(prov)}`;
    });

    // Dukung navigasi keyboard (Enter / Spasi)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });
}


// -----------------------------------------------------------------------------
// TEMPLATE KARTU WILAYAH
// -----------------------------------------------------------------------------

/**
 * Membuat HTML string untuk satu kartu wilayah.
 * data-provinsi dipakai oleh event listener untuk navigasi.
 *
 * @param {{ nama: string, jumlah: number }} item
 * @returns {string} HTML kartu wilayah
 */
function createWilayahCard(item) {
  // Escape nama provinsi untuk mencegah XSS pada atribut HTML
  const namaEscaped = item.nama.replace(/"/g, "&quot;");

  return `
    <div
      class="wilayah-card"
      data-provinsi="${namaEscaped}"
      role="button"
      tabindex="0"
      aria-label="Lihat produk UMKM di ${namaEscaped}">
      <div class="wilayah-icon" aria-hidden="true">🗺️</div>
      <h3>${item.nama}</h3>
      <p>Lihat seluruh UMKM di wilayah ini.</p>
      <div class="wilayah-count">${item.jumlah} Produk</div>
    </div>`;
}


// -----------------------------------------------------------------------------
// PENCARIAN — Filter provinsi berdasarkan keyword
// -----------------------------------------------------------------------------

/**
 * Menginisialisasi event listener pencarian.
 * Pencarian dilakukan secara real-time pada setiap keystroke (input event).
 * Form submit dicegah agar halaman tidak reload.
 */
function initSearch() {
  if (!elSearchWilayah) return;

  elSearchWilayah.addEventListener("input", () => {
    const keyword = elSearchWilayah.value.trim().toLowerCase();

    const hasil = keyword
      ? semuaProvinsi.filter((item) => item.nama.toLowerCase().includes(keyword))
      : semuaProvinsi;

    renderWilayah(hasil);
  });

  // Cegah reload halaman saat pengguna menekan Enter di form
  if (formSearch) {
    formSearch.addEventListener("submit", (e) => e.preventDefault());
  }
}


// -----------------------------------------------------------------------------
// WILAYAH POPULER — Perbarui kartu wilayah populer
// -----------------------------------------------------------------------------

/**
 * Mengisi kartu wilayah populer dengan 4 provinsi teratas
 * berdasarkan jumlah produk terbanyak.
 * ID elemen (umkmJatim, dll.) hanya sebagai fallback;
 * nama provinsi diambil dari data Firestore secara dinamis.
 */
function updatePopularWilayah() {
  const cards = document.querySelectorAll(".popular-wilayah-card");
  if (cards.length === 0) return;

  // Ambil 4 provinsi dengan produk terbanyak
  const topProvinsi = [...semuaProvinsi]
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 4);

  cards.forEach((card, index) => {
    if (!topProvinsi[index]) return;

    const { nama, jumlah } = topProvinsi[index];

    card.querySelector("h3").textContent = nama;
    card.querySelector("p").textContent  = `${jumlah} Produk`;

    // Navigasi ke halaman produk dengan filter provinsi
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      window.location.href = `produk.html?provinsi=${encodeURIComponent(nama)}`;
    });
  });
}


// -----------------------------------------------------------------------------
// SORT — Urutkan daftar wilayah (dapat dipanggil dari luar, mis. tombol sort)
// -----------------------------------------------------------------------------

/**
 * Mengurutkan dan merender ulang daftar wilayah.
 * Fungsi ini bersifat publik dan dapat dipanggil dari HTML atau script lain.
 *
 * @param {"terbanyak"|"az"|"za"} mode - Mode pengurutan
 */
export function sortWilayah(mode = "terbanyak") {
  const data = [...semuaProvinsi];

  switch (mode) {
    case "az":
      data.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
      break;
    case "za":
      data.sort((a, b) => b.nama.localeCompare(a.nama, "id"));
      break;
    default: // "terbanyak"
      data.sort((a, b) => b.jumlah - a.jumlah);
  }

  renderWilayah(data);
}


// -----------------------------------------------------------------------------
// STATE KOSONG & ERROR
// -----------------------------------------------------------------------------

/** Tampilkan pesan ketika tidak ada wilayah yang cocok dengan pencarian. */
function showEmpty() {
  wilayahGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">🗺️</div>
      <h2>Wilayah Tidak Ditemukan</h2>
      <p>Belum ada wilayah yang sesuai dengan pencarian Anda.</p>
    </div>`;
}

/** Tampilkan pesan ketika Firestore gagal diakses. */
function showError() {
  wilayahGrid.setAttribute("aria-busy", "false");
  wilayahGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">⚠️</div>
      <h2>Terjadi Kesalahan</h2>
      <p>Gagal mengambil data wilayah. Silakan muat ulang halaman.</p>
    </div>`;
}
