// ─────────────────────────────────────────
// 1. ЭЛЕМЕНТЫ
// ─────────────────────────────────────────
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const main = document.querySelector('.main');

// ─────────────────────────────────────────
// 2. ИКОНКИ И ОПИСАНИЯ
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

// ─────────────────────────────────────────
// 3. ФОН
// ─────────────────────────────────────────
function getBg(code) {
  const h = new Date().getHours();
  const night = h < 6 || h >= 20;

  if (night)
    return 'linear-gradient(135deg,#0f0c29,#1a1a2e,#16213e)';

  if (code === 0)
    return 'linear-gradient(135deg,#1a6b9a,#2196f3,#87ceeb)';

  if (code <= 3)
    return 'linear-gradient(135deg,#3d5a6b,#607d8b,#90a4ae)';

  if (code <= 65)
    return 'linear-gradient(135deg,#2c3e50,#3d5a6b,#607d8b)';

  return 'linear-gradient(135deg,#1a237e,#283593,#3949ab)';
}

// ─────────────────────────────────────────
// 4. ДАТЫ
// ─────────────────────────────────────────
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDate(iso) {
  const d = new Date(iso);
  return DAYS[d.getDay()];
}

// ─────────────────────────────────────────
// 5. КАРТА И ГРАФИК
// ─────────────────────────────────────────
let mapInstance = null;
let chartInstance = null;

function renderMap(lat, lon, cityName) {
  const mapEl = document.getElementById('map');

  if (!mapEl) return;

  if (mapInstance) {
    mapInstance.remove();
  }

  mapInstance = L.map('map').setView([lat, lon], 10);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance);

  L.marker([lat, lon])
    .addTo(mapInstance)
    .bindPopup(cityName)
    .openPopup();
}

function renderChart(hourly) {
  const canvas = document.getElementById('tempChart');

  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = hourly.time
    .slice(0, 24)
    .map(t => t.slice(11, 16));

  const temps = hourly.temperature_2m.slice(0, 24);

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Температура °C',
          data: temps,
          tension: 0.35,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

// ─────────────────────────────────────────
// 6. CANVAS АНИМАЦИЯ
// ─────────────────────────────────────────
const canvas = document.getElementById('weather-bg');
const ctx = canvas.getContext('2d');

let W;
let H;
let particles = [];
let weatherType = 'clear';

function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);

function setWeatherEffect(code) {

  if (code === 0) {
    weatherType = 'clear';
  }

  else if (code >= 1 && code <= 3) {
    weatherType = 'clouds';
  }

  else if (code >= 45 && code <= 48) {
    weatherType = 'fog';
  }

  else if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    weatherType = 'rain';
  }

  else if (
    (code >= 71 && code <= 77) ||
    (code >= 85 && code <= 86)
  ) {
    weatherType = 'snow';
  }

  else if (code >= 95) {
    weatherType = 'storm';
  }

  else {
    weatherType = 'clouds';
  }

  generateParticles();
}

function generateParticles() {

  particles = [];

  if (weatherType === 'rain') {

    for (let i = 0; i < 160; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        l: 10 + Math.random() * 25,
        s: 8 + Math.random() * 10
      });
    }
  }

  if (weatherType === 'snow') {

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 4,
        s: 0.5 + Math.random() * 2
      });
    }
  }

  if (weatherType === 'clouds') {

    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        r: 80 + Math.random() * 120,
        s: 0.1 + Math.random() * 0.3
      });
    }
  }

  if (weatherType === 'fog') {

    for (let i = 0; i < 12; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 200 + Math.random() * 300,
        s: 0.2 + Math.random() * 0.4
      });
    }
  }
}

function animate() {

  ctx.clearRect(0, 0, W, H);

  if (weatherType === 'clear') {

    const g = ctx.createRadialGradient(
      W * 0.8,
      H * 0.2,
      50,
      W * 0.8,
      H * 0.2,
      300
    );

    g.addColorStop(0, 'rgba(255,220,120,0.35)');
    g.addColorStop(1, 'rgba(255,220,120,0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  if (weatherType === 'rain') {

    ctx.strokeStyle = 'rgba(180,220,255,0.5)';
    ctx.lineWidth = 1.2;

    particles.forEach(p => {

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 2, p.y + p.l);
      ctx.stroke();

      p.y += p.s;

      if (p.y > H) {
        p.y = -20;
        p.x = Math.random() * W;
      }
    });
  }

  if (weatherType === 'snow') {

    ctx.fillStyle = 'rgba(255,255,255,0.8)';

    particles.forEach(p => {

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.y += p.s;
      p.x += Math.sin(p.y * 0.01);

      if (p.y > H) {
        p.y = -10;
        p.x = Math.random() * W;
      }
    });
  }

  if (weatherType === 'clouds') {

    particles.forEach(p => {

      const g = ctx.createRadialGradient(
        p.x,
        p.y,
        10,
        p.x,
        p.y,
        p.r
      );

      g.addColorStop(0, 'rgba(255,255,255,0.08)');
      g.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.s;

      if (p.x - p.r > W) {
        p.x = -p.r;
      }
    });
  }

  if (weatherType === 'fog') {

    particles.forEach(p => {

      const g = ctx.createRadialGradient(
        p.x,
        p.y,
        20,
        p.x,
        p.y,
        p.r
      );

      g.addColorStop(0, 'rgba(255,255,255,0.06)');
      g.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.s;

      if (p.x - p.r > W) {
        p.x = -p.r;
      }
    });
  }

  if (weatherType === 'storm') {

    if (Math.random() < 0.01) {

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  requestAnimationFrame(animate);
}

animate();

// ─────────────────────────────────────────
// 7. ПОЛУЧЕНИЕ ПОГОДЫ
// ─────────────────────────────────────────
async function getWeather(lat, lon, cityName) {

  main.innerHTML = '<p class="msg">⏳ Загрузка...</p>';

  try {

    const url =
      `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${lat}`
      + `&longitude=${lon}`
      + `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m,precipitation,uv_index`
      + `&hourly=temperature_2m`
      + `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset`
      + `&timezone=auto`
      + `&forecast_days=7`;

    const res = await fetch(url);
    const data = await res.json();

    const cur = data.current;
    const daily = data.daily;

    document.body.style.background = getBg(cur.weathercode);

    setWeatherEffect(cur.weathercode);

    const temp = Math.round(cur.temperature_2m);
    const feels = Math.round(cur.apparent_temperature);
    const wind = Math.round(cur.windspeed_10m);
    const humid = cur.relativehumidity_2m;
    const precip = cur.precipitation;
    const uv = cur.uv_index ?? '—';

    const icon = getIcon(cur.weathercode);
    const desc = getDesc(cur.weathercode);

    const sunrise = new Date(
      daily.sunrise[0]
    ).toLocaleTimeString('ru', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const sunset = new Date(
      daily.sunset[0]
    ).toLocaleTimeString('ru', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let forecastHTML = '';

    for (let i = 0; i < 7; i++) {

      const dayMax = Math.round(
        daily.temperature_2m_max[i]
      );

      const dayMin = Math.round(
        daily.temperature_2m_min[i]
      );

      forecastHTML += `
        <div class="forecast-row">
          <div class="forecast-day">
            ${i === 0 ? 'Сег.' : formatDate(daily.time[i])}
          </div>

          <div class="forecast-icon">
            ${getIcon(daily.weathercode[i])}
          </div>

          <div class="forecast-desc">
            ${getDesc(daily.weathercode[i])}
          </div>

          <div class="forecast-min">
            ${dayMin}°
          </div>

          <div class="forecast-max">
            ${dayMax}°
          </div>
        </div>
      `;
    }

    main.innerHTML = `
      <div class="weather-card">
        <div class="weather-left">
          <div class="city">📍 ${cityName}</div>
          <div class="temp">${temp}°C</div>
          <div class="desc">${icon} ${desc}</div>
          <div class="feels">
            Ощущается как ${feels}°C
          </div>
        </div>

        <div class="weather-right">
          ${icon}
        </div>
      </div>

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

    renderMap(lat, lon, cityName);
    renderChart(data.hourly);

    saveToHistory(cityName, lat, lon);

  } catch (err) {

    console.error(err);

    main.innerHTML =
      '<p class="msg">❌ Ошибка загрузки</p>';
  }
}

// ─────────────────────────────────────────
// 8. ПОИСК ГОРОДА
// ─────────────────────────────────────────
async function searchCity() {

  const city = cityInput.value.trim();

  if (!city) return;

  main.innerHTML = '<p class="msg">🔍 Поиск...</p>';

  try {

    const url =
      `https://geocoding-api.open-meteo.com/v1/search`
      + `?name=${encodeURIComponent(city)}`
      + `&count=1`
      + `&language=ru`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results?.length) {

      main.innerHTML =
        '<p class="msg">❌ Город не найден</p>';

      return;
    }

    const place = data.results[0];

    const name =
      place.name +
      (place.admin1 ? `, ${place.admin1}` : '');

    await getWeather(
      place.latitude,
      place.longitude,
      name
    );

  } catch {

    main.innerHTML =
      '<p class="msg">❌ Ошибка поиска</p>';
  }
}

// ─────────────────────────────────────────
// 9. ГЕОЛОКАЦИЯ
// ─────────────────────────────────────────
function geoLocate() {

  if (!navigator.geolocation) {

    main.innerHTML =
      '<p class="msg">❌ Геолокация недоступна</p>';

    return;
  }

  navigator.geolocation.getCurrentPosition(

    async pos => {

      await getWeather(
        pos.coords.latitude,
        pos.coords.longitude,
        'Моё местоположение'
      );
    },

    () => {

      main.innerHTML =
        '<p class="msg">❌ Нет доступа к геолокации</p>';
    }
  );
}

// ─────────────────────────────────────────
// 10. СОБЫТИЯ
// ─────────────────────────────────────────
searchBtn.addEventListener('click', searchCity);

geoBtn.addEventListener('click', geoLocate);

cityInput.addEventListener('keydown', e => {

  if (e.key === 'Enter') {
    searchCity();
  }
});

// ─────────────────────────────────────────
// 11. ИСТОРИЯ
// ─────────────────────────────────────────
async function saveToHistory(city, lat, lon) {

  try {

    await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        city,
        lat,
        lon
      })
    });

  } catch {}
}

// ─────────────────────────────────────────
// 12. СТАРТ
// ─────────────────────────────────────────
getWeather(51.18, 71.45, 'Астана');