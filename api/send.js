// api/send.js — Vercel Serverless Function
// Токен и chat_id хранятся в переменных окружения Vercel (Dashboard → Settings → Environment Variables)
// Никогда не попадают в браузер

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — разрешаем только с вашего домена
  // При необходимости замените '*' на 'https://ваш-домен.vercel.app'
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { name, contact, interest } = req.body || {};

  if (!name || !contact) {
    return res.status(400).json({ error: 'Имя и контакт обязательны' });
  }

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_ID   = process.env.TG_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing TG_BOT_TOKEN or TG_CHAT_ID env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Экранирование спецсимволов Markdown v1
  const esc = (s) => String(s || '').replace(/[_*[\]()~`>#+=|{}.!-]/g, c => '\\' + c);

  // Текст сообщения в Telegram
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
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('Telegram API error:', tgData);
      return res.status(500).json({ error: 'Telegram send failed', detail: tgData.description });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error' });
  }
}
