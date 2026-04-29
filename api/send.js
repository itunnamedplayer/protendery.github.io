export default async function handler(req, res) {
  const setCors = () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  };

  setCors();

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { name, contact, mode, interest, tracking } = body;

  if (!name || !contact) {
    return res.status(400).json({ error: 'Имя и контакт обязательны' });
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.TG_TOKEN;

  const CHAT_IDS = [
    ...(process.env.TG_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
    process.env.TG_CHAT_ID,
    process.env.TG_CHAT_ID_1,
    process.env.TG_CHAT_ID_2,
  ].filter(Boolean);

  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.error('Missing TG_BOT_TOKEN/TG_TOKEN or TG_CHAT_ID/TG_CHAT_IDS env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const modeLabel = { phone: '📞 Телефон', tg: '✈️ Telegram', max: '💬 MAX' }[mode] || mode || 'не указан';
  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  const esc = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const tr = tracking || {};
  const utmLines = [
    tr.utm_source ? `utm_source: ${esc(tr.utm_source)}` : '',
    tr.utm_medium ? `utm_medium: ${esc(tr.utm_medium)}` : '',
    tr.utm_campaign ? `utm_campaign: ${esc(tr.utm_campaign)}` : '',
    tr.utm_content ? `utm_content: ${esc(tr.utm_content)}` : '',
    tr.utm_term ? `utm_term: ${esc(tr.utm_term)}` : '',
    tr.yclid ? `yclid: ${esc(tr.yclid)}` : '',
  ].filter(Boolean);

  const text = [
    '📋 <b>Новая заявка — ПроТендеры</b>',
    '',
    `👤 <b>Имя:</b> ${esc(name)}`,
    `${modeLabel}: ${esc(contact)}`,
    `❓ <b>Интерес:</b> ${esc(interest || 'не указан')}`,
    '',
    `🕐 <b>Время:</b> ${esc(now)} (МСК)`,
    `🌐 <b>Страница:</b> ${esc(tr.page || 'protendery.online')}`,
    tr.referrer ? `↩️ <b>Referrer:</b> ${esc(tr.referrer)}` : '',
    utmLines.length ? '\n<b>Реклама / метки:</b>\n' + utmLines.join('\n') : '',
  ].filter(Boolean).join('\n').slice(0, 3900);

  try {
    const results = await Promise.all(
      CHAT_IDS.map(chat_id =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        })
        .then(r => r.json())
        .catch(e => ({ ok: false, error: e.message }))
      )
    );

    const anyOk = results.some(r => r.ok);
    if (!anyOk) {
      console.error('Telegram API errors:', JSON.stringify(results));
      return res.status(500).json({ error: 'Telegram send failed', detail: results[0]?.description || results[0]?.error });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Network error', detail: err.message });
  }
}
