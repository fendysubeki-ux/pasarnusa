import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
collection,
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

const adminSnap = await getDoc(
doc(db,"users",uid)
);

if(
!adminSnap.exists() ||
adminSnap.data().role !== "admin"
){
alert("Akses khusus admin");
window.location.href = "index.html";
throw new Error("Bukan admin");
}

try{

const [
usersSnap,
produkSnap,
pesananSnap,
affiliateSnap,
voucherSnap,
pencairanSnap
] = await Promise.all([
getDocs(collection(db,"users")),
getDocs(collection(db,"produk")),
getDocs(collection(db,"pesanan")),
getDocs(collection(db,"affiliate")),
getDocs(collection(db,"voucher")),
getDocs(collection(db,"pencairanAffiliate"))
]);

let totalUmkm = 0;
let totalAffiliate = 0;
let totalProduk = produkSnap.size;
let totalPesanan = pesananSnap.size;

let umkmPending = 0;
let voucherAktif = 0;
let pesananBaru = 0;
let pencairanPending = 0;

let totalTransaksi = 0;
let pendapatanPlatform = 0;
let pendapatanUmkm = 0;
let komisiAffiliate = 0;

usersSnap.forEach(docItem => {

const data = docItem.data();

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

pesananSnap.forEach(docItem => {

const data = docItem.data();

const total =
Number(
data.totalBayar ||
data.total ||
0
);

if(
data.status === "Selesai"
){

totalTransaksi += total;

pendapatanPlatform +=
total * 0.05;

pendapatanUmkm +=
total * 0.95;

}

if(
data.status === "Menunggu"
){
pesananBaru++;
}

});

affiliateSnap.forEach(docItem => {

const data = docItem.data();

komisiAffiliate +=
Number(
data.komisi || 0
);

});

voucherSnap.forEach(docItem => {

if(docItem.data().aktif){
voucherAktif++;
}

});

pencairanSnap.forEach(docItem => {

if(
docItem.data().status ===
"Menunggu Persetujuan"
){
pencairanPending++;
}

});

document.getElementById("totalUmkm").innerText =
totalUmkm;

document.getElementById("totalProduk").innerText =
totalProduk;

document.getElementById("totalPesanan").innerText =
totalPesanan;

document.getElementById("totalAffiliate").innerText =
totalAffiliate;

document.getElementById("umkmPending").innerText =
umkmPending;

document.getElementById("voucherAktif").innerText =
voucherAktif;

document.getElementById("pesananBaru").innerText =
pesananBaru;

document.getElementById("pencairanPending").innerText =
pencairanPending;

document.getElementById("totalTransaksi").innerText =
"Rp " +
totalTransaksi.toLocaleString("id-ID");

document.getElementById("pendapatanPlatform").innerText =
"Rp " +
Math.round(
pendapatanPlatform
).toLocaleString("id-ID");

document.getElementById("pendapatanUmkm").innerText =
"Rp " +
Math.round(
pendapatanUmkm
).toLocaleString("id-ID");

document.getElementById("komisiAffiliate").innerText =
"Rp " +
komisiAffiliate.toLocaleString("id-ID");

}
catch(error){

console.error(error);

alert(
"Gagal memuat dashboard admin\n\n" +
error.message
);

}

document
.getElementById("logoutAdmin")
.addEventListener(
"click",
async()=>{

await signOut(auth);

window.location.href =
"login.html";

});