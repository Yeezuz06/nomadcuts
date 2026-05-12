import os

# ── Resend (email via HTTP — funciona en Render free tier) ───
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')

# ── Gmail (ya no se usa para envío, solo como dirección de contacto) ─
GMAIL_USER     = os.environ.get('GMAIL_USER', 'hypestbasiclatam@gmail.com')

# ── Yappy ────────────────────────────────────────────────────
YAPPY_NUMERO   = os.environ.get('YAPPY_NUMERO',   '6328-6461')
YAPPY_DEPOSITO = float(os.environ.get('YAPPY_DEPOSITO', '5.00'))

# ── Admin ────────────────────────────────────────────────────
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'nomadcuts2024')

# ── Telegram ─────────────────────────────────────────────────
TELEGRAM_TOKEN   = os.environ.get('TELEGRAM_TOKEN',   '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')

# ── ntfy.sh (notificaciones push gratuitas) ──────────────────
NTFY_TOPIC = os.environ.get('NTFY_TOPIC', '')   # ej: nomadcuts-jesus

# ── WhatsApp (CallMeBot — gratis) ─────────────────────────────
# Para activar: manda "I allow callmebot to send me messages"
# al +34 644 59 78 19 en WhatsApp y recibirás tu apikey
CALLMEBOT_PHONE  = os.environ.get('CALLMEBOT_PHONE',  '')   # ej: 50763286461
CALLMEBOT_APIKEY = os.environ.get('CALLMEBOT_APIKEY', '')

# ── HMAC secret para links de confirmar/rechazar ──────────────
WA_SECRET = os.environ.get('WA_SECRET', 'nomadcuts_wa_secret_2024')

# ── General ──────────────────────────────────────────────────
NOMBRE_NEGOCIO = 'NomadCuts'
