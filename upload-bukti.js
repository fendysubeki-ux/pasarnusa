// ======================================
// PASARNUSA UPLOAD BUKTI
// upload-bukti.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

updateDoc,

collection,

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
// CLOUDINARY
// ======================================

const CLOUD_NAME=

"dq8gha9lv";

const UPLOAD_PRESET=

"pasarnusa";
// ======================================
// ELEMENT
// ======================================

const namaBank=

document.getElementById("namaBank");

const nomorRekening=

document.getElementById("nomorRekening");

const atasNama=

document.getElementById("atasNama");

const nomorPesanan=

document.getElementById("nomorPesanan");

const totalBayar=

document.getElementById("totalBayar");

const summaryTotal=

document.getElementById("summaryTotal");

const statusPesanan=

document.getElementById("statusPesanan");

const summaryStatus=

document.getElementById("summaryStatus");

const buktiTransfer=

document.getElementById("buktiTransfer");

const previewBukti=

document.getElementById("previewBukti");

const previewWrapper=

document.getElementById("previewWrapper");

const infoFile=

document.getElementById("infoFile");

const uploadBtn=

document.getElementById("uploadBtn");

const copyRekening=

document.getElementById("copyRekening");

const progressFill=

document.getElementById("uploadProgress");

const progressText=

document.getElementById("progressText");
// ======================================
// VARIABLE
// ======================================

let uid="";

let pesananId="";

let dataPesanan={};

let dataUmkm={};
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

initPreview();

initCopy();

initUpload();

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

if(

dataPesanan.uidPembeli!==uid

){

showToast(

"Akses ditolak."

);

setTimeout(()=>{

window.location.href=

"pesanan-saya.html";

},1500);

return;

}

await loadDataUmkm();

isiData();

}catch(error){

console.error(error);

showToast(

"Gagal memuat pesanan."

);

}

}
// ======================================
// LOAD UMKM
// ======================================

async function loadDataUmkm(){

const snapshot=

await getDoc(

doc(

db,

"users",

dataPesanan.uidUmkm

)

);

if(snapshot.exists()){

dataUmkm=

snapshot.data();

}

}
// ======================================
// TAMPILKAN DATA
// ======================================

function isiData(){

namaBank.innerText=

dataUmkm.namaBank||

"-";

nomorRekening.innerText=

dataUmkm.nomorRekening||

"-";

atasNama.innerText=

dataUmkm.atasNama||

"-";

nomorPesanan.innerText=

pesananId.substring(

0,

8

);

const total=

formatRupiah(

dataPesanan.totalBayar||0

);

totalBayar.innerText=

total;

summaryTotal.innerText=

total;

statusPesanan.innerText=

dataPesanan.status||

"Belum Bayar";

summaryStatus.innerText=

dataPesanan.status||

"Belum Bayar";

}
// ======================================
// PREVIEW
// ======================================

function initPreview(){

buktiTransfer.addEventListener(

"change",

()=>{

const file=

buktiTransfer.files[0];

if(!file)return;

if(

file.size>

2*1024*1024

){

showToast(

"Maksimal ukuran file 2 MB."

);

buktiTransfer.value="";

return;

}

previewBukti.src=

URL.createObjectURL(file);

previewWrapper.style.display=

"block";

infoFile.innerText=

file.name;

});

}
// ======================================
// COPY REKENING
// ======================================

function initCopy(){

copyRekening.addEventListener(

"click",

async()=>{

await navigator.clipboard.writeText(

dataUmkm.nomorRekening||

""

);

showToast(

"Nomor rekening berhasil disalin."

);

});

}
// ======================================
// UPLOAD CLOUDINARY
// ======================================

async function uploadCloudinary(){

const file=

buktiTransfer.files[0];

if(!file){

showToast(

"Pilih bukti transfer."

);

return null;

}

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

progressFill.style.width="15%";

progressText.innerText=

"Mengupload...";

const response=

await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

{

method:"POST",

body:formData

}

);

progressFill.style.width="80%";

const hasil=

await response.json();

if(!hasil.secure_url){

throw new Error(

"Gagal upload gambar."

);

}

progressFill.style.width="100%";

progressText.innerText=

"Upload berhasil.";

return hasil.secure_url;

}
// ======================================
// UPLOAD
// ======================================

function initUpload(){

uploadBtn.addEventListener(

"click",

uploadBukti

);

}

async function uploadBukti(){

try{

uploadBtn.disabled=true;

uploadBtn.innerText=

"Mengupload...";

const url=

await uploadCloudinary();

if(!url){

uploadBtn.disabled=false;

uploadBtn.innerText=

"📤 Upload Bukti";

return;

}

await simpanBukti(url);

}catch(error){

console.error(error);

showToast(

error.message

);

uploadBtn.disabled=false;

uploadBtn.innerText=

"📤 Upload Bukti";

}

}
// ======================================
// SIMPAN
// ======================================

async function simpanBukti(url){

await updateDoc(

doc(

db,

"pesanan",

pesananId

),

{

buktiTransfer:url,

status:

"Menunggu Verifikasi",

statusPembayaran:

"Menunggu Verifikasi",

uploadAt:

serverTimestamp()

}

);

await kirimNotifikasi();

showToast(

"Bukti pembayaran berhasil dikirim."

);

setTimeout(()=>{

window.location.href=

"pesanan-saya.html";

},1200);

}
// ======================================
// NOTIFIKASI
// ======================================

async function kirimNotifikasi(){

await addDoc(

collection(db,"notifikasi"),

{

uid:

dataPesanan.uidPembeli,

judul:

"Pembayaran Dikirim",

pesan:

"Bukti pembayaran berhasil dikirim dan sedang diverifikasi.",

dibaca:false,

createdAt:

serverTimestamp()

}

);

await addDoc(

collection(db,"notifikasi"),

{

uid:

dataPesanan.uidUmkm,

judul:

"Pembayaran Baru",

pesan:

"Ada bukti pembayaran baru yang perlu diverifikasi.",

dibaca:false,

createdAt:

serverTimestamp()

}

);

}
// ======================================
// HELPER
// ======================================

function formatRupiah(angka){

return "Rp "+

Number(

angka||0

).toLocaleString(

"id-ID"

);

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