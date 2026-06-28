// ======================================
// PASARNUSA CART
// cart.js
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

updateDoc,

deleteDoc,

writeBatch

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

const app=

initializeApp(firebaseConfig);

const db=

getFirestore(app);

const auth=

getAuth(app);
// ======================================
// ELEMENT
// ======================================

const cartContainer=

document.getElementById("cartContainer");

const totalProduk=

document.getElementById("totalProduk");

const totalItem=

document.getElementById("totalItem");

const subtotal=

document.getElementById("subtotal");

const totalBayar=

document.getElementById("totalBayar");

const pilihSemua=

document.getElementById("pilihSemua");

const hapusDipilih=

document.getElementById("hapusDipilih");

const checkoutBtn=

document.getElementById("checkoutBtn");

const kosongkanCart=

document.getElementById("kosongkanCart");

const emptyCart=

document.getElementById("emptyCart");
// ======================================
// VARIABLE
// ======================================

let uid="";

let dataCart=[];
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

await loadCart();

initEvent();

}
// ======================================
// LOGIN
// ======================================

async function checkLogin(){

await auth.authStateReady();

if(!auth.currentUser){

window.location.href=

"login.html";

return;

}

uid=

auth.currentUser.uid;

}
// ======================================
// LOADING
// ======================================

function showLoading(){

const template=

document.getElementById(

"loadingCart"

);

cartContainer.innerHTML="";

for(let i=0;i<3;i++){

cartContainer.appendChild(

template.content.cloneNode(true)

);

}

}
// ======================================
// LOAD CART
// ======================================

async function loadCart(){

try{

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

dataCart=[];

snapshot.forEach(doc=>{

dataCart.push({

id:doc.id,

...doc.data()

});

});

renderCart();

updateSummary();

}catch(error){

console.error(error);

showToast(

"Gagal memuat keranjang."

);

}

}
// ======================================
// RENDER
// ======================================

function renderCart(){

cartContainer.innerHTML="";

if(dataCart.length===0){

emptyCart.style.display="block";

cartContainer.style.display="none";

return;

}

emptyCart.style.display="none";

cartContainer.style.display="block";

dataCart.forEach(item=>{

const subtotal=

Number(item.harga||0)

*

Number(item.jumlah||1);

cartContainer.innerHTML+=`

<div class="cart-item">

<input

type="checkbox"

class="pilihProduk"

data-id="${item.id}"

${item.selected!==false?"checked":""}>

<img

src="${item.gambar||

"assets/no-image.png"}"

loading="lazy">

<div class="cart-info">

<h3>

${item.namaProduk}

</h3>

<p>

${formatRupiah(item.harga)}

</p>

<p>

Subtotal

<b>

${formatRupiah(subtotal)}

</b>

</p>

<div class="qty-box">

<button

onclick="kurangQty('${item.id}')">

−

</button>

<input

value="${item.jumlah}"

readonly>

<button

onclick="tambahQty('${item.id}')">

+

</button>

</div>

<div class="cart-action">

<button

onclick="hapusItem('${item.id}')"

class="btn btn-secondary">

🗑 Hapus

</button>

</div>

</div>

</div>

`;

});

pasangCheckbox();

}
// ======================================
// SUMMARY
// ======================================

function updateSummary(){

let produk=0;

let item=0;

let total=0;

dataCart.forEach(data=>{

if(data.selected===false)return;

produk++;

item+=

Number(data.jumlah||0);

total+=

Number(data.harga||0)

*

Number(data.jumlah||0);

});

totalProduk.innerText=

produk;

totalItem.innerText=

item;

subtotal.innerText=

formatRupiah(total);

totalBayar.innerText=

formatRupiah(total);

}
// ======================================
// CHECKBOX
// ======================================

function pasangCheckbox(){

document

.querySelectorAll(

".pilihProduk"

)

.forEach(check=>{

check.addEventListener(

"change",

async()=>{

const id=

check.dataset.id;

const item=

dataCart.find(

i=>i.id===id

);

item.selected=

check.checked;

await updateDoc(

doc(

db,

"keranjang",

id

),

{

selected:

check.checked

}

);

updateSummary();

});

});

}
// ======================================
// PILIH SEMUA
// ======================================

async function pilihSemuaProduk(){

const batch=

writeBatch(db);

dataCart.forEach(item=>{

item.selected=

pilihSemua.checked;

batch.update(

doc(

db,

"keranjang",

item.id

),

{

selected:

pilihSemua.checked

}

);

});

await batch.commit();

renderCart();

updateSummary();

}
// ======================================
// TAMBAH QTY
// ======================================

window.tambahQty = async(id)=>{

const item=

dataCart.find(

i=>i.id===id

);

if(!item)return;

if(

item.jumlah>=

(item.stok||9999)

){

showToast(

"Stok tidak mencukupi."

);

return;

}

await updateDoc(

doc(

db,

"keranjang",

id

),

{

jumlah:

Number(item.jumlah)+1

}

);

await loadCart();

};
// ======================================
// KURANG QTY
// ======================================

window.kurangQty = async(id)=>{

const item=

dataCart.find(

i=>i.id===id

);

if(!item)return;

if(item.jumlah<=1){

await hapusItem(id);

return;

}

await updateDoc(

doc(

db,

"keranjang",

id

),

{

jumlah:

Number(item.jumlah)-1

}

);

await loadCart();

};
// ======================================
// HAPUS
// ======================================

window.hapusItem = async(id)=>{

const yakin=

confirm(

"Hapus produk dari keranjang?"

);

if(!yakin)return;

try{

await deleteDoc(

doc(

db,

"keranjang",

id

)

);

showToast(

"Produk dihapus."

);

await loadCart();

}catch(error){

console.error(error);

showToast(

"Gagal menghapus."

);

}

};
// ======================================
// KOSONGKAN
// ======================================

async function kosongkanSemua(){

const yakin=

confirm(

"Kosongkan seluruh keranjang?"

);

if(!yakin)return;

const batch=

writeBatch(db);

dataCart.forEach(item=>{

batch.delete(

doc(

db,

"keranjang",

item.id

)

);

});

await batch.commit();

showToast(

"Keranjang dikosongkan."

);

await loadCart();

}
// ======================================
// CHECKOUT
// ======================================

function checkout(){

const dipilih=

dataCart.filter(

item=>item.selected!==false

);

if(dipilih.length===0){

showToast(

"Pilih minimal satu produk."

);

return;

}

window.location.href=

"checkout.html";

}
// ======================================
// EVENT
// ======================================

function initEvent(){

pilihSemua.addEventListener(

"change",

pilihSemuaProduk

);

hapusDipilih.addEventListener(

"click",

async()=>{

const batch=

writeBatch(db);

dataCart

.filter(

item=>item.selected!==false

)

.forEach(item=>{

batch.delete(

doc(

db,

"keranjang",

item.id

)

);

});

await batch.commit();

showToast(

"Produk dipilih berhasil dihapus."

);

await loadCart();

});

checkoutBtn.addEventListener(

"click",

checkout

);

kosongkanCart.addEventListener(

"click",

kosongkanSemua

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