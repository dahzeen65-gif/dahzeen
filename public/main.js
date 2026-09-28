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
  const setMenuState = (isOpen) => {
    navMenu.classList.toggle('active', isOpen);
    navLinks.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  };

  menuToggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState(!navMenu.classList.contains('active'));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-menu') && !event.target.closest('.menu-toggle')) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuState(false);
    }
  });
}
