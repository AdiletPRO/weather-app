const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
// ══════════════════════════════════════════
// 1. БЕЗОПАСНОСТЬ — helmet
// Автоматически защищает от XSS и других атак
// ══════════════════════════════════════════
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ══════════════════════════════════════════
// 2. RATE LIMITING — защита от спама
// Максимум 100 запросов за 15 минут
// ══════════════════════════════════════════
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов. Подожди 15 минут.' }
});
app.use('/api/', limiter);

// ══════════════════════════════════════════
// 3. MIDDLEWARE
// ══════════════════════════════════════════
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════
// 4. БАЗА ДАННЫХ — JSON файл
// Хранит историю поиска городов
// ══════════════════════════════════════════
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ searches: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ══════════════════════════════════════════
// 5. API МАРШРУТЫ
// ══════════════════════════════════════════

// GET /api/history — получить историю поиска
app.get('/api/history', (req, res) => {
  const db = readDB();
  // Возвращаем последние 10 городов
  res.json(db.searches.slice(-10).reverse());
});

// POST /api/history — сохранить город в историю
app.post('/api/history', (req, res) => {
  const { city, lat, lon } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'Нужно название города' });
  }

  const db = readDB();

  // Убираем дубликат если такой город уже есть
  db.searches = db.searches.filter(s => s.city !== city);

  // Добавляем новый поиск
  db.searches.push({
    city,
    lat,
    lon,
    date: new Date().toISOString()
  });

  // Храним максимум 20 городов
  if (db.searches.length > 20) {
    db.searches = db.searches.slice(-20);
  }

  writeDB(db);
  res.json({ success: true });
});

// DELETE /api/history — очистить историю
app.delete('/api/history', (req, res) => {
  writeDB({ searches: [] });
  res.json({ success: true });
});

// ══════════════════════════════════════════
// 6. ОТДАЁМ ФРОНТЕНД
// ══════════════════════════════════════════
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ══════════════════════════════════════════
// 7. ЗАПУСК
// ══════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`📁 База данных: db.json`);
  console.log(`🔒 Безопасность: helmet + rate limit`);
});
