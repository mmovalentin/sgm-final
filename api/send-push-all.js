const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, title, body, icon, data } = req.body;

  let query = supabase.from('push_subscriptions').select('*');
  if (user_id) query = query.eq('user_id', user_id);

  const { data: subs, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({
    title: title || 'SGI',
    body: body || 'Nueva notificacion SGI',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: data || {}
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload)
    )
  );

  const ok = results.filter(r => r.status === 'fulfilled').length;
  const fail = results.filter(r => r.status === 'rejected').length;
  res.status(200).json({ ok, fail });
};
