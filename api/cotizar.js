module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { tipo, m2, sistema, cal } = req.body;
  if (!tipo || !m2 || !sistema || !cal) return res.status(400).json({ error: 'Faltan campos requeridos' });

  const PRICES = { economico: 850, standard: 1100, premium: 1500 };
  const priceM2 = parseInt(req.body.priceM2) || PRICES[cal] || 1000;
  const superficie = parseInt(m2);
  const total_usd = superficie * priceM2;
  const anticipo_usd = Math.round(total_usd * 0.6);
  const tiempo_meses = Math.min(24, Math.max(3, Math.round(superficie / 15)));

  const prompt = `Proyecto de construccion en Cordoba Argentina:
- Tipo: ${tipo}
- Superficie: ${superficie}m2
- Sistema constructivo: ${sistema}
- Calidad: ${cal}
- Precio base: USD ${priceM2}/m2
- Total: USD ${total_usd}
- Tiempo estimado: ${tiempo_meses} meses

Devuelve SOLO este JSON (los pct deben sumar 100, adapta rubros al sistema ${sistema}):
{"total_usd":${total_usd},"anticipo_usd":${anticipo_usd},"tiempo_meses":${tiempo_meses},"rubros":[{"nombre":"Fundaciones","pct":15},{"nombre":"Estructura ${sistema}","pct":30},{"nombre":"Terminaciones","pct":30},{"nombre":"Instalaciones","pct":20},{"nombre":"Exterior","pct":5}],"analisis":"descripcion breve del proyecto en 2 oraciones"}`;

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

    // Garantizar valores correctos independientemente de lo que devuelva la IA
    result.total_usd = total_usd;
    result.anticipo_usd = anticipo_usd;
    if (!result.tiempo_meses) result.tiempo_meses = tiempo_meses;

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
