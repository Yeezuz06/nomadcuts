// ============================================================
//  NomadCuts — JavaScript principal
// ============================================================

// ── Menú móvil ──────────────────────────────────────────────
const toggle = document.getElementById('nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ── Agregar producto al carrito ─────────────────────────────
function agregarAlCarrito(productoId, btn) {
  fetch(`/carrito/agregar/${productoId}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (data.exito) {
        // Actualiza el contador del carrito
        const badge = document.getElementById('cart-badge');
        if (badge) {
          badge.textContent = data.total_items;
          badge.classList.remove('cart-badge--hidden');
        }
        // Feedback visual en el botón
        if (btn) {
          const textoOriginal = btn.innerHTML;
          btn.innerHTML = '✓ Agregado';
          btn.classList.add('added');
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.classList.remove('added');
            btn.disabled = false;
          }, 1800);
        }
        mostrarToast('Producto agregado al carrito');
      }
    })
    .catch(() => mostrarToast('Error al agregar. Intenta de nuevo.'));
}

// ── Toast de notificación ────────────────────────────────────
function mostrarToast(mensaje) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Fecha mínima en formulario de cita ──────────────────────
const inputFecha = document.getElementById('fecha');
if (inputFecha) {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm   = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd   = String(hoy.getDate() + 1).padStart(2, '0');  // mínimo mañana
  inputFecha.min = `${yyyy}-${mm}-${dd}`;
}

// ── Animación de entrada al hacer scroll ────────────────────
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.1 }
);

document.querySelectorAll('.product-card, .service-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity .45s ease, transform .45s ease';
  observer.observe(el);
});

// ── Selector de estrellas ────────────────────────────────────
const starBtns = document.querySelectorAll('.star-btn');
const estrellasInput = document.getElementById('estrellas-val');

if (starBtns.length && estrellasInput) {
  // Inicializar con 5 estrellas activas
  starBtns.forEach(btn => btn.classList.add('active'));

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val);
      estrellasInput.value = val;
      starBtns.forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.val) <= val);
      });
    });

    btn.addEventListener('mouseenter', () => {
      const val = parseInt(btn.dataset.val);
      starBtns.forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.val) <= val);
      });
    });
  });

  document.getElementById('star-picker')?.addEventListener('mouseleave', () => {
    const current = parseInt(estrellasInput.value);
    starBtns.forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val) <= current);
    });
  });
}
