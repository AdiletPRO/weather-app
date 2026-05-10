// ─────────────────────────────────────────
// WeatherApp app.js
// Чистая версия: погода, карта, график, история, Canvas-анимация
// Ожидает серверный маршрут /api/weather
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// 1. ЭЛЕМЕНТЫ СТРАНИЦЫ
// ─────────────────────────────────────────
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const main = document.querySelector('.main');

// ─────────────────────────────────────────
// 2. ИКОНКИ И ОПИСАНИЯ ПОГОДЫ
// ─────────────────────────────────────────
function getIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 75) return '❄️';
  if (code <= 82) return '🌨️';
  return '⛈️';
}

function getDesc(code) {
  if (code === 0) return 'Ясно';
  if (code <= 2) return 'Переменная облачность';
  if (code === 3) return 'Пасмурно';
  if (code <= 48) return 'Туман';
  if (code <= 55) return 'Морось';
  if (code <= 65) return 'Дождь';
  if (code <= 75) return 'Снег';
  if (code <= 82) return 'Ливень';
  return 'Гроза';
}

function getBg(code) {
  const h = new Date().getHours();
  const night = h < 6 || h >= 20;

  if (night) return 'linear-gradient(135deg,#0f0c29,#1a1a2e,#16213e)';
  if (code === 0) return 'linear-gradient(135deg,#1a6b9a,#2196f3,#87ceeb)';
  if (code <= 3) return 'linear-gradient(135deg,#3d5a6b,#607d8b,#90a4ae)';
  if (code <= 65) return 'linear-gradient(135deg,#2c3e50,#3d5a6b,#607d8b)';
  return 'linear-gradient(135deg,#1a237e,#283593,#3949ab)';
}

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDate(iso) {
  const d = new Date(iso);
  return DAYS[d.getDay()];
}

function degToCompass(deg) {
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  return dirs[Math.round(deg / 45) % 8];
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ─────────────────────────────────────────
// 3. КАРТА И ГРАФИК
// ─────────────────────────────────────────
let mapInstance = null;
let chartInstance = null;

function renderMap(lat, lon, cityName) {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  mapInstance = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([lat, lon], 10);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance);

  L.marker([lat, lon])
    .addTo(mapInstance)
    .bindPopup(escapeHtml(cityName))
    .openPopup();

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 50);
}

function renderChart(hourly) {
  const canvas = document.getElementById('tempChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const labels = (hourly.time || []).slice(0, 24).map(t => t.slice(11, 16));
  const temps = (hourly.temperature_2m || []).slice(0, 24);
  const rain = (hourly.precipitation_probability || []).slice(0, 24);

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Температура °C',
          data: temps,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2
        },
        {
          label: 'Вероятность осадков %',
          data: rain,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function renderExtraInfo(cur) {
  const extraInfo = document.getElementById('extraInfo');
  if (!extraInfo) return;

  const windDir = cur.winddirection_10m ?? cur.wind_direction_10m ?? 0;
  const windGusts = cur.windgusts_10m ?? cur.wind_gusts_10m ?? '—';
  const pressure = cur.pressure_msl ?? cur.surface_pressure ?? '—';
  const visibility = cur.visibility ?? '—';
  const rain = cur.rain ?? 0;
  const showers = cur.showers ?? 0;
  const snowfall = cur.snowfall ?? 0;
  const cloudCover = cur.cloud_cover ?? '—';

  extraInfo.innerHTML = `
    <h3>Дополнительно</h3>
    <div class="stats">
      <div class="stat-card"><div class="stat-val">${Math.round(cur.apparent_temperature)}°C</div><div class="stat-name">Ощущается</div></div>
      <div class="stat-card"><div class="stat-val">${cur.relativehumidity_2m}%</div><div class="stat-name">Влажность</div></div>
      <div class="stat-card"><div class="stat-val">${Math.round(cur.windspeed_10m)} км/ч</div><div class="stat-name">Ветер</div></div>
      <div class="stat-card"><div class="stat-val">${Math.round(windDir)}° ${degToCompass(windDir)}</div><div class="stat-name">Направление</div></div>
      <div class="stat-card"><div class="stat-val">${Math.round(windGusts)} км/ч</div><div class="stat-name">Порывы</div></div>
      <div class="stat-card"><div class="stat-val">${Math.round(pressure)} гПа</div><div class="stat-name">Давление</div></div>
      <div class="stat-card"><div class="stat-val">${cur.precipitation ?? 0} мм</div><div class="stat-name">Осадки</div></div>
      <div class="stat-card"><div class="stat-val">${rain} мм</div><div class="stat-name">Дождь</div></div>
      <div class="stat-card"><div class="stat-val">${showers} мм</div><div class="stat-name">Ливни</div></div>
      <div class="stat-card"><div class="stat-val">${snowfall} см</div><div class="stat-name">Снег</div></div>
      <div class="stat-card"><div class="stat-val">${cloudCover}%</div><div class="stat-name">Облачность</div></div>
      <div class="stat-card"><div class="stat-val">${visibility} м</div><div class="stat-name">Видимость</div></div>
    </div>
  `;
}

// ─────────────────────────────────────────
// 4. CANVAS АНИМАЦИЯ ФОНА
// ─────────────────────────────────────────
const canvas = (() => {
  let el = document.getElementById('weather-bg');
  if (!el) {
    el = document.createElement('canvas');
    el.id = 'weather-bg';
    document.body.prepend(el);
  }
  return el;
})();

const ctx = canvas.getContext('2d');
let W = 0;
let H = 0;
let weatherType = 'clear';
let particles = [];
let stars = [];
let lastWeatherCode = null;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  generateParticles();
}

function isNight() {
  const h = new Date().getHours();
  return h < 6 || h >= 20;
}

function setWeatherEffect(code) {
  lastWeatherCode = code;

  if (code === 0) weatherType = 'clear';
  else if (code >= 1 && code <= 3) weatherType = 'clouds';
  else if (code >= 45 && code <= 48) weatherType = 'fog';
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) weatherType = 'rain';
  else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) weatherType = 'snow';
  else if (code >= 95) weatherType = 'storm';
  else weatherType = 'clouds';

  generateParticles();
}

function generateParticles() {
  particles = [];
  stars = [];

  const mobile = window.innerWidth < 768;

  if (weatherType === 'rain') {
    const count = reducedMotion ? (mobile ? 30 : 45) : (mobile ? 60 : 110);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        l: 10 + Math.random() * 25,
        s: 8 + Math.random() * 12
      });
    }
  }

  if (weatherType === 'snow') {
    const count = reducedMotion ? (mobile ? 20 : 30) : (mobile ? 45 : 80);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 4,
        s: 0.4 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 0.8
      });
    }
  }

  if (weatherType === 'clouds') {
    const count = mobile ? 4 : 7;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.45,
        r: 70 + Math.random() * 130,
        s: 0.08 + Math.random() * 0.25
      });
    }
  }

  if (weatherType === 'fog') {
    const count = mobile ? 3 : 5;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.85,
        r: 180 + Math.random() * 320,
        s: 0.18 + Math.random() * 0.25
      });
    }
  }

  if (weatherType === 'clear' && isNight()) {
    const count = mobile ? 24 : 50;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.55,
        r: 0.8 + Math.random() * 1.6,
        a: 0.2 + Math.random() * 0.8,
        s: 0.005 + Math.random() * 0.02
      });
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);

  if (weatherType === 'clear') {
    const g = ctx.createRadialGradient(W * 0.82, H * 0.18, 40, W * 0.82, H * 0.18, 340);
    g.addColorStop(0, 'rgba(255,220,120,0.35)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (isNight()) {
      stars.forEach(star => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${star.a})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        star.a += star.s * (Math.random() > 0.5 ? 1 : -1);
        if (star.a < 0.1) star.a = 0.1;
        if (star.a > 1) star.a = 1;
      });
    }
  }

  if (weatherType === 'rain') {
    ctx.strokeStyle = 'rgba(180,220,255,0.55)';
    ctx.lineWidth = 1.2;

    particles.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 2, p.y + p.l);
      ctx.stroke();

      p.y += p.s;
      p.x += 0.2;

      if (p.y > H) {
        p.y = -20;
        p.x = Math.random() * W;
      }
    });
  }

  if (weatherType === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.y += p.s;
      p.x += Math.sin(p.y * 0.01) + (p.drift || 0);

      if (p.y > H) {
        p.y = -10;
        p.x = Math.random() * W;
      }
    });
  }

  if (weatherType === 'clouds') {
    particles.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(255,255,255,0.09)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.s;
      if (p.x - p.r > W) p.x = -p.r;
    });
  }

  if (weatherType === 'fog') {
    particles.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 20, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(255,255,255,0.08)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.s;
      if (p.x - p.r > W) p.x = -p.r;
    });
  }

  if (weatherType === 'storm') {
    if (Math.random() < 0.012) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  requestAnimationFrame(animate);
}

resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 0);
  }
  if (lastWeatherCode !== null) {
    setWeatherEffect(lastWeatherCode);
  }
});

animate();

// ─────────────────────────────────────────
// 5. ПРОГНОЗ И РЕНДЕР ПОГОДЫ
// ─────────────────────────────────────────
async function getWeather(lat, lon, cityName) {
  main.innerHTML = '<p class="msg">⏳ Загрузка...</p>';

  try {
    const url = `/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'weather request failed');
    }

    const cur = data.current;
    const daily = data.daily;

    setWeatherEffect(cur.weathercode);
    document.body.style.background = getBg(cur.weathercode);

    const temp = Math.round(cur.temperature_2m);
    const feels = Math.round(cur.apparent_temperature);
    const wind = Math.round(cur.windspeed_10m ?? 0);
    const humid = cur.relativehumidity_2m ?? '—';
    const precip = cur.precipitation ?? 0;
    const uv = cur.uv_index ?? '—';
    const icon = getIcon(cur.weathercode);
    const desc = getDesc(cur.weathercode);

    const windDir = cur.winddirection_10m ?? cur.wind_direction_10m ?? 0;
    const windGusts = cur.windgusts_10m ?? cur.wind_gusts_10m ?? '—';
    const pressure = cur.pressure_msl ?? cur.surface_pressure ?? '—';
    const visibility = cur.visibility ?? '—';

    const sunrise = daily?.sunrise?.[0]
      ? new Date(daily.sunrise[0]).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
      : '—';

    const sunset = daily?.sunset?.[0]
      ? new Date(daily.sunset[0]).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
      : '—';

    let forecastHTML = '';

    for (let i = 0; i < 7; i++) {
      const dayMax = Math.round(daily.temperature_2m_max[i]);
      const dayMin = Math.round(daily.temperature_2m_min[i]);
      const barLeft = Math.max(0, Math.min(100, ((dayMin - Math.min(...daily.temperature_2m_min)) / (Math.max(...daily.temperature_2m_max) - Math.min(...daily.temperature_2m_min) || 1)) * 100));
      const barWidth = Math.max(5, Math.min(100, ((dayMax - dayMin) / (Math.max(...daily.temperature_2m_max) - Math.min(...daily.temperature_2m_min) || 1)) * 100));

      forecastHTML += `
        <div class="forecast-row">
          <div class="forecast-day">${i === 0 ? 'Сег.' : formatDate(daily.time[i])}</div>
          <div class="forecast-icon">${getIcon(daily.weathercode[i])}</div>
          <div class="forecast-desc">${getDesc(daily.weathercode[i])}</div>
          <div class="forecast-min">${dayMin}°</div>
          <div class="forecast-bar">
            <div class="forecast-fill" style="margin-left:${barLeft}%; width:${barWidth}%"></div>
          </div>
          <div class="forecast-max">${dayMax}°</div>
        </div>
      `;
    }

    main.innerHTML = `
      <div class="weather-card">
        <div class="weather-left">
          <div class="city">📍 ${escapeHtml(cityName)}</div>
          <div class="temp">${temp}°C</div>
          <div class="desc">${icon} ${desc}</div>
          <div class="feels">Ощущается как ${feels}°C</div>
        </div>
        <div class="weather-right">${icon}</div>
      </div>

      <div class="weather-card">
        <div class="stats">
          <div class="stat-card">
            <div class="stat-icon">💧</div>
            <div class="stat-val">${humid}%</div>
            <div class="stat-name">Влажность</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💨</div>
            <div class="stat-val">${wind} км/ч</div>
            <div class="stat-name">Ветер</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌬️</div>
            <div class="stat-val">${Math.round(windDir)}°</div>
            <div class="stat-name">Направление</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-val">${Math.round(windGusts)} км/ч</div>
            <div class="stat-name">Порывы</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🧭</div>
            <div class="stat-val">${pressure}</div>
            <div class="stat-name">Давление</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌧️</div>
            <div class="stat-val">${precip} мм</div>
            <div class="stat-name">Осадки</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">☀️</div>
            <div class="stat-val">${uv}</div>
            <div class="stat-name">UV индекс</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👁️</div>
            <div class="stat-val">${visibility}</div>
            <div class="stat-name">Видимость</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌅</div>
            <div class="stat-val">${sunrise}</div>
            <div class="stat-name">Восход</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌇</div>
            <div class="stat-val">${sunset}</div>
            <div class="stat-name">Закат</div>
          </div>
        </div>
      </div>

      <div class="weather-card info-card" id="extraInfo"></div>

      <div class="weather-card map-card">
        <h3>Карта</h3>
        <div id="map"></div>
      </div>

      <div class="weather-card chart-card">
        <h3>Температура на 24 часа</h3>
        <canvas id="tempChart"></canvas>
      </div>

      <div class="forecast">
        <h3>📅 Прогноз на 7 дней</h3>
        ${forecastHTML}
      </div>
    `;

    renderExtraInfo(cur);
    renderMap(lat, lon, cityName);
    renderChart(data.hourly);

    await saveToHistory(cityName, lat, lon);
    loadHistory();
  } catch (err) {
    console.error(err);
    main.innerHTML = '<p class="msg">❌ Ошибка загрузки. Проверь интернет.</p>';
  }
}

// ─────────────────────────────────────────
// 6. ПОИСК ГОРОДА
// ─────────────────────────────────────────
async function searchCity() {
  const city = cityInput.value.trim();
  if (!city) return;

  main.innerHTML = '<p class="msg">🔍 Ищем город...</p>';

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      main.innerHTML = '<p class="msg">❌ Город не найден. Попробуй другое название.</p>';
      return;
    }

    const place = data.results[0];
    const name = place.name + (place.admin1 ? `, ${place.admin1}` : '');

    await getWeather(place.latitude, place.longitude, name);
  } catch (err) {
    console.error(err);
    main.innerHTML = '<p class="msg">❌ Ошибка поиска города.</p>';
  }
}

// ─────────────────────────────────────────
// 7. ГЕОЛОКАЦИЯ
// ─────────────────────────────────────────
function geoLocate() {
  if (!navigator.geolocation) {
    main.innerHTML = '<p class="msg">❌ Геолокация не поддерживается.</p>';
    return;
  }

  main.innerHTML = '<p class="msg">📍 Определяем местоположение...</p>';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await getWeather(pos.coords.latitude, pos.coords.longitude, 'Моё местоположение');
    },
    () => {
      main.innerHTML = '<p class="msg">❌ Нет доступа к геолокации.</p>';
    }
  );
}

// ─────────────────────────────────────────
// 8. ИСТОРИЯ
// ─────────────────────────────────────────
async function saveToHistory(city, lat, lon) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, lat, lon })
    });
  } catch {}
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();

    const old = document.getElementById('history');
    if (old) old.remove();
    if (!data.length) return;

    const div = document.createElement('div');
    div.id = 'history';
    div.style.cssText = 'padding:0 20px 20px; max-width:900px; margin:0 auto';
    div.innerHTML = `
      <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:13px;opacity:0.6;letter-spacing:0.5px;text-transform:uppercase">🕐 История поиска</h3>
          <button onclick="clearHistory()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:20px;padding:4px 12px;font-size:12px;cursor:pointer">Очистить</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${data.map(s => `
            <button onclick="getWeather(${s.lat}, ${s.lon}, ${JSON.stringify(s.city)})"
              style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:20px;padding:6px 14px;font-size:13px;cursor:pointer">
              📍 ${escapeHtml(s.city)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.querySelector('.main').after(div);
  } catch {}
}

async function clearHistory() {
  try {
    await fetch('/api/history', { method: 'DELETE' });
    loadHistory();
  } catch {}
}

// ─────────────────────────────────────────
// 9. СОБЫТИЯ
// ─────────────────────────────────────────
searchBtn.addEventListener('click', searchCity);
geoBtn.addEventListener('click', geoLocate);
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchCity();
});

// ─────────────────────────────────────────
// 10. СТАРТ
// ─────────────────────────────────────────
loadHistory();
getWeather(51.18, 71.45, 'Астана');