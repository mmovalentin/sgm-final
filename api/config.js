// Expone las variables públicas de Supabase al frontend.
// SUPABASE_URL y SUPABASE_ANON_KEY se configuran en Vercel → Settings → Environment Variables.
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL      || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
};
