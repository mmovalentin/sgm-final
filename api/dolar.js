module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/blue');
    const d = await r.json();
    const mid = Math.round((d.compra + d.venta) / 2);
    return res.status(200).json({ blue: mid, compra: d.compra, venta: d.venta });
  } catch (e) {
    return res.status(200).json({ blue: 1200, compra: 1190, venta: 1210 });
  }
};
