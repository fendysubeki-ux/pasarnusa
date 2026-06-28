// ======================================
// PASARNUSA PESANAN MASUK
// pesanan-masuk.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

collection,

query,

where,

orderBy,

getDocs

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

const pesananContainer=

document.getElementById("pesananContainer");

const totalPesanan=

document.getElementById("totalPesanan");

const belumBayar=

document.getElementById("belumBayar");

const menungguVerifikasi=

document.getElementById("menungguVerifikasi");

const diproses=

document.getElementById("diproses");

const dikirim=

document.getElementById("dikirim");

const selesai=

document.getElementById("selesai");

const searchPesanan=

document.getElementById("searchPesanan");

const filterStatus=

document.getElementById("filterStatus");
// ======================================
// VARIABLE
// ======================================

let uid="";

let semuaPesanan=[];
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

await loadPesanan();

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

const template=

document.getElementById(

"loadingPesanan"

);

pesananContainer.innerHTML="";

for(let i=0;i<5;i++){

pesananContainer.appendChild(

template.content.cloneNode(true)

);

}

}
// ======================================
// LOAD PESANAN
// ======================================

async function loadPesanan(){

try{

const snapshot=

await getDocs(

query(

collection(db,"pesanan"),

where(

"uidUmkm",

"==",

uid

),

orderBy(

"createdAt",

"desc"

)

)

);

semuaPesanan=[];

snapshot.forEach(doc=>{

semuaPesanan.push({

id:doc.id,

...doc.data()

});

});

updateStatistik();

renderPesanan(

semuaPesanan

);

}catch(error){

console.error(error);

showError();

}

}
// ======================================
// STATISTIK
// ======================================

function updateStatistik(){

totalPesanan.innerText=

semuaPesanan.length;

belumBayar.innerText=

semuaPesanan.filter(item=>

item.status==="Belum Bayar"

).length;

menungguVerifikasi.innerText=

semuaPesanan.filter(item=>

item.status==="Menunggu Verifikasi"

).length;

diproses.innerText=

semuaPesanan.filter(item=>

item.status==="Diproses"

).length;

dikirim.innerText=

semuaPesanan.filter(item=>

item.status==="Dikirim"

).length;

selesai.innerText=

semuaPesanan.filter(item=>

item.status==="Selesai"

).length;

}
// ======================================
// RENDER PESANAN
// ======================================

function renderPesanan(data){

pesananContainer.innerHTML="";

if(data.length===0){

document.getElementById(

"emptyPesanan"

).style.display="block";

return;

}

document.getElementById(

"emptyPesanan"

).style.display="none";

data.forEach(item=>{

pesananContainer.innerHTML+=

createCard(item);

});

}
// ======================================
// CARD PESANAN
// ======================================

function createCard(item){

const produk=

item.items?.[0]||{};

const gambar=

Array.isArray(produk.gambar)

?produk.gambar[0]

:produk.gambar||

"assets/no-image.png";

return`

<div class="order-card">

<img

src="${gambar}"

loading="lazy"

onerror="this.src='assets/no-image.png'">

<div class="order-info">

<h3>

${item.namaPembeli||"-"}

</h3>

<p>

📱 ${item.whatsapp||"-"}

</p>

<p>

🛍 ${produk.namaProduk||"Produk"}

</p>

<p>

📅 ${formatTanggal(item.createdAt)}

</p>

<p class="order-price">

${formatRupiah(item.totalBayar)}

</p>

<span class="status-badge ${statusClass(item.status)}">

${item.status}

</span>

</div>

<div class="order-action">

<a

href="detail-pesanan-umkm.html?id=${item.id}"

class="btn btn-primary">

📄 Detail

</a>

</div>

</div>

`;

}
// ======================================
// STATUS
// ======================================

function statusClass(status){

switch(status){

case"Belum Bayar":

return"status-belum";

case"Menunggu Verifikasi":

return"status-verifikasi";

case"Diproses":

return"status-proses";

case"Dikirim":

return"status-kirim";

case"Selesai":

return"status-selesai";

default:

return"status-ditolak";

}

}
// ======================================
// SEARCH
// ======================================

function initSearch(){

searchPesanan.addEventListener(

"input",

filterPesanan

);

}
// ======================================
// FILTER
// ======================================

function initFilter(){

filterStatus.addEventListener(

"change",

filterPesanan

);

}

function filterPesanan(){

const keyword=

searchPesanan.value

.toLowerCase()

.trim();

const status=

filterStatus.value;

const hasil=

semuaPesanan.filter(item=>{

const nama=

(item.namaPembeli||"")

.toLowerCase();

const wa=

(item.whatsapp||"")

.toLowerCase();

const cocokKeyword=

nama.includes(keyword)

||

wa.includes(keyword);

const cocokStatus=

status==="all"

||

item.status===status;

return cocokKeyword

&&

cocokStatus;

});

renderPesanan(

hasil

);

}
// ======================================
// FORMAT RUPIAH
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
// FORMAT TANGGAL
// ======================================

function formatTanggal(waktu){

if(!waktu)return"-";

const tanggal=

waktu.toDate

? waktu.toDate()

:new Date(waktu);

return tanggal.toLocaleString(

"id-ID",

{

day:"2-digit",

month:"long",

year:"numeric",

hour:"2-digit",

minute:"2-digit"

}

);

}
// ======================================
// ERROR
// ======================================

function showError(){

pesananContainer.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

⚠️

</div>

<h2>

Terjadi Kesalahan

</h2>

<p>

Gagal memuat data pesanan.

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