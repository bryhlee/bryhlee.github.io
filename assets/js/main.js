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