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

// ── Hero: leve zoom-out del video al bajar ────────────────────
(function initHeroScroll() {
  if (REDUCED_MOTION || typeof ScrollTrigger === 'undefined') return;
  var hero  = document.querySelector('.ed-hero');
  var media = hero && hero.querySelector('.ed-hero-media video, .ed-hero-media img');
  if (!media) return;
  gsap.fromTo(media, { scale: 1.04, yPercent: 0 }, {
    scale: 1.14, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
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
