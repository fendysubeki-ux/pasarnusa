// ======================================
// PASARNUSA REVIEW
// review.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

addDoc,

collection,

query,

where,

getDocs,

updateDoc,

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
// CLOUDINARY
// ======================================

const CLOUD_NAME="dq8gha9lv";

const UPLOAD_PRESET="pasarnusa";
// ======================================
// ELEMENT
// ======================================

const produkContainer=

document.getElementById("produkContainer");

const ratingBox=

document.getElementById("ratingBox");

const ratingText=

document.getElementById("ratingText");

const reviewText=

document.getElementById("reviewText");

const fotoReview=

document.getElementById("fotoReview");

const previewFoto=

document.getElementById("previewFoto");

const kirimReview=

document.getElementById("kirimReview");

const summaryProduk=

document.getElementById("summaryProduk");

const summaryToko=

document.getElementById("summaryToko");

const summaryRating=

document.getElementById("summaryRating");
// ======================================
// VARIABLE
// ======================================

let uid="";

let orderId="";

let dataPesanan={};

let dataProduk={};

let rating=0;

let fotoList=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

ambilOrder();

await loadPesanan();

initRating();

initUpload();

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

uid=auth.currentUser.uid;

}
// ======================================
// ORDER
// ======================================

function ambilOrder(){

orderId=

new URLSearchParams(

window.location.search

).get("order");

if(!orderId){

window.location.href=

"pesanan-saya.html";

}

}
// ======================================
// LOAD PESANAN
// ======================================

async function loadPesanan(){

try{

const pesananSnap=

await getDoc(

doc(db,"pesanan",orderId)

);

if(!pesananSnap.exists()){

document.getElementById(

"emptyReview"

).style.display="block";

return;

}

dataPesanan=

pesananSnap.data();

if(

dataPesanan.uidPembeli!==uid

){

window.location.href=

"pesanan-saya.html";

return;

}

if(

dataPesanan.status!=="Selesai"

){

showToast(

"Pesanan belum selesai."

);

window.location.href=

"detail-pesanan.html?id="+orderId;

return;

}

if(

dataPesanan.sudahReview===true

){

showToast(

"Review sudah pernah dikirim."

);

window.location.href=

"detail-pesanan.html?id="+orderId;

return;

}

await loadProduk();

}
catch(error){

console.error(error);

showError(

"Gagal memuat data pesanan."

);

showToast(

"Terjadi kesalahan."

);

}

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

const produkId=

dataPesanan.items?.[0]?.id;

const snap=

await getDoc(

doc(db,"produk",produkId)

);

if(!snap.exists()){

showToast(

"Produk tidak ditemukan."

);

return;

}

dataProduk=

snap.data();

renderProduk();

}
// ======================================
// RENDER PRODUK
// ======================================

function renderProduk(){

const gambar=

Array.isArray(dataProduk.gambar)

?dataProduk.gambar[0]

:dataProduk.gambar||

"assets/no-image.png";

produkContainer.innerHTML=`

<div class="produk-card">

<img

src="${gambar}"

loading="lazy"

onerror="this.src='assets/no-image.png'">

<div class="produk-info">

<h3>

${dataProduk.namaProduk}

</h3>

<p>

${dataProduk.namaToko}

</p>

</div>

</div>

`;

summaryProduk.innerText=

dataProduk.namaProduk;

summaryToko.innerText=

dataProduk.namaToko;

}
// ======================================
// RATING
// ======================================

function initRating(){

const stars=

document.querySelectorAll(".star");

stars.forEach(star=>{

star.onclick=()=>{

rating=

Number(

star.dataset.rating

);

stars.forEach(item=>{

item.classList.toggle(

"active",

Number(item.dataset.rating)<=rating

);

});

ratingText.innerText=

rating+" / 5 Bintang";

summaryRating.innerText=

rating+" / 5";
ratingText.innerText=

`Anda memberi ${rating} bintang`;
};

});

}
// ======================================
// FOTO REVIEW
// ======================================

function initUpload(){

fotoReview.onchange=()=>{
if(fotoReview.files.length>5){

showToast(

"Maksimal 5 foto."

);

fotoReview.value="";

return;

}

for(const file of fotoReview.files){

if(file.size>2*1024*1024){

showToast(

"Ukuran foto maksimal 2 MB."

);

fotoReview.value="";

return;

}

}
previewFoto.innerHTML="";

fotoList=[

...fotoReview.files

].slice(0,5);

fotoList.forEach(file=>{

const img=

document.createElement("img");

img.src=

URL.createObjectURL(file);

previewFoto.appendChild(img);

});

};

}
// ======================================
// UPLOAD CLOUDINARY
// ======================================

async function uploadFoto(){

const hasil=[];

for(const file of fotoList){

const formData=

new FormData();

formData.append(

"file",

file

);

formData.append(

"upload_preset",

UPLOAD_PRESET

);

const response=

await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

{

method:"POST",

body:formData

}

);

const result=

await response.json();

if(result.secure_url){

hasil.push(

result.secure_url

);

}

}

return hasil;

}
// ======================================
// BUTTON
// ======================================

function initButton(){

kirimReview.onclick=

kirimData;

}
// ======================================
// SIMPAN REVIEW
// ======================================

async function kirimData(){

try{

if(rating===0){

showToast(

"Pilih rating terlebih dahulu."

);

return;

}

if(

reviewText.value.trim().length<10

){

showToast(

"Review minimal 10 karakter."

);

return;

}

kirimReview.disabled=true;

kirimReview.innerText=

"Mengirim...";

const foto=

await uploadFoto();

await simpanReview(

foto);

}catch(error){

console.error(error);

showToast(

"Gagal mengirim review."

);

}finally{

kirimReview.disabled=false;

kirimReview.innerText=

"⭐ Kirim Review";

}

}
// ======================================
// FIRESTORE
// ======================================

async function simpanReview(foto){

await addDoc(

collection(db,"ulasan"),

{

uid,

produkId:

dataPesanan.items[0].id,

pesananId:

orderId,

uidUmkm:

dataPesanan.uidUmkm,

nama:

auth.currentUser.displayName||

"Pembeli",

rating,

ulasan:

reviewText.value.trim(),

foto,

createdAt:

serverTimestamp()

}

);

await updateRating();

await updateDoc(

doc(db,"pesanan",orderId),

{

sudahReview:true

}

);

showToast(

"Review berhasil dikirim."

);

setTimeout(()=>{

window.location.href=

"pesanan-saya.html";

},1500);

}
// ======================================
// UPDATE RATING
// ======================================

async function updateRating(){

const totalReview=

Number(

dataProduk.totalReview||0

)+1;

const totalRating=(

Number(dataProduk.rating||0)

*

Number(dataProduk.totalReview||0)

)+rating;

await updateDoc(

doc(

db,

"produk",

dataPesanan.items[0].id

),

{

rating:Number(

(totalRating/totalReview)

.toFixed(1)

),

totalReview

}

);

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
// ERROR
// ======================================

function showError(message){

produkContainer.innerHTML=`

<div class="empty-state-mini">

⚠️ ${message}

</div>

`;

}
