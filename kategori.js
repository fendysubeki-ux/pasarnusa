// ======================================
// PASARNUSA KATEGORI
// kategori.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

collection,

getDocs

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// FIREBASE
// ======================================

const firebaseConfig={

apiKey:"AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",

authDomain:"pasarnusa-18aa0.firebaseapp.com",

projectId:"pasarnusa-18aa0",

storageBucket:"pasarnusa-18aa0.firebasestorage.app",

messagingSenderId:"866998011671",

appId:"1:866998011671:web:5555115feb82741ab55952"

};

const app=

initializeApp(firebaseConfig);

const db=

getFirestore(app);
// ======================================
// ELEMENT
// ======================================

const kategoriGrid=

document.getElementById(
"kategoriGrid"
);

const totalKategori=

document.getElementById(
"totalKategori"
);

const totalProduk=

document.getElementById(
"totalProduk"
);

const totalUmkm=

document.getElementById(
"totalUmkm"
);

const searchInput=

document.getElementById(
"kategoriSearch"
);

const sortSelect=

document.getElementById(
"sortKategori"
);
// ======================================
// VARIABLE
// ======================================

let semuaKategori=[];

let semuaProduk=[];
// ======================================
// START
// ======================================

document.addEventListener(
"DOMContentLoaded",
()=>{

showLoading();

loadKategori();

initSearch();

initSort();

});
// ======================================
// LOADING
// ======================================

function showLoading(){

kategoriGrid.innerHTML="";

for(let i=0;i<8;i++){

kategoriGrid.innerHTML+=`

<div class="category-card skeleton-card">

<div class="category-icon skeleton"></div>

<div class="skeleton skeleton-title"></div>

<div class="skeleton skeleton-text"></div>

</div>

`;

}

}
// ======================================
// LOAD DATA
// ======================================

async function loadKategori(){

try{

const snapshot=

await getDocs(

collection(db,"produk")

);

semuaProduk=[];

snapshot.forEach(doc=>{

const data=doc.data();

if(data.status!=="Aktif") return;

if(Number(data.stok||0)<=0) return;

semuaProduk.push(data);

});

generateKategori();

}catch(error){

console.error(error);

showError();

}

}
// ======================================
// GENERATE KATEGORI
// ======================================

function generateKategori(){

const kategoriMap={};

const umkm=new Set();

semuaProduk.forEach(produk=>{

const kategori=

produk.kategori||

"Lainnya";

if(!kategoriMap[kategori]){

kategoriMap[kategori]={

nama:kategori,

jumlah:0

};

}

kategoriMap[kategori].jumlah++;

if(produk.uid){

umkm.add(produk.uid);

}

});

semuaKategori=

Object.values(kategoriMap);

updateStatistik(umkm.size);

renderKategori(semuaKategori);

}
// ======================================
// STATISTIK
// ======================================

function updateStatistik(totalUmkmValue){

if(totalKategori){

totalKategori.innerText=

semuaKategori.length;

}

if(totalProduk){

totalProduk.innerText=

semuaProduk.length;

}

if(totalUmkm){

totalUmkm.innerText=

totalUmkmValue;

}

}
// ======================================
// RENDER KATEGORI
// ======================================

function renderKategori(data){

kategoriGrid.innerHTML="";

if(data.length===0){

showEmpty();

return;

}

data.forEach(item=>{

kategoriGrid.innerHTML+=

createKategoriCard(item);

});

}
// ======================================
// CARD
// ======================================

function createKategoriCard(item){

const icon=

getKategoriIcon(item.nama);

return `

<div

class="category-card"

data-kategori="${item.nama}">

<div class="category-icon">

${icon}

</div>

<h3>

${item.nama}

</h3>

<p>

Temukan berbagai produk
kategori ${item.nama}.

</p>

<div class="category-count">

${item.jumlah} Produk

</div>

</div>

`;

}
// ======================================
// SEARCH
// ======================================

function initSearch(){

if(!searchInput)return;

searchInput.addEventListener(

"input",

()=>{

const keyword=

searchInput.value

.trim()

.toLowerCase();

const hasil=

semuaKategori.filter(item=>{

return item.nama

.toLowerCase()

.includes(keyword);

});

renderKategori(hasil);

}

);

}
// ======================================
// SORT
// ======================================

function initSort(){

if(!sortSelect)return;

sortSelect.addEventListener(

"change",

()=>{

let data=[...semuaKategori];

switch(sortSelect.value){

case "az":

data.sort(

(a,b)=>

a.nama.localeCompare(b.nama)

);

break;

case "za":

data.sort(

(a,b)=>

b.nama.localeCompare(a.nama)

);

break;

default:

data.sort(

(a,b)=>

b.jumlah-a.jumlah

);

}

renderKategori(data);

}

);

}
// ======================================
// ICON
// ======================================

function getKategoriIcon(kategori){

const nama=

kategori.toLowerCase();

switch(nama){

case "makanan":

return "🍜";

case "minuman":

return "🥤";

case "fashion":

return "👕";

case "kerajinan":

return "🧺";

case "pertanian":

return "🌾";

case "peternakan":

return "🐄";

case "perikanan":

return "🐟";

case "kecantikan":

return "💄";

case "rumah tangga":

return "🏠";

case "souvenir":

return "🎁";

default:

return "📦";

}

}
// ======================================
// EMPTY
// ======================================

function showEmpty(){

kategoriGrid.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

📂

</div>

<h2>

Kategori Tidak Ditemukan

</h2>

<p>

Belum ada kategori yang sesuai.

</p>

</div>

`;

}
// ======================================
// ERROR
// ======================================

function showError(){

kategoriGrid.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

⚠️

</div>

<h2>

Terjadi Kesalahan

</h2>

<p>

Gagal mengambil data kategori.

</p>

</div>

`;

}
function createKategoriCard(item){

const icon=

getKategoriIcon(item.nama);

return `

<div

class="category-card"

onclick="location.href='produk.html?kategori=${encodeURIComponent(item.nama)}'">

<div class="category-icon">

${icon}

</div>

<h3>

${item.nama}

</h3>

<p>

Temukan berbagai produk kategori ${item.nama}.

</p>

<div class="category-count">

${item.jumlah} Produk

</div>

</div>

`;

}
