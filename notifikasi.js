// ======================================
// PASARNUSA NOTIFIKASI
// notifikasi.js
// ======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {

getFirestore,

collection,

query,

where,

orderBy,

getDocs,

doc,

updateDoc,

deleteDoc

}

from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {

getAuth

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

const notifContainer=

document.getElementById("notifContainer");

const totalNotif=

document.getElementById("totalNotif");

const belumDibaca=

document.getElementById("belumDibaca");

const sudahDibaca=

document.getElementById("sudahDibaca");

const readAllBtn=

document.getElementById("readAllBtn");

const deleteAllBtn=

document.getElementById("deleteAllBtn");
// ======================================
// VARIABLE
// ======================================

let uid="";

let semuaNotif=[];
// ======================================
// START
// ======================================

document.addEventListener(

"DOMContentLoaded",

initPage

);

async function initPage(){

await checkLogin();

await loadNotif();

initButton();

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
// LOAD
// ======================================

async function loadNotif(){

try{

const snap=

await getDocs(

query(

collection(db,"notifikasi"),

where("uid","==",uid),

orderBy("createdAt","desc")

)

);

semuaNotif=[];

snap.forEach(docSnap=>{

semuaNotif.push({

id:docSnap.id,

...docSnap.data()

});

});

renderNotif();

updateStatistik();

}catch(error){

console.error(error);

showToast(

"Gagal memuat notifikasi."

);

}

}
// ======================================
// STATISTIK
// ======================================

function updateStatistik(){

totalNotif.innerText=

semuaNotif.length;

belumDibaca.innerText=

semuaNotif.filter(

item=>!item.dibaca

).length;

sudahDibaca.innerText=

semuaNotif.filter(

item=>item.dibaca

).length;

}
// ======================================
// RENDER
// ======================================

function renderNotif(){

notifContainer.innerHTML="";

if(semuaNotif.length===0){

document.getElementById(

"emptyNotif"

).style.display="block";

return;

}

document.getElementById(

"emptyNotif"

).style.display="none";

semuaNotif.forEach(item=>{

notifContainer.innerHTML+=`

<div class="notif-item ${

item.dibaca

?"":"unread"

}">

<div class="notif-icon">

${getIcon(item.judul)}

</div>

<div class="notif-content">

<h3>

${item.judul}

</h3>

<p>

${item.pesan}

</p>

<div class="notif-time">

${formatTanggal(item.createdAt)}

</div>

</div>

<div>

<button

onclick="bacaNotif('${item.id}')"

class="btn btn-secondary">

${item.dibaca?"✓":"Baca"}

</button>

<br><br>

<button

onclick="hapusNotif('${item.id}')"

class="btn btn-danger">

🗑

</button>

</div>

</div>

`;

});

}
// ======================================
// ICON
// ======================================

function getIcon(judul){

const text=

(judul||"").toLowerCase();

if(text.includes("pesanan")) return "📦";

if(text.includes("bayar")) return "💳";

if(text.includes("kirim")) return "🚚";

if(text.includes("review")) return "⭐";

if(text.includes("affiliate")) return "💰";

return "🔔";

}
// ======================================
// BACA
// ======================================

window.bacaNotif=

async(id)=>{

try{

await updateDoc(

doc(db,"notifikasi",id),

{

dibaca:true

}

);

await loadNotif();

}catch(error){

console.error(error);

showToast(

"Gagal memperbarui notifikasi."

);

}

};
// ======================================
// HAPUS
// ======================================

window.hapusNotif=

async(id)=>{

try{

await deleteDoc(

doc(db,"notifikasi",id)

);

await loadNotif();

showToast(

"Notifikasi dihapus."

);

}catch(error){

console.error(error);

showToast(

"Gagal menghapus notifikasi."

);

}

};
// ======================================
// BUTTON
// ======================================

function initButton(){

readAllBtn.onclick=

bacaSemua;

deleteAllBtn.onclick=

hapusSemua;

}
// ======================================
// BACA SEMUA
// ======================================

async function bacaSemua(){

try{

for(const item of semuaNotif){

if(!item.dibaca){

await updateDoc(

doc(db,"notifikasi",item.id),

{

dibaca:true

}

);

}

}

await loadNotif();

showToast(

"Semua notifikasi telah dibaca."

);

}catch(error){

console.error(error);

showToast(

"Gagal memperbarui notifikasi."

);

}

}
// ======================================
// HAPUS SEMUA
// ======================================

async function hapusSemua(){

if(

!confirm(

"Hapus semua notifikasi?"

)

){

return;

}

try{

for(const item of semuaNotif){

await deleteDoc(

doc(db,"notifikasi",item.id)

);

}

await loadNotif();

showToast(

"Semua notifikasi dihapus."

);

}catch(error){

console.error(error);

showToast(

"Gagal menghapus notifikasi."

);

}

}
// ======================================
// FORMAT TANGGAL
// ======================================

function formatTanggal(waktu){

if(!waktu)return"-";

const tanggal=

waktu.toDate

? waktu.toDate()

:new Date(waktu);

return tanggal.toLocaleString(

"id-ID",

{

day:"2-digit",

month:"long",

year:"numeric",

hour:"2-digit",

minute:"2-digit"

}

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

await loadNotif();

},

30000

);
