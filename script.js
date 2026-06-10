// MENU MOBILE

const menuToggle =
document.querySelector(".menu-toggle");

const navLinks =
document.querySelector(".nav-links");

if(menuToggle){

menuToggle.addEventListener("click",()=>{

navLinks.classList.toggle("active");

});

}

// MODAL LOGIN

const loginBtn =
document.getElementById("openLogin");

const modal =
document.getElementById("loginModal");

const closeBtn =
document.querySelector(".close");

if(loginBtn && modal){

loginBtn.addEventListener("click",()=>{

modal.style.display = "flex";

});

}

if(closeBtn){

closeBtn.addEventListener("click",()=>{

modal.style.display = "none";

});

}

window.addEventListener("click",(e)=>{

if(e.target === modal){

modal.style.display = "none";

}

});

// SEARCH PRODUK

const searchInput =
document.getElementById("searchInput");

if(searchInput){

searchInput.addEventListener("keyup",()=>{

const filter =
searchInput.value.toLowerCase();

const products =
document.querySelectorAll(".searchable");

products.forEach(product=>{

const text =
product.innerText.toLowerCase();

if(text.includes(filter)){

product.style.display = "block";

}else{

product.style.display = "none";

}

});

});

}

// KALKULATOR KOMISI

function calculateCommission(){

const sales =
document.getElementById("sales");

const result =
document.getElementById("result");

if(!sales || !result) return;

const commission =
sales.value * 0.05;

result.innerHTML =
"Komisi: Rp " +
Number(commission).toLocaleString("id-ID");

}

// COPY LINK AFFILIATE

function copyAffiliate(){

const link =
document.getElementById("affiliateLink");

if(!link) return;

navigator.clipboard.writeText(
link.value
);

alert("Link affiliate berhasil disalin");

}

// PREVIEW GAMBAR PRODUK

const imageInput =
document.getElementById("productImage");

const previewImage =
document.getElementById("previewImage");

if(imageInput && previewImage){

imageInput.addEventListener("change",(e)=>{

const file =
e.target.files[0];

if(file){

previewImage.src =
URL.createObjectURL(file);

previewImage.style.display =
"block";

}

});

}

document.getElementById("simpanProduk").addEventListener("click", function() {

});
