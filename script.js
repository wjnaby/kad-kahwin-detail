/* ==========================================================
   Tetapan: ubah nilai di sini sahaja
   ========================================================== */
var CONFIG = {
  // Nombor WhatsApp dalam format antarabangsa tanpa "+" atau "-"
  // Contoh: '60123456789'. Jika dibiarkan kosong, butang akan membuka
  // WhatsApp tanpa nombor penerima.
  whatsapp: '601129858921',
  price: 'RM25',
  message: 'Salam, saya berminat dengan kad kahwin digital.'
};

(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- Harga ---------- */
  document.querySelectorAll('[data-price]').forEach(function (el) { el.textContent = CONFIG.price; });

  /* ---------- Pautan WhatsApp ---------- */
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    var text = CONFIG.message;
    if (a.dataset.msg) {
      var tmp = document.createElement('textarea');
      tmp.innerHTML = a.dataset.msg;
      text += ' Saya pilih reka bentuk: ' + tmp.value + '.';
    }
    a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
  });
  if (CONFIG.whatsapp) {
    var box = document.querySelector('[data-contact]');
    var num = document.querySelector('[data-wa-number]');
    if (box && num) {
      var n = CONFIG.whatsapp;
      var local = n.indexOf('60') === 0 ? '0' + n.slice(2) : n;
      num.textContent = local.length >= 10
        ? local.slice(0, 3) + '-' + local.slice(3, 7) + ' ' + local.slice(7)
        : '+' + n;
      num.href = 'https://wa.me/' + n;
      box.hidden = false;
    }
  }
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Bar atas ---------- */
  var top = document.getElementById('top');
  var toTop = document.getElementById('toTop');
  function onScroll() {
    top.classList.toggle('is-solid', window.scrollY > 40);
    if (toTop) toTop.classList.toggle('is-show', window.scrollY > 600);
  }
  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Skala skrin telefon ---------- */
  var FRAME_W = 390;
  function fitPhone(phone) {
    var screen = phone.querySelector('.phone__screen');
    var frame = phone.querySelector('.phone__frame');
    if (!screen || !frame) return;
    var w = screen.clientWidth, h = screen.clientHeight;
    var s = w / FRAME_W;
    frame.style.width = FRAME_W + 'px';
    frame.style.height = (h / s) + 'px';
    frame.style.transform = 'scale(' + s + ')';
  }
  var phones = document.querySelectorAll('[data-phone]');
  function fitAll() { phones.forEach(fitPhone); }
  fitAll();
  window.addEventListener('resize', fitAll);
  window.addEventListener('load', fitAll);

  /* ---------- Muat iframe bila hampir kelihatan ---------- */
  var lazyFrames = document.querySelectorAll('iframe[data-src]');
  if ('IntersectionObserver' in window) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var f = e.target;
        f.src = f.dataset.src;
        fio.unobserve(f);
      });
    }, { rootMargin: '300px 300px' });
    lazyFrames.forEach(function (f) { fio.observe(f); });
  } else {
    lazyFrames.forEach(function (f) { f.src = f.dataset.src; });
  }

  /* ---------- Anak panah reka bentuk ---------- */
  var track = document.getElementById('designs');
  var prev = document.getElementById('designPrev');
  var next = document.getElementById('designNext');
  var dots = document.querySelectorAll('#designDots i');
  if (track && prev && next) {
    var cards = track.querySelectorAll('.design');
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }
    function go(i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      var c = cards[i];
      track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    }
    function update() {
      var i = current();
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    }
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(current() - 1);
      if (e.key === 'ArrowRight') go(current() + 1);
    });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Reveal ---------- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { rio.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
