import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
collection,
getDocs,
query,
where
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
getAuth,
onAuthStateChanged
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

const container =
document.getElementById(
"pesananContainer"
);

let semuaPesanan = [];

function renderPesanan(data){

container.innerHTML = "";

if(data.length === 0){

container.innerHTML = `

<div class="dashboard-card">

<h3>Belum Ada Pesanan</h3>

<p>
Pesanan Anda akan muncul di sini
</p>

<a
href="produk.html"
class="btn-primary">

Belanja Sekarang

</a>

</div>

`;

return;

}

data.forEach((item)=>{

container.innerHTML += `

<div class="dashboard-card">

<h3>
Pesanan #${item.id.substring(0,8)}
</h3>

<p>
Status :
<b>${item.status || "Belum Bayar"}</b>
</p>

<p>
Total :
Rp ${Number(
item.totalBayar || 0
).toLocaleString("id-ID")}
</p>

<p>
Pembeli :
${item.namaPembeli || "-"}
</p>

<p>
Tanggal :
${
item.createdAt?.seconds
?
new Date(
item.createdAt.seconds * 1000
).toLocaleDateString("id-ID")
:
"-"
}
</p>

<div
style="
display:flex;
gap:10px;
flex-wrap:wrap;
margin-top:15px;
">

<a
href="detail-pesanan.html?id=${item.id}"
class="btn-secondary">

Detail

</a>

${
item.status === "Belum Bayar"
?
`
<a
href="upload-bukti.html?id=${item.id}"
class="btn-primary">

💳 Upload Bukti

</a>
`
:
""
}

</div>

</div>

`;

});

}

onAuthStateChanged(
auth,
async(user)=>{

if(!user){

window.location.href =
"login.html";

return;

}

try{

semuaPesanan = [];

const snapshot =
await getDocs(

query(
collection(db,"pesanan"),
where(
"uidPembeli",
"==",
user.uid
)
)

);

let totalPesanan = 0;
let belumBayar = 0;
let diproses = 0;
let dikirim = 0;
let selesai = 0;
let totalBelanja = 0;

snapshot.forEach((docu)=>{

const data =
docu.data();

semuaPesanan.push({
id:docu.id,
...data
});

totalPesanan++;

totalBelanja +=
Number(
data.totalBayar || 0
);

if(
data.status === "Belum Bayar"
){
belumBayar++;
}

if(
data.status === "Diproses"
){
diproses++;
}

if(
data.status === "Dikirim"
){
dikirim++;
}

if(
data.status === "Selesai"
){
selesai++;
}

});

document.getElementById(
"totalPesanan"
).innerText =
totalPesanan;

document.getElementById(
"belumBayar"
).innerText =
belumBayar;

document.getElementById(
"diproses"
).innerText =
diproses;

document.getElementById(
"dikirim"
).innerText =
dikirim;

document.getElementById(
"selesai"
).innerText =
selesai;

document.getElementById(
"totalBelanja"
).innerText =
"Rp " +
totalBelanja.toLocaleString("id-ID");

renderPesanan(
semuaPesanan
);

}
catch(error){

console.error(error);

container.innerHTML = `

<div class="dashboard-card">

<h3>Error</h3>

<p>
${error.message}
</p>

</div>

`;

}

}
);

document
.getElementById("searchPesanan")
.addEventListener(
"input",
(e)=>{

const keyword =
e.target.value.toLowerCase();

renderPesanan(

semuaPesanan.filter(
item =>

item.id
.toLowerCase()
.includes(keyword)

)

);

});

document
.getElementById("filterStatus")
.addEventListener(
"change",
(e)=>{

const status =
e.target.value;

if(status === "all"){

renderPesanan(
semuaPesanan
);

return;

}

renderPesanan(

semuaPesanan.filter(
item =>
item.status === status
)

);

});