// ======================================
// PASARNUSA PRODUK
// produk.js
// ======================================

// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// FIREBASE
// ======================================

const firebaseConfig = {

apiKey:"AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
authDomain:"pasarnusa-18aa0.firebaseapp.com",
projectId:"pasarnusa-18aa0",
storageBucket:"pasarnusa-18aa0.firebasestorage.app",
messagingSenderId:"866998011671",
appId:"1:866998011671:web:5555115feb82741ab55952"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ======================================
// ELEMENT
// ======================================

const productGrid =
document.getElementById("productGrid");

const totalProduk =
document.getElementById("totalProduk");

const totalKategori =
document.getElementById("totalKategori");

const totalUmkm =
document.getElementById("totalUmkm");

let semuaProduk = [];
// ======================================
// START
// ======================================

document.addEventListener("DOMContentLoaded",()=>{

showLoading();

initSearch();

initKategori();

initSort();

loadProduk();

});

// ======================================
// LOADING
// ======================================

function showLoading(){

productGrid.innerHTML="";

for(let i=0;i<8;i++){

productGrid.innerHTML+=`

<div class="product-skeleton">

<div class="skeleton-image"></div>

<div class="skeleton-title"></div>

<div class="skeleton-price"></div>

</div>

`;

}

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

try{

const snapshot =
await getDocs(
collection(db,"produk")
);

semuaProduk = [];

snapshot.forEach((doc)=>{

const data = doc.data();

if(data.status !== "Aktif") return;

if(Number(data.stok || 0) <= 0) return;

semuaProduk.push({

id:doc.id,

...data

});

});

updateStatistik();

renderProduk(semuaProduk);

}catch(error){

console.error(error);

showError(error.message);

}

}
// ======================================
// UPDATE STATISTIK
// ======================================

function updateStatistik(){

if(totalProduk){

totalProduk.innerText =
semuaProduk.length;

}

if(totalKategori){

const kategori = new Set();

semuaProduk.forEach(item=>{

if(item.kategori){

kategori.add(item.kategori);

}

});

totalKategori.innerText =
kategori.size;

}

if(totalUmkm){

const umkm = new Set();

semuaProduk.forEach(item=>{

if(item.uid){

umkm.add(item.uid);

}

});

totalUmkm.innerText =
umkm.size;

}

}
// ======================================
// RENDER PRODUK
// ======================================

function renderProduk(data){

productGrid.innerHTML="";

if(data.length===0){

showEmpty();

return;

}

const pageData =
paginate(data);

pageData.forEach(produk=>{

productGrid.innerHTML +=

createCard(produk);

});

renderPagination(data);
initLazyImage();
}
function renderPagination(data){

const totalPage =

Math.ceil(
data.length/ITEM_PER_PAGE
);

const pagination =
document.querySelector(".pagination");

if(!pagination) return;

pagination.innerHTML="";

for(let i=1;i<=totalPage;i++){

pagination.innerHTML += `

<button
class="page-btn ${i===currentPage?'active':''}"
data-page="${i}">

${i}

</button>

`;

}

document
.querySelectorAll(".page-btn")
.forEach(btn=>{

btn.onclick=()=>{

currentPage=

Number(btn.dataset.page);

renderProduk(data);

};

});

}
function debounce(fn,delay){

let timer;

return(...args)=>{

clearTimeout(timer);

timer=setTimeout(()=>{

fn(...args);

},delay);

};

}

// ======================================
// ERROR
// ======================================

function showError(message){

productGrid.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

❌

</div>

<h2>

Terjadi Kesalahan

</h2>

<p>

${message}

</p>

</div>

`;

}
// ======================================
// EMPTY
// ======================================

function showEmpty(){

productGrid.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

📦

</div>

<h2>

Belum Ada Produk

</h2>

<p>

Produk UMKM akan muncul di sini setelah dipublikasikan.

</p>

</div>

`;

}
// ======================================
// CREATE CARD
// ======================================

function createCard(produk){

const gambar =
produk.gambar?.[0] ||
"assets/no-image.png";

const nama =
produk.namaProduk ||
"Produk Tanpa Nama";

const kategori =
produk.kategori ||
"UMKM";

const harga =
Number(produk.harga || 0)
.toLocaleString("id-ID");

const rating =
Number(produk.rating || 0)
.toFixed(1);

const stok =
Number(produk.stok || 0);

const terjual =
Number(produk.terjual || 0);

const toko =
produk.namaToko ||
produk.namaUmkm ||
"UMKM Indonesia";

const lokasi =
produk.kabupaten ||
produk.kecamatan ||
produk.provinsi ||
"Indonesia";

let badge="";

if(Number(produk.diskon||0)>0)

badge="🏷️ Diskon";

}

else if(terjual>=100){

badge="🔥 Terlaris";

}

else if(stok<=5){

badge="⚠️ Stok Tipis";

}

else{

badge="✨ Baru";

}

return `

<div
class="product-card searchable"
data-category="${kategori.toLowerCase()}">

<div class="product-image">

<img
src="${gambar}"
alt="${nama}"
loading="lazy">

<div class="product-badge">

${badge}

</div>

</div>

<div class="product-content">

<div class="product-category">

${kategori}

</div>

<h3 class="product-title">

${nama}

</h3>

<div class="product-price">

${formatHarga(produk.harga)}

</div>

<div class="product-meta">

<span>⭐ ${rating}/5</span>

<span>🔥 ${terjual}</span>

</div>

<p class="product-location">

📍 ${lokasi}

</p>
<p class="product-stock">

📦 Stok :
${stok}

</p>

<p class="product-store">

🏪 ${toko}

</p>

<div class="product-action">

<a
href="produk-detail.html?id=${produk.id}"
class="btn btn-primary">

Detail

</a>

<a
href="profil-umkm.html?uid=${produk.uid}"
class="btn btn-secondary">

UMKM

</a>

</div>

</div>

</div>

`;

}
// ======================================
// SEARCH
// ======================================

function initSearch(){

const searchInput =
document.getElementById("searchInput");

if(!searchInput) return;

searchInput.addEventListener(

"input",

debounce((e)=>{

const keyword =
e.target.value
.trim()
.toLowerCase();

const hasil =
semuaProduk.filter(produk=>{

const nama =
(produk.namaProduk || "")
.toLowerCase();

const kategori =
(produk.kategori || "")
.toLowerCase();

const toko =
(produk.namaToko ||
produk.namaUmkm ||
"")
.toLowerCase();

const lokasi =
(produk.provinsi ||
produk.kabupaten ||
produk.kecamatan ||
"")
.toLowerCase();

return(

nama.includes(keyword) ||

kategori.includes(keyword) ||

toko.includes(keyword) ||

lokasi.includes(keyword)

);

});

renderProduk(hasil);

});

}
// ======================================
// FILTER KATEGORI
// ======================================

function initKategori(){

const tombol =

document.querySelectorAll(".filter-btn");

tombol.forEach(btn=>{

btn.addEventListener("click",()=>{

tombol.forEach(item=>{

item.classList.remove("active");

});

btn.classList.add("active");

const kategori =
btn.dataset.category;

if(kategori==="all"){

renderProduk(semuaProduk);

return;

}

const hasil =

semuaProduk.filter(produk=>{

return(

produk.kategori &&
produk.kategori.toLowerCase()===kategori

);

});

renderProduk(hasil);

});

});

}
// ======================================
// SORT PRODUK
// ======================================

function initSort(){

const sort =
document.getElementById("sortSelect");

if(!sort) return;

sort.addEventListener("change",()=>{

let data=[...semuaProduk];

switch(sort.value){

case "termurah":

data.sort((a,b)=>

Number(a.harga||0)-Number(b.harga||0)

);

break;

case "termahal":

data.sort((a,b)=>

Number(b.harga||0)-Number(a.harga||0)

);

break;

case "rating":

data.sort((a,b)=>

Number(b.rating||0)-Number(a.rating||0)

);

break;

case "terlaris":

data.sort((a,b)=>

Number(b.terjual||0)-Number(a.terjual||0)

);

break;

default:

data.reverse();

}

renderProduk(data);

});

}
// ======================================
// FORMAT HARGA
// ======================================

function formatHarga(harga){

return "Rp " +

Number(harga||0)

.toLocaleString("id-ID");

}
// ======================================
// PAGINATION
// ======================================

const ITEM_PER_PAGE = 12;

let currentPage = 1;

function paginate(data){

const start =
(currentPage-1)*ITEM_PER_PAGE;

const end =
start+ITEM_PER_PAGE;

return data.slice(start,end);

}
// ======================================
// LAZY IMAGE
// ======================================

function initLazyImage(){

const images=

document.querySelectorAll(

"img[loading='lazy']"

);

const observer=

new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

observer.unobserve(entry.target);

}

});

});

images.forEach(img=>{

observer.observe(img);

});

}