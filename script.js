// =========================
// MENU MOBILE
// =========================

const menuToggle =
document.querySelector(".menu-toggle");

const navLinks =
document.querySelector(".nav-links");

if(menuToggle && navLinks){

menuToggle.addEventListener(
"click",
()=>{

navLinks.classList.toggle(
"active"
);

});

}

// =========================
// MODAL LOGIN
// =========================

const loginBtn =
document.getElementById(
"openLogin"
);

const modal =
document.getElementById(
"loginModal"
);

const closeBtn =
document.querySelector(
".close"
);

if(loginBtn && modal){

loginBtn.addEventListener(
"click",
()=>{

modal.style.display =
"flex";

});

}

if(closeBtn && modal){

closeBtn.addEventListener(
"click",
()=>{

modal.style.display =
"none";

});

}

window.addEventListener(
"click",
(e)=>{

if(
e.target === modal
){

modal.style.display =
"none";

}

}
);

// =========================
// SEARCH PRODUK
// =========================

const searchInput =
document.getElementById(
"searchInput"
);

if(searchInput){

searchInput.addEventListener(
"input",
()=>{

const keyword =
searchInput.value
.toLowerCase();

document
.querySelectorAll(
".searchable"
)
.forEach((card)=>{

const nama =
card.innerText
.toLowerCase();

card.style.display =
nama.includes(keyword)
? "block"
: "none";

});

});

}

// =========================
// FILTER PRODUK
// =========================

function filterProduk(
kategori
){

document
.querySelectorAll(
".searchable"
)
.forEach((card)=>{

if(
kategori === "all"
){

card.style.display =
"block";

return;

}

card.style.display =
card.dataset.category === kategori
? "block"
: "none";

});

}

window.filterProduk =
filterProduk;

// =========================
// KALKULATOR KOMISI
// =========================

function calculateCommission(){

const sales =
document.getElementById(
"sales"
);

const result =
document.getElementById(
"result"
);

if(
!sales ||
!result
){
return;
}

const commission =
Number(
sales.value || 0
) * 0.05;

result.innerHTML =
"Komisi: Rp " +
commission.toLocaleString(
"id-ID"
);

}

window.calculateCommission =
calculateCommission;

// =========================
// COPY LINK AFFILIATE
// =========================

async function copyAffiliate(){

const link =
document.getElementById(
"affiliateLink"
);

if(!link) return;

try{

await navigator.clipboard
.writeText(
link.value
);

alert(
"Link affiliate berhasil disalin"
);

}catch{

alert(
"Gagal menyalin link"
);

}

}

window.copyAffiliate =
copyAffiliate;

// =========================
// PREVIEW GAMBAR PRODUK
// =========================

const imageInput =
document.getElementById(
"productImage"
);

const previewContainer =
document.getElementById(
"previewContainer"
);

if(
imageInput &&
previewContainer
){

imageInput.addEventListener(
"change",
(e)=>{

previewContainer.innerHTML =
"";

Array.from(
e.target.files
).forEach((file)=>{

const img =
document.createElement(
"img"
);

img.src =
URL.createObjectURL(
file
);

img.style.width =
"100px";

img.style.height =
"100px";

img.style.objectFit =
"cover";

img.style.borderRadius =
"12px";

img.style.margin =
"5px";

previewContainer
.appendChild(img);

});

});

}

// =========================
// UPDATE JUMLAH KERANJANG
// =========================

const cart =
JSON.parse(
localStorage.getItem(
"cart"
)
) || [];

const cartCount =
document.getElementById(
"cartCount"
);

if(cartCount){

let totalQty = 0;

cart.forEach((item)=>{

totalQty +=
Number(
item.qty || 1
);

});

cartCount.innerText =
totalQty;

}