$(document).ready(function(){
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

  (function loop() {
    setTimeout(function () {
      cara.next();
      loop()
    }, 7500);
  }());
});