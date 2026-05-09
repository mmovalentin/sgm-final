module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    // Fetch blue and oficial simultaneously
    const [blueRes, oficialRes] = await Promise.all([
      fetch('https://dolarapi.com/v1/dolares/blue'),
      fetch('https://dolarapi.com/v1/dolares/oficial')
    ]);
    const blue = await blueRes.json();
    const oficial = await oficialRes.json();
 
    const blueMid = Math.round((blue.compra + blue.venta) / 2);
    const oficialMid = Math.round((oficial.compra + oficial.venta) / 2);
 
    // Use whichever is higher
    const best = blueMid >= oficialMid ? blue : oficial;
    const bestMid = Math.max(blueMid, oficialMid);
    const tipo = blueMid >= oficialMid ? 'blue' : 'oficial';
 
    return res.status(200).json({
      tc: bestMid,
      compra: best.compra,
      venta: best.venta,
      tipo,
      blue: blueMid,
      oficial: oficialMid
    });
  } catch (e) {
    return res.status(200).json({ tc: 1390, compra: 1380, venta: 1400, tipo: 'blue', blue: 1390, oficial: 1395 });
  }
};
 
