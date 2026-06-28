// ======================================
// PASARNUSA REGISTER AFFILIATE
// register-affiliate.js
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

document.getElementById(
"registerForm"
);

const nama=

document.getElementById(
"nama"
);

const email=

document.getElementById(
"email"
);

const whatsapp=

document.getElementById(
"whatsapp"
);

const username=

document.getElementById(
"username"
);

const password=

document.getElementById(
"password"
);

const agree=

document.getElementById(
"agree"
);

const btnDaftar=

document.getElementById(
"btnDaftar"
);

const togglePassword=

document.getElementById(
"togglePassword"
);
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

registerAffiliate

);
// ======================================
// REGISTER
// ======================================

async function registerAffiliate(e){

e.preventDefault();

const userNama=

nama.value.trim();

const userEmail=

email.value.trim();

const userWhatsapp=

whatsapp.value.trim();

const userUsername=

username.value.trim().toLowerCase();

const userPassword=

password.value;

if(

!userNama||

!userEmail||

!userWhatsapp||

!userUsername||

!userPassword

){

showToast(

"Lengkapi semua data."

);

return;

}

if(userPassword.length<6){

showToast(

"Password minimal 6 karakter."

);

return;

}

if(!userWhatsapp.startsWith("08")){

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

userEmail,

userPassword

);

await saveAffiliate(

credential.user.uid

);

}catch(error){

console.error(error);

showError(error.code);

}

}
// ======================================
// SAVE AFFILIATE
// ======================================

async function saveAffiliate(uid){

try{

await setDoc(

doc(db,"users",uid),

{

uid,

nama:

nama.value.trim(),

email:

email.value.trim(),

whatsapp:

whatsapp.value.trim(),

username:

username.value.trim().toLowerCase(),

role:"affiliate",

status:"aktif",

saldoKomisi:0,

totalKomisi:0,

totalKlik:0,

totalPenjualan:0,

totalOrder:0,

createdAt:

serverTimestamp()

}

);

await signOut(auth);

showToast(

"Pendaftaran affiliate berhasil."

);

setTimeout(()=>{

window.location.href=

"login.html";

},1500);

}catch(error){

console.error(error);

showToast(

"Gagal menyimpan data affiliate."

);

btnDaftar.disabled=false;

btnDaftar.innerText=

"Daftar Affiliate";

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

"Daftar Affiliate";

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
