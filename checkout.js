// ======================================
// PASARNUSA CHECKOUT
// checkout.js
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

addDoc,

doc,

getDoc,

serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {

getAuth

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

const app=initializeApp(firebaseConfig);

const db=getFirestore(app);

const auth=getAuth(app);
// ======================================
// ELEMENT
// ======================================

const checkoutProduk=
document.getElementById("checkoutProduk");

const namaPembeli=
document.getElementById("namaPembeli");

const whatsappPembeli=
document.getElementById("whatsappPembeli");

const alamatPembeli=
document.getElementById("alamatPembeli");

const kotaTujuan=
document.getElementById("kotaTujuan");

const kodeVoucher=
document.getElementById("kodeVoucher");

const cekVoucher=
document.getElementById("cekVoucher");

const checkoutBtn=
document.getElementById("checkoutBtn");
// ======================================
// VARIABLE
// ======================================

let uid="";

let keranjang=[];

let subtotal=0;

let ongkir=0;

let diskon=0;

let voucherDipakai=null;

let tokoData={};
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

showLoading();

await loadKeranjang();

loadKota();

initEvent();

}
// ======================================
// LOGIN
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
// LOADING
// ======================================

function showLoading(){

const template=

document.getElementById(

"loadingCheckout"

);

checkoutProduk.innerHTML="";

for(let i=0;i<3;i++){

checkoutProduk.appendChild(

template.content.cloneNode(true)

);

}

}
// ======================================
// LOAD CART
// ======================================

async function loadKeranjang(){

const snapshot=

await getDocs(

query(

collection(db,"keranjang"),

where(

"uidUser",

"==",

uid

)

)

);

keranjang=[];

snapshot.forEach(doc=>{

const data=doc.data();

if(data.selected!==false){

keranjang.push({

id:doc.id,

...data

});

}

});

if(keranjang.length===0){

document.getElementById(

"emptyCheckout"

).style.display="block";

checkoutProduk.style.display="none";

return;

}

await loadToko();

renderProduk();

hitungSubtotal();

}
// ======================================
// LOAD TOKO
// ======================================

async function loadToko(){

const uidUmkm=

keranjang[0].uidUmkm;

const snapshot=

await getDoc(

doc(

db,

"users",

uidUmkm

)

);

if(snapshot.exists()){

tokoData=

snapshot.data();

}

}
// ======================================
// RENDER PRODUK
// ======================================

function renderProduk(){

checkoutProduk.innerHTML="";

keranjang.forEach(item=>{

const subtotalProduk=

Number(item.harga||0)

*

Number(item.jumlah||1);

checkoutProduk.innerHTML+=`

<div class="checkout-item">

<img

src="${item.gambar||'assets/no-image.png'}"

loading="lazy">

<div>

<h3>

${item.namaProduk}

</h3>

<p>

Jumlah :

${item.jumlah}

</p>

<p>

${formatRupiah(item.harga)}

</p>

<h4>

${formatRupiah(subtotalProduk)}

</h4>

</div>

</div>

`;

});

}
// ======================================
// SUBTOTAL
// ======================================

function hitungSubtotal(){

subtotal=0;

keranjang.forEach(item=>{

subtotal+=

Number(item.harga||0)

*

Number(item.jumlah||1);

});

updateRingkasan();

}
// ======================================
// SUMMARY
// ======================================

function updateRingkasan(){

document.getElementById(

"subtotalInfo"

).innerText=

formatRupiah(subtotal);

document.getElementById(

"ongkirInfo"

).innerText=

formatRupiah(ongkir);

document.getElementById(

"diskonInfo"

).innerText=

formatRupiah(diskon);

const total=

subtotal+

ongkir-

diskon;

document.getElementById(

"totalBayar"

).innerText=

formatRupiah(total);

document.getElementById(

"pendapatanUmkm"

).innerText=

formatRupiah(

Math.round(subtotal*0.90)

);

document.getElementById(

"komisiAffiliate"

).innerText=

formatRupiah(

Math.round(subtotal*0.05)

);

document.getElementById(

"pendapatanPlatform"

).innerText=

formatRupiah(

Math.round(subtotal*0.05)

);

}
// ======================================
// LOAD KOTA
// ======================================

function loadKota(){

const daftarKota=[

"Trenggalek",

"Tulungagung",

"Blitar",

"Kediri",

"Ponorogo",

"Pacitan",

"Madiun",

"Nganjuk",

"Malang",

"Batu",

"Mojokerto",

"Surabaya",

"Sidoarjo",

"Gresik",

"Lamongan",

"Bojonegoro",

"Tuban",

"Probolinggo",

"Pasuruan",

"Lumajang",

"Jember",

"Bondowoso",

"Situbondo",

"Banyuwangi"

];

daftarKota.forEach(kota=>{

kotaTujuan.innerHTML+=`

<option value="${kota}">

${kota}

</option>

`;

});

}
// ======================================
// ONGKIR
// ======================================

const tarifOngkir={

"Trenggalek-Trenggalek":5000,
"Trenggalek-Tulungagung":10000,
"Tulungagung-Trenggalek":10000,
"Tulungagung-Tulungagung":5000

};

function hitungOngkir(){

const key=

`${tokoData.kota}-${kotaTujuan.value}`;

const berat=

keranjang.reduce(

(total,item)=>

total+

(

Number(item.berat||0)

*

Number(item.jumlah||1)

),

0

);

const tarif=

tarifOngkir[key]||

25000;

ongkir=

Math.ceil(

berat/1000

)

*

tarif;

updateRingkasan();

}
// ======================================
// VOUCHER
// ======================================

async function gunakanVoucher(){

const kode=

kodeVoucher.value.trim();

if(!kode)return;

const snapshot=

await getDocs(

query(

collection(db,"voucher"),

where("kode","==",kode),

where("aktif","==",true)

)

);

if(snapshot.empty){

showToast(

"Voucher tidak ditemukan."

);

return;

}

const voucher=

snapshot.docs[0].data();

voucherDipakai=

voucher.kode;

diskon=

Math.floor(

subtotal*

(

Number(voucher.diskon||0)

/

100

)

);

document.getElementById(

"voucherInfo"

).innerText=

"Voucher aktif : "+

voucher.kode;

updateRingkasan();

showToast(

"Voucher berhasil digunakan."

);

}
// ======================================
// VALIDASI
// ======================================

function validasiForm(){

if(

!namaPembeli.value.trim()

||

!whatsappPembeli.value.trim()

||

!alamatPembeli.value.trim()

||

!kotaTujuan.value

){

showToast(

"Lengkapi data pembeli."

);

return false;

}

if(

!/^(08|628)[0-9]{8,13}$/

.test(

whatsappPembeli.value

)

){

showToast(

"Nomor WhatsApp tidak valid."

);

return false;

}

return true;

}
// ======================================
// CHECKOUT
// ======================================

async function buatPesanan(){

if(

!validasiForm()

)return;

checkoutBtn.disabled=true;

checkoutBtn.innerText=

"Membuat...";

try{

const total=

subtotal+

ongkir-

diskon;

const docRef=

await addDoc(

collection(db,"pesanan"),

{

uidPembeli:uid,

uidUmkm:

keranjang[0].uidUmkm,

items:keranjang,

namaPembeli:

namaPembeli.value.trim(),

whatsapp:

whatsappPembeli.value.trim(),

alamat:

alamatPembeli.value.trim(),

kota:

kotaTujuan.value,

subtotal,

ongkir,

diskon,

voucher:

voucherDipakai||"",

total,

status:

"Belum Bayar",

statusPembayaran:

"Belum Bayar",

createdAt:

serverTimestamp()

}

);

showToast(

"Pesanan berhasil dibuat."

);

setTimeout(()=>{

window.location.href=

`upload-bukti.html?id=${docRef.id}`;

},1000);

}catch(error){

console.error(error);

showToast(

"Gagal membuat pesanan."

);

checkoutBtn.disabled=false;

checkoutBtn.innerText=

"💳 Buat Pesanan";

}

}
// ======================================
// EVENT
// ======================================

function initEvent(){

kotaTujuan.addEventListener(

"change",

hitungOngkir

);

cekVoucher.addEventListener(

"click",

gunakanVoucher

);

checkoutBtn.addEventListener(

"click",

buatPesanan

);

}
// ======================================
// HELPER
// ======================================

function formatRupiah(angka){

return "Rp "+

Number(

angka||0

)

.toLocaleString(

"id-ID"

);

}

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
