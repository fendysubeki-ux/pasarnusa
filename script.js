// ================================
// PASARNUSA SCRIPT V1
// ================================

document.addEventListener("DOMContentLoaded", () => {

    initMobileMenu();
    initDarkMode();
    initNavbarScroll();
    initBackToTop();
initSearch();
initCounter();
initReveal();
initLazyImage();
initToast();
initRipple();
initButtonLoading();
});

// ================================
// MOBILE MENU
// ================================

function initMobileMenu() {

    const menuToggle = document.getElementById("menuToggle");
    const navbarMenu = document.querySelector(".navbar-menu");

    if (!menuToggle || !navbarMenu) return;

    menuToggle.addEventListener("click", () => {

        navbarMenu.classList.toggle("active");

    });

    navbarMenu.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            navbarMenu.classList.remove("active");

        });

    });

}

// ================================
// DARK MODE
// ================================

function initDarkMode() {

    const button = document.getElementById("themeToggle");

    if (!button) return;

    if (localStorage.getItem("theme") === "dark") {

        document.body.classList.add("dark");
        button.textContent = "☀️";

    }

    button.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {

            localStorage.setItem("theme", "dark");
            button.textContent = "☀️";

        } else {

            localStorage.setItem("theme", "light");
            button.textContent = "🌙";

        }

    });

}

// ================================
// NAVBAR SCROLL
// ================================

function initNavbarScroll() {

    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    window.addEventListener("scroll", () => {

        navbar.classList.toggle("scrolled", window.scrollY > 40);

    });

}

// ================================
// BACK TO TOP
// ================================

function initBackToTop() {

    const button = document.getElementById("backTop");

    if (!button) return;

    window.addEventListener("scroll", () => {

        button.classList.toggle("show", window.scrollY > 400);

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}
// ================================
// SEARCH
// ================================

function initSearch() {

    const input = document.querySelector(".hero-search input");

    if (!input) return;

    input.addEventListener("keyup", (e) => {

        if (e.key === "Enter") {

            const keyword = input.value.trim();

            if (keyword !== "") {

                window.location.href =
                `produk.html?search=${encodeURIComponent(keyword)}`;

            }

        }

    });

}
// ================================
// COUNTER
// ================================

function initCounter() {

    const counters = document.querySelectorAll(".stat-value");

    counters.forEach(counter => {

        const target = Number(counter.textContent);

        let current = 0;

        const speed = target / 80;

        function update() {

            current += speed;

            if (current < target) {

                counter.textContent =
                Math.floor(current);

                requestAnimationFrame(update);

            } else {

                counter.textContent = target;

            }

        }

        update();

    });

}
// ================================
// REVEAL
// ================================

function initReveal() {

    const items =
    document.querySelectorAll(
        ".section,.feature-card,.category-card,.product-card,.roadmap-card"
    );

    const observer =
    new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if(entry.isIntersecting){

                entry.target.classList.add("show");

            }

        });

    },{
        threshold:0.15
    });

    items.forEach(item=>{

        observer.observe(item);

    });

}
// ================================
// LAZY IMAGE
// ================================

function initLazyImage(){

const images=
document.querySelectorAll("img");

const observer=
new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

const img=entry.target;

if(img.dataset.src){

img.src=img.dataset.src;

}

observer.unobserve(img);

}

});

});

images.forEach(img=>{

observer.observe(img);

});

}

// ================================
// TOAST
// ================================

function initToast(){

window.showToast=function(message){

const toast=document.createElement("div");

toast.className="toast";

toast.textContent=message;

document.body.appendChild(toast);

setTimeout(()=>{

toast.classList.add("show");

},100);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>{

toast.remove();

},300);

},3000);

}

}
// ================================
// RIPPLE
// ================================

function initRipple(){

document.querySelectorAll(".btn").forEach(button=>{

button.addEventListener("click",function(e){

const circle=document.createElement("span");

circle.className="ripple";

const rect=this.getBoundingClientRect();

circle.style.left=(e.clientX-rect.left)+"px";

circle.style.top=(e.clientY-rect.top)+"px";

this.appendChild(circle);

setTimeout(()=>{

circle.remove();

},600);

});

});

}
// ================================
// BUTTON LOADING
// ================================

function initButtonLoading(){

document.querySelectorAll(".btn-loading").forEach(button=>{

button.addEventListener("click",()=>{

const text=button.innerHTML;

button.disabled=true;

button.innerHTML="⏳ Memuat...";

setTimeout(()=>{

button.disabled=false;

button.innerHTML=text;

},1500);

});

});

}
