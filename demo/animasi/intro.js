/* ==========================================================
   Muka depan: ilustrasi kampung. Tekan "Welcome" -> kamera zum
   perlahan ke arah pasangan -> pudar lembut ke kandungan kad.
   Guna:  Intro.open(selesai)
   ========================================================== */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); }; // hujung sangat lembut
  const $ = (id) => document.getElementById(id);

  const root = $("intro");
  if (!root) return;
  const stage = $("ivStage");

  const OPEN_MS = 3600;   // tempoh zum
  const HANDOFF = 0.5;    // kad dibuka (intro mula pudar) pada peratus ini
  const ZOOM_MAX = 2.2;   // skala akhir zum

  /* ---- zarah ---- */
  (function particles() {
    let s = 77;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    let html = "";
    for (let i = 0; i < 12; i++) {
      html += `<i class="iv-firefly" style="left:${(r() * 100).toFixed(1)}%;top:${(35 + r() * 55).toFixed(1)}%;--t:${(6 + r() * 7).toFixed(1)}s;--dx:${(r() * 50 - 25).toFixed(0)}px;--dy:${(15 + r() * 30).toFixed(0)}px;animation-delay:${(-r() * 8).toFixed(1)}s"></i>`;
    }
    for (let i = 0; i < 8; i++) {
      html += `<i class="iv-petal" style="left:${(r() * 100).toFixed(1)}%;--t:${(9 + r() * 8).toFixed(1)}s;--sway:${(r() * 80 - 40).toFixed(0)}px;--delay:${(-r() * 14).toFixed(1)}s"></i>`;
    }
    $("ivParticles").innerHTML = html;
  })();

  /* ---- gambar ---- */
  // dua gambar: potret (telefon) dan landskap (desktop); fx/fy = kedudukan pasangan (pecahan)
  const MODES = {
    portrait:  { src: "img/scene-wide.jpg",      w: 720,  h: 1280, fx: 0.434, fy: 0.561 },
    landscape: { src: "img/scene-landscape.jpg", w: 1280, h: 720,  fx: 0.462, fy: 0.628 },
  };
  const shot = { el: $("ivWide") };
  shot.img = shot.el.querySelector("img");
  let W = 0, H = 0, mode = "";

  function layout() {
    // CSS menukar lebar pentas; baca saiznya, kemudian pilih gambar yang sesuai
    const land = window.innerWidth / window.innerHeight >= 1;
    const want = land ? "landscape" : "portrait";
    root.classList.toggle("iv--land", land);
    if (want !== mode) {
      mode = want;
      shot.img.src = MODES[mode].src;
    }
    const M = MODES[mode];
    shot.fx = M.fx; shot.fy = M.fy;
    W = stage.clientWidth;
    H = stage.clientHeight;
    const k = Math.max(W / M.w, H / M.h);
    const w = M.w * k, h = M.h * k;
    const ox = (W - w) / 2, oy = (H - h) / 2;
    shot.img.style.width = w + "px";
    shot.img.style.height = h + "px";
    shot.img.style.left = ox + "px";
    shot.img.style.top = oy + "px";
    shot.px = ox + shot.fx * w;
    shot.py = oy + shot.fy * h;
  }
  window.addEventListener("resize", layout);
  layout();

  /* ---- animasi (satu gelung rAF, semua berdasarkan masa) ---- */
  const glow = $("ivGlow"), hero = $("ivHero"), welcome = $("openBtn");

  let state = "cover"; // cover -> opening -> done
  let t0 = 0;
  let onDone = null;

  function render(now) {
    let vp = 0;
    if (state !== "cover") {
      vp = clamp((now - t0) / OPEN_MS);
      if (state === "opening" && vp >= HANDOFF) {
        state = "done";
        if (onDone) onDone();
      }
    }

    // zum masuk ke arah pasangan; titik pasangan kekal di tempatnya
    const e = smoother(vp);
    const s = (1 + (ZOOM_MAX - 1) * e) * (1 + Math.sin(now / 2600) * 0.006);
    const x = shot.px * (1 - s), y = shot.py * (1 - s);
    shot.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;

    // teks pembukaan hilang lebih awal
    const h = smooth(vp / 0.3);
    hero.style.opacity = (1 - h).toFixed(3);
    hero.style.transform = `translate3d(0, ${(-h * 16).toFixed(1)}px, 0)`;
    glow.style.opacity = (1 - h).toFixed(3);
  }

  function loop(now) {
    render(now);
    if (root.isConnected) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.Intro = {
    open(done) {
      if (state !== "cover") return;
      state = "opening";
      onDone = done;
      welcome.classList.add("gone");
      t0 = performance.now();
    },
    skip(done) {
      state = "done";
      done();
    },
  };
})();
