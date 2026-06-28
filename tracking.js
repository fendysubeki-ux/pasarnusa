// ======================================
// PASARNUSA TRACKING
// tracking.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

getDoc

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

const app=initializeApp(firebaseConfig);

const db=getFirestore(app);

const auth=getAuth(app);
// ======================================
// ELEMENT
// ======================================

const nomorPesanan=document.getElementById("nomorPesanan");

const statusPesanan=document.getElementById("statusPesanan");

const totalBayar=document.getElementById("totalBayar");

const kurir=document.getElementById("kurir");

const resi=document.getElementById("resi");

const namaToko=document.getElementById("namaToko");

const namaPenjual=document.getElementById("namaPenjual");

const whatsappPenjual=document.getElementById("whatsappPenjual");

const timelineContainer=document.getElementById("timelineContainer");

const summaryStatus=document.getElementById("summaryStatus");

const summaryKurir=document.getElementById("summaryKurir");

const summaryResi=document.getElementById("summaryResi");

const estimasiSampai=document.getElementById("estimasiSampai");

const copyResi=document.getElementById("copyResi");

const chatPenjual=document.getElementById("chatPenjual");

const detailPesanan=document.getElementById("detailPesanan");
// ======================================
// VARIABLE
// ======================================

let uid="";

let pesananId="";

let dataPesanan={};

const statusList=[

"Belum Bayar",

"Menunggu Verifikasi",

"Diproses",

"Dikirim",

"Selesai"

];

const iconList=[

"💳",

"🧾",

"📦",

"🚚",

"✅"

];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

ambilId();

await loadTracking();

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
// AMBIL ID
// ======================================

function ambilId(){

pesananId=

new URLSearchParams(

window.location.search

).get("id");

if(!pesananId){

window.location.href=

"pesanan-saya.html";

}

}
// ======================================
// LOAD TRACKING
// ======================================

async function loadTracking(){

try{

const snap=

await getDoc(

doc(db,"pesanan",pesananId)

);

if(!snap.exists()){

document.getElementById(

"emptyTracking"

).style.display="block";

return;

}

dataPesanan=snap.data();

if(dataPesanan.uidPembeli!==uid){

window.location.href=

"pesanan-saya.html";

return;

}

isiData();

renderTimeline();

}catch(error){

console.error(error);

showToast(

"Gagal memuat tracking."

);

}

}
// ======================================
// ISI DATA
// ======================================

function isiData(){

nomorPesanan.innerText=

pesananId.substring(0,8);

statusPesanan.innerText=

dataPesanan.status||

"-";

totalBayar.innerText=

formatRupiah(

dataPesanan.totalBayar

);

kurir.innerText=

dataPesanan.kurir||

"-";

resi.innerText=

dataPesanan.resi||

"-";

namaToko.innerText=

dataPesanan.namaUmkm||

"-";

namaPenjual.innerText=

dataPesanan.namaPemilik||

dataPesanan.namaUmkm||

"-";

whatsappPenjual.innerText=

dataPesanan.whatsappUmkm||

"-";

summaryStatus.innerText=

dataPesanan.status||

"-";

summaryKurir.innerText=

dataPesanan.kurir||

"-";

summaryResi.innerText=

dataPesanan.resi||

"-";

estimasiSampai.innerText=

getEstimasi(

dataPesanan.status

);

detailPesanan.href=

`detail-pesanan.html?id=${pesananId}`;

chatPenjual.href=

`https://wa.me/${

(dataPesanan.whatsappUmkm||"")
.replace(/\D/g,"")

}`;

}
// ======================================
// TIMELINE
// ======================================

function renderTimeline(){

timelineContainer.innerHTML="";

const current=

statusList.indexOf(

dataPesanan.status

);

statusList.forEach(

(status,index)=>{

timelineContainer.innerHTML+=`

<div class="timeline-item ${

index<=current

?"active":""

}">

<div class="timeline-icon">

${iconList[index]}

</div>

<div class="timeline-content">

<h3>

${status}

</h3>

<p>

${deskripsiStatus(status)}

</p>

</div>

</div>

`;

});

}
// ======================================
// DESKRIPSI STATUS
// ======================================

function deskripsiStatus(status){

switch(status){

case"Belum Bayar":

return"Menunggu pembayaran dari pembeli.";

case"Menunggu Verifikasi":

return"Bukti pembayaran sedang diperiksa.";

case"Diproses":

return"Pesanan sedang disiapkan oleh UMKM.";

case"Dikirim":

return"Pesanan sedang dalam perjalanan.";

case"Selesai":

return"Pesanan telah diterima.";

default:

return"-";

}

}
// ======================================
// BUTTON
// ======================================

function initButton(){

copyResi.onclick=()=>{

if(!dataPesanan.resi){

showToast(

"Nomor resi belum tersedia."

);

return;

}

navigator.clipboard.writeText(

dataPesanan.resi

);

showToast(

"Nomor resi berhasil disalin."

);

};

}
// ======================================
// ESTIMASI
// ======================================

function getEstimasi(status){

switch(status){

case"Belum Bayar":

return"Menunggu pembayaran";

case"Menunggu Verifikasi":

return"1 Hari";

case"Diproses":

return"1-2 Hari";

case"Dikirim":

return"2-5 Hari";

case"Selesai":

return"Pesanan selesai";

default:

return"-";

}

}
// ======================================
// FORMAT RUPIAH
// ======================================

function formatRupiah(angka){

return "Rp " +

Number(

angka || 0

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
// ======================================
// ERROR
// ======================================

function showError(message){

timelineContainer.innerHTML=`

<div class="empty-state-mini">

⚠️ ${message}

</div>

`;

}
// ======================================
// AUTO REFRESH
// ======================================

setInterval(async()=>{

if(pesananId){

await loadTracking();

}

},30000);
