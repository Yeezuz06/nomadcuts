# ============================================================
#  NomadCuts — Servidor principal
#  Flask + SQLite + Gmail + Yappy
# ============================================================

from flask import (
    Flask, render_template, request,
    redirect, url_for, session, jsonify
)
import requests, time, hmac, hashlib, re
from datetime import datetime, date, timedelta, timezone

import os
import config
import db as dbmod
from db import get_db

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'nomadcuts_clave_secreta_2024')
app.jinja_env.globals['enumerate'] = enumerate
app.teardown_appcontext(dbmod.close_db)

# Panamá es UTC-5 todo el año (sin horario de verano)
PANAMA_TZ = timezone(timedelta(hours=-5))


def hoy_panama():
    return datetime.now(PANAMA_TZ).date()


def precio_de_servicio(servicio):
    """'Corte Clásico — $15' → 15.0 ; sin precio → 0.0"""
    m = re.search(r'\$\s*(\d+(?:\.\d+)?)', servicio or '')
    return float(m.group(1)) if m else 0.0

# ── Anti-spam: rate limit por IP ──────────────────────────────
_resena_timestamps: dict[str, float] = {}   # ip → último envío
RESENA_COOLDOWN = 3600  # 1 hora entre reseñas por IP


DIAS_SEMANA = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
# Python weekday(): 0=lunes … 6=domingo


# ── Base de datos ─────────────────────────────────────────────

def init_db():
    with app.app_context():
        conn = get_db()
        dbmod.crear_esquema(conn)

        importadas = dbmod.importar_sqlite_si_vacio(conn)
        if importadas:
            print(f'✓ Datos importados de SQLite a Postgres: {importadas}')

        # Promociones de ejemplo
        if conn.execute('SELECT COUNT(*) FROM promociones').fetchone()[0] == 0:
            conn.executemany(
                'INSERT INTO promociones (titulo, descripcion, descuento) VALUES (?,?,?)',
                [
                    ('Pack Lunes y Martes', 'Corte + Barba cualquier lunes o martes.', '20% OFF'),
                    ('Trae un amigo', 'Tú y tu amigo reciben descuento en su próxima visita.', '15% OFF'),
                    ('Primera visita', 'Descuento especial para nuevos clientes de NomadCuts.', '10% OFF'),
                ]
            )

        # Horario por defecto: lunes–sábado, domingo cerrado
        if conn.execute('SELECT COUNT(*) FROM horario').fetchone()[0] == 0:
            conn.executemany(
                'INSERT INTO horario (dia, activo, hora_inicio, hora_fin) VALUES (?,?,?,?)',
                [
                    ('lunes',     1, '08:00', '18:00'),
                    ('martes',    1, '08:00', '18:00'),
                    ('miércoles', 1, '08:00', '18:00'),
                    ('jueves',    1, '08:00', '18:00'),
                    ('viernes',   1, '08:00', '18:00'),
                    ('sábado',    1, '09:00', '16:00'),
                    ('domingo',   0, '09:00', '14:00'),
                ]
            )

        # Rellenar precio de citas viejas a partir del nombre del servicio
        for r in conn.execute(
                'SELECT id, servicio FROM citas WHERE precio IS NULL OR precio = 0').fetchall():
            p = precio_de_servicio(r['servicio'])
            if p:
                conn.execute('UPDATE citas SET precio=? WHERE id=?', (p, r['id']))
        conn.commit()


# ── Helpers de horario ────────────────────────────────────────

def get_horario_dia(fecha_str):
    """Devuelve el row de horario para la fecha dada, o None si cerrado."""
    try:
        d = datetime.strptime(fecha_str, '%Y-%m-%d')
        dia = DIAS_SEMANA[d.weekday()]
        db = get_db()
        row = db.execute('SELECT * FROM horario WHERE dia = ?', (dia,)).fetchone()
        return row
    except Exception:
        return None


def generar_horas(hora_inicio, hora_fin):
    """Genera lista de horas en punto entre hora_inicio y hora_fin (exclusivo)."""
    horas = []
    h = int(hora_inicio.split(':')[0])
    fin = int(hora_fin.split(':')[0])
    while h < fin:
        horas.append(f'{h:02d}:00')
        h += 1
    return horas


# ── ntfy.sh (push notifications) ─────────────────────────────

def ntfy_nueva_cita(cita_id, nombre, servicio, fecha, hora, direccion):
    """Envía notificación push al teléfono con botones confirmar/rechazar."""
    if not config.NTFY_TOPIC:
        return

    tok_ok = _wa_token('ok', cita_id)
    tok_no = _wa_token('no', cita_id)
    base   = 'https://nomadcuts.online'
    serv_corto = servicio.split('—')[0].strip()

    print(f'[ntfy] enviando notificacion para cita #{cita_id}, topic={config.NTFY_TOPIC!r}')
    try:
        r = requests.post(
            'https://ntfy.sh',
            json={
                'topic':    config.NTFY_TOPIC,
                'title':    f'Nueva cita #{cita_id} - {nombre}',
                'message':  (
                    f'Servicio: {serv_corto}\n'
                    f'Fecha: {fecha}  Hora: {hora}\n'
                    f'Direccion: {direccion or "Sin direccion"}'
                ),
                'priority': 4,
                'tags':     ['scissors', 'calendar'],
                'actions':  [
                    {'action': 'view', 'label': 'Confirmar',
                     'url': f'{base}/cita/ok/{cita_id}/{tok_ok}', 'clear': True},
                    {'action': 'view', 'label': 'Rechazar',
                     'url': f'{base}/cita/no/{cita_id}/{tok_no}', 'clear': True},
                ],
            },
            timeout=8
        )
        print(f'[ntfy] respuesta: {r.status_code} — {r.text[:200]}')
    except Exception as e:
        print(f'[ntfy] ERROR: {e}')


# ── WhatsApp (CallMeBot) ──────────────────────────────────────

def _wa_token(accion: str, cita_id: int) -> str:
    """Genera un token HMAC corto para confirmar/rechazar por link."""
    msg = f'{accion}:{cita_id}'.encode()
    return hmac.new(config.WA_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:20]


def whatsapp_nueva_cita(cita_id, nombre, servicio, fecha, hora, direccion):
    """Envía notificación WhatsApp al admin con links para confirmar/rechazar."""
    if not config.CALLMEBOT_PHONE or not config.CALLMEBOT_APIKEY:
        return

    tok_ok = _wa_token('ok', cita_id)
    tok_no = _wa_token('no', cita_id)
    base   = 'https://nomadcuts.online'

    serv_corto = servicio.split('—')[0].strip()
    texto = (
        f'🔔 Nueva cita #{cita_id}\n'
        f'👤 {nombre}\n'
        f'✂️ {serv_corto}\n'
        f'📅 {fecha}  🕐 {hora}\n'
        f'📍 {direccion or "Sin dirección"}\n\n'
        f'✅ Confirmar: {base}/cita/ok/{cita_id}/{tok_ok}\n'
        f'❌ Rechazar: {base}/cita/no/{cita_id}/{tok_no}'
    )

    try:
        requests.get(
            'https://api.callmebot.com/whatsapp.php',
            params={
                'phone':  config.CALLMEBOT_PHONE,
                'text':   texto,
                'apikey': config.CALLMEBOT_APIKEY,
            },
            timeout=10
        )
    except Exception as e:
        print(f'⚠  WhatsApp error: {e}')


# ── Emails ────────────────────────────────────────────────────

def _enviar_email_sync(destinatario, asunto, html):
    """Envía el email via Resend API (HTTP — funciona en Render free tier)."""
    try:
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {config.RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': f'{config.NOMBRE_NEGOCIO} <citas@nomadcuts.online>',
                'to': [destinatario],
                'subject': asunto,
                'html': html,
            },
            timeout=15
        )
        if resp.status_code == 200 or resp.status_code == 201:
            print(f'✉  Correo → {destinatario}')
        else:
            print(f'⚠  Email error {resp.status_code}: {resp.text}')
    except Exception as e:
        print(f'⚠  Email error: {e}')


def enviar_email(destinatario, asunto, html):
    """Envía el correo directo (Resend HTTP es rápido, no necesita hilo)."""
    _enviar_email_sync(destinatario, asunto, html)


def _base_email(contenido):
    return f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;
                color:#F0EDE8;padding:40px 32px;border-radius:8px;">
      <h1 style="font-size:26px;color:#C9A84C;margin-bottom:2px;">NomadCuts</h1>
      <p style="color:#6B6760;margin-top:0;margin-bottom:28px;font-size:12px;">
        Barbería a domicilio · Panamá
      </p>
      {contenido}
      <p style="color:#444;font-size:12px;margin-top:28px;">
        ¿Preguntas? <a href="mailto:{config.GMAIL_USER}" style="color:#C9A84C;">
        {config.GMAIL_USER}</a>
      </p>
    </div>"""


def _tabla_cita(servicio, fecha, hora, extra=''):
    return f"""
    <div style="background:#1C1C1C;border:1px solid #252525;border-radius:6px;
                padding:20px;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#6B6760;padding:7px 0;border-bottom:1px solid #252525;">Servicio</td>
            <td style="text-align:right;padding:7px 0;border-bottom:1px solid #252525;">{servicio}</td></tr>
        <tr><td style="color:#6B6760;padding:7px 0;border-bottom:1px solid #252525;">Fecha</td>
            <td style="text-align:right;padding:7px 0;border-bottom:1px solid #252525;">{fecha}</td></tr>
        <tr><td style="color:#6B6760;padding:7px 0;">Hora</td>
            <td style="text-align:right;padding:7px 0;">{hora}</td></tr>
      </table>
      {extra}
    </div>"""


def email_pendiente_pago(nombre, email, servicio, fecha, hora, cita_id):
    yappy_box = f"""
    <div style="background:#110D00;border:1px solid #3A2800;border-radius:6px;
                padding:18px;margin-top:16px;">
      <p style="color:#C9A84C;font-weight:600;margin:0 0 10px;">💳 Deposita ${config.YAPPY_DEPOSITO:.2f} por Yappy</p>
      <p style="color:#9A9790;font-size:13px;margin:0 0 10px;">
        Envía al número <strong style="color:#F0EDE8;">{config.YAPPY_NUMERO}</strong>
        y escribe en el comentario:
      </p>
      <div style="background:#1A1A1A;border-radius:4px;padding:10px;text-align:center;">
        <span style="color:#C9A84C;font-weight:700;">NomadCuts #{cita_id}</span>
      </div>
    </div>"""
    html = _base_email(f"""
      <h2 style="font-size:19px;margin-bottom:6px;">¡Un paso más, {nombre}!</h2>
      <p style="color:#9A9790;">Recibimos tu solicitud. Realiza el depósito para confirmar.</p>
      {_tabla_cita(servicio, fecha, hora)}
      {yappy_box}""")
    enviar_email(email, f'✂ Completa tu reservación #{cita_id} — {config.NOMBRE_NEGOCIO}', html)


def email_confirmacion_final(nombre, email, servicio, fecha, hora, cita_id):
    html = _base_email(f"""
      <div style="background:#0A1A0A;border:1px solid #1A3A1A;border-radius:6px;
                  padding:14px 18px;margin-bottom:16px;">
        <span style="color:#4CAF50;font-weight:600;">✅ ¡Cita confirmada!</span>
      </div>
      <p style="color:#9A9790;">
        Hola <strong style="color:#F0EDE8;">{nombre}</strong>,
        tu depósito fue verificado. ¡Te esperamos!
      </p>
      {_tabla_cita(servicio, fecha, hora)}
      <p style="color:#9A9790;font-size:13px;">
        Nos pondremos en contacto para confirmar la dirección exacta.
      </p>""")
    enviar_email(email, f'✅ Cita #{cita_id} confirmada — {config.NOMBRE_NEGOCIO}', html)


def email_rechazo(nombre, email, cita_id):
    html = _base_email(f"""
      <h2 style="font-size:19px;margin-bottom:6px;">Sobre tu cita #{cita_id}</h2>
      <p style="color:#9A9790;">
        Hola {nombre}, no pudimos verificar tu depósito de Yappy.<br>
        Si ya realizaste el pago, escríbenos y lo revisamos.
      </p>""")
    enviar_email(email, f'Actualización cita #{cita_id} — {config.NOMBRE_NEGOCIO}', html)


# ── Rutas públicas ────────────────────────────────────────────

def _dias_abiertos_texto(db):
    """'sábado y domingo' / 'viernes, sábado y domingo' según el horario activo."""
    activos = {r['dia'] for r in db.execute('SELECT dia FROM horario WHERE activo=1').fetchall()}
    dias = [d for d in DIAS_SEMANA if d in activos]
    if not dias:
        return ''
    if len(dias) == 7:
        return 'todos los días'
    if len(dias) == 1:
        return dias[0]
    return ', '.join(dias[:-1]) + ' y ' + dias[-1]


@app.route('/')
def inicio():
    db = get_db()
    return render_template('index.html',
        dias_abiertos=_dias_abiertos_texto(db),
        resenas=db.execute('SELECT * FROM resenas WHERE aprobada=1 ORDER BY creado_en DESC').fetchall())


@app.route('/resenas', methods=['POST'])
def nueva_resena():
    # ── Honeypot: bots llenan el campo "website", humanos no ──
    honeypot = request.form.get('website', '').strip()
    if honeypot:
        return redirect(url_for('inicio') + '#resenas')

    nombre     = request.form.get('nombre', '').strip()
    comentario = request.form.get('comentario', '').strip()
    estrellas  = int(request.form.get('estrellas', 5))

    # ── Validaciones básicas ──
    if not nombre or len(comentario) < 20 or not (1 <= estrellas <= 5):
        return redirect(url_for('inicio') + '#resenas')

    # ── Rate limit: 1 reseña por IP por hora ──
    ip  = request.remote_addr or 'unknown'
    now = time.time()
    if now - _resena_timestamps.get(ip, 0) < RESENA_COOLDOWN:
        return redirect(url_for('inicio') + '#resenas')
    _resena_timestamps[ip] = now

    # ── Guardar con aprobación pendiente ──
    db = get_db()
    db.execute(
        'INSERT INTO resenas (nombre, comentario, estrellas, aprobada) VALUES (?,?,?,?)',
        (nombre, comentario, estrellas, 0)
    )
    db.commit()
    return redirect(url_for('inicio') + '#resenas')


@app.route('/sitemap.xml')
def sitemap():
    from flask import Response
    pages = [
        ('https://nomadcuts.online/',          '1.0',  'weekly'),
        ('https://nomadcuts.online/servicios', '0.9',  'monthly'),
        ('https://nomadcuts.online/agendar',   '0.9',  'weekly'),
    ]
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, pri, freq in pages:
        xml.append(f'  <url><loc>{loc}</loc><priority>{pri}</priority><changefreq>{freq}</changefreq></url>')
    xml.append('</urlset>')
    return Response('\n'.join(xml), mimetype='application/xml')


@app.route('/robots.txt')
def robots():
    from flask import Response
    txt = 'User-agent: *\nAllow: /\nSitemap: https://nomadcuts.online/sitemap.xml\n'
    return Response(txt, mimetype='text/plain')


@app.route('/servicios')
def servicios():
    return render_template('servicios.html')


@app.route('/promociones')
def promociones():
    # Promociones desactivadas: cualquier link viejo lleva a la carta de servicios
    return redirect(url_for('servicios'), code=301)


# ── Agendamiento ──────────────────────────────────────────────

@app.route('/agendar/horas-tomadas')
def horas_tomadas():
    fecha = request.args.get('fecha', '')
    if not fecha:
        return jsonify({'error': True, 'horas': [], 'disponibles': []})

    horario = get_horario_dia(fecha)

    # Día cerrado → no hay horas disponibles
    if not horario or not horario['activo']:
        return jsonify({'cerrado': True, 'horas': [], 'disponibles': []})

    disponibles = generar_horas(horario['hora_inicio'], horario['hora_fin'])

    db = get_db()
    tomadas = [r['hora'] for r in db.execute(
        "SELECT hora FROM citas WHERE fecha=? AND estado != 'rechazada'", (fecha,)
    ).fetchall()]

    return jsonify({'cerrado': False, 'tomadas': tomadas, 'disponibles': disponibles})


@app.route('/agendar', methods=['GET', 'POST'])
def agendar():
    if request.method == 'POST':
        nombre    = request.form['nombre']
        email     = request.form['email']
        telefono  = request.form['telefono']
        servicio  = request.form['servicio']
        fecha     = request.form['fecha']
        hora      = request.form['hora']
        notas     = request.form.get('notas', '')
        direccion = request.form.get('direccion', '').strip()

        db = get_db()

        # Validar horario disponible
        horario = get_horario_dia(fecha)
        if not horario or not horario['activo']:
            return render_template('agendar.html',
                error='No trabajamos ese día. Por favor elige otra fecha.')

        horas_ok = generar_horas(horario['hora_inicio'], horario['hora_fin'])
        if hora not in horas_ok:
            return render_template('agendar.html',
                error='Esa hora no está disponible. Por favor elige otra.')

        # Validar que no esté tomada
        if db.execute(
            "SELECT id FROM citas WHERE fecha=? AND hora=? AND estado!='rechazada'",
            (fecha, hora)
        ).fetchone():
            return render_template('agendar.html',
                error='Ese horario ya está reservado. Elige otra hora.')

        cursor = db.execute('''
            INSERT INTO citas (nombre,email,telefono,servicio,fecha,hora,notas,direccion,precio,estado)
            VALUES (?,?,?,?,?,?,?,?,?,'pendiente_pago')
        ''', (nombre, email, telefono, servicio, fecha, hora, notas, direccion,
              precio_de_servicio(servicio)))
        cita_id = cursor.lastrowid
        db.commit()

        # Guarda datos en sesión para mostrarlos en la página de confirmación
        session['cita_confirmada'] = {
            'cita_id': cita_id,
            'nombre':  nombre,
            'servicio': servicio,
            'fecha':   fecha,
            'hora':    hora,
        }

        email_pendiente_pago(nombre, email, servicio, fecha, hora, cita_id)
        whatsapp_nueva_cita(cita_id, nombre, servicio, fecha, hora, direccion)
        ntfy_nueva_cita(cita_id, nombre, servicio, fecha, hora, direccion)
        enviar_email(config.GMAIL_USER,
            f'[NUEVA CITA #{cita_id}] {nombre} - {fecha} {hora}',
            _base_email(f'<p>Nueva solicitud: <b>#{cita_id}</b><br>'
                        f'Cliente: {nombre}<br>'
                        f'Servicio: {servicio}<br>'
                        f'Fecha: {fecha} a las {hora}<br>'
                        f'Tel: {telefono}<br>'
                        f'Email: {email}</p>'
                        f'<p><a href="https://nomadcuts.online/admin" style="color:#C9A84C;">'
                        f'Ver en panel admin</a></p>'))

        return redirect(url_for('cita_pendiente'))

    return render_template('agendar.html', error=None)


@app.route('/agendar/pendiente')
def cita_pendiente():
    datos = session.pop('cita_confirmada', {})
    return render_template('cita_confirmada.html',
        cita_id=datos.get('cita_id', ''),
        nombre=datos.get('nombre', ''),
        servicio=datos.get('servicio', ''),
        fecha=datos.get('fecha', ''),
        hora=datos.get('hora', ''),
        yappy=config.YAPPY_NUMERO,
        deposito=config.YAPPY_DEPOSITO,
        yappy_boton_activo=config.YAPPY_BOTON_ACTIVO,
        yappy_merchant_id=config.YAPPY_MERCHANT_ID)


# ── Panel Admin ───────────────────────────────────────────────

def admin_requerido(f):
    """Decorador: redirige al login si no hay sesión admin."""
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('admin'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return wrapper


@app.route('/cita/ok/<int:cita_id>/<token>')
def cita_ok(cita_id, token):
    """Confirma una cita desde el link de WhatsApp."""
    if not hmac.compare_digest(token, _wa_token('ok', cita_id)):
        return '<h2 style="font-family:sans-serif;color:#c00;">⚠️ Link inválido</h2>', 403
    db = get_db()
    cita = db.execute('SELECT * FROM citas WHERE id=?', (cita_id,)).fetchone()
    if not cita:
        return '<h2 style="font-family:sans-serif;">❌ Cita no encontrada</h2>', 404
    if cita['estado'] not in ('pendiente_pago', 'pendiente'):
        estado_txt = {'confirmada':'ya estaba confirmada','rechazada':'ya estaba rechazada'}.get(cita['estado'], cita['estado'])
        return f'<h2 style="font-family:sans-serif;">ℹ️ Cita #{cita_id} {estado_txt}</h2>', 200
    db.execute("UPDATE citas SET estado='confirmada' WHERE id=?", (cita_id,))
    db.commit()
    email_confirmacion_final(
        cita['nombre'], cita['email'],
        cita['servicio'], cita['fecha'], cita['hora'], cita_id)
    return f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cita confirmada</title>
<style>body{{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0A0A0A;font-family:sans-serif;color:#fff;text-align:center;padding:24px}}
.card{{background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:40px 32px;max-width:360px}}
.icon{{font-size:48px;margin-bottom:16px}}
h2{{margin:0 0 8px;font-size:22px;color:#E2B55A}}
p{{margin:0;color:#888;font-size:14px}}
</style></head><body>
<div class="card">
  <div class="icon">✅</div>
  <h2>Cita #{cita_id} confirmada</h2>
  <p>Se envió confirmación a {cita["nombre"]} por email.</p>
</div></body></html>'''


@app.route('/cita/no/<int:cita_id>/<token>')
def cita_no(cita_id, token):
    """Rechaza una cita desde el link de WhatsApp."""
    if not hmac.compare_digest(token, _wa_token('no', cita_id)):
        return '<h2 style="font-family:sans-serif;color:#c00;">⚠️ Link inválido</h2>', 403
    db = get_db()
    cita = db.execute('SELECT * FROM citas WHERE id=?', (cita_id,)).fetchone()
    if not cita:
        return '<h2 style="font-family:sans-serif;">❌ Cita no encontrada</h2>', 404
    if cita['estado'] not in ('pendiente_pago', 'pendiente'):
        estado_txt = {'confirmada':'ya estaba confirmada','rechazada':'ya estaba rechazada'}.get(cita['estado'], cita['estado'])
        return f'<h2 style="font-family:sans-serif;">ℹ️ Cita #{cita_id} {estado_txt}</h2>', 200
    db.execute("UPDATE citas SET estado='rechazada' WHERE id=?", (cita_id,))
    db.commit()
    email_rechazo(cita['nombre'], cita['email'], cita_id)
    return f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cita rechazada</title>
<style>body{{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0A0A0A;font-family:sans-serif;color:#fff;text-align:center;padding:24px}}
.card{{background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:40px 32px;max-width:360px}}
.icon{{font-size:48px;margin-bottom:16px}}
h2{{margin:0 0 8px;font-size:22px;color:#ff6b6b}}
p{{margin:0;color:#888;font-size:14px}}
</style></head><body>
<div class="card">
  <div class="icon">❌</div>
  <h2>Cita #{cita_id} rechazada</h2>
  <p>Se notificó a {cita["nombre"]} por email.</p>
</div></body></html>'''


@app.route('/api/citas')
def api_citas():
    '''Solo lectura, para el Chief of Staff (agente personal). Protegido por token.'''
    token = request.headers.get('X-API-Token', '') or request.args.get('token', '')
    if not config.CHIEF_OF_STAFF_TOKEN or token != config.CHIEF_OF_STAFF_TOKEN:
        return jsonify({'error': 'unauthorized'}), 401
    db = get_db()
    citas = db.execute(
        'SELECT id, nombre, telefono, servicio, fecha, hora, estado, creado_en '
        'FROM citas ORDER BY creado_en DESC LIMIT 30'
    ).fetchall()
    return jsonify([dict(c) for c in citas])


@app.route('/admin/login', methods=['GET','POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password') == config.ADMIN_PASSWORD:
            session['admin'] = True
            return redirect(url_for('admin'))
        return render_template('admin_login.html', error='Contraseña incorrecta')
    return render_template('admin_login.html', error=None)


@app.route('/admin/salir')
def admin_salir():
    session.pop('admin', None)
    return redirect(url_for('inicio'))


@app.route('/admin')
@admin_requerido
def admin():
    db   = get_db()
    hoy  = hoy_panama().isoformat()

    # Citas agrupadas
    pendientes  = db.execute(
        "SELECT * FROM citas WHERE estado='pendiente_pago' ORDER BY fecha,hora").fetchall()
    proximas    = db.execute(
        "SELECT * FROM citas WHERE estado='confirmada' AND fecha>=? ORDER BY fecha,hora LIMIT 30",
        (hoy,)).fetchall()
    pasadas     = db.execute(
        "SELECT * FROM citas WHERE estado='confirmada' AND fecha<? ORDER BY fecha DESC LIMIT 20",
        (hoy,)).fetchall()
    rechazadas  = db.execute(
        "SELECT * FROM citas WHERE estado='rechazada' ORDER BY fecha DESC LIMIT 10").fetchall()

    # Horario semanal
    horario = {r['dia']: r for r in db.execute('SELECT * FROM horario').fetchall()}

    resenas = db.execute('SELECT * FROM resenas ORDER BY creado_en DESC').fetchall()

    # Citas de hoy confirmadas para la ruta del día
    citas_hoy = db.execute(
        "SELECT * FROM citas WHERE estado='confirmada' AND fecha=? ORDER BY hora",
        (hoy,)
    ).fetchall()

    return render_template('admin.html',
        pendientes=pendientes, proximas=proximas,
        pasadas=pasadas, rechazadas=rechazadas,
        horario=horario, dias=DIAS_SEMANA, hoy=hoy,
        resenas=resenas, citas_hoy=citas_hoy,
        ganado_mes=_resumen_dinero(
            db.execute("SELECT fecha, estado, precio FROM citas WHERE estado='confirmada'").fetchall(),
            hoy)['ganado_mes'])


def _resumen_dinero(citas, hoy):
    """Suma lo ganado (citas confirmadas ya realizadas) total y por mes."""
    mes_actual = hoy[:7]
    realizadas = [c for c in citas if c['estado'] == 'confirmada' and c['fecha'] <= hoy]
    proximas   = [c for c in citas if c['estado'] == 'confirmada' and c['fecha'] > hoy]
    por_mes = {}
    for c in realizadas:
        m = c['fecha'][:7]
        d = por_mes.setdefault(m, {'mes': m, 'citas': 0, 'total': 0.0})
        d['citas'] += 1
        d['total'] += c['precio'] or 0
    return {
        'ganado_total':     sum((c['precio'] or 0) for c in realizadas),
        'ganado_mes':       sum((c['precio'] or 0) for c in realizadas if c['fecha'][:7] == mes_actual),
        'citas_realizadas': len(realizadas),
        'citas_mes':        sum(1 for c in realizadas if c['fecha'][:7] == mes_actual),
        'por_cobrar':       sum((c['precio'] or 0) for c in proximas),
        'por_mes':          sorted(por_mes.values(), key=lambda d: d['mes'], reverse=True),
    }


@app.route('/admin/historial')
@admin_requerido
def admin_historial():
    db  = get_db()
    hoy = hoy_panama().isoformat()
    estado = request.args.get('estado', '')
    todas = db.execute('SELECT * FROM citas ORDER BY fecha DESC, hora DESC').fetchall()
    citas = [c for c in todas if c['estado'] == estado] if estado else todas
    conteo = {}
    for c in todas:
        conteo[c['estado']] = conteo.get(c['estado'], 0) + 1
    return render_template('admin_historial.html',
        citas=citas, total=len(todas), conteo=conteo, estado=estado, hoy=hoy,
        dinero=_resumen_dinero(todas, hoy))


@app.route('/admin/cita/<int:cita_id>/precio', methods=['POST'])
@admin_requerido
def editar_precio(cita_id):
    try:
        precio = max(0.0, float(request.form.get('precio', '0').replace(',', '.')))
    except ValueError:
        precio = None
    if precio is not None:
        db = get_db()
        db.execute('UPDATE citas SET precio=? WHERE id=?', (precio, cita_id))
        db.commit()
    return redirect(url_for('admin_historial', estado=request.form.get('estado', '')) +
                    f'#cita-{cita_id}')


@app.route('/admin/confirmar/<int:cita_id>', methods=['POST'])
@admin_requerido
def confirmar_cita(cita_id):
    db   = get_db()
    cita = db.execute('SELECT * FROM citas WHERE id=?', (cita_id,)).fetchone()
    if cita:
        db.execute("UPDATE citas SET estado='confirmada' WHERE id=?", (cita_id,))
        db.commit()
        email_confirmacion_final(cita['nombre'], cita['email'],
            cita['servicio'], cita['fecha'], cita['hora'], cita_id)
    return redirect(url_for('admin'))


@app.route('/admin/rechazar/<int:cita_id>', methods=['POST'])
@admin_requerido
def rechazar_cita(cita_id):
    db   = get_db()
    cita = db.execute('SELECT * FROM citas WHERE id=?', (cita_id,)).fetchone()
    if cita:
        db.execute("UPDATE citas SET estado='rechazada' WHERE id=?", (cita_id,))
        db.commit()
        email_rechazo(cita['nombre'], cita['email'], cita_id)
    return redirect(url_for('admin'))


@app.route('/admin/resena/aprobar/<int:resena_id>', methods=['POST'])
@admin_requerido
def aprobar_resena(resena_id):
    db = get_db()
    db.execute('UPDATE resenas SET aprobada=1 WHERE id=?', (resena_id,))
    db.commit()
    return redirect(url_for('admin') + '#resenas')


@app.route('/admin/resena/borrar/<int:resena_id>', methods=['POST'])
@admin_requerido
def borrar_resena(resena_id):
    db = get_db()
    db.execute('DELETE FROM resenas WHERE id=?', (resena_id,))
    db.commit()
    return redirect(url_for('admin') + '#resenas')


@app.route('/admin/horario', methods=['POST'])
@admin_requerido
def guardar_horario():
    db = get_db()
    for dia in DIAS_SEMANA:
        activo      = 1 if request.form.get(f'activo_{dia}') else 0
        hora_inicio = request.form.get(f'inicio_{dia}', '08:00')
        hora_fin    = request.form.get(f'fin_{dia}',    '18:00')
        db.execute(
            'UPDATE horario SET activo=?, hora_inicio=?, hora_fin=? WHERE dia=?',
            (activo, hora_inicio, hora_fin, dia))
    db.commit()
    return redirect(url_for('admin') + '#horario')


# ── Ruta de demo (temporal) ───────────────────────────────────

@app.route('/demo/pago')
def demo_pago():
    session['cita_confirmada'] = {
        'cita_id': 42,
        'nombre':  'Jesus Vasquez',
        'servicio': 'Corte + Barba — $25',
        'fecha':   '2026-06-28',
        'hora':    '10:00',
    }
    return redirect(url_for('cita_pendiente'))


# ── Arranque ──────────────────────────────────────────────────

# Se ejecuta al importar el módulo (tanto python app.py como gunicorn)
init_db()

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('RENDER') is None  # debug solo en local
    print(f'\n✂  NomadCuts → http://localhost:{port}')
    print(f'🔐 Admin      → http://localhost:{port}/admin\n')
    app.run(debug=debug, host='0.0.0.0', port=port)
