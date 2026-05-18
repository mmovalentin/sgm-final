-- SGM — Inicialización de base de datos Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Todas las sentencias son idempotentes (IF NOT EXISTS / OR REPLACE)

-- ─────────────────────────────────────────────
-- TABLAS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proveedores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT NOT NULL,
  rubro       TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  contacto    TEXT,
  verificado  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  archivo_nombre  TEXT,
  total_usd       NUMERIC,
  fecha           DATE DEFAULT CURRENT_DATE,
  vigencia_dias   INTEGER DEFAULT 30,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiales (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id        UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  presupuesto_id      UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
  rubro               TEXT,
  item                TEXT,
  precio_pesos        NUMERIC,
  precio_usd          NUMERIC,
  precio_anterior_usd NUMERIC,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id     UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre TEXT,
  material         TEXT,
  rubro            TEXT,
  precio_usd       NUMERIC,
  precio_pesos     NUMERIC,
  fecha            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          TEXT NOT NULL,
  telefono        TEXT,
  email           TEXT,
  modelo          TEXT,
  monto_usd       NUMERIC DEFAULT 0,
  etapa           TEXT DEFAULT 'Interesado',
  notas           JSONB DEFAULT '[]'::jsonb,
  ultimo_contacto TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultas_guardadas (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregunta  TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  tags      TEXT[] DEFAULT '{}',
  fecha     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PERMISOS (sin RLS — acceso abierto por anon)
-- Pendiente: habilitar RLS y asociar filas a auth.uid()
-- ─────────────────────────────────────────────

GRANT ALL ON TABLE proveedores         TO anon, authenticated;
GRANT ALL ON TABLE presupuestos        TO anon, authenticated;
GRANT ALL ON TABLE materiales          TO anon, authenticated;
GRANT ALL ON TABLE compras             TO anon, authenticated;
GRANT ALL ON TABLE clientes            TO anon, authenticated;
GRANT ALL ON TABLE consultas_guardadas TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ─────────────────────────────────────────────
-- RLS (esqueleto — descomentar cuando auth esté implementado)
-- ─────────────────────────────────────────────

-- ALTER TABLE clientes            ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE presupuestos        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compras             ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consultas_guardadas ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "own rows" ON clientes
--   FOR ALL USING (auth.uid()::text = user_id::text);

-- CREATE POLICY "own rows" ON consultas_guardadas
--   FOR ALL USING (auth.uid()::text = user_id::text);

-- ─────────────────────────────────────────────
-- MIGRACIONES APLICADAS (historial)
-- ─────────────────────────────────────────────

-- 2026-05-17: ADD COLUMN vigencia_dias a presupuestos
-- ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS vigencia_dias INTEGER DEFAULT 30;

-- 2026-05-17: CREATE TABLE compras (si no se usó init-db.js completo)
-- 2026-05-17: CREATE TABLE clientes
-- 2026-05-17: CREATE TABLE consultas_guardadas
