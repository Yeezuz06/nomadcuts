# NomadCuts Frontend Premium Overhaul — Plan Parte 1 (CSS + Templates)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the NomadCuts frontend into a premium, high-impact experience using GSAP animations, Space Grotesk typography, and refined micro-interactions across all public pages.

**Architecture:** All changes are in `static/css/style.css`, `static/js/script.js`, and 6 Jinja2 templates. No backend logic touched. GSAP 3 loaded from CDN. Part 1 = CSS + HTML templates. Part 2 = JavaScript.

**Tech Stack:** GSAP 3.12.5 (CDN), Space Grotesk (Google Fonts), vanilla JS, Flask/Jinja2.

---

### Task 1: CSS — Tokens & New Component Styles

**Files:**
- Modify: `static/css/style.css`

- [ ] **Step 1: Update `:root` block (lines 7–20)**

Replace the entire `:root { ... }` block with:

```css
:root {
  --bg:         #0A0A0A;
  --bg-2:       #131313;
  --bg-3:       #1C1C1C;
  --border:     #252525;
  --gold:       #E2B55A;
  --gold-light: #F0CC7A;
  --gold-dim:   #A07B30;
  --text:       #F0EDE8;
  --muted:      #6B6760;
  --radius:     6px;
  --font:       'Inter', sans-serif;
  --font-d:     'Space Grotesk', sans-serif;
  --font-serif: 'Playfair Display', serif;
  --trans:      .22s ease;
}
```

- [ ] **Step 2: Fix `.hero h1 em` rule**

Find `.hero h1 em` (around line 234) and replace it with:

```css
.hero h1 em {
  font-style: italic;
  font-family: var(--font-serif);
  color: var(--gold);
}
```

- [ ] **Step 3: Fix `.nav` to allow transparent state**

Find the `.nav {` rule and add `transition` at the end:

```css
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 68px;
  background: rgba(10,10,10,.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  transition: background .35s ease, border-color .35s ease, backdrop-filter .35s ease;
}
```

- [ ] **Step 4: Append all new CSS at the end of `style.css`**

Add the following block at the very end of the file:

```css
/* ============================================================
   NomadCuts — Premium additions
   ============================================================ */

/* ── Star spans for review animation ── */
.resena-stars .star-active  { color: var(--gold); }
.resena-stars .star-inactive { color: var(--border); }

/* ── Custom Cursor ── */
.cursor-dot {
  width: 8px; height: 8px;
  background: var(--gold);
  border-radius: 50%;
  position: fixed;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: transform .1s ease;
}
.cursor-ring {
  width: 36px; height: 36px;
  border: 1.5px solid rgba(226,181,90,.6);
  border-radius: 50%;
  position: fixed;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 9998;
  transform: translate(-50%, -50%);
  transition: width .2s ease, height .2s ease, border-color .2s ease;
}
.cursor-ring.expand {
  width: 52px; height: 52px;
  border-color: var(--gold-light);
}
body.has-custom-cursor * { cursor: none !important; }

/* ── Page Loader ── */
.loader {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader.hidden { display: none; }
.loader-text {
  font-family: var(--font-d);
  font-size: clamp(28px, 5vw, 52px);
  font-weight: 700;
  letter-spacing: .2em;
  color: var(--gold);
}

/* ── Scroll Progress Bar ── */
.scroll-progress {
  position: absolute;
  bottom: -1px; left: 0;
  height: 2px;
  width: 0%;
  background: linear-gradient(to right, var(--gold), var(--gold-light));
  z-index: 101;
  pointer-events: none;
}

/* ── Nav transparent state ── */
.nav.transparent {
  background: transparent !important;
  border-bottom-color: transparent !important;
  backdrop-filter: none !important;
}

/* ── Nav mobile full-screen overlay ── */
.nav-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 200;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}
.nav-overlay.open { display: flex; }
.nav-overlay a {
  font-family: var(--font-d);
  font-size: clamp(26px, 6vw, 46px);
  font-weight: 700;
  color: var(--text);
  letter-spacing: .03em;
  transition: color var(--trans);
  opacity: 0;
  transform: translateY(24px);
}
.nav-overlay a:hover { color: var(--gold); }
.nav-overlay-close {
  position: absolute;
  top: 24px; right: 28px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  transition: color var(--trans);
}
.nav-overlay-close:hover { color: var(--text); }

/* ── Hero line split ── */
.hero-line {
  display: block;
  clip-path: inset(0 0 100% 0);
}

/* ── Ken Burns on hero image ── */
@keyframes kenBurns {
  from { transform: scale(1); }
  to   { transform: scale(1.07); }
}
.hero-bg img {
  animation: kenBurns 14s ease-in-out infinite alternate;
}

/* ── Hero scroll indicator bounce ── */
@keyframes scrollBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(10px); }
}
.hero-scroll { animation: scrollBounce 2.2s ease-in-out infinite; }

/* ── Gallery wipe reveal ── */
.gallery-reveal {
  position: relative;
  overflow: hidden;
}
.gallery-wipe {
  position: absolute;
  inset: 0;
  background: var(--gold);
  z-index: 2;
  transform-origin: right;
  pointer-events: none;
}

/* ── Promo badge pulse ── */
@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.06); }
}
.promo-badge { animation: badgePulse 2.2s ease-in-out infinite; }

/* ── Service card numbered label ── */
.service-card { position: relative; }
.service-card-num {
  position: absolute;
  top: 12px; right: 16px;
  font-family: var(--font-d);
  font-size: 60px;
  font-weight: 700;
  color: rgba(226,181,90,.07);
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

/* ── Wizard Steps ── */
.wizard-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin-bottom: 48px;
}
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.wizard-connector {
  flex: 1;
  height: 1px;
  background: var(--border);
  margin-top: 18px;
  transition: background .4s ease;
}
.wizard-connector.done { background: var(--gold); }
.wizard-step-node {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  background: var(--bg);
  transition: all .3s ease;
  z-index: 1;
  flex-shrink: 0;
}
.wizard-step.active .wizard-step-node {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(226,181,90,.1);
}
.wizard-step.done .wizard-step-node {
  border-color: var(--gold);
  background: var(--gold);
  color: #0A0A0A;
}
.wizard-step-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
  transition: color .3s ease;
}
.wizard-step.active .wizard-step-label { color: var(--gold); }
.wizard-step.done .wizard-step-label   { color: var(--gold); }

/* ── Wizard Panels ── */
.wizard-panels {
  position: relative;
  overflow: hidden;
}
.wizard-panel {
  display: none;
  opacity: 0;
}
.wizard-panel.active {
  display: block;
  opacity: 1;
}

/* ── Service Selector Cards ── */
.service-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 24px;
}
.service-option { display: none; }
.service-option + label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 16px;
  background: var(--bg-2);
  cursor: pointer;
  transition: background var(--trans);
}
.service-option + label:hover { background: var(--bg-3); }
.service-option:checked + label {
  background: rgba(226,181,90,.08);
  box-shadow: inset 0 0 0 1.5px var(--gold);
}
.service-option-name {
  font-family: var(--font-d);
  font-size: 14px;
  font-weight: 600;
}
.service-option-price {
  font-size: 13px;
  color: var(--gold);
  font-weight: 600;
}

/* ── Floating Labels ── */
.form-floating {
  position: relative;
  margin-bottom: 20px;
}
.form-floating input,
.form-floating textarea {
  padding-top: 24px;
  padding-bottom: 8px;
}
.form-floating > label {
  position: absolute;
  top: 14px; left: 16px;
  font-size: 14px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--muted);
  pointer-events: none;
  transition: transform .18s ease, font-size .18s ease, color .18s ease, letter-spacing .18s ease;
  transform-origin: left top;
  margin: 0;
}
.form-floating input:focus ~ label,
.form-floating input:not(:placeholder-shown) ~ label,
.form-floating textarea:focus ~ label,
.form-floating textarea:not(:placeholder-shown) ~ label {
  transform: translateY(-9px) scale(0.78);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--gold);
}

/* ── Wizard navigation buttons ── */
.wizard-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  gap: 12px;
}
.wizard-nav .btn { min-width: 130px; justify-content: center; }

/* ── Wizard summary table ── */
.wizard-summary {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
  margin-bottom: 20px;
}
.wizard-summary table { width: 100%; border-collapse: collapse; font-size: 14px; }
.wizard-summary td { padding: 9px 0; border-bottom: 1px solid var(--border); }
.wizard-summary tr:last-child td { border-bottom: none; }
.wizard-summary td:first-child { color: var(--muted); }
.wizard-summary td:last-child { text-align: right; font-weight: 500; }

/* ── SVG Checkmark animation ── */
.checkmark-wrap {
  width: 80px; height: 80px;
  margin: 0 auto 32px;
}
.checkmark-circle {
  stroke: var(--gold);
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  animation: drawCircle .65s ease forwards .15s;
}
.checkmark-check {
  stroke: var(--gold);
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: drawCheck .4s ease forwards .8s;
}
@keyframes drawCircle { to { stroke-dashoffset: 0; } }
@keyframes drawCheck  { to { stroke-dashoffset: 0; } }

/* ── Particles ── */
.particles-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.particle {
  position: absolute;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
  opacity: 0;
}

/* ── Yappy steps ── */
.yappy-step {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid rgba(58,40,0,.6);
  opacity: 0;
  transform: translateY(12px);
}
.yappy-step:last-child { border-bottom: none; }
.yappy-step.visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity .4s ease, transform .4s ease;
}
.yappy-step-num {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(226,181,90,.15);
  border: 1px solid var(--gold-dim);
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Responsive additions ── */
@media (max-width: 680px) {
  .service-selector { grid-template-columns: 1fr 1fr; }
  .wizard-step-label { display: none; }
  .wizard-steps { margin-bottom: 32px; }
}
```

- [ ] **Step 5: Commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add static/css/style.css
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "style: premium CSS — tokens, cursor, loader, wizard, gallery-reveal, animations"
```

---

### Task 2: `base.html` — GSAP CDN, Cursor, Loader, Nav Overlay

**Files:**
- Modify: `templates/base.html`

- [ ] **Step 1: Replace `templates/base.html` entirely**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{% block title %}NomadCuts{% endblock %}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}" />
</head>
<body>

  <!-- ── Loader ── -->
  <div class="loader" id="page-loader">
    <span class="loader-text"></span>
  </div>

  <!-- ── Custom Cursor ── -->
  <div class="cursor-dot" id="cursor-dot"></div>
  <div class="cursor-ring" id="cursor-ring"></div>

  <!-- ── Navegación ── -->
  <nav class="nav" id="main-nav">
    <a href="{{ url_for('inicio') }}" class="nav-logo">
      <img src="{{ url_for('static', filename='img/logo.png') }}"
           alt="NomadCuts"
           class="nav-logo-img"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
      <span class="nav-logo-fallback">NOMADCUTS</span>
    </a>
    <div class="nav-links">
      <a href="{{ url_for('inicio') }}">Inicio</a>
      <a href="{{ url_for('servicios') }}">Servicios</a>
      <a href="{{ url_for('promociones') }}">Promociones</a>
      <a href="{{ url_for('agendar') }}" class="nav-cta">Agendar cita</a>
    </div>
    <button class="nav-toggle" id="nav-toggle" aria-label="Menú">
      <span></span><span></span><span></span>
    </button>
    <div class="scroll-progress" id="scroll-progress"></div>
  </nav>

  <!-- ── Mobile Overlay ── -->
  <div class="nav-overlay" id="nav-overlay">
    <button class="nav-overlay-close" id="nav-overlay-close" aria-label="Cerrar">×</button>
    <a href="{{ url_for('inicio') }}">Inicio</a>
    <a href="{{ url_for('servicios') }}">Servicios</a>
    <a href="{{ url_for('promociones') }}">Promociones</a>
    <a href="{{ url_for('agendar') }}" style="color:var(--gold);">Agendar cita</a>
  </div>

  <main>{% block content %}{% endblock %}</main>

  <!-- ── Footer ── -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo">NOMADCUTS</span>
        <p>Barbería de precisión. A tu puerta.</p>
        <p style="margin-top:8px;font-size:13px;">📍 Panamá · Servicio a domicilio</p>
      </div>
      <div class="footer-links">
        <a href="{{ url_for('inicio') }}">Inicio</a>
        <a href="{{ url_for('servicios') }}">Servicios</a>
        <a href="{{ url_for('promociones') }}">Promociones</a>
        <a href="{{ url_for('agendar') }}">Agendar cita</a>
      </div>
      <div class="footer-contact">
        <p>¿Dudas o consultas?</p>
        <a href="mailto:hypestbasiclatam@gmail.com">hypestbasiclatam@gmail.com</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 NomadCuts. Todos los derechos reservados.</p>
    </div>
  </footer>

  <!-- ── WhatsApp FAB ── -->
  <a href="https://wa.me/50763286461?text=Hola%20NomadCuts%2C%20quiero%20consultar%20sobre%20un%20corte%20a%20domicilio"
     target="_blank" rel="noopener" class="whatsapp-fab" aria-label="Contactar por WhatsApp">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
    <span class="whatsapp-fab-label">WhatsApp</span>
  </a>

  <!-- ── GSAP ── -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/TextPlugin.min.js"></script>
  <script src="{{ url_for('static', filename='js/script.js') }}"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add templates/base.html
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "feat: base.html — GSAP CDN, cursor, loader, scroll-progress, nav overlay"
```

---

### Task 3: `index.html` — Hero Split Lines, Stats Strip, Gallery Wipe, Star Spans

**Files:**
- Modify: `templates/index.html`

- [ ] **Step 1: Replace `templates/index.html` entirely**

```html
{% extends "base.html" %}
{% block title %}NomadCuts — Barbería a Domicilio · Panamá{% endblock %}

{% block content %}

<!-- ── Hero ─────────────────────────────────────────────────── -->
<section class="hero">
  <div class="hero-bg">
    <img src="{{ url_for('static', filename='img/hero.jpg') }}" alt="NomadCuts" />
    <div class="hero-overlay"></div>
  </div>
  <div class="hero-inner">
    <p class="hero-eyebrow">Barbería profesional a domicilio · Panamá</p>
    <h1>
      <span class="hero-line">El corte</span>
      <span class="hero-line">que <em>mereces</em>,</span>
      <span class="hero-line">donde estés.</span>
    </h1>
    <p class="hero-sub">
      NomadCuts lleva la experiencia de una barbería de primer nivel
      directamente a tu hogar, oficina o donde nos necesites.
    </p>
    <div class="hero-actions">
      <a href="{{ url_for('agendar') }}" class="btn btn-primary">
        Agendar cita
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
      <a href="{{ url_for('servicios') }}" class="btn btn-glass">Ver servicios</a>
    </div>
  </div>
  <div class="hero-scroll">Scroll</div>
</section>

<!-- ── Stats ─────────────────────────────────────────────────── -->
<div class="stats">
  <div class="stats-grid">
    <div class="stat">
      <div class="stat-num" data-count="200" data-suffix="+">0+</div>
      <div class="stat-label">Clientes atendidos</div>
    </div>
    <div class="stat">
      <div class="stat-num" data-count="4.9" data-suffix="★">4.9★</div>
      <div class="stat-label">Calificación promedio</div>
    </div>
    <div class="stat">
      <div class="stat-num" data-count="3" data-suffix=" años">3 años</div>
      <div class="stat-label">En Panamá</div>
    </div>
  </div>
</div>

<!-- ── Servicios ──────────────────────────────────────────────── -->
<section class="section container">
  <span class="tag">Lo que hacemos</span>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px;flex-wrap:wrap;gap:16px;">
    <h2 style="font-family:var(--font-d);font-size:clamp(28px,4vw,42px);">Servicios</h2>
    <a href="{{ url_for('servicios') }}" class="btn btn-outline">Ver todos</a>
  </div>
  <div class="services-grid">
    <div class="service-card">
      <span class="service-card-num">01</span>
      <div class="service-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 3c0 0 2 1 2 4s-2 4-2 4M18 3c0 0-2 1-2 4s2 4 2 4M12 21V11M12 11c0 0-4-1-4-5M12 11c0 0 4-1 4-5"/>
        </svg>
      </div>
      <div class="service-name">Corte Clásico</div>
      <p class="service-desc">Tijeras, navaja y acabado perfecto. El clásico reinventado con precisión.</p>
      <div class="service-price">$15 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">02</span>
      <div class="service-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M3 6l2 12h14l2-12M9 11v4M15 11v4M3 6l1-3h16l1 3"/>
        </svg>
      </div>
      <div class="service-name">Barba Premium</div>
      <p class="service-desc">Perfilado, rasurado con navaja caliente y tratamiento con aceites naturales.</p>
      <div class="service-price">$12 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">03</span>
      <div class="service-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="service-name">Pack Completo</div>
      <p class="service-desc">Corte + Barba + Tratamiento capilar. La experiencia NomadCuts completa.</p>
      <div class="service-price">$24 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">04</span>
      <div class="service-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
        </svg>
      </div>
      <div class="service-name">Degradado / Fade</div>
      <p class="service-desc">Skin fade, low fade, mid fade o high fade. Transiciones perfectas.</p>
      <div class="service-price">$18 <span>/ visita</span></div>
    </div>
  </div>
</section>

<!-- ── Galería ───────────────────────────────────────────────── -->
<section class="section container" style="padding-top:0;">
  <span class="tag">El trabajo habla</span>
  <div class="divider"></div>
  <h2 style="font-family:var(--font-d);font-size:clamp(28px,4vw,42px);margin-bottom:40px;">Precisión en cada detalle.</h2>
  <div class="gallery">
    <div class="gallery-main">
      <div class="gallery-reveal">
        <div class="gallery-wipe"></div>
        <img src="{{ url_for('static', filename='img/corte.jpg') }}" alt="Corte de cabello" />
      </div>
    </div>
    <div class="gallery-grid">
      <div class="gallery-reveal">
        <div class="gallery-wipe"></div>
        <img src="{{ url_for('static', filename='img/maquina.jpg') }}" alt="Máquina de corte" />
      </div>
      <div class="gallery-reveal">
        <div class="gallery-wipe"></div>
        <img src="{{ url_for('static', filename='img/navaja.jpg') }}" alt="Navaja barbera" />
      </div>
      <div class="gallery-reveal">
        <div class="gallery-wipe"></div>
        <img src="{{ url_for('static', filename='img/rasurado.jpg') }}" alt="Rasurado con navaja" />
      </div>
      <div class="gallery-reveal">
        <div class="gallery-wipe"></div>
        <img src="{{ url_for('static', filename='img/tijeras.jpg') }}" alt="Tijeras profesionales" />
      </div>
    </div>
  </div>
</section>

<!-- ── Promociones ───────────────────────────────────────────── -->
{% if promociones %}
<section class="section container" style="padding-top:0;">
  <span class="tag">Ofertas activas</span>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px;flex-wrap:wrap;gap:16px;">
    <h2 style="font-family:var(--font-d);font-size:clamp(28px,4vw,42px);">Promociones</h2>
    <a href="{{ url_for('promociones') }}" class="btn btn-outline">Ver todas</a>
  </div>
  <div class="promos-grid">
    {% for p in promociones %}
    <div class="promo-card">
      <div class="promo-badge">{{ p['descuento'] }}</div>
      <div class="promo-title">{{ p['titulo'] }}</div>
      <p class="promo-desc">{{ p['descripcion'] }}</p>
      <a href="{{ url_for('agendar') }}" class="btn btn-primary" style="margin-top:auto;width:100%;justify-content:center;">
        Aprovechar
      </a>
    </div>
    {% endfor %}
  </div>
</section>
{% endif %}

<!-- ── Reseñas ──────────────────────────────────────────────── -->
<section class="section container" id="resenas" style="padding-top:0;">
  <span class="tag">Lo que dicen</span>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px;flex-wrap:wrap;gap:16px;">
    <h2 style="font-family:var(--font-d);font-size:clamp(28px,4vw,42px);">Opiniones de clientes</h2>
  </div>

  {% if resenas %}
  <div class="resenas-grid">
    {% for r in resenas %}
    <div class="resena-card">
      <div class="resena-stars">
        {% for i in range(r['estrellas']) %}<span class="star-active">★</span>{% endfor %}{% for i in range(5 - r['estrellas']) %}<span class="star-inactive">★</span>{% endfor %}
      </div>
      <p class="resena-texto">"{{ r['comentario'] }}"</p>
      <div class="resena-autor">— {{ r['nombre'] }}</div>
    </div>
    {% endfor %}
  </div>
  {% else %}
  <div style="text-align:center;padding:40px 0;color:var(--muted);">
    <p>Sé el primero en dejar una reseña ✂️</p>
  </div>
  {% endif %}

  <div class="resena-form-wrap" style="margin-top:56px;">
    <h3 style="font-family:var(--font-d);font-size:22px;margin-bottom:6px;">¿Ya usaste el servicio?</h3>
    <p style="color:var(--muted);font-size:14px;margin-bottom:28px;">Déjanos tu opinión — ayuda a otros clientes.</p>
    <form action="{{ url_for('nueva_resena') }}" method="POST" class="resena-form">
      <div class="form-row">
        <div class="form-group">
          <label for="r-nombre">Tu nombre</label>
          <input type="text" id="r-nombre" name="nombre" placeholder="Ej: Carlos M." required maxlength="60">
        </div>
        <div class="form-group">
          <label>Calificación</label>
          <div class="star-picker" id="star-picker">
            {% for i in range(1,6) %}
            <button type="button" class="star-btn" data-val="{{ i }}">★</button>
            {% endfor %}
          </div>
          <input type="hidden" name="estrellas" id="estrellas-val" value="5">
        </div>
      </div>
      <div class="form-group">
        <label for="r-comentario">Comentario</label>
        <textarea id="r-comentario" name="comentario" rows="3" placeholder="¿Cómo fue tu experiencia?" required maxlength="400"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Publicar reseña</button>
    </form>
  </div>
</section>

<!-- ── CTA Final ─────────────────────────────────────────────── -->
<section class="section container" style="padding-top:0;">
  <div class="cta-banner">
    <div class="cta-banner-bg">
      <img src="{{ url_for('static', filename='img/rasurado2.jpg') }}" alt="" />
      <div class="cta-banner-overlay"></div>
    </div>
    <div class="cta-banner-content">
      <span class="tag">¿Listo?</span>
      <h2>Agenda tu cita hoy</h2>
      <p>Sin filas, sin esperas. Solo tú, un corte de calidad y la comodidad de tu hogar.</p>
      <a href="{{ url_for('agendar') }}" class="btn btn-primary" style="padding:16px 40px;font-size:14px;">
        Reservar ahora
      </a>
    </div>
  </div>
</section>

{% endblock %}
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add templates/index.html
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "feat: index.html — hero split, stats strip, gallery-reveal, star spans"
```

---

### Task 4: `servicios.html`, `promociones.html`, `cita_confirmada.html`

**Files:**
- Modify: `templates/servicios.html`
- Modify: `templates/promociones.html`
- Modify: `templates/cita_confirmada.html`

- [ ] **Step 1: Replace `templates/servicios.html`**

```html
{% extends "base.html" %}
{% block title %}Servicios — NomadCuts{% endblock %}

{% block content %}
<div class="container">
  <div class="page-header">
    <span class="tag">Lo que ofrecemos</span>
    <h1>Servicios</h1>
    <p>Precisión profesional en la comodidad de tu espacio.</p>
  </div>

  <div class="services-grid" style="margin-bottom:64px;">
    <div class="service-card">
      <span class="service-card-num">01</span>
      <div class="service-icon">✂️</div>
      <div class="service-name">Corte Clásico</div>
      <p class="service-desc">Corte con tijeras y máquina, acabado con navaja y fijador. Incluye lavado y secado. Adaptado a tu tipo de cabello y estilo personal.</p>
      <div class="service-price">$15 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">02</span>
      <div class="service-icon">🪒</div>
      <div class="service-name">Barba Premium</div>
      <p class="service-desc">Perfilado con navaja caliente, tratamiento hidratante con aceite de barba y toalla caliente. Un ritual completo para tu barba.</p>
      <div class="service-price">$12 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">03</span>
      <div class="service-icon">💎</div>
      <div class="service-name">Pack Completo</div>
      <p class="service-desc">Corte + Barba + Tratamiento capilar hidratante. La experiencia NomadCuts en su máxima expresión. Ahorra vs contratar por separado.</p>
      <div class="service-price">$24 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">04</span>
      <div class="service-icon">👦</div>
      <div class="service-name">Corte Niños</div>
      <p class="service-desc">Para menores de 12 años. Trabajamos con paciencia y herramientas suaves para que la experiencia sea cómoda y el resultado increíble.</p>
      <div class="service-price">$10 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">05</span>
      <div class="service-icon">🎨</div>
      <div class="service-name">Degradado / Fade</div>
      <p class="service-desc">Transiciones suaves y precisas. Skin fade, low fade, mid fade o high fade. Acabado profesional garantizado.</p>
      <div class="service-price">$18 <span>/ visita</span></div>
    </div>
    <div class="service-card">
      <span class="service-card-num">06</span>
      <div class="service-icon">🏢</div>
      <div class="service-name">Servicio Corporativo</div>
      <p class="service-desc">Visita a oficinas o eventos. Atendemos múltiples personas en un mismo día. Cotización especial para grupos de 5 o más.</p>
      <div class="service-price">Cotizar <span>/ grupo</span></div>
    </div>
  </div>

  <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);padding:56px 40px;text-align:center;margin-bottom:80px;">
    <h2 style="font-family:var(--font-d);font-size:32px;margin-bottom:10px;">¿Qué servicio necesitas?</h2>
    <p style="color:var(--muted);margin-bottom:28px;">Elige, agenda y nosotros llegamos a ti.</p>
    <a href="{{ url_for('agendar') }}" class="btn btn-primary">Agendar ahora</a>
  </div>
</div>
{% endblock %}
```

- [ ] **Step 2: Replace `templates/cita_confirmada.html`**

```html
{% extends "base.html" %}
{% block title %}Solicitud Recibida — NomadCuts{% endblock %}

{% block content %}
<div class="success-page" style="position:relative;overflow:hidden;">
  <div class="particles-container" id="particles"></div>
  <div style="max-width:500px;width:100%;position:relative;z-index:1;">

    <!-- SVG Checkmark animado -->
    <div class="checkmark-wrap">
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle class="checkmark-circle" cx="40" cy="40" r="36"/>
        <path class="checkmark-check" d="M24 40l12 12 20-22"/>
      </svg>
    </div>

    <span class="tag">Solicitud recibida · Cita #{{ cita_id }}</span>
    <h2 style="margin-bottom:8px;">¡Casi listo, {{ nombre }}!</h2>
    <p style="color:var(--muted);margin-bottom:28px;">
      Tu solicitud está pendiente. Realiza el depósito de ${{ "%.2f"|format(deposito) }} por Yappy para confirmar.
    </p>

    <!-- Resumen -->
    <div class="wizard-summary" style="text-align:left;">
      <table>
        <tr>
          <td>Servicio</td>
          <td>{{ servicio }}</td>
        </tr>
        <tr>
          <td>Fecha</td>
          <td>{{ fecha }}</td>
        </tr>
        <tr>
          <td>Hora</td>
          <td>{{ hora }}</td>
        </tr>
      </table>
    </div>

    <!-- Instrucciones Yappy con pasos animados -->
    <div style="background:#110D00;border:1px solid #3A2800;border-radius:var(--radius);padding:24px;margin-bottom:28px;text-align:left;">
      <p style="color:var(--gold);font-weight:700;margin:0 0 18px;font-size:15px;">💳 Deposita ${{ "%.2f"|format(deposito) }} por Yappy</p>

      <div class="yappy-step" id="ys1">
        <div class="yappy-step-num">1</div>
        <div>
          <p style="color:var(--text);font-size:13px;font-weight:600;margin:0 0 2px;">Abre Yappy</p>
          <p style="color:var(--muted);font-size:12px;margin:0;">Ingresa a la app Yappy en tu teléfono.</p>
        </div>
      </div>
      <div class="yappy-step" id="ys2">
        <div class="yappy-step-num">2</div>
        <div>
          <p style="color:var(--text);font-size:13px;font-weight:600;margin:0 0 4px;">Envía al número</p>
          <div style="background:var(--bg-3);border:1px solid var(--border);border-radius:4px;padding:10px;text-align:center;margin-top:6px;">
            <span style="font-size:22px;font-weight:700;color:var(--text);letter-spacing:.06em;">{{ yappy }}</span>
          </div>
        </div>
      </div>
      <div class="yappy-step" id="ys3">
        <div class="yappy-step-num">3</div>
        <div>
          <p style="color:var(--text);font-size:13px;font-weight:600;margin:0 0 4px;">Escribe en el comentario:</p>
          <div style="background:var(--bg-3);border:1px dashed var(--gold-dim);border-radius:4px;padding:10px;text-align:center;margin-top:6px;">
            <span style="color:var(--gold);font-weight:700;font-size:14px;letter-spacing:.04em;">NomadCuts #{{ cita_id }}</span>
          </div>
        </div>
      </div>

      <p style="color:var(--muted);font-size:12px;margin:16px 0 0;">
        Recibirás un correo de confirmación una vez verifiquemos tu pago.
      </p>
    </div>

    <!-- Aviso spam -->
    <div style="background:#0A0A14;border:1px solid #1E1E3A;border-radius:var(--radius);padding:14px 18px;margin-bottom:28px;display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:18px;flex-shrink:0;">📬</span>
      <p style="color:var(--muted);font-size:12px;margin:0;line-height:1.6;">
        Te enviamos un correo con los detalles.<br>
        <strong style="color:var(--text);">Si no lo ves en 5 minutos, revisa Spam</strong>
        y márcalo como <em>"No es spam"</em>.
      </p>
    </div>

    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <a href="{{ url_for('inicio') }}" class="btn btn-outline">Volver al inicio</a>
      <a href="{{ url_for('agendar') }}" class="btn btn-primary">Nueva cita</a>
    </div>
  </div>
</div>

<script>
// Animate Yappy steps with delay
(function() {
  const steps = ['ys1','ys2','ys3'];
  steps.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }, 900 + i * 300);
  });

  // Particle burst
  const container = document.getElementById('particles');
  if (!container) return;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    container.appendChild(p);
    const angle = (i / 14) * Math.PI * 2;
    const dist  = 80 + Math.random() * 120;
    const tx    = Math.cos(angle) * dist;
    const ty    = Math.sin(angle) * dist;
    const size  = 4 + Math.random() * 5;
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;`;

    if (typeof gsap !== 'undefined') {
      gsap.to(p, {
        x: tx, y: ty,
        opacity: 1,
        duration: 0.4,
        delay: 0.7 + i * 0.03,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(p, { opacity: 0, y: ty + 40, duration: 0.5, ease: 'power1.in' });
        }
      });
    }
  }
})();
</script>
{% endblock %}
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add templates/servicios.html templates/cita_confirmada.html
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "feat: servicios numbered cards, cita_confirmada checkmark + particles"
```

---

### Task 5: `agendar.html` — 3-Step Wizard

**Files:**
- Modify: `templates/agendar.html`

- [ ] **Step 1: Replace `templates/agendar.html` entirely**

The form still POSTs to `{{ url_for('agendar') }}` with all original `name` attributes preserved.

```html
{% extends "base.html" %}
{% block title %}Agendar Cita — NomadCuts{% endblock %}

{% block content %}
<div class="container">
  <div class="page-header">
    <span class="tag">Sin filas, sin esperas</span>
    <h1>Agenda tu cita</h1>
    <p>Tres pasos. Llegamos a ti.</p>
  </div>

  <div class="form-section">

    {% if error %}
    <div style="background:#1A0808;border:1px solid #5A1A1A;border-radius:var(--radius);padding:16px 20px;margin-bottom:24px;display:flex;gap:12px;align-items:center;">
      <span style="font-size:18px;">⚠️</span>
      <p style="color:#FF6B6B;margin:0;font-size:14px;">{{ error }}</p>
    </div>
    {% endif %}

    <!-- Step indicator -->
    <div class="wizard-steps" id="wizard-steps">
      <div class="wizard-step active" data-step="0">
        <div class="wizard-step-node">1</div>
        <span class="wizard-step-label">Servicio</span>
      </div>
      <div class="wizard-connector" id="wc1"></div>
      <div class="wizard-step" data-step="1">
        <div class="wizard-step-node">2</div>
        <span class="wizard-step-label">Tus datos</span>
      </div>
      <div class="wizard-connector" id="wc2"></div>
      <div class="wizard-step" data-step="2">
        <div class="wizard-step-node">3</div>
        <span class="wizard-step-label">Confirmación</span>
      </div>
    </div>

    <form method="POST" action="{{ url_for('agendar') }}" id="wizard-form">
      <div class="wizard wizard-panels" id="wizard">

        <!-- ── Panel 0: Servicio + Fecha/Hora ── -->
        <div class="wizard-panel active" id="panel-0">
          <label style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;display:block;">
            Elige tu servicio
          </label>
          <div class="service-selector">
            <input type="radio" class="service-option" id="s1" name="servicio" value="Corte Clásico — $15" required />
            <label for="s1">
              <span class="service-option-name">Corte Clásico</span>
              <span class="service-option-price">$15</span>
            </label>
            <input type="radio" class="service-option" id="s2" name="servicio" value="Barba Premium — $12" />
            <label for="s2">
              <span class="service-option-name">Barba Premium</span>
              <span class="service-option-price">$12</span>
            </label>
            <input type="radio" class="service-option" id="s3" name="servicio" value="Pack Completo — $24" />
            <label for="s3">
              <span class="service-option-name">Pack Completo</span>
              <span class="service-option-price">$24</span>
            </label>
            <input type="radio" class="service-option" id="s4" name="servicio" value="Corte Niños — $10" />
            <label for="s4">
              <span class="service-option-name">Corte Niños</span>
              <span class="service-option-price">$10</span>
            </label>
            <input type="radio" class="service-option" id="s5" name="servicio" value="Degradado / Fade — $18" />
            <label for="s5">
              <span class="service-option-name">Degradado / Fade</span>
              <span class="service-option-price">$18</span>
            </label>
            <input type="radio" class="service-option" id="s6" name="servicio" value="Servicio Corporativo" />
            <label for="s6">
              <span class="service-option-name">Corporativo</span>
              <span class="service-option-price">Cotizar</span>
            </label>
          </div>

          <div class="form-row" style="margin-top:24px;">
            <div class="form-group">
              <label for="fecha">Fecha</label>
              <input type="date" id="fecha" name="fecha" required />
            </div>
            <div class="form-group">
              <label for="hora">
                Hora disponible
                <span id="cargando-horas" style="color:var(--muted);font-weight:400;text-transform:none;display:none;"> · cargando...</span>
              </label>
              <select id="hora" name="hora" required>
                <option value="" disabled selected>Primero selecciona una fecha</option>
              </select>
            </div>
          </div>

          <div class="wizard-nav">
            <span></span>
            <button type="button" class="btn btn-primary" data-next="1">
              Continuar
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <!-- ── Panel 1: Datos personales ── -->
        <div class="wizard-panel" id="panel-1">
          <div class="form-row">
            <div class="form-floating">
              <input type="text" id="nombre" name="nombre" placeholder=" " required />
              <label for="nombre">Nombre completo</label>
            </div>
            <div class="form-floating">
              <input type="tel" id="telefono" name="telefono" placeholder=" " required />
              <label for="telefono">Teléfono</label>
            </div>
          </div>
          <div class="form-floating">
            <input type="email" id="email" name="email" placeholder=" " required />
            <label for="email">Correo electrónico</label>
          </div>
          <div class="form-floating">
            <textarea id="notas" name="notas" placeholder=" " rows="3"></textarea>
            <label for="notas">Notas adicionales (opcional)</label>
          </div>

          <div class="wizard-nav">
            <button type="button" class="btn btn-outline" data-prev="0">← Atrás</button>
            <button type="button" class="btn btn-primary" data-next="2">
              Continuar
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <!-- ── Panel 2: Confirmación ── -->
        <div class="wizard-panel" id="panel-2">
          <h3 style="font-family:var(--font-d);font-size:20px;margin-bottom:20px;">Confirma tu solicitud</h3>

          <div class="wizard-summary">
            <table>
              <tr>
                <td>Servicio</td>
                <td id="summary-servicio">—</td>
              </tr>
              <tr>
                <td>Fecha</td>
                <td id="summary-fecha">—</td>
              </tr>
              <tr>
                <td>Hora</td>
                <td id="summary-hora">—</td>
              </tr>
              <tr>
                <td>Nombre</td>
                <td id="summary-nombre">—</td>
              </tr>
            </table>
          </div>

          <!-- Depósito Yappy -->
          <div style="background:#110D00;border:1px solid #3A2800;border-radius:var(--radius);padding:16px 20px;margin-bottom:24px;display:flex;gap:12px;align-items:flex-start;">
            <span style="font-size:20px;flex-shrink:0;">💳</span>
            <div>
              <p style="color:var(--gold);font-weight:600;margin:0 0 4px;font-size:14px;">Se requiere depósito de $5 por Yappy</p>
              <p style="color:var(--muted);font-size:13px;margin:0;">Recibirás las instrucciones por correo al enviar la solicitud.</p>
            </div>
          </div>

          <div class="wizard-nav">
            <button type="button" class="btn btn-outline" data-prev="1">← Atrás</button>
            <button type="submit" class="btn btn-primary" style="padding:14px 36px;">
              Enviar solicitud
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

      </div><!-- /.wizard-panels -->
    </form>
  </div>
</div>

<script>
// ── Hours fetcher (unchanged logic) ──────────────────────────
function fmt(h) {
  const n = parseInt(h);
  return n < 12 ? `${n}:00 AM` : n === 12 ? '12:00 PM' : `${n-12}:00 PM`;
}

const inputFecha = document.getElementById('fecha');
const selectHora = document.getElementById('hora');
const cargando   = document.getElementById('cargando-horas');

const hoy = new Date();
hoy.setDate(hoy.getDate() + 1);
inputFecha.min = hoy.toISOString().split('T')[0];

inputFecha.addEventListener('change', async () => {
  const fecha = inputFecha.value;
  if (!fecha) return;
  cargando.style.display = 'inline';
  selectHora.innerHTML = '<option value="" disabled selected>Cargando...</option>';
  selectHora.disabled = true;
  const res  = await fetch(`/agendar/horas-tomadas?fecha=${fecha}`);
  const data = await res.json();
  cargando.style.display = 'none';
  selectHora.innerHTML = '';
  selectHora.disabled = false;
  if (data.cerrado) {
    selectHora.innerHTML = '<option value="" disabled selected>❌ No trabajamos ese día</option>';
    selectHora.disabled = true;
    return;
  }
  const disponibles = data.disponibles || [];
  const tomadas     = data.tomadas || [];
  if (!disponibles.length) {
    selectHora.innerHTML = '<option value="" disabled selected>Sin horas disponibles</option>';
    selectHora.disabled = true;
    return;
  }
  const ph = document.createElement('option');
  ph.value = ''; ph.disabled = true; ph.selected = true;
  ph.textContent = 'Selecciona una hora';
  selectHora.appendChild(ph);
  disponibles.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    if (tomadas.includes(h)) {
      opt.textContent = `${fmt(h)} — Ocupado`;
      opt.disabled = true;
      opt.style.color = '#555';
    } else {
      opt.textContent = fmt(h);
    }
    selectHora.appendChild(opt);
  });
});
</script>
{% endblock %}
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/yeezuz/Desktop/nomadcuts add templates/agendar.html
git -C /Users/yeezuz/Desktop/nomadcuts commit -m "feat: agendar — 3-step wizard with service cards and floating labels"
```
