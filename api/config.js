module.exports = function handler(_request, response) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    response.status(503).json({ error: 'Supabase is not configured for this deployment.' });
    return;
  }

  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ supabaseUrl, supabaseAnonKey });
};
