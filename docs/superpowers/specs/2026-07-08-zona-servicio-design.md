# Validación de zona de servicio (Distrito de Panamá + San Miguelito)

## Contexto

NomadCuts es una barbería a domicilio. El formulario de reserva (`/agendar`,
[templates/agendar.html](../../../templates/agendar.html)) ya captura una
dirección de dos formas:

- **Botón GPS**: usa `navigator.geolocation` + reverse-geocoding contra
  Nominatim (OpenStreetMap) para autocompletar el campo de texto.
- **Texto libre**: el cliente puede escribir la dirección a mano.

Hoy no hay ninguna validación de si esa dirección cae dentro del área que el
negocio realmente cubre. El objetivo de este proyecto es agregar esa
validación, restringiendo el servicio al **Distrito de Panamá** y al
**Distrito de San Miguelito**.

Este es el primer de dos proyectos derivados de la solicitud original de
automatizar el flujo de reservas. El segundo proyecto (un bot de WhatsApp que
agende automáticamente) queda fuera de alcance — es una integración con la
API de WhatsApp Business de Meta, con costos y tiempos de aprobación propios,
y se diseñará por separado.

## Detección de zona

Investigación con la API de Nominatim (`addressdetails=1`) sobre direcciones
reales confirmó el patrón de datos:

| Zona | Campo distintivo |
|---|---|
| Distrito de Panamá (ej. Bella Vista, Pedregal) | `address.county == "Distrito de Panamá"` |
| Distrito de San Miguelito | `address.suburb == "San Miguelito"` (con `city == "Panamá"`, sin `county`) |

San Miguelito no aparece como `county` en los datos de OpenStreetMap — es una
particularidad del etiquetado de esa zona, no un distrito "hijo" del de
Panamá.

**Regla de validación** — una dirección está dentro de la zona de servicio si
cualquiera de estos campos de la respuesta de Nominatim coincide:

- `county` ∈ `{"Distrito de Panamá"}`
- `suburb` ∈ `{"San Miguelito"}`
- `city_district` ∈ `{"Distrito de Panamá", "San Miguelito"}` (variante de
  campo que Nominatim usa en algunas zonas; se revisa defensivamente aunque
  no apareció en las muestras probadas)

Si Nominatim no devuelve ninguno de estos campos (dirección ambigua, fuera de
Panamá, error de geocodificación), la dirección se trata como **zona
desconocida**, no como "fuera de zona" — ver más abajo por qué eso importa
para el comportamiento de bloqueo.

## Flujo del cliente

1. **Con botón GPS** (flujo existente en
   [agendar.html:198-229](../../../templates/agendar.html#L198-L229)): al
   recibir la respuesta de reverse-geocoding, además de autocompletar el
   campo de texto, se aplica la regla de validación de zona sobre
   `data.address`.
2. **Escribiendo a mano** (nuevo): en el evento `blur` del campo de
   dirección, con un debounce corto (~800ms tras dejar de escribir, para
   respetar el límite de uso de Nominatim de 1 request/segundo), se
   geocodifica el texto vía forward-search
   (`https://nominatim.openstreetmap.org/search?q=...&countrycodes=pa&addressdetails=1&limit=1`)
   y se aplica la misma regla sobre el primer resultado.
3. **Estados visuales** bajo el campo de dirección:
   - ✅ **En zona** — aviso verde discreto, el botón "Agendar cita" queda
     habilitado.
   - ⚠️ **Fuera de zona** — aviso de que por ahora el servicio solo cubre
     Distrito de Panamá y San Miguelito. El botón "Agendar cita" queda
     **deshabilitado**.
     *Nota:* el diseño original incluía aquí un botón "Consultar por
     WhatsApp" (mismo patrón que el FAB del sitio). Se omite por ahora
     porque el FAB de WhatsApp fue quitado temporalmente de toda la página
     ([base.html](../../../templates/base.html)) mientras se hacen otras
     actualizaciones. Cuando WhatsApp se reactive en el sitio, agregar de
     vuelta este botón usando el mismo patrón `wa.me`.
   - **Zona desconocida** (fallo de red, dirección no encontrada) — no se
     bloquea el envío; no queremos que una caída de Nominatim le impida
     reservar a un cliente que sí está en zona. No se muestra aviso de
     error, simplemente no se marca ni en verde ni en rojo.

## Validación en el servidor

La validación en el navegador puede saltarse (JS deshabilitado, POST
directo). El endpoint `/agendar` (POST) en
[app.py:475](../../../app.py#L475) debe re-geocodificar la dirección
recibida en el servidor (mismo forward-search de Nominatim, misma regla) y
rechazar la creación de la cita si cae claramente fuera de zona.

Igual que en el cliente, si el servidor no logra determinar la zona
(Nominatim no responde, timeout, dirección no encontrada), **no se bloquea**
la reserva — se deja pasar. La validación de zona es una ayuda para filtrar
casos claramente fuera de cobertura, no un requisito estricto que dependa de
la disponibilidad de un servicio externo gratuito de terceros.

## Fuera de alcance

- Bot de WhatsApp / automatización conversacional (proyecto separado).
- Cambiar el campo de dirección a una lista de corregimientos — sigue siendo
  texto libre + GPS.
- Guardar latitud/longitud en la base de datos. La tabla `citas` sigue
  guardando solo el texto de la dirección, igual que hoy.
- Lista de zonas de servicio configurable desde el panel admin — el Distrito
  de Panamá y San Miguelito quedan fijos en el código para esta primera
  versión.

## Testing

- Manual: probar el flujo GPS y el flujo de texto libre con direcciones
  reales dentro de Distrito de Panamá, dentro de San Miguelito, y fuera de
  ambos (ej. La Chorrera, Arraiján), verificando el estado visual y que el
  botón de envío se habilite/deshabilite correctamente.
- Manual: simular una respuesta de Nominatim vacía/con error (desconectando
  red) y confirmar que el formulario no queda bloqueado.
- Servidor: probar el POST a `/agendar` directamente (sin pasar por el JS
  del navegador) con una dirección fuera de zona y confirmar que se
  rechaza; con una dirección en zona, que se acepta igual que hoy.
