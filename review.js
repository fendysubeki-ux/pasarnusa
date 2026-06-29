// =============================================================================
// review.js — PasarNusa
// Logika halaman Review Produk: autentikasi, load data, rating,
// upload foto ke Cloudinary, dan simpan ulasan ke Firestore.
// =============================================================================

import { initializeApp }    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc, collection,
  getDoc, getDocs, addDoc, updateDoc,
  query, where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// =============================================================================
// KONFIGURASI FIREBASE
// =============================================================================

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


// =============================================================================
// KONFIGURASI CLOUDINARY
// =============================================================================

const CLOUD_NAME    = "dq8gha9lv";
const UPLOAD_PRESET = "pasarnusa";
const CLOUDINARY_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const MAX_FOTO      = 5;
const MAX_FOTO_SIZE = 2 * 1024 * 1024; // 2 MB


// =============================================================================
// REFERENSI ELEMEN DOM
// =============================================================================

const elProdukContainer = document.getElementById("produkContainer");
const elRatingBox       = document.getElementById("ratingBox");
const elRatingText      = document.getElementById("ratingText");
const elReviewText      = document.getElementById("reviewText");
const elFotoReview      = document.getElementById("fotoReview");
const elPreviewFoto     = document.getElementById("previewFoto");
const elKirimReview     = document.getElementById("kirimReview");
const elEmptyReview     = document.getElementById("emptyReview");
const elSummaryProduk   = document.getElementById("summaryProduk");
const elSummaryToko     = document.getElementById("summaryToko");
const elSummaryRating   = document.getElementById("summaryRating");


// =============================================================================
// STATE HALAMAN
// =============================================================================

let uid        = "";
let orderId    = "";
let dataPesanan = {};
let dataProduk  = {};
let rating      = 0;
let fotoList    = [];


// =============================================================================
// INISIALISASI
// =============================================================================

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();    // pastikan user sudah login
  ambilOrderId();        // baca ?order= dari URL
  await loadPesanan();   // validasi & muat data pesanan
  initRating();          // pasang event bintang
  initUpload();          // pasang event input foto
  initButton();          // pasang event tombol kirim
}


// =============================================================================
// AUTENTIKASI — redirect ke login jika belum masuk
// =============================================================================

async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}


// =============================================================================
// BACA ORDER ID DARI URL
// =============================================================================

function ambilOrderId() {
  orderId = new URLSearchParams(window.location.search).get("order");

  if (!orderId) {
    window.location.href = "pesanan-saya.html";
  }
}


// =============================================================================
// LOAD & VALIDASI PESANAN
// =============================================================================

async function loadPesanan() {
  try {
    const snap = await getDoc(doc(db, "pesanan", orderId));

    // Pesanan tidak ditemukan
    if (!snap.exists()) {
      tampilkanStateKosong();
      return;
    }

    dataPesanan = snap.data();

    // Pastikan pesanan milik user yang sedang login
    if (dataPesanan.uidPembeli !== uid) {
      window.location.href = "pesanan-saya.html";
      return;
    }

    // Hanya pesanan berstatus "Selesai" yang bisa direview
    if (dataPesanan.status !== "Selesai") {
      showToast("Pesanan belum selesai.");
      window.location.href = `detail-pesanan.html?id=${orderId}`;
      return;
    }

    // Satu pesanan hanya boleh punya satu review
    if (dataPesanan.sudahReview === true) {
      showToast("Review sudah pernah dikirim.");
      window.location.href = `detail-pesanan.html?id=${orderId}`;
      return;
    }

    await loadProduk();

  } catch (error) {
    console.error("loadPesanan:", error);
    showError("Gagal memuat data pesanan.");
    showToast("Terjadi kesalahan. Silakan coba lagi.");
  }
}


// =============================================================================
// LOAD DATA PRODUK
// =============================================================================

async function loadProduk() {
  const produkId = dataPesanan.items?.[0]?.id;

  if (!produkId) {
    showError("ID produk tidak ditemukan dalam pesanan.");
    return;
  }

  const snap = await getDoc(doc(db, "produk", produkId));

  if (!snap.exists()) {
    showToast("Produk tidak ditemukan.");
    showError("Produk tidak ditemukan.");
    return;
  }

  dataProduk = snap.data();
  renderProduk();
}


// =============================================================================
// RENDER KARTU PRODUK
// =============================================================================

function renderProduk() {
  // Ambil gambar pertama jika array, fallback ke placeholder
  const gambar = Array.isArray(dataProduk.gambar)
    ? dataProduk.gambar[0]
    : dataProduk.gambar || "assets/no-image.png";

  // Escape konten teks agar aman dari XSS
  const nama = escapeHtml(dataProduk.namaProduk ?? "");
  const toko = escapeHtml(dataProduk.namaToko   ?? "");

  elProdukContainer.innerHTML = `
    <div class="produk-card">
      <img
        src="${gambar}"
        alt="${nama}"
        loading="lazy"
        onerror="this.src='assets/no-image.png'"
      >
      <div class="produk-info">
        <h3>${nama}</h3>
        <p>${toko}</p>
      </div>
    </div>
  `;

  // Perbarui ringkasan di sidebar
  elSummaryProduk.textContent = nama;
  elSummaryToko.textContent   = toko;
}


// =============================================================================
// RATING BINTANG
// =============================================================================

function initRating() {
  const stars = elRatingBox.querySelectorAll(".star");

  stars.forEach(star => {
    // Klik mouse
    star.addEventListener("click", () => pilihRating(Number(star.dataset.rating), stars));

    // Navigasi keyboard (Enter / Spasi) — sesuai role="radio" di HTML
    star.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pilihRating(Number(star.dataset.rating), stars);
      }
    });
  });
}

function pilihRating(nilai, stars) {
  rating = nilai;

  stars.forEach(star => {
    const aktif = Number(star.dataset.rating) <= rating;
    star.classList.toggle("active", aktif);
    star.setAttribute("aria-checked", String(aktif));
  });

  elRatingText.textContent   = `Anda memberi ${rating} bintang`;
  elSummaryRating.textContent = `${rating} / 5`;
}


// =============================================================================
// UPLOAD FOTO — PREVIEW LOKAL
// =============================================================================

function initUpload() {
  elFotoReview.addEventListener("change", () => {
    const files = [...elFotoReview.files];

    // Validasi jumlah
    if (files.length > MAX_FOTO) {
      showToast(`Maksimal ${MAX_FOTO} foto.`);
      elFotoReview.value = "";
      return;
    }

    // Validasi ukuran per file
    const terlalubesar = files.find(f => f.size > MAX_FOTO_SIZE);
    if (terlalubesar) {
      showToast("Ukuran foto maksimal 2 MB per file.");
      elFotoReview.value = "";
      return;
    }

    // Tampilkan pratinjau dan simpan ke fotoList
    fotoList = files.slice(0, MAX_FOTO);
    tampilkanPreview(fotoList);
  });
}

function tampilkanPreview(files) {
  elPreviewFoto.innerHTML = "";

  files.forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = `Pratinjau ${file.name}`;

    // Bebaskan memori setelah gambar dimuat
    img.addEventListener("load", () => URL.revokeObjectURL(img.src));

    elPreviewFoto.appendChild(img);
  });
}


// =============================================================================
// UPLOAD FOTO KE CLOUDINARY
// =============================================================================

async function uploadFoto() {
  const urls = [];

  for (const file of fotoList) {
    const formData = new FormData();
    formData.append("file",           file);
    formData.append("upload_preset",  UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body:   formData,
    });

    if (!response.ok) {
      throw new Error(`Upload gagal: ${response.status}`);
    }

    const result = await response.json();

    if (result.secure_url) {
      urls.push(result.secure_url);
    }
  }

  return urls;
}


// =============================================================================
// TOMBOL KIRIM
// =============================================================================

function initButton() {
  elKirimReview.addEventListener("click", kirimData);
}

async function kirimData() {
  // Validasi input sebelum mulai proses
  if (rating === 0) {
    showToast("Pilih rating terlebih dahulu.");
    return;
  }

  if (elReviewText.value.trim().length < 10) {
    showToast("Review minimal 10 karakter.");
    return;
  }

  // Nonaktifkan tombol selama proses berlangsung
  setLoadingButton(true);

  try {
    const fotoUrls = await uploadFoto();
    await simpanReview(fotoUrls);

  } catch (error) {
    console.error("kirimData:", error);
    showToast("Gagal mengirim review. Silakan coba lagi.");

  } finally {
    setLoadingButton(false);
  }
}

function setLoadingButton(loading) {
  elKirimReview.disabled     = loading;
  elKirimReview.textContent  = loading ? "Mengirim…" : "⭐ Kirim Review";
}


// =============================================================================
// SIMPAN REVIEW KE FIRESTORE
// =============================================================================

async function simpanReview(foto) {
  const produkId = dataPesanan.items[0].id;

  // 1. Tulis dokumen ulasan baru
  await addDoc(collection(db, "ulasan"), {
    uid,
    produkId,
    pesananId: orderId,
    uidUmkm:   dataPesanan.uidUmkm,
    nama:      auth.currentUser.displayName || "Pembeli",
    rating,
    ulasan:    elReviewText.value.trim(),
    foto,
    createdAt: serverTimestamp(),
  });

  // 2. Perbarui rata-rata rating di dokumen produk
  await updateRating(produkId);

  // 3. Tandai pesanan sudah direview agar tidak bisa dikirim ulang
  await updateDoc(doc(db, "pesanan", orderId), { sudahReview: true });

  showToast("Review berhasil dikirim. Terima kasih!");
  setTimeout(() => { window.location.href = "pesanan-saya.html"; }, 1500);
}


// =============================================================================
// PERBARUI RATA-RATA RATING PRODUK
// =============================================================================

async function updateRating(produkId) {
  const totalLama  = Number(dataProduk.totalReview || 0);
  const ratingLama = Number(dataProduk.rating      || 0);

  const totalBaru  = totalLama + 1;
  const ratingBaru = ((ratingLama * totalLama) + rating) / totalBaru;

  await updateDoc(doc(db, "produk", produkId), {
    rating:      Number(ratingBaru.toFixed(1)),
    totalReview: totalBaru,
  });
}


// =============================================================================
// UI HELPER — STATE KOSONG
// =============================================================================

function tampilkanStateKosong() {
  elEmptyReview.classList.remove("hidden");

  // Sembunyikan seluruh form agar tidak mengganggu
  document.querySelector(".review-layout")?.classList.add("hidden");
}


// =============================================================================
// UI HELPER — PESAN ERROR DI CONTAINER PRODUK
// =============================================================================

function showError(message) {
  elProdukContainer.innerHTML = `
    <div class="empty-state-mini">⚠️ ${escapeHtml(message)}</div>
  `;
}


// =============================================================================
// UI HELPER — TOAST NOTIFIKASI
// =============================================================================

function showToast(message) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;              // textContent aman dari XSS
  toast.setAttribute("role", "status");     // dibaca screen reader

  document.body.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => toast.classList.add("show"));

  // Animasi keluar lalu hapus elemen
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// =============================================================================
// UTILITAS — ESCAPE HTML UNTUK MENCEGAH XSS
// =============================================================================

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}
