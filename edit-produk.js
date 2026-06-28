// ======================================
// PASARNUSA EDIT PRODUK
// edit-produk.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

getDoc,

updateDoc,

deleteDoc,
collection,
query,
where,
getDocs, 
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

const form=

document.getElementById("editProdukForm");

const namaProduk=

document.getElementById("namaProduk");

const sku=

document.getElementById("sku");

const hargaProduk=

document.getElementById("hargaProduk");

const stokProduk=

document.getElementById("stokProduk");

const beratProduk=

document.getElementById("beratProduk");

const kategoriProduk=

document.getElementById("kategoriProduk");

const statusProduk=

document.getElementById("statusProduk");

const deskripsiProduk=

document.getElementById("deskripsiProduk");

const gambarProduk=

document.getElementById("gambarProduk");

const previewContainer=

document.getElementById("previewContainer");

const updateProduk=

document.getElementById("updateProduk");

const hapusProduk=

document.getElementById("hapusProduk");
// ======================================
// VARIABLE
// ======================================

let uid="";

let idProduk="";

let dataProduk={};

let gambarLama=[];
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

initPreview();

form.addEventListener(

"submit",

updateData

);

hapusProduk.addEventListener(

"click",

hapusData

);

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
// ID PRODUK
// ======================================

function ambilIdProduk(){

idProduk=

new URLSearchParams(

window.location.search

).get("id");

if(!idProduk){

window.location.href=

"produk-saya.html";

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

"produk-saya.html";

},1500);

return;

}

dataProduk=

snapshot.data();

if(

dataProduk.uidUmkm!==uid

){

showToast(

"Akses ditolak."

);

setTimeout(()=>{

window.location.href=

"produk-saya.html";

},1500);

return;

}

gambarLama=

dataProduk.gambar||[];

isiForm();

loadPreview();

loadStatistik();

}catch(error){

console.error(error);

showToast(

"Gagal memuat produk."

);

}

}
// ======================================
// FORM
// ======================================

function isiForm(){

namaProduk.value=

dataProduk.namaProduk||"";

sku.value=

dataProduk.sku||"";

hargaProduk.value=

dataProduk.harga||0;

stokProduk.value=

dataProduk.stok||0;

beratProduk.value=

dataProduk.berat||0;

kategoriProduk.value=

dataProduk.kategori||

"Lainnya";

statusProduk.value=

dataProduk.status||

"Aktif";

deskripsiProduk.value=

dataProduk.deskripsi||

"";

}
// ======================================
// STATISTIK
// ======================================

function loadStatistik(){

document.getElementById(

"ratingProduk"

).innerText=

Number(

dataProduk.rating||0

).toFixed(1);

document.getElementById(

"totalReview"

).innerText=

dataProduk.totalReview||0;

document.getElementById(

"produkTerjual"

).innerText=

dataProduk.terjual||0;

document.getElementById(

"statusInfo"

).innerText=

dataProduk.status||

"Aktif";

}
// ======================================
// PREVIEW
// ======================================

function loadPreview(){

previewContainer.innerHTML="";

gambarLama.forEach(url=>{

previewContainer.innerHTML+=`

<img

src="${url}"

loading="lazy">

`;

});

}
// ======================================
// PREVIEW BARU
// ======================================

function initPreview(){

gambarProduk.addEventListener(

"change",

()=>{

previewContainer.innerHTML="";

Array.from(

gambarProduk.files

).forEach(file=>{

const img=

document.createElement("img");

img.src=

URL.createObjectURL(file);

previewContainer.appendChild(img);

});

});

}
// ======================================
// UPDATE
// ======================================

async function updateData(e){

e.preventDefault();

const nama=

namaProduk.value.trim();

const kodeSku=

sku.value.trim();

const harga=

Number(hargaProduk.value);

const stok=

Number(stokProduk.value);

const berat=

Number(beratProduk.value);

const kategori=

kategoriProduk.value;

const deskripsi=

deskripsiProduk.value.trim();

let status=

statusProduk.value;

if(

!nama||

!harga||

!stok||

!berat||

!kategori||

!deskripsi

){

showToast(

"Lengkapi semua data."

);

return;

}

if(stok<=0){

status="Stok Habis";

}

if(harga<1000){

showToast(

"Harga minimal Rp1.000."

);

return;

}

if(berat<1){

showToast(

"Berat minimal 1 gram."

);

return;

}

await simpanProduk({

nama,

kodeSku,

harga,

stok,

berat,

kategori,

deskripsi,

status

});

}
// ======================================
// UPLOAD
// ======================================

async function uploadCloudinary(){
if(gambarProduk.files.length>5){

showToast(

"Maksimal 5 foto."

);

throw new Error(

"Maksimal 5 foto."

);

}
if(

gambarProduk.files.length===0

){

return gambarLama;

}

const urls=[];

for(const file of gambarProduk.files){

const formData=

new FormData();

formData.append(

"file",

file

);

formData.append(

"upload_preset",

"pasarnusa"

);

const response=

await fetch(

"https://api.cloudinary.com/v1_1/dq8gha9lv/image/upload",

{

method:"POST",

body:formData

}

);

const hasil=

await response.json();

if(!hasil.secure_url){

throw new Error(

"Gagal upload gambar."

);

}

urls.push(

hasil.secure_url

);

}

return urls;

}
// ======================================
// SIMPAN
// ======================================

async function simpanProduk(data){

try{

updateProduk.disabled=true;

updateProduk.innerText=

"Menyimpan...";

const gambar=

await uploadCloudinary();

await updateDoc(

doc(

db,

"produk",

idProduk

),

{

namaProduk:

data.nama,

sku:

data.kodeSku,

harga:

data.harga,

stok:

data.stok,

berat:

data.berat,

kategori:

data.kategori,

deskripsi:

data.deskripsi,

status:

data.status,

gambar:

gambar,

slug:

data.nama

.toLowerCase()

.replace(/\s+/g,"-"),

search:[

data.nama.toLowerCase(),

data.kategori.toLowerCase()

],

updatedAt:

serverTimestamp()

}

);

showToast(

"Produk berhasil diperbarui."

);

setTimeout(()=>{

window.location.href=

"produk-saya.html";

},1200);

}catch(error){

console.error(error);

showToast(

"Gagal memperbarui produk."

);

}finally{

updateProduk.disabled=false;

updateProduk.innerText=

"💾 Simpan Perubahan";

}

}
// ======================================
// HAPUS
// ======================================

async function hapusData(){

const yakin=

confirm(

"Yakin ingin menghapus produk ini?"

);

if(!yakin)return;

try{

const snapshot=

await getDocs(

query(

collection(db,"pesanan"),

where(

"uidUmkm",

"==",

uid

)

)

);

let pernahDibeli=false;

snapshot.forEach(doc=>{

const pesanan=

doc.data();

(pesanan.items||[])

.forEach(item=>{

if(item.id===idProduk){

pernahDibeli=true;

}

});

});

if(pernahDibeli){

showToast(

"Produk sudah memiliki riwayat transaksi dan tidak dapat dihapus."

);

return;

}

await deleteDoc(

doc(

db,

"produk",

idProduk

)

);

showToast(

"Produk berhasil dihapus."

);

setTimeout(()=>{

window.location.href=

"produk-saya.html";

},1200);

}catch(error){

console.error(error);

showToast(

"Gagal menghapus produk."

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