window.addEventListener("scroll", ()=>{

let nav=document.querySelector(".navbar");

if(window.scrollY>50){

nav.style.background="#123456";

}else{

nav.style.background="rgba(0,0,0,.5)";

}

});

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    document.body.classList.toggle('nav-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-menu')) {
      navLinks.classList.remove('open');
      document.body.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}
