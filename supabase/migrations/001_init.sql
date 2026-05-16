-- SGM Supabase schema
-- Run this in the Supabase SQL editor or via POST /api/init-db

CREATE TABLE IF NOT EXISTS proveedores (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  rubro       TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  contacto    TEXT,
  verificado  BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id    UUID        REFERENCES proveedores(id) ON DELETE SET NULL,
  archivo_nombre  TEXT,
  total_usd       NUMERIC,
  fecha           DATE        DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiales (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id        UUID        REFERENCES proveedores(id) ON DELETE SET NULL,
  presupuesto_id      UUID        REFERENCES presupuestos(id) ON DELETE CASCADE,
  rubro               TEXT,
  item                TEXT,
  precio_pesos        NUMERIC,
  precio_usd          NUMERIC,
  precio_anterior_usd NUMERIC,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir acceso anon (ajustar RLS en produccion)
GRANT ALL ON TABLE proveedores  TO anon, authenticated;
GRANT ALL ON TABLE presupuestos TO anon, authenticated;
GRANT ALL ON TABLE materiales   TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
