// ======================================
// PASARNUSA LOGIN
// login.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getAuth,

signInWithEmailAndPassword,

setPersistence,

browserLocalPersistence,

browserSessionPersistence

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

getFirestore,

doc,

getDoc

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
"loginForm"
);

const email=

document.getElementById(
"email"
);

const password=

document.getElementById(
"password"
);

const btnLogin=

document.getElementById(
"btnLogin"
);

const remember=

document.getElementById(
"rememberMe"
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

if(

password.type==="password"

){

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

loginUser

);
// ======================================
// LOGIN
// ======================================

async function loginUser(e){

e.preventDefault();

const userEmail=

email.value.trim();

const userPassword=

password.value;

if(

userEmail===""||

userPassword===""

){

alert(

"Lengkapi email dan password."

);

return;

}

btnLogin.disabled=true;

btnLogin.innerText=

"Memproses...";

try{

await setPersistence(

auth,

remember.checked

?

browserLocalPersistence

:

browserSessionPersistence

);

const credential=

await signInWithEmailAndPassword(

auth,

userEmail,

userPassword

);

const user=

credential.user;

loadRole(user.uid);

}catch(error){

console.error(error);

showError(error.code);

btnLogin.disabled=false;

btnLogin.innerText="Masuk";

}

}
// ======================================
// LOAD ROLE
// ======================================

async function loadRole(uid){

try{

const snapshot=

await getDoc(

doc(db,"users",uid)

);

if(!snapshot.exists()){

throw new Error(

"DATA_NOT_FOUND"

);

}

const data=

snapshot.data();

localStorage.setItem(

"uid",

uid

);

localStorage.setItem(

"role",

data.role||"user"

);

localStorage.setItem(

"nama",

data.nama||""

);

redirectRole(

data.role

);

}catch(error){

console.error(error);

alert(

"Gagal mengambil data pengguna."

);

btnLogin.disabled=false;

btnLogin.innerText="Masuk";

}

}
// ======================================
// REDIRECT
// ======================================

function redirectRole(role){

switch(role){

case "admin":

window.location.href=

"admin/dashboard.html";

break;

case "umkm":

window.location.href=

"dashboard-umkm.html";

break;

case "affiliate":

window.location.href=

"dashboard-affiliate.html";

break;

default:

window.location.href=

"index.html";

}

}
// ======================================
// ERROR
// ======================================

function showError(code){

let message="Terjadi kesalahan.";

switch(code){

case "auth/invalid-email":

message="Format email tidak valid.";

break;

case "auth/user-not-found":

message="Email belum terdaftar.";

break;

case "auth/wrong-password":

message="Password yang dimasukkan salah.";

break;

case "auth/invalid-credential":

message="Email atau password salah.";

break;

case "auth/too-many-requests":

message="Terlalu banyak percobaan login. Coba beberapa saat lagi.";

break;

case "auth/network-request-failed":

message="Periksa koneksi internet Anda.";

break;

default:

message="Login gagal. Silakan coba lagi.";

}

showToast(message);

btnLogin.disabled=false;

btnLogin.innerText="Masuk";

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
