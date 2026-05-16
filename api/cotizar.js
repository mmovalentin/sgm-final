module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { tipo, m2, sistema, cal, priceM2, total, anticipo } = req.body;
  if (!tipo || !m2 || !sistema || !cal) return res.status(400).json({ error: 'Faltan campos requeridos' });

  const prompt = `Genera presupuesto de construccion: tipo=${tipo}, superficie=${m2}m2, sistema=${sistema}, calidad=${cal}, precio_base=USD ${priceM2}/m2. Responde este JSON exacto: {"total_usd":${total},"anticipo_usd":${anticipo},"tiempo_meses":4,"rubros":[{"nombre":"Fundaciones","pct":15},{"nombre":"Estructura SF","pct":25},{"nombre":"Terminaciones","pct":35},{"nombre":"Instalaciones","pct":25}],"analisis":"descripcion breve del proyecto en 2 oraciones"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: 'Sos experto en construccion en Cordoba Argentina. Responde SIEMPRE en JSON valido puro, sin markdown, sin explicaciones.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const raw = await response.json();
    const txt = raw.content?.[0]?.text || '{}';

    let result;
    try {
      result = JSON.parse(txt.replace(/`/g, '').replace(/^json\s*/i, '').trim());
    } catch (_) {
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else return res.status(500).json({ error: 'Respuesta IA inválida', raw: txt.slice(0, 300) });
    }

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
