// ======================================
// PASARNUSA DETAIL PESANAN UMKM
// detail-pesanan-umkm.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

updateDoc,

addDoc,

collection,

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

const app=initializeApp(firebaseConfig);

const db=getFirestore(app);

const auth=getAuth(app);
// ======================================
// ELEMENT
// ======================================

const nomorPesanan=
document.getElementById("nomorPesanan");

const tanggalPesanan=
document.getElementById("tanggalPesanan");

const statusPesanan=
document.getElementById("statusPesanan");

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

const kurir=
document.getElementById("kurir");

const nomorResi=
document.getElementById("nomorResi");

const statusBaru=
document.getElementById("statusBaru");

const subtotal=
document.getElementById("subtotal");

const ongkir=
document.getElementById("ongkir");

const diskon=
document.getElementById("diskon");

const totalBayar=
document.getElementById("totalBayar");

const statusPembayaran=
document.getElementById("statusPembayaran");

const verifikasiBtn=
document.getElementById("verifikasiBtn");

const tolakBtn=
document.getElementById("tolakBtn");

const simpanBtn=
document.getElementById("simpanBtn");

const chatPembeli=
document.getElementById("chatPembeli");
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

ambilId();

await loadPesanan();

initButton();

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

function ambilId(){

pesananId=

new URLSearchParams(

window.location.search

).get("id");

if(!pesananId){

window.location.href=

"pesanan-masuk.html";

}

}
// ======================================
// LOAD PESANAN
// ======================================

async function loadPesanan(){

try{

const snap=

await getDoc(

doc(db,"pesanan",pesananId)

);

if(!snap.exists()){

showToast(

"Pesanan tidak ditemukan."

);

return;

}

dataPesanan=snap.data();

if(dataPesanan.uidUmkm!==uid){

showToast(

"Akses ditolak."

);

window.location.href=

"pesanan-masuk.html";

return;

}

isiData();

renderProduk();

renderBukti();

}catch(error){

console.error(error);

showToast(

"Gagal memuat data."

);

}

}
// ======================================
// ISI DATA
// ======================================

function isiData(){

nomorPesanan.innerText=

pesananId.substring(0,8);

tanggalPesanan.innerText=

formatTanggal(

dataPesanan.createdAt

);

statusPesanan.innerText=

dataPesanan.status||

"Belum Bayar";

namaPembeli.innerText=

dataPesanan.namaPembeli||

"-";

whatsappPembeli.innerText=

dataPesanan.whatsapp||

"-";

alamatPembeli.innerText=

dataPesanan.alamat||

"-";

kurir.value=

dataPesanan.kurir||

"JNE";

nomorResi.value=

dataPesanan.resi||

"";

statusBaru.value=

dataPesanan.status||

"Belum Bayar";

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

statusPembayaran.innerText=

dataPesanan.statusPembayaran||

"Belum Bayar";

chatPembeli.href=

`https://wa.me/${

dataPesanan.whatsapp

||""}`;

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

${formatRupiah(qty*harga)}

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

🔍 Lihat Bukti Transfer

</a>

`;

}
// ======================================
// BUTTON
// ======================================

function initButton(){

verifikasiBtn.onclick=

verifikasiPembayaran;

tolakBtn.onclick=

tolakPembayaran;

simpanBtn.onclick=

simpanPerubahan;

}
// ======================================
// VERIFIKASI
// ======================================

async function verifikasiPembayaran(){

try{

await updateDoc(

doc(db,"pesanan",pesananId),

{

status:"Diproses",

statusPembayaran:"Lunas"

}

);

await kirimNotifikasi(

"Pembayaran Diverifikasi",

"Pembayaran Anda telah diverifikasi. Pesanan sedang diproses."

);

showToast(

"Pembayaran berhasil diverifikasi."

);

await loadPesanan();

}catch(error){

console.error(error);

showToast(

"Gagal memverifikasi pembayaran."

);

}

}
// ======================================
// TOLAK
// ======================================

async function tolakPembayaran(){

try{

await updateDoc(

doc(db,"pesanan",pesananId),

{

status:"Ditolak",

statusPembayaran:"Ditolak"

}

);

await kirimNotifikasi(

"Pembayaran Ditolak",

"Pembayaran Anda ditolak. Silakan cek kembali bukti pembayaran."

);

showToast(

"Pembayaran berhasil ditolak."

);

await loadPesanan();

}catch(error){

console.error(error);

showToast(

"Gagal menolak pembayaran."

);

}

}
// ======================================
// SIMPAN
// ======================================

async function simpanPerubahan(){

try{

if(

statusBaru.value==="Dikirim"

&&

nomorResi.value.trim()===""

){

showToast(

"Nomor resi wajib diisi."

);

return;

}

await updateDoc(

doc(db,"pesanan",pesananId),

{

status:statusBaru.value,

kurir:kurir.value,

resi:nomorResi.value.trim()

}

);

await kirimNotifikasi(

"Status Pesanan",

`Status pesanan Anda berubah menjadi ${statusBaru.value}.`

);

showToast(

"Perubahan berhasil disimpan."

);

await loadPesanan();

}catch(error){

console.error(error);

showToast(

"Gagal menyimpan perubahan."

);

}

}
// ======================================
// NOTIFIKASI
// ======================================

async function kirimNotifikasi(

judul,

pesan

){

await addDoc(

collection(db,"notifikasi"),

{

uid:

dataPesanan.uidPembeli,

judul,

pesan,

dibaca:false,

createdAt:

serverTimestamp()

}

);

}
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
