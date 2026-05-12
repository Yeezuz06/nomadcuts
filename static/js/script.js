// ============================================================
//  NomadCuts — Premium JS
//  GSAP 3 + ScrollTrigger + TextPlugin
// ============================================================

if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

function isMobile()  { return window.innerWidth < 680; }
function hasPointer() { return window.matchMedia('(pointer:fine)').matches; }

// ── Toast ─────────────────────────────────────────────────────
function mostrarToast(msg) {
  var t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// Custom cursor desactivado

// ── Hero video play ───────────────────────────────────────────
(function initHeroVideo() {
  var video = document.querySelector('.hero-video');
  if (!video) return;
  video.play().catch(function() {});
})();

// ── Page Loader ───────────────────────────────────────────────
(function initLoader() {
  var loader = document.getElementById('page-loader');
  if (!loader) return;

  if (sessionStorage.getItem('nc_v1')) {
    loader.classList.add('hidden');
    return;
  }

  var textEl = loader.querySelector('.loader-text');
  if (!textEl || typeof gsap === 'undefined') {
    loader.classList.add('hidden');
    return;
  }

  gsap.to(textEl, {
    duration: 0.65,
    text: { value: 'NOMADCUTS', delimiter: '' },
    ease: 'none',
    onComplete: function() {
      gsap.to(loader, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 0.55,
        delay: 0.25,
        ease: 'power3.inOut',
        onComplete: function() {
          loader.classList.add('hidden');
          sessionStorage.setItem('nc_v1', '1');
        }
      });
    }
  });
})();

// ── Scroll Progress Bar ───────────────────────────────────────
(function initScrollProgress() {
  var bar = document.getElementById('scroll-progress');
  if (!bar || typeof ScrollTrigger === 'undefined') return;
  gsap.to(bar, {
    width: '100%',
    ease: 'none',
    scrollTrigger: { scrub: 0.4, start: 'top top', end: 'bottom bottom' }
  });
})();

// ── Navigation ────────────────────────────────────────────────
(function initNav() {
  var nav     = document.getElementById('main-nav');
  var toggle  = document.getElementById('nav-toggle');
  var overlay = document.getElementById('nav-overlay');
  var closeBtn = document.getElementById('nav-overlay-close');

  if (!nav) return;

  if (document.querySelector('.hero')) {
    nav.classList.add('transparent');
    window.addEventListener('scroll', function() {
      nav.classList.toggle('transparent', window.scrollY < 80);
    }, { passive: true });
  }

  if (!toggle || !overlay) return;

  toggle.addEventListener('click', function() {
    overlay.classList.add('open');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(overlay.querySelectorAll('a'),
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.38, ease: 'power2.out' }
      );
    }
  });

  function closeOverlay() { overlay.classList.remove('open'); }
  if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
  overlay.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', closeOverlay);
  });
})();

// ── Text Scramble ─────────────────────────────────────────────
function scrambleText(el, finalText, duration) {
  duration = duration || 0.9;
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!';
  var total = Math.round(duration * 60);
  var frame = 0;

  (function tick() {
    var progress = frame / total;
    el.textContent = finalText.split('').map(function(ch, i) {
      if (ch === ' ' || ch === ',') return ch;
      if (i < progress * finalText.length) return ch;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    frame++;
    if (frame <= total) requestAnimationFrame(tick);
    else el.textContent = finalText;
  })();
}

// ── Hero Animation ────────────────────────────────────────────
(function initHero() {
  var hero = document.querySelector('.hero');
  if (!hero || typeof gsap === 'undefined') return;

  var eyebrow = hero.querySelector('.hero-eyebrow');
  var lines   = hero.querySelectorAll('.hero-line');
  var sub     = hero.querySelector('.hero-sub');
  var actions = hero.querySelector('.hero-actions');
  var delay   = sessionStorage.getItem('nc_v1') ? 0.1 : 1.3;
  var tl      = gsap.timeline({ delay: delay });

  if (eyebrow) {
    tl.fromTo(eyebrow,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }

  if (lines.length) {
    tl.to(lines,
      { clipPath: 'inset(0 0 0% 0)', opacity: 1, stagger: 0.13, duration: 0.65, ease: 'power3.out' },
      eyebrow ? '-=0.2' : 0
    );
    var lastLine = lines[lines.length - 1];
    var originalText = lastLine.textContent.trim();
    tl.add(function() { scrambleText(lastLine, originalText, 0.8); }, '-=0.3');
  }

  if (sub) {
    tl.fromTo(sub,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
      '-=0.3'
    );
  }

  if (actions) {
    tl.fromTo(actions,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' },
      '-=0.2'
    );
  }
})();

// ── Stats Counters ────────────────────────────────────────────
(function initStats() {
  if (typeof ScrollTrigger === 'undefined') return;

  document.querySelectorAll('.stat-num[data-count]').forEach(function(el) {
    var target    = parseFloat(el.dataset.count);
    var suffix    = el.dataset.suffix || '';
    var isDecimal = String(el.dataset.count).includes('.');

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: function() {
        var obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function() {
            el.textContent = isDecimal
              ? obj.val.toFixed(1) + suffix
              : Math.round(obj.val) + suffix;
          },
          onComplete: function() {
            el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
          }
        });
      }
    });
  });
})();

// ── ScrollTrigger Animations ──────────────────────────────────
(function initScrollAnimations() {
  if (typeof ScrollTrigger === 'undefined') return;

  // Section header reveals
  document.querySelectorAll('section .tag, .page-header .tag').forEach(function(tag) {
    var parent  = tag.closest('section') || tag.closest('.page-header') || tag.parentElement;
    var divider = tag.nextElementSibling && tag.nextElementSibling.classList.contains('divider')
                  ? tag.nextElementSibling : null;
    var heading = parent.querySelector('h1, h2');

    var tl = gsap.timeline({
      scrollTrigger: { trigger: tag, start: 'top 88%', once: true }
    });
    tl.fromTo(tag,
      { x: -18, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.38, ease: 'power2.out' }
    );
    if (divider) {
      tl.fromTo(divider,
        { scaleX: 0, transformOrigin: 'left' },
        { scaleX: 1, duration: 0.38, ease: 'power2.out' },
        '-=0.18'
      );
    }
    if (heading) {
      tl.fromTo(heading,
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }
  });

  // Service cards stagger
  var sCards = gsap.utils.toArray('.service-card');
  if (sCards.length) {
    gsap.fromTo(sCards,
      { y: 46, opacity: 0 },
      {
        y: 0, opacity: 1, stagger: 0.07, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: sCards[0], start: 'top 86%', once: true }
      }
    );
  }

  // Gallery wipe reveal
  gsap.utils.toArray('.gallery-reveal').forEach(function(wrap, i) {
    var wipe = wrap.querySelector('.gallery-wipe');
    if (!wipe) return;
    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 82%',
      once: true,
      onEnter: function() {
        gsap.to(wipe, {
          scaleX: 0,
          duration: 0.65,
          delay: i * 0.12,
          ease: 'power3.inOut',
          transformOrigin: 'right'
        });
      }
    });
  });

  // Promo cards diagonal
  var pCards = gsap.utils.toArray('.promo-card');
  if (pCards.length) {
    gsap.fromTo(pCards,
      { x: 28, y: 18, opacity: 0 },
      {
        x: 0, y: 0, opacity: 1, stagger: 0.09, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: pCards[0], start: 'top 86%', once: true }
      }
    );
  }

  // Review cards + star fill
  var rCards = gsap.utils.toArray('.resena-card');
  if (rCards.length) {
    gsap.fromTo(rCards,
      { x: 55, opacity: 0 },
      {
        x: 0, opacity: 1, stagger: 0.09, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: rCards[0], start: 'top 86%', once: true }
      }
    );

    rCards.forEach(function(card) {
      var activeStars = card.querySelectorAll('.star-active');
      if (!activeStars.length) return;
      gsap.set(activeStars, { color: 'var(--border)' });
      ScrollTrigger.create({
        trigger: card,
        start: 'top 86%',
        once: true,
        onEnter: function() {
          gsap.to(activeStars, {
            color: 'var(--gold)',
            duration: 0.15,
            stagger: 0.07,
            ease: 'none'
          });
        }
      });
    });
  }

  // CTA banner parallax
  gsap.utils.toArray('.cta-banner').forEach(function(banner) {
    var img = banner.querySelector('.cta-banner-bg img');
    if (!img) return;
    gsap.to(img, {
      y: '18%',
      ease: 'none',
      scrollTrigger: {
        trigger: banner,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2
      }
    });
  });
})();

// ── Magnetic Buttons ──────────────────────────────────────────
(function initMagnetic() {
  if (isMobile() || !hasPointer() || typeof gsap === 'undefined') return;

  document.querySelectorAll('.btn-primary').forEach(function(btn) {
    var STRENGTH = 0.32;
    var RADIUS   = 75;

    btn.addEventListener('mousemove', function(e) {
      var r  = btn.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top  + r.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < RADIUS) {
        gsap.to(btn, { x: dx * STRENGTH, y: dy * STRENGTH, duration: 0.28, ease: 'power2.out' });
      }
    });

    btn.addEventListener('mouseleave', function() {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
    });
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
    setEl('summary-servicio', sel ? sel.textContent : null);
    setEl('summary-fecha',    document.getElementById('fecha') ? document.getElementById('fecha').value : null);
    setEl('summary-hora',     document.getElementById('hora') ? document.getElementById('hora').value : null);
    setEl('summary-nombre',   document.getElementById('nombre') ? document.getElementById('nombre').value : null);
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
      if (!n  || !n.value.trim())  { mostrarToast('Ingresa tu nombre');    return false; }
      if (!em || !em.value.trim()) { mostrarToast('Ingresa tu correo');    return false; }
      if (!t  || !t.value.trim())  { mostrarToast('Ingresa tu teléfono'); return false; }
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

// ── 3D Card Tilt ──────────────────────────────────────────────
(function initCardTilt() {
  if (isMobile() || !hasPointer() || typeof gsap === 'undefined') return;

  var TILT  = 10;   // max degrees
  var SCALE = 1.03;

  document.querySelectorAll('.service-card, .promo-card').forEach(function(card) {
    var shine = document.createElement('div');
    shine.className = 'tilt-shine';
    card.appendChild(shine);

    card.addEventListener('mousemove', function(e) {
      var r  = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top)  / r.height;
      var rx =  (0.5 - py) * TILT * 2;
      var ry = -(0.5 - px) * TILT * 2;

      gsap.to(card, {
        rotateX: rx, rotateY: ry, scale: SCALE,
        duration: 0.25, ease: 'power2.out',
        transformPerspective: 900
      });

      shine.style.setProperty('--mx', (px * 100) + '%');
      shine.style.setProperty('--my', (py * 100) + '%');
    });

    card.addEventListener('mouseleave', function() {
      gsap.to(card, {
        rotateX: 0, rotateY: 0, scale: 1,
        duration: 0.6, ease: 'elastic.out(1, 0.45)',
        transformPerspective: 900
      });
    });
  });
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
