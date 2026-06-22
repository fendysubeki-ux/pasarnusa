import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
collection,
query,
where,
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

const uid = auth.currentUser.uid;

const container =
document.getElementById("produkContainer");

let semuaProduk = [];

const snapshot = await getDocs(
query(
collection(db,"produk"),
where("uid","==",uid)
)
);

let totalProduk = 0;
let aktif = 0;
let tidakAktif = 0;
let stokHabis = 0;

snapshot.forEach((docu)=>{

const data = docu.data();

semuaProduk.push({
id:docu.id,
...data
});

totalProduk++;

if(data.status === "Aktif"){
aktif++;
}else{
tidakAktif++;
}

if(Number(data.stok || 0) <= 0){
stokHabis++;
}

});

document.getElementById("totalProduk").innerText =
totalProduk;

document.getElementById("produkAktif").innerText =
aktif;

document.getElementById("produkTidakAktif").innerText =
tidakAktif;

document.getElementById("stokHabis").innerText =
stokHabis;

semuaProduk.reverse();

renderProduk(semuaProduk);

function renderProduk(data){

container.innerHTML = "";

if(data.length === 0){

container.innerHTML = `

<div class="dashboard-card">
<h3>Belum Ada Produk</h3>
<p>Silakan tambah produk pertama Anda.</p>
</div>
`;return;

}

data.forEach((produk)=>{

container.innerHTML += `

<div class="product-card"><img
src="${
produk.gambar?.[0] ||
"https://picsum.photos/400/300"
}"
alt="${produk.namaProduk}">

<div class="product-info"><h3>${produk.namaProduk}</h3><p class="price">
Rp ${Number(
produk.harga || 0
).toLocaleString("id-ID")}
</p><p>📦 Stok : ${produk.stok || 0}</p><p>⭐ Rating : ${produk.rating || 0}</p><p>🔥 Terjual : ${produk.terjual || 0}</p><p>
Status :
<b>${produk.status || "Aktif"}</b>
</p><div
style="
display:flex;
gap:10px;
flex-wrap:wrap;
margin-top:15px;
"><a
href="edit-produk.html?id=${produk.id}"
class="btn-primary">

✏ Edit

</a><a
href="produk-detail.html?id=${produk.id}"
class="btn-secondary">

👁 Lihat

</a></div></div></div>`;

});

}

document
.getElementById("searchProduk")
.addEventListener(
"input",
(e)=>{

const keyword =
e.target.value.toLowerCase();

renderProduk(

semuaProduk.filter(
item =>

(item.namaProduk || "")
.toLowerCase()
.includes(keyword)

)

);

});