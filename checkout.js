// =============================================================================
// checkout.js — PasarNusa
// Logika halaman checkout: autentikasi, keranjang, ongkir, voucher, pesanan.
// Bergantung pada Firebase (Firestore + Auth) via CDN ESM.
// =============================================================================

// -----------------------------------------------------------------------------
// IMPORT FIREBASE
// -----------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, query, where,
  getDocs, addDoc, doc, getDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// -----------------------------------------------------------------------------
// REFERENSI ELEMEN DOM
// -----------------------------------------------------------------------------
const elCheckoutProduk  = document.getElementById("checkoutProduk");
const elNama            = document.getElementById("namaPembeli");
const elWhatsapp        = document.getElementById("whatsappPembeli");
const elAlamat          = document.getElementById("alamatPembeli");
const elKota            = document.getElementById("kotaTujuan");
const elKurir           = document.getElementById("kurir");
const elKodeVoucher     = document.getElementById("kodeVoucher");
const elCekVoucher      = document.getElementById("cekVoucher");
const elVoucherInfo     = document.getElementById("voucherInfo");
const elCheckoutBtn     = document.getElementById("checkoutBtn");
const elEmptyCheckout   = document.getElementById("emptyCheckout");

// -----------------------------------------------------------------------------
// STATE HALAMAN
// -----------------------------------------------------------------------------
let uid           = "";
let keranjang     = [];
let tokoData      = {};
let subtotal      = 0;
let ongkir        = 0;
let diskon        = 0;
let voucherDipakai = null;

// Tarif ongkir per rute "kotaAsal-kotaTujuan" (dalam Rupiah per kg).
// Tambahkan entri baru di sini sesuai jangkauan pengiriman.
const TARIF_ONGKIR = {
  "Trenggalek-Trenggalek":   5_000,
  "Trenggalek-Tulungagung": 10_000,
  "Tulungagung-Trenggalek": 10_000,
  "Tulungagung-Tulungagung": 5_000,
};

// Tarif default jika rute tidak ditemukan
const TARIF_DEFAULT = 25_000;

// Daftar kota tujuan pengiriman
const DAFTAR_KOTA = [
  "Trenggalek", "Tulungagung", "Blitar", "Kediri", "Ponorogo",
  "Pacitan", "Madiun", "Nganjuk", "Malang", "Batu",
  "Mojokerto", "Surabaya", "Sidoarjo", "Gresik", "Lamongan",
  "Bojonegoro", "Tuban", "Probolinggo", "Pasuruan", "Lumajang",
  "Jember", "Bondowoso", "Situbondo", "Banyuwangi",
];

// =============================================================================
// INISIALISASI
// =============================================================================

document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  tampilkanSkeleton();
  await loadKeranjang();
  populateKota();
  initEvent();
}

// =============================================================================
// AUTENTIKASI
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
// SKELETON LOADING
// =============================================================================

function tampilkanSkeleton() {
  const template = document.getElementById("loadingCheckout");
  elCheckoutProduk.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    elCheckoutProduk.appendChild(template.content.cloneNode(true));
  }
}

// =============================================================================
// LOAD KERANJANG
// =============================================================================

async function loadKeranjang() {
  const snapshot = await getDocs(
    query(collection(db, "keranjang"), where("uidUser", "==", uid))
  );

  // Hanya ambil item yang dipilih (selected !== false)
  keranjang = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.selected !== false) {
      keranjang.push({ id: docSnap.id, ...data });
    }
  });

  if (keranjang.length === 0) {
    // Tampilkan state kosong, sembunyikan daftar produk
    elEmptyCheckout.hidden = false;
    elEmptyCheckout.removeAttribute("aria-hidden");
    elCheckoutProduk.hidden = true;
    return;
  }

  await loadToko();
  renderProduk();
  hitungSubtotal();
}

// =============================================================================
// LOAD DATA TOKO
// =============================================================================

async function loadToko() {
  // Asumsikan semua item dari satu UMKM (uidUmkm dari item pertama)
  const uidUmkm   = keranjang[0].uidUmkm;
  const snapshot  = await getDoc(doc(db, "users", uidUmkm));

  if (snapshot.exists()) {
    tokoData = snapshot.data();
  }
}

// =============================================================================
// RENDER PRODUK
// =============================================================================

function renderProduk() {
  elCheckoutProduk.innerHTML = "";

  keranjang.forEach((item) => {
    const harga          = Number(item.harga  || 0);
    const jumlah         = Number(item.jumlah || 1);
    const subtotalProduk = harga * jumlah;

    // Buat elemen secara programatik — aman dari XSS (tidak pakai innerHTML dengan data user)
    const wrapper = document.createElement("div");
    wrapper.className = "checkout-item";

    const img = document.createElement("img");
    img.src     = item.gambar || "assets/no-image.png";
    img.alt     = item.namaProduk || "Produk";
    img.loading = "lazy";
    img.width   = 90;
    img.height  = 90;

    const info = document.createElement("div");

    const nama = document.createElement("h3");
    nama.textContent = item.namaProduk || "-";

    const pJumlah = document.createElement("p");
    pJumlah.textContent = `Jumlah: ${jumlah}`;

    const pHarga = document.createElement("p");
    pHarga.textContent = formatRupiah(harga);

    const pSubtotal = document.createElement("h4");
    pSubtotal.textContent = formatRupiah(subtotalProduk);

    info.append(nama, pJumlah, pHarga, pSubtotal);
    wrapper.append(img, info);
    elCheckoutProduk.appendChild(wrapper);
  });
}

// =============================================================================
// HITUNG SUBTOTAL
// =============================================================================

function hitungSubtotal() {
  subtotal = keranjang.reduce((acc, item) => {
    return acc + Number(item.harga || 0) * Number(item.jumlah || 1);
  }, 0);

  updateRingkasan();
}

// =============================================================================
// UPDATE RINGKASAN PEMBAYARAN
// =============================================================================

function updateRingkasan() {
  const total = subtotal + ongkir - diskon;

  document.getElementById("subtotalInfo").textContent      = formatRupiah(subtotal);
  document.getElementById("ongkirInfo").textContent        = formatRupiah(ongkir);
  document.getElementById("diskonInfo").textContent        = formatRupiah(diskon);
  document.getElementById("totalBayar").textContent        = formatRupiah(total);

  // Pembagian pendapatan: 90% UMKM, 5% Affiliate, 5% Platform
  document.getElementById("pendapatanUmkm").textContent    = formatRupiah(Math.round(subtotal * 0.90));
  document.getElementById("komisiAffiliate").textContent   = formatRupiah(Math.round(subtotal * 0.05));
  document.getElementById("pendapatanPlatform").textContent = formatRupiah(Math.round(subtotal * 0.05));
}

// =============================================================================
// POPULATE KOTA TUJUAN
// =============================================================================

function populateKota() {
  // Gunakan DocumentFragment agar hanya satu reflow DOM
  const fragment = document.createDocumentFragment();

  DAFTAR_KOTA.forEach((kota) => {
    const option   = document.createElement("option");
    option.value   = kota;
    option.textContent = kota;
    fragment.appendChild(option);
  });

  elKota.appendChild(fragment);
}

// =============================================================================
// HITUNG ONGKIR
// =============================================================================

function hitungOngkir() {
  const kotaAsal   = tokoData.kota || "";
  const kotaTujuan = elKota.value;
  const key        = `${kotaAsal}-${kotaTujuan}`;

  // Total berat dalam gram → konversi ke kg untuk kalkulasi tarif
  const totalBerat = keranjang.reduce((acc, item) => {
    return acc + Number(item.berat || 0) * Number(item.jumlah || 1);
  }, 0);

  const tarifPerKg = TARIF_ONGKIR[key] ?? TARIF_DEFAULT;
  ongkir = Math.ceil(totalBerat / 1000) * tarifPerKg;

  updateRingkasan();
}

// =============================================================================
// VOUCHER
// =============================================================================

async function gunakanVoucher() {
  const kode = elKodeVoucher.value.trim();
  if (!kode) return;

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "voucher"),
        where("kode",  "==", kode),
        where("aktif", "==", true)
      )
    );

    if (snapshot.empty) {
      showToast("Voucher tidak ditemukan.");
      return;
    }

    const voucher      = snapshot.docs[0].data();
    voucherDipakai     = voucher.kode;
    diskon             = Math.floor(subtotal * (Number(voucher.diskon || 0) / 100));
    elVoucherInfo.textContent = `Voucher aktif: ${voucher.kode}`;

    updateRingkasan();
    showToast("Voucher berhasil digunakan.");
  } catch (error) {
    console.error("Gagal memvalidasi voucher:", error);
    showToast("Terjadi kesalahan. Coba lagi.");
  }
}

// =============================================================================
// VALIDASI FORM
// =============================================================================

function validasiForm() {
  if (
    !elNama.value.trim()     ||
    !elWhatsapp.value.trim() ||
    !elAlamat.value.trim()   ||
    !elKota.value
  ) {
    showToast("Lengkapi semua data penerima.");
    return false;
  }

  // Format WhatsApp: awalan 08 atau 628, diikuti 8–13 digit
  if (!/^(08|628)[0-9]{8,13}$/.test(elWhatsapp.value.trim())) {
    showToast("Nomor WhatsApp tidak valid.");
    return false;
  }

  return true;
}

// =============================================================================
// BUAT PESANAN
// =============================================================================

async function buatPesanan() {
  if (!validasiForm()) return;

  // Nonaktifkan tombol agar tidak double-submit
  elCheckoutBtn.disabled   = true;
  elCheckoutBtn.textContent = "Membuat pesanan…";

  try {
    const total = subtotal + ongkir - diskon;

    const docRef = await addDoc(collection(db, "pesanan"), {
      uidPembeli:       uid,
      uidUmkm:          keranjang[0].uidUmkm,
      items:            keranjang,
      namaPembeli:      elNama.value.trim(),
      whatsapp:         elWhatsapp.value.trim(),
      alamat:           elAlamat.value.trim(),
      kota:             elKota.value,
      kurir:            elKurir.value,
      subtotal,
      ongkir,
      diskon,
      voucher:          voucherDipakai || "",
      total,
      status:           "Belum Bayar",
      statusPembayaran: "Belum Bayar",
      paymentMethod:    "transfer",
      paymentStatus:    "Belum Dibayar",
      paymentToken:     "",
      paymentUrl:       "",
      paymentReference: "",
      paidAt:           null,
      expiredAt:        null,
      // FIX: koma yang hilang sebelum createdAt menyebabkan SyntaxError
      updatedAt:        serverTimestamp(),
      createdAt:        serverTimestamp(),
    });

    showToast("Pesanan berhasil dibuat.");

    // Arahkan ke halaman pembayaran setelah toast tampil
    setTimeout(() => {
      window.location.href = `payment.html?id=${docRef.id}`;
    }, 1_000);

  } catch (error) {
    console.error("Gagal membuat pesanan:", error);
    showToast("Gagal membuat pesanan. Coba lagi.");
    elCheckoutBtn.disabled   = false;
    elCheckoutBtn.textContent = "💳 Buat Pesanan";
  }
}

// =============================================================================
// EVENT LISTENER
// =============================================================================

function initEvent() {
  elKota.addEventListener("change", hitungOngkir);
  elKurir.addEventListener("change", hitungOngkir); // Kurir juga mempengaruhi ongkir
  elCekVoucher.addEventListener("click", gunakanVoucher);
  elCheckoutBtn.addEventListener("click", buatPesanan);

  // Izinkan menekan Enter di field voucher
  elKodeVoucher.addEventListener("keydown", (e) => {
    if (e.key === "Enter") gunakanVoucher();
  });
}

// =============================================================================
// HELPER — FORMAT RUPIAH
// =============================================================================

function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

// =============================================================================
// HELPER — TOAST NOTIFIKASI
// =============================================================================

function showToast(pesan) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = pesan;
  // Agar screen reader membacanya sebagai notifikasi
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  document.body.appendChild(toast);

  // Animasi: tampil → tahan → hilang
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3_000);
}
