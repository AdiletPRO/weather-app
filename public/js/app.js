// ─────────────────────────────────────────
// 1. ЭЛЕМЕНТЫ СТРАНИЦЫ
// ─────────────────────────────────────────
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn    = document.getElementById('geoBtn');
const main      = document.querySelector('.main');

// ─────────────────────────────────────────
// 2. ИКОНКИ И ОПИСАНИЯ ПОГОДЫ
// ─────────────────────────────────────────
function getIcon(code) {
  if (code === 0)  return '☀️';
  if (code <= 2)   return '⛅';
  if (code === 3)  return '☁️';
  if (code <= 48)  return '🌫️';
  if (code <= 55)  return '🌦️';
  if (code <= 65)  return '🌧️';
  if (code <= 75)  return '❄️';
  if (code <= 82)  return '🌨️';
  return '⛈️';
}

function getDesc(code) {
  if (code === 0)  return 'Ясно';
  if (code <= 2)   return 'Переменная облачность';
  if (code === 3)  return 'Пасмурно';
  if (code <= 48)  return 'Туман';
  if (code <= 55)  return 'Морось';
  if (code <= 65)  return 'Дождь';
  if (code <= 75)  return 'Снег';
  if (code <= 82)  return 'Ливень';
  return 'Гроза';
}

// ─────────────────────────────────────────
// 3. ФОНОВЫЙ ГРАДИЕНТ ПО ПОГОДЕ
// ─────────────────────────────────────────
function getBg(code) {
  const h = new Date().getHours();
  const night = h < 6 || h >= 20;
  if (night)      return 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)';
  if (code === 0) return 'linear-gradient(135deg, #1a6b9a, #2196f3, #87ceeb)';
  if (code <= 3)  return 'linear-gradient(135deg, #3d5a6b, #607d8b, #90a4ae)';
  if (code <= 65) return 'linear-gradient(135deg, #2c3e50, #3d5a6b, #607d8b)';
  return 'linear-gradient(135deg, #1a237e, #283593, #3949ab)';
}

// ─────────────────────────────────────────
// 4. ДНИ НЕДЕЛИ И МЕСЯЦЫ
// ─────────────────────────────────────────
const DAYS   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function formatDate(iso) {
  const d = new Date(iso);
  return DAYS[d.getDay()];
}

// ─────────────────────────────────────────
// 5. ГЛАВНАЯ ФУНКЦИЯ — ПОЛУЧИТЬ ПОГОДУ
// ─────────────────────────────────────────
async function getWeather(lat, lon, cityName) {
  // Показываем загрузку
  main.innerHTML = '<p class="msg">⏳ Загрузка...</p>';

  try {
    const url = `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m,precipitation,uv_index`
      + `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset`
      + `&timezone=auto&forecast_days=7`;

    const res  = await fetch(url);
    const data = await res.json();

    const cur   = data.current;
    const daily = data.daily;

    // Меняем фон страницы
    document.body.style.background = getBg(cur.weathercode);
    saveToHistory(cityName, lat, lon);

    // Текущие данные
    const temp   = Math.round(cur.temperature_2m);
    const feels  = Math.round(cur.apparent_temperature);
    const wind   = Math.round(cur.windspeed_10m);
    const humid  = cur.relativehumidity_2m;
    const precip = cur.precipitation;
    const uv     = cur.uv_index ?? '—';
    const icon   = getIcon(cur.weathercode);
    const desc   = getDesc(cur.weathercode);

    // Восход и закат
    const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    const sunset  = new Date(daily.sunset[0]).toLocaleTimeString('ru',  { hour: '2-digit', minute: '2-digit' });

    // Макс и мин за все 7 дней (для шкалы температур)
    const allMax = Math.max(...daily.temperature_2m_max);
    const allMin = Math.min(...daily.temperature_2m_min);
    const range  = allMax - allMin || 1;

    // Строим прогноз на 7 дней
    let forecastHTML = '';
    for (let i = 0; i < 7; i++) {
      const dayMax  = Math.round(daily.temperature_2m_max[i]);
      const dayMin  = Math.round(daily.temperature_2m_min[i]);
      const barLeft  = ((dayMin - allMin) / range * 100).toFixed(0);
      const barWidth = ((dayMax - dayMin) / range * 100).toFixed(0);

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

    // Вставляем всё в страницу
    main.innerHTML = `

      <!-- ТЕКУЩАЯ ПОГОДА -->
      <div class="weather-card">
        <div class="weather-left">
          <div class="city">📍 ${cityName}</div>
          <div class="temp">${temp}°C</div>
          <div class="desc">${icon} ${desc}</div>
          <div class="feels">Ощущается как ${feels}°C</div>
        </div>
        <div class="weather-right">${icon}</div>
      </div>

      <!-- МЕТРИКИ -->
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

      <!-- ПРОГНОЗ 7 ДНЕЙ -->
      <div class="forecast">
        <h3>📅 Прогноз на 7 дней</h3>
        ${forecastHTML}
      </div>

    `;

  } catch (err) {
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
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      main.innerHTML = '<p class="msg">❌ Город не найден. Попробуй другое название.</p>';
      return;
    }

    const place = data.results[0];
    const name  = place.name + (place.admin1 ? ', ' + place.admin1 : '');

    await getWeather(place.latitude, place.longitude, name);

  } catch {
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
// 8. СОБЫТИЯ
// ─────────────────────────────────────────
searchBtn.addEventListener('click', searchCity);
geoBtn.addEventListener('click', geoLocate);
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchCity();
});

// При загрузке — сразу показываем Астану
getWeather(51.18, 71.45, 'Астана');
// ─────────────────────────────────────────
// 9. ИСТОРИЯ ПОИСКА
// ─────────────────────────────────────────
async function saveToHistory(city, lat, lon) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, lat, lon })
    });
    loadHistory();
  } catch {}
}

async function loadHistory() {
  try {
    const res  = await fetch('/api/history');
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
            <button onclick="getWeather(${s.lat}, ${s.lon}, '${s.city}')"
              style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:20px;padding:6px 14px;font-size:13px;cursor:pointer">
              📍 ${s.city}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.querySelector('.main').after(div);
  } catch {}
}

async function clearHistory() {
  await fetch('/api/history', { method: 'DELETE' });
  loadHistory();
}