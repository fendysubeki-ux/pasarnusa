// ======================================
// PASARNUSA ADMIN DASHBOARD
// dashboard-admin.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {

getFirestore,

collection,

getDocs,

query,

where

}

from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {

getAuth,

signOut

}

from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
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

const logoutBtn=

document.getElementById("logoutBtn");

const totalUser=

document.getElementById("totalUser");

const totalUmkm=

document.getElementById("totalUmkm");

const totalAffiliate=

document.getElementById("totalAffiliate");

const totalProduk=

document.getElementById("totalProduk");

const totalPesanan=

document.getElementById("totalPesanan");

const totalTransaksi=

document.getElementById("totalTransaksi");

const pendapatanPlatform=

document.getElementById("pendapatanPlatform");

const pendapatanUmkm=

document.getElementById("pendapatanUmkm");

const komisiAffiliate=

document.getElementById("komisiAffiliate");

const produkPending=

document.getElementById("produkPending");

const umkmPending=

document.getElementById("umkmPending");

const pesananPending=

document.getElementById("pesananPending");

const withdrawPending=

document.getElementById("withdrawPending");

const voucherAktif=

document.getElementById("voucherAktif");
// ======================================
// VARIABLE
// ======================================

let semuaUser=[];

let semuaProduk=[];

let semuaPesanan=[];

let semuaAffiliate=[];

let semuaVoucher=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkAdmin();

await loadDashboard();

initButton();

}
// ======================================
// LOGIN ADMIN
// ======================================

async function checkAdmin(){

await auth.authStateReady();

if(!auth.currentUser){

window.location.href=

"login.html";

return;

}

}
// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard(){

try{

await Promise.all([

loadUser(),

loadProduk(),

loadPesanan(),

loadAffiliate(),

loadVoucher()

]);

updateDashboard();

}catch(error){

console.error(error);

showToast(

"Gagal memuat dashboard."

);

}

}
// ======================================
// LOAD USER
// ======================================

async function loadUser(){

const snap=

await getDocs(

collection(db,"users")

);

semuaUser=[];

snap.forEach(docSnap=>{

semuaUser.push({

id:docSnap.id,

...docSnap.data()

});

});

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

const snap=

await getDocs(

collection(db,"produk")

);

semuaProduk=[];

snap.forEach(docSnap=>{

semuaProduk.push({

id:docSnap.id,

...docSnap.data()

});

});

}
// ======================================
// LOAD PESANAN
// ======================================

async function loadPesanan(){

const snap=

await getDocs(

collection(db,"pesanan")

);

semuaPesanan=[];

snap.forEach(docSnap=>{

semuaPesanan.push({

id:docSnap.id,

...docSnap.data()

});

});

}
// ======================================
// LOAD AFFILIATE
// ======================================

async function loadAffiliate(){

const snap=

await getDocs(

collection(db,"affiliate")

);

semuaAffiliate=[];

snap.forEach(docSnap=>{

semuaAffiliate.push({

id:docSnap.id,

...docSnap.data()

});

});

}
// ======================================
// LOAD VOUCHER
// ======================================

async function loadVoucher(){

const snap=

await getDocs(

collection(db,"voucher")

);

semuaVoucher=[];

snap.forEach(docSnap=>{

semuaVoucher.push({

id:docSnap.id,

...docSnap.data()

});

});

}
// ======================================
// UPDATE DASHBOARD
// ======================================

function updateDashboard(){

totalUser.innerText=

semuaUser.length;

totalUmkm.innerText=

semuaUser.filter(

item=>item.role==="umkm"

).length;

totalAffiliate.innerText=

semuaAffiliate.length;

totalProduk.innerText=

semuaProduk.length;

totalPesanan.innerText=

semuaPesanan.length;

const total=

semuaPesanan.reduce(

(sum,item)=>

sum+Number(

item.totalBayar||0

),

0

);

totalTransaksi.innerText=

formatRupiah(total);

pendapatanPlatform.innerText=

formatRupiah(

total*0.05

);

pendapatanUmkm.innerText=

formatRupiah(

total*0.95

);

komisiAffiliate.innerText=

formatRupiah(

semuaAffiliate.reduce(

(sum,item)=>

sum+Number(

item.komisi||0

),

0

)

);

produkPending.innerText=

semuaProduk.filter(

item=>item.status==="Pending"

).length;

umkmPending.innerText=

semuaUser.filter(

item=>

item.role==="umkm" &&

item.status==="Pending"

).length;

pesananPending.innerText=

semuaPesanan.filter(

item=>

item.status==="Menunggu Verifikasi"

).length;

withdrawPending.innerText=

semuaAffiliate.filter(

item=>

item.withdrawStatus==="Pending"

).length;

voucherAktif.innerText=

semuaVoucher.filter(

item=>item.aktif

).length;

}
// ======================================
// LOGOUT
// ======================================

function initButton(){

logoutBtn.onclick=logoutAdmin;

}

async function logoutAdmin(){

const yakin=

confirm(

"Yakin ingin logout?"

);

if(!yakin)return;

try{

await signOut(auth);

window.location.href=

"login.html";

}catch(error){

console.error(error);

showToast(

"Gagal logout."

);

}

}
// ======================================
// FORMAT RUPIAH
// ======================================

function formatRupiah(nilai){

return "Rp "+

Number(

nilai||0

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
// ======================================
// AUTO REFRESH
// ======================================

setInterval(

async()=>{

await loadDashboard();

},

30000

);
// ======================================
// ERROR
// ======================================

window.addEventListener(

"error",

(event)=>{

console.error(event.error);

showToast(

"Terjadi kesalahan pada dashboard."

);

}

);
