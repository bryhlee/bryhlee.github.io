/* Inti WOW.js */
new WOW().init();

/* Smooth Scroll Links */
$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});

/* Text Rotation */
$(".rotate").textrotator({
  animation: "fade", // You can pick the way it animates when rotating through words. Options are dissolve (default), fade, flip, flipUp, flipCube, flipCubeUp and spin.
  separator: ",", // If you don't want commas to be the separator, you can define a new separator (|, &, * etc.) by yourself using this field.
  speed: 2000 // How many milliseconds until the next word show.
});

/* Owl Carousel */
$(document).ready(function() {
 
  $("#slider").owlCarousel({
 
      autoPlay: 5000,
      slideSpeed : 300,
      paginationSpeed : 400,
      singleItem:true
 
  });
});


/* Preloader */
$(window).load( setTimeout( function() {
	$(".loader").fadeOut("slow");
}, 300)); 
