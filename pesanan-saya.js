// ============================================================
// pesanan-saya.js — PasarNusa
// Menampilkan, memfilter, dan menghitung statistik pesanan
// milik pengguna yang sedang login.
// ============================================================

import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs }
                            from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================
// KONFIGURASI FIREBASE
// ============================================================

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

// ============================================================
// REFERENSI ELEMEN DOM
// ============================================================

const el = {
  container:           document.getElementById("pesananContainer"),
  emptyState:          document.getElementById("emptyPesanan"),
  search:              document.getElementById("searchPesanan"),
  filterStatus:        document.getElementById("filterStatus"),
  totalPesanan:        document.getElementById("totalPesanan"),
  belumBayar:          document.getElementById("belumBayar"),
  menungguVerifikasi:  document.getElementById("menungguVerifikasi"),
  diproses:            document.getElementById("diproses"),
  dikirim:             document.getElementById("dikirim"),
  selesai:             document.getElementById("selesai"),
  totalBelanja:        document.getElementById("totalBelanja"),
};

// ============================================================
// STATE
// ============================================================

/** @type {string} UID pengguna yang sedang login */
let uid = "";

/** @type {Array<Object>} Seluruh data pesanan dari Firestore */
let semuaPesanan = [];

// ============================================================
// INISIALISASI
// ============================================================

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  showLoading();
  await loadPesanan();
  el.search.addEventListener("input", filterPesanan);
  el.filterStatus.addEventListener("change", filterPesanan);
}

// ============================================================
// AUTENTIKASI — redirect ke login jika belum masuk
// ============================================================

async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}

// ============================================================
// LOADING SKELETON — tampilkan 4 kartu placeholder
// ============================================================

function showLoading() {
  const template = document.getElementById("loadingPesanan");
  el.container.innerHTML = "";
  el.container.setAttribute("aria-busy", "true");

  for (let i = 0; i < 4; i++) {
    el.container.appendChild(template.content.cloneNode(true));
  }
}

// ============================================================
// AMBIL DATA PESANAN dari Firestore
// ============================================================

async function loadPesanan() {
  try {
    const q = query(
      collection(db, "pesanan"),
      where("uidPembeli", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    semuaPesanan = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    updateStatistik();
    renderPesanan(semuaPesanan);
  } catch (error) {
    console.error("[PasarNusa] Gagal memuat pesanan:", error);
    showError();
  } finally {
    el.container.setAttribute("aria-busy", "false");
  }
}

// ============================================================
// STATISTIK DASHBOARD — hitung dan tampilkan ringkasan
// ============================================================

function updateStatistik() {
  const count = status =>
    semuaPesanan.filter(item => item.status === status).length;

  el.totalPesanan.textContent       = semuaPesanan.length;
  el.belumBayar.textContent         = count("Belum Bayar");
  el.menungguVerifikasi.textContent = count("Menunggu Verifikasi");
  el.diproses.textContent           = count("Diproses");
  el.dikirim.textContent            = count("Dikirim");
  el.selesai.textContent            = count("Selesai");

  const total = semuaPesanan.reduce((sum, item) => sum + Number(item.totalBayar || 0), 0);
  el.totalBelanja.textContent = formatRupiah(total);
}

// ============================================================
// RENDER DAFTAR PESANAN
// ============================================================

function renderPesanan(data) {
  el.container.innerHTML = "";

  const isEmpty = data.length === 0;
  el.emptyState.hidden = !isEmpty;

  if (isEmpty) return;

  // Gunakan DocumentFragment agar hanya satu reflow DOM
  const fragment = document.createDocumentFragment();
  data.forEach(item => fragment.appendChild(createCard(item)));
  el.container.appendChild(fragment);
}

// ============================================================
// BUAT KARTU PESANAN — aman dari XSS via textContent
// ============================================================

function createCard(item) {
  // Ambil gambar produk pertama (support string maupun array)
  const gambar = item.items?.[0]?.gambar?.[0]
    ?? item.items?.[0]?.gambar
    ?? "assets/no-image.png";

  const namaProduk  = item.items?.[0]?.namaProduk ?? "Produk";
  const jumlahItem  = item.items?.length ?? 0;
  const nomorSingkat = item.id.substring(0, 8);

  // Buat elemen secara programatik — tidak ada innerHTML dengan data user
  const card = document.createElement("div");
  card.className = "order-card";

  const img = document.createElement("img");
  img.src     = gambar;
  img.alt     = namaProduk;
  img.loading = "lazy";

  const info = document.createElement("div");
  info.className = "order-info";
  info.innerHTML = `
    <h3></h3>
    <p>🏪 <span class="toko"></span></p>
    <p>🆔 <span class="nomor"></span></p>
    <p>🛍 <span class="jumlah"></span></p>
    <p class="harga"></p>
    <span class="status-badge ${statusClass(item.status)}"></span>
  `;

  // Isi teks via textContent agar aman dari XSS
  info.querySelector("h3").textContent           = namaProduk;
  info.querySelector(".toko").textContent        = item.namaUmkm    || "-";
  info.querySelector(".nomor").textContent       = nomorSingkat;
  info.querySelector(".jumlah").textContent      = `${jumlahItem} Produk`;
  info.querySelector(".harga").textContent       = formatRupiah(item.totalBayar);
  info.querySelector(".status-badge").textContent = item.status;

  const actions = document.createElement("div");
  actions.className = "order-action";

  const linkDetail = document.createElement("a");
  linkDetail.href      = `detail-pesanan.html?id=${encodeURIComponent(item.id)}`;
  linkDetail.className = "btn btn-primary";
  linkDetail.textContent = "Detail";
  actions.appendChild(linkDetail);

  // Tombol upload bukti hanya muncul untuk pesanan belum bayar
  if (item.status === "Belum Bayar") {
    const linkBukti = document.createElement("a");
    linkBukti.href      = `upload-bukti.html?id=${encodeURIComponent(item.id)}`;
    linkBukti.className = "btn btn-secondary";
    linkBukti.textContent = "Upload Bukti";
    actions.appendChild(linkBukti);
  }

  card.append(img, info, actions);
  return card;
}

// ============================================================
// STATUS BADGE — peta status ke class CSS
// ============================================================

const STATUS_CLASS = {
  "Belum Bayar":          "status-belum",
  "Menunggu Verifikasi":  "status-verifikasi",
  "Diproses":             "status-proses",
  "Dikirim":              "status-kirim",
  "Selesai":              "status-selesai",
};

function statusClass(status) {
  return STATUS_CLASS[status] ?? "status-ditolak";
}

// ============================================================
// FILTER & PENCARIAN — gabungkan keyword + status
// ============================================================

function filterPesanan() {
  const keyword = el.search.value.toLowerCase().trim();
  const status  = el.filterStatus.value;

  const hasil = semuaPesanan.filter(item => {
    const cocokKeyword =
      item.id.toLowerCase().includes(keyword) ||
      (item.namaUmkm ?? "").toLowerCase().includes(keyword);

    const cocokStatus = status === "all" || item.status === status;

    return cocokKeyword && cocokStatus;
  });

  renderPesanan(hasil);
}

// ============================================================
// FORMAT RUPIAH
// ============================================================

function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

// ============================================================
// TAMPILAN ERROR — gagal memuat dari Firestore
// ============================================================

function showError() {
  el.container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "empty-state";

  const icon = document.createElement("div");
  icon.className   = "empty-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "⚠️";

  const judul = document.createElement("h2");
  judul.textContent = "Terjadi Kesalahan";

  const pesan = document.createElement("p");
  pesan.textContent = "Gagal memuat data pesanan. Silakan muat ulang halaman.";

  wrap.append(icon, judul, pesan);
  el.container.appendChild(wrap);
}

// ============================================================
// TOAST NOTIFIKASI — dipakai oleh modul lain jika diperlukan
// ============================================================

export function showToast(message) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => toast.classList.add("show"));

  // Animasi keluar lalu hapus elemen
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
