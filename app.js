/* =====================================================
   PASARNUSA APP V1
   CORE SYSTEM
===================================================== */

document.addEventListener("DOMContentLoaded",()=>{

initNavbar();

initReveal();

initRipple();

initLoader();

initBackTop();

initSearch();

});
/* =========================================
   NAVBAR
========================================= */

function initNavbar(){

const navbar=document.querySelector(".navbar");

if(!navbar) return;

window.addEventListener("scroll",()=>{

navbar.classList.toggle(

"scrolled",

window.scrollY>30

);

});

}
/* =========================================
   REVEAL
========================================= */

function initReveal(){

const items=document.querySelectorAll(".reveal");

if(!items.length) return;

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("active");

}

});

},{

threshold:.15

});

items.forEach(item=>observer.observe(item));

}
/* =========================================
   RIPPLE
========================================= */

function initRipple(){

document.querySelectorAll(".btn")

.forEach(btn=>{

btn.addEventListener("click",function(e){

const circle=document.createElement("span");

const size=Math.max(

this.clientWidth,

this.clientHeight

);

circle.style.width=size+"px";

circle.style.height=size+"px";

circle.style.left=

e.offsetX-size/2+"px";

circle.style.top=

e.offsetY-size/2+"px";

circle.className="ripple";

this.appendChild(circle);

setTimeout(()=>{

circle.remove();

},600);

});

});

}
/* =========================================
   LOADER
========================================= */

function initLoader(){

const loader=

document.querySelector(".loading-screen");

if(!loader) return;

window.addEventListener("load",()=>{

loader.style.opacity="0";

setTimeout(()=>{

loader.remove();

},500);

});

}
/* =========================================
   BACK TO TOP
========================================= */

function initBackTop(){

const btn=document.querySelector(".back-top");

if(!btn) return;

window.addEventListener("scroll",()=>{

btn.classList.toggle(

"show",

window.scrollY>500

);

});

btn.onclick=()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

};

}
/* =========================================
   SEARCH
========================================= */

function initSearch(){

const input=

document.getElementById("searchHome");

if(!input) return;

input.addEventListener("keypress",e=>{

if(e.key==="Enter"){

window.location=

`produk.html?search=${encodeURIComponent(input.value)}`;

}

});

}
/* =====================================================
   PASARNUSA APP V1
   PART 2
   UI INTERACTION
===================================================== */

document.addEventListener("DOMContentLoaded",()=>{

initMobileMenu();

initDarkMode();

initToast();

initCounter();

initModal();

});
/* =========================================
   MOBILE MENU
========================================= */

function initMobileMenu(){

const toggle=document.querySelector(".menu-toggle");

const menu=document.querySelector(".navbar-menu");

if(!toggle||!menu) return;

toggle.onclick=()=>{

menu.classList.toggle("active");

};

document.addEventListener("click",e=>{

if(

!menu.contains(e.target)

&&

!toggle.contains(e.target)

){

menu.classList.remove("active");

}

});

}
/* =========================================
   DARK MODE
========================================= */

function initDarkMode(){

const btn=document.querySelector(".dark-toggle");

if(!btn) return;

if(localStorage.getItem("theme")==="dark"){

document.body.classList.add("dark");

}

btn.onclick=()=>{

document.body.classList.toggle("dark");

localStorage.setItem(

"theme",

document.body.classList.contains("dark")

?"dark":"light"

);

};

}
/* =========================================
   TOAST
========================================= */

function showToast(message,type="success"){

const toast=document.createElement("div");

toast.className=`toast toast-${type}`;

toast.innerHTML=`

<div>${message}</div>

`;

document.body.appendChild(toast);

setTimeout(()=>{

toast.classList.add("show");

},100);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>toast.remove(),300);

},3000);

}
/* =========================================
   COUNTER
========================================= */

function initCounter(){

const counters=document.querySelectorAll("[data-counter]");

if(!counters.length) return;

counters.forEach(counter=>{

const target=Number(counter.dataset.counter);

let current=0;

const speed=Math.max(1,Math.ceil(target/80));

const timer=setInterval(()=>{

current+=speed;

if(current>=target){

current=target;

clearInterval(timer);

}

counter.textContent=current.toLocaleString("id-ID");

},20);

});

}
/* =========================================
   MODAL
========================================= */

function initModal(){

document.querySelectorAll("[data-modal]")

.forEach(btn=>{

btn.onclick=()=>{

const modal=document.getElementById(

btn.dataset.modal

);

if(modal){

modal.style.display="flex";

}

};

});

document.querySelectorAll(".modal")

.forEach(modal=>{

modal.onclick=e=>{

if(

e.target===modal ||

e.target.classList.contains("close")

){

modal.style.display="none";

}

};

});

}
/* =====================================================
   PASARNUSA APP V1
   PART 3
   MARKETPLACE FEATURES
===================================================== */

document.addEventListener("DOMContentLoaded",()=>{

initWishlist();

initCopyAffiliate();

initShare();

initRating();

});
/* =========================================
   WISHLIST
========================================= */

function initWishlist(){

document.querySelectorAll(".favorite")

.forEach(btn=>{

btn.addEventListener("click",()=>{

btn.classList.toggle("active");

const icon=btn.querySelector("i");

if(icon){

icon.classList.toggle("fa-regular");

icon.classList.toggle("fa-solid");

}

showToast("Produk ditambahkan ke wishlist");

});

});

}
.favorite.active{

background:#ef4444;

color:white;

transform:scale(1.1);

}
/* =========================================
   COPY AFFILIATE
========================================= */

function initCopyAffiliate(){

document.querySelectorAll(".copy-link")

.forEach(btn=>{

btn.onclick=()=>{

const input=

btn.parentElement.querySelector("input");

navigator.clipboard.writeText(input.value);

showToast("Link berhasil disalin");

};

});

}
/* =========================================
   SHARE
========================================= */

function initShare(){

document.querySelectorAll(".share-btn")

.forEach(btn=>{

btn.onclick=()=>{

if(navigator.share){

navigator.share({

title:document.title,

text:"Lihat produk ini",

url:window.location.href

});

}else{

navigator.clipboard.writeText(

window.location.href

);

showToast("Link disalin");

}

};

});

}
/* =========================================
   RATING
========================================= */

function initRating(){

document.querySelectorAll(".rating i")

.forEach((star,index)=>{

star.addEventListener("click",()=>{

const parent=star.parentElement;

parent.dataset.rating=index+1;

parent.querySelectorAll("i")

.forEach((item,i)=>{

item.classList.toggle(

"active",

i<=index

);

});

});

});

}
/* =========================================
   HEART
========================================= */

document

.querySelectorAll(".favorite")

.forEach(btn=>{

btn.addEventListener("click",()=>{

btn.classList.add("heart");

setTimeout(()=>{

btn.classList.remove("heart");

},500);

});

});
/* =========================================
   FORMAT RUPIAH
========================================= */

function rupiah(nilai){

return new Intl.NumberFormat(

"id-ID",

{

style:"currency",

currency:"IDR",

maximumFractionDigits:0

}

).format(nilai);

}
/* =========================================
   DEBOUNCE
========================================= */

function debounce(fn,delay){

let timer;

return(...args)=>{

clearTimeout(timer);

timer=setTimeout(()=>{

fn(...args);

},delay);

};

}
/* =====================================================
   PASARNUSA APP V1
   PART 4
   PRODUCTION READY
===================================================== */

document.addEventListener("DOMContentLoaded",()=>{

initLazyImage();

initInfiniteScroll();

initConnectionStatus();

});
/* =========================================
   LAZY IMAGE
========================================= */

function initLazyImage(){

const images=document.querySelectorAll("img[data-src]");

if(!images.length) return;

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(!entry.isIntersecting) return;

const img=entry.target;

img.src=img.dataset.src;

img.removeAttribute("data-src");

observer.unobserve(img);

});

});

images.forEach(img=>observer.observe(img));

}
/* =========================================
   CONNECTION
========================================= */

function initConnectionStatus(){

window.addEventListener("offline",()=>{

showToast(

"Koneksi internet terputus",

"warning"

);

});

window.addEventListener("online",()=>{

showToast(

"Koneksi kembali normal",

"success"

);

});

}
/* =========================================
   INFINITE SCROLL
========================================= */

function initInfiniteScroll(){

const trigger=document.querySelector("#loadMore");

if(!trigger) return;

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

loadMoreProduct();

}

});

});

observer.observe(trigger);

}

function loadMoreProduct(){

console.log("Load produk berikutnya");

}
/* =========================================
   STORAGE
========================================= */

const Storage={

set(key,value){

localStorage.setItem(

key,

JSON.stringify(value)

);

},

get(key){

return JSON.parse(

localStorage.getItem(key)

)||[];

},

remove(key){

localStorage.removeItem(key);

}

};
/* =========================================
   CART
========================================= */

const Cart={

key:"cart",

all(){

return Storage.get(this.key);

},

save(data){

Storage.set(this.key,data);

},

add(product){

const cart=this.all();

cart.push(product);

this.save(cart);

showToast(

"Produk masuk keranjang"

);

},

count(){

return this.all().length;

}

};
/* =========================================
   WISHLIST
========================================= */

const Wishlist={

key:"wishlist",

toggle(id){

let list=Storage.get(this.key);

if(list.includes(id)){

list=list.filter(x=>x!==id);

}else{

list.push(id);

}

Storage.set(this.key,list);

}

};
/* =========================================
   API
========================================= */

async function api(url){

try{

const res=await fetch(url);

if(!res.ok)

throw Error("API Error");

return await res.json();

}

catch(e){

console.error(e);

showToast(

"Gagal mengambil data",

"error"

);

}

}
/* =========================================
   ERROR
========================================= */

window.onerror=(

msg,

url,

line

)=>{

console.error(

msg,

url,

line

);

return false;

};
/* =========================================
   DELAY
========================================= */

const sleep=(ms)=>

new Promise(resolve=>

setTimeout(resolve,ms)

);
/* =========================================
   RANDOM ID
========================================= */

function uid(){

return Math.random()

.toString(36)

.substring(2,10);

}
/* =========================================
   DATE
========================================= */

function tanggal(date){

return new Date(date)

.toLocaleDateString(

"id-ID",

{

day:"numeric",

month:"long",

year:"numeric"

}

);

}