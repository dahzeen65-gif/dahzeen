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
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navLinks && navMenu) {
  const closeMenu = () => {
    navLinks.classList.remove('open');
    document.body.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    navLinks.classList.add('open');
    document.body.classList.add('nav-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();

    if (navLinks.classList.contains('open')) {
      closeMenu();
      return;
    }

    openMenu();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-menu')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}
