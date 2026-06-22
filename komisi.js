import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
collection,
query,
where,
getDocs,
addDoc,
serverTimestamp
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

}

const uid = auth.currentUser.uid;

const container =
document.getElementById(
"riwayatContainer"
);

let saldoTersedia = 0;

async function loadData(){

container.innerHTML = "";

const komisiSnap =
await getDocs(
query(
collection(db,"komisi"),
where("uid","==",uid)
)
);

const pencairanSnap =
await getDocs(
query(
collection(db,"pencairan"),
where("uid","==",uid)
)
);

let totalKomisi = 0;
let komisiCair = 0;

komisiSnap.forEach((doc)=>{

totalKomisi +=
Number(
doc.data().jumlah || 0
);

});

pencairanSnap.forEach((doc)=>{

if(
doc.data().status === "Cair"
){

komisiCair +=
Number(
doc.data().jumlah || 0
);

}

});

saldoTersedia =
totalKomisi - komisiCair;

document.getElementById(
"totalKomisi"
).innerText =
"Rp " +
totalKomisi.toLocaleString("id-ID");

document.getElementById(
"komisiPending"
).innerText =
"Rp " +
saldoTersedia.toLocaleString("id-ID");

document.getElementById(
"komisiCair"
).innerText =
"Rp " +
komisiCair.toLocaleString("id-ID");

if(pencairanSnap.empty){

container.innerHTML = `
<div class="dashboard-card">
<h3>Belum Ada Pencairan</h3>
</div>
`;

return;

}

pencairanSnap.forEach((doc)=>{

const data = doc.data();

container.innerHTML += `

<div class="dashboard-card">

<h3>
Rp ${Number(
data.jumlah || 0
).toLocaleString("id-ID")}
</h3>

<p>
Status:
<b>${data.status}</b>
</p>

<p>
${
data.createdAt?.seconds
?
new Date(
data.createdAt.seconds * 1000
).toLocaleDateString("id-ID")
:
"-"
}
</p>

</div>

`;

});

}

document
.getElementById("btnAjukan")
.addEventListener(
"click",
async()=>{

const jumlah =
Number(
document.getElementById(
"jumlahPencairan"
).value
);

if(jumlah < 10000){

alert(
"Minimal pencairan Rp10.000"
);

return;

}

if(jumlah > saldoTersedia){

alert(
"Saldo komisi tidak cukup"
);

return;

}

await addDoc(
collection(db,"pencairan"),
{
uid:uid,
jumlah:jumlah,
status:"Pending",
createdAt:serverTimestamp()
}
);

alert(
"Pengajuan pencairan berhasil"
);

location.reload();

}
);

loadData();