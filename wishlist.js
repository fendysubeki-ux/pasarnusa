// =============================================================================
// wishlist.js — Logika halaman Wishlist PasarNusa
// Bergantung pada: Firebase Auth + Firestore (v12), style.css (toast)
// =============================================================================

import { initializeApp }    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// =============================================================================
// KONFIGURASI FIREBASE
// PERINGATAN: Pindahkan ke environment variable / backend proxy sebelum produksi
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
// REFERENSI ELEMEN DOM
// =============================================================================

const elContainer    = document.getElementById("wishlistContainer");
const elTotal        = document.getElementById("totalWishlist");
const elStokAda      = document.getElementById("stokAda");
const elStokHabis    = document.getElementById("stokHabis");
const elEmptyState   = document.getElementById("emptyWishlist");
const btnAddAllCart  = document.getElementById("addAllCart");
const btnHapusSemua  = document.getElementById("hapusWishlist");

// =============================================================================
// STATE
// =============================================================================

let uid          = "";          // UID pengguna yang sedang login
let semuaWishlist = [];         // Cache seluruh item wishlist
let autoRefreshId = null;       // ID setInterval untuk bisa di-clear bila perlu

// =============================================================================
// INISIALISASI
// =============================================================================

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  await loadWishlist();
  initButtons();
  startAutoRefresh();
}

// =============================================================================
// AUTENTIKASI — Redirect ke login bila belum masuk
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
// LOAD WISHLIST
// Bug fix: loop await di dalam forEach diganti for...of (forEach tidak await-aware)
// Optimasi: Promise.all untuk fetch produk secara paralel, bukan satu-per-satu
// =============================================================================

async function loadWishlist() {
  try {
    // 1. Ambil semua dokumen wishlist milik user
    const snap = await getDocs(
      query(collection(db, "wishlist"), where("uid", "==", uid))
    );

    // 2. Fetch semua data produk secara paralel (lebih cepat dari sequential await)
    const results = await Promise.all(
      snap.docs.map(async (itemDoc) => {
        const data       = itemDoc.data();
        const produkSnap = await getDoc(doc(db, "produk", data.produkId));

        if (!produkSnap.exists()) return null; // produk sudah dihapus

        return {
          id:      itemDoc.id,
          wishlist: data,
          produk:  { id: produkSnap.id, ...produkSnap.data() },
        };
      })
    );

    // 3. Saring entri yang produknya sudah tidak ada
    semuaWishlist = results.filter(Boolean);

    renderWishlist();
    updateStatistik();

  } catch (error) {
    console.error("[Wishlist] Gagal memuat:", error);
    showToast("Gagal memuat wishlist. Coba lagi.");
  }
}

// =============================================================================
// STATISTIK — Update counter ringkasan
// =============================================================================

function updateStatistik() {
  const total    = semuaWishlist.length;
  const tersedia = semuaWishlist.filter(({ produk }) => Number(produk.stok ?? 0) > 0).length;

  elTotal.textContent    = total;
  elStokAda.textContent  = tersedia;
  elStokHabis.textContent = total - tersedia;
}

// =============================================================================
// RENDER — Tampilkan daftar wishlist ke DOM
// Bug fix: innerHTML += di dalam loop menyebabkan reflow berulang dan
//          event handler lama terputus. Diganti DocumentFragment.
// Bug fix: innerHTML dengan data dari Firestore rentan XSS — gunakan textContent
//          untuk string yang tidak dipercaya.
// =============================================================================

function renderWishlist() {
  elContainer.innerHTML = "";

  const isEmpty = semuaWishlist.length === 0;
  elEmptyState.hidden = !isEmpty;

  if (isEmpty) return;

  const fragment = document.createDocumentFragment();

  semuaWishlist.forEach((item) => {
    const { produk } = item;
    const stokAda    = Number(produk.stok ?? 0) > 0;
    const gambar     = Array.isArray(produk.gambar)
      ? produk.gambar[0]
      : (produk.gambar || "assets/no-image.png");

    // Bangun elemen secara programatik — aman dari XSS
    const card = document.createElement("div");
    card.className = "wishlist-item";

    // Gambar produk
    const img = document.createElement("img");
    img.src     = gambar;
    img.alt     = produk.namaProduk || "Produk";
    img.loading = "lazy";
    img.onerror = () => { img.src = "assets/no-image.png"; };

    // Blok info
    const info = document.createElement("div");
    info.className = "wishlist-info";

    const nama = document.createElement("h3");
    nama.textContent = produk.namaProduk || "-";

    const toko = document.createElement("p");
    toko.textContent = produk.namaToko || "-";

    const harga = document.createElement("div");
    harga.className   = "wishlist-price";
    harga.textContent = `Rp ${Number(produk.harga ?? 0).toLocaleString("id-ID")}`;

    const stokBadge = document.createElement("div");
    stokBadge.className   = `stock-badge ${stokAda ? "stock-ready" : "stock-empty"}`;
    stokBadge.textContent = stokAda ? "Stok Tersedia" : "Stok Habis";

    // Tombol aksi
    const actions = document.createElement("div");
    actions.className = "wishlist-action";

    const btnKeranjang = buatTombol("🛒 Keranjang", "btn btn-primary",
      () => tambahKeranjang(produk.id));

    const btnHapus = buatTombol("🗑 Hapus", "btn btn-secondary",
      () => hapusItem(item.id));

    const linkDetail = document.createElement("a");
    linkDetail.href      = `produk-detail.html?id=${encodeURIComponent(produk.id)}`;
    linkDetail.className = "btn btn-secondary";
    linkDetail.textContent = "👁 Detail";

    actions.append(btnKeranjang, btnHapus, linkDetail);
    info.append(nama, toko, harga, stokBadge, actions);
    card.append(img, info);
    fragment.appendChild(card);
  });

  elContainer.appendChild(fragment);
}

/** Helper: buat <button> dengan label, kelas, dan handler. */
function buatTombol(label, className, onClick) {
  const btn       = document.createElement("button");
  btn.className   = className;
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

// =============================================================================
// TAMBAH KE KERANJANG — Satu produk
// =============================================================================

async function tambahKeranjang(produkId) {
  try {
    await addDoc(collection(db, "keranjang"), {
      uid,
      produkId,
      qty:       1,
      createdAt: serverTimestamp(),
    });
    showToast("Produk ditambahkan ke keranjang.");
  } catch (error) {
    console.error("[Wishlist] Gagal tambah keranjang:", error);
    showToast("Gagal menambahkan produk ke keranjang.");
  }
}

// =============================================================================
// HAPUS SATU ITEM — Dari wishlist
// =============================================================================

async function hapusItem(wishlistId) {
  try {
    await deleteDoc(doc(db, "wishlist", wishlistId));
    await loadWishlist();
    showToast("Produk dihapus dari wishlist.");
  } catch (error) {
    console.error("[Wishlist] Gagal hapus item:", error);
    showToast("Gagal menghapus produk dari wishlist.");
  }
}

// =============================================================================
// TAMBAH SEMUA KE KERANJANG — Hanya produk yang stoknya masih ada
// =============================================================================

async function tambahSemuaKeranjang() {
  const tersedia = semuaWishlist.filter(({ produk }) => Number(produk.stok ?? 0) > 0);

  if (tersedia.length === 0) {
    showToast("Tidak ada produk yang tersedia untuk ditambahkan.");
    return;
  }

  try {
    // Promise.all lebih cepat dari sequential await untuk banyak dokumen
    await Promise.all(
      tersedia.map(({ produk }) =>
        addDoc(collection(db, "keranjang"), {
          uid,
          produkId:  produk.id,
          qty:       1,
          createdAt: serverTimestamp(),
        })
      )
    );
    showToast(`${tersedia.length} produk berhasil ditambahkan ke keranjang.`);
  } catch (error) {
    console.error("[Wishlist] Gagal tambah semua ke keranjang:", error);
    showToast("Gagal menambahkan semua produk ke keranjang.");
  }
}

// =============================================================================
// HAPUS SEMUA WISHLIST
// Optimasi: gunakan writeBatch agar semua delete dikirim dalam 1 request Firestore
// =============================================================================

async function hapusSemuaWishlist() {
  if (semuaWishlist.length === 0) {
    showToast("Wishlist sudah kosong.");
    return;
  }

  if (!confirm("Hapus semua produk dari wishlist?")) return;

  try {
    const batch = writeBatch(db);
    semuaWishlist.forEach(({ id }) => batch.delete(doc(db, "wishlist", id)));
    await batch.commit();

    await loadWishlist();
    showToast("Semua produk berhasil dihapus dari wishlist.");
  } catch (error) {
    console.error("[Wishlist] Gagal hapus semua:", error);
    showToast("Gagal mengosongkan wishlist.");
  }
}

// =============================================================================
// TOMBOL — Pasang event listener ke tombol aksi cepat
// =============================================================================

function initButtons() {
  btnAddAllCart.addEventListener("click", tambahSemuaKeranjang);
  btnHapusSemua.addEventListener("click", hapusSemuaWishlist);
}

// =============================================================================
// AUTO REFRESH — Perbarui wishlist setiap 30 detik
// =============================================================================

function startAutoRefresh() {
  // Bersihkan interval lama bila initPage dipanggil lebih dari sekali
  if (autoRefreshId) clearInterval(autoRefreshId);
  autoRefreshId = setInterval(loadWishlist, 30_000);
}

// =============================================================================
// TOAST NOTIFIKASI — Pesan singkat di pojok layar
// =============================================================================

function showToast(message) {
  const toast       = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;                // textContent, bukan innerText (lebih cepat)
  toast.setAttribute("role", "status");       // dibaca screen reader
  toast.setAttribute("aria-live", "polite");

  document.body.appendChild(toast);

  // Animasi masuk (requestAnimationFrame agar transition berjalan setelah mount)
  requestAnimationFrame(() => toast.classList.add("show"));

  // Animasi keluar → hapus dari DOM
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3_000);
}
