// ======================================
// cart.js — PasarNusa Keranjang Belanja
// ======================================

// --- Firebase Imports ---
import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// KONFIGURASI FIREBASE
// ======================================

const app  = initializeApp({
  apiKey:            "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain:        "pasarnusa-18aa0.firebaseapp.com",
  projectId:         "pasarnusa-18aa0",
  storageBucket:     "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId:             "1:866998011671:web:5555115feb82741ab55952",
});

const db   = getFirestore(app);
const auth = getAuth(app);

// ======================================
// ELEMEN DOM
// ======================================

const cartContainer = document.getElementById("cartContainer");
const totalProdukEl = document.getElementById("totalProduk");
const totalItemEl   = document.getElementById("totalItem");
const subtotalEl    = document.getElementById("subtotal");
const totalBayarEl  = document.getElementById("totalBayar");
const pilihSemuaEl  = document.getElementById("pilihSemua");
const hapusDipilih  = document.getElementById("hapusDipilih");
const checkoutBtn   = document.getElementById("checkoutBtn");
const kosongkanBtn  = document.getElementById("kosongkanCart");
const emptyCart     = document.getElementById("emptyCart");

// ======================================
// STATE
// ======================================

let uid      = "";   // UID pengguna yang sedang login
let dataCart = [];   // Cache data keranjang dari Firestore

// ======================================
// INISIALISASI
// ======================================

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  showLoading();
  await loadCart();
  initEvent();
}

// ======================================
// AUTH — Redirect jika belum login
// ======================================

async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}

// ======================================
// LOADING SKELETON
// Tampilkan 3 placeholder sebelum data dimuat
// ======================================

function showLoading() {
  const template = document.getElementById("loadingCart");
  cartContainer.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    cartContainer.appendChild(template.content.cloneNode(true));
  }
}

// ======================================
// LOAD DATA KERANJANG dari Firestore
// ======================================

async function loadCart() {
  try {
    const snapshot = await getDocs(
      query(collection(db, "keranjang"), where("uidUser", "==", uid))
    );

    dataCart = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    renderCart();
    updateSummary();
  } catch (err) {
    console.error("loadCart:", err);
    showToast("Gagal memuat keranjang.");
  }
}

// ======================================
// RENDER — Tampilkan item keranjang ke DOM
// ======================================

function renderCart() {
  cartContainer.innerHTML = "";

  // Tampilkan empty state jika keranjang kosong
  if (dataCart.length === 0) {
    emptyCart.hidden  = false;
    cartContainer.hidden = true;
    return;
  }

  emptyCart.hidden  = true;
  cartContainer.hidden = false;

  const fragment = document.createDocumentFragment();

  dataCart.forEach(item => {
    const harga    = Number(item.harga  || 0);
    const jumlah   = Number(item.jumlah || 1);
    const subtotal = harga * jumlah;
    const checked  = item.selected !== false ? "checked" : "";
    const gambar   = item.gambar || "assets/no-image.png";

    // Buat elemen via innerHTML untuk kemudahan templating
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <input type="checkbox" class="pilihProduk" data-id="${item.id}" ${checked}>

      <img src="${gambar}" alt="${item.namaProduk}" loading="lazy">

      <div class="cart-info">
        <h3>${item.namaProduk}</h3>
        <p>${formatRupiah(harga)}</p>
        <p>Subtotal <b>${formatRupiah(subtotal)}</b></p>

        <div class="qty-box">
          <button data-action="kurang" data-id="${item.id}" aria-label="Kurangi jumlah">−</button>
          <input type="number" value="${jumlah}" min="1" readonly aria-label="Jumlah">
          <button data-action="tambah" data-id="${item.id}" aria-label="Tambah jumlah">+</button>
        </div>

        <div class="cart-action">
          <button data-action="hapus" data-id="${item.id}" class="btn btn-secondary">🗑 Hapus</button>
        </div>
      </div>
    `;

    fragment.appendChild(div);
  });

  cartContainer.appendChild(fragment);
  pasangCheckbox();
}

// ======================================
// SUMMARY — Hitung total berdasar item terpilih
// ======================================

function updateSummary() {
  let produk = 0;
  let item   = 0;
  let total  = 0;

  dataCart.forEach(data => {
    if (data.selected === false) return;

    produk++;
    item  += Number(data.jumlah || 0);
    total += Number(data.harga  || 0) * Number(data.jumlah || 0);
  });

  totalProdukEl.textContent = produk;
  totalItemEl.textContent   = item;
  subtotalEl.textContent    = formatRupiah(total);
  totalBayarEl.textContent  = formatRupiah(total);
}

// ======================================
// CHECKBOX — Sinkron status terpilih per item ke Firestore
// ======================================

function pasangCheckbox() {
  cartContainer.querySelectorAll(".pilihProduk").forEach(check => {
    check.addEventListener("change", async () => {
      const id   = check.dataset.id;
      const item = dataCart.find(i => i.id === id);
      if (!item) return;

      item.selected = check.checked;

      try {
        await updateDoc(doc(db, "keranjang", id), { selected: check.checked });
      } catch (err) {
        console.error("pasangCheckbox:", err);
        showToast("Gagal memperbarui pilihan.");
      }

      updateSummary();
    });
  });
}

// ======================================
// PILIH SEMUA — Batch update ke Firestore
// ======================================

async function pilihSemuaProduk() {
  const isChecked = pilihSemuaEl.checked;
  const batch     = writeBatch(db);

  dataCart.forEach(item => {
    item.selected = isChecked;
    batch.update(doc(db, "keranjang", item.id), { selected: isChecked });
  });

  try {
    await batch.commit();
  } catch (err) {
    console.error("pilihSemuaProduk:", err);
    showToast("Gagal memperbarui pilihan.");
  }

  renderCart();
  updateSummary();
}

// ======================================
// TAMBAH / KURANG QTY
// Diekspos ke window karena dipanggil lewat event delegation
// ======================================

async function tambahQty(id) {
  const item = dataCart.find(i => i.id === id);
  if (!item) return;

  if (item.jumlah >= (item.stok || 9999)) {
    showToast("Stok tidak mencukupi.");
    return;
  }

  try {
    await updateDoc(doc(db, "keranjang", id), { jumlah: Number(item.jumlah) + 1 });
    await loadCart();
  } catch (err) {
    console.error("tambahQty:", err);
    showToast("Gagal menambah jumlah.");
  }
}

async function kurangQty(id) {
  const item = dataCart.find(i => i.id === id);
  if (!item) return;

  // Jika sudah 1, hapus item sekalian
  if (item.jumlah <= 1) {
    await hapusItem(id);
    return;
  }

  try {
    await updateDoc(doc(db, "keranjang", id), { jumlah: Number(item.jumlah) - 1 });
    await loadCart();
  } catch (err) {
    console.error("kurangQty:", err);
    showToast("Gagal mengurangi jumlah.");
  }
}

// ======================================
// HAPUS SATU ITEM
// ======================================

async function hapusItem(id) {
  if (!confirm("Hapus produk dari keranjang?")) return;

  try {
    await deleteDoc(doc(db, "keranjang", id));
    showToast("Produk dihapus.");
    await loadCart();
  } catch (err) {
    console.error("hapusItem:", err);
    showToast("Gagal menghapus produk.");
  }
}

// ======================================
// KOSONGKAN SEMUA ITEM
// ======================================

async function kosongkanSemua() {
  if (!confirm("Kosongkan seluruh keranjang?")) return;

  const batch = writeBatch(db);
  dataCart.forEach(item => batch.delete(doc(db, "keranjang", item.id)));

  try {
    await batch.commit();
    showToast("Keranjang dikosongkan.");
    await loadCart();
  } catch (err) {
    console.error("kosongkanSemua:", err);
    showToast("Gagal mengosongkan keranjang.");
  }
}

// ======================================
// HAPUS ITEM TERPILIH
// ======================================

async function hapusDipilihFn() {
  const dipilih = dataCart.filter(item => item.selected !== false);

  if (dipilih.length === 0) {
    showToast("Belum ada produk yang dipilih.");
    return;
  }

  if (!confirm(`Hapus ${dipilih.length} produk yang dipilih?`)) return;

  const batch = writeBatch(db);
  dipilih.forEach(item => batch.delete(doc(db, "keranjang", item.id)));

  try {
    await batch.commit();
    showToast("Produk dipilih berhasil dihapus.");
    await loadCart();
  } catch (err) {
    console.error("hapusDipilih:", err);
    showToast("Gagal menghapus produk dipilih.");
  }
}

// ======================================
// CHECKOUT — Validasi sebelum pindah halaman
// ======================================

function checkout() {
  const dipilih = dataCart.filter(item => item.selected !== false);

  if (dipilih.length === 0) {
    showToast("Pilih minimal satu produk untuk checkout.");
    return;
  }

  window.location.href = "checkout.html";
}

// ======================================
// EVENT LISTENERS
// Menggunakan event delegation untuk tombol qty & hapus di dalam item
// ======================================

function initEvent() {
  // Pilih semua checkbox
  pilihSemuaEl.addEventListener("change", pilihSemuaProduk);

  // Hapus item yang dipilih
  hapusDipilih.addEventListener("click", hapusDipilihFn);

  // Checkout
  checkoutBtn.addEventListener("click", checkout);

  // Kosongkan keranjang
  kosongkanBtn.addEventListener("click", kosongkanSemua);

  // Delegasi untuk tombol qty & hapus di dalam cartContainer
  cartContainer.addEventListener("click", async e => {
    const btn    = e.target.closest("[data-action]");
    if (!btn) return;

    const { action, id } = btn.dataset;

    if (action === "tambah") await tambahQty(id);
    if (action === "kurang") await kurangQty(id);
    if (action === "hapus")  await hapusItem(id);
  });
}

// ======================================
// HELPER — Format angka ke Rupiah
// ======================================

function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

// ======================================
// HELPER — Toast Notifikasi
// ======================================

function showToast(message) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;   // textContent lebih aman dari innerHTML untuk input dinamis
  document.body.appendChild(toast);

  // Tampilkan setelah satu frame agar transisi CSS aktif
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
