export default async function handler(req, res) {

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Парсинг body (Vercel иногда передаёт как строку)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { name, contact, mode, interest } = body;

  if (!name || !contact) {
    return res.status(400).json({ error: 'Имя и контакт обязательны' });
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;

  // Поддерживаем один или два chat_id
  const CHAT_IDS = [
    process.env.TG_CHAT_ID,
    process.env.TG_CHAT_ID_1,
    process.env.TG_CHAT_ID_2,
  ].filter(Boolean);

  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.error('Missing TG_BOT_TOKEN or TG_CHAT_ID env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const modeLabel = { phone: '📞 Телефон', tg: '✈️ Telegram', max: '💬 MAX' }[mode] || mode || 'не указан';
  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  // Используем HTML parse_mode — он надёжнее Markdown,
  // не ломается от телефонных номеров, ссылок и спецсимволов
  const esc = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const text = [
    '📋 <b>Новая заявка — ПроТендеры</b>',
    '',
    `👤 <b>Имя:</b> ${esc(name)}`,
    `${modeLabel}: ${esc(contact)}`,
    `❓ <b>Интерес:</b> ${esc(interest || 'не указан')}`,
    '',
    `🕐 <b>Время:</b> ${esc(now)} (МСК)`,
    `🌐 <i>Источник: protendery.online</i>`,
  ].join('\n');

  try {
    const results = await Promise.all(
      CHAT_IDS.map(chat_id =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            text,
            parse_mode: 'HTML',   // ← HTML вместо Markdown
          }),
        })
        .then(r => r.json())
        .catch(e => ({ ok: false, error: e.message }))
      )
    );

    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      console.error('Telegram API errors:', JSON.stringify(failed));
      // Если хотя бы один успешен — считаем ок
      const anyOk = results.some(r => r.ok);
      if (!anyOk) {
        return res.status(500).json({ error: 'Telegram send failed', detail: failed[0]?.description });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Network error', detail: err.message });
  }
}
