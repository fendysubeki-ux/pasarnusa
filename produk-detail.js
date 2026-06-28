// ======================================
// PASARNUSA PRODUK DETAIL
// produk-detail.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

collection,

query,

where,

getDocs,

addDoc,

serverTimestamp

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

const heroTitle=

document.getElementById("heroTitle");

const breadcrumbNama=

document.getElementById("breadcrumbNama");

const gambarUtama=

document.getElementById("gambarUtama");

const thumbnailProduk=

document.getElementById("thumbnailProduk");

const kategoriProduk=

document.getElementById("kategoriProduk");

const namaProduk=

document.getElementById("namaProduk");

const ratingProduk=

document.getElementById("ratingProduk");

const reviewProduk=

document.getElementById("reviewProduk");

const terjualProduk=

document.getElementById("terjualProduk");

const hargaProduk=

document.getElementById("hargaProduk");

const stokProduk=

document.getElementById("stokProduk");

const lokasiProduk=

document.getElementById("lokasiProduk");

const namaToko=

document.getElementById("namaToko");

const affiliateBadge=

document.getElementById("affiliateBadge");

const deskripsiProduk=

document.getElementById("deskripsiProduk");

const buyHarga=

document.getElementById("buyHarga");

const jumlahProduk=

document.getElementById("jumlahProduk");

const produkTerkait=

document.getElementById("produkTerkait");

const produkToko=

document.getElementById("produkToko");

const reviewContainer=

document.getElementById("reviewContainer");
// ======================================
// VARIABLE
// ======================================

let uid="";

let idProduk="";

let dataProduk={};

let user=null;
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

ambilIdProduk();

await loadProduk();

initQuantity();

}
// ======================================
// LOGIN
// ======================================

async function checkLogin(){

await auth.authStateReady();

user=

auth.currentUser;

uid=

user?.uid||"";

}
// ======================================
// ID PRODUK
// ======================================

function ambilIdProduk(){

idProduk=

new URLSearchParams(

window.location.search

).get("id");

if(!idProduk){

window.location.href=

"produk.html";

}

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

try{

const snapshot=

await getDoc(

doc(

db,

"produk",

idProduk

)

);

if(!snapshot.exists()){

showToast(

"Produk tidak ditemukan."

);

setTimeout(()=>{

window.location.href=

"produk.html";

},1500);

return;

}

dataProduk=

snapshot.data();

renderProduk();

loadGallery();

loadAffiliate();

await loadProdukToko();

await loadProdukTerkait();

await loadReview();

}catch(error){

console.error(error);

showToast(

"Gagal memuat produk."

);

}

}
// ======================================
// RENDER
// ======================================

function renderProduk(){

heroTitle.innerText=

dataProduk.namaProduk||

"Produk";

breadcrumbNama.innerText=

dataProduk.namaProduk||

"Produk";

namaProduk.innerText=

dataProduk.namaProduk||

"Produk";

kategoriProduk.innerText=

dataProduk.kategori||

"-";

ratingProduk.innerText=

`⭐ ${

Number(

dataProduk.rating||0

).toFixed(1)

}`;

reviewProduk.innerText=

`${

dataProduk.totalReview||0

} Review`;

terjualProduk.innerText=

`🔥 ${

dataProduk.terjual||0

} Terjual`;

hargaProduk.innerText=

formatRupiah(

dataProduk.harga

);

buyHarga.innerText=

formatRupiah(

dataProduk.harga

);

stokProduk.innerText=

`📦 Stok : ${

dataProduk.stok||0

}`;

lokasiProduk.innerText=

`📍 ${

dataProduk.kabupaten||

"-"

}, ${

dataProduk.provinsi||

"-"

}`;

namaToko.innerText=

`🏪 ${

dataProduk.namaToko||

"UMKM"

}`;

deskripsiProduk.innerText=

dataProduk.deskripsi||

"-";

document.getElementById(

"beratProduk"

).innerText=

`${

dataProduk.berat||0

} Gram`;

document.getElementById(

"asalProduk"

).innerText=

`${

dataProduk.kabupaten||

"-"

}, ${

dataProduk.provinsi||

"-"

}`;

document.getElementById(

"storeName"

).innerText=

dataProduk.namaToko||

"UMKM";

document.getElementById(

"storeLocation"

).innerText=

`${

dataProduk.kabupaten||

"-"

}, ${

dataProduk.provinsi||

"-"

}`;

}
// ======================================
// GALLERY
// ======================================

function loadGallery(){

const gambar=

dataProduk.gambar||[];

if(gambar.length===0){

return;

}

gambarUtama.src=

gambar[0];

thumbnailProduk.innerHTML="";

gambar.forEach((url,index)=>{

thumbnailProduk.innerHTML+=`

<img

src="${url}"

class="${
index===0?"active":""
}"

onclick="gantiGambar('${url}',this)">

`;

});

}
// ======================================
// GANTI GAMBAR
// ======================================

window.gantiGambar=

(url,element)=>{

gambarUtama.src=url;

document

.querySelectorAll(

"#thumbnailProduk img"

)

.forEach(img=>{

img.classList.remove(

"active"

);

});

element.classList.add(

"active"

);

};
// ======================================
// AFFILIATE
// ======================================

function loadAffiliate(){

if(

!dataProduk.affiliateAktif

){

affiliateBadge.innerHTML="";

return;

}

affiliateBadge.innerHTML=`

🤝 Affiliate

${

dataProduk.komisiAffiliate||5

}%

`;

}
// ======================================
// PRODUK TOKO
// ======================================

async function loadProdukToko(){

const snapshot=

await getDocs(

query(

collection(db,"produk"),

where(

"uidUmkm",

"==",

dataProduk.uidUmkm

)

)

);

produkToko.innerHTML="";

let jumlah=0;

snapshot.forEach(doc=>{

if(doc.id===idProduk)return;

jumlah++;

const item=

doc.data();

produkToko.innerHTML+=`

<a

href="produk-detail.html?id=${doc.id}"

class="product-card">

<img

src="${item.gambar?.[0]||

'assets/no-image.png'}">

<div class="product-info">

<h3>

${item.namaProduk}

</h3>

<p>

${formatRupiah(item.harga)}

</p>

</div>

</a>

`;

});

if(jumlah===0){

produkToko.innerHTML=

emptyCard(

"Belum ada produk lainnya."

);

}

}
// ======================================
// PRODUK TERKAIT
// ======================================

async function loadProdukTerkait(){

const snapshot=

await getDocs(

query(

collection(db,"produk"),

where(

"kategori",

"==",

dataProduk.kategori

)

)

);

produkTerkait.innerHTML="";

let jumlah=0;

snapshot.forEach(doc=>{

if(doc.id===idProduk)return;

jumlah++;

const item=

doc.data();

produkTerkait.innerHTML+=`

<a

href="produk-detail.html?id=${doc.id}"

class="product-card">

<img

src="${item.gambar?.[0]||

'assets/no-image.png'}">

<div class="product-info">

<h3>

${item.namaProduk}

</h3>

<p>

${formatRupiah(item.harga)}

</p>

</div>

</a>

`;

});

if(jumlah===0){

produkTerkait.innerHTML=

emptyCard(

"Belum ada produk terkait."

);

}

}
// ======================================
// REVIEW
// ======================================

async function loadReview(){

reviewContainer.innerHTML=

emptyCard(

"Belum ada ulasan."

);

}
// ======================================
// QUANTITY
// ======================================

function initQuantity(){

const minus=

document.getElementById(

"minusQty"

);

const plus=

document.getElementById(

"plusQty"

);

minus.addEventListener(

"click",

()=>{

let jumlah=

Number(

jumlahProduk.value

);

if(jumlah>1){

jumlahProduk.value=

jumlah-1;

}

});

plus.addEventListener(

"click",

()=>{

let jumlah=

Number(

jumlahProduk.value

);

if(

jumlah<

Number(

dataProduk.stok||0

)

){

jumlahProduk.value=

jumlah+1;

}

});

}
// ======================================
// KERANJANG
// ======================================

document
.getElementById("addToCart")
.addEventListener(
"click",
tambahKeranjang
);

async function tambahKeranjang(){

if(!auth.currentUser){

showToast(

"Silakan login terlebih dahulu."

);

return;

}

try{

await addDoc(

collection(db,"keranjang"),

{

uidUser:uid,

idProduk:idProduk,

uidUmkm:dataProduk.uidUmkm,

namaProduk:dataProduk.namaProduk,

harga:dataProduk.harga,

gambar:dataProduk.gambar?.[0]||"",

jumlah:Number(

jumlahProduk.value

),

selected:true,

createdAt:

serverTimestamp()

}

);

showToast(

"Produk berhasil ditambahkan ke keranjang."

);

}catch(error){

console.error(error);

showToast(

"Gagal menambahkan ke keranjang."

);

}

}
// ======================================
// BELI SEKARANG
// ======================================

document
.getElementById("buyNow")
.addEventListener(
"click",
()=>{

window.location.href=

`checkout.html?id=${idProduk}&qty=${jumlahProduk.value}`;

});
// ======================================
// WHATSAPP
// ======================================

const chatWA=

document.getElementById(

"chatWA"

);

if(chatWA){

const nomor=

(dataProduk.whatsapp||"")

.replace(/^0/,"62");

const pesan=

encodeURIComponent(

`Halo, saya tertarik dengan produk ${dataProduk.namaProduk}.`

);

chatWA.href=

`https://wa.me/${nomor}?text=${pesan}`;

}
// ======================================
// SHARE
// ======================================

document
.getElementById("shareProduk")
.addEventListener(
"click",
async()=>{

const url=

window.location.href;

if(navigator.share){

await navigator.share({

title:dataProduk.namaProduk,

text:dataProduk.namaProduk,

url:url

});

}else{

await navigator.clipboard.writeText(url);

showToast(

"Link berhasil disalin."

);

}

});
// ======================================
// FAVORIT
// ======================================

document
.getElementById("btnFavorit")
.addEventListener(
"click",
async()=>{

if(!auth.currentUser){

showToast(

"Silakan login terlebih dahulu."

);

return;

}

try{

await addDoc(

collection(db,"favorit"),

{

uidUser:uid,

idProduk:idProduk,

createdAt:

serverTimestamp()

}

);

showToast(

"Produk disimpan ke favorit."

);

}catch(error){

console.error(error);

showToast(

"Gagal menyimpan favorit."

);

}

});
// ======================================
// HELPER
// ======================================

function formatRupiah(angka){

return "Rp "+

Number(angka||0)

.toLocaleString("id-ID");

}

function emptyCard(text){

return`

<div class="empty-state">

<h3>

📭

</h3>

<p>

${text}

</p>

</div>

`;

}

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
