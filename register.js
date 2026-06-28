// ======================================
// PASARNUSA REGISTER UMKM
// register.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

doc,

setDoc,

serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getAuth,

createUserWithEmailAndPassword,

signOut

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

const auth=

getAuth(app);

const db=

getFirestore(app);
// ======================================
// ELEMENT
// ======================================

const form=

document.getElementById("registerForm");

const nama=

document.getElementById("nama");

const namaToko=

document.getElementById("namaToko");

const email=

document.getElementById("email");

const whatsapp=

document.getElementById("whatsapp");

const alamat=

document.getElementById("alamat");

const provinsi=

document.getElementById("provinsi");

const kabupaten=

document.getElementById("kabupaten");

const kecamatan=

document.getElementById("kecamatan");

const desa=

document.getElementById("desa");

const password=

document.getElementById("password");

const agree=

document.getElementById("agree");

const btnDaftar=

document.getElementById("btnDaftar");

const togglePassword=

document.getElementById("togglePassword");
// ======================================
// SHOW PASSWORD
// ======================================

togglePassword.addEventListener(

"click",

()=>{

if(password.type==="password"){

password.type="text";

togglePassword.innerText="🙈";

}else{

password.type="password";

togglePassword.innerText="👁️";

}

});
// ======================================
// START
// ======================================

form.addEventListener(

"submit",

registerUmkm

);
// ======================================
// REGISTER
// ======================================

async function registerUmkm(e){

e.preventDefault();

if(

!nama.value.trim()||

!namaToko.value.trim()||

!email.value.trim()||

!whatsapp.value.trim()||

!alamat.value.trim()||

!provinsi.value.trim()||

!kabupaten.value.trim()||

!kecamatan.value.trim()||

!desa.value.trim()||

!password.value

){

showToast(

"Lengkapi semua data."

);

return;

}

if(password.value.length<6){

showToast(

"Password minimal 6 karakter."

);

return;

}

if(

!whatsapp.value.startsWith("08")

){

showToast(

"Nomor WhatsApp harus diawali 08."

);

return;

}

if(!agree.checked){

showToast(

"Setujui syarat dan ketentuan."

);

return;

}

btnDaftar.disabled=true;

btnDaftar.innerText=

"Mendaftarkan...";

try{

const credential=

await createUserWithEmailAndPassword(

auth,

email.value.trim(),

password.value

);

await saveUmkm(

credential.user.uid

);

}catch(error){

console.error(error);

showError(error.code);

}

}
// ======================================
// SAVE UMKM
// ======================================

async function saveUmkm(uid){

try{

await setDoc(

doc(db,"users",uid),

{

uid,

nama:

nama.value.trim(),

namaToko:

namaToko.value.trim(),

email:

email.value.trim(),

whatsapp:

whatsapp.value.trim(),

alamat:

alamat.value.trim(),

provinsi:

provinsi.value.trim(),

kabupaten:

kabupaten.value.trim(),

kecamatan:

kecamatan.value.trim(),

desa:

desa.value.trim(),

role:"umkm",

status:"aktif",

fotoToko:"",

logoToko:"",

deskripsi:"",

rating:0,

totalProduk:0,

totalPesanan:0,

totalPenjualan:0,

pendapatan:0,

createdAt:

serverTimestamp()

}

);

await signOut(auth);

showToast(

"Pendaftaran UMKM berhasil."

);

setTimeout(()=>{

window.location.href=

"login.html";

},1500);

}catch(error){

console.error(error);

showToast(

"Gagal menyimpan data UMKM."

);

btnDaftar.disabled=false;

btnDaftar.innerText=

"🏪 Daftarkan UMKM";

}

}
// ======================================
// ERROR
// ======================================

function showError(code){

let message=

"Pendaftaran gagal.";

switch(code){

case "auth/email-already-in-use":

message=

"Email sudah digunakan.";

break;

case "auth/invalid-email":

message=

"Format email tidak valid.";

break;

case "auth/weak-password":

message=

"Password terlalu lemah.";

break;

case "auth/network-request-failed":

message=

"Periksa koneksi internet.";

break;

default:

message=

"Terjadi kesalahan.";

}

showToast(message);

btnDaftar.disabled=false;

btnDaftar.innerText=

"🏪 Daftarkan UMKM";

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
