import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getAuth,
signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
getFirestore,
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {

apiKey:"AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
authDomain:"pasarnusa-18aa0.firebaseapp.com",
projectId:"pasarnusa-18aa0",
storageBucket:"pasarnusa-18aa0.firebasestorage.app",
messagingSenderId:"866998011671",
appId:"1:866998011671:web:5555115feb82741ab55952"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

async function login(){

const email =
document.getElementById("email")
.value.trim();

const password =
document.getElementById("password")
.value;

if(!email || !password){

alert("Email dan password wajib diisi");

return;

}

const btn =
document.getElementById("btnLogin");

try{

btn.disabled = true;
btn.innerText = "Memproses...";

const credential =
await signInWithEmailAndPassword(
auth,
email,
password
);

const uid =
credential.user.uid;

const userSnap =
await getDoc(
doc(db,"users",uid)
);

if(!userSnap.exists()){

alert("Data user tidak ditemukan");

return;

}

const user =
userSnap.data();

localStorage.setItem(
"uid",
uid
);

localStorage.setItem(
"role",
user.role || "user"
);

localStorage.setItem(
"nama",
user.nama || ""
);

localStorage.setItem(
"namaUmkm",
user.namaUmkm || ""
);

if(user.role === "admin"){

window.location.href =
"admin.html";

}
else if(user.role === "umkm"){

window.location.href =
"dashboard-umkm.html";

}
else if(user.role === "affiliate"){

window.location.href =
"affiliate-dashboard.html";

}
else{

window.location.href =
"index.html";

}

}
catch(error){

console.error(error);

alert("Email atau password salah");

}
finally{

btn.disabled = false;

btn.innerText = "Masuk";

}

}

document
.getElementById("btnLogin")
.addEventListener(
"click",
login
);

document
.addEventListener(
"keydown",
(e)=>{

if(e.key === "Enter"){

login();

}

}
);