// ======================================
// PASARNUSA DETAIL PESANAN
// detail-pesanan.js
// ======================================

// Firebase

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

const app=

initializeApp(firebaseConfig);

const db=

getFirestore(app);

const auth=

getAuth(app);
// ======================================
// ELEMENT
// ======================================

const nomorPesanan=

document.getElementById("nomorPesanan");

const statusPesanan=

document.getElementById("statusPesanan");

const tanggalPesanan=

document.getElementById("tanggalPesanan");

const namaPembeli=

document.getElementById("namaPembeli");

const whatsappPembeli=

document.getElementById("whatsappPembeli");

const alamatPembeli=

document.getElementById("alamatPembeli");

const produkContainer=

document.getElementById("produkContainer");

const buktiContainer=

document.getElementById("buktiContainer");

const namaKurir=

document.getElementById("namaKurir");

const nomorResi=

document.getElementById("nomorResi");

const statusPengiriman=

document.getElementById("statusPengiriman");

const subtotal=

document.getElementById("subtotal");

const ongkir=

document.getElementById("ongkir");

const diskon=

document.getElementById("diskon");

const totalBayar=

document.getElementById("totalBayar");

const uploadBuktiBtn=

document.getElementById("uploadBuktiBtn");

const hubungiTokoBtn=

document.getElementById("hubungiTokoBtn");

const beriUlasanBtn=

document.getElementById("beriUlasanBtn");
// ======================================
// VARIABLE
// ======================================

let uid="";

let pesananId="";

let dataPesanan={};
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

ambilIdPesanan();

await loadPesanan();

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
// ID PESANAN
// ======================================

function ambilIdPesanan(){

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
// LOAD PESANAN
// ======================================

async function loadPesanan(){

try{

const snapshot=

await getDoc(

doc(

db,

"pesanan",

pesananId

)

);

if(!snapshot.exists()){

showToast(

"Pesanan tidak ditemukan."

);

setTimeout(()=>{

window.location.href=

"pesanan-saya.html";

},1500);

return;

}

dataPesanan=

snapshot.data();

if(dataPesanan.uidPembeli!==uid){

showToast(

"Akses ditolak."

);

setTimeout(()=>{

window.location.href=

"pesanan-saya.html";

},1500);

return;

}

isiData();

renderProduk();

renderBukti();

renderStatus();

renderAksi();

}catch(error){

console.error(error);

showToast(

"Gagal memuat pesanan."

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

"Belum Bayar";

tanggalPesanan.innerText=

formatTanggal(

dataPesanan.createdAt

);

namaPembeli.innerText=

dataPesanan.namaPembeli||

"-";

whatsappPembeli.innerText=

dataPesanan.whatsapp||

"-";

alamatPembeli.innerText=

dataPesanan.alamat||

"-";

namaKurir.innerText=

dataPesanan.kurir||

"-";

nomorResi.innerText=

dataPesanan.resi||

"-";

statusPengiriman.innerText=

dataPesanan.status==="Dikirim"

?

"Sedang Dikirim"

:

dataPesanan.status==="Selesai"

?

"Selesai"

:

"Belum Dikirim";

subtotal.innerText=

formatRupiah(

dataPesanan.subtotal

);

ongkir.innerText=

formatRupiah(

dataPesanan.ongkir

);

diskon.innerText=

formatRupiah(

dataPesanan.diskon

);

totalBayar.innerText=

formatRupiah(

dataPesanan.totalBayar

);

}
// ======================================
// PRODUK
// ======================================

function renderProduk(){

produkContainer.innerHTML="";

const items=

dataPesanan.items||[];

items.forEach(item=>{

const gambar=

Array.isArray(item.gambar)

?item.gambar[0]

:item.gambar||

"assets/no-image.png";

const qty=

Number(item.qty||1);

const harga=

Number(item.harga||0);

produkContainer.innerHTML+=`

<div class="produk-card">

<img

src="${gambar}"

loading="lazy"

onerror="this.src='assets/no-image.png'">

<div class="produk-info">

<h3>

${item.namaProduk}

</h3>

<p>

Jumlah :

${qty}

</p>

<p>

Harga :

${formatRupiah(harga)}

</p>

</div>

<div class="produk-harga">

${formatRupiah(

qty*harga

)}

</div>

</div>

`;

});

}
// ======================================
// BUKTI
// ======================================

function renderBukti(){

if(!dataPesanan.buktiTransfer){

buktiContainer.innerHTML=`

<div class="empty-state-mini">

Belum ada bukti pembayaran.

</div>

`;

return;

}

buktiContainer.innerHTML=`

<img

src="${dataPesanan.buktiTransfer}"

loading="lazy">

<br><br>

<a

href="${dataPesanan.buktiTransfer}"

target="_blank"

class="btn btn-secondary">

🔍 Lihat Gambar

</a>

`;

}
// ======================================
// STATUS
// ======================================

function renderStatus(){

const items=

document.querySelectorAll(

".timeline-item"

);

items.forEach(item=>

item.classList.remove(

"active"

)

);

items[0].classList.add(

"active"

);

switch(dataPesanan.status){

case"Belum Bayar":

items[1].classList.add("active");

break;

case"Menunggu Verifikasi":

items[1].classList.add("active");

break;

case"Diproses":

items[1].classList.add("active");

items[2].classList.add("active");

break;

case"Dikirim":

items[1].classList.add("active");

items[2].classList.add("active");

items[3].classList.add("active");

break;

case"Selesai":

items.forEach(item=>

item.classList.add(

"active"

));

break;

}

}
// ======================================
// AKSI
// ======================================

function renderAksi(){

uploadBuktiBtn.style.display="none";

beriUlasanBtn.style.display="none";

hubungiTokoBtn.onclick=()=>{

if(dataPesanan.whatsappUmkm){

window.open(

"https://wa.me/"+

dataPesanan.whatsappUmkm,

"_blank"

);

}else{

showToast(

"Nomor WhatsApp penjual belum tersedia."

);

}

};

if(

dataPesanan.status==="Belum Bayar"

){

uploadBuktiBtn.style.display="block";

uploadBuktiBtn.onclick=()=>{

window.location.href=

`upload-bukti.html?id=${pesananId}`;

};

}

if(

dataPesanan.status==="Selesai"

){

beriUlasanBtn.style.display="block";

beriUlasanBtn.onclick=()=>{

window.location.href=

`beri-ulasan.html?id=${pesananId}`;

};

}

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
// FORMAT RUPIAH
// ======================================

function formatRupiah(angka){

return "Rp "+

Number(

angka||0

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
