// ======================================
// produk.js — Halaman Produk PasarNusa
// Mengelola: load data Firebase, render kartu,
// filter kategori, sort, pencarian, pagination,
// lazy image, dan statistik ringkas.
// ======================================

// --- Import Firebase (CDN ESM) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// KONFIGURASI FIREBASE
// ⚠️ Untuk produksi: pindahkan ke environment variable
//    atau Firebase App Hosting config, jangan hardcode.
// ======================================

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


// ======================================
// REFERENSI ELEMEN DOM
// ======================================

const productGrid   = document.getElementById("productGrid");
const elTotalProduk = document.getElementById("totalProduk");
const elTotalUmkm   = document.getElementById("totalUmkm");
const elTotalKategori = document.getElementById("totalKategori");


// ======================================
// STATE GLOBAL
// ======================================

let semuaProduk  = [];   // semua produk aktif dari Firestore
let currentPage  = 1;    // halaman pagination aktif
const ITEM_PER_PAGE = 12; // jumlah produk per halaman


// ======================================
// INISIALISASI — dipanggil saat DOM siap
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  initSearch();
  initKategori();
  initSort();
  loadProduk();
});


// ======================================
// SKELETON LOADING
// Tampilkan placeholder saat data belum siap.
// Kelas "product-skeleton" harus ada di produk.css.
// ======================================

function showLoading() {
  productGrid.innerHTML = Array.from({ length: 8 }, () => `
    <div class="product-card skeleton-card" aria-hidden="true">
      <div class="product-image skeleton-image"></div>
      <div class="product-content">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-price"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="product-action">
          <div class="skeleton skeleton-button"></div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    </div>
  `).join("");
}


// ======================================
// LOAD PRODUK DARI FIRESTORE
// Hanya produk berstatus "Aktif" dan stok > 0 yang ditampilkan.
// ======================================

async function loadProduk() {
  try {
    const snapshot = await getDocs(collection(db, "produk"));

    semuaProduk = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Abaikan produk tidak aktif atau habis stok
      if (data.status !== "Aktif") return;
      if (Number(data.stok || 0) <= 0) return;

      semuaProduk.push({ id: doc.id, ...data });
    });

    updateStatistik();
    renderProduk(semuaProduk);

  } catch (error) {
    console.error("[PasarNusa] Gagal memuat produk:", error);
    showError("Gagal memuat produk. Periksa koneksi internet Anda dan coba lagi.");
  }
}


// ======================================
// STATISTIK RINGKAS
// Hitung total produk, UMKM unik, dan kategori unik.
// ======================================

function updateStatistik() {
  if (elTotalProduk) {
    elTotalProduk.textContent = semuaProduk.length.toLocaleString("id-ID");
  }

  if (elTotalKategori) {
    const kategoriUnik = new Set(
      semuaProduk.map((p) => p.kategori).filter(Boolean)
    );
    elTotalKategori.textContent = kategoriUnik.size.toLocaleString("id-ID");
  }

  if (elTotalUmkm) {
    const umkmUnik = new Set(
      semuaProduk.map((p) => p.uid).filter(Boolean)
    );
    elTotalUmkm.textContent = umkmUnik.size.toLocaleString("id-ID");
  }
}


// ======================================
// RENDER PRODUK
// Tampilkan kartu produk sesuai data yang dikirim,
// lalu render pagination dan aktifkan lazy image.
// ======================================

function renderProduk(data) {
  // Reset ke halaman 1 setiap kali filter/sort/search berubah
  currentPage = 1;

  const emptyState = document.getElementById("emptyState");

  if (data.length === 0) {
    productGrid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    renderPagination(data);
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  _renderHalaman(data);
  renderPagination(data);
}

/** Render kartu untuk halaman currentPage saja (dipanggil internal). */
function _renderHalaman(data) {
  const halaman = paginate(data);

  // Gunakan fragment agar hanya satu reflow DOM
  const fragment = document.createDocumentFragment();
  const wrapper  = document.createElement("div");
  wrapper.innerHTML = halaman.map((p) => createCard(p)).join("");
  while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);

  productGrid.innerHTML = "";
  productGrid.appendChild(fragment);

  initLazyImage();
}


// ======================================
// RENDER PAGINATION
// Bangun tombol halaman secara dinamis.
// ======================================

function renderPagination(data) {
  const pagination = document.querySelector(".pagination");
  if (!pagination) return;

  const totalPage = Math.ceil(data.length / ITEM_PER_PAGE);

  // Sembunyikan pagination jika hanya 1 halaman
  if (totalPage <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let html = `
    <button class="page-btn" data-page="${currentPage - 1}"
      aria-label="Halaman sebelumnya" ${currentPage === 1 ? "disabled" : ""}>←</button>
  `;

  for (let i = 1; i <= totalPage; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? "active" : ""}"
        data-page="${i}" aria-label="Halaman ${i}"
        ${i === currentPage ? 'aria-current="page"' : ""}>
        ${i}
      </button>
    `;
  }

  html += `
    <button class="page-btn" data-page="${currentPage + 1}"
      aria-label="Halaman berikutnya" ${currentPage === totalPage ? "disabled" : ""}>→</button>
  `;

  pagination.innerHTML = html;

  // Event listener: klik tombol halaman
  pagination.querySelectorAll(".page-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      _renderHalaman(data);
      renderPagination(data);

      // Scroll ke atas grid agar nyaman di mobile
      productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}


// ======================================
// BUAT KARTU PRODUK (HTML string)
// BUG FIX: ada syntax error kurung kurawal salah posisi
//          di blok penentuan badge (if/else if/else).
// ======================================

function createCard(produk) {
  const gambar   = produk.gambar?.[0] || "assets/no-image.png";
  const nama     = escapeHtml(produk.namaProduk || "Produk Tanpa Nama");
  const kategori = escapeHtml(produk.kategori   || "UMKM");
  const toko     = escapeHtml(produk.namaToko || produk.namaUmkm || "UMKM Indonesia");
  const lokasi   = escapeHtml(
    produk.kabupaten || produk.kecamatan || produk.provinsi || "Indonesia"
  );

  const rating   = Number(produk.rating  || 0).toFixed(1);
  const stok     = Number(produk.stok    || 0);
  const terjual  = Number(produk.terjual || 0);
  const diskon   = Number(produk.diskon  || 0);

  // --- Tentukan badge produk ---
  // BUG FIX: kode asli punya "}" ekstra setelah if pertama
  //          yang menyebabkan SyntaxError dan JS berhenti.
  let badge;
  if (diskon > 0)      badge = "🏷️ Diskon";
  else if (terjual >= 100) badge = "🔥 Terlaris";
  else if (stok <= 5)  badge = "⚠️ Stok Tipis";
  else                 badge = "✨ Baru";

  return `
    <div class="product-card" data-category="${kategori.toLowerCase()}">

      <div class="product-image">
        <img
          src="${gambar}"
          alt="Foto produk ${nama}"
          loading="lazy"
          onerror="this.src='assets/no-image.png'">
        <span class="product-badge">${badge}</span>
      </div>

      <div class="product-content">
        <p class="product-category">${kategori}</p>
        <h3 class="product-title">${nama}</h3>
        <p class="product-price">${formatHarga(produk.harga)}</p>

        <div class="product-meta">
          <span>⭐ ${rating}/5</span>
          <span>🔥 ${terjual} terjual</span>
        </div>

        <p class="product-location">📍 ${lokasi}</p>
        <p class="product-stock">📦 Stok: ${stok}</p>
        <p class="product-store">🏪 ${toko}</p>

        <div class="product-action">
          <a href="produk-detail.html?id=${produk.id}" class="btn btn-primary">Detail</a>
          <a href="profil-umkm.html?uid=${encodeURIComponent(produk.uid || "")}" class="btn btn-secondary">UMKM</a>
        </div>
      </div>

    </div>
  `;
}


// ======================================
// PENCARIAN
// Filter real-time dengan debounce 300ms.
// Mencari di: nama produk, kategori, nama toko, lokasi.
// ======================================

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", debounce((e) => {
    const keyword = e.target.value.trim().toLowerCase();

    if (!keyword) {
      renderProduk(semuaProduk);
      return;
    }

    const hasil = semuaProduk.filter((produk) => {
      const fields = [
        produk.namaProduk,
        produk.kategori,
        produk.namaToko,
        produk.namaUmkm,
        produk.provinsi,
        produk.kabupaten,
        produk.kecamatan,
      ]
        .map((v) => (v || "").toLowerCase())
        .join(" ");

      return fields.includes(keyword);
    });

    renderProduk(hasil);
  }, 300));
}


// ======================================
// FILTER KATEGORI
// Klik tombol filter → saring semuaProduk.
// ======================================

function initKategori() {
  const tombol = document.querySelectorAll(".filter-btn");

  tombol.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update state tombol aktif + aria-pressed
      tombol.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      const kategori = btn.dataset.category;

      if (kategori === "all") {
        renderProduk(semuaProduk);
        return;
      }

      const hasil = semuaProduk.filter(
        (p) => (p.kategori || "").toLowerCase() === kategori
      );

      renderProduk(hasil);
    });
  });
}


// ======================================
// SORT / URUTAN PRODUK
// Mengurutkan salinan semuaProduk (tidak mutasi state asli).
// ======================================

function initSort() {
  const sortSelect = document.getElementById("sortSelect");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", () => {
    const data = [...semuaProduk];

    switch (sortSelect.value) {
      case "termurah":
        data.sort((a, b) => Number(a.harga || 0) - Number(b.harga || 0));
        break;
      case "termahal":
        data.sort((a, b) => Number(b.harga || 0) - Number(a.harga || 0));
        break;
      case "rating":
        data.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        break;
      case "terlaris":
        data.sort((a, b) => Number(b.terjual || 0) - Number(a.terjual || 0));
        break;
      default: // "terbaru" — asumsi urutan Firestore = terbaru
        break;
    }

    renderProduk(data);
  });
}


// ======================================
// PAGINATION HELPER
// Potong array sesuai halaman aktif.
// ======================================

function paginate(data) {
  const start = (currentPage - 1) * ITEM_PER_PAGE;
  return data.slice(start, start + ITEM_PER_PAGE);
}


// ======================================
// FORMAT HARGA
// Contoh: 25000 → "Rp 25.000"
// ======================================

function formatHarga(harga) {
  return "Rp " + Number(harga || 0).toLocaleString("id-ID");
}


// ======================================
// ESCAPE HTML
// Mencegah XSS dari data Firestore yang tidak terpercaya.
// ======================================

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ======================================
// DEBOUNCE
// Tunda eksekusi fungsi hingga jeda `delay` ms.
// Dipakai pada event "input" pencarian.
// ======================================

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


// ======================================
// LAZY IMAGE (IntersectionObserver)
// Gambar dengan loading="lazy" sudah ditangani browser modern.
// Observer ini memastikan gambar yang masuk viewport
// tidak lagi diobserve (cleanup memori).
// ======================================

function initLazyImage() {
  if (!("IntersectionObserver" in window)) return; // fallback: browser lama

  const images = productGrid.querySelectorAll("img[loading='lazy']");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "200px" } // mulai load 200px sebelum masuk viewport
  );

  images.forEach((img) => observer.observe(img));
}


// ======================================
// TAMPILKAN ERROR
// Digunakan saat Firestore gagal dipanggil.
// ======================================

function showError(message) {
  productGrid.innerHTML = `
    <div class="empty-state" role="alert">
      <div class="empty-icon">❌</div>
      <h2>Terjadi Kesalahan</h2>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-primary" onclick="location.reload()">Coba Lagi</button>
    </div>
  `;
}
