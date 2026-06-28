// ======================================
// PASARNUSA PRODUK SAYA
// produk-saya.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

collection,

query,

where,

getDocs,

deleteDoc,

doc

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getAuth

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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

const auth=

getAuth(app);
// ======================================
// ELEMENT
// ======================================

const produkSaya=

document.getElementById("produkSaya");

const totalProduk=

document.getElementById("totalProduk");

const produkAktif=

document.getElementById("produkAktif");

const totalTerjual=

document.getElementById("totalTerjual");

const totalStok=

document.getElementById("totalStok");

const searchProduk=

document.getElementById("searchProduk");

const filterStatus=

document.getElementById("filterStatus");
// ======================================
// VARIABLE
// ======================================

let semuaProduk=[];

let uid="";
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

showLoading();

await loadProduk();

initSearch();

initFilter();

}
// ======================================
// LOGIN
// ======================================

async function checkLogin(){

await auth.authStateReady();

if(!auth.currentUser){

window.location.href=

"login.html";

return;

}

uid=

auth.currentUser.uid;

}
// ======================================
// LOADING
// ======================================

function showLoading(){

produkSaya.innerHTML="";

for(let i=0;i<4;i++){

produkSaya.innerHTML+=`

<div class="product-skeleton"></div>

`;

}

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

try{

const snapshot=

await getDocs(

query(

collection(db,"produk"),

where(

"uidUmkm",

"==",

uid

)

)

);

semuaProduk=[];

snapshot.forEach(doc=>{

semuaProduk.push({

id:doc.id,

...doc.data()

});

});

updateStatistik();

renderProduk(semuaProduk);

}catch(error){

console.error(error);

showError();

}

}
// ======================================
// STATISTIK
// ======================================

function updateStatistik(){

totalProduk.innerText=

semuaProduk.length;

produkAktif.innerText=

semuaProduk.filter(item=>

(item.status||"")

==="Aktif"

).length;

let stok=0;

let terjual=0;

semuaProduk.forEach(item=>{

stok+=

Number(item.stok||0);

terjual+=

Number(item.terjual||0);

});

totalStok.innerText=

stok;

totalTerjual.innerText=

terjual;

}
// ======================================
// RENDER
// ======================================

function renderProduk(data){

produkSaya.innerHTML="";

if(data.length===0){

produkSaya.innerHTML=

document

.getElementById(

"emptyProduk"

)

.innerHTML;

return;

}

data.forEach(item=>{

produkSaya.innerHTML+=

createCard(item);

});

}
// ======================================
// CARD
// ======================================

function createCard(item){

let badge="";

if(item.status==="Stok Habis"){

badge="habis";

}else if(item.status==="Stok Menipis"){

badge="menipis";

}else if(item.status==="Nonaktif"){

badge="nonaktif";

}

return`

<div class="product-card searchable">

<img

src="${item.gambar?.[0]||

'https://picsum.photos/400/300'}">

<div class="product-info">

<span class="category">

${item.kategori||"-"}

</span>

<h3>

${item.namaProduk}

</h3>

<p class="price">

${formatRupiah(item.harga)}

</p>

<p>

📍

${item.kabupaten||"-"},

${item.provinsi||"-"}

</p>

<p>

📦 Stok

${item.stok||0}

</p>

<p>

🔥 Terjual

${item.terjual||0}

</p>

<p>

<span class="status-produk ${badge}">

${item.status||"Aktif"}

</span>

</p>

<div class="action-buttons">

<a

href="produk-detail.html?id=${item.id}"

class="btn-secondary">

Lihat

</a>

<a

href="edit-produk.html?id=${item.id}"

class="btn-secondary">

Edit

</a>

<button

onclick="hapusProduk('${item.id}')"

class="delete-btn">

Hapus

</button>

</div>

</div>

</div>

`;

}
// ======================================
// SEARCH
// ======================================

function initSearch(){

searchProduk.addEventListener(

"input",

()=>{

filterProduk();

});

}
// ======================================
// FILTER
// ======================================

function initFilter(){

filterStatus.addEventListener(

"change",

()=>{

filterProduk();

});

}

function filterProduk(){

const keyword=

searchProduk.value

.toLowerCase()

.trim();

const status=

filterStatus.value;

const hasil=

semuaProduk.filter(item=>{

const cocokNama=

(item.namaProduk||"")

.toLowerCase()

.includes(keyword);

const cocokStatus=

status==="Semua"

||

(item.status||"Aktif")

===status;

return cocokNama && cocokStatus;

});

renderProduk(hasil);

}
// ======================================
// HAPUS
// ======================================

window.hapusProduk = async(id)=>{

const yakin = confirm(
"Hapus produk ini?"
);

if(!yakin) return;

try{

const cekPesanan =
await getDocs(

query(

collection(db,"pesanan"),

where(
"uidUmkm",
"==",
uid
)

)

);

let pernahDibeli = false;

cekPesanan.forEach(doc=>{

const pesanan = doc.data();

(pesanan.items || []).forEach(item=>{

if(item.id === id){

pernahDibeli = true;

}

});

});

if(pernahDibeli){

showToast(

"Produk sudah memiliki riwayat transaksi dan tidak dapat dihapus."

);

return;

}

await deleteDoc(

doc(db,"produk",id)

);

showToast(

"Produk berhasil dihapus."

);

await loadProduk();

}catch(error){

console.error(error);

showToast(

"Gagal menghapus produk."

);

}

};
// ======================================
// FORMAT
// ======================================

function formatRupiah(angka){

return "Rp "+

Number(

angka||0

)

.toLocaleString(

"id-ID"

);

}
// ======================================
// ERROR
// ======================================

function showError(){

produkSaya.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

⚠️

</div>

<h2>

Terjadi Kesalahan

</h2>

<p>

Gagal memuat data produk.

</p>

</div>

`;

}
// ======================================
// TOAST
// ======================================

function showToast(message){

const toast=

document.createElement("div");

toast.className="toast";

toast.innerText=message;

document.body.appendChild(toast);

setTimeout(()=>{

toast.classList.add("show");

},100);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>{

toast.remove();

},300);

},3000);

}