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

const params =
new URLSearchParams(
window.location.search
);

const uid =
params.get("uid");

if(!uid){

alert("Toko tidak ditemukan");

window.location.href =
"index.html";

throw new Error("UID kosong");

}

try{

console.log("UID TOKO:", uid);

const userSnap =
await getDoc(
doc(db,"users",uid)
);

if(!userSnap.exists()){

throw new Error(
"Data UMKM tidak ditemukan"
);

}

const toko =
userSnap.data();

console.log("DATA TOKO:", toko);

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

console.log("Mengambil produk UMKM...");

const produkSnap =
await getDocs(
query(
collection(db,"produk"),
where(
"uidUmkm",
"==",
uid
)
)
);

console.log(
"Jumlah Produk:",
produkSnap.size
);

const produkContainer =
document.getElementById(
"produkToko"
);

produkContainer.innerHTML = "";

if(produkSnap.empty){

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

}else{

produkSnap.forEach((docItem)=>{

const produk =
docItem.data();

produkContainer.innerHTML += `

<div class="product-card searchable">

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
${produk.namaProduk || "-"}
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

<a
href="produk-detail.html?id=${docItem.id}"
class="btn-primary">

Lihat Detail

</a>

</div>

</div>

`;

});

}

}catch(error){

console.error(error);

alert(
error.message
);

}