// =============================================================
// produk-detail.js — PasarNusa
// Halaman detail produk: render info, galeri, beli, ulasan.
// ES Module — dipanggil via <script type="module">
// =============================================================


// -------------------------------------------------------------
// FIREBASE IMPORTS
// -------------------------------------------------------------

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore, doc, getDoc,
  collection, query, where, getDocs, limit,
  addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// -------------------------------------------------------------
// INISIALISASI FIREBASE
// Konfigurasi ini bersifat publik (client-side); keamanan data
// diatur oleh Firestore Security Rules di Firebase Console.
// -------------------------------------------------------------

const firebaseConfig = {
  apiKey:            "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain:        "pasarnusa-18aa0.firebaseapp.com",
  projectId:         "pasarnusa-18aa0",
  storageBucket:     "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId:             "1:866998011671:web:5555115feb82741ab55952"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);


// -------------------------------------------------------------
// REFERENSI ELEMEN DOM
// Diambil sekali di awal; null-check dilakukan di tiap fungsi.
// -------------------------------------------------------------

const elHeroTitle      = document.getElementById("heroTitle");
const elBreadcrumb     = document.getElementById("breadcrumbNama");
const elGambarUtama    = document.getElementById("gambarUtama");
const elThumbnails     = document.getElementById("thumbnailProduk");
const elKategori       = document.getElementById("kategoriProduk");
const elNama           = document.getElementById("namaProduk");
const elRating         = document.getElementById("ratingProduk");
const elReviewCount    = document.getElementById("reviewProduk");
const elTerjual        = document.getElementById("terjualProduk");
const elHarga          = document.getElementById("hargaProduk");
const elStok           = document.getElementById("stokProduk");
const elLokasi         = document.getElementById("lokasiProduk");
const elNamaToko       = document.getElementById("namaToko");
const elAffiliate      = document.getElementById("affiliateBadge");
const elDeskripsi      = document.getElementById("deskripsiProduk");
const elBuyHarga       = document.getElementById("buyHarga");
const elJumlah         = document.getElementById("jumlahProduk");
const elProdukToko     = document.getElementById("produkToko");
const elProdukTerkait  = document.getElementById("produkTerkait");
const elReviewContainer= document.getElementById("reviewContainer");


// -------------------------------------------------------------
// STATE
// -------------------------------------------------------------

let idProduk   = "";
let dataProduk = {};
let user       = null;


// -------------------------------------------------------------
// ENTRY POINT
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  resolveIdProduk();
  await loadProduk();
  initQuantity();
  initButtons();
}


// -------------------------------------------------------------
// CEK STATUS LOGIN
// -------------------------------------------------------------

async function checkLogin() {
  await auth.authStateReady();
  user = auth.currentUser ?? null;
}


// -------------------------------------------------------------
// AMBIL ID PRODUK DARI URL (?id=...)
// Redirect ke daftar produk jika tidak ada.
// -------------------------------------------------------------

function resolveIdProduk() {
  idProduk = new URLSearchParams(window.location.search).get("id") ?? "";
  if (!idProduk) window.location.href = "produk.html";
}


// -------------------------------------------------------------
// LOAD DATA PRODUK DARI FIRESTORE
// -------------------------------------------------------------

async function loadProduk() {
  try {
    const snap = await getDoc(doc(db, "produk", idProduk));

    if (!snap.exists()) {
      showToast("Produk tidak ditemukan.");
      setTimeout(() => { window.location.href = "produk.html"; }, 1500);
      return;
    }

    dataProduk = snap.data();

    renderInfo();
    renderGallery();
    renderAffiliate();
    setupWhatsApp();           // harus setelah data produk tersedia

    // Muat seksi tambahan secara paralel agar halaman cepat
    await Promise.all([
      loadProdukToko(),
      loadProdukTerkait(),
      loadReview()
    ]);

  } catch (err) {
    console.error("[loadProduk]", err);
    showToast("Gagal memuat produk. Silakan coba lagi.");
  }
}


// -------------------------------------------------------------
// RENDER INFO PRODUK
// Gunakan textContent (bukan innerHTML) untuk mencegah XSS.
// -------------------------------------------------------------

function renderInfo() {
  const lokasi = formatLokasi(dataProduk.kabupaten, dataProduk.provinsi);

  setText(elHeroTitle,   dataProduk.namaProduk || "Produk");
  setText(elBreadcrumb,  dataProduk.namaProduk || "Produk");
  setText(elNama,        dataProduk.namaProduk || "Produk");
  setText(elKategori,    dataProduk.kategori   || "-");
  setText(elRating,      `⭐ ${Number(dataProduk.rating || 0).toFixed(1)}`);
  setText(elReviewCount, `${dataProduk.totalReview || 0} Ulasan`);
  setText(elTerjual,     `🔥 ${dataProduk.terjual || 0} Terjual`);
  setText(elHarga,       formatRupiah(dataProduk.harga));
  setText(elBuyHarga,    formatRupiah(dataProduk.harga));
  setText(elStok,        `📦 Stok: ${dataProduk.stok || 0}`);
  setText(elLokasi,      `📍 ${lokasi}`);
  setText(elNamaToko,    `🏪 ${dataProduk.namaToko || "UMKM"}`);
  setText(elDeskripsi,   dataProduk.deskripsi || "-");

  // Info pengiriman
  setText(document.getElementById("beratProduk"), `${dataProduk.berat || 0} Gram`);
  setText(document.getElementById("asalProduk"),  lokasi);

  // Profil toko
  setText(document.getElementById("storeName"),      dataProduk.namaToko || "UMKM");
  setText(document.getElementById("storeLocation"),  lokasi);
  setText(document.getElementById("storeRating"),    Number(dataProduk.rating || 0).toFixed(1));
  setText(document.getElementById("storeFollowers"), dataProduk.followers || 0);

  // Link kunjungi toko
  const linkToko = document.getElementById("linkToko");
  if (linkToko && dataProduk.uidUmkm) {
    linkToko.href = `toko.html?id=${dataProduk.uidUmkm}`;
  }

  // Judul tab browser
  document.title = `${dataProduk.namaProduk || "Produk"} | PasarNusa`;
}


// -------------------------------------------------------------
// RENDER GALERI GAMBAR
// Gunakan event delegation agar tidak ada inline onclick.
// -------------------------------------------------------------

function renderGallery() {
  const gambar = dataProduk.gambar || [];
  if (!gambar.length) return;

  // Gambar utama
  elGambarUtama.src = gambar[0];
  elGambarUtama.alt = dataProduk.namaProduk || "Gambar produk";

  // Buat thumbnail dengan DocumentFragment (1× DOM write)
  const fragment = document.createDocumentFragment();

  gambar.forEach((url, i) => {
    const img = document.createElement("img");
    img.src     = url;
    img.alt     = `Gambar produk ${i + 1}`;
    img.loading = "lazy";
    img.dataset.url = url;               // simpan URL di dataset, bukan inline
    if (i === 0) img.classList.add("active");
    fragment.appendChild(img);
  });

  elThumbnails.innerHTML = "";
  elThumbnails.appendChild(fragment);

  // Event delegation — satu listener untuk semua thumbnail
  elThumbnails.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;

    elGambarUtama.src = img.dataset.url;
    elGambarUtama.alt = img.alt;

    elThumbnails.querySelectorAll("img").forEach(t => t.classList.remove("active"));
    img.classList.add("active");
  });
}


// -------------------------------------------------------------
// RENDER BADGE AFILIASI
// CSS `:not(:empty)` menampilkan elemen hanya saat ada konten.
// -------------------------------------------------------------

function renderAffiliate() {
  if (!dataProduk.affiliateAktif) {
    elAffiliate.textContent = "";
    return;
  }
  // innerHTML aman di sini karena tidak ada data dari user/Firestore
  elAffiliate.textContent = `🤝 Affiliate ${dataProduk.komisiAffiliate || 5}%`;
}


// -------------------------------------------------------------
// PRODUK LAIN DARI TOKO INI
// Dibatasi 8 dokumen agar tidak membebani Firestore.
// -------------------------------------------------------------

async function loadProdukToko() {
  try {
    const snap = await getDocs(
      query(
        collection(db, "produk"),
        where("uidUmkm", "==", dataProduk.uidUmkm),
        limit(9)                          // +1 karena produk ini sendiri dilewati
      )
    );

    const cards = [];
    snap.forEach(d => {
      if (d.id === idProduk) return;     // lewati produk yang sedang ditampilkan
      cards.push(buatKartuProduk(d.id, d.data()));
    });

    elProdukToko.innerHTML = "";
    elProdukToko.appendChild(
      cards.length ? buildFragment(cards) : buildEmpty("Belum ada produk lainnya.")
    );
  } catch (err) {
    console.error("[loadProdukToko]", err);
    elProdukToko.innerHTML = "";
    elProdukToko.appendChild(buildEmpty("Gagal memuat produk toko."));
  }
}


// -------------------------------------------------------------
// PRODUK TERKAIT (KATEGORI SAMA)
// -------------------------------------------------------------

async function loadProdukTerkait() {
  try {
    const snap = await getDocs(
      query(
        collection(db, "produk"),
        where("kategori", "==", dataProduk.kategori),
        limit(9)
      )
    );

    const cards = [];
    snap.forEach(d => {
      if (d.id === idProduk) return;
      cards.push(buatKartuProduk(d.id, d.data()));
    });

    elProdukTerkait.innerHTML = "";
    elProdukTerkait.appendChild(
      cards.length ? buildFragment(cards) : buildEmpty("Belum ada produk terkait.")
    );
  } catch (err) {
    console.error("[loadProdukTerkait]", err);
    elProdukTerkait.innerHTML = "";
    elProdukTerkait.appendChild(buildEmpty("Gagal memuat produk terkait."));
  }
}


// -------------------------------------------------------------
// ULASAN PEMBELI
// Placeholder — siap diperluas dengan data nyata dari Firestore.
// -------------------------------------------------------------

async function loadReview() {
  // TODO: query koleksi "ulasan" berdasarkan idProduk
  elReviewContainer.innerHTML = "";
  elReviewContainer.appendChild(buildEmpty("Belum ada ulasan. Jadilah yang pertama!"));
}


// -------------------------------------------------------------
// QUANTITY — tombol +/− dan validasi input manual
// -------------------------------------------------------------

function initQuantity() {
  const stokMax = Number(dataProduk.stok || 0);

  document.getElementById("minusQty").addEventListener("click", () => {
    const val = Number(elJumlah.value);
    if (val > 1) elJumlah.value = val - 1;
  });

  document.getElementById("plusQty").addEventListener("click", () => {
    const val = Number(elJumlah.value);
    if (val < stokMax) elJumlah.value = val + 1;
    else showToast(`Stok hanya tersedia ${stokMax} unit.`);
  });

  // Validasi input manual: cegah nilai di luar rentang
  elJumlah.addEventListener("change", () => {
    let val = Number(elJumlah.value);
    if (isNaN(val) || val < 1)    val = 1;
    if (val > stokMax)             val = stokMax;
    elJumlah.value = val;
  });
}


// -------------------------------------------------------------
// INISIALISASI SEMUA TOMBOL AKSI
// Dikumpulkan di satu fungsi agar mudah dikelola.
// -------------------------------------------------------------

function initButtons() {
  document.getElementById("addToCart") ?.addEventListener("click", tambahKeranjang);
  document.getElementById("buyNow")    ?.addEventListener("click", beliSekarang);
  document.getElementById("shareProduk")?.addEventListener("click", bagikanProduk);
  document.getElementById("btnFavorit") ?.addEventListener("click", simpanFavorit);
}


// -------------------------------------------------------------
// TAMBAH KE KERANJANG
// -------------------------------------------------------------

async function tambahKeranjang() {
  if (!auth.currentUser) {
    showToast("Silakan login terlebih dahulu.");
    return;
  }

  try {
    await addDoc(collection(db, "keranjang"), {
      uidUser:    auth.currentUser.uid,
      idProduk,
      uidUmkm:   dataProduk.uidUmkm,
      namaProduk: dataProduk.namaProduk,
      harga:      dataProduk.harga,
      gambar:     dataProduk.gambar?.[0] || "",
      jumlah:     Number(elJumlah.value),
      selected:   true,
      createdAt:  serverTimestamp()
    });
    showToast("Produk berhasil ditambahkan ke keranjang.");
  } catch (err) {
    console.error("[tambahKeranjang]", err);
    showToast("Gagal menambahkan ke keranjang.");
  }
}


// -------------------------------------------------------------
// BELI SEKARANG — redirect ke checkout
// -------------------------------------------------------------

function beliSekarang() {
  window.location.href = `checkout.html?id=${idProduk}&qty=${elJumlah.value}`;
}


// -------------------------------------------------------------
// WHATSAPP — disiapkan SETELAH data produk dimuat
// -------------------------------------------------------------

function setupWhatsApp() {
  const el = document.getElementById("chatWA");
  if (!el) return;

  const nomor = (dataProduk.whatsapp || "").replace(/^0/, "62");
  const pesan = encodeURIComponent(
    `Halo, saya tertarik dengan produk ${dataProduk.namaProduk}.`
  );

  if (nomor) {
    el.href = `https://wa.me/${nomor}?text=${pesan}`;
  } else {
    // Sembunyikan tombol jika tidak ada nomor WA
    el.style.display = "none";
  }
}


// -------------------------------------------------------------
// BAGIKAN PRODUK — Web Share API / fallback clipboard
// -------------------------------------------------------------

async function bagikanProduk() {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({
        title: dataProduk.namaProduk,
        text:  dataProduk.namaProduk,
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link berhasil disalin.");
    }
  } catch (err) {
    // Pengguna membatalkan share — bukan error nyata
    if (err.name !== "AbortError") {
      console.error("[bagikanProduk]", err);
      showToast("Gagal membagikan produk.");
    }
  }
}


// -------------------------------------------------------------
// SIMPAN FAVORIT
// -------------------------------------------------------------

async function simpanFavorit() {
  if (!auth.currentUser) {
    showToast("Silakan login terlebih dahulu.");
    return;
  }
  try {
    await addDoc(collection(db, "favorit"), {
      uidUser:   auth.currentUser.uid,
      idProduk,
      createdAt: serverTimestamp()
    });
    showToast("Produk disimpan ke favorit.");
  } catch (err) {
    console.error("[simpanFavorit]", err);
    showToast("Gagal menyimpan favorit.");
  }
}


// =============================================================
// HELPER & UTILITAS
// =============================================================

/**
 * Buat elemen <a> kartu produk secara aman (tanpa innerHTML).
 * @param {string} id  — ID dokumen Firestore
 * @param {Object} item — Data produk
 * @returns {HTMLElement}
 */
function buatKartuProduk(id, item) {
  const a = document.createElement("a");
  a.href      = `produk-detail.html?id=${id}`;
  a.className = "product-card";

  const img = document.createElement("img");
  img.src     = item.gambar?.[0] || "assets/no-image.png";
  img.alt     = item.namaProduk  || "Produk";
  img.loading = "lazy";

  const info = document.createElement("div");
  info.className = "product-info";

  const h3 = document.createElement("h3");
  h3.textContent = item.namaProduk || "-";

  const p = document.createElement("p");
  p.textContent = formatRupiah(item.harga);

  info.append(h3, p);
  a.append(img, info);
  return a;
}

/**
 * Bungkus array elemen dalam DocumentFragment (1× DOM write).
 * @param {HTMLElement[]} elements
 * @returns {DocumentFragment}
 */
function buildFragment(elements) {
  const frag = document.createDocumentFragment();
  elements.forEach(el => frag.appendChild(el));
  return frag;
}

/**
 * Buat elemen empty state.
 * @param {string} text
 * @returns {HTMLElement}
 */
function buildEmpty(text) {
  const div = document.createElement("div");
  div.className = "empty-state";

  const icon = document.createElement("div");
  icon.className   = "empty-icon";
  icon.textContent = "📭";

  const p = document.createElement("p");
  p.textContent = text;

  div.append(icon, p);
  return div;
}

/**
 * Set textContent secara aman; abaikan jika elemen null.
 * @param {HTMLElement|null} el
 * @param {string} text
 */
function setText(el, text) {
  if (el) el.textContent = text;
}

/**
 * Format angka ke format Rupiah.
 * @param {number} angka
 * @returns {string}  contoh: "Rp 120.000"
 */
function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

/**
 * Format lokasi dari kabupaten + provinsi.
 * @param {string} kab
 * @param {string} prov
 * @returns {string}
 */
function formatLokasi(kab, prov) {
  const parts = [kab, prov].filter(Boolean);
  return parts.length ? parts.join(", ") : "Indonesia";
}

/**
 * Tampilkan notifikasi toast sementara.
 * @param {string} pesan
 */
function showToast(pesan) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = pesan;            // textContent, bukan innerHTML
  document.body.appendChild(toast);

  // Trigger CSS transition setelah satu frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
