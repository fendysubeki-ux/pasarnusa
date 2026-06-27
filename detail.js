// ======================================
// PASARNUSA DETAIL PRODUK
// detail.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

collection,

getDocs,

query,

where,

limit

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getAuth,

onAuthStateChanged

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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

const app=

initializeApp(firebaseConfig);

const db=

getFirestore(app);

const auth=

getAuth(app);
// ======================================
// ELEMENT
// ======================================

const gambarProduk=
document.getElementById("gambarProduk");

const galleryProduk=
document.getElementById("galleryProduk");

const namaProduk=
document.getElementById("namaProduk");

const breadcrumbNama=
document.getElementById("breadcrumbNama");

const kategoriProduk=
document.getElementById("kategoriProduk");

const hargaProduk=
document.getElementById("hargaProduk");

const buyHarga=
document.getElementById("buyHarga");

const ratingProduk=
document.getElementById("ratingProduk");

const stokProduk=
document.getElementById("stokProduk");

const lokasiProduk=
document.getElementById("lokasiProduk");

const namaToko=
document.getElementById("namaToko");

const deskripsiProduk=
document.getElementById("deskripsiProduk");

const produkTerkait=
document.getElementById("produkTerkait");
// ======================================
// VARIABLE
// ======================================

let produkData=null;

let currentUser=null;

const params=

new URLSearchParams(
window.location.search
);

const produkId=

params.get("id");
// ======================================
// START
// ======================================

document.addEventListener(
"DOMContentLoaded",
()=>{

if(!produkId){

showError(
"Produk tidak ditemukan."
);

return;

}

onAuthStateChanged(

auth,

(user)=>{

currentUser=user;

loadProduk();

}

);

});
// ======================================
// FORMAT HARGA
// ======================================

function formatHarga(harga){

return "Rp "+

Number(harga||0)

.toLocaleString("id-ID");

}
// ======================================
// LOADING
// ======================================

function showLoading(){

namaProduk.innerText=

"Memuat Produk...";

deskripsiProduk.innerText=

"Sedang mengambil data dari server...";

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

showLoading();

try{

const snapshot=

await getDoc(

doc(

db,

"produk",

produkId

)

);

if(!snapshot.exists()){

showError(

"Produk tidak ditemukan."

);

return;

}

produkData=

snapshot.data();

renderProduk();

renderGallery();

loadProdukTerkait();

}
catch(error){

console.error(error);

showError(

"Gagal memuat produk."

);

}

}
// ======================================
// RENDER PRODUK
// ======================================

function renderProduk(){

const data=produkData;

namaProduk.innerText=

data.namaProduk||

"Produk";

breadcrumbNama.innerText=

data.namaProduk||

"Produk";

kategoriProduk.innerText=

data.kategori||

"UMKM";

hargaProduk.innerText=

formatHarga(data.harga);

buyHarga.innerText=

formatHarga(data.harga);

ratingProduk.innerText=

"⭐ "+

Number(

data.rating||0

).toFixed(1);

document
.getElementById(
"terjualProduk"
).innerText=

"🔥 "+

Number(

data.terjual||0

)+" Terjual";

stokProduk.innerText=

"📦 "+

Number(

data.stok||0

)+" Stok";

lokasiProduk.innerText=

"📍 "+(

data.kabupaten||

data.provinsi||

"Indonesia"

);

namaToko.innerText=

"🏪 "+(

data.namaToko||

"UMKM"

);

document
.getElementById(
"storeName"
).innerText=

data.namaToko||

"UMKM";

document
.getElementById(
"storeLocation"
).innerText=

data.kabupaten||

data.provinsi||

"Indonesia";

deskripsiProduk.innerText=

data.deskripsi||

"Tidak ada deskripsi.";

document
.getElementById(
"beratProduk"
).innerText=

(data.berat||0)+

" Gram";

document
.getElementById(
"asalProduk"
).innerText=

data.kabupaten||

"Indonesia";

}
// ======================================
// GALERI
// ======================================

function renderGallery(){

const gambar=

Array.isArray(

produkData.gambar

)

?

produkData.gambar

:

[];

gambarProduk.src=

gambar[0]||

"assets/no-image.png";

galleryProduk.innerHTML="";

gambar.forEach(

(src,index)=>{

const img=

document.createElement(

"img"

);

img.src=src;

img.loading="lazy";

if(index===0){

img.classList.add(

"active"

);

}

img.onclick=()=>{

gambarProduk.src=src;

document

.querySelectorAll(

".thumbnail-list img"

)

.forEach(item=>{

item.classList.remove(

"active"

);

});

img.classList.add(

"active"

);

};

galleryProduk.appendChild(

img

);

}

);

}
// ======================================
// PRODUK TERKAIT
// ======================================

async function loadProdukTerkait(){

try{

const q=

query(

collection(db,"produk"),

where(
"kategori",
"==",
produkData.kategori
),

limit(8)

);

const snapshot=

await getDocs(q);

produkTerkait.innerHTML="";

snapshot.forEach(docItem=>{

if(docItem.id===produkId){

return;

}

const data=

docItem.data();

produkTerkait.innerHTML+=`

<div class="product-card">

<div class="product-image">

<img

src="${
Array.isArray(data.gambar)
? data.gambar[0]
: 'assets/no-image.png'
}"

loading="lazy">

</div>

<div class="product-content">

<div class="product-category">

${data.kategori||"UMKM"}

</div>

<h3 class="product-title">

${data.namaProduk||"Produk"}

</h3>

<div class="product-price">

${formatHarga(data.harga)}

</div>

<a

href="produk-detail.html?id=${docItem.id}"

class="btn btn-primary">

Lihat Detail

</a>

</div>

</div>

`;

});

if(

produkTerkait.innerHTML===""

){

produkTerkait.innerHTML=

"<p>Tidak ada produk terkait.</p>";

}

}catch(error){

console.error(error);

}

}
// ======================================
// FAVORIT
// ======================================

document

.getElementById(

"btnFavorit"

)

.addEventListener(

"click",

()=>{

let favorit=

JSON.parse(

localStorage.getItem(

"favorit"

)

)||[];

if(

favorit.find(

item=>item.id===produkId

)

){

alert(

"Produk sudah ada di favorit."

);

return;

}

favorit.push({

id:produkId,

nama:produkData.namaProduk,

gambar:

produkData.gambar?.[0],

harga:

produkData.harga

});

localStorage.setItem(

"favorit",

JSON.stringify(

favorit

)

);

alert(

"Produk berhasil disimpan."

);

}
);
// ======================================
// SHARE
// ======================================

document

.getElementById(

"shareProduk"

)

.addEventListener(

"click",

async()=>{

const url=

window.location.href;

if(

navigator.share

){

try{

await navigator.share({

title:

produkData.namaProduk,

url

});

}catch(e){}

}else{

navigator.clipboard.writeText(

url

);

alert(

"Link berhasil disalin."

);

}

});
// ======================================
// WHATSAPP
// ======================================

const wa=

document.getElementById(

"chatWA"

);

if(

produkData.whatsapp

){

const nomor=

String(

produkData.whatsapp

)

.replace(/^0/,"62");

wa.href=

`https://wa.me/${nomor}?text=${encodeURIComponent(

"Halo, saya tertarik dengan produk "+

produkData.namaProduk

)}`;

}
// ======================================
// ADD TO CART
// ======================================

document
.getElementById("addToCart")
.addEventListener("click",()=>{

let cart=

JSON.parse(
localStorage.getItem("cart")
)||[];

const existing=

cart.find(
item=>item.id===produkId
);

if(existing){

if(existing.qty>=Number(produkData.stok||0)){

alert(
"Jumlah melebihi stok."
);

return;

}

existing.qty++;

}else{

cart.push({

id:produkId,

uid:
produkData.uid||"",

uidUmkm:
produkData.uidUmkm||
produkData.uid||
"",

namaProduk:
produkData.namaProduk,

namaToko:
produkData.namaToko,

gambar:
Array.isArray(produkData.gambar)
?produkData.gambar[0]
:"",

harga:
Number(produkData.harga||0),

stok:
Number(produkData.stok||0),

berat:
Number(produkData.berat||0),

qty:1

});

}

localStorage.setItem(
"cart",
JSON.stringify(cart)
);

showToast(
"Produk berhasil ditambahkan."
);

});
// ======================================
// BUY NOW
// ======================================

document
.getElementById("buyNow")
.addEventListener("click",()=>{

const cart=[{

id:produkId,

uid:
produkData.uid||"",

uidUmkm:
produkData.uidUmkm||
produkData.uid||
"",

namaProduk:
produkData.namaProduk,

namaToko:
produkData.namaToko,

gambar:
Array.isArray(produkData.gambar)
?produkData.gambar[0]
:"",

harga:
Number(produkData.harga||0),

stok:
Number(produkData.stok||0),

berat:
Number(produkData.berat||0),

qty:1

}];

localStorage.setItem(

"cart",

JSON.stringify(cart)

);

window.location.href=

"checkout.html";

});
// ======================================
// AFFILIATE
// ======================================

const ref=

params.get("ref");

if(ref){

localStorage.setItem(
"affiliate",
ref
);

}
// ======================================
// ERROR
// ======================================

function showError(message){

document.body.innerHTML=`

<div class="container">

<div class="empty-state">

<div class="empty-icon">

⚠️

</div>

<h2>

Terjadi Kesalahan

</h2>

<p>

${message}

</p>

<a

href="produk.html"

class="btn btn-primary">

Kembali ke Produk

</a>

</div>

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

},2500);

}
// ======================================
// COPY AFFILIATE
// ======================================

window.copyAffiliate=function(){

const input=

document.getElementById(
"affiliateLink"
);

if(!input)return;

navigator.clipboard
.writeText(input.value)
.then(()=>{

showToast(
"Link affiliate berhasil disalin."
);

})
.catch(()=>{

alert(
"Gagal menyalin link."
);

});

};