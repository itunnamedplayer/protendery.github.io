export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { name, contact, interest } = req.body || {};
  if (!name || !contact) {
    return res.status(400).json({ error: 'Имя и контакт обязательны' });
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_IDS  = [
    process.env.TG_CHAT_ID_1,
    process.env.TG_CHAT_ID_2,
  ].filter(Boolean); // игнорируем пустые

  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.error('Missing TG_BOT_TOKEN or TG_CHAT_ID env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const esc = (s) => String(s || '').replace(/[_*[\]()~`>#+=|{}.!-]/g, c => '\\' + c);
  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  const text = [
    '📋 *Новая заявка — ПроТендеры*',
    '',
    `👤 *Имя:* ${esc(name)}`,
    `📱 *Контакт:* ${esc(contact)}`,
    `❓ *Интерес:* ${esc(interest || 'не указан')}`,
    '',
    `🕐 *Время:* ${esc(now)} (МСК)`,
    `🌐 _Источник: protendery.online_`,
  ].join('\n');

  try {
    const results = await Promise.all(
      CHAT_IDS.map(chat_id =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'Markdown' }),
        }).then(r => r.json())
      )
    );

    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      console.error('Telegram API errors:', failed);
      return res.status(500).json({ error: 'Telegram send failed', detail: failed });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error' });
  }
}
