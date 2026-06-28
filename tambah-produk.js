// ======================================
// PASARNUSA TAMBAH PRODUK
// tambah-produk.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

collection,

addDoc,

doc,

getDoc,

serverTimestamp,

query,

where,

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

document.getElementById("produkForm");

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

const productImage=

document.getElementById("productImage");

const previewContainer=

document.getElementById("previewContainer");

const simpanProduk=

document.getElementById("simpanProduk");
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

initPreview();

form.addEventListener(

"submit",

simpanData

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

}

}
// ======================================
// PREVIEW FOTO
// ======================================

function initPreview(){

productImage.addEventListener(

"change",

()=>{

previewContainer.innerHTML="";

const files=

Array.from(productImage.files);

files.forEach(file=>{

const img=

document.createElement("img");

img.src=

URL.createObjectURL(file);

previewContainer.appendChild(img);

});

});

}
// ======================================
// SIMPAN
// ======================================

async function simpanData(e){

e.preventDefault();

const nama=

namaProduk.value.trim();

const harga=

Number(hargaProduk.value);

const stok=

Number(stokProduk.value);

const berat=

Number(beratProduk.value);

const kategori=

kategoriProduk.value;

const status=

statusProduk.value;

const deskripsi=

deskripsiProduk.value.trim();

const kodeSku=

sku.value.trim();

const files=

Array.from(productImage.files);

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

if(files.length===0){

showToast(

"Pilih minimal satu foto."

);

return;

}

if(files.length>5){

showToast(

"Maksimal 5 foto."

);

return;

}
if(!validasiFoto(files)){

return;

}

await uploadProduk({

nama,

harga,

stok,

berat,

kategori,

status,

deskripsi,

kodeSku,

files

});

}
// ======================================
// VALIDASI FOTO
// ======================================

function validasiFoto(files){

for(const file of files){

if(

!file.type.startsWith("image/")

){

showToast(

"File harus berupa gambar."

);

return false;

}

if(

file.size>

2*1024*1024

){

showToast(

"Ukuran maksimal 2 MB."

);

return false;

}

}

return true;

}
// ======================================
// UPLOAD CLOUDINARY
// ======================================

async function uploadProduk(data){

try{

simpanProduk.disabled=true;

simpanProduk.innerText=

"Mengupload...";

const userSnap=

await getDoc(

doc(

db,

"users",

auth.currentUser.uid

)

);

if(!userSnap.exists()){

showToast(

"Data UMKM tidak ditemukan."

);

return;

}

const userData=

userSnap.data();

if(userData.role!=="umkm"){

showToast(

"Akses hanya untuk UMKM."

);

return;

}

const cekProduk=

await getDocs(

query(

collection(db,"produk"),

where(

"uidUmkm",

"==",

auth.currentUser.uid

),

where(

"namaProduk",

"==",

data.nama

)

)

);

if(!cekProduk.empty){

showToast(

"Nama produk sudah digunakan."

);

return;

}

const gambar=[];

for(const file of data.files){

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

gambar.push(

hasil.secure_url

);

}
await addDoc(

collection(db,"produk"),

{

uid:

auth.currentUser.uid,

uidUmkm:

auth.currentUser.uid,

namaToko:

userData.namaToko||

userData.nama||

"",

whatsapp:

userData.whatsapp||"",

provinsi:

userData.provinsi||"",

kabupaten:

userData.kabupaten||"",

kecamatan:

userData.kecamatan||"",

desa:

userData.desa||"",

sku:

data.kodeSku,

namaProduk:

data.nama,

slug:

data.nama

.toLowerCase()

.replace(/\s+/g,"-"),

kategori:

data.kategori,

harga:

data.harga,

stok:

data.stok,

berat:

data.berat,

deskripsi:

data.deskripsi,

gambar:

gambar,

rating:0,

totalReview:0,

terjual:0,

followers:0,

affiliateAktif:true,

komisiAffiliate:5,

status:

data.stok<=0

?

"Stok Habis"

:

data.status,

createdAt:

serverTimestamp()

}

);

showToast(

"Produk berhasil ditambahkan."

);

setTimeout(()=>{

window.location.href=

"produk-saya.html";

},1200);

}catch(error){

console.error(error);

showToast(

error.message||

"Gagal menyimpan produk."

);

}finally{

simpanProduk.disabled=false;

simpanProduk.innerText=

"💾 Simpan Produk";

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