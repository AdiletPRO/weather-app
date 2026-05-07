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
// ФОНОВАЯ АНИМАЦИЯ ПОГОДЫ
// ─────────────────────────────────────────
let currentScene = '';

const weatherCanvas = (() => {
  let el = document.getElementById('weather-canvas');
  if (!el) {
    el = document.createElement('div');
    el.id = 'weather-canvas';
    document.body.prepend(el);
  }
  return el;
})();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function sceneFromCode(code) {
  const hour = new Date().getHours();
  const night = hour < 6 || hour >= 20;

  if (night) return 'night';
  if (code === 0) return 'sun';
  if (code <= 3) return 'cloud';
  if (code <= 48) return 'fog';
  if (code <= 65 || code <= 82) return 'rain';
  if (code <= 75 || code <= 86) return 'snow';
  return 'thunder';
}

function clearScene() {
  weatherCanvas.innerHTML = '';
  weatherCanvas.dataset.scene = '';
}

function createEl(className, styles = {}, text = '') {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  Object.assign(el.style, styles);
  return el;
}

function setWeatherScene(code) {
  const scene = sceneFromCode(code);

  if (scene === currentScene && weatherCanvas.children.length) return;
  currentScene = scene;

  clearScene();
  weatherCanvas.dataset.scene = scene;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const mobile = w < 768;

  if (scene === 'sun') {
    weatherCanvas.appendChild(createEl('scene-sun'));
    const rays = reducedMotion ? 10 : (mobile ? 12 : 18);
    for (let i = 0; i < rays; i++) {
      weatherCanvas.appendChild(createEl('sun-ray', {
        transform: `rotate(${i * (360 / rays)}deg)`,
        animationDuration: `${8 + Math.random() * 8}s`,
        opacity: String(0.08 + Math.random() * 0.08)
      }));
    }
  }

  if (scene === 'cloud' || scene === 'rain' || scene === 'snow' || scene === 'thunder') {
    const clouds = mobile ? 3 : 5;
    for (let i = 0; i < clouds; i++) {
      weatherCanvas.appendChild(createEl('cloud', {
        top: `${10 + Math.random() * 35}%`,
        left: `${-30 + Math.random() * 40}%`,
        fontSize: `${48 + Math.random() * 40}px`,
        animationDuration: `${26 + Math.random() * 18}s`,
        animationDelay: `${-Math.random() * 20}s`,
        opacity: String(scene === 'thunder' ? 0.18 : 0.1)
      }, '☁️'));
    }
  }

  if (scene === 'rain' || scene === 'thunder') {
    const drops = reducedMotion ? (mobile ? 28 : 40) : (mobile ? 55 : 95);
    for (let i = 0; i < drops; i++) {
      weatherCanvas.appendChild(createEl('rain-drop', {
        left: `${Math.random() * 100}%`,
        top: `${-20 - Math.random() * 100}px`,
        height: `${12 + Math.random() * 20}px`,
        animationDuration: `${0.65 + Math.random() * 0.9}s`,
        animationDelay: `${-Math.random() * 2}s`,
        opacity: String(0.4 + Math.random() * 0.5)
      }));
    }
  }

  if (scene === 'snow') {
    const flakes = reducedMotion ? (mobile ? 20 : 30) : (mobile ? 40 : 70);
    const symbols = ['❄️', '✦', '•'];
    for (let i = 0; i < flakes; i++) {
      weatherCanvas.appendChild(createEl('snow-flake', {
        left: `${Math.random() * 100}%`,
        top: `${-20 - Math.random() * 100}px`,
        fontSize: `${10 + Math.random() * 10}px`,
        animationDuration: `${6 + Math.random() * 6}s`,
        animationDelay: `${-Math.random() * 8}s`,
        opacity: String(0.45 + Math.random() * 0.4)
      }, symbols[i % symbols.length]));
    }
  }

  if (scene === 'fog') {
    const fogs = mobile ? 2 : 3;
    for (let i = 0; i < fogs; i++) {
      weatherCanvas.appendChild(createEl('fog-layer', {
        top: `${20 + i * 18}%`,
        left: `${-30 - i * 12}%`,
        animationDuration: `${18 + Math.random() * 10}s`,
        animationDelay: `${-Math.random() * 6}s`
      }));
    }
  }

  if (scene === 'night') {
    const stars = reducedMotion ? (mobile ? 18 : 28) : (mobile ? 35 : 65);
    for (let i = 0; i < stars; i++) {
      weatherCanvas.appendChild(createEl('star', {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 55}%`,
        animationDuration: `${1.8 + Math.random() * 3.5}s`,
        animationDelay: `${-Math.random() * 4}s`,
        transform: `scale(${0.7 + Math.random() * 1.4})`
      }));
    }
  }

  if (scene === 'thunder') {
    const flashes = createEl('lightning');
    flashes.style.animationDuration = `${6 + Math.random() * 4}s`;
    weatherCanvas.appendChild(flashes);
  }
}

window.addEventListener('resize', () => {
  if (typeof currentScene !== 'undefined' && currentScene) {
    setWeatherScene(lastWeatherCode);
  }
});

let lastWeatherCode = null;
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
lastWeatherCode = cur.weathercode;
document.body.style.background = getBg(cur.weathercode);
setWeatherEffect(cur.weathercode);
setWeatherScene(cur.weathercode);
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
const canvas = document.getElementById('weather-bg');
const ctx = canvas.getContext('2d');

let W,H;
let particles = [];
let weatherType = 'clear';

function resizeCanvas(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeCanvas();

window.addEventListener('resize', resizeCanvas);

function setWeatherEffect(code){

  if(code === 0){
    weatherType = 'clear';
  }
  else if(code <= 3){
    weatherType = 'clouds';
  }
  else if(code <= 48){
    weatherType = 'fog';
  }
  else if(code <= 65 || code <= 82){
    weatherType = 'rain';
  }
  else if(code <= 75){
    weatherType = 'snow';
  }
  else{
    weatherType = 'storm';
  }

  generateParticles();
}

function generateParticles(){

  particles = [];

  if(weatherType === 'rain'){
    for(let i=0;i<160;i++){
      particles.push({
        x:Math.random()*W,
        y:Math.random()*H,
        l:10+Math.random()*25,
        s:8+Math.random()*10
      });
    }
  }

  if(weatherType === 'snow'){
    for(let i=0;i<120;i++){
      particles.push({
        x:Math.random()*W,
        y:Math.random()*H,
        r:1+Math.random()*4,
        s:0.5+Math.random()*2
      });
    }
  }

  if(weatherType === 'clouds'){
    for(let i=0;i<20;i++){
      particles.push({
        x:Math.random()*W,
        y:Math.random()*H*0.5,
        r:80+Math.random()*120,
        s:0.1+Math.random()*0.3
      });
    }
  }

  if(weatherType === 'fog'){
    for(let i=0;i<12;i++){
      particles.push({
        x:Math.random()*W,
        y:Math.random()*H,
        r:200+Math.random()*300,
        s:0.2+Math.random()*0.4
      });
    }
  }
}

function animate(){

  ctx.clearRect(0,0,W,H);

  if(weatherType === 'clear'){

    const g = ctx.createRadialGradient(
      W*0.8,H*0.2,50,
      W*0.8,H*0.2,300
    );

    g.addColorStop(0,'rgba(255,220,120,0.35)');
    g.addColorStop(1,'rgba(255,220,120,0)');

    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  if(weatherType === 'rain'){

    ctx.strokeStyle='rgba(180,220,255,0.5)';
    ctx.lineWidth=1.2;

    particles.forEach(p=>{

      ctx.beginPath();
      ctx.moveTo(p.x,p.y);
      ctx.lineTo(p.x-2,p.y+p.l);
      ctx.stroke();

      p.y += p.s;

      if(p.y>H){
        p.y=-20;
        p.x=Math.random()*W;
      }
    });
  }

  if(weatherType === 'snow'){

    ctx.fillStyle='rgba(255,255,255,0.8)';

    particles.forEach(p=>{

      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();

      p.y += p.s;
      p.x += Math.sin(p.y*0.01);

      if(p.y>H){
        p.y=-10;
        p.x=Math.random()*W;
      }
    });
  }

  if(weatherType === 'clouds'){

    particles.forEach(p=>{

      const g = ctx.createRadialGradient(
        p.x,p.y,10,
        p.x,p.y,p.r
      );

      g.addColorStop(0,'rgba(255,255,255,0.08)');
      g.addColorStop(1,'rgba(255,255,255,0)');

      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();

      p.x += p.s;

      if(p.x-p.r>W){
        p.x=-p.r;
      }
    });
  }

  if(weatherType === 'fog'){

    particles.forEach(p=>{

      const g = ctx.createRadialGradient(
        p.x,p.y,20,
        p.x,p.y,p.r
      );

      g.addColorStop(0,'rgba(255,255,255,0.06)');
      g.addColorStop(1,'rgba(255,255,255,0)');

      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();

      p.x += p.s;

      if(p.x-p.r>W){
        p.x=-p.r;
      }
    });
  }

  if(weatherType === 'storm'){

    if(Math.random()<0.01){

      ctx.fillStyle='rgba(255,255,255,0.08)';
      ctx.fillRect(0,0,W,H);
    }
  }

  requestAnimationFrame(animate);
}

animate();