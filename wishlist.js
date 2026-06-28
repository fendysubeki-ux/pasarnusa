// ======================================
// PASARNUSA WISHLIST
// wishlist.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {

getFirestore,

collection,

query,

where,

getDocs,

doc,

getDoc,

deleteDoc,

addDoc,

serverTimestamp

}

from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {

getAuth

}

from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
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

const app=initializeApp(firebaseConfig);

const db=getFirestore(app);

const auth=getAuth(app);
// ======================================
// ELEMENT
// ======================================

const wishlistContainer=

document.getElementById("wishlistContainer");

const totalWishlist=

document.getElementById("totalWishlist");

const stokAda=

document.getElementById("stokAda");

const stokHabis=

document.getElementById("stokHabis");

const addAllCart=

document.getElementById("addAllCart");

const hapusWishlist=

document.getElementById("hapusWishlist");
// ======================================
// VARIABLE
// ======================================

let uid="";

let semuaWishlist=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

await loadWishlist();

initButton();

}
// ======================================
// LOGIN
// ======================================

async function checkLogin(){

await auth.authStateReady();

if(!auth.currentUser){

window.location.href="login.html";

return;

}

uid=

auth.currentUser.uid;

}
// ======================================
// LOAD WISHLIST
// ======================================

async function loadWishlist(){

try{

const snap=

await getDocs(

query(

collection(db,"wishlist"),

where("uid","==",uid)

)

);

semuaWishlist=[];

for(const item of snap.docs){

const data=item.data();

const produkSnap=

await getDoc(

doc(db,"produk",data.produkId)

);

if(produkSnap.exists()){

semuaWishlist.push({

id:item.id,

wishlist:data,

produk:produkSnap.data()

});

}

}

renderWishlist();

updateStatistik();

}catch(error){

console.error(error);

showToast(

"Gagal memuat wishlist."

);

}

}
// ======================================
// STATISTIK
// ======================================

function updateStatistik(){

totalWishlist.innerText=

semuaWishlist.length;

stokAda.innerText=

semuaWishlist.filter(

item=>

Number(item.produk.stok||0)>0

).length;

stokHabis.innerText=

semuaWishlist.filter(

item=>

Number(item.produk.stok||0)<=0

).length;

}
// ======================================
// RENDER
// ======================================

function renderWishlist(){

wishlistContainer.innerHTML="";

if(semuaWishlist.length===0){

document.getElementById(

"emptyWishlist"

).style.display="block";

return;

}

document.getElementById(

"emptyWishlist"

).style.display="none";

semuaWishlist.forEach(item=>{

const produk=item.produk;

const gambar=

Array.isArray(produk.gambar)

?produk.gambar[0]

:produk.gambar||

"assets/no-image.png";

wishlistContainer.innerHTML+=`

<div class="wishlist-item">

<img

src="${gambar}"

loading="lazy"

onerror="this.src='assets/no-image.png'">

<div class="wishlist-info">

<h3>

${produk.namaProduk}

</h3>

<p>

${produk.namaToko}

</p>

<div class="wishlist-price">

Rp ${Number(

produk.harga||0

).toLocaleString("id-ID")}

</div>

<div class="${
Number(produk.stok)>0
?"stock-badge stock-ready"
:"stock-badge stock-empty"
}">

${
Number(produk.stok)>0
?"Stok Tersedia"
:"Stok Habis"
}

</div>

<div class="wishlist-action">

<button

class="btn btn-primary"

onclick="tambahKeranjang('${produk.id}')">

🛒 Keranjang

</button>

<button

class="btn btn-secondary"

onclick="hapusItem('${item.id}')">

🗑 Hapus

</button>

<a

href="produk-detail.html?id=${produk.id}"

class="btn btn-secondary">

👁 Detail

</a>

</div>

</div>

</div>

`;

});

}
// ======================================
// KERANJANG
// ======================================

window.tambahKeranjang=

async(produkId)=>{

try{

await addDoc(

collection(db,"keranjang"),

{

uid,

produkId,

qty:1,

createdAt:

serverTimestamp()

}

);

showToast(

"Produk ditambahkan ke keranjang."

);

}catch(error){

console.error(error);

showToast(

"Gagal menambahkan produk."

);

}

};
// ======================================
// HAPUS ITEM
// ======================================

window.hapusItem=

async(id)=>{

try{

await deleteDoc(

doc(db,"wishlist",id)

);

await loadWishlist();

showToast(

"Produk dihapus dari wishlist."

);

}catch(error){

console.error(error);

showToast(

"Gagal menghapus wishlist."

);

}

};
// ======================================
// BUTTON
// ======================================

function initButton(){

addAllCart.onclick=

tambahSemuaKeranjang;

hapusWishlist.onclick=

hapusSemuaWishlist;

}
// ======================================
// TAMBAH SEMUA
// ======================================

async function tambahSemuaKeranjang(){

try{

for(const item of semuaWishlist){

if(Number(item.produk.stok||0)<=0){

continue;

}

await addDoc(

collection(db,"keranjang"),

{

uid,

produkId:item.produk.id,

qty:1,

createdAt:serverTimestamp()

}

);

}

showToast(

"Semua produk berhasil ditambahkan ke keranjang."

);

}catch(error){

console.error(error);

showToast(

"Gagal menambahkan semua produk."

);

}

}
// ======================================
// HAPUS SEMUA
// ======================================

async function hapusSemuaWishlist(){

if(!confirm(

"Hapus semua wishlist?"

)){

return;

}

try{

for(const item of semuaWishlist){

await deleteDoc(

doc(

db,

"wishlist",

item.id

)

);

}

await loadWishlist();

showToast(

"Wishlist berhasil dikosongkan."

);

}catch(error){

console.error(error);

showToast(

"Gagal menghapus wishlist."

);

}

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
// ======================================
// AUTO REFRESH
// ======================================

setInterval(

async()=>{

await loadWishlist();

},

30000

);
