import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
doc,
getDoc
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

document.getElementById(
"namaToko"
).innerText =
toko.namaUmkm || "UMKM";

document.getElementById(
"deskripsiToko"
).innerText =
toko.deskripsi || "-";

document.getElementById(
"alamatToko"
).innerText =
[
toko.alamat,
toko.kota,
toko.provinsi
]
.filter(Boolean)
.join(", ") || "-";

document.getElementById(
"nomorToko"
).innerText =
toko.whatsapp || "-";

document.getElementById(
"namaBank"
).innerText =
toko.bank || "-";

document.getElementById(
"nomorRekening"
).innerText =
toko.rekening || "-";

document.getElementById(
"atasNama"
).innerText =
toko.atasNama || "-";

document.getElementById(
"ratingToko"
).innerText =
toko.ratingToko || 0;

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

if(
document.getElementById(
"tanggalGabung"
)
){

document.getElementById(
"tanggalGabung"
).innerText =
toko.createdAt?.seconds
?
new Date(
toko.createdAt.seconds * 1000
).toLocaleDateString("id-ID")
:
"-";

}

}
catch(error){

alert(
"Gagal memuat toko\n\n" +
error.message
);

console.error(error);

}