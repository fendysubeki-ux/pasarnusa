// ============================================================
// PASARNUSA — DETAIL PESANAN
// detail-pesanan.js
//
// Tanggung jawab halaman ini:
//   - Memverifikasi sesi login pengguna
//   - Membaca ID pesanan dari URL query string
//   - Mengambil data pesanan dari Firestore
//   - Memastikan pesanan hanya bisa dilihat oleh pembelinya sendiri
//   - Merender informasi pesanan, produk, bukti bayar, timeline,
//     dan tombol aksi secara dinamis
// ============================================================

// ── Firebase SDK ────────────────────────────────────────────
import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Konfigurasi Firebase ─────────────────────────────────────
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

// ── Referensi elemen DOM ─────────────────────────────────────
// Dikelompokkan agar mudah dilacak; hanya diambil sekali saat modul dimuat.
const el = {
  nomorPesanan:    document.getElementById("nomorPesanan"),
  statusPesanan:   document.getElementById("statusPesanan"),
  tanggalPesanan:  document.getElementById("tanggalPesanan"),
  namaPembeli:     document.getElementById("namaPembeli"),
  whatsappPembeli: document.getElementById("whatsappPembeli"),
  alamatPembeli:   document.getElementById("alamatPembeli"),
  produkContainer: document.getElementById("produkContainer"),
  buktiContainer:  document.getElementById("buktiContainer"),
  namaKurir:       document.getElementById("namaKurir"),
  nomorResi:       document.getElementById("nomorResi"),
  statusPengiriman:document.getElementById("statusPengiriman"),
  subtotal:        document.getElementById("subtotal"),
  ongkir:          document.getElementById("ongkir"),
  diskon:          document.getElementById("diskon"),
  totalBayar:      document.getElementById("totalBayar"),
  uploadBuktiBtn:  document.getElementById("uploadBuktiBtn"),
  hubungiTokoBtn:  document.getElementById("hubungiTokoBtn"),
  beriUlasanBtn:   document.getElementById("beriUlasanBtn"),
};

// ── State modul ──────────────────────────────────────────────
let uid        = "";   // UID pengguna yang sedang login
let pesananId  = "";   // ID dokumen pesanan dari URL
let dataPesanan = {};  // Data mentah dari Firestore

// ── Urutan status untuk timeline ────────────────────────────
// Indeks array ini harus sesuai dengan urutan elemen .timeline-item di HTML.
const URUTAN_STATUS = [
  "Pesanan Dibuat",     // index 0 — selalu aktif
  "Belum Bayar",        // index 1
  "Menunggu Verifikasi",// index 1 (sama dengan Belum Bayar, menggantikan)
  "Diproses",           // index 2
  "Dikirim",            // index 3
  "Selesai",            // index 4
];

// ── Label status pengiriman ──────────────────────────────────
const LABEL_PENGIRIMAN = {
  Dikirim: "Sedang Dikirim",
  Selesai: "Selesai",
};

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", initPage);

/**
 * Titik masuk utama halaman.
 * Urutan: cek login → ambil ID pesanan dari URL → muat data dari Firestore.
 */
async function initPage() {
  try {
    await checkLogin();
    ambilIdPesanan();
    await loadPesanan();
  } catch (err) {
    // Error tak terduga yang tidak tertangkap di fungsi turunan
    console.error("[PasarNusa] initPage error:", err);
    showToast("Terjadi kesalahan. Silakan coba lagi.");
  }
}

// ============================================================
// AUTH
// ============================================================

/**
 * Memastikan pengguna sudah login.
 * Jika belum, langsung redirect ke halaman login.
 */
async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}

// ============================================================
// ID PESANAN
// ============================================================

/**
 * Membaca parameter `id` dari URL query string.
 * Redirect ke pesanan-saya.html jika parameter tidak ada.
 */
function ambilIdPesanan() {
  pesananId = new URLSearchParams(window.location.search).get("id");

  if (!pesananId) {
    window.location.href = "pesanan-saya.html";
  }
}

// ============================================================
// LOAD DATA PESANAN
// ============================================================

/**
 * Mengambil dokumen pesanan dari Firestore lalu memicu semua
 * fungsi render. Melakukan validasi kepemilikan sebelum render.
 */
async function loadPesanan() {
  try {
    const snapshot = await getDoc(doc(db, "pesanan", pesananId));

    // Pesanan tidak ditemukan
    if (!snapshot.exists()) {
      showToast("Pesanan tidak ditemukan.");
      redirectKePesananSaya(1500);
      return;
    }

    dataPesanan = snapshot.data();

    // Pastikan pesanan ini milik pengguna yang login
    if (dataPesanan.uidPembeli !== uid) {
      showToast("Akses ditolak.");
      redirectKePesananSaya(1500);
      return;
    }

    // Render semua bagian halaman
    isiData();
    renderProduk();
    renderBukti();
    renderTimeline();
    renderAksi();

  } catch (err) {
    console.error("[PasarNusa] loadPesanan error:", err);
    showToast("Gagal memuat pesanan.");
  }
}

// ============================================================
// RENDER: INFORMASI UMUM
// ============================================================

/**
 * Mengisi semua field informasi pesanan ke DOM.
 * Menggunakan nilai default "-" untuk field yang kosong.
 */
function isiData() {
  const d = dataPesanan;

  el.nomorPesanan.textContent    = pesananId.substring(0, 8).toUpperCase();
  el.statusPesanan.textContent   = d.status       || "Belum Bayar";
  el.tanggalPesanan.textContent  = formatTanggal(d.createdAt);
  el.namaPembeli.textContent     = d.namaPembeli   || "-";
  el.whatsappPembeli.textContent = d.whatsapp      || "-";
  el.alamatPembeli.textContent   = d.alamat        || "-";
  el.namaKurir.textContent       = d.kurir         || "-";
  el.nomorResi.textContent       = d.resi          || "-";
  el.statusPengiriman.textContent = LABEL_PENGIRIMAN[d.status] || "Belum Dikirim";
  el.subtotal.textContent        = formatRupiah(d.subtotal);
  el.ongkir.textContent          = formatRupiah(d.ongkir);
  el.diskon.textContent          = formatRupiah(d.diskon);
  el.totalBayar.textContent      = formatRupiah(d.totalBayar);
}

// ============================================================
// RENDER: DAFTAR PRODUK
// ============================================================

/**
 * Merender kartu produk dari array `items` pada data pesanan.
 * Gambar fallback ke assets/no-image.png jika URL gambar rusak.
 */
function renderProduk() {
  const items = dataPesanan.items || [];

  if (!items.length) {
    el.produkContainer.innerHTML =
      `<div class="empty-state-mini">Tidak ada produk dalam pesanan ini.</div>`;
    return;
  }

  // Bangun semua kartu sekaligus, baru sisipkan ke DOM (lebih efisien)
  const html = items.map(item => {
    const gambar = Array.isArray(item.gambar)
      ? item.gambar[0]
      : (item.gambar || "assets/no-image.png");

    const qty   = Number(item.qty)   || 1;
    const harga = Number(item.harga) || 0;
    const total = qty * harga;

    return `
      <div class="produk-card">
        <img
          src="${escapeHTML(gambar)}"
          loading="lazy"
          alt="${escapeHTML(item.namaProduk)}"
          onerror="this.src='assets/no-image.png'">
        <div class="produk-info">
          <h3>${escapeHTML(item.namaProduk)}</h3>
          <p>Jumlah : ${qty}</p>
          <p>Harga  : ${formatRupiah(harga)}</p>
        </div>
        <div class="produk-harga">${formatRupiah(total)}</div>
      </div>
    `;
  }).join("");

  el.produkContainer.innerHTML = html;
}

// ============================================================
// RENDER: BUKTI PEMBAYARAN
// ============================================================

/**
 * Menampilkan gambar bukti transfer jika sudah diunggah.
 * Jika belum ada, tampilkan pesan kosong.
 */
function renderBukti() {
  const url = dataPesanan.buktiTransfer;

  if (!url) {
    el.buktiContainer.innerHTML =
      `<div class="empty-state-mini">Belum ada bukti pembayaran.</div>`;
    return;
  }

  el.buktiContainer.innerHTML = `
    <img src="${escapeHTML(url)}" loading="lazy" alt="Bukti Transfer">
    <br><br>
    <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"
       class="btn btn-secondary">
      🔍 Lihat Gambar
    </a>
  `;
}

// ============================================================
// RENDER: TIMELINE STATUS
// ============================================================

/**
 * Mengaktifkan langkah-langkah timeline sesuai status pesanan saat ini.
 * Asumsi: elemen .timeline-item di HTML berjumlah 5, indeks 0–4.
 *
 *   0 → Pesanan Dibuat   (selalu aktif)
 *   1 → Menunggu Pembayaran / Menunggu Verifikasi
 *   2 → Diproses
 *   3 → Dikirim
 *   4 → Selesai
 */
function renderTimeline() {
  const items = [...document.querySelectorAll(".timeline-item")];

  // Reset semua langkah
  items.forEach(item => item.classList.remove("active"));

  // Indeks langkah aktif berdasarkan status
  const indeksMaksimal = {
    "Belum Bayar":          1,
    "Menunggu Verifikasi":  1,
    "Diproses":             2,
    "Dikirim":              3,
    "Selesai":              4,
  };

  const maks = indeksMaksimal[dataPesanan.status] ?? 0;

  // Aktifkan semua langkah dari 0 hingga maks (inklusif)
  for (let i = 0; i <= maks && i < items.length; i++) {
    items[i].classList.add("active");
  }
}

// ============================================================
// RENDER: TOMBOL AKSI
// ============================================================

/**
 * Menampilkan tombol yang relevan sesuai status pesanan:
 *   - "Hubungi Toko"    → selalu aktif
 *   - "Upload Bukti"    → hanya saat status "Belum Bayar"
 *   - "Beri Ulasan"     → hanya saat status "Selesai"
 */
function renderAksi() {
  // Sembunyikan tombol kondisional terlebih dahulu
  el.uploadBuktiBtn.style.display = "none";
  el.beriUlasanBtn.style.display  = "none";

  // Hubungi Toko — selalu tersedia
  el.hubungiTokoBtn.onclick = () => {
    if (dataPesanan.whatsappUmkm) {
      window.open(`https://wa.me/${dataPesanan.whatsappUmkm}`, "_blank", "noopener,noreferrer");
    } else {
      showToast("Nomor WhatsApp penjual belum tersedia.");
    }
  };

  // Upload bukti hanya saat belum bayar
  if (dataPesanan.status === "Belum Bayar") {
    el.uploadBuktiBtn.style.display = "block";
    el.uploadBuktiBtn.onclick = () => {
      window.location.href = `upload-bukti.html?id=${pesananId}`;
    };
  }

  // Beri ulasan hanya saat pesanan selesai
  if (dataPesanan.status === "Selesai") {
    el.beriUlasanBtn.style.display = "block";
    el.beriUlasanBtn.onclick = () => {
      window.location.href = `beri-ulasan.html?id=${pesananId}`;
    };
  }
}

// ============================================================
// UTILITAS
// ============================================================

/**
 * Memformat Firestore Timestamp atau nilai tanggal lain ke
 * format lokal Bahasa Indonesia: "dd MMMM yyyy, HH:mm".
 *
 * @param {import("firebase/firestore").Timestamp|string|number|null} waktu
 * @returns {string}
 */
function formatTanggal(waktu) {
  if (!waktu) return "-";

  const tanggal = waktu.toDate ? waktu.toDate() : new Date(waktu);

  return tanggal.toLocaleString("id-ID", {
    day:    "2-digit",
    month:  "long",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

/**
 * Memformat angka ke format mata uang Rupiah, misal: "Rp 150.000".
 *
 * @param {number|string|null|undefined} angka
 * @returns {string}
 */
function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

/**
 * Meng-escape karakter HTML khusus untuk mencegah XSS
 * saat menyisipkan string tidak terpercaya ke innerHTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Menampilkan notifikasi toast sementara di sudut layar.
 *
 * @param {string} pesan - Teks yang ditampilkan di toast.
 */
function showToast(pesan) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = pesan;
  document.body.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Animasi keluar lalu hapus elemen
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

/**
 * Redirect ke halaman daftar pesanan setelah jeda waktu tertentu.
 *
 * @param {number} delay - Jeda dalam milidetik sebelum redirect.
 */
function redirectKePesananSaya(delay = 0) {
  setTimeout(() => {
    window.location.href = "pesanan-saya.html";
  }, delay);
}
