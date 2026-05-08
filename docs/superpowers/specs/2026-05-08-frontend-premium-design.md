# NomadCuts — Frontend Premium Overhaul
**Date:** 2026-05-08  
**Scope:** All public-facing pages, frontend only  
**Stack:** Flask/Jinja2 templates, vanilla CSS, GSAP 3 (CDN)

---

## Goals
Transform the existing dark/gold UI into a premium, high-impact experience using aggressive animations, GSAP scroll effects, and refined typography — without touching backend logic.

---

## Visual Identity Changes

| Token | Before | After |
|---|---|---|
| `--gold` | `#C9A84C` | `#E2B55A` |
| `--gold-light` | — | `#F0CC7A` |
| Display font | Playfair Display | **Space Grotesk** |
| Accent/italic | Playfair Display (kept) | Playfair Display italic only |

Space Grotesk loaded from Google Fonts alongside Inter.

---

## Global Components (base.html + style.css + script.js)

### Custom Cursor
- Small 8px gold dot follows mouse with `lerp` smoothing
- Expands to 36px hollow circle on hover over `.btn`, `a`, `button`
- CSS: `.cursor-dot` + `.cursor-ring`, absolute positioned, `pointer-events:none`, `z-index:9999`

### Page Loader
- Full-screen `#0A0A0A` overlay, "NOMADCUTS" written letter by letter via GSAP TextPlugin in 0.8s
- Overlay clips upward (`clip-path: inset(0 0 0 0)` → `inset(100% 0 0 0)`) to reveal site
- Runs once per session (sessionStorage flag)

### Scroll Progress Bar
- `<div class="scroll-progress">` inside `.nav` — 2px gold line, `width` driven by GSAP ScrollTrigger `scrub:true`

### Navigation Upgrades
- Starts transparent over hero (`background: transparent`)
- At scroll ≥ 80px: transitions to `rgba(10,10,10,.95)` + `backdrop-filter:blur(12px)` + `border-bottom`
- Desktop: nav link hover → gold underline slides in from left (`::after` with `scaleX` transition)
- Mobile: hamburger opens full-screen overlay, links stagger in from `translateY(30px)` with GSAP

### Magnetic Buttons
- Applied to all `.btn-primary` elements
- GSAP `mousemove` handler: button translates ±12px toward cursor within 80px radius
- `mouseleave`: spring back to `x:0, y:0` with `elastic` ease

---

## Home Page (index.html)

### Hero
- Structure: eyebrow → h1 split into 3 `<span class="line">` divs → subtitle → buttons
- **Eyebrow**: `x:-40, opacity:0` → `x:0, opacity:1` at 0.1s
- **H1 lines**: `clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)` with 120ms stagger per line
- **Text scramble**: after clip reveal, each word cycles through random chars for 600ms then resolves
- **Subtitle + buttons**: simple `y:20, opacity:0` → `y:0, opacity:1` staggered
- Image: CSS `animation: kenBurns 14s ease-in-out infinite alternate` (`scale 1→1.06`)
- Scroll indicator: bouncing arrow animation (CSS keyframe)

### Stats Strip (new section, after hero)
HTML added to `index.html`: 3 stats — `200+` clientes · `4.9★` rating · `3 años` en Panamá  
Numbers count from 0 on ScrollTrigger enter, once.

### Services Cards
- ScrollTrigger stagger: `y:50, opacity:0` → `y:0, opacity:1`, stagger 0.08s
- Emoji icons replaced with inline SVGs (scissors, razor, diamond, gradient-fade)
- Hover: left gold bar extends full height (already exists) + price `scale(1.04)`

### Gallery
- Each `<img>` wrapped in `<div class="gallery-reveal">` with gold overlay `::before`
- ScrollTrigger: overlay `clip-path: inset(0 0 0 0)` → `inset(0 0 0 100%)` — curtain wipe left-to-right
- Stagger 0.15s between images

### Promotions Cards
- Entrance: `translate(30px, 20px), opacity:0` → `(0,0), opacity:1`, stagger 0.1s
- Badge: CSS `animation: pulse 2s ease-in-out infinite` (`scale 1→1.06→1`)

### Reviews
- Cards: `x:60, opacity:0` → `x:0, opacity:1`, stagger 0.1s from right
- Stars: color transitions from `--border` → `--gold` with 80ms per-star delay on ScrollTrigger

### CTA Banner
- GSAP ScrollTrigger `scrub:1` parallax: background image `y` moves at 40% scroll speed

---

## Servicios Page (servicios.html)

### Page Header
- Large number counter hidden behind h1: `01`, `02`... displayed as oversized muted background text
- H1 + subtitle: `clip-path` reveal on load

### Service Cards
- Each card gets a large numbered label `01`–`06` in top-right, Space Grotesk, `font-size:72px`, `opacity:0.06`
- ScrollTrigger entrance: alternating left/right `x:±60` → `x:0` with stagger
- Border trace on hover: CSS `outline` trick or SVG border animation

### Bottom CTA
- Same parallax treatment as home CTA banner

---

## Promociones Page (promociones.html)

- Page header: same clip-path reveal as servicios
- Cards: diagonal entrance `translate(40px, 30px)` → `(0,0)` with stagger 0.12s
- Badge pulse inherited from global styles

---

## Agendar Page (agendar.html)

### Multi-step Wizard (3 steps, same form POST)
**Step 1 — Servicio & Fecha/Hora**
- Service selector as visual cards (radio inputs styled) instead of `<select>`
- Date + time pickers remain native but styled

**Step 2 — Tus datos**
- Nombre, email, teléfono, notas
- Floating label inputs: label sits inside input, moves up + shrinks on focus/fill

**Step 3 — Confirmación**
- Summary of selections before submit
- Yappy instructions shown prominently
- Submit button

### Step Indicator
- `<div class="steps">` with 3 nodes connected by animated line
- Active step: gold fill + scale(1.1); completed: checkmark
- GSAP: step transition animates content `x:-100%` → exit, next step `x:100%` → `x:0` enter

### Floating Labels
- CSS: `input:focus + label` or `input:not(:placeholder-shown) + label` → `transform: translateY(-22px) scale(0.8)`

---

## Confirmación Page (cita_confirmada.html)

- SVG checkmark circle draws itself (stroke dashoffset animation, CSS)
- After draw: subtle gold particle burst (10–12 small dots, GSAP scatter from center)
- Yappy box: steps reveal with stagger (1, 2, 3 icons animate in)

---

## Files Changed

| File | Changes |
|---|---|
| `templates/base.html` | Add fonts, GSAP CDN, cursor HTML, loader HTML, scroll-progress div, nav restructure |
| `templates/index.html` | Stats strip, hero line splits, gallery-reveal wrappers, SVG icons |
| `templates/servicios.html` | Numbered cards, restructured page header |
| `templates/promociones.html` | No structural change, animations via JS |
| `templates/agendar.html` | Full wizard restructure (same form action/method) |
| `templates/cita_confirmada.html` | SVG checkmark, particle container |
| `static/css/style.css` | Token updates, cursor, loader, nav transparent, wizard, floating labels, all new component styles |
| `static/js/script.js` | Full rewrite: GSAP setup, all animations, cursor, loader, wizard logic |

---

## Constraints
- No changes to Flask routes, form fields, or backend logic
- All form `name` attributes preserved exactly
- Admin pages untouched
- GSAP loaded from CDN (gsap.com) — no npm/build step needed
