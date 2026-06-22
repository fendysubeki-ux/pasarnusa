import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
getAuth,
signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

}

const role =
localStorage.getItem("role");

if(role !== "admin"){

alert("Akses khusus admin");

window.location.href =
"index.html";

throw new Error("Bukan admin");

}

try{

const usersSnap =
await getDocs(
collection(db,"users")
);

const produkSnap =
await getDocs(
collection(db,"produk")
);

const pesananSnap =
await getDocs(
collection(db,"pesanan")
);

const affiliateSnap =
await getDocs(
collection(db,"affiliate")
);

const voucherSnap =
await getDocs(
collection(db,"voucher")
);

const pencairanSnap =
await getDocs(
collection(db,"pencairanAffiliate")
);

let totalUmkm = 0;
let totalAffiliate = 0;
let umkmPending = 0;
let umkmBaru = 0;
let affiliateBaru = 0;

usersSnap.forEach((doc)=>{

const data = doc.data();

if(data.role === "umkm"){

totalUmkm++;

if(data.status !== "aktif"){

umkmPending++;

}

}

if(data.role === "affiliate"){

totalAffiliate++;

}

});

let totalProduk =
produkSnap.size;

let totalPesanan =
pesananSnap.size;

let totalTransaksi = 0;
let pendapatanPlatform = 0;
let pendapatanUmkm = 0;
let subsidiOngkir = 0;

let pesananBaru = 0;

pesananSnap.forEach((doc)=>{

const data = doc.data();

const total =
Number(
data.totalBayar ||
data.total ||
0
);

totalTransaksi += total;

pendapatanPlatform +=
total * 0.05;

pendapatanUmkm +=
total * 0.95;

subsidiOngkir +=
Number(
data.subsidiOngkir || 0
);

if(
data.status === "Menunggu"
){

pesananBaru++;

}

});

let komisiAffiliate = 0;

affiliateSnap.forEach((doc)=>{

const data = doc.data();

komisiAffiliate +=
Number(
data.komisi || 0
);

});

let voucherAktif = 0;

voucherSnap.forEach((doc)=>{

const data = doc.data();

if(data.aktif){

voucherAktif++;

}

});

let pencairanPending = 0;

pencairanSnap.forEach((doc)=>{

const data = doc.data();

if(
data.status ===
"Menunggu Persetujuan"
){

pencairanPending++;

}

});

document.getElementById(
"totalUmkm"
).innerText =
totalUmkm;

document.getElementById(
"totalProduk"
).innerText =
totalProduk;

document.getElementById(
"totalPesanan"
).innerText =
totalPesanan;

document.getElementById(
"totalAffiliate"
).innerText =
totalAffiliate;

document.getElementById(
"totalTransaksi"
).innerText =
"Rp " +
totalTransaksi.toLocaleString("id-ID");

document.getElementById(
"pendapatanPlatform"
).innerText =
"Rp " +
Math.round(
pendapatanPlatform
).toLocaleString("id-ID");

document.getElementById(
"komisiAffiliate"
).innerText =
"Rp " +
komisiAffiliate.toLocaleString("id-ID");

document.getElementById(
"pendapatanUmkm"
).innerText =
"Rp " +
Math.round(
pendapatanUmkm
).toLocaleString("id-ID");

document.getElementById(
"subsidiOngkir"
).innerText =
"Rp " +
subsidiOngkir.toLocaleString("id-ID");

document.getElementById(
"umkmPending"
).innerText =
umkmPending;

document.getElementById(
"pencairanPending"
).innerText =
pencairanPending;

document.getElementById(
"voucherAktif"
).innerText =
voucherAktif;

document.getElementById(
"pesananBaru"
).innerText =
pesananBaru + " Pesanan";

document.getElementById(
"umkmBaru"
).innerText =
umkmPending + " Pendaftaran";

document.getElementById(
"affiliateBaru"
).innerText =
totalAffiliate + " Affiliate";

document.getElementById(
"komplainBaru"
).innerText =
"0 Laporan";

}catch(error){

console.error(error);

alert(
"Gagal memuat dashboard admin\n" +
error.message
);

}

document
.getElementById("logoutAdmin")
.addEventListener(
"click",
async(e)=>{

e.preventDefault();

await signOut(auth);

localStorage.clear();

window.location.href =
"login.html";

}
);