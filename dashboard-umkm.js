// ======================================
// PASARNUSA DASHBOARD UMKM
// dashboard-umkm.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

collection,

query,

where,

getDocs,

doc,

getDoc

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getAuth,

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

const db=

getFirestore(app);

const auth=

getAuth(app);
// ======================================
// ELEMENT
// ======================================

const namaToko=

document.getElementById("namaToko");

const totalProduk=

document.getElementById("totalProduk");

const produkAktif=

document.getElementById("produkAktif");

const produkHabis=

document.getElementById("produkHabis");

const totalPesanan=

document.getElementById("totalPesanan");

const totalPendapatan=

document.getElementById("totalPendapatan");

const ratingToko=

document.getElementById("ratingToko");

const produkTerlaris=

document.getElementById("produkTerlaris");

const stokMenipis=

document.getElementById("stokMenipis");

const aktivitasTerbaru=

document.getElementById("aktivitasTerbaru");

const reviewTerbaru=

document.getElementById("reviewTerbaru");

const logoutBtn=

document.getElementById("logoutBtn");
// ======================================
// VARIABLE
// ======================================

let uid="";

let dataToko={};

let daftarProduk=[];

let daftarPesanan=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initDashboard

);

async function initDashboard(){

await checkLogin();

await loadProfil();

await loadProduk();

await loadPesanan();

loadAktivitas();
loadReview();
initLogout();

}
// ======================================
// CHECK LOGIN
// ======================================

async function checkLogin(){

await auth.authStateReady();

if(!auth.currentUser){

window.location.href="login.html";

return;

}

uid=auth.currentUser.uid;

}
// ======================================
// LOAD PROFIL
// ======================================

async function loadProfil(){

try{

const snapshot=

await getDoc(

doc(db,"users",uid)

);

if(!snapshot.exists()){

showToast(

"Data toko tidak ditemukan."

);

return;

}

dataToko=

snapshot.data();

if(dataToko.role!=="umkm"){

showToast(

"Akun ini bukan akun UMKM."

);

setTimeout(()=>{

window.location.href="login.html";

},1500);

return;

}
namaToko.innerText=

dataToko.namaToko||

dataToko.nama||

"UMKM";

ratingToko.innerText=

Number(

dataToko.rating||0

).toFixed(1);

document.title=

`${dataToko.namaToko||"Dashboard"} | PasarNusa`;

}catch(error){

console.error(error);

showToast(

"Gagal memuat profil."

);

}

}
// ======================================
// LOAD PRODUK
// ======================================

async function loadProduk(){

try{

const snapshot=

await getDocs(

query(

collection(db,"produk"),

where("uidUmkm","==",uid)

)

);

daftarProduk=[];

snapshot.forEach(doc=>{

daftarProduk.push({

id:doc.id,

...doc.data()

});

});

updateStatistikProduk();

loadProdukTerlaris();

loadStokMenipis();

}catch(error){

console.error(error);

showToast(

"Gagal memuat produk."

);

}

}
// ======================================
// STATISTIK PRODUK
// ======================================

function updateStatistikProduk(){

totalProduk.innerText=

daftarProduk.length;

produkAktif.innerText=

daftarProduk.filter(item=>

(item.status||"Aktif")==="Aktif"

).length;

produkHabis.innerText=

daftarProduk.filter(item=>

Number(item.stok||0)<=5

).length;

}
// ======================================
// LOAD PESANAN
// ======================================

async function loadPesanan(){

try{

const snapshot=

await getDocs(

query(

collection(db,"pesanan"),

where("uidUmkm","==",uid)

)

);

daftarPesanan=[];

snapshot.forEach(doc=>{

daftarPesanan.push({

id:doc.id,

...doc.data()

});

});

updateStatistikPesanan();

}catch(error){

console.error(error);

showToast(

"Gagal memuat pesanan."

);

}

}
// ======================================
// STATISTIK PESANAN
// ======================================

function updateStatistikPesanan(){

totalPesanan.innerText=

daftarPesanan.length;

let pendapatan=0;

daftarPesanan.forEach(item=>{

if(item.status==="Selesai"){

pendapatan+=

Number(

item.totalBayar||0

);

}

});

totalPendapatan.innerText=

formatRupiah(pendapatan);

}
// ======================================
// PRODUK TERLARIS
// ======================================

function loadProdukTerlaris(){

const data=

[...daftarProduk]

.sort(

(a,b)=>

Number(b.terjual||0)-

Number(a.terjual||0)

)

.slice(0,4);

if(data.length===0){

produkTerlaris.innerHTML=

emptyCard(

"Belum ada produk terjual."

);

return;

}

produkTerlaris.innerHTML="";

data.forEach(item=>{

produkTerlaris.innerHTML+=`

<div class="dashboard-card">

<h3>

${item.namaProduk}

</h3>

<p>

Terjual
${item.terjual||0}

</p>

</div>

`;

});

}
// ======================================
// STOK MENIPIS
// ======================================

function loadStokMenipis(){

const data=

daftarProduk.filter(item=>

Number(item.stok||0)<=5

);

if(data.length===0){

stokMenipis.innerHTML=

emptyCard(

"Semua stok masih aman."

);

return;

}

stokMenipis.innerHTML="";

data.forEach(item=>{

stokMenipis.innerHTML+=`

<div class="dashboard-card">

<h3>

${item.namaProduk}

</h3>

<p>

Stok

${item.stok}

</p>

</div>

`;

});

}
// ======================================
// AKTIVITAS
// ======================================

function loadAktivitas(){

aktivitasTerbaru.innerHTML=`

<div class="dashboard-card">

<h3>

📦 ${daftarPesanan.length}

</h3>

<p>

Total Pesanan

</p>

</div>

<div class="dashboard-card">

<h3>

🛍 ${daftarProduk.length}

</h3>

<p>

Total Produk

</p>

</div>

<div class="dashboard-card">

<h3>

⭐ ${Number(dataToko.rating||0).toFixed(1)}

</h3>

<p>

Rating Toko

</p>

</div>

`;

}
// ======================================
// REVIEW
// ======================================

function loadReview(){

reviewTerbaru.innerHTML=

emptyCard(

"Belum ada review terbaru."

);

}
// ======================================
// LOGOUT
// ======================================

function initLogout(){

if(!logoutBtn)return;

logoutBtn.addEventListener(

"click",

async()=>{

const yakin=

confirm(

"Yakin ingin logout?"

);

if(!yakin)return;

await signOut(auth);

localStorage.clear();

window.location.href=

"login.html";

});

}
// ======================================
// EMPTY CARD
// ======================================

function emptyCard(text){

return`

<div class="empty-state">

<h3>

📭

</h3>

<p>

${text}

</p>

</div>

`;

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
// FORMAT RUPIAH
// ======================================

function formatRupiah(angka){

return "Rp " +

Number(angka||0)

.toLocaleString("id-ID");

}
// ======================================
// REFRESH
// ======================================

async function refreshDashboard(){

await loadProfil();

await loadProduk();

await loadPesanan();

loadAktivitas();

loadReview();

}