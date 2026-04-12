import os

# ── Gmail ────────────────────────────────────────────────────
# En producción (Render) estas vienen de variables de entorno.
# En local las lees directo aquí.
GMAIL_USER     = os.environ.get('GMAIL_USER',     'hypestbasiclatam@gmail.com')
GMAIL_PASSWORD = os.environ.get('GMAIL_PASSWORD', 'cery grpn yimx vvns')

# ── Yappy ────────────────────────────────────────────────────
YAPPY_NUMERO   = os.environ.get('YAPPY_NUMERO',   '6328-6461')
YAPPY_DEPOSITO = float(os.environ.get('YAPPY_DEPOSITO', '5.00'))

# ── Admin ────────────────────────────────────────────────────
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'nomadcuts2024')

# ── General ──────────────────────────────────────────────────
NOMBRE_NEGOCIO = 'NomadCuts'
