import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    getAuth,
    signOut
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

if (!auth.currentUser) {

    window.location.href = "login.html";

    throw new Error("Belum login");

}

const uid = auth.currentUser.uid;
const userSnap = await getDoc(
    doc(db,"users",uid)
);

if(!userSnap.exists()){

    alert("User tidak ditemukan");

    window.location.href="login.html";

    throw new Error("User tidak ditemukan");

}

const userData = userSnap.data();

if(userData.role !== "admin"){

    alert("Akses khusus admin");

    window.location.href="index.html";

    throw new Error("Bukan admin");

}
let totalUser = 0;

let totalUmkm = 0;

let totalAffiliate = 0;

let totalProduk = 0;

let totalPesanan = 0;

let totalTransaksi = 0;

let pendapatanPlatform = 0;

let pendapatanUmkm = 0;

let komisiAffiliate = 0;

let produkPending = 0;

let umkmPending = 0;

let pesananPending = 0;

let withdrawPending = 0;

let voucherAktif = 0;
try{

const [

usersSnap,
produkSnap,
pesananSnap,
affiliateSnap,
withdrawSnap,
voucherSnap

] = await Promise.all([

getDocs(collection(db,"users")),

getDocs(collection(db,"produk")),

getDocs(collection(db,"pesanan")),

getDocs(collection(db,"affiliate_commissions")),

getDocs(collection(db,"affiliate_withdraws")),

getDocs(collection(db,"voucher"))

]);
usersSnap.forEach((docItem)=>{

const data = docItem.data();

totalUser++;

if(data.role === "umkm"){

totalUmkm++;

if(
data.status !== "aktif" &&
data.statusToko !== "Buka"
){

umkmPending++;

}

}

if(data.role === "affiliate"){

totalAffiliate++;

}

});
produkSnap.forEach((docItem)=>{

const data = docItem.data();

totalProduk++;

if(
String(data.status).toLowerCase() !== "aktif"
){

produkPending++;

}

});
pesananSnap.forEach((docItem)=>{

const data = docItem.data();

totalPesanan++;

const total =
Number(
data.totalBayar ||
data.total ||
0
);

if(
data.status === "Belum Bayar" ||
data.status === "Menunggu Verifikasi"
){

pesananPending++;

}

if(data.status === "Selesai"){

totalTransaksi += total;

pendapatanUmkm +=
Number(
data.pendapatanUmkm || 0
);

pendapatanPlatform +=
Number(
data.pendapatanPlatform || 0
);

}

});
affiliateSnap.forEach((docItem)=>{

const data = docItem.data();

komisiAffiliate +=
Number(
data.komisi || 0
);

});
withdrawSnap.forEach((docItem)=>{

const data = docItem.data();

if(
data.status ===
"Menunggu Persetujuan"
){

withdrawPending++;

}

});
voucherSnap.forEach((docItem)=>{

if(docItem.data().aktif){

voucherAktif++;

}

});
document.getElementById("totalUser").innerText =
totalUser;

document.getElementById("totalUmkm").innerText =
totalUmkm;

document.getElementById("totalAffiliate").innerText =
totalAffiliate;

document.getElementById("totalProduk").innerText =
totalProduk;

document.getElementById("totalPesanan").innerText =
totalPesanan;

document.getElementById("totalTransaksi").innerText =
"Rp " +
totalTransaksi.toLocaleString("id-ID");

document.getElementById("pendapatanPlatform").innerText =
"Rp " +
pendapatanPlatform.toLocaleString("id-ID");

document.getElementById("pendapatanUmkm").innerText =
"Rp " +
pendapatanUmkm.toLocaleString("id-ID");

document.getElementById("komisiAffiliate").innerText =
"Rp " +
komisiAffiliate.toLocaleString("id-ID");

document.getElementById("produkPending").innerText =
produkPending;

document.getElementById("umkmPending").innerText =
umkmPending;

document.getElementById("pesananPending").innerText =
pesananPending;

document.getElementById("withdrawPending").innerText =
withdrawPending;

document.getElementById("voucherAktif").innerText =
voucherAktif;
}
catch(error){

console.error(error);

alert(
"Gagal memuat Dashboard Admin\n\n" +
error.message
);

}
const logoutBtn =
document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.addEventListener(
"click",
async()=>{

await signOut(auth);

window.location.href =
"login.html";

});

}