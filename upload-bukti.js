// ============================================================
// upload-bukti.js  —  PasarNusa
// Halaman upload bukti transfer pembayaran.
//
// Alur utama:
//  1. Cek sesi login (redirect ke login jika belum masuk)
//  2. Baca ?id= dari URL, lalu muat data pesanan & UMKM
//  3. Tampilkan preview file yang dipilih + validasi ukuran
//  4. Upload gambar ke Cloudinary, simpan URL ke Firestore
//  5. Kirim notifikasi ke pembeli & UMKM
// ============================================================

// ── Import Firebase ──────────────────────────────────────────
import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc,
  collection, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// ── Konfigurasi Cloudinary ───────────────────────────────────
const CLOUD_NAME    = "dq8gha9lv";
const UPLOAD_PRESET = "pasarnusa";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

// ── Referensi elemen DOM ─────────────────────────────────────
const el = {
  // Informasi rekening
  namaBank:       document.getElementById("namaBank"),
  nomorRekening:  document.getElementById("nomorRekening"),
  atasNama:       document.getElementById("atasNama"),

  // Informasi pesanan
  nomorPesanan:   document.getElementById("nomorPesanan"),
  totalBayar:     document.getElementById("totalBayar"),
  statusPesanan:  document.getElementById("statusPesanan"),

  // Ringkasan sidebar
  summaryTotal:   document.getElementById("summaryTotal"),
  summaryStatus:  document.getElementById("summaryStatus"),

  // Upload & preview
  buktiTransfer:  document.getElementById("buktiTransfer"),
  previewBukti:   document.getElementById("previewBukti"),
  previewWrapper: document.getElementById("previewWrapper"),
  infoFile:       document.getElementById("infoFile"),

  // Progress bar
  progressFill:   document.getElementById("uploadProgress"),
  progressText:   document.getElementById("progressText"),

  // Tombol
  uploadBtn:      document.getElementById("uploadBtn"),
  copyRekening:   document.getElementById("copyRekening"),
};

// ── State modul ──────────────────────────────────────────────
let uid         = "";
let pesananId   = "";
let dataPesanan = {};
let dataUmkm    = {};

// ── Entry point ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await checkLogin();
  ambilIdPesanan();
  await loadPesanan();
  initPreview();
  initCopy();
  initUpload();
}

// ── 1. Autentikasi ───────────────────────────────────────────

/**
 * Pastikan pengguna sudah login.
 * Jika belum, redirect ke halaman login.
 */
async function checkLogin() {
  await auth.authStateReady();

  if (!auth.currentUser) {
    window.location.href = "login.html";
    return;
  }

  uid = auth.currentUser.uid;
}

// ── 2. Muat data pesanan & UMKM ──────────────────────────────

/**
 * Baca parameter ?id= dari URL.
 * Redirect ke daftar pesanan jika ID tidak ada.
 */
function ambilIdPesanan() {
  pesananId = new URLSearchParams(window.location.search).get("id");

  if (!pesananId) {
    window.location.href = "pesanan-saya.html";
  }
}

/**
 * Ambil dokumen pesanan dari Firestore.
 * Validasi kepemilikan sebelum menampilkan data.
 */
async function loadPesanan() {
  try {
    const snapshot = await getDoc(doc(db, "pesanan", pesananId));

    if (!snapshot.exists()) {
      showToast("Pesanan tidak ditemukan.");
      redirectDelayed("pesanan-saya.html");
      return;
    }

    dataPesanan = snapshot.data();

    // Cegah akses lintas pengguna
    if (dataPesanan.uidPembeli !== uid) {
      showToast("Akses ditolak.");
      redirectDelayed("pesanan-saya.html");
      return;
    }

    await loadDataUmkm();
    isiData();
  } catch (error) {
    console.error("loadPesanan:", error);
    showToast("Gagal memuat pesanan.");
  }
}

/**
 * Ambil data UMKM (rekening bank) berdasarkan UID dari pesanan.
 */
async function loadDataUmkm() {
  const snapshot = await getDoc(doc(db, "users", dataPesanan.uidUmkm));
  if (snapshot.exists()) dataUmkm = snapshot.data();
}

/**
 * Isi semua elemen DOM dengan data pesanan & rekening UMKM.
 */
function isiData() {
  const total = formatRupiah(dataPesanan.totalBayar);
  const status = dataPesanan.status || "Belum Bayar";

  el.namaBank.textContent      = dataUmkm.namaBank      || "-";
  el.nomorRekening.textContent = dataUmkm.nomorRekening || "-";
  el.atasNama.textContent      = dataUmkm.atasNama      || "-";

  // Tampilkan 8 karakter pertama ID pesanan sebagai nomor singkat
  el.nomorPesanan.textContent = pesananId.substring(0, 8).toUpperCase();

  el.totalBayar.textContent  = total;
  el.summaryTotal.textContent = total;

  el.statusPesanan.textContent  = status;
  el.summaryStatus.textContent  = status;
}

// ── 3. Preview file ──────────────────────────────────────────

/**
 * Tampilkan preview gambar saat file dipilih.
 * Tolak file yang melebihi batas ukuran 2 MB.
 */
function initPreview() {
  el.buktiTransfer.addEventListener("change", () => {
    const file = el.buktiTransfer.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast("Ukuran file maksimal 2 MB.");
      el.buktiTransfer.value = "";
      return;
    }

    // Bebaskan object URL lama jika ada untuk menghindari memory leak
    if (el.previewBukti.src.startsWith("blob:")) {
      URL.revokeObjectURL(el.previewBukti.src);
    }

    el.previewBukti.src         = URL.createObjectURL(file);
    el.previewWrapper.hidden    = false;
    el.infoFile.textContent     = file.name;
  });
}

// ── 4. Salin nomor rekening ──────────────────────────────────

/**
 * Salin nomor rekening ke clipboard dan tampilkan konfirmasi.
 */
function initCopy() {
  el.copyRekening.addEventListener("click", async () => {
    const nomor = dataUmkm.nomorRekening || "";
    if (!nomor) return;

    try {
      await navigator.clipboard.writeText(nomor);
      showToast("Nomor rekening berhasil disalin.");
    } catch {
      showToast("Gagal menyalin. Salin secara manual.");
    }
  });
}

// ── 5. Upload ke Cloudinary & simpan ke Firestore ────────────

/** Pasang listener tombol upload. */
function initUpload() {
  el.uploadBtn.addEventListener("click", uploadBukti);
}

/**
 * Orkestrasi proses upload:
 *  a. Upload gambar ke Cloudinary
 *  b. Simpan URL ke Firestore
 *  c. Kirim notifikasi ke pembeli & UMKM
 */
async function uploadBukti() {
  setUploadState(true);

  try {
    const url = await uploadKeCloudinary();
    if (!url) return; // showToast sudah ditangani di dalam fungsi

    await simpanBukti(url);
  } catch (error) {
    console.error("uploadBukti:", error);
    showToast(error.message || "Terjadi kesalahan, coba lagi.");
  } finally {
    setUploadState(false);
  }
}

/**
 * Upload file ke Cloudinary menggunakan unsigned upload preset.
 * Update progress bar secara manual (Cloudinary REST tidak kirim progress).
 * @returns {Promise<string|null>} URL gambar yang berhasil diupload, atau null.
 */
async function uploadKeCloudinary() {
  const file = el.buktiTransfer.files[0];

  if (!file) {
    showToast("Pilih bukti transfer terlebih dahulu.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  setProgress(15, "Mengupload gambar...");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  setProgress(80, "Memproses...");

  const hasil = await response.json();

  if (!hasil.secure_url) {
    throw new Error("Gagal mengunggah gambar ke server.");
  }

  setProgress(100, "Upload selesai.");
  return hasil.secure_url;
}

/**
 * Simpan URL bukti transfer ke dokumen pesanan di Firestore,
 * lalu kirim notifikasi dan redirect ke daftar pesanan.
 * @param {string} url - URL gambar dari Cloudinary.
 */
async function simpanBukti(url) {
  await updateDoc(doc(db, "pesanan", pesananId), {
    buktiTransfer:    url,
    status:           "Menunggu Verifikasi",
    statusPembayaran: "Menunggu Verifikasi",
    uploadAt:         serverTimestamp(),
  });

  await kirimNotifikasi();

  showToast("Bukti pembayaran berhasil dikirim.");
  redirectDelayed("pesanan-saya.html", 1200);
}

/**
 * Kirim notifikasi ke pembeli (konfirmasi) dan UMKM (tindakan verifikasi).
 */
async function kirimNotifikasi() {
  const notifCol = collection(db, "notifikasi");

  await Promise.all([
    addDoc(notifCol, {
      uid:       dataPesanan.uidPembeli,
      judul:     "Pembayaran Dikirim",
      pesan:     "Bukti pembayaran berhasil dikirim dan sedang diverifikasi.",
      dibaca:    false,
      createdAt: serverTimestamp(),
    }),
    addDoc(notifCol, {
      uid:       dataPesanan.uidUmkm,
      judul:     "Pembayaran Baru",
      pesan:     "Ada bukti pembayaran baru yang perlu diverifikasi.",
      dibaca:    false,
      createdAt: serverTimestamp(),
    }),
  ]);
}

// ── Helper ───────────────────────────────────────────────────

/**
 * Aktifkan atau nonaktifkan tombol upload beserta teksnya.
 * @param {boolean} loading - true saat proses sedang berjalan.
 */
function setUploadState(loading) {
  el.uploadBtn.disabled    = loading;
  el.uploadBtn.textContent = loading ? "Mengupload..." : "📤 Upload Bukti";
}

/**
 * Perbarui lebar progress bar dan teks keterangannya.
 * @param {number} persen  - 0–100
 * @param {string} teks    - Pesan status yang ditampilkan.
 */
function setProgress(persen, teks) {
  el.progressFill.style.width  = `${persen}%`;
  el.progressFill.setAttribute("aria-valuenow", persen);
  el.progressText.textContent  = teks;
}

/**
 * Format angka ke format Rupiah Indonesia.
 * @param {number} angka
 * @returns {string} Contoh: "Rp 150.000"
 */
function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

/**
 * Tampilkan pesan toast sementara di layar.
 * Toast muncul dari bawah, bertahan 3 detik, lalu menghilang.
 * @param {string} pesan
 */
function showToast(pesan) {
  const toast = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = pesan;
  toast.setAttribute("role", "alert"); // agar dibaca oleh screen reader
  document.body.appendChild(toast);

  // Frame berikutnya agar transisi CSS bisa berjalan
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

/**
 * Redirect ke URL tertentu setelah jeda waktu.
 * @param {string} url
 * @param {number} delay - Milidetik (default 1500ms).
 */
function redirectDelayed(url, delay = 1500) {
  setTimeout(() => { window.location.href = url; }, delay);
}
