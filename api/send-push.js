const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription, title, body, icon, data } = req.body;

  const payload = JSON.stringify({
    title: title || 'SGI',
    body: body || 'Tenés una notificación nueva',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: data || {}
  });

  try {
    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Push error:', err);
    res.status(500).json({ error: err.message });
  }
};
