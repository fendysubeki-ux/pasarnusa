/* =====================================================
 * PASARNUSA APP v1
 * Deskripsi : Core JavaScript untuk seluruh halaman
 * Struktur  : Module pattern — setiap fitur dalam
 *             objek/fungsi tersendiri agar mudah
 *             di-maintain dan di-debug.
 * ===================================================== */

"use strict";

/* ─────────────────────────────────────────────────────
 * UTILITAS UMUM
 * ───────────────────────────────────────────────────── */

/**
 * Tunda eksekusi fungsi hingga jeda tertentu usai.
 * @param {Function} fn    - Fungsi yang akan dipanggil
 * @param {number}   delay - Jeda dalam milidetik
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Kembalikan Promise yang selesai setelah `ms` milidetik.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Buat ID acak 8-karakter (alfanumerik).
 * @returns {string}
 */
function uid() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Format angka ke format mata uang Rupiah.
 * @param   {number} nilai
 * @returns {string} contoh: "Rp 10.000"
 */
function rupiah(nilai) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

/**
 * Format tanggal ke format lokal Indonesia.
 * @param   {string|Date} date
 * @returns {string} contoh: "1 Januari 2025"
 */
function tanggal(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─────────────────────────────────────────────────────
 * STORAGE — Wrapper localStorage dengan JSON otomatis
 * ───────────────────────────────────────────────────── */

const Storage = {
  /**
   * Simpan nilai ke localStorage sebagai JSON.
   * @param {string} key
   * @param {*}      value
   */
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Ambil nilai dari localStorage; kembalikan `[]` jika kosong.
   * @param   {string} key
   * @returns {*}
   */
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? [];
    } catch {
      return [];
    }
  },

  /** Hapus item dari localStorage. */
  remove(key) {
    localStorage.removeItem(key);
  },
};

/* ─────────────────────────────────────────────────────
 * CART — Manajemen keranjang belanja
 * ───────────────────────────────────────────────────── */

const Cart = {
  key: "cart",

  /** Ambil semua item di keranjang. */
  all() {
    return Storage.get(this.key);
  },

  /** Simpan array item ke storage. */
  save(data) {
    Storage.set(this.key, data);
  },

  /**
   * Tambah produk ke keranjang.
   * @param {Object} product - Data produk
   */
  add(product) {
    const cart = this.all();
    cart.push(product);
    this.save(cart);
    showToast("Produk masuk keranjang");
  },

  /** Jumlah item di keranjang. */
  count() {
    return this.all().length;
  },
};

/* ─────────────────────────────────────────────────────
 * WISHLIST — Toggle produk favorit
 * ───────────────────────────────────────────────────── */

const Wishlist = {
  key: "wishlist",

  /**
   * Tambah jika belum ada, hapus jika sudah ada.
   * @param {string|number} id - ID produk
   */
  toggle(id) {
    let list = Storage.get(this.key);
    list = list.includes(id)
      ? list.filter((x) => x !== id)
      : [...list, id];
    Storage.set(this.key, list);
  },
};

/* ─────────────────────────────────────────────────────
 * API — Fetch helper dengan error handling
 * ───────────────────────────────────────────────────── */

/**
 * Ambil data dari URL; tampilkan toast jika gagal.
 * @param   {string}  url
 * @param   {Object}  [options] - fetch options (opsional)
 * @returns {Promise<*|null>}
 */
async function api(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("[PasarNusa API]", e);
    showToast("Gagal mengambil data", "error");
    return null;
  }
}

/* ─────────────────────────────────────────────────────
 * TOAST — Notifikasi pop-up sementara
 * ───────────────────────────────────────────────────── */

/**
 * Tampilkan notifikasi toast selama 3 detik.
 * @param {string} message         - Pesan yang ditampilkan
 * @param {"success"|"error"|"warning"} [type="success"]
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Delay kecil agar transisi CSS berjalan
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

/* ─────────────────────────────────────────────────────
 * NAVBAR — Tambah class "scrolled" saat halaman di-scroll
 * ───────────────────────────────────────────────────── */

function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const onScroll = debounce(
    () => navbar.classList.toggle("scrolled", window.scrollY > 30),
    50
  );
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ─────────────────────────────────────────────────────
 * REVEAL — Animasi elemen saat masuk viewport
 * ───────────────────────────────────────────────────── */

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target); // cukup sekali
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

/* ─────────────────────────────────────────────────────
 * RIPPLE — Efek gelombang pada tombol saat diklik
 * ───────────────────────────────────────────────────── */

function initRipple() {
  // Gunakan event delegation agar tombol yang ditambah
  // secara dinamis juga mendapat efek ripple.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;

    const size = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();

    const circle = document.createElement("span");
    circle.className = "ripple";
    circle.style.cssText = `
      width:  ${size}px;
      height: ${size}px;
      left:   ${e.clientX - rect.left - size / 2}px;
      top:    ${e.clientY - rect.top  - size / 2}px;
    `;

    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove(), { once: true });
  });
}

/* ─────────────────────────────────────────────────────
 * LOADER — Sembunyikan loading screen setelah halaman siap
 * ───────────────────────────────────────────────────── */

function initLoader() {
  const loader = document.querySelector(".loading-screen");
  if (!loader) return;

  const hide = () => {
    loader.style.opacity = "0";
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  };

  // Jika halaman sudah selesai load, langsung sembunyikan
  if (document.readyState === "complete") {
    hide();
  } else {
    window.addEventListener("load", hide, { once: true });
  }
}

/* ─────────────────────────────────────────────────────
 * BACK TO TOP — Tombol gulir ke atas
 * ───────────────────────────────────────────────────── */

function initBackTop() {
  const btn = document.querySelector(".back-top");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    debounce(() => btn.classList.toggle("show", window.scrollY > 500), 100),
    { passive: true }
  );

  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ─────────────────────────────────────────────────────
 * SEARCH — Arahkan ke halaman produk saat tekan Enter
 * ───────────────────────────────────────────────────── */

function initSearch() {
  const input = document.getElementById("searchHome");
  if (!input) return;

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      window.location.href = `produk.html?search=${encodeURIComponent(input.value.trim())}`;
    }
  });
}

/* ─────────────────────────────────────────────────────
 * MOBILE MENU — Toggle navigasi di layar kecil
 * ───────────────────────────────────────────────────── */

function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu   = document.querySelector(".navbar-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => menu.classList.toggle("active"));

  // Tutup menu saat klik di luar
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove("active");
    }
  });
}

/* ─────────────────────────────────────────────────────
 * DARK MODE — Toggle tema terang/gelap
 * ───────────────────────────────────────────────────── */

function initDarkMode() {
  const btn = document.querySelector(".dark-toggle");
  if (!btn) return;

  // Terapkan tema tersimpan saat halaman dimuat
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  btn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

/* ─────────────────────────────────────────────────────
 * COUNTER — Animasi angka naik dari 0 ke target
 * ───────────────────────────────────────────────────── */

function initCounter() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  counters.forEach((counter) => {
    const target = Number(counter.dataset.counter);
    if (!target) return;

    let current = 0;
    const step  = Math.max(1, Math.ceil(target / 80));

    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      counter.textContent = current.toLocaleString("id-ID");
      if (current >= target) clearInterval(timer);
    }, 20);
  });
}

/* ─────────────────────────────────────────────────────
 * MODAL — Buka/tutup dialog overlay
 * ───────────────────────────────────────────────────── */

function initModal() {
  // Buka modal sesuai atribut data-modal
  document.querySelectorAll("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.modal);
      if (modal) modal.style.display = "flex";
    });
  });

  // Tutup modal saat klik overlay atau tombol close
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("close")) {
        modal.style.display = "none";
      }
    });
  });
}

/* ─────────────────────────────────────────────────────
 * WISHLIST BUTTON — Toggle ikon hati pada kartu produk
 * ───────────────────────────────────────────────────── */

function initWishlistButtons() {
  // Gunakan event delegation untuk mendukung produk dinamis
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".favorite");
    if (!btn) return;

    btn.classList.toggle("active");

    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-regular");
      icon.classList.toggle("fa-solid");
    }

    // Animasi detak jantung
    btn.classList.add("heart");
    btn.addEventListener("animationend", () => btn.classList.remove("heart"), { once: true });

    showToast("Produk ditambahkan ke wishlist");
  });
}

/* ─────────────────────────────────────────────────────
 * COPY AFFILIATE — Salin link afiliasi ke clipboard
 * ───────────────────────────────────────────────────── */

function initCopyAffiliate() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-link");
    if (!btn) return;

    const input = btn.parentElement.querySelector("input");
    if (!input) return;

    navigator.clipboard
      .writeText(input.value)
      .then(() => showToast("Link berhasil disalin"))
      .catch(() => showToast("Gagal menyalin link", "error"));
  });
}

/* ─────────────────────────────────────────────────────
 * SHARE — Bagikan halaman via Web Share API
 * ───────────────────────────────────────────────────── */

function initShare() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".share-btn");
    if (!btn) return;

    if (navigator.share) {
      navigator.share({
        title: document.title,
        text:  "Lihat produk ini",
        url:   window.location.href,
      }).catch(() => {}); // abaikan jika user membatalkan
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast("Link disalin"))
        .catch(() => showToast("Gagal menyalin link", "error"));
    }
  });
}

/* ─────────────────────────────────────────────────────
 * RATING — Sistem bintang interaktif
 * ───────────────────────────────────────────────────── */

function initRating() {
  // Delegation: tangani klik pada bintang di mana pun
  document.addEventListener("click", (e) => {
    const star = e.target.closest(".rating i");
    if (!star) return;

    const parent = star.closest(".rating");
    const stars  = [...parent.querySelectorAll("i")];
    const index  = stars.indexOf(star);

    parent.dataset.rating = index + 1;
    stars.forEach((s, i) => s.classList.toggle("active", i <= index));
  });
}

/* ─────────────────────────────────────────────────────
 * LAZY IMAGE — Muat gambar hanya saat masuk viewport
 * ───────────────────────────────────────────────────── */

function initLazyImage() {
  const images = document.querySelectorAll("img[data-src]");
  if (!images.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      observer.unobserve(img);
    });
  });

  images.forEach((img) => observer.observe(img));
}

/* ─────────────────────────────────────────────────────
 * INFINITE SCROLL — Muat produk berikutnya otomatis
 * ───────────────────────────────────────────────────── */

function initInfiniteScroll() {
  const trigger = document.querySelector("#loadMore");
  if (!trigger) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) loadMoreProduct();
    });
  });

  observer.observe(trigger);
}

/**
 * Muat batch produk berikutnya dari server/data lokal.
 * TODO: Implementasikan pemanggilan API nyata di sini.
 */
function loadMoreProduct() {
  console.log("[PasarNusa] Memuat produk berikutnya…");
}

/* ─────────────────────────────────────────────────────
 * CONNECTION STATUS — Notifikasi status koneksi internet
 * ───────────────────────────────────────────────────── */

function initConnectionStatus() {
  window.addEventListener("offline", () =>
    showToast("Koneksi internet terputus", "warning")
  );
  window.addEventListener("online", () =>
    showToast("Koneksi kembali normal", "success")
  );
}

/* ─────────────────────────────────────────────────────
 * GLOBAL ERROR HANDLER
 * ───────────────────────────────────────────────────── */

window.addEventListener("error", ({ message, filename, lineno }) => {
  console.error(`[PasarNusa Error] ${message} — ${filename}:${lineno}`);
});

/* ─────────────────────────────────────────────────────
 * INIT — Jalankan semua modul saat DOM siap
 * ───────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  // Core UI
  initNavbar();
  initReveal();
  initRipple();
  initLoader();
  initBackTop();
  initSearch();

  // Interaksi UI
  initMobileMenu();
  initDarkMode();
  initCounter();
  initModal();

  // Fitur marketplace
  initWishlistButtons();
  initCopyAffiliate();
  initShare();
  initRating();

  // Performa & koneksi
  initLazyImage();
  initInfiniteScroll();
  initConnectionStatus();
});
