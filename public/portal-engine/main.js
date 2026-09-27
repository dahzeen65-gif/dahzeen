window.addEventListener("scroll", ()=>{

let nav=document.querySelector(".navbar");

if(window.scrollY>50){

nav.style.background="#123456";

}else{

nav.style.background="rgba(0,0,0,.5)";

}

});
