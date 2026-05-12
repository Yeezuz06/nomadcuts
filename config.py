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

# ── General ──────────────────────────────────────────────────
NOMBRE_NEGOCIO = 'NomadCuts'
