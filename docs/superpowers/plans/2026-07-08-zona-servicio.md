# Validación de Zona de Servicio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restringir el formulario `/agendar` para que solo se puedan reservar citas con direcciones dentro del Distrito de Panamá o del Distrito de San Miguelito, validando tanto en el navegador (UX inmediata) como en el servidor (regla de negocio real).

**Architecture:** Se reutiliza Nominatim (OpenStreetMap), ya usado por el botón GPS existente, para geocodificar direcciones y leer los campos `county`/`suburb`/`city_district` de la respuesta. El navegador valida en vivo (GPS y texto libre) y bloquea el avance del wizard si la dirección está confirmada fuera de zona; el servidor repite la misma validación de forma independiente antes de guardar la cita, para no depender de que el JS del cliente se ejecute. Si Nominatim no responde o no encuentra la dirección, ni el cliente ni el servidor bloquean — solo se bloquea cuando se confirma positivamente que está fuera de zona.

**Tech Stack:** Flask + SQLite (app.py), Jinja2 templates, JS vanilla (sin framework), Nominatim API (OpenStreetMap). Este proyecto no tiene suite de tests automatizada (no hay pytest ni carpeta `tests/` en el repo) — la verificación de cada paso es manual: `python3 -c` para la función pura del servidor, y el navegador (Preview tools) para el flujo del formulario. No se introduce infraestructura de testing nueva para mantener el alcance acotado.

Spec de referencia: [docs/superpowers/specs/2026-07-08-zona-servicio-design.md](../specs/2026-07-08-zona-servicio-design.md)

---

## File Structure

- **Modify `static/css/style.css`** (~línea 1605): agrega estilos para el indicador visual de zona (`.addr-zone-status`, con variantes `.ok` / `.fuera`).
- **Modify `templates/agendar.html`**: agrega el elemento `<div>` del indicador de zona en el HTML, y la lógica JS de detección de zona (geocodificar GPS + texto libre) dentro del `<script>` que ya existe en ese archivo.
- **Modify `static/js/script.js`** (`validateStep`, ~línea 458-467): agrega el check de `window.zonaFueraDeServicio` para bloquear el avance del wizard del paso 1 al paso 2.
- **Modify `app.py`**: agrega la función `direccion_en_zona_servicio()` (nueva sección, antes de la ruta `/agendar`) y la llamada a esa función dentro del handler `POST /agendar` (~línea 500-507), antes de insertar la cita en la base de datos.

---

### Task 1: Indicador visual de zona (CSS + HTML)

**Files:**
- Modify: `static/css/style.css:1604-1605` (después de `.gps-btn:disabled`)
- Modify: `templates/agendar.html:136` (después del `.addr-field-wrap`, antes del campo de notas)

- [ ] **Step 1: Agregar los estilos del indicador**

En `static/css/style.css`, justo después de la línea `.gps-btn:disabled { opacity: .5; cursor: not-allowed; }` (línea 1604) y antes de `@keyframes spin` (línea 1605), agrega:

```css
.addr-zone-status {
  display: none;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 500;
  margin: -8px 0 16px;
  padding: 8px 12px;
  border-radius: var(--radius);
}
.addr-zone-status.ok {
  color: var(--gold);
  background: rgba(226,181,90,.08);
  border: 1px solid rgba(226,181,90,.25);
}
.addr-zone-status.fuera {
  color: #FF6B6B;
  background: rgba(255,107,107,.08);
  border: 1px solid rgba(255,107,107,.25);
}
```

- [ ] **Step 2: Agregar el elemento en el HTML**

En `templates/agendar.html`, el bloque actual (líneas 124-136) es:

```html
          <!-- ── Dirección ── -->
          <div class="addr-field-wrap">
            <div class="form-floating" style="flex:1;">
              <input type="text" id="direccion" name="direccion" placeholder=" " required
                     autocomplete="street-address" />
              <label for="direccion">¿A dónde llegamos? (dirección)</label>
            </div>
            <button type="button" class="gps-btn" id="gps-btn" title="Detectar mi ubicación actual">
              <svg id="gps-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" stroke-dasharray="3 2"/></svg>
              <svg id="gps-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3"/><path d="M21 12a9 9 0 00-9-9"/></svg>
              <span id="gps-label">Usar GPS</span>
            </button>
          </div>

          <div class="form-floating">
            <textarea id="notas" name="notas" placeholder=" " rows="2"></textarea>
```

Insértale el nuevo `<div>` justo después del cierre de `.addr-field-wrap` (después de la línea `</div>` que cierra ese wrap, antes de la línea en blanco que sigue):

```html
          <!-- ── Dirección ── -->
          <div class="addr-field-wrap">
            <div class="form-floating" style="flex:1;">
              <input type="text" id="direccion" name="direccion" placeholder=" " required
                     autocomplete="street-address" />
              <label for="direccion">¿A dónde llegamos? (dirección)</label>
            </div>
            <button type="button" class="gps-btn" id="gps-btn" title="Detectar mi ubicación actual">
              <svg id="gps-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" stroke-dasharray="3 2"/></svg>
              <svg id="gps-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3"/><path d="M21 12a9 9 0 00-9-9"/></svg>
              <span id="gps-label">Usar GPS</span>
            </button>
          </div>

          <div class="addr-zone-status" id="addr-zone-status"></div>

          <div class="form-floating">
            <textarea id="notas" name="notas" placeholder=" " rows="2"></textarea>
```

- [ ] **Step 3: Verificar manualmente**

Con el servidor local corriendo, abre `/agendar`, pasa al paso 2 ("Tus datos"). El nuevo `<div id="addr-zone-status">` debe existir en el DOM (inspecciónalo con devtools) pero no debe verse nada en pantalla — está vacío y con `display:none` hasta que se le agregue una clase `ok`/`fuera` con contenido.

- [ ] **Step 4: Commit**

```bash
git add static/css/style.css templates/agendar.html
git commit -m "feat: agregar indicador visual de zona de servicio (UI vacía)"
```

---

### Task 2: Detección de zona en el cliente (GPS + texto libre)

**Files:**
- Modify: `templates/agendar.html:198-235` (bloque `<script>` del botón GPS) y agrega nuevo bloque IIFE al final del `<script>` existente (antes de `</script>`, línea 290).

- [ ] **Step 1: Agregar el hook en el callback del GPS**

El callback actual del botón GPS (dentro del `<script>` de `agendar.html`, líneas 213-223) es:

```js
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var addr = data.address;
        var partes = [];
        if (addr.road)        partes.push(addr.road + (addr.house_number ? ' ' + addr.house_number : ''));
        if (addr.suburb || addr.neighbourhood) partes.push(addr.suburb || addr.neighbourhood);
        if (addr.city || addr.town)  partes.push(addr.city || addr.town);
        input.value = partes.length ? partes.join(', ') : data.display_name;
        input.dispatchEvent(new Event('input'));
        resetBtn();
      })
```

Cámbialo a (se agrega una sola línea antes de `resetBtn();`):

```js
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var addr = data.address;
        var partes = [];
        if (addr.road)        partes.push(addr.road + (addr.house_number ? ' ' + addr.house_number : ''));
        if (addr.suburb || addr.neighbourhood) partes.push(addr.suburb || addr.neighbourhood);
        if (addr.city || addr.town)  partes.push(addr.city || addr.town);
        input.value = partes.length ? partes.join(', ') : data.display_name;
        input.dispatchEvent(new Event('input'));
        if (typeof window.verificarZonaConAddress === 'function') window.verificarZonaConAddress(addr);
        resetBtn();
      })
```

- [ ] **Step 2: Agregar la lógica de zona al final del `<script>` existente**

Al final del `<script>` de `agendar.html` (justo antes del `</script>` de cierre, línea 290, después del bloque `inputFecha.addEventListener('change', ...)`), agrega:

```js

// ── Validación de zona de servicio ──────────────────────────────
(function() {
  var ZONAS_OK = ['Distrito de Panamá', 'San Miguelito'];
  var direccionInput = document.getElementById('direccion');
  var statusEl        = document.getElementById('addr-zone-status');
  if (!direccionInput || !statusEl) return;

  window.zonaFueraDeServicio = false;
  var ultimoTextoVerificado = '';
  var debounceId = null;

  function zonaPermitida(addr) {
    if (!addr) return null;
    var candidatos = [addr.county, addr.suburb, addr.city_district];
    for (var i = 0; i < candidatos.length; i++) {
      if (ZONAS_OK.indexOf(candidatos[i]) !== -1) return true;
    }
    return false;
  }

  function aplicarEstado(estado) {
    if (estado === true) {
      window.zonaFueraDeServicio = false;
      statusEl.style.display = 'flex';
      statusEl.className = 'addr-zone-status ok';
      statusEl.innerHTML = '✓ Dentro de nuestra zona de servicio';
    } else if (estado === false) {
      window.zonaFueraDeServicio = true;
      statusEl.style.display = 'flex';
      statusEl.className = 'addr-zone-status fuera';
      statusEl.innerHTML = '⚠️ Por ahora solo cubrimos Distrito de Panamá y San Miguelito';
    } else {
      window.zonaFueraDeServicio = false;
      statusEl.style.display = 'none';
      statusEl.innerHTML = '';
    }
  }

  function verificarDireccion(texto) {
    fetch('https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=pa&limit=1&q=' + encodeURIComponent(texto), {
      headers: { 'Accept-Language': 'es' }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.length) { aplicarEstado(null); return; }
      aplicarEstado(zonaPermitida(data[0].address));
    })
    .catch(function() { aplicarEstado(null); });
  }

  // Expuesto para que el botón GPS reuse la misma lógica con los
  // datos de dirección que ya recibió del reverse-geocoding.
  window.verificarZonaConAddress = function(addr) {
    ultimoTextoVerificado = direccionInput.value;
    aplicarEstado(zonaPermitida(addr));
  };

  direccionInput.addEventListener('blur', function() {
    var texto = direccionInput.value.trim();
    if (!texto || texto === ultimoTextoVerificado) return;
    ultimoTextoVerificado = texto;
    clearTimeout(debounceId);
    debounceId = setTimeout(function() { verificarDireccion(texto); }, 800);
  });
})();
```

- [ ] **Step 3: Verificar manualmente — dirección dentro de zona**

En `/agendar`, paso 2, escribe en el campo dirección `Avenida Balboa, Panamá` y haz clic fuera del campo (blur). Espera ~1 segundo. Debe aparecer el aviso verde/dorado "✓ Dentro de nuestra zona de servicio".

- [ ] **Step 4: Verificar manualmente — dirección fuera de zona**

Borra el campo y escribe `La Chorrera, Panamá Oeste`, haz blur. Debe aparecer el aviso rojo "⚠️ Por ahora solo cubrimos Distrito de Panamá y San Miguelito".

- [ ] **Step 5: Verificar manualmente — botón GPS**

Haz clic en "Usar GPS" y acepta el permiso de ubicación (si estás físicamente en Panamá, debería marcar en zona; si usas un lat/lon simulado desde devtools fuera del distrito, debe marcar fuera de zona). Confirma que el aviso se actualiza igual que con el texto manual.

- [ ] **Step 6: Commit**

```bash
git add templates/agendar.html
git commit -m "feat: detectar zona de servicio en el cliente (GPS y texto libre)"
```

---

### Task 3: Bloquear avance del wizard si está fuera de zona

**Files:**
- Modify: `static/js/script.js:458-467`

- [ ] **Step 1: Modificar `validateStep`**

El bloque actual (líneas 458-467) es:

```js
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
```

Cámbialo a:

```js
    if (idx === 1) {
      var n  = document.getElementById('nombre');
      var em = document.getElementById('email');
      var t  = document.getElementById('telefono');
      var d  = document.getElementById('direccion');
      if (!n  || !n.value.trim())  { mostrarToast('Ingresa tu nombre');      return false; }
      if (!em || !em.value.trim()) { mostrarToast('Ingresa tu correo');      return false; }
      if (!t  || !t.value.trim())  { mostrarToast('Ingresa tu teléfono');   return false; }
      if (!d  || !d.value.trim())  { mostrarToast('Ingresa tu dirección');  return false; }
      if (window.zonaFueraDeServicio) { mostrarToast('Por ahora solo cubrimos Distrito de Panamá y San Miguelito'); return false; }
    }
    return true;
```

- [ ] **Step 2: Verificar manualmente — bloqueo**

En `/agendar`, paso 2, escribe una dirección fuera de zona (ej. `La Chorrera, Panamá Oeste`), espera el aviso rojo, completa nombre/email/teléfono, y haz clic en "Continuar". Debe aparecer el toast "Por ahora solo cubrimos Distrito de Panamá y San Miguelito" y **no** debe avanzar al paso 3 (confirmación).

- [ ] **Step 3: Verificar manualmente — permite avanzar en zona**

Cambia la dirección a una dentro de zona (ej. `Avenida Balboa, Panamá`), espera el aviso verde, y haz clic en "Continuar". Debe avanzar normalmente al paso 3.

- [ ] **Step 4: Commit**

```bash
git add static/js/script.js
git commit -m "feat: bloquear avance del wizard si la direccion esta fuera de zona"
```

---

### Task 4: Función de validación de zona en el servidor

**Files:**
- Modify: `app.py` (nueva sección antes de la línea 475, `@app.route('/agendar', ...)`)

- [ ] **Step 1: Agregar la función**

En `app.py`, justo antes de la línea `@app.route('/agendar', methods=['GET', 'POST'])` (línea 475), agrega:

```python
# ── Validación de zona de servicio ─────────────────────────────

ZONAS_DE_SERVICIO = {'Distrito de Panamá', 'San Miguelito'}


def direccion_en_zona_servicio(direccion):
    """
    Devuelve True si la dirección cae dentro del Distrito de Panamá o
    San Miguelito, False si claramente cae fuera, y None si no se pudo
    determinar (fallo de red, dirección no encontrada). None NO debe
    bloquear la reserva — solo se bloquea cuando se confirma que está
    fuera de zona.
    """
    if not direccion or not direccion.strip():
        return None
    try:
        r = requests.get(
            'https://nominatim.openstreetmap.org/search',
            params={
                'q': direccion,
                'format': 'json',
                'addressdetails': 1,
                'countrycodes': 'pa',
                'limit': 1,
            },
            headers={'User-Agent': 'NomadCuts/1.0 (contacto: hypestbasiclatam@gmail.com)'},
            timeout=6
        )
        resultados = r.json()
    except Exception as e:
        print(f'[zona] ERROR geocodificando "{direccion}": {e}')
        return None

    if not resultados:
        return None

    addr = resultados[0].get('address', {})
    candidatos = {addr.get('county'), addr.get('suburb'), addr.get('city_district')}
    return bool(candidatos & ZONAS_DE_SERVICIO)
```

- [ ] **Step 2: Verificar manualmente**

Desde el directorio del proyecto (importante: `init_db()` corre al importar `app.py` y necesita encontrar `nomadcuts.db` en el directorio actual):

```bash
cd /Users/yeezuz/Desktop/nomadcuts && python3 -c "
from app import direccion_en_zona_servicio
print('Avenida Balboa:', direccion_en_zona_servicio('Avenida Balboa, Panama'))
print('La Chorrera:', direccion_en_zona_servicio('La Chorrera, Panama Oeste'))
print('vacio:', direccion_en_zona_servicio(''))
"
```

Expected:
```
Avenida Balboa: True
La Chorrera: False
vacio: None
```

- [ ] **Step 3: Commit**

```bash
git add app.py
git commit -m "feat: agregar funcion de validacion de zona de servicio en el servidor"
```

---

### Task 5: Bloquear la creación de citas fuera de zona en el servidor

**Files:**
- Modify: `app.py:475-513` (handler `POST /agendar`)

- [ ] **Step 1: Agregar la validación antes de insertar la cita**

El bloque actual (líneas 500-511) es:

```python
        # Validar que no esté tomada
        if db.execute(
            "SELECT id FROM citas WHERE fecha=? AND hora=? AND estado!='rechazada'",
            (fecha, hora)
        ).fetchone():
            return render_template('agendar.html',
                error='Ese horario ya está reservado. Elige otra hora.')

        cursor = db.execute('''
            INSERT INTO citas (nombre,email,telefono,servicio,fecha,hora,notas,direccion,estado)
            VALUES (?,?,?,?,?,?,?,?,'pendiente_pago')
        ''', (nombre, email, telefono, servicio, fecha, hora, notas, direccion))
```

Cámbialo a:

```python
        # Validar que no esté tomada
        if db.execute(
            "SELECT id FROM citas WHERE fecha=? AND hora=? AND estado!='rechazada'",
            (fecha, hora)
        ).fetchone():
            return render_template('agendar.html',
                error='Ese horario ya está reservado. Elige otra hora.')

        # Validar zona de servicio (Distrito de Panamá / San Miguelito)
        if direccion_en_zona_servicio(direccion) is False:
            return render_template('agendar.html',
                error='Por ahora solo cubrimos el Distrito de Panamá y San Miguelito. '
                      'Esa dirección parece estar fuera de esa zona.')

        cursor = db.execute('''
            INSERT INTO citas (nombre,email,telefono,servicio,fecha,hora,notas,direccion,estado)
            VALUES (?,?,?,?,?,?,?,?,'pendiente_pago')
        ''', (nombre, email, telefono, servicio, fecha, hora, notas, direccion))
```

- [ ] **Step 2: Verificar manualmente — servidor local**

Levanta el servidor (`cd /Users/yeezuz/Desktop/nomadcuts && python3 app.py`) y en otra terminal, simula un POST directo (sin pasar por el JS del navegador) con una dirección fuera de zona:

```bash
curl -s -X POST http://localhost:5001/agendar \
  -d "nombre=Test" -d "email=test@test.com" -d "telefono=60000000" \
  -d "servicio=Corte Clásico — \$15" \
  -d "fecha=$(date -v+1d +%Y-%m-%d)" -d "hora=10:00" \
  -d "direccion=La Chorrera, Panama Oeste" \
  | grep -o "Por ahora solo cubrimos[^<]*"
```

Expected: imprime el mensaje de error (`Por ahora solo cubrimos el Distrito de Panamá y San Miguelito...`), confirmando que la cita fue rechazada.

- [ ] **Step 3: Verificar manualmente — dirección en zona sigue funcionando**

Repite el mismo `curl` cambiando `direccion=La Chorrera, Panama Oeste` por `direccion=Avenida Balboa, Panama`, usando una hora que no esté ya tomada. Expected: **no** aparece el mensaje de error (la cita se crea normalmente, redirige a la página de pendiente).

- [ ] **Step 4: Commit**

```bash
git add app.py
git commit -m "feat: rechazar citas fuera de la zona de servicio en el servidor"
```

---

## Self-Review

- **Cobertura de la spec:** detección vía Nominatim (Tasks 2, 4) ✓; regla `county`/`suburb`/`city_district` (Tasks 2, 4) ✓; flujo GPS + texto libre (Task 2) ✓; estados visuales ok/fuera/desconocido (Tasks 1, 2) ✓; bloqueo del botón "Agendar cita" vía bloqueo de navegación del wizard, sin botón de WhatsApp (Task 3) ✓; validación duplicada en servidor sin bloquear en caso de fallo de geocodificación (Tasks 4, 5) ✓; fuera de alcance (bot de WhatsApp, selects de corregimiento, lat/lon en DB) — ningún task los toca ✓.
- **Placeholders:** ninguno — cada step tiene código completo y comandos exactos.
- **Consistencia de tipos/nombres:** `window.zonaFueraDeServicio` (Task 2) se lee igual en Task 3; `window.verificarZonaConAddress` se define en Task 2 y se llama desde el mismo Task 2 (hook del GPS); `direccion_en_zona_servicio` se define en Task 4 y se llama igual en Task 5.



