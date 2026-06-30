// =============================================================================
// kategori.js — Halaman Kategori PasarNusa
// Mengambil data produk dari Firestore, lalu menghasilkan grid kategori
// secara dinamis dengan fitur pencarian, pengurutan, dan ikon otomatis.
// =============================================================================

// -----------------------------------------------------------------------------
// IMPORT FIREBASE
// -----------------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// -----------------------------------------------------------------------------
// KONFIGURASI FIREBASE
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
// KONFIGURASI HALAMAN
// POPULAR_LIMIT — jumlah kartu "Kategori Populer" yang ditampilkan.
// Disamakan dengan jumlah kategori unggulan yang ditampilkan di Beranda
// (saat ini Beranda menampilkan 4 kategori unggulan).
// Ubah angka ini jika jumlah di Beranda berubah, agar kedua halaman tetap konsisten.
// -----------------------------------------------------------------------------

const POPULAR_LIMIT = 4;


// -----------------------------------------------------------------------------
// REFERENSI ELEMEN DOM
// Diambil sekali di awal — hindari querySelector berulang di dalam fungsi.
// -----------------------------------------------------------------------------

const kategoriGrid       = document.getElementById("kategoriGrid");
const elTotalKategori     = document.getElementById("totalKategori");
const elTotalProduk       = document.getElementById("totalProduk");
const elTotalUmkm         = document.getElementById("totalUmkm");
const searchInput        = document.getElementById("kategoriSearch");
const sortSelect         = document.getElementById("sortKategori");
const semuaSubtitleEl    = document.getElementById("semuaKategoriSubtitle");
const popularSection     = document.getElementById("popularSection");
const popularGrid        = document.getElementById("popularGrid");


// -----------------------------------------------------------------------------
// STATE — data mentah hasil Firestore, disimpan agar bisa difilter/diurutkan
// tanpa perlu fetch ulang ke server.
// -----------------------------------------------------------------------------

let semuaKategori = []; // Array<{ nama: string, jumlah: number }>
let semuaProduk   = []; // Array<object> — produk aktif & stok tersedia


// -----------------------------------------------------------------------------
// INISIALISASI — tunggu DOM siap sebelum mulai
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  loadKategori();
  initSearch();
  initSort();
});


// -----------------------------------------------------------------------------
// LOADING — tampilkan skeleton sementara data diambil dari Firestore
// -----------------------------------------------------------------------------

function showLoading() {
  // Buat 8 skeleton card sekaligus dengan join — hindari reflow berulang
  kategoriGrid.setAttribute("aria-busy", "true");
  kategoriGrid.innerHTML = Array.from({ length: 8 }, () => `
    <div class="category-card skeleton-card" aria-hidden="true">
      <div class="category-icon skeleton"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    </div>
  `).join("");

  setSubtitle("Memuat kategori...");
}


// -----------------------------------------------------------------------------
// LOAD DATA — ambil koleksi "produk" dari Firestore,
// filter hanya yang Aktif dan stok > 0.
// -----------------------------------------------------------------------------

async function loadKategori() {
  try {
    const snapshot = await getDocs(collection(db, "produk"));

    semuaProduk = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Lewati produk tidak aktif atau habis stok
      if (data.status !== "Aktif") return;
      if (Number(data.stok ?? 0) <= 0) return;

      semuaProduk.push(data);
    });

    generateKategori();

  } catch (error) {
    console.error("[PasarNusa] Gagal memuat kategori:", error);
    showError();
  }
}


// -----------------------------------------------------------------------------
// GENERATE KATEGORI — kelompokkan produk berdasarkan field `kategori`,
// hitung jumlah produk per kategori, dan hitung jumlah UMKM unik.
// -----------------------------------------------------------------------------

function generateKategori() {
  const kategoriMap = {}; // { [namaKategori]: { nama, jumlah } }
  const umkmSet     = new Set(); // uid unik per UMKM

  semuaProduk.forEach((produk) => {
    const nama = produk.kategori || "Lainnya";

    if (!kategoriMap[nama]) {
      kategoriMap[nama] = { nama, jumlah: 0 };
    }
    kategoriMap[nama].jumlah++;

    if (produk.uid) umkmSet.add(produk.uid);
  });

  // Urutkan default: terpopuler (jumlah produk terbanyak) di atas
  semuaKategori = Object.values(kategoriMap).sort((a, b) => b.jumlah - a.jumlah);

  updateStatistik(umkmSet.size);
  renderKategori(semuaKategori);
  renderPopular();
}


// -----------------------------------------------------------------------------
// STATISTIK — perbarui angka di hero section
// -----------------------------------------------------------------------------

function updateStatistik(jumlahUmkm) {
  if (elTotalKategori) elTotalKategori.textContent = semuaKategori.length;
  if (elTotalProduk)   elTotalProduk.textContent   = semuaProduk.length;
  if (elTotalUmkm)     elTotalUmkm.textContent     = jumlahUmkm;
}


// -----------------------------------------------------------------------------
// SUBTITLE — perbarui teks header "Semua Kategori" agar selalu sesuai
// dengan kondisi data saat ini (memuat / terisi / kosong).
// -----------------------------------------------------------------------------

function setSubtitle(text) {
  if (semuaSubtitleEl) semuaSubtitleEl.textContent = text;
}

function updateSemuaKategoriHeader(jumlahDitampilkan) {
  if (semuaKategori.length === 0) {
    setSubtitle("Belum ada kategori yang tersedia saat ini.");
  } else if (jumlahDitampilkan === semuaKategori.length) {
    setSubtitle(`Menampilkan ${semuaKategori.length} kategori produk UMKM dari seluruh Indonesia.`);
  } else {
    setSubtitle(`Menampilkan ${jumlahDitampilkan} dari ${semuaKategori.length} kategori.`);
  }
}


// -----------------------------------------------------------------------------
// POPULAR SECTION — render kartu "Kategori Populer" sepenuhnya dari data nyata.
// Jumlah kartu mengikuti POPULAR_LIMIT (disamakan dengan Beranda).
// Section disembunyikan total jika tidak ada kategori sama sekali.
// -----------------------------------------------------------------------------

function renderPopular() {
  if (!popularSection || !popularGrid) return;

  if (semuaKategori.length === 0) {
    popularSection.hidden = true;
    popularGrid.innerHTML = "";
    return;
  }

  // Ambil kategori dengan jumlah produk terbanyak, sebanyak POPULAR_LIMIT
  const top = [...semuaKategori]
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, POPULAR_LIMIT);

  popularGrid.innerHTML = top.map((item) => `
    <div class="popular-category-card">
      <div class="popular-icon" aria-hidden="true">${getKategoriIcon(item.nama)}</div>
      <h3>${item.nama}</h3>
      <p>${item.jumlah} Produk</p>
    </div>
  `).join("");

  popularSection.hidden = false;
}


// -----------------------------------------------------------------------------
// RENDER — tulis kartu ke dalam grid.
// Gunakan join() sekali agar DOM hanya diupdate satu kali (lebih cepat).
// -----------------------------------------------------------------------------

function renderKategori(data) {
  kategoriGrid.setAttribute("aria-busy", "false");

  updateSemuaKategoriHeader(data.length);

  if (data.length === 0) {
    showEmpty();
    return;
  }

  kategoriGrid.innerHTML = data.map(createKategoriCard).join("");
}


// -----------------------------------------------------------------------------
// CARD TEMPLATE — hasilkan markup satu kartu kategori.
// Navigasi pakai <a> agar bisa dibuka di tab baru & ramah aksesibilitas,
// bukan onclick pada <div> (anti-pattern).
// -----------------------------------------------------------------------------

function createKategoriCard(item) {
  const icon = getKategoriIcon(item.nama);
  const url  = `produk.html?kategori=${encodeURIComponent(item.nama)}`;

  return `
    <a href="${url}" class="category-card" aria-label="Kategori ${item.nama}, ${item.jumlah} produk">
      <div class="category-icon" aria-hidden="true">${icon}</div>
      <h3>${item.nama}</h3>
      <p>Temukan berbagai produk kategori ${item.nama}.</p>
      <div class="category-count">${item.jumlah} Produk</div>
    </a>
  `;
}


// -----------------------------------------------------------------------------
// SEARCH — filter kategori secara real-time saat pengguna mengetik
// -----------------------------------------------------------------------------

function initSearch() {
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();

    // Jika kosong, tampilkan semua agar tidak perlu klik X lebih dulu
    if (!keyword) {
      renderKategori(semuaKategori);
      return;
    }

    const hasil = semuaKategori.filter((item) =>
      item.nama.toLowerCase().includes(keyword)
    );

    renderKategori(hasil);
  });
}


// -----------------------------------------------------------------------------
// SORT — urutkan ulang grid saat pengguna mengubah dropdown
// -----------------------------------------------------------------------------

function initSort() {
  if (!sortSelect) return;

  sortSelect.addEventListener("change", () => {
    // Salin array agar semuaKategori tidak termutasi
    const data = [...semuaKategori];

    switch (sortSelect.value) {
      case "az":
        data.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
        break;
      case "za":
        data.sort((a, b) => b.nama.localeCompare(a.nama, "id"));
        break;
      default: // "popular"
        data.sort((a, b) => b.jumlah - a.jumlah);
    }

    renderKategori(data);
  });
}


// -----------------------------------------------------------------------------
// IKON KATEGORI — peta nama kategori ke emoji representatif
// -----------------------------------------------------------------------------

function getKategoriIcon(kategori) {
  const ikonMap = {
    "makanan":      "🍜",
    "minuman":      "🥤",
    "fashion":      "👕",
    "kerajinan":    "🧺",
    "pertanian":    "🌾",
    "peternakan":   "🐄",
    "perikanan":    "🐟",
    "kecantikan":   "💄",
    "rumah tangga": "🏠",
    "souvenir":     "🎁",
  };

  return ikonMap[kategori.toLowerCase()] ?? "📦";
}


// -----------------------------------------------------------------------------
// EMPTY STATE — tampilkan saat pencarian tidak menemukan hasil
// (atau saat memang belum ada kategori sama sekali).
// -----------------------------------------------------------------------------

function showEmpty() {
  const belumAdaData = semuaKategori.length === 0;

  kategoriGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">📂</div>
      <h2>${belumAdaData ? "Belum Ada Kategori" : "Kategori Tidak Ditemukan"}</h2>
      <p>
        ${belumAdaData
          ? "Belum ada produk yang masuk ke kategori manapun saat ini."
          : "Coba kata kunci lain atau <a href=\"produk.html\">lihat semua produk</a>."}
      </p>
    </div>
  `;
}


// -----------------------------------------------------------------------------
// ERROR STATE — tampilkan saat Firestore gagal diakses
// -----------------------------------------------------------------------------

function showError() {
  kategoriGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">⚠️</div>
      <h2>Terjadi Kesalahan</h2>
      <p>Gagal mengambil data. Periksa koneksi internet lalu <button onclick="location.reload()">coba lagi</button>.</p>
    </div>
  `;

  setSubtitle("Gagal memuat kategori. Silakan coba lagi.");

  if (popularSection) popularSection.hidden = true;
}
