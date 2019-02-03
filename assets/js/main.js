$(document).ready(function(){

  // Cached jQuery elements
  var $window = $(window),
      $sidebar = $('.sticky-container');

  // Sticky sidebar (uses pollyfill and normal sticky class)
  // Contains additional functionality for return to top
  $window.resize(function resize(){
    if ($window.width() <= 576 || $window.height() <= 570) {
      $('#return-to-top').hide();
      Stickyfill.remove($sidebar);
      return $sidebar.removeClass('sticky');
    }
    $returntop.css('top', $sidebar.outerHeight() + 45);
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
});