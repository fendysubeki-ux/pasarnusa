// ======================================
// PASARNUSA PAYMENT
// payment.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

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
// ELEMENT
// ======================================

const orderContainer=document.getElementById("orderContainer");

const totalBayar=document.getElementById("totalBayar");

const paymentMethod=document.getElementById("paymentMethod");

const bankName=document.getElementById("bankName");

const rekening=document.getElementById("rekening");

const atasNama=document.getElementById("atasNama");

const statusPembayaran=document.getElementById("statusPembayaran");

const expiredTime=document.getElementById("expiredTime");

const nomorPesanan=document.getElementById("nomorPesanan");

const bayarBtn=document.getElementById("bayarBtn");

const copyRekening=document.getElementById("copyRekening");
// ======================================
// VARIABLE
// ======================================

let uid="";

let orderId="";

let dataPesanan={};

let dataUmkm={};

let countdownInterval=null;
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

ambilOrderId();

await loadPesanan();

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
// ORDER ID
// ======================================

function ambilOrderId(){

orderId=

new URLSearchParams(

window.location.search

).get("id");

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

const snap=

await getDoc(

doc(db,"pesanan",orderId)

);

if(!snap.exists()){

document.getElementById(

"emptyPayment"

).style.display="block";

return;

}

dataPesanan=snap.data();

if(dataPesanan.uidPembeli!==uid){

window.location.href="pesanan-saya.html";

return;

}

await loadUmkm();

renderPesanan();

startCountdown();

}catch(error){

console.error(error);

showToast(

"Gagal memuat pembayaran."

);

}

}
// ======================================
// LOAD UMKM
// ======================================

async function loadUmkm(){

const snap=

await getDoc(

doc(

db,

"users",

dataPesanan.uidUmkm

)

);

if(snap.exists()){

dataUmkm=

snap.data();

}

}
// ======================================
// RENDER
// ======================================

function renderPesanan(){

nomorPesanan.innerText=

orderId.substring(0,8);

totalBayar.innerText=

formatRupiah(

dataPesanan.totalBayar

);

statusPembayaran.innerText=

dataPesanan.statusPembayaran||

"Belum Dibayar";

bankName.innerText=

dataUmkm.namaBank||

"-";

rekening.innerText=

dataUmkm.nomorRekening||

"-";

atasNama.innerText=

dataUmkm.atasNama||

"-";

paymentMethod.innerText=

dataPesanan.paymentMethod||

"Transfer Bank";

orderContainer.innerHTML=`

<div class="summary-item">

<span>Subtotal</span>

<b>

${formatRupiah(

dataPesanan.subtotal

)}

</b>

</div>

<div class="summary-item">

<span>Ongkir</span>

<b>

${formatRupiah(

dataPesanan.ongkir

)}

</b>

</div>

<div class="summary-item">

<span>Total</span>

<b>

${formatRupiah(

dataPesanan.totalBayar

)}

</b>

</div>

`;

}
// ======================================
// BUTTON
// ======================================

function initButton(){

copyRekening.onclick=

salinRekening;

bayarBtn.onclick=

prosesPembayaran;

}
// ======================================
// COPY
// ======================================

function salinRekening(){

navigator.clipboard.writeText(

rekening.innerText

);

showToast(

"Nomor rekening berhasil disalin."

);

}
document

.querySelectorAll(

'input[name="payment"]'

)

.forEach(item=>{

item.onchange=

async()=>{

paymentMethod.innerText=

item.value;

await updateDoc(

doc(db,"pesanan",orderId),

{

paymentMethod:

item.value

}

);

};

});
// ======================================
// COUNTDOWN
// ======================================

function startCountdown(){

if(countdownInterval){

clearInterval(countdownInterval);

}

const createdAt=

dataPesanan.createdAt?.toDate

?dataPesanan.createdAt.toDate()

:new Date();

const expired=

new Date(

createdAt.getTime()

+24*60*60*1000

);

countdownInterval=

setInterval(()=>{

const sekarang=

new Date();

const selisih=

expired-sekarang;

if(selisih<=0){

clearInterval(

countdownInterval

);

expiredTime.innerText=

"Kadaluarsa";

statusPembayaran.innerText=

"Kadaluarsa";

return;

}

const jam=

Math.floor(

selisih/3600000

);

const menit=

Math.floor(

(selisih%3600000)/60000

);

const detik=

Math.floor(

(selisih%60000)/1000

);

expiredTime.innerText=

`${jam}j ${menit}m ${detik}d`;

},1000);

}
// ======================================
// BAYAR
// ======================================

async function prosesPembayaran(){

try{

await updateDoc(

doc(db,"pesanan",orderId),

{

paymentStatus:

"Menunggu Pembayaran",

updatedAt:

serverTimestamp()

}

);

showToast(

"Silakan lakukan pembayaran sesuai metode yang dipilih."

);

setTimeout(()=>{

window.location.href=

`upload-bukti.html?id=${orderId}`;

},1000);

}catch(error){

console.error(error);

showToast(

"Gagal memproses pembayaran."

);

}

}
// ======================================
// FORMAT RUPIAH
// ======================================

function formatRupiah(nilai){

return "Rp "+

Number(

nilai||0

).toLocaleString(

"id-ID"

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
catch(error){

console.error(error);

document.getElementById(

"emptyPayment"

).style.display="block";

showToast(

"Gagal memuat data pembayaran."

);

}