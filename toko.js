// ============================================================
// toko.js – Halaman Profil Toko UMKM | PasarNusa
// Mengambil data toko & produk dari Firestore berdasarkan ?uid=
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ── Konfigurasi Firebase ─────────────────────────────────────
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

// ── Ambil UID dari query string ───────────────────────────────
const uid = new URLSearchParams(window.location.search).get("uid");

if (!uid) {
  alert("Toko tidak ditemukan.");
  window.location.href = "index.html";
  // Hentikan eksekusi modul; throw tidak diperlukan karena redirect segera terjadi
}

// ── Helper: ambil elemen DOM; lempar error jika tidak ada ────
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemen #${id} tidak ditemukan di DOM.`);
  return el;
}

// ── Helper: format tanggal Firestore Timestamp → lokal ID ────
function formatTanggal(timestamp) {
  if (!timestamp?.seconds) return "-";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });
}

// ── Helper: format angka ke Rupiah ───────────────────────────
function formatRupiah(angka) {
  return Number(angka || 0).toLocaleString("id-ID");
}

// ── Helper: ambil URL gambar pertama (string atau array) ─────
function urlGambar(gambar) {
  return Array.isArray(gambar) ? gambar[0] : gambar;
}

// ── Helper: nomor WhatsApp → format internasional (62xxx) ────
function formatWA(nomor) {
  return String(nomor || "").replace(/^0/, "62");
}

// ── Render kartu produk ───────────────────────────────────────
function buatKartuProduk(docItem) {
  const p  = docItem.data();
  const el = document.createElement("div");
  el.className = "product-card searchable";

  el.innerHTML = `
    <img src="${urlGambar(p.gambar)}" alt="${p.namaProduk}" loading="lazy" />
    <div class="product-info">
      <span class="category">${p.kategori || "Produk"}</span>
      <h3>${p.namaProduk}</h3>
      <p class="price">Rp ${formatRupiah(p.harga)}</p>
      <p>📦 Stok: ${p.stok || 0}</p>
      <p>🔥 Terjual: ${p.terjual || 0}</p>
      <a href="produk-detail.html?id=${docItem.id}" class="btn-primary">Lihat Detail</a>
    </div>
  `;

  return el;
}

// ── Muat data toko & produk ───────────────────────────────────
async function muatToko() {
  // 1. Data toko (koleksi "users")
  const tokoSnap = await getDoc(doc(db, "users", uid));
  if (!tokoSnap.exists()) throw new Error("Data toko tidak ditemukan.");

  const toko = tokoSnap.data();

  // Isi informasi toko
  getEl("namaToko").textContent      = toko.namaUmkm   || "UMKM";
  getEl("deskripsiToko").textContent = toko.deskripsi  || "-";
  getEl("nomorToko").textContent     = toko.whatsapp   || "-";
  getEl("namaBank").textContent      = toko.bank       || "-";
  getEl("nomorRekening").textContent = toko.rekening   || "-";
  getEl("atasNama").textContent      = toko.atasNama   || "-";
  getEl("ratingToko").textContent    = toko.ratingToko || 0;
  getEl("ratingMini").textContent    = toko.ratingToko || 0;
  getEl("tanggalGabung").textContent = formatTanggal(toko.createdAt);

  // Alamat: gabungkan bagian yang tersedia
  getEl("alamatToko").textContent =
    [toko.alamat, toko.kota, toko.provinsi].filter(Boolean).join(", ") || "-";

  // Logo & tautan WhatsApp
  getEl("logoToko").src  = toko.logo || "https://picsum.photos/200";
  getEl("waToko").href   = `https://wa.me/${formatWA(toko.whatsapp)}`;

  // 2. Produk toko (koleksi "produk")
  const produkSnap = await getDocs(
    query(collection(db, "produk"), where("uidUmkm", "==", uid))
  );

  const container  = getEl("tokoContainer");
  container.innerHTML = ""; // hapus placeholder "Memuat…"

  let totalProduk  = 0;
  let produkAktif  = 0;
  let totalTerjual = 0;

  produkSnap.forEach((docItem) => {
    const p = docItem.data();
    totalProduk++;
    if (p.status === "Aktif") produkAktif++;
    totalTerjual += Number(p.terjual || 0);

    container.appendChild(buatKartuProduk(docItem));
  });

  // Tampilkan pesan kosong jika tidak ada produk
  if (totalProduk === 0) {
    container.innerHTML = `
      <div class="dashboard-card">
        <h3>Belum Ada Produk</h3>
        <p>UMKM ini belum menambahkan produk.</p>
      </div>
    `;
  }

  // Isi statistik dashboard
  getEl("totalProduk").textContent     = totalProduk;
  getEl("produkAktif").textContent     = produkAktif;
  getEl("totalTerjual").textContent    = totalTerjual;
  getEl("totalTerjualMini").textContent = totalTerjual;
}

// ── Fitur berbagi: salin URL ke clipboard ─────────────────────
function initShare() {
  getEl("shareToko").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link toko berhasil disalin.");
    } catch {
      // Fallback untuk browser yang tidak mendukung Clipboard API
      prompt("Salin link toko ini:", window.location.href);
    }
  });
}

// ── Fitur pencarian produk (filter real-time) ─────────────────
function initSearch() {
  getEl("searchProduk").addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase().trim();

    document.querySelectorAll(".searchable").forEach((card) => {
      const cocok = card.textContent.toLowerCase().includes(keyword);
      card.style.display = cocok ? "" : "none";
    });
  });
}

// ── Entry point ───────────────────────────────────────────────
try {
  await muatToko();
  initShare();
  initSearch();
} catch (error) {
  console.error("[PasarNusa] Gagal memuat toko:", error);
  alert(`Gagal memuat toko.\n\n${error.message}`);
}
