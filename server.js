const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── БЕЗОПАСНОСТЬ ──
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── RATE LIMIT ──
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ── БАЗА ДАННЫХ ──
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
// GET /api/weather — прокси к Open-Meteo
// app.js делает fetch('/api/weather?lat=...&lon=...')
// ══════════════════════════════════════════
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Нужны lat и lon' });
    }

    const url = `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,`
      + `winddirection_10m,windgusts_10m,relativehumidity_2m,precipitation,`
      + `rain,showers,snowfall,uv_index,cloud_cover,pressure_msl,visibility`
      + `&hourly=temperature_2m,precipitation_probability,windspeed_10m,precipitation`
      + `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset`
      + `&timezone=auto&forecast_days=7`;

    const response = await fetch(url);
    const data     = await response.json();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Weather API failed' });
  }
});

// ── ИСТОРИЯ ──
app.get('/api/history', (req, res) => {
  const db = readDB();
  res.json(db.searches.slice(-10).reverse());
});

app.post('/api/history', (req, res) => {
  const { city, lat, lon } = req.body;
  if (!city) return res.status(400).json({ error: 'Нужно название города' });

  const db = readDB();
  db.searches = db.searches.filter(s => s.city !== city);
  db.searches.push({ city, lat, lon, date: new Date().toISOString() });
  if (db.searches.length > 20) db.searches = db.searches.slice(-20);
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/history', (req, res) => {
  writeDB({ searches: [] });
  res.json({ success: true });
});

// ── ФРОНТЕНД ──
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── ЗАПУСК ──
app.listen(PORT, () => {
  console.log(`✅ Сервер: http://localhost:${PORT}`);
});