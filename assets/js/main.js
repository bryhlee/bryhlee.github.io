$(document).ready(function(){

  // Cached jQuery elements
  var $window = $(window),
      $sidebar = $('.sidebar-fix');

  // Scroll to top button
  var $returntop = $('#return-to-top');
  Stickyfill.add($returntop);
  $returntop.css('top', $sidebar.outerHeight() + 40);
  $window.scroll(function() {
    if ($window.width() <= 576 || $window.height() <= 550) {
      $('#return-to-top').hide();
    }
    else {
      if ($(this).scrollTop() >= 150) {
        $('#return-to-top').fadeIn(130);
      } else {
        $('#return-to-top').fadeOut(130);
      }
    }
  });
  $('#return-to-top').click(function() { 
    $('html, body').stop().animate({
      'scrollTop': 0
    }, 300, 'swing', function () {
        window.location.hash = target;
    });
  });

  // Sticky sidebar (uses pollyfill and normal sticky class)
  // Contains additional functionality for return to top
  $window.resize(function resize(){
    if ($window.width() <= 576 || $window.height() <= 520) {
      $('#return-to-top').hide();
      Stickyfill.remove($sidebar);
      return $sidebar.removeClass('sticky');
    }
    $returntop.css('top', $sidebar.outerHeight() + 40);
    Stickyfill.add($sidebar);
    $sidebar.addClass('sticky');
  }).trigger('resize');

  // Easter egg shindigs
  var egg = new Egg();
  egg
  .addCode("o,n,e,t,r,u,e,i,m,o,u,t,o", function() {
    jQuery('#egggif').fadeIn(500, function() {
      window.setTimeout(function() { jQuery('#egggif').hide(); }, 5000);
    });
  })
  .addHook(function(){
    console.log("One true imouto!");
    console.log(this.activeEgg.metadata);
  }).listen();

  // Smooth scroll to links
  $('a[href^="#"]').on('click',function (e) {
    e.preventDefault();

    var target = this.hash;
    var $target = $(target);

    $('html, body').stop().animate({
        'scrollTop': $target.offset().top
    }, 300, 'swing', function () {
        window.location.hash = target;
    });
  });

  // Siema carasoul for the profile image
  const cara = new Siema({
    selector: '.siema',
    duration: 500,
    easing: 'linear',
    perPage: 1,
    startIndex: 0,
    draggable: true,
    threshold: 20,
    loop: true,
  });

  // Loop through the Siema carasoul forever
  (function loop() {
    setTimeout(function () {
      cara.next();
      loop()
    }, 7500);
  }());
});