// Crea las 3 tablas en Supabase via Management API.
// Requiere SUPABASE_ACCESS_TOKEN (personal access token de supabase.com/dashboard/account/tokens).
// Llamar una sola vez: POST /api/init-db

const SQL = `
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL, rubro TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  contacto TEXT, verificado BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  archivo_nombre TEXT, total_usd NUMERIC, fecha DATE DEFAULT CURRENT_DATE,
  vigencia_dias INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS consultas_guardadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregunta TEXT NOT NULL, respuesta TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}', fecha TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL, telefono TEXT, email TEXT, modelo TEXT,
  monto_usd NUMERIC DEFAULT 0, etapa TEXT DEFAULT 'Interesado',
  notas JSONB DEFAULT '[]'::jsonb,
  ultimo_contacto TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre TEXT, material TEXT, rubro TEXT,
  precio_usd NUMERIC, precio_pesos NUMERIC,
  fecha TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
  rubro TEXT, item TEXT, precio_pesos NUMERIC, precio_usd NUMERIC,
  precio_anterior_usd NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE proveedores  TO anon, authenticated;
GRANT ALL ON TABLE presupuestos TO anon, authenticated;
GRANT ALL ON TABLE materiales   TO anon, authenticated;
GRANT ALL ON TABLE consultas_guardadas TO anon, authenticated;
GRANT ALL ON TABLE clientes     TO anon, authenticated;
GRANT ALL ON TABLE compras      TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'SUPABASE_ACCESS_TOKEN not configured' });

  try {
    const r = await fetch(
      'https://api.supabase.com/v1/projects/wwaaoritqbfzoqnbtqvk/database/query',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: SQL }),
      }
    );
    const data = await r.json();
    return res.status(r.ok ? 200 : 400).json({ ok: r.ok, ...data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
