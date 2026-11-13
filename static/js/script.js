// ============================================================
//  NomadCuts — JS (editorial)
//  Movimiento sobrio: aparición al hacer scroll + leve zoom del hero.
// ============================================================

var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Toast ─────────────────────────────────────────────────────
function mostrarToast(msg) {
  var t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2800);
}

// ── Video del hero (iOS a veces necesita play() explícito) ────
(function initHeroVideo() {
  var video = document.querySelector('.hero-video');
  if (!video) return;
  if (REDUCED_MOTION) { video.removeAttribute('autoplay'); video.pause(); return; }
  var p = video.play();
  if (p && p.catch) p.catch(function() {});
})();

// ── Navegación ────────────────────────────────────────────────
(function initNav() {
  var nav      = document.getElementById('main-nav');
  var toggle   = document.getElementById('nav-toggle');
  var overlay  = document.getElementById('nav-overlay');
  var closeBtn = document.getElementById('nav-overlay-close');
  if (!nav) return;

  // Transparente solo sobre el hero de inicio
  if (document.querySelector('.ed-hero')) {
    var update = function() { nav.classList.toggle('transparent', window.scrollY < 40); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  if (!toggle || !overlay) return;
  function open() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  }
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });
})();

// ── Aparición al hacer scroll ([data-reveal]) ─────────────────
(function initReveal() {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    els.forEach(function(el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function(el) { io.observe(el); });
})();

// ── Pantalla de carga (primera visita de la sesión) ──────────
(function initLoader() {
  var root = document.documentElement;
  var el = document.getElementById('nc-loader');
  if (!el) return;
  if (!root.classList.contains('is-loading')) { el.remove(); return; }

  function done() {
    root.classList.remove('is-loading');
    try { sessionStorage.setItem('nc_loaded', '1'); } catch (e) {}
    el.remove();
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }
  if (typeof gsap === 'undefined') { setTimeout(done, 900); return; }

  var letters = el.querySelectorAll('.nc-loader-word span');
  var bar = el.querySelector('.nc-loader-bar i');
  var meta = el.querySelector('.nc-loader-meta');

  var intro = gsap.timeline();
  intro.to(letters, { y: 0, yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05 })
       .to(bar, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.15)
       .to(meta, { opacity: 1, duration: 0.6 }, 0.45);
  gsap.set(letters, { yPercent: 110 });

  // Sale cuando la página cargó y la intro terminó (máximo ~2.6 s)
  var pageReady = new Promise(function(res) {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
    setTimeout(res, 2600);
  });
  Promise.all([pageReady, intro.then()]).then(function() {
    gsap.timeline({ onComplete: done })
      .to(letters, { yPercent: -110, duration: 0.5, ease: 'power2.in', stagger: 0.025 })
      .to(meta, { opacity: 0, duration: 0.3 }, 0)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.85, ease: 'expo.inOut' }, '-=0.2');
  });
})();

// ── Partir texto en palabras (para animarlas una a una) ──────
function splitWords(el) {
  if (el.dataset.split) return [];
  el.dataset.split = '1';
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  var nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(function(node) {
    var frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(function(part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
      var outer = document.createElement('span');
      outer.className = 'sw';
      var inner = document.createElement('span');
      inner.className = 'sw-i';
      inner.textContent = part;
      outer.appendChild(inner);
      frag.appendChild(outer);
    });
    node.parentNode.replaceChild(frag, node);
  });
  return el.querySelectorAll('.sw-i');
}

// ── Efectos de scroll con GSAP (de arriba hacia abajo en la página) ──
(function initScrollFX() {
  if (REDUCED_MOTION || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var NC3D = (window.NC3D = window.NC3D || {});

  // 1. Hero: el video se acerca y el texto se va hacia arriba
  var hero = document.querySelector('.ed-hero');
  if (hero) {
    var media = hero.querySelector('.ed-hero-media video, .ed-hero-media img');
    if (media) {
      gsap.fromTo(media, { scale: 1.04 }, {
        scale: 1.18, yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    gsap.to(hero.querySelector('.ed-hero-inner'), {
      yPercent: -18, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '80% top', scrub: true }
    });
  }

  // 2. Títulos palabra por palabra
  gsap.utils.toArray('.js-split').forEach(function(el) {
    var words = splitWords(el);
    if (!words.length) return;
    gsap.from(words, {
      yPercent: 115, rotate: 4, duration: 1.15, ease: 'expo.out', stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  // 3. "El oficio": se fija en escritorio mientras las tijeras se abren/cierran
  var story = document.getElementById('oficio');
  if (story) {
    var facts = story.querySelectorAll('.ed-fact');
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function() {
      gsap.set(facts, { opacity: 0.22 });
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: story.querySelector('.ed-story-pin'), start: 'top top', end: '+=140%', pin: true,
          scrub: 0.6, onUpdate: function(self) { NC3D.scissors = self.progress; }
        }
      });
      facts.forEach(function(f, i) {
        tl.to(f, { opacity: 1, duration: 1 }, i * 1.1)
          .fromTo(f.querySelector('h3'), { x: -14 }, { x: 0, duration: 1 }, i * 1.1);
      });
      tl.to({}, { duration: 0.6 });
    });
    mm.add('(max-width: 899px)', function() {
      ScrollTrigger.create({
        trigger: story, start: 'top bottom', end: 'bottom top',
        onUpdate: function(self) { NC3D.scissors = self.progress; }
      });
      gsap.from(facts, {
        y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: story.querySelector('.ed-facts'), start: 'top 85%', once: true }
      });
    });
  }

  // 4. Carta de servicios: entran en cascada
  var items = gsap.utils.toArray('.ed-menu-item');
  if (items.length) {
    gsap.set(items, { y: 46, opacity: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: function(batch) {
        gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true });
      }
    });
  }

  // 5. Galería: la foto se descubre como cortina y luego tiene parallax
  gsap.utils.toArray('.ed-gallery figure').forEach(function(fig, i) {
    var img = fig.querySelector('img');
    gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', delay: (i % 3) * 0.12,
      scrollTrigger: { trigger: fig, start: 'top 88%', once: true }
    });
    if (img) {
      gsap.fromTo(img, { scale: 1.28, yPercent: -6 }, {
        scale: 1.08, yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  });

  // 6. Pasos: los números giran y entran
  var steps = gsap.utils.toArray('.ed-step');
  if (steps.length) {
    gsap.from(steps, {
      y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.14,
      scrollTrigger: { trigger: steps[0].parentNode, start: 'top 82%', once: true }
    });
    gsap.from('.ed-step-num', {
      rotate: -25, xPercent: -30, duration: 1.4, ease: 'expo.out', stagger: 0.14,
      scrollTrigger: { trigger: steps[0].parentNode, start: 'top 82%', once: true }
    });
  }

  // 7. Cierre: parallax del fondo y el poste gira con el scroll
  var cta = document.querySelector('.ed-cta');
  if (cta) {
    var bg = cta.querySelector(':scope > img');
    if (bg) {
      gsap.fromTo(bg, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: cta, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
    ScrollTrigger.create({
      trigger: cta, start: 'top bottom', end: 'bottom top',
      onUpdate: function(self) { NC3D.pole = self.progress; }
    });
  }

  // Recalcular cuando cargan fuentes e imágenes (cambian las alturas)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function() { ScrollTrigger.refresh(); });
  window.addEventListener('load', function() { ScrollTrigger.refresh(); });
})();

// ── Booking Wizard ────────────────────────────────────────────
(function initWizard() {
  var form   = document.getElementById('wizard-form');
  if (!form) return;

  // Pre-selección desde URL param ?s=s1…s6
  (function preSelectService() {
    var s = new URLSearchParams(window.location.search).get('s');
    if (!s) return;
    var radio = document.getElementById(s);
    if (radio) radio.checked = true;
  })();
  var panels = form.querySelectorAll('.wizard-panel');
  var steps  = document.querySelectorAll('.wizard-step');
  var conns  = document.querySelectorAll('.wizard-connector');
  if (!panels.length) return;

  var current = 0;

  function updateUI(idx) {
    steps.forEach(function(step, i) {
      step.classList.remove('active', 'done');
      var node = step.querySelector('.wizard-step-node');
      if (i < idx) {
        step.classList.add('done');
        if (node) node.textContent = '✓';
      } else if (i === idx) {
        step.classList.add('active');
        if (node) node.textContent = i + 1;
      } else {
        if (node) node.textContent = i + 1;
      }
    });
    conns.forEach(function(c, i) { c.classList.toggle('done', i < idx); });
  }

  function goTo(idx, dir) {
    var from = panels[current];
    var to   = panels[idx];

    if (typeof gsap === 'undefined') {
      from.classList.remove('active');
      to.classList.add('active');
      current = idx;
      updateUI(idx);
      return;
    }

    var container = document.getElementById('wizard');
    container.style.minHeight = from.offsetHeight + 'px';

    gsap.to(from, {
      x: dir * -70, opacity: 0, duration: 0.28, ease: 'power2.in',
      onComplete: function() {
        from.classList.remove('active');
        from.style.opacity = '';
        from.style.transform = '';
        to.classList.add('active');
        gsap.fromTo(to,
          { x: dir * 70, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.32, ease: 'power2.out',
            onComplete: function() { container.style.minHeight = ''; }
          }
        );
        current = idx;
        updateUI(idx);
      }
    });
  }

  function fillSummary() {
    var sel = form.querySelector('.service-option:checked + label .service-option-name');
    function setEl(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    }
    setEl('summary-servicio',  sel ? sel.textContent : null);
    setEl('summary-fecha',     document.getElementById('fecha')     ? document.getElementById('fecha').value     : null);
    setEl('summary-hora',      document.getElementById('hora')      ? document.getElementById('hora').value      : null);
    setEl('summary-nombre',    document.getElementById('nombre')    ? document.getElementById('nombre').value    : null);
    setEl('summary-direccion', document.getElementById('direccion') ? document.getElementById('direccion').value : null);
  }

  function validateStep(idx) {
    if (idx === 0) {
      if (!form.querySelector('.service-option:checked'))       { mostrarToast('Selecciona un servicio'); return false; }
      var f = document.getElementById('fecha');
      if (!f || !f.value)                                       { mostrarToast('Selecciona una fecha');   return false; }
      var h = document.getElementById('hora');
      if (!h || !h.value)                                       { mostrarToast('Selecciona una hora');    return false; }
    }
    if (idx === 1) {
      var n  = document.getElementById('nombre');
      var em = document.getElementById('email');
      var t  = document.getElementById('telefono');
      var d  = document.getElementById('direccion');
      if (!n  || !n.value.trim())  { mostrarToast('Ingresa tu nombre');      return false; }
      if (!em || !em.value.trim()) { mostrarToast('Ingresa tu correo');      return false; }
      if (!t  || !t.value.trim())  { mostrarToast('Ingresa tu teléfono');   return false; }
      if (!d  || !d.value.trim())  { mostrarToast('Ingresa tu dirección');  return false; }
    }
    return true;
  }

  form.addEventListener('click', function(e) {
    var nextBtn = e.target.closest('[data-next]');
    var prevBtn = e.target.closest('[data-prev]');

    if (nextBtn) {
      var nextIdx = parseInt(nextBtn.dataset.next);
      if (!validateStep(current)) return;
      if (nextIdx === 2) fillSummary();
      goTo(nextIdx, 1);
    }
    if (prevBtn) {
      goTo(parseInt(prevBtn.dataset.prev), -1);
    }
  });

  updateUI(0);
})();

// ── Star Picker ───────────────────────────────────────────────
(function initStarPicker() {
  var starBtns    = document.querySelectorAll('.star-btn');
  var estrellaVal = document.getElementById('estrellas-val');
  if (!starBtns.length || !estrellaVal) return;

  starBtns.forEach(function(b) { b.classList.add('active'); });

  starBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var val = parseInt(btn.dataset.val);
      estrellaVal.value = val;
      starBtns.forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.val) <= val); });
    });
    btn.addEventListener('mouseenter', function() {
      var val = parseInt(btn.dataset.val);
      starBtns.forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.val) <= val); });
    });
  });

  var picker = document.getElementById('star-picker');
  if (picker) {
    picker.addEventListener('mouseleave', function() {
      var cur = parseInt(estrellaVal.value);
      starBtns.forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.val) <= cur); });
    });
  }
})();

// ── Cart badge ────────────────────────────────────────────────
function agregarAlCarrito(productoId, btn) {
  fetch('/carrito/agregar/' + productoId, { method: 'POST' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.exito) {
        var badge = document.getElementById('cart-badge');
        if (badge) { badge.textContent = data.total_items; badge.classList.remove('cart-badge--hidden'); }
        if (btn) {
          var orig = btn.innerHTML;
          btn.innerHTML = '✓ Agregado';
          btn.classList.add('added');
          btn.disabled = true;
          setTimeout(function() { btn.innerHTML = orig; btn.classList.remove('added'); btn.disabled = false; }, 1800);
        }
        mostrarToast('Producto agregado al carrito');
      }
    })
    .catch(function() { mostrarToast('Error al agregar. Intenta de nuevo.'); });
}
