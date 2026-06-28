// ======================================
// PASARNUSA TENTANG
// tentang.js
// ======================================

// Firebase

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getFirestore,

collection,

getDocs

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

const db=

getFirestore(app);


// ======================================
// ELEMENT
// ======================================

const totalUmkm=

document.getElementById(
"totalUmkm"
);

const totalProduk=

document.getElementById(
"totalProduk"
);

const totalWilayah=

document.getElementById(
"totalWilayah"
);

const statUmkm=

document.getElementById(
"statUmkm"
);

const statProduk=

document.getElementById(
"statProduk"
);

const statWilayah=

document.getElementById(
"statWilayah"
);


// ======================================
// VARIABLE
// ======================================

let semuaProduk=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

()=>{

loadStatistik();

});
// ======================================
// LOAD DATA
// ======================================

async function loadStatistik(){

try{

const snapshot=

await getDocs(

collection(db,"produk")

);

semuaProduk=[];

snapshot.forEach(doc=>{

const data=doc.data();

if(data.status!=="Aktif") return;

if(Number(data.stok||0)<=0) return;

semuaProduk.push(data);

});

updateStatistik();

}catch(error){

console.error(error);

showError();

}

}
// ======================================
// UPDATE STATISTIK
// ======================================

function updateStatistik(){

const umkm=new Set();

const wilayah=new Set();

semuaProduk.forEach(item=>{

if(item.uid){

umkm.add(item.uid);

}

if(item.provinsi){

wilayah.add(item.provinsi);

}

});

animateNumber(
totalProduk,
semuaProduk.length
);

animateNumber(
totalUmkm,
umkm.size
);

animateNumber(
totalWilayah,
wilayah.size
);

animateNumber(
statProduk,
semuaProduk.length
);

animateNumber(
statUmkm,
umkm.size
);

animateNumber(
statWilayah,
wilayah.size
);

}

// ======================================
// COUNT UP
// ======================================

function animateNumber(element,target){

if(!element)return;

let current=0;

const increment=

Math.max(

1,

Math.ceil(target/50)

);

const timer=

setInterval(()=>{

current+=increment;

if(current>=target){

current=target;

clearInterval(timer);

}

element.innerText=current;

},20);

}
// ======================================
// ERROR
// ======================================

function showError(){

if(totalProduk){

totalProduk.innerText="-";

}

if(totalUmkm){

totalUmkm.innerText="-";

}

if(totalWilayah){

totalWilayah.innerText="-";

}

if(statProduk){

statProduk.innerText="-";

}

if(statUmkm){

statUmkm.innerText="-";

}

if(statWilayah){

statWilayah.innerText="-";

}

}
// ======================================
// FOOTER YEAR
// ======================================

const tahun=

document.querySelector(
".footer-bottom strong"
);

if(tahun){

tahun.innerText=

new Date().getFullYear();

}
// ======================================
// FADE PAGE
// ======================================

document.body.classList.add(

"page-loaded"

);
