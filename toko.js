import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
doc,
getDoc,
collection,
query,
where,
getDocs
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
window.onerror = function(msg,url,line,col,error){

alert(
"ERROR\n\n" +
msg +
"\n\nBaris : " +
line
);

};
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
function cek(id){

const el =
document.getElementById(id);

if(!el){

throw new Error(
"ID HILANG: " + id
);

}

return el;

}

try{

const tokoSnap =
await getDoc(
doc(db,"users",uid)
);

if(!tokoSnap.exists()){

throw new Error(
"Data toko tidak ditemukan"
);

}

const toko =
tokoSnap.data();

/* =====================
INFORMASI TOKO
===================== */

cek("namaToko").innerText =
toko.namaUmkm || "UMKM";

cek("deskripsiToko").innerText =
toko.deskripsi || "-";

cek("alamatToko").innerText =
[
toko.alamat,
toko.kota,
toko.provinsi
]
.filter(Boolean)
.join(", ") || "-";

cek("nomorToko").innerText =
toko.whatsapp || "-";

cek("namaBank").innerText =
toko.bank || "-";

cek("nomorRekening").innerText =
toko.rekening || "-";

cek("atasNama").innerText =
toko.atasNama || "-";

cek("ratingToko").innerText =
toko.ratingToko || 0;

cek("ratingMini").innerText =
toko.ratingToko || 0;

cek("logoToko").src =
toko.logo ||
"https://picsum.photos/200";

cek("bannerToko").src =
toko.banner ||
"https://picsum.photos/1200/350";

cek("waToko").href =
"https://wa.me/" +
String(
toko.whatsapp || ""
).replace(/^0/,"62");

if(toko.createdAt?.seconds){

cek("tanggalGabung").innerText =
new Date(
toko.createdAt.seconds * 1000
).toLocaleDateString("id-ID");

}else{

cek("tanggalGabung").innerText =
"-";

}

/* =====================
PRODUK TOKO
===================== */

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

const produkContainer =
document.getElementById(
"tokoContainer"
);

produkContainer.innerHTML = "";

let totalProduk = 0;
let totalTerjual = 0;
let produkAktif = 0;

produkSnap.forEach((docItem)=>{

const produk =
docItem.data();

totalProduk++;

if(
produk.status === "Aktif"
){
produkAktif++;
}

totalTerjual += Number(
produk.terjual || 0
);

produkContainer.innerHTML += `

<div class="product-card searchable"><img src="${
Array.isArray(produk.gambar)
? produk.gambar[0]
: produk.gambar
}" alt="${produk.namaProduk}">

<div class="product-info"><span class="category">
${produk.kategori || "Produk"}
</span><h3>
${produk.namaProduk}
</h3><p class="price">
Rp ${Number(
produk.harga || 0
).toLocaleString("id-ID")}
</p><p>
📦 Stok:
${produk.stok || 0}
</p><p>
🔥 Terjual:
${produk.terjual || 0}
</p><a
href="produk-detail.html?id=${docItem.id}"
class="btn-primary">

Lihat Detail

</a></div></div>`;

});

if(totalProduk === 0){

produkContainer.innerHTML = `

<div class="dashboard-card"><h3>
Belum Ada Produk
</h3><p>
UMKM ini belum menambahkan produk.
</p></div>`;

}

document.getElementById(
"totalProduk"
).innerText =
totalProduk;

document.getElementById(
"produkAktif"
).innerText =
produkAktif;

document.getElementById(
"totalTerjual"
).innerText =
totalTerjual;

document.getElementById(
"totalTerjualMini"
).innerText =
totalTerjual;

/* =====================
SHARE TOKO
===================== */

document.getElementById(
"shareToko"
).addEventListener(
"click",
()=>{

navigator.clipboard.writeText(
window.location.href
);

alert(
"Link toko berhasil disalin"
);

}
);

}
catch(error){

console.error(error);

alert(
"Gagal memuat toko\n\n" +
error.message
);

}

/* =====================
SEARCH PRODUK
===================== */

document
.getElementById(
"searchProduk"
)
.addEventListener(
"input",
(e)=>{

const keyword =
e.target.value.toLowerCase();

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