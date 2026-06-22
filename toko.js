import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore,
doc,
getDoc,
collection,
getDocs,
query,
where
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const uid =
new URLSearchParams(
window.location.search
).get("uid");

if(!uid){

alert("Toko tidak ditemukan");

window.location.href =
"index.html";

throw new Error("UID kosong");

}

try{

const userDoc =
await getDoc(
doc(db,"users",uid)
);

if(!userDoc.exists()){

alert("UMKM tidak ditemukan");

window.location.href =
"index.html";

throw new Error("UMKM tidak ditemukan");

}

const toko =
userDoc.data();

document.getElementById(
"namaToko"
).innerText =
toko.namaUmkm ||
toko.nama ||
"UMKM";

document.getElementById(
"deskripsiToko"
).innerText =
toko.deskripsi ||
"Belum ada deskripsi";

document.getElementById(
"alamatToko"
).innerText =
toko.alamat || "-";

document.getElementById(
"nomorToko"
).innerText =
toko.whatsapp || "-";

document.getElementById(
"jamToko"
).innerText =
toko.jamOperasional ||
"08:00 - 17:00";

document.getElementById(
"tentangToko"
).innerText =
toko.tentangToko ||
toko.deskripsi ||
"Belum ada informasi toko";

document.getElementById(
"logoToko"
).src =
toko.logo ||
"https://picsum.photos/200";

document.getElementById(
"waToko"
).href =
"https://wa.me/" +
String(
toko.whatsapp || ""
).replace(/^0/,"62");

if(toko.createdAt?.seconds){

document.getElementById(
"tanggalGabung"
).innerText =
new Date(
toko.createdAt.seconds * 1000
).toLocaleDateString("id-ID");

}

const produkSnap =
await getDocs(
query(
collection(db,"produk"),
where("uid","==",uid)
)
);

const produkContainer =
document.getElementById(
"produkToko"
);

const terlarisContainer =
document.getElementById(
"produkTerlaris"
);

produkContainer.innerHTML = "";
terlarisContainer.innerHTML = "";

let totalProduk = 0;
let totalTerjual = 0;
let totalReview = 0;
let totalRating = 0;

let produkTerlaris = [];

produkSnap.forEach((docItem)=>{

const produk =
docItem.data();

if(
String(produk.status)
.toLowerCase() !== "aktif"
){
return;
}

totalProduk++;

totalTerjual +=
Number(
produk.terjual || 0
);

totalReview +=
Number(
produk.totalReview || 0
);

totalRating +=
Number(
produk.rating || 0
);

produkTerlaris.push({
id:docItem.id,
...produk
});

produkContainer.innerHTML += `

<div
class="product-card searchable">

<img
src="${
Array.isArray(produk.gambar)
? produk.gambar[0]
: (
produk.gambar ||
"https://picsum.photos/400/300"
)
}">

<div class="product-info">

<span class="category">
${produk.kategori || "Produk"}
</span>

<h3>
${String(
produk.namaProduk || "-"
)
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")}
</h3>

<p class="price">
Rp ${Number(
produk.harga || 0
).toLocaleString("id-ID")}
</p>

<p>
📦 Stok:
${produk.stok || 0}
</p>

<p>
⭐ ${produk.rating || 0}
</p>

<p>
🔥 Terjual:
${produk.terjual || 0}
</p>

<a
href="produk-detail.html?id=${docItem.id}"
class="btn-primary">

Lihat Detail

</a>

</div>

</div>

`;

});

if(totalProduk === 0){

produkContainer.innerHTML = `

<div class="dashboard-card">

<h3>
Belum Ada Produk
</h3>

<p>
UMKM ini belum memiliki produk.
</p>

</div>

`;

}

document.getElementById(
"totalProduk"
).innerText =
totalProduk;

document.getElementById(
"totalTerjual"
).innerText =
totalTerjual;

document.getElementById(
"totalReview"
).innerText =
totalReview;

document.getElementById(
"ratingToko"
).innerText =

totalProduk > 0
? (
totalRating /
totalProduk
).toFixed(1)
: "0";

produkTerlaris.sort(
(a,b)=>
Number(b.terjual || 0)
-
Number(a.terjual || 0)
);

const topProduk =
produkTerlaris.slice(0,4);

if(topProduk.length > 0){

topProduk.forEach((produk)=>{

terlarisContainer.innerHTML += `

<div class="product-card">

<img
src="${
Array.isArray(produk.gambar)
? produk.gambar[0]
: (
produk.gambar ||
"https://picsum.photos/400/300"
)
}">

<div class="product-info">

<h3>
${produk.namaProduk}
</h3>

<p>
🔥 ${produk.terjual || 0}
Terjual
</p>

</div>

</div>

`;

});

}else{

terlarisContainer.innerHTML = `

<div class="dashboard-card">

<p>
Belum ada produk terlaris.
</p>

</div>

`;

}

}catch(error){

console.error(error);

alert(
"Gagal memuat toko"
);

}

document
.getElementById(
"searchProduk"
)
.addEventListener(
"input",
(e)=>{

const keyword =
e.target.value
.toLowerCase();

document
.querySelectorAll(
".searchable"
)
.forEach((card)=>{

card.style.display =

card.innerText
.toLowerCase()
.includes(keyword)

? "block"
: "none";

});

});