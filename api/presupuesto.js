module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  // Guard: si Vercel no parsea el body devolvemos 400 con detalle
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Body no recibido o no es JSON', bodyType: typeof req.body });
  }

  const { b64, mime_type, file_name, tc } = req.body;
  if (!b64) return res.status(400).json({ error: 'Falta el archivo en base64', received: Object.keys(req.body) });

  const TC = parseInt(tc) || 1415;
  const isImage = mime_type && mime_type.startsWith('image/');
  const isPdf = mime_type === 'application/pdf' || (file_name || '').toLowerCase().endsWith('.pdf');

  console.log(`[presupuesto] file=${file_name} mime=${mime_type} isImage=${isImage} isPdf=${isPdf} TC=${TC}`);

  const prompt =
    `Analizá este presupuesto de construcción/servicio en Argentina con precios en PESOS argentinos.\n` +
    `Extraé del encabezado del PDF el nombre completo, teléfono, email y dirección del proveedor. ` +
    `Si no encontrás algún dato dejalo como string vacío.\n` +
    `Extraé TODOS los ítems con su precio en pesos. Usa TC ${TC} para convertir a USD.\n` +
    `El total_usd debe ser la suma exacta de todos los precio_usd.\n` +
    `Retorná SOLO JSON válido sin texto adicional:\n` +
    `{"proveedor":{"nombre":"","especialidad":"","telefono":"","email":"","direccion":""},` +
    `"items":[{"rubro":"","item":"","precio_pesos":0,"precio_usd":0}],"total_pesos":0,"total_usd":0}`;

  // Claude Sonnet soporta PDFs nativamente via type:"document" (sin dependencias externas).
  // Imágenes via type:"image". El prompt de extracción va siempre como último bloque de texto.
  const content = [];
  if (isImage) {
    content.push({ type: 'image', source: { type: 'base64', media_type: mime_type, data: b64 } });
  } else if (isPdf) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } });
  }
  content.push({ type: 'text', text: prompt });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'Sos un asistente experto en presupuestos de construcción en Argentina. Respondés SIEMPRE en JSON válido puro, sin markdown, sin explicaciones.',
        messages: [{ role: 'user', content }],
      }),
    });

    const raw = await response.json();
    console.log(`[presupuesto] Claude status=${response.status} stop=${raw.stop_reason}`);
    console.log(`[presupuesto] raw keys=${Object.keys(raw).join(',')}`);

    // Detectar error de Claude (API key inválida, overload, etc.)
    if (raw.error || (!raw.content && response.status !== 200)) {
      const errMsg = raw.error?.message || JSON.stringify(raw);
      console.error(`[presupuesto] Claude API error: ${errMsg}`);
      return res.status(502).json({ error: `Claude API error: ${errMsg}` });
    }

    const txt = raw.content?.[0]?.text || '{}';
    console.log(`[presupuesto] Claude raw text: ${txt.slice(0, 600)}`);

    let result;
    try {
      result = JSON.parse(txt.replace(/`/g, '').replace(/^json\s*/i, '').trim());
    } catch (_) {
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        console.error('[presupuesto] No se pudo parsear JSON:', txt.slice(0, 300));
        return res.status(500).json({ error: 'Respuesta IA inválida', raw: txt.slice(0, 300) });
      }
    }

    if (!result || Object.keys(result).length === 0) {
      return res.status(500).json({ error: 'Claude devolvio respuesta vacia', raw: txt.slice(0, 300) });
    }

    // Normalizar proveedor como objeto con todos los campos
    if (typeof result.proveedor === 'string') {
      result.proveedor = { nombre: result.proveedor, especialidad: '', telefono: '', email: '', direccion: '' };
    } else if (typeof result.proveedor === 'object' && result.proveedor !== null) {
      result.proveedor = {
        nombre:      result.proveedor.nombre      || '',
        especialidad:result.proveedor.especialidad|| '',
        telefono:    result.proveedor.telefono    || '',
        email:       result.proveedor.email       || '',
        direccion:   result.proveedor.direccion   || '',
      };
    }

    // Recalcular precio_usd de cada item con el TC real
    if (Array.isArray(result.items)) {
      result.items = result.items.map(it => ({
        ...it,
        precio_usd: Math.round((it.precio_pesos || 0) / TC * 100) / 100,
      }));
      result.total_pesos = result.items.reduce((s, it) => s + (it.precio_pesos || 0), 0);
      result.total_usd   = Math.round(result.items.reduce((s, it) => s + it.precio_usd, 0) * 100) / 100;
    }

    console.log(`[presupuesto] OK proveedor="${result.proveedor}" items=${result.items?.length} total_usd=${result.total_usd}`);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[presupuesto] Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
