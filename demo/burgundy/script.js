/* ============================================
   Kad Jemputan Perkahwinan
   ============================================ */

(function () {
  'use strict';

  // Kira detik menuju majlis perkahwinan (kenduri).
  // Tarikh tidak diketahui — set kepada new Date('YYYY-MM-DDTHH:MM:SS+08:00')
  // apabila tarikh telah ditetapkan. Selagi null, kira detik kekal 00.
  var WEDDING_DATE = new Date('2026-12-19T11:00:00+08:00');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Curtain ---------- */

  var curtain = $('#curtain');
  var openBtn = $('#openBtn');
  var music   = $('#musicBtn');

  document.body.classList.add('is-locked');

  function openInvitation() {
    curtain.classList.add('is-open');
    document.body.classList.remove('is-locked');
    music.classList.add('is-visible');
    startPetals();
    // The tap on "Buka Jemputan" counts as the user gesture browsers require,
    // so the song can start as the doors open.
    playMusic();

    // Remove from the a11y tree and tab order once the panels finish sliding
    // apart (matches the 1.1s panel transition in style.css; instant under
    // prefers-reduced-motion, where that transition collapses to ~0).
    window.setTimeout(function () {
      curtain.setAttribute('hidden', '');
    }, reduceMotion ? 0 : 1100);
  }

  openBtn.addEventListener('click', openInvitation);

  /* ---------- Falling petals ---------- */

  var petalCanvas = $('#petals');
  var petalsStarted = false;

  function startPetals() {
    if (petalsStarted || reduceMotion || !petalCanvas || !petalCanvas.getContext) { return; }
    petalsStarted = true;

    var ctx    = petalCanvas.getContext('2d');
    var colors = ['#7a1f33', '#a3344c', '#c9707f', '#e8b4bc', '#dcc390'];
    var count  = window.innerWidth < 640 ? 14 : 24;
    var petals = [];
    var w, h;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      petalCanvas.width  = w * dpr;
      petalCanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(p, fromTop) {
      p.x     = Math.random() * w;
      p.y     = fromTop ? -20 - Math.random() * h * 0.3 : Math.random() * h;
      p.size  = 6 + Math.random() * 7;
      p.vy    = 0.35 + Math.random() * 0.6;
      p.sway  = 0.6 + Math.random() * 1.2;
      p.phase = Math.random() * Math.PI * 2;
      p.rot   = Math.random() * Math.PI * 2;
      p.vr    = (Math.random() - 0.5) * 0.02;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 0.45 + Math.random() * 0.4;
      return p;
    }

    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < count; i++) { petals.push(spawn({}, true)); }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      petals.forEach(function (p) {
        p.y   += p.vy;
        p.rot += p.vr;
        var x = p.x + Math.sin(t / 1400 + p.phase) * 18 * p.sway;
        if (p.y > h + 20) { spawn(p, true); }

        ctx.save();
        ctx.translate(x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        // Teardrop petal: two curves meeting at a point.
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.4, p.size * 0.6, p.size * 0.8, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.8, -p.size * 0.9, -p.size * 0.4, 0, -p.size);
        ctx.fill();
        ctx.restore();
      });
      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  /* ---------- Nav ---------- */

  var nav         = $('#nav');
  var navToggle   = $('#navToggle');
  var navMenu     = $('#navMenu');
  var navBackdrop = $('#navBackdrop');

  function closeMenu() {
    navMenu.classList.remove('is-open');
    navBackdrop.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  navToggle.addEventListener('click', function () {
    var open = navMenu.classList.toggle('is-open');
    navBackdrop.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // Close the drawer after picking a destination, or by tapping the backdrop.
  $$('.nav__menu a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  navBackdrop.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); }
  });

  /* ---------- Scroll state + active link ---------- */

  var sections = $$('main section[id]');
  var navLinks = $$('.nav__menu a');
  var ticking  = false;

  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 60);

    // Highlight whichever section covers the upper third of the viewport.
    var mark = window.scrollY + window.innerHeight / 3;
    var currentId = '';

    sections.forEach(function (section) {
      if (section.offsetTop <= mark) { currentId = section.id; }
    });

    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
    });

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  onScroll();

  /* ---------- Reveal on scroll ---------- */

  var revealables = $$('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el, i) {
      // Stagger siblings so grids cascade instead of popping in at once.
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      observer.observe(el);
    });
  }

  /* ---------- Countdown ---------- */

  var cd = {
    days:    $('[data-days]'),
    hours:   $('[data-hours]'),
    minutes: $('[data-minutes]'),
    seconds: $('[data-seconds]')
  };

  function pad(n) { return String(n).padStart(2, '0'); }

  // Split-flap tile: two static halves (new top, old bottom) plus two leaves.
  // The old top leaf falls away, then the new bottom leaf swings down over
  // the old bottom half — the classic airport-board flip.
  Object.keys(cd).forEach(function (key) {
    var el = cd[key];
    el.classList.add('flip');
    el.innerHTML =
      '<span class="flip__half flip__top"></span>' +
      '<span class="flip__half flip__bottom"></span>' +
      '<span class="flip__half flip__leaf flip__leaf--top"></span>' +
      '<span class="flip__half flip__leaf flip__leaf--bottom"></span>';
    el.parts = {
      top:        $('.flip__top', el),
      bottom:     $('.flip__bottom', el),
      leafTop:    $('.flip__leaf--top', el),
      leafBottom: $('.flip__leaf--bottom', el)
    };
    el.parts.leafBottom.addEventListener('animationend', function () {
      el.parts.bottom.textContent = el.dataset.value;
    });
  });

  function setFlip(el, value) {
    var old = el.dataset.value;
    if (old === value) { return; }
    el.dataset.value = value;

    var p = el.parts;
    if (old === undefined || reduceMotion) {
      p.top.textContent = p.bottom.textContent =
      p.leafTop.textContent = p.leafBottom.textContent = value;
      return;
    }

    p.top.textContent        = value;
    p.bottom.textContent     = old;
    p.leafTop.textContent    = old;
    p.leafBottom.textContent = value;

    // Restart the animation even if the previous flip is still running.
    el.classList.remove('is-flipping');
    void el.offsetWidth;
    el.classList.add('is-flipping');
  }

  function tickCountdown() {
    var diff = WEDDING_DATE ? WEDDING_DATE - new Date() : 0;

    if (diff <= 0) {
      setFlip(cd.days, '00');
      setFlip(cd.hours, '00');
      setFlip(cd.minutes, '00');
      setFlip(cd.seconds, '00');
      window.clearInterval(timer);
      return;
    }

    var s = Math.floor(diff / 1000);
    setFlip(cd.days,    pad(Math.floor(s / 86400)));
    setFlip(cd.hours,   pad(Math.floor(s / 3600) % 24));
    setFlip(cd.minutes, pad(Math.floor(s / 60) % 60));
    setFlip(cd.seconds, pad(s % 60));
  }

  tickCountdown();
  var timer = window.setInterval(tickCountdown, 1000);

  /* ---------- Music ---------- */

  // "Bernaung" (from Setetes Embun Cinta Niyala) — already trimmed to the best
  // part, so it plays from the start and loops until paused.
  var audio = new Audio('audio/s1.mp3');
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.35;

  function playMusic() {
    // Missing file or a blocked autoplay policy shouldn't break the toggle.
    var attempt = audio.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(function () {
        music.setAttribute('aria-pressed', 'true');
      }).catch(function () {
        music.setAttribute('aria-pressed', 'false');
      });
    } else {
      music.setAttribute('aria-pressed', 'true');
    }
  }

  var userPaused = false;

  music.addEventListener('click', function () {
    if (music.getAttribute('aria-pressed') === 'true') {
      userPaused = true;
      audio.pause();
      music.setAttribute('aria-pressed', 'false');
      return;
    }
    userPaused = false;
    playMusic();
  });

  // Try to start as soon as the page loads. Most browsers block sound until
  // the visitor interacts, so if that fails, start on their first tap or key
  // press instead (the "Buka Jemputan" tap on the opening screen).
  var unlockEvents = ['pointerdown', 'touchend', 'keydown'];

  function unlockMusic() {
    unlockEvents.forEach(function (name) {
      document.removeEventListener(name, unlockMusic, true);
    });
    if (!userPaused && audio.paused) { playMusic(); }
  }

  var autoStart = audio.play();
  if (autoStart && typeof autoStart.then === 'function') {
    autoStart.then(function () {
      music.setAttribute('aria-pressed', 'true');
    }).catch(function () {
      unlockEvents.forEach(function (name) {
        document.addEventListener(name, unlockMusic, true);
      });
    });
  }
})();
