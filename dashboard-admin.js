import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
getAuth
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {

apiKey:"AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
authDomain:"pasarnusa-18aa0.firebaseapp.com",
projectId:"pasarnusa-18aa0",
storageBucket:"pasarnusa-18aa0.firebasestorage.app",
messagingSenderId:"866998011671",
appId:"1:866998011671:web:5555115feb82741ab55952"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

await auth.authStateReady();

if(!auth.currentUser){

window.location.href = "login.html";

throw new Error("Belum login");

}

const role = localStorage.getItem("role");

if(role !== "admin"){

alert("Akses khusus admin");

window.location.href = "index.html";

throw new Error("Bukan admin");

}

async function loadDashboard(){

try{

let totalProduk = 0;
let totalPesanan = 0;
let totalUmkm = 0;
let pesananHariIni = 0;
let totalTransaksi = 0;
let produkHabis = 0;

const hariIni =
new Date().toDateString();

/* PRODUK */

const produkSnapshot =
await getDocs(
collection(db,"produk")
);

produkSnapshot.forEach((doc)=>{

const data = doc.data();

totalProduk++;

if(
Number(data.stok || 0) <= 0
){

produkHabis++;

}

});

/* PESANAN */

const pesananSnapshot =
await getDocs(
collection(db,"pesanan")
);

pesananSnapshot.forEach((doc)=>{

const data = doc.data();

totalPesanan++;

if(
data.status === "Selesai"
){

totalTransaksi +=
Number(data.totalBayar || 0);

}

if(data.createdAt?.seconds){

const tanggal =
new Date(
data.createdAt.seconds * 1000
);

if(
tanggal.toDateString() === hariIni
){

pesananHariIni++;

}

}

});

/* USERS */

const usersSnapshot =
await getDocs(
collection(db,"users")
);

usersSnapshot.forEach((doc)=>{

const data = doc.data();

if(
data.role === "umkm"
){

totalUmkm++;

}

});

/* TAMPILKAN */

document.getElementById(
"totalProduk"
).innerText =
totalProduk;

document.getElementById(
"totalPesanan"
).innerText =
totalPesanan;

document.getElementById(
"totalUmkm"
).innerText =
totalUmkm;

document.getElementById(
"pesananHariIni"
).innerText =
pesananHariIni;

document.getElementById(
"totalTransaksi"
).innerText =
"Rp " +
totalTransaksi.toLocaleString("id-ID");

document.getElementById(
"produkHabis"
).innerText =
produkHabis;

}
catch(error){

console.error(error);

alert(
"Gagal memuat dashboard admin"
);

}

}

loadDashboard();