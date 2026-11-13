# ============================================================
#  NomadCuts — Capa de base de datos
#  · Producción: Postgres (Neon) si existe DATABASE_URL
#  · Local:      SQLite (nomadcuts.db)
#  Ambos se usan igual: db.execute(sql_con_?, params), row['col'] o row[0]
# ============================================================

import os
import re
import sqlite3

from flask import g, has_app_context

DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
SQLITE_PATH  = os.environ.get('SQLITE_PATH', 'nomadcuts.db')
IS_PG        = bool(DATABASE_URL)

# Tablas con id autoincremental (para devolver lastrowid en Postgres)
_TABLAS_CON_ID = ('citas', 'resenas', 'promociones')
_INSERT_RE = re.compile(r'^\s*INSERT\s+INTO\s+(\w+)', re.IGNORECASE)


class Row(dict):
    """Fila que acepta row['col'], row[0] y row.col en Jinja (como sqlite3.Row)."""

    def __init__(self, cols, values):
        super().__init__(zip(cols, values))
        self._values = tuple(values)

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return super().__getitem__(key)


class _PGCursor:
    def __init__(self, cur, lastrowid=None):
        self._cur = cur
        self.lastrowid = lastrowid

    def _cols(self):
        return [d.name for d in self._cur.description] if self._cur.description else []

    def fetchone(self):
        if self._cur.description is None:
            return None
        r = self._cur.fetchone()
        return Row(self._cols(), r) if r is not None else None

    def fetchall(self):
        if self._cur.description is None:
            return []
        cols = self._cols()
        return [Row(cols, r) for r in self._cur.fetchall()]


class _PGConn:
    """Envuelve psycopg para hablar el mismo dialecto que sqlite3 (placeholders ?)."""

    def __init__(self, url):
        import psycopg
        self._conn = psycopg.connect(url, connect_timeout=15)

    @staticmethod
    def _sql(sql):
        return sql.replace('%', '%%').replace('?', '%s')

    def execute(self, sql, params=()):
        m = _INSERT_RE.match(sql)
        wants_id = (m and m.group(1).lower() in _TABLAS_CON_ID
                    and 'RETURNING' not in sql.upper())
        q = self._sql(sql) + (' RETURNING id' if wants_id else '')
        cur = self._conn.cursor()
        try:
            cur.execute(q, tuple(params))
        except Exception:
            # Postgres aborta la transacción tras un error: la limpiamos
            self._conn.rollback()
            raise
        lastrowid = cur.fetchone()[0] if wants_id else None
        return _PGCursor(cur, lastrowid)

    def executemany(self, sql, seq):
        cur = self._conn.cursor()
        cur.executemany(self._sql(sql), [tuple(p) for p in seq])
        return _PGCursor(cur)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        try:
            self._conn.close()
        except Exception:
            pass

    # Igual que sqlite3: el bloque `with` hace commit/rollback, no cierra
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        return False


def _nueva_conexion():
    if IS_PG:
        return _PGConn(DATABASE_URL)
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_db():
    """Una conexión por request (se cierra sola al terminar)."""
    if has_app_context():
        if 'db_conn' not in g:
            g.db_conn = _nueva_conexion()
        return g.db_conn
    return _nueva_conexion()


def close_db(_exc=None):
    conn = g.pop('db_conn', None) if has_app_context() else None
    if conn is not None:
        conn.close()


# ── Esquema ───────────────────────────────────────────────────

_SCHEMA_PG = '''
CREATE TABLE IF NOT EXISTS citas (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    email     TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    servicio  TEXT NOT NULL,
    fecha     TEXT NOT NULL,
    hora      TEXT NOT NULL,
    notas     TEXT,
    estado    TEXT DEFAULT 'pendiente_pago',
    creado_en TEXT DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    direccion TEXT DEFAULT '',
    precio    REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS promociones (
    id          SERIAL PRIMARY KEY,
    titulo      TEXT NOT NULL,
    descripcion TEXT,
    descuento   TEXT,
    activa      INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS horario (
    dia         TEXT PRIMARY KEY,
    activo      INTEGER DEFAULT 1,
    hora_inicio TEXT DEFAULT '08:00',
    hora_fin    TEXT DEFAULT '18:00'
);
CREATE TABLE IF NOT EXISTS resenas (
    id         SERIAL PRIMARY KEY,
    nombre     TEXT NOT NULL,
    comentario TEXT NOT NULL,
    estrellas  INTEGER NOT NULL DEFAULT 5,
    aprobada   INTEGER DEFAULT 1,
    creado_en  TEXT DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT '';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS precio REAL DEFAULT 0;
'''

_SCHEMA_SQLITE = '''
CREATE TABLE IF NOT EXISTS citas (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre    TEXT NOT NULL,
    email     TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    servicio  TEXT NOT NULL,
    fecha     TEXT NOT NULL,
    hora      TEXT NOT NULL,
    notas     TEXT,
    estado    TEXT DEFAULT 'pendiente_pago',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS promociones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo      TEXT NOT NULL,
    descripcion TEXT,
    descuento   TEXT,
    activa      INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS horario (
    dia         TEXT PRIMARY KEY,
    activo      INTEGER DEFAULT 1,
    hora_inicio TEXT DEFAULT '08:00',
    hora_fin    TEXT DEFAULT '18:00'
);
CREATE TABLE IF NOT EXISTS resenas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    comentario TEXT NOT NULL,
    estrellas  INTEGER NOT NULL DEFAULT 5,
    aprobada   INTEGER DEFAULT 1,
    creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
'''


def crear_esquema(conn):
    if IS_PG:
        for stmt in [s.strip() for s in _SCHEMA_PG.split(';') if s.strip()]:
            conn.execute(stmt)
    else:
        conn.executescript(_SCHEMA_SQLITE)
        for col, ddl in (('direccion', 'TEXT DEFAULT ""'), ('precio', 'REAL DEFAULT 0')):
            cols = [r[1] for r in conn.execute('PRAGMA table_info(citas)').fetchall()]
            if col not in cols:
                conn.execute(f'ALTER TABLE citas ADD COLUMN {col} {ddl}')
    conn.commit()


# ── Importación única SQLite → Postgres ───────────────────────

def importar_sqlite_si_vacio(conn, sqlite_path=None):
    """
    Si Postgres está vacío y existe el archivo SQLite, copia todos sus datos.
    Se ejecuta solo la primera vez que la app arranca contra una base nueva.
    Devuelve un dict {tabla: filas_copiadas} o None si no hizo nada.
    """
    if not IS_PG:
        return None
    sqlite_path = sqlite_path or SQLITE_PATH
    if not os.path.exists(sqlite_path):
        return None
    total = sum(conn.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
                for t in ('citas', 'resenas', 'horario', 'promociones'))
    if total:
        return None

    src = sqlite3.connect(sqlite_path)
    src.row_factory = sqlite3.Row
    copiadas = {}
    for tabla in ('citas', 'resenas', 'horario', 'promociones'):
        try:
            filas = src.execute(f'SELECT * FROM {tabla}').fetchall()
        except sqlite3.OperationalError:
            continue
        destino = [r[0] for r in conn.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = ?",
            (tabla,)).fetchall()]
        for f in filas:
            cols = [c for c in f.keys() if c in destino]
            vals = [str(f[c]) if c == 'creado_en' and f[c] is not None else f[c] for c in cols]
            conn.execute(
                f'INSERT INTO {tabla} ({", ".join(cols)}) VALUES ({", ".join("?" * len(cols))}) RETURNING 1'
                if tabla in _TABLAS_CON_ID else
                f'INSERT INTO {tabla} ({", ".join(cols)}) VALUES ({", ".join("?" * len(cols))})',
                vals)
        copiadas[tabla] = len(filas)
        if tabla in _TABLAS_CON_ID:
            conn.execute(
                f"SELECT setval(pg_get_serial_sequence('{tabla}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {tabla}), 0) + 1, false)")
    src.close()
    conn.commit()
    return copiadas
