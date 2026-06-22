import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
collection,
query,
where,
getDocs,
doc,
updateDoc
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

const uid = auth.currentUser.uid;

const container =
document.getElementById("notifContainer");

let notifDocs = [];

async function loadNotif(){

try{

container.innerHTML = "";

const snapshot = await getDocs(

query(
collection(db,"notifikasi"),
where("uid","==",uid)
)

);

let total = 0;
let unread = 0;
let pesanan = 0;
let affiliate = 0;
let umkm = 0;

notifDocs = [];

snapshot.forEach((item)=>{

notifDocs.push(item);

const data = item.data();

total++;

if(!data.dibaca) unread++;

if(data.kategori === "Pesanan") pesanan++;

if(data.kategori === "Affiliate") affiliate++;

if(data.kategori === "UMKM") umkm++;

});

notifDocs.sort((a,b)=>{

const aTime =
a.data().createdAt?.seconds || 0;

const bTime =
b.data().createdAt?.seconds || 0;

return bTime - aTime;

});

document.getElementById("totalNotif").innerText = total;
document.getElementById("belumDibaca").innerText = unread;
document.getElementById("notifPesanan").innerText = pesanan;
document.getElementById("notifAffiliate").innerText = affiliate;
document.getElementById("notifUmkm").innerText = umkm;

renderNotif();

}
catch(error){

console.error(error);

container.innerHTML = `
<div class="dashboard-card">
<h3>Gagal Memuat Notifikasi</h3>
<p>${error.message}</p>
</div>
`;

}

}

function renderNotif(){

const keyword =
document.getElementById("searchNotif")
.value
.toLowerCase();

container.innerHTML = "";

const hasil = notifDocs.filter((item)=>{

const data = item.data();

return (
(data.judul || "") +
" " +
(data.pesan || "")
)
.toLowerCase()
.includes(keyword);

});

if(hasil.length === 0){

container.innerHTML = `
<div class="dashboard-card">
<h3>📭 Tidak Ada Notifikasi</h3>
</div>
`;

return;

}

hasil.forEach((item)=>{

const data = item.data();

container.innerHTML += `

<div class="dashboard-card"
style="border-left:4px solid ${
data.dibaca ? "#ddd" : "#22c55e"
};">

<h3>${data.judul || "Notifikasi"}</h3>

<p>${data.pesan || ""}</p>

<br>

<small>
${
data.createdAt?.seconds
?
new Date(
data.createdAt.seconds * 1000
).toLocaleString("id-ID")
:
"-"
}
</small>

<br><br>

<b>
${data.dibaca
? "✅ Sudah Dibaca"
: "🟡 Belum Dibaca"}
</b>

</div>

`;

});

}

document
.getElementById("searchNotif")
.addEventListener(
"input",
renderNotif
);

document
.getElementById("btnRefresh")
.addEventListener(
"click",
loadNotif
);

document
.getElementById("btnBacaSemua")
.addEventListener(
"click",
async()=>{

try{

await Promise.all(

notifDocs.map(item=>

updateDoc(
doc(db,"notifikasi",item.id),
{
dibaca:true
}
)

)

);

alert("Semua notifikasi dibaca");

loadNotif();

}
catch(error){

console.error(error);

alert("Gagal memperbarui notifikasi");

}

}
);

loadNotif();