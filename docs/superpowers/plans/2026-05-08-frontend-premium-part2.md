# NomadCuts Frontend Premium Overhaul — Plan Parte 2 (JavaScript)

> **For agentic workers:** Execute this AFTER Part 1 is complete. REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**This file:** Complete rewrite of `static/js/script.js` with GSAP-powered animations.

**Dependencies:** GSAP 3.12.5 + ScrollTrigger + TextPlugin loaded in base.html (done in Part 1 Task 2).

---

### Task 6: `script.js` — Complete Rewrite

**Files:**
- Modify: `static/js/script.js`

- [ ] **Step 1: Replace `static/js/script.js` entirely**

```javascript
// ============================================================
//  NomadCuts — Premium JS
//  GSAP 3 + ScrollTrigger + TextPlugin
// ============================================================

if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

// ── Helpers ──────────────────────────────────────────────────
function isMobile() { return window.innerWidth < 680; }
function hasPointer() { return window.matchMedia('(pointer:fine)').matches; }

// ── Toast ─────────────────────────────────────────────────────
function mostrarToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Custom Cursor ─────────────────────────────────────────────
(function initCursor() {
  if (!hasPointer() || typeof gsap === 'undefined') return;
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  document.body.classList.add('has-custom-cursor');

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(dot, { x: mx, y: my, duration: 0.08, ease: 'none' });
  });

  (function tick() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    gsap.set(ring, { x: rx, y: ry });
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .btn, .service-option + label').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('expand'));
    el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
  });
})();

// ── Page Loader ───────────────────────────────────────────────
(function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  if (sessionStorage.getItem('nc_v1')) {
    loader.classList.add('hidden');
    return;
  }

  const textEl = loader.querySelector('.loader-text');
  if (!textEl || typeof gsap === 'undefined') {
    loader.classList.add('hidden');
    return;
  }

  gsap.to(textEl, {
    duration: 0.65,
    text: { value: 'NOMADCUTS', delimiter: '' },
    ease: 'none',
    onComplete: () => {
      gsap.to(loader, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 0.55,
        delay: 0.25,
        ease: 'power3.inOut',
        onComplete: () => {
          loader.classList.add('hidden');
          sessionStorage.setItem('nc_v1', '1');
        }
      });
    }
  });
})();

// ── Scroll Progress Bar ───────────────────────────────────────
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar || typeof ScrollTrigger === 'undefined') return;
  gsap.to(bar, {
    width: '100%',
    ease: 'none',
    scrollTrigger: { scrub: 0.4, start: 'top top', end: 'bottom bottom' }
  });
})();

// ── Navigation ────────────────────────────────────────────────
(function initNav() {
  const nav     = document.getElementById('main-nav');
  const toggle  = document.getElementById('nav-toggle');
  const overlay = document.getElementById('nav-overlay');
  const close   = document.getElementById('nav-overlay-close');

  if (!nav) return;

  // Transparent on hero pages
  if (document.querySelector('.hero')) {
    nav.classList.add('transparent');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('transparent', window.scrollY < 80);
    }, { passive: true });
  }

  // Mobile overlay
  if (!toggle || !overlay) return;

  toggle.addEventListener('click', () => {
    overlay.classList.add('open');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(overlay.querySelectorAll('a'),
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.38, ease: 'power2.out' }
      );
    }
  });

  const closeOverlay = () => overlay.classList.remove('open');
  if (close) close.addEventListener('click', closeOverlay);
  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeOverlay));
})();

// ── Text Scramble ─────────────────────────────────────────────
function scrambleText(el, finalText, duration) {
  duration = duration || 0.9;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!';
  const total = Math.round(duration * 60);
  let frame = 0;

  (function tick() {
    const progress = frame / total;
    el.textContent = finalText.split('').map((ch, i) => {
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
  const hero = document.querySelector('.hero');
  if (!hero || typeof gsap === 'undefined') return;

  const eyebrow = hero.querySelector('.hero-eyebrow');
  const lines   = hero.querySelectorAll('.hero-line');
  const sub     = hero.querySelector('.hero-sub');
  const actions = hero.querySelector('.hero-actions');

  // Delay hero if loader is showing
  const delay = sessionStorage.getItem('nc_v1') ? 0.1 : 1.3;

  const tl = gsap.timeline({ delay });

  if (eyebrow) {
    tl.fromTo(eyebrow,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }

  if (lines.length) {
    tl.to(lines,
      { clipPath: 'inset(0 0 0% 0)', stagger: 0.13, duration: 0.65, ease: 'power3.out' },
      eyebrow ? '-=0.2' : 0
    );
    // Scramble the last visible line after it reveals
    const lastLine = lines[lines.length - 1];
    const originalText = lastLine.textContent.trim();
    tl.add(() => scrambleText(lastLine, originalText, 0.8), '-=0.35');
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

  document.querySelectorAll('.stat-num[data-count]').forEach(el => {
    const target    = parseFloat(el.dataset.count);
    const suffix    = el.dataset.suffix || '';
    const isDecimal = String(el.dataset.count).includes('.');

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function() {
            el.textContent = isDecimal
              ? obj.val.toFixed(1) + suffix
              : Math.round(obj.val) + suffix;
          },
          onComplete: () => { el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix; }
        });
      }
    });
  });
})();

// ── ScrollTrigger Animations ──────────────────────────────────
(function initScrollAnimations() {
  if (typeof ScrollTrigger === 'undefined') return;

  // Section header reveals (tag → divider → h2)
  document.querySelectorAll('section .tag, .page-header .tag').forEach(tag => {
    const parent  = tag.closest('section') || tag.closest('.page-header') || tag.parentElement;
    const divider = tag.nextElementSibling?.classList?.contains('divider') ? tag.nextElementSibling : null;
    const heading = parent.querySelector('h1, h2');

    const tl = gsap.timeline({
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
  const sCards = gsap.utils.toArray('.service-card');
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
  gsap.utils.toArray('.gallery-reveal').forEach((wrap, i) => {
    const wipe = wrap.querySelector('.gallery-wipe');
    if (!wipe) return;
    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 82%',
      once: true,
      onEnter: () => {
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

  // Promo cards diagonal entrance
  const pCards = gsap.utils.toArray('.promo-card');
  if (pCards.length) {
    gsap.fromTo(pCards,
      { x: 28, y: 18, opacity: 0 },
      {
        x: 0, y: 0, opacity: 1, stagger: 0.09, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: pCards[0], start: 'top 86%', once: true }
      }
    );
  }

  // Review cards from right + star fill
  const rCards = gsap.utils.toArray('.resena-card');
  if (rCards.length) {
    gsap.fromTo(rCards,
      { x: 55, opacity: 0 },
      {
        x: 0, opacity: 1, stagger: 0.09, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: rCards[0], start: 'top 86%', once: true }
      }
    );

    rCards.forEach(card => {
      const activeStars = card.querySelectorAll('.star-active');
      if (!activeStars.length) return;
      gsap.set(activeStars, { color: 'var(--border)' });
      ScrollTrigger.create({
        trigger: card,
        start: 'top 86%',
        once: true,
        onEnter: () => {
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
  gsap.utils.toArray('.cta-banner').forEach(banner => {
    const img = banner.querySelector('.cta-banner-bg img');
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

  document.querySelectorAll('.btn-primary').forEach(btn => {
    const STRENGTH = 0.32;
    const RADIUS   = 75;

    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < RADIUS) {
        gsap.to(btn, { x: dx * STRENGTH, y: dy * STRENGTH, duration: 0.28, ease: 'power2.out' });
      }
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
    });
  });
})();

// ── Booking Wizard ────────────────────────────────────────────
(function initWizard() {
  const form    = document.getElementById('wizard-form');
  const panels  = form ? form.querySelectorAll('.wizard-panel') : [];
  const steps   = document.querySelectorAll('.wizard-step');
  const conns   = document.querySelectorAll('.wizard-connector');
  if (!form || !panels.length) return;

  let current = 0;

  function updateUI(idx) {
    steps.forEach((step, i) => {
      step.classList.remove('active', 'done');
      const node = step.querySelector('.wizard-step-node');
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
    conns.forEach((c, i) => {
      c.classList.toggle('done', i < idx);
    });
  }

  function goTo(idx, dir) {
    if (typeof gsap === 'undefined') {
      panels[current].classList.remove('active');
      panels[idx].classList.add('active');
      current = idx;
      updateUI(idx);
      return;
    }
    const from = panels[current];
    const to   = panels[idx];
    const container = form.querySelector('.wizard-panels');
    container.style.minHeight = from.offsetHeight + 'px';

    gsap.to(from, {
      x: dir * -70, opacity: 0, duration: 0.28, ease: 'power2.in',
      onComplete: () => {
        from.classList.remove('active');
        from.style.opacity = '';
        from.style.transform = '';
        to.classList.add('active');
        gsap.fromTo(to,
          { x: dir * 70, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.32, ease: 'power2.out',
            onComplete: () => { container.style.minHeight = ''; }
          }
        );
        current = idx;
        updateUI(idx);
      }
    });
  }

  function fillSummary() {
    const sel = form.querySelector('.service-option:checked + label .service-option-name');
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    setEl('summary-servicio', sel ? sel.textContent : null);
    setEl('summary-fecha',    document.getElementById('fecha')?.value);
    setEl('summary-hora',     document.getElementById('hora')?.value);
    setEl('summary-nombre',   document.getElementById('nombre')?.value);
  }

  function validateStep(idx) {
    if (idx === 0) {
      if (!form.querySelector('.service-option:checked')) { mostrarToast('Selecciona un servicio'); return false; }
      if (!document.getElementById('fecha')?.value)       { mostrarToast('Selecciona una fecha');   return false; }
      if (!document.getElementById('hora')?.value)        { mostrarToast('Selecciona una hora');    return false; }
    }
    if (idx === 1) {
      if (!document.getElementById('nombre')?.value.trim())  { mostrarToast('Ingresa tu nombre');  return false; }
      if (!document.getElementById('email')?.value.trim())   { mostrarToast('Ingresa tu correo');  return false; }
      if (!document.getElementById('telefono')?.value.trim()){ mostrarToast('Ingresa tu teléfono'); return false; }
    }
    return true;
  }

  form.addEventListener('click', e => {
    const nextBtn = e.target.closest('[data-next]');
    const prevBtn = e.target.closest('[data-prev]');

    if (nextBtn) {
      const nextIdx = parseInt(nextBtn.dataset.next);
      if (!validateStep(current)) return;
      if (nextIdx === 2) fillSummary();
      goTo(nextIdx, 1);
    }

    if (prevBtn) {
      const prevIdx = parseInt(prevBtn.dataset.prev);
      goTo(prevIdx, -1);
    }
  });

  updateUI(0);
})();

// ── Star Picker (review form) ─────────────────────────────────
(function initStarPicker() {
  const starBtns     = document.querySelectorAll('.star-btn');
  const estrellaVal  = document.getElementById('estrellas-val');
  if (!starBtns.length || !estrellaVal) return;

  starBtns.forEach(b => b.classList.add('active'));

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val);
      estrellaVal.value = val;
      starBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.val) <= val));
    });
    btn.addEventListener('mouseenter', () => {
      const val = parseInt(btn.dataset.val);
      starBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.val) <= val));
    });
  });

  document.getElementById('star-picker')?.addEventListener('mouseleave', () => {
    const cur = parseInt(estrellaVal.value);
    starBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.val) <= cur));
  });
})();

// ── Cart badge (kept for tienda/carrito pages) ────────────────
function agregarAlCarrito(productoId, btn) {
  fetch(`/carrito/agregar/${productoId}`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        const badge = document.getElementById('cart-badge');
        if (badge) { badge.textContent = data.total_items; badge.classList.remove('cart-badge--hidden'); }
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Agregado';
          btn.classList.add('added');
          btn.disabled = true;
          setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('added'); btn.disabled = false; }, 1800);
        }
        mostrarToast('Producto agregado al carrito');
      }
    })
    .catch(() => mostrarToast('Error al agregar. Intenta de nuevo.'));
}
```

- [ ] **Step 2: Start the dev server and verify**

```bash
cd /Users/yeezuz/Desktop/nomadcuts && python app.py
```

Open `http://localhost:5001` and verify:
- Loader "NOMADCUTS" text appears and wipes up on first load; skipped on refresh
- Custom cursor dot + ring follows mouse (desktop only)
- Nav starts transparent over hero, goes dark on scroll
- Gold scroll progress bar appears as you scroll
- Hero H1 lines reveal from bottom, last line scrambles
- Stats numbers count up when you scroll to them
- Service cards stagger in on scroll
- Gallery images have gold wipe reveal
- Promo cards enter diagonally
- Hamburger opens full-screen overlay (mobile or narrow window)

Open `http://localhost:5001/agendar` and verify:
- Step indicator shows 3 steps
- Service cards are clickable, highlight gold on select
- Clicking "Continuar" without selecting shows toast
- Steps slide left/right with GSAP on navigation
- Step 3 shows summary with selected values
- Form submits normally on "Enviar solicitud"

Open `http://localhost:5001/servicios` and verify:
- Large faint numbers visible in top-right of each service card

Open `http://localhost:5001/agendar/pendiente` (simulate via test POST or direct access after booking) and verify:
- SVG checkmark draws itself
- Yappy steps fade in one by one with delay
- Gold particles burst from center

- [ ] **Step 3: Commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add static/js/script.js
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "feat: premium JS — GSAP loader, cursor, hero scramble, scroll animations, wizard, magnetic buttons"
```

---

### Task 7: Self-Review & Final Polish

**Files:**
- Modify: `static/css/style.css` (minor fixes if needed)

- [ ] **Step 1: Check mobile (resize browser to 375px wide)**

Verify:
- Custom cursor is NOT active (only desktop pointer devices)
- Loader still works
- Nav hamburger opens full-screen overlay with staggered links
- `service-selector` grid shows 2 columns
- Wizard step labels are hidden (only nodes show)
- All buttons are full-width readable
- Gallery is single column

- [ ] **Step 2: Check Safari / Firefox cross-browser**

`clip-path: inset(0 0 100% 0)` on `.hero-line` — verify this is `0 0 100% 0` not `inset(100%)`. Safari needs the four values.

If hero lines are invisible in Safari, they need initial opacity too. Add to CSS if needed:

```css
.hero-line { opacity: 0; }
```

Then in JS hero timeline, also animate opacity:
```javascript
tl.to(lines, {
  clipPath: 'inset(0 0 0% 0)',
  opacity: 1,
  stagger: 0.13,
  duration: 0.65,
  ease: 'power3.out'
}, eyebrow ? '-=0.2' : 0);
```

- [ ] **Step 3: Verify existing functionality is intact**

- Admin panel at `/admin/login` — unaffected ✓
- Review form submission at `/` — submits and redirects ✓
- Hours API at `/agendar/horas-tomadas?fecha=2026-05-09` returns JSON ✓
- Booking form POST at `/agendar` — all fields (nombre, email, telefono, servicio, fecha, hora, notas) submit correctly ✓

- [ ] **Step 4: Final commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add -A
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "fix: final polish — mobile, Safari clip-path, cross-browser checks"
```
