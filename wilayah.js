// ======================================
// PASARNUSA WILAYAH
// wilayah.js
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

const wilayahGrid=

document.getElementById(
"wilayahGrid"
);

const totalProvinsi=

document.getElementById(
"totalProvinsi"
);

const totalKabupaten=

document.getElementById(
"totalKabupaten"
);

const totalKecamatan=

document.getElementById(
"totalKecamatan"
);

const totalDesa=

document.getElementById(
"totalDesa"
);

const totalUmkm=

document.getElementById(
"totalUmkm"
);

const searchWilayah=

document.getElementById(
"searchWilayah"
);
// ======================================
// VARIABLE
// ======================================

let semuaProduk=[];

let semuaProvinsi=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

()=>{

showLoading();

loadWilayah();

initSearch();

});
// ======================================
// LOADING
// ======================================

function showLoading(){

wilayahGrid.innerHTML="";

for(let i=0;i<8;i++){

wilayahGrid.innerHTML+=`

<div class="wilayah-card skeleton-card">  <div class="wilayah-icon skeleton"></div>  <div class="skeleton skeleton-title"></div>  <div class="skeleton skeleton-text"></div>  </div>  `;

}

}
// ======================================
// LOAD DATA
// ======================================

async function loadWilayah(){

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

generateWilayah();

}catch(error){

console.error(error);

showError();

}

}
// ======================================
// GENERATE WILAYAH
// ======================================

function generateWilayah(){

const provinsi={};

const kabupaten=new Set();

const kecamatan=new Set();

const desa=new Set();

const umkm=new Set();

semuaProduk.forEach(item=>{

const prov=

item.provinsi||
"Indonesia";

if(!provinsi[prov]){

provinsi[prov]={

nama:prov,

jumlah:0

};

}

provinsi[prov].jumlah++;

if(item.kabupaten){

kabupaten.add(item.kabupaten);

}

if(item.kecamatan){

kecamatan.add(item.kecamatan);

}

if(item.desa){

desa.add(item.desa);

}

if(item.uid){

umkm.add(item.uid);

}

});

semuaProvinsi=

Object.values(provinsi);

updateStatistik(

kabupaten.size,

kecamatan.size,

desa.size,

umkm.size

);

renderWilayah(semuaProvinsi);
updatePopularWilayah();
}
// ======================================
// STATISTIK
// ======================================

function updateStatistik(

totalKab,

totalKec,

totalDes,

totalUser

){

totalProvinsi.innerText=

semuaProvinsi.length;

document

.getElementById(

"totalProvinsiCard"

).innerText=

semuaProvinsi.length;

totalKabupaten.innerText=

totalKab;

document

.getElementById(

"totalKabupatenCard"

).innerText=

totalKab;

totalKecamatan.innerText=

totalKec;

totalDesa.innerText=

totalDes;

totalUmkm.innerText=

totalUser;

}
// ======================================
// RENDER WILAYAH
// ======================================

function renderWilayah(data){

wilayahGrid.innerHTML="";

if(data.length===0){

showEmpty();

return;

}

data.forEach(item=>{

wilayahGrid.innerHTML+=

createWilayahCard(item);

});
document
.querySelectorAll(".wilayah-card")
.forEach(card=>{

card.onclick=()=>{

window.location.href=

produk.html?provinsi=${encodeURIComponent(card.dataset.provinsi)};

};

});
}
// ======================================
// CARD
// ======================================

function createWilayahCard(item){

return`

<div  class="wilayah-card"

data-provinsi="${item.nama}">

<div class="wilayah-icon">  🗺️

</div>  <h3>  ${item.nama}

</h3>  <p>  Lihat seluruh UMKM
di wilayah ini.

</p>  <div class="wilayah-count">  ${item.jumlah} Produk

</div>  </div>  `;

}
// ======================================
// SEARCH
// ======================================

function initSearch(){

if(!searchWilayah)return;

searchWilayah.addEventListener(

"input",

()=>{

const keyword=

searchWilayah.value

.trim()

.toLowerCase();

const hasil=

semuaProvinsi.filter(item=>{

return item.nama

.toLowerCase()

.includes(keyword);

});

renderWilayah(hasil);

}

);

}
// ======================================
// EMPTY
// ======================================

function showEmpty(){

wilayahGrid.innerHTML=`

<div class="empty-state">  <div class="empty-icon">  🗺️

</div>  <h2>  Wilayah Tidak Ditemukan

</h2>  <p>  Belum ada wilayah yang sesuai dengan pencarian.

</p>  </div>  `;

}
// ======================================
// ERROR
// ======================================

function showError(){

wilayahGrid.innerHTML=`

<div class="empty-state">  <div class="empty-icon">  ⚠️

</div>  <h2>  Terjadi Kesalahan

</h2>  <p>  Gagal mengambil data wilayah.

</p>  </div>  `;

}
// ======================================
// SORT
// ======================================

function sortWilayah(mode="terbanyak"){

let data=[...semuaProvinsi];

switch(mode){

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

renderWilayah(data);

}
// ======================================
// POPULAR WILAYAH
// ======================================

function updatePopularWilayah(){

const card=

document.querySelectorAll(

".popular-wilayah-card"

);

if(card.length===0)return;

const data=

[...semuaProvinsi]

.sort(

(a,b)=>b.jumlah-a.jumlah

)

.slice(0,4);

card.forEach((item,index)=>{

if(!data[index])return;

item.querySelector("h3").innerText=

data[index].nama;

item.querySelector("p").innerText=

${data[index].jumlah} Produk;

});

}
