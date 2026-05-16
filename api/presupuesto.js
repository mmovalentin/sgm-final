module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { b64, mime_type, file_name } = req.body;
  if (!b64) return res.status(400).json({ error: 'Falta el archivo en base64' });

  const isImage = mime_type && mime_type.startsWith('image/');
  const prompt = 'Este es un presupuesto de construccion en Argentina con precios en PESOS argentinos. ' +
    'Extrae cada item con su precio en pesos. Usa TC 1415 para convertir a USD. ' +
    'Responde SOLO en JSON: {"proveedor":"string","items":[{"rubro":"string","item":"string","precio_pesos":0,"precio_usd":0}],"total_pesos":0,"total_usd":0}. ' +
    'El total_usd debe ser suma de todos los precio_usd.';

  const content = [
    ...(isImage ? [{ type: 'image', source: { type: 'base64', media_type: mime_type, data: b64 } }] : []),
    { type: 'text', text: prompt },
  ];

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
        max_tokens: 2000,
        system: 'Sos un asistente experto en presupuestos de construcción en Argentina. Respondés SIEMPRE en JSON válido puro, sin markdown, sin explicaciones.',
        messages: [{ role: 'user', content }],
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

    // Recalcular total_usd como suma de items para mayor precisión
    if (result.items?.length > 0) {
      result.total_usd = Math.round(result.items.reduce((s, it) => s + (it.precio_usd || 0), 0) * 100) / 100;
    }

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
